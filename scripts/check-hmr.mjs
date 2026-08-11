#!/usr/bin/env node
/**
 * check-hmr.mjs — every project declares the HMR path the proxy expects.
 *
 * The single-port dev proxy routes WebSocket upgrades by `server.hmr.path`,
 * which each project sets in its own `astro.config.mjs`. Two files therefore
 * have to agree, in four projects, about one string each — which is the exact
 * arrangement that has produced every drift bug in this repo.
 *
 * WHAT MAKES THIS ONE WORTH A GUARD is how it fails. A mismatched path does not
 * error: the socket is routed to the wrong project, Vite 7 rejects it on its
 * per-server token, and that project simply stops hot-reloading. Nothing
 * appears in the terminal. You get one line in a browser console, in one of
 * four projects, and the natural conclusion is "HMR is flaky" rather than "a
 * string is wrong". A guard is cheap; that afternoon is not.
 *
 *     node scripts/check-hmr.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS, hmrPathOf } from './projects.mjs';

const problems = [];

for (const p of PROJECTS) {
	const configPath = join(p.dir, 'astro.config.mjs');
	if (!existsSync(configPath)) {
		problems.push(`${p.label}: no astro.config.mjs at ${configPath}`);
		continue;
	}
	const src = readFileSync(configPath, 'utf8');
	const expected = hmrPathOf(p);

	// Deliberately narrow: find the declared hmr path, whatever it is, so a
	// WRONG value is reported as wrong rather than as missing.
	const match = src.match(/hmr:\s*\{[^}]*\bpath:\s*['"]([^'"]+)['"]/);
	if (!match) {
		problems.push(
			`${p.label}: no \`server: { hmr: { path } }\` in astro.config.mjs — expected '${expected}'`
		);
	} else if (match[1] !== expected) {
		problems.push(`${p.label}: hmr.path is '${match[1]}' but the proxy routes '${expected}'`);
	}
}

// Two projects sharing a path is the failure this whole mechanism exists to
// prevent, so assert uniqueness rather than assuming hmrPathOf stays injective.
const seen = new Map();
for (const p of PROJECTS) {
	const path = hmrPathOf(p);
	if (seen.has(path)) problems.push(`${p.label} and ${seen.get(path)} share the HMR path '${path}'`);
	seen.set(path, p.label);
}

if (problems.length) {
	console.error(`\n✗ HMR routing would break:\n`);
	for (const line of problems) console.error(`    ${line}`);
	console.error(`\n  The symptom is silent: that project stops hot-reloading, with no`);
	console.error(`  terminal output. Fix astro.config.mjs, or hmrPathOf() in`);
	console.error(`  scripts/projects.mjs if the path is meant to change.\n`);
	process.exit(1);
}

console.log(
	`✓ HMR paths unique and consistent across ${PROJECTS.length} projects ` +
		`(${PROJECTS.map((p) => hmrPathOf(p)).join(', ')}).`
);
