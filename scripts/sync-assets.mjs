#!/usr/bin/env node
/**
 * sync-assets.mjs — fan `global-assets/` out into the projects that need copies.
 *
 * `global-assets/` is THE assets directory for this ecosystem. Most of what
 * lives there needs no copying at all: anything the build imports or `url()`s
 * is referenced straight out of it by relative path, Vite hashes it into that
 * project's `_astro/`, and there is exactly one file on disk.
 *
 * TWO KINDS OF ASSET CANNOT WORK THAT WAY, which is the whole reason this
 * script exists:
 *
 *   1. `public/` is copied verbatim into the build output and cannot be
 *      aliased, imported or resolved through Vite. A file served at a stable,
 *      un-hashed URL has to physically sit in each project's own `public/`.
 *      `favicon.svg` is that case.
 *   2. Fonts are declared by `@font-face` with a literal URL and preloaded by a
 *      hardcoded `<link>`, both of which need the un-hashed `public/` path for
 *      the same reason. They are also registered PER DOCUMENT, so a face cached
 *      from a course page is unusable on a hub page that never declares it —
 *      every project needs its own copy of the bytes.
 *
 * So these are generated copies, and this script is what makes them true.
 * WHAT IS NOT SYNCED: `og-default.png` / `og-default.svg` are deliberately
 * per-project — the social card carries the course's own name, so the four
 * copies genuinely differ and must not be unified.
 *
 * UPSTREAM. The eight latin font faces originate in `@fontsource-variable/*`.
 * Each course still has `npm run fonts:sync` to refresh its own copy from
 * node_modules; `--refresh` does that once, into `global-assets/fonts/`, so the
 * canonical copy is the one that tracks upstream and the rest follow it.
 *
 *     node scripts/sync-assets.mjs             # fan out to every project
 *     node scripts/sync-assets.mjs --refresh   # re-pull fonts from Fontsource first
 *     node scripts/sync-assets.mjs --check     # verify without writing (CI)
 */
import { copyFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS } from './projects.mjs';

const SOURCE = 'global-assets';
const FONTS = join(SOURCE, 'fonts');
const refresh = process.argv.includes('--refresh');
const checkOnly = process.argv.includes('--check');

/** Files copied verbatim into every project's public/. */
const PUBLIC_FILES = ['favicon.svg'];

/** Where the font faces come from upstream, and what they are called. */
const FONT_FAMILIES = [
	['inter', 'inter'],
	['crimson-pro', 'crimson-pro'],
	['source-serif-4', 'source-serif-4'],
	['jetbrains-mono', 'jetbrains-mono'],
];

const problems = [];
let copied = 0;

/** Copy only when the bytes differ, so --check can report drift honestly. */
function sync(from, to, label) {
	if (!existsSync(from)) {
		problems.push(`missing source: ${from}`);
		return;
	}
	const same =
		existsSync(to) && Buffer.compare(readFileSync(from), readFileSync(to)) === 0;
	if (same) return;
	if (checkOnly) {
		problems.push(`out of date: ${to}  (differs from ${from})`);
		return;
	}
	mkdirSync(join(to, '..'), { recursive: true });
	copyFileSync(from, to);
	copied++;
	console.log(`  ${label}`);
}

// ---- optionally re-pull the canonical fonts from Fontsource ----------------
if (refresh) {
	// Any project with the dependency will do; they install the same versions.
	const donor = PROJECTS.map((p) => p.dir).find((d) =>
		existsSync(join(d, 'node_modules', '@fontsource-variable', 'inter'))
	);
	if (!donor) {
		problems.push(
			'--refresh: no project has @fontsource-variable installed. Run npm run install:all first.'
		);
	} else {
		mkdirSync(FONTS, { recursive: true });
		for (const [pkg, file] of FONT_FAMILIES) {
			for (const style of ['normal', 'italic']) {
				const name = `${file}-latin-wght-${style}.woff2`;
				sync(
					join(donor, 'node_modules', '@fontsource-variable', pkg, 'files', name),
					join(FONTS, name),
					`fonts/${name}  <- ${donor}`
				);
			}
		}
	}
}

// ---- fan out ---------------------------------------------------------------
const fontFiles = existsSync(FONTS) ? readdirSync(FONTS).filter((f) => f.endsWith('.woff2')) : [];
if (fontFiles.length === 0) problems.push(`no fonts in ${FONTS} — run with --refresh`);

for (const p of PROJECTS) {
	for (const f of PUBLIC_FILES) {
		sync(join(SOURCE, f), join(p.dir, 'public', f), `${p.dir}/public/${f}`);
	}
	for (const f of fontFiles) {
		sync(join(FONTS, f), join(p.dir, 'public', 'fonts', f), `${p.dir}/public/fonts/${f}`);
	}
}

if (problems.length) {
	console.error(`\n✗ ${checkOnly ? 'Assets are out of date' : 'Asset sync had problems'}:\n`);
	for (const line of problems) console.error(`    ${line}`);
	if (checkOnly) console.error(`\n  Fix with:  npm run assets:sync\n`);
	process.exit(1);
}

console.log(
	checkOnly
		? `✓ Every project's public/ matches ${SOURCE}/ (${PUBLIC_FILES.length} file(s) + ${fontFiles.length} fonts x ${PROJECTS.length} projects).`
		: `✓ Synced ${SOURCE}/ into ${PROJECTS.length} projects — ${copied} file(s) written, the rest already matched.`
);
