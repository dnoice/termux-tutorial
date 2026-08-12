/**
 * Curriculum drift guard.
 *
 * The course order lives in FOUR hand-maintained places, and nothing used to
 * compare them:
 *   1. `sidebar` in astro.config.mjs   — drives the menu AND Starlight's
 *                                        prev/next chain (the learner's rail)
 *   2. `LESSONS` in src/lib/progress.ts — drives the progress totals shown on the dashboard
 *   3. the .mdx files themselves       — must actually exist
 *   4. `<LessonComplete slug="…">`     — must match a LESSONS slug exactly
 *
 * They have already drifted twice in one day: a lesson reached the sidebar but
 * not LESSONS (so it was navigable but uncountable), and two lessons chained
 * themselves through frontmatter because the sidebar did not know them.
 *
 * It additionally guards the four frontmatter facts that decide the learner's
 * RAIL, none of which the four-way comparison above can see:
 *   5. `next: false` — must be carried by the LAST lesson and nothing else.
 *      `extra-keys` once held it as a placeholder, which silently truncated the
 *      course one lesson short of its terminus with a green build.
 *   6. utility pages — must carry BOTH `prev: false` and `next: false`, or they
 *      re-enter the chain and the course ends on Troubleshooting again.
 *   7. `index.mdx`'s hero action and explicit `next` — must both point at the
 *      first sidebar lesson. They disagreed once (hero → Why Termux, pagination
 *      → the progress dashboard), which was the flow audit's Critical finding.
 * Plus 8: the inert `sidebar.order` frontmatter must still ASCEND in sidebar
 * order, so switching a group to `autogenerate` later cannot reshuffle the
 * course.
 *
 * This script fails the build on any of those. Run via `npm run check:curriculum`,
 * which `npm run build` and CI both call.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const errors = [];
const fail = (msg) => errors.push(msg);

// ---- 1. slugs the sidebar lists (order matters: it is the learner's path) ---
const config = read('astro.config.mjs');
const sidebarBlock = config.slice(
	config.indexOf('sidebar: ['),
	config.indexOf('\n\t\t\t],', config.indexOf('sidebar: ['))
);
const sidebarSlugs = [...sidebarBlock.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);

// ---- 2. slugs LESSONS counts ------------------------------------------------
const progress = read('src/lib/progress.ts');
const lessonsBlock = progress.slice(
	progress.indexOf('export const LESSONS'),
	progress.indexOf('\n];', progress.indexOf('export const LESSONS'))
);
const lessonSlugs = [...lessonsBlock.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);

// Utility pages are deliberately in the sidebar but NOT in LESSONS: they are
// reachable, but they are not steps and must not inflate the progress total.
const UTILITY = new Set(['index', 'progress', 'reference/cheatsheet', 'reference/troubleshooting']);

// ---- 2b. schema.org `teaches` covers the curriculum -------------------------
//
// `teaches` in the Course JSON-LD is what the site advertises to search engines
// as the competencies it imparts. It is hand-written, it sits ~300 lines away
// from the sidebar it is supposed to track, and it has drifted twice: the
// beginner course once advertised five skills while teaching seven, and until
// 2026-08-11 listed eight against eleven lessons while a comment beside it
// claimed one entry per lesson.
//
// Nothing validated it, so this does. The rule is COVERAGE, not wording: one
// entry per lesson, so adding a lesson without describing it fails the build
// instead of quietly under-selling the course.
const teachesBlock = config.slice(
	config.indexOf('teaches: ['),
	config.indexOf('],', config.indexOf('teaches: ['))
);
const teachesCount = [...teachesBlock.matchAll(/^\s*'/gm)].length;
if (config.includes('teaches: [') && teachesCount !== lessonSlugs.length) {
	fail(
		`schema.org teaches[] has ${teachesCount} entries but LESSONS has ${lessonSlugs.length}. ` +
			`One entry per lesson, in sidebar order — add the missing description in astro.config.mjs.`
	);
}

// ---- 2c. SANDBOX_PATH names a page that exists ------------------------------
//
// SANDBOX_PATH is the one route that gets the COI service worker, which is what
// makes SharedArrayBuffer (and therefore LiveSandbox/CheerpX) work. It is a
// hand-written slug in astro.config.mjs, ~500 lines from the loader that reads
// it, and its failure is SILENT: the Boot button never leaves "needs a refresh",
// with a green build and nothing in the console.
//
// The advanced course shipped with course two's slug for exactly this reason.
// `null` is the correct value for a course with no sandbox and is allowed.
const sandboxDecl = /const SANDBOX_PATH = (null|`\$\{BASE_PATH\}\/([^`]*)`)/.exec(config);
if (sandboxDecl && sandboxDecl[2] !== undefined) {
	const slug = sandboxDecl[2].replace(/\/$/, '');
	const exists = ['mdx', 'md'].some((ext) =>
		existsSync(join(root, 'src/content/docs', `${slug}.${ext}`))
	);
	if (!exists) {
		fail(
			`SANDBOX_PATH points at "${slug}", which has no content file. ` +
				`The COI worker would never register and LiveSandbox would never boot. ` +
				`Point it at a real lesson, or set it to null if this course has no sandbox.`
		);
	}
}

// ---- 3. every referenced slug resolves to a real content file ---------------
for (const slug of sidebarSlugs) {
	if (slug === 'index') continue;
	const hit = ['mdx', 'md'].some((ext) => existsSync(join(root, 'src/content/docs', `${slug}.${ext}`)));
	if (!hit) fail(`sidebar lists "${slug}" but src/content/docs/${slug}.(mdx|md) does not exist`);
}

// ---- 4. sidebar lessons and LESSONS agree, in the same order ----------------
const sidebarLessons = sidebarSlugs.filter((s) => !UTILITY.has(s));
const missingFromLessons = sidebarLessons.filter((s) => !lessonSlugs.includes(s));
const missingFromSidebar = lessonSlugs.filter((s) => !sidebarSlugs.includes(s));

for (const s of missingFromLessons)
	fail(`"${s}" is in the sidebar but missing from LESSONS — navigable but never counted toward progress`);
for (const s of missingFromSidebar)
	fail(`"${s}" is in LESSONS but missing from the sidebar — counted toward progress but unreachable`);

if (!missingFromLessons.length && !missingFromSidebar.length) {
	const a = sidebarLessons.join(' > ');
	const b = lessonSlugs.join(' > ');
	if (a !== b) fail(`sidebar and LESSONS contain the same lessons in DIFFERENT order:\n    sidebar: ${a}\n    LESSONS: ${b}`);
}

// ---- 5. every <LessonComplete slug="…"> matches a LESSONS slug --------------
for (const slug of lessonSlugs) {
	for (const ext of ['mdx', 'md']) {
		const file = join(root, 'src/content/docs', `${slug}.${ext}`);
		if (!existsSync(file)) continue;
		const src = readFileSync(file, 'utf8');
		const m = src.match(/<LessonComplete[^>]*slug="([^"]+)"/);
		if (!m) fail(`${slug}.${ext} is a LESSONS entry but has no <LessonComplete slug="…"> — the learner cannot mark it done`);
		else if (m[1] !== slug) fail(`${slug}.${ext} has <LessonComplete slug="${m[1]}"> but its LESSONS slug is "${slug}"`);
	}
}

/* ---- frontmatter helpers ---------------------------------------------------
 * Deliberately regex, not a YAML dependency. It only ever asks a handful of
 * yes/no questions about frontmatter, and staying dependency-free means this
 * guard can be run on a bare checkout — `node scripts/check-curriculum.mjs`,
 * no install — which is how you check a curriculum edit without a full build.
 *
 * (It does NOT run before `npm ci` in CI: the workflow installs each project
 * before building it. The only genuinely pre-install step is the root's
 * check-hmr.mjs, which carries that rationale legitimately.)
 */
/** @returns {{ path: string, fm: string } | null} */
function contentFile(slug) {
	for (const ext of ['mdx', 'md']) {
		const rel = `src/content/docs/${slug}.${ext}`;
		if (!existsSync(join(root, rel))) continue;
		const src = read(rel);
		const end = src.indexOf('\n---', 4);
		return { path: rel, fm: end === -1 ? '' : src.slice(4, end) };
	}
	return null;
}
/** `key: false` at the top level of the frontmatter. */
const isFalse = (fm, key) => new RegExp(`^${key}:[ \\t]*false[ \\t]*$`, 'm').test(fm);
/** The single `order:` under `sidebar:`. Absent (splash pages) returns null. */
const orderOf = (fm) => {
	const m = fm.match(/^[ \t]+order:[ \t]*(\d+)[ \t]*$/m);
	return m ? Number(m[1]) : null;
};
/** Normalises a frontmatter link to a bare slug: `start/why-termux/` → `start/why-termux`. */
const toSlug = (link) => link.replace(/^\.?\/*/, '').replace(/\/+$/, '');

// ---- 6. exactly one terminus, and it is the last lesson ---------------------
const terminators = lessonSlugs.filter((s) => {
	const f = contentFile(s);
	return f && isFalse(f.fm, 'next');
});
const lastLesson = lessonSlugs[lessonSlugs.length - 1];
for (const s of terminators)
	if (s !== lastLesson)
		fail(`${s} sets "next: false" but is not the last lesson — the chain dead-ends before ${lastLesson}`);
if (!terminators.includes(lastLesson))
	fail(`${lastLesson} is the last lesson but does not set "next: false" — the chain runs on into the reference pages`);

// ---- 7. utility pages stay out of the chain in BOTH directions --------------
for (const slug of UTILITY) {
	if (slug === 'index') continue; // the splash page IS step zero; it needs a `next`
	const f = contentFile(slug);
	if (!f) continue;
	for (const key of ['prev', 'next'])
		if (!isFalse(f.fm, key))
			fail(`${f.path} is a utility page but does not set "${key}: false" — it re-enters the learner's prev/next chain`);
}

// ---- 8. the landing page's two forward affordances agree with lesson one ----
const indexFm = contentFile('index')?.fm ?? '';
const firstLesson = sidebarLessons[0];
const heroLink = indexFm.match(/^[ \t]+link:[ \t]*(\S+)[ \t]*$/m)?.[1];
const nextLink = indexFm.slice(indexFm.search(/^next:[ \t]*$/m)).match(/^[ \t]+link:[ \t]*(\S+)[ \t]*$/m)?.[1];
for (const [what, link] of [['hero action', heroLink], ['next.link', nextLink]]) {
	if (!link) fail(`index.mdx has no ${what} — the landing page must point explicitly at lesson one (${firstLesson})`);
	else if (toSlug(link) !== firstLesson)
		fail(`index.mdx's ${what} points at "${toSlug(link)}" but lesson one is "${firstLesson}"`);
	else if (link.startsWith('/'))
		fail(`index.mdx's ${what} is root-relative ("${link}") — Starlight does not base-prefix frontmatter links, so it 404s on GitHub Pages. Drop the leading slash.`);
}

// ---- 9. the inert sidebar.order values still ascend, per group --------------
// They are not read while groups use explicit `items` arrays, which is exactly
// why they rot. Keeping them ordered makes a later switch to `autogenerate` a
// no-op instead of a silent reshuffle of the course.
for (const group of sidebarBlock.split(/items:\s*\[/).slice(1)) {
	const slugs = [...group.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
	let prevOrder = -Infinity;
	let prevSlug = null;
	for (const slug of slugs) {
		const f = contentFile(slug);
		if (!f) continue;
		const order = orderOf(f.fm);
		if (order === null) continue;
		if (order <= prevOrder)
			fail(`sidebar.order in ${f.path} is ${order}, but "${prevSlug}" before it is ${prevOrder} — frontmatter order contradicts the sidebar array`);
		prevOrder = order;
		prevSlug = slug;
	}
}

// ---- report ----------------------------------------------------------------
if (errors.length) {
	console.error(`\n✗ Curriculum drift detected (${errors.length}):\n`);
	for (const e of errors) console.error(`  • ${e}`);
	console.error('\nThe course order lives in astro.config.mjs (sidebar) and');
	console.error('src/lib/progress.ts (LESSONS). Both must agree.\n');
	process.exit(1);
}
console.log(`✓ Curriculum consistent — ${lessonSlugs.length} lessons, sidebar and LESSONS agree.`);
