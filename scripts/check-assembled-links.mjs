#!/usr/bin/env node
/**
 * check-assembled-links.mjs — the guard that only exists after assembly.
 *
 * WHY THIS FILE EXISTS AT THE MONOREPO ROOT.
 *
 * Every project here ships its own `scripts/check-links.mjs`, and each one is
 * blind in the same way: it walks its OWN `dist/` and cannot see a sibling. A
 * link from the advanced course to a beginner lesson is correct in production
 * and unresolvable at course-build time, so the per-course checkers DEFER it —
 * and this resolves it. Deferred is not skipped.
 *
 * Worth knowing before you weaken either half: when the per-course checkers
 * REJECTED deep sibling links instead of deferring them, an author concluded
 * cross-course linking was unsupported and wrote around it, naming sibling
 * courses in prose rather than linking them. A guard that cannot express the
 * correct thing teaches people to avoid it.
 *
 * The only tree in which a cross-course link is checkable is the assembled one:
 *
 *     _site/               the hub          (base /termux-tutorial)
 *     _site/beginner/      course one
 *     _site/intermediate/  course two
 *     _site/advanced/      course three
 *
 * It walks the whole tree and reports the totals it counted, so no figure in
 * this file can go stale.
 *
 * Run it locally after assembling:  node scripts/check-assembled-links.mjs _site
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { COURSES, SERIES_BASE } from './projects.mjs';

const ROOT = resolve(process.argv[2] ?? '_site');
const BASE = SERIES_BASE;
/** Slot names, from the manifest — never a second hand-written list. */
const SLOTS = COURSES.map((c) => c.slot);

if (!existsSync(ROOT)) {
	console.error(`✗ No assembled tree at ${ROOT}. Build and assemble first.`);
	process.exit(1);
}

/** Every .html file in the assembled tree. */
function walk(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else if (entry.endsWith('.html')) out.push(full);
	}
	return out;
}

const pages = walk(ROOT);
if (pages.length === 0) {
	console.error(`✗ ${ROOT} contains no HTML. Did assembly run?`);
	process.exit(1);
}

/**
 * Does a site-absolute path (already stripped of BASE) exist in the tree?
 * Directory-format output means `/beginner/start/` is `beginner/start/index.html`.
 */
const targetExists = (rel) => {
	const clean = rel.replace(/^\//, '').replace(/\/$/, '');
	if (!clean) return existsSync(join(ROOT, 'index.html'));
	return (
		existsSync(join(ROOT, clean)) || existsSync(join(ROOT, `${clean}/index.html`))
	);
};

/** Collect the `id` attributes on a page, for #fragment checking. */
const idsOf = (html) =>
	new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

const broken = [];
const unprefixed = [];
/** Cross-boundary links: the ones no per-project checker could ever see. */
let crossCount = 0;
let checked = 0;

for (const file of pages) {
	const html = readFileSync(file, 'utf8');
	/** Which slot this page lives in — '' for the hub, else 'beginner' etc. */
	const slot = relative(ROOT, dirname(file)).split(/[\\/]/)[0] ?? '';
	const owner = SLOTS.includes(slot) ? slot : '';

	for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
		const url = m[1];
		if (url === '' || /^(?:https?:|mailto:|tel:|data:|wss?:|#|javascript:)/i.test(url)) continue;
		const [pathPart, hash] = url.split('#');
		if (!pathPart || !pathPart.startsWith('/')) continue; // relative links resolve within a course
		if (pathPart.startsWith('//')) continue; // protocol-relative

		checked++;

		// A root-relative internal link MUST carry the series base. Missing it is
		// the classic "200 in dev, 404 on Pages" failure.
		if (pathPart !== BASE && !pathPart.startsWith(`${BASE}/`)) {
			unprefixed.push(`${relative(ROOT, file)}  ->  ${url}`);
			continue;
		}

		const rel = pathPart.slice(BASE.length) || '/';
		// Which slot does this link point INTO?
		const targetSlot = rel.replace(/^\//, '').split('/')[0] ?? '';
		const targetOwner = SLOTS.includes(targetSlot) ? targetSlot : '';
		if (targetOwner !== owner) crossCount++;

		if (!targetExists(rel)) {
			broken.push(`${relative(ROOT, file)}  ->  ${url}`);
			continue;
		}

		// Fragments, but only for targets we can actually open.
		if (hash) {
			const clean = rel.replace(/^\//, '').replace(/\/$/, '');
			const targetFile = existsSync(join(ROOT, clean)) && statSync(join(ROOT, clean)).isFile()
				? join(ROOT, clean)
				: join(ROOT, clean, 'index.html');
			if (existsSync(targetFile) && !idsOf(readFileSync(targetFile, 'utf8')).has(hash)) {
				broken.push(`${relative(ROOT, file)}  ->  ${url}   (no #${hash} on that page)`);
			}
		}
	}
}

const fail = broken.length || unprefixed.length;

if (unprefixed.length) {
	console.error(`\n✗ Root-relative links missing the ${BASE} prefix (${unprefixed.length}):`);
	for (const u of unprefixed) console.error(`    ${u}`);
}
if (broken.length) {
	console.error(`\n✗ Internal links resolving to nothing in the assembled tree (${broken.length}):`);
	for (const b of broken) console.error(`    ${b}`);
}

if (!fail) {
	console.log(
		`✓ Assembled site: ${pages.length} pages, ${checked} internal links, ` +
			`${crossCount} of them crossing a course boundary — 0 broken, 0 unprefixed.`
	);
}

process.exit(fail ? 1 : 0);
