/**
 * Built-site link check. Runs as the third step of `npm run build`, after
 * `astro build`, so a dead internal link fails the build.
 *
 * Two failure modes this catches, both of which are green in dev and 404 on
 * GitHub Pages (CLAUDE.md gotcha #2):
 *   1. an internal link that resolves to no file in dist/
 *   2. a root-relative internal link that never got the `base` prefix, because
 *      it was written as a raw <a href> in MDX or in frontmatter, where
 *      rehypeBasePaths / Starlight cannot reach it
 * Fragments are checked against the target page's real `id` attributes.
 *
 * Run after a build:  node scripts/check-links.mjs
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(root, 'dist');
/*
 * Must match `base` in astro.config.mjs — and it is resolved the SAME way here
 * (`process.env.BASE ?? <literal>`) rather than as a bare constant, deliberately.
 *
 * This repo was created by copying the beginner course's shell, and this line
 * came across still reading '/termux-tutorial'. Every emitted link correctly
 * carried '/termux-tutorial-intermediate', so the guard reported 323 links
 * "missing the base prefix" and failed the build — the checker was wrong, not
 * the site. Reading the env var the way astro.config.mjs does also keeps
 * `BASE=/preview npm run build` honest instead of failing 323 times.
 */
const BASE = (process.env.BASE ?? '/termux-tutorial/intermediate').replace(/\/$/, '');

const files = [];
(function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		entry.isDirectory() ? walk(full) : files.push(full);
	}
})(DIST);

const pages = files.filter((f) => f.endsWith('.html'));
const idsOf = new Map();
for (const f of pages)
	idsOf.set(f, new Set([...readFileSync(f, 'utf8').matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])));

const toUrl = (p) => '/' + relative(DIST, p).split(sep).join('/');
/*
 * Paths that exist in the PUBLISHED site but not in this course's own dist/.
 * All courses live in one repo and deploy as ONE Pages site, assembled by
 * .github/workflows/deploy.yml:
 *
 *     /termux-tutorial/               the hub
 *     /termux-tutorial/beginner/      this kind of course
 *     /termux-tutorial/intermediate/
 *     /termux-tutorial/advanced/
 *
 * So a link to the hub or a sibling course is correct and resolvable in
 * production while being genuinely absent from the tree this script can see —
 * AND it sits outside this course's own `base`, which is why the check has to
 * happen BEFORE the base-prefix test rather than after it. Ordering it the
 * other way reported every sibling link as "missing the base prefix", which is
 * the opposite of true: they are correctly prefixed for the SERIES, not for
 * this course.
 *
 * Listed explicitly rather than pattern-matched, so a typo in a sibling link is
 * still caught — the whole point of the guard. Add a course when it starts
 * being assembled into the site and not before: an entry for a course that is
 * not deployed yet turns a real 404 into a silent pass.
 */
/** The series root: this course's base minus its own last segment. */
const SERIES_ROOT = BASE.replace(/\/[^/]+$/, '') || '';
/** This course's own segment, e.g. `advanced`. */
const OWN_SEGMENT = BASE.slice(SERIES_ROOT.length).replace(/\//g, '');
/**
 * Course segments that are assembled into the published site. Listed
 * EXPLICITLY, so a typo in the course segment (`/intermidiate/…`) is still
 * caught here rather than deferred and forgotten. Add a course when it starts
 * being assembled and not before.
 */
const COURSE_SEGMENTS = ['beginner', 'intermediate', 'advanced'];
/**
 * WAS: an exact-match set of the four course ROOTS, which allowed
 * `/termux-tutorial/beginner/` and rejected `/termux-tutorial/beginner/start/`
 * — i.e. it permitted only the least useful cross-course link there is.
 *
 * The cost was real and invisible: the author of `container/why-proot` hit this,
 * concluded deep cross-course links were unsupported, and wrote around it by
 * naming the sibling courses in prose instead of linking to them. A guard that
 * cannot express the correct thing teaches authors to avoid it.
 *
 * Deep links into a sibling are now allowed and DEFERRED — they are genuinely
 * unresolvable from this course's dist/, and they are checked for real by
 * `scripts/check-assembled-links.mjs` at the monorepo root, which walks the
 * assembled tree where every course exists at once. Deferred is not skipped.
 */
const SIBLING_PREFIXES = COURSE_SEGMENTS.filter((s) => s !== OWN_SEGMENT).map(
	(s) => `${SERIES_ROOT}/${s}/`
);
/** Hub pages, which live directly under the series root rather than a course. */
const HUB_PAGES = new Set([`${SERIES_ROOT}/`, `${SERIES_ROOT}/profile/`]);
const deferred = [];
const isCrossCourse = (p) =>
	HUB_PAGES.has(p) || SIBLING_PREFIXES.some((pre) => p.startsWith(pre));
const broken = [];
const unprefixed = [];

for (const file of pages) {
	const src = readFileSync(file, 'utf8');
	const pageDir = toUrl(dirname(file));
	for (const m of src.matchAll(/(?:href|src)="([^"]+)"/g)) {
		const url = m[1];
		if (url === '' || /^(?:https?:|mailto:|data:|wss?:|#|javascript:)/i.test(url)) continue;
		const [pathPart, hash] = url.split('#');
		if (!pathPart) continue;

		let abs;
		if (pathPart.startsWith('/')) {
			// The hub and sibling courses live outside this course's base but
			// inside the series — correct in production, absent from this dist/.
			// Checked for real by scripts/check-assembled-links.mjs after assembly.
			if (isCrossCourse(pathPart)) {
				deferred.push(`${toUrl(file)}  ->  ${url}`);
				continue;
			}

			if (pathPart !== BASE && !pathPart.startsWith(BASE + '/')) {
				unprefixed.push(`${toUrl(file)}  ->  ${url}`);
				continue;
			}
			abs = pathPart.slice(BASE.length) || '/';
		} else {
			abs = posix.resolve(pageDir === '/' ? '/' : pageDir, pathPart);
		}

		const target = [join(DIST, abs), join(DIST, abs, 'index.html')].find(
			(c) => existsSync(c) && statSync(c).isFile()
		);
		if (!target) broken.push(`${toUrl(file)}  ->  ${url}`);
		else if (hash && target.endsWith('.html') && !idsOf.get(target)?.has(decodeURIComponent(hash)))
			broken.push(`${toUrl(file)}  ->  ${url}   (target has no id="${hash}")`);
	}
}

const report = (label, list) => {
	console.log(`\n${list.length ? '✗' : '✓'} ${label}: ${list.length}`);
	for (const line of [...new Set(list)]) console.log('    ' + line);
};
console.log(`Scanned ${pages.length} built HTML pages.`);
report('Internal links that resolve to no file in dist/', broken);
report('Root-relative internal links missing the base prefix', unprefixed);
if (deferred.length) {
	console.log(
		`
→ Cross-course links deferred to the assembly check: ${new Set(deferred).size}`
	);
}
process.exit(broken.length + unprefixed.length ? 1 : 0);
