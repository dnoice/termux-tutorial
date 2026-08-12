#!/usr/bin/env node
/**
 * assemble.mjs — stitch the four built projects into the single tree Pages serves.
 *
 * GitHub Pages publishes exactly ONE artifact per repository, which is the
 * whole reason the courses cannot deploy themselves. Each builds independently
 * with its own `base`; this copies each `dist/` into its slot:
 *
 *     _site/                <- hub
 *     _site/beginner/       <- course one
 *     _site/intermediate/   <- course two
 *     _site/advanced/       <- course three
 *
 * The layout comes from `projects.mjs`, and this runs anywhere — which is the
 * point: assembly used to exist only inside CI, so the one arrangement in which
 * cross-course links resolve was the one nobody could reproduce before pushing.
 *
 *     node scripts/assemble.mjs
 *     node scripts/assemble.mjs --build     # build each project first
 */
import { rmSync, mkdirSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PROJECTS, baseOf } from './projects.mjs';

const OUT = process.env.OUT ?? '_site';
const shouldBuild = process.argv.includes('--build');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const countHtml = (dir) => {
	let n = 0;
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) n += countHtml(full);
		else if (entry.endsWith('.html')) n++;
	}
	return n;
};

if (shouldBuild) {
	for (const p of PROJECTS) {
		console.log(`\n  ── building ${p.label} ${'─'.repeat(Math.max(0, 44 - p.label.length))}`);
		const r = spawnSync(npmCmd, ['run', 'build'], {
			cwd: p.dir,
			stdio: 'inherit',
			windowsHide: true,
			shell: process.platform === 'win32',
		});
		if (r.status !== 0) {
			console.error(`\n✗ ${p.label} failed to build. Assembly aborted.`);
			process.exit(1);
		}
	}
	console.log('');
}

// Every project must have a dist/ before anything is copied — assembling half a
// site and reporting success is worse than refusing.
const missing = PROJECTS.filter((p) => !existsSync(join(p.dir, 'dist', 'index.html')));
if (missing.length) {
	console.error(`\n✗ No build output for: ${missing.map((p) => p.label).join(', ')}`);
	console.error(`  Run \`npm run build\` at the root, or \`node scripts/assemble.mjs --build\`.\n`);
	process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const p of PROJECTS) {
	const dest = p.slot ? join(OUT, p.slot) : OUT;
	mkdirSync(dest, { recursive: true });
	cpSync(join(p.dir, 'dist'), dest, { recursive: true });
	console.log(`  ${p.label.padEnd(13)} ${String(countHtml(dest)).padStart(3)} pages  ->  ${baseOf(p)}/`);
}

// The four front doors. Each is reachable from the hub's own markup, so a
// missing one is a broken link on the front page of the site.
for (const p of PROJECTS) {
	const front = p.slot ? join(OUT, p.slot, 'index.html') : join(OUT, 'index.html');
	if (!existsSync(front)) {
		console.error(`\n✗ MISSING after assembly: ${front}`);
		process.exit(1);
	}
}

console.log(`\n✓ Assembled ${countHtml(OUT)} pages into ${OUT}/\n`);
