#!/usr/bin/env node
/**
 * each.mjs — run one npm command in every project, in order.
 *
 * `npm install` and `npm run check` had to be run four times, by hand, in four
 * directories, and the failure mode was silence: forget one and you have a
 * course with stale dependencies or an untypechecked file, with nothing to tell
 * you which. The topology comes from `projects.mjs`, so adding a course does
 * not mean remembering this file exists.
 *
 *     node scripts/each.mjs install
 *     node scripts/each.mjs run check
 *
 * Runs sequentially and reports a summary rather than stopping at the first
 * failure — when three of four projects fail to typecheck you want all three
 * names, not the first one repeated across three re-runs.
 */
import { spawnSync } from 'node:child_process';
import { PROJECTS } from './projects.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
	console.error('Usage: node scripts/each.mjs <npm args…>   e.g. `run check`');
	process.exit(1);
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const failed = [];

for (const p of PROJECTS) {
	console.log(`\n  ── ${p.label}: npm ${args.join(' ')} ${'─'.repeat(Math.max(0, 34 - p.label.length))}`);
	const r = spawnSync(npmCmd, args, {
		cwd: p.dir,
		stdio: 'inherit',
		shell: process.platform === 'win32',
	});
	if (r.status !== 0) failed.push(p.label);
}

if (failed.length) {
	console.error(`\n✗ Failed in: ${failed.join(', ')}\n`);
	process.exit(1);
}
console.log(`\n✓ npm ${args.join(' ')} — clean in all ${PROJECTS.length} projects.\n`);
