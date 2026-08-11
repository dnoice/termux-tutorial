#!/usr/bin/env node
/**
 * preview.mjs — serve the ASSEMBLED site the way GitHub Pages will.
 *
 * WHY A SERVER OF OUR OWN. The four `astro dev` servers each serve one project
 * at one base, on its own port. That is fine for editing a lesson and useless
 * for the thing this series is actually built around: walking from the hub into
 * a course, using the series switcher, and coming back. Those links are
 * `/termux-tutorial/advanced/…` — absolute, and correct only when all four
 * projects sit in ONE tree under ONE origin. A dev server serves exactly one of
 * them, so every cross-course link 404s locally while being perfectly correct
 * in production. That gap is why cross-course navigation kept being verified by
 * reasoning rather than by clicking it.
 *
 * This mounts `_site/` at `/termux-tutorial`, which is what Pages does, so the
 * links in the built HTML are the links being served. No rewriting.
 *
 *   node scripts/preview.mjs            # assumes _site/ is already assembled
 *   PORT=4321 node scripts/preview.mjs
 *
 * It serves static files only — no live reload. Edit with `astro dev`; verify
 * assembly and cross-course links here.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, normalize } from 'node:path';
import { PROJECTS, SERIES_BASE, baseOf } from './projects.mjs';

const ROOT = resolve(process.argv[2] ?? '_site');
const BASE = SERIES_BASE;
/*
 * The same default port as `npm run dev`, deliberately: the URL you visit is
 * identical whether you are running the live dev proxy or previewing the built
 * artifact. Only one can hold the port at a time, and the EADDRINUSE handler
 * below says which.
 */
const PORT = Number(process.env.PORT ?? 4321);

if (!existsSync(ROOT)) {
	console.error(`✗ No assembled tree at ${ROOT}.`);
	console.error('  Build the four projects, then copy each dist/ into _site/.');
	process.exit(1);
}

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.txt': 'text/plain; charset=utf-8',
	'.xml': 'application/xml',
	'.webmanifest': 'application/manifest+json',
};

const server = createServer((req, res) => {
	const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
	let pathname = decodeURIComponent(url.pathname);

	// Anything outside the base is not part of this site. Send the visitor to
	// the front door rather than 404ing on a bare `/`, which is the URL a
	// browser opens by default and would otherwise look like a broken server.
	if (!pathname.startsWith(BASE)) {
		res.writeHead(302, { Location: `${BASE}/` });
		res.end();
		return;
	}

	let rel = pathname.slice(BASE.length) || '/';
	// Contain the path: `..` must not escape the served tree.
	const target = normalize(join(ROOT, rel));
	if (!target.startsWith(ROOT)) {
		res.writeHead(403).end('Forbidden');
		return;
	}

	const candidates = [];
	if (existsSync(target) && statSync(target).isFile()) candidates.push(target);
	candidates.push(join(target, 'index.html'));

	const file = candidates.find((c) => existsSync(c) && statSync(c).isFile());

	if (!file) {
		// Serve the real 404 page if the tree has one — that page is part of the
		// site and worth being able to look at.
		const notFound = join(ROOT, '404.html');
		const body = existsSync(notFound)
			? readFileSync(notFound)
			: `Not found: ${pathname}`;
		res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(body);
		return;
	}

	res.writeHead(200, {
		'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
		// No caching: this exists to look at changes you just rebuilt.
		'Cache-Control': 'no-store',
	});
	res.end(readFileSync(file));
});

/*
 * A dev server left running from an earlier session is the normal case here,
 * not the exception — Astro 7 daemonizes `astro dev`, so it survives the shell
 * that started it. Node's default for that is an unhandled 'error' event and a
 * ten-line stack trace whose actual content is one word.
 */
server.on('error', (err) => {
	if (err.code === 'EADDRINUSE') {
		console.error(`\n✗ Port ${PORT} is already in use.`);
		console.error(`  Something is listening there — likely a dev server from an`);
		console.error(`  earlier session (Astro 7 daemonizes; check \`astro dev status\`).`);
		console.error(`\n  Pick another:  PORT=${PORT + 100} node scripts/preview.mjs\n`);
		process.exit(1);
	}
	throw err;
});

server.listen(PORT, () => {
	console.log(`\n  ${'─'.repeat(58)}`);
	console.log(`  Termux Tutorial series — built artifact, as Pages will serve it`);
	console.log(`  ${'─'.repeat(58)}\n`);
	console.log(`    →  http://localhost:${PORT}${BASE}/\n`);
	for (const p of PROJECTS) {
		console.log(`    · ${p.label.padEnd(13)} http://localhost:${PORT}${baseOf(p)}/`);
	}
	console.log(`\n  No live reload — this is the built output. Use \`npm run dev\` to edit.\n`);
});
