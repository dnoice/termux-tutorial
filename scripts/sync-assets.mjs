#!/usr/bin/env node
/**
 * sync-assets.mjs — fan `global-assets/` out into the projects that need copies.
 *
 * `global-assets/` is THE assets directory for this ecosystem — the one place
 * you edit shared artwork.
 *
 * EVERY PROJECT GETS ITS OWN COPY, and this script is what keeps those copies
 * true. `global-assets/` is where you EDIT; the copies are generated.
 *
 * That is deliberate, and it was arrived at the hard way. Referencing the
 * canonical file directly across the project boundary — `url('../../../global-
 * assets/x.svg')` — builds perfectly: Vite resolves it, hashes it into that
 * project's `_astro/`, and rewrites the reference. It is broken in DEV. There
 * Vite serves an out-of-root file as `/@fs/<absolute path>`, a URL at the dev
 * server's ROOT rather than under the project's base — so behind the
 * single-port proxy it does not belong to any project, and it also leaks the
 * author's absolute filesystem path into the stylesheet. The build was verified
 * and the dev server was not, which is exactly how that shipped.
 *
 * Two more assets could never have worked that way regardless:
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

/**
 * Bundled artwork, copied into each project's src/assets/ so stylesheets and
 * imports can reach it with an IN-PROJECT relative path. See the header for why
 * the cross-boundary reference had to be abandoned.
 */
const SRC_ASSETS = ['linux_scatter_field_v3.svg', 'linux_scatter_field_v3_light.svg'];

/**
 * Only projects that actually mount a BootSplash need the elements artwork, and
 * the hub does not. Detected rather than listed, so it stays true by itself.
 */
const SPLASH_ASSET = 'termux_linux_elements.svg';
const hasSplash = (dir) => existsSync(join(dir, 'src', 'components', 'splash', 'BootSplash.astro'));

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
	for (const f of SRC_ASSETS) {
		sync(join(SOURCE, f), join(p.dir, 'src', 'assets', f), `${p.dir}/src/assets/${f}`);
	}
	if (hasSplash(p.dir)) {
		sync(
			join(SOURCE, SPLASH_ASSET),
			join(p.dir, 'src', 'assets', SPLASH_ASSET),
			`${p.dir}/src/assets/${SPLASH_ASSET}`
		);
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
		? `✓ Every project matches ${SOURCE}/ — public/ and src/assets/, ${fontFiles.length} fonts, ${PROJECTS.length} projects.`
		: `✓ Synced ${SOURCE}/ into ${PROJECTS.length} projects — ${copied} file(s) written, the rest already matched.`
);
