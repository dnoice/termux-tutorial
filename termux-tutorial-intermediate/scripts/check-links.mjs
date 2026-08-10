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
process.exit(broken.length + unprefixed.length ? 1 : 0);
