#!/usr/bin/env node
/**
 * dev.mjs — ONE command, ONE port, ONE URL, for the whole series.
 *
 * A reverse proxy on one port, routing by the SAME path prefixes GitHub Pages
 * uses. Each child dev server already serves at its own `base`, so paths pass
 * through untouched — no rewriting, and the URL in your address bar is
 * character-for-character the production URL. That matters because the series
 * switcher and every cross-course link are absolute paths into sibling projects
 * that do not exist in any single project's dev tree, so this is the only local
 * configuration in which they resolve at all.
 *
 * Why it is built this way, and the four failures that shaped it:
 * global-docs/decisions/2026-08-11-single-entry-point.md
 *
 *     localhost:4321/termux-tutorial/            -> hub          (:4331)
 *     localhost:4321/termux-tutorial/beginner/   -> beginner     (:4332)
 *     localhost:4321/termux-tutorial/advanced/   -> advanced     (:4334)
 *
 * WEBSOCKETS ARE PROXIED TOO, which is the part that makes this a dev server
 * rather than a preview: Vite's HMR client connects back to the origin that
 * served the page — this proxy — so without forwarding `upgrade` requests every
 * edit would need a manual refresh, and the whole thing would be a worse
 * `preview.mjs`.
 *
 * The four internal ports are an implementation detail. You never visit them.
 *
 *     npm run dev              # from the monorepo root
 *     PORT=8080 npm run dev
 */
import { createServer, request as httpRequest } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { connect } from 'node:net';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS, SERIES_BASE, baseOf, projectFor, hmrPathOf } from './projects.mjs';

const PORT = Number(process.env.PORT ?? 4321);
/*
 * `localhost`, NOT `127.0.0.1`.
 *
 * Astro's dev server binds the IPv6 loopback (`[::1]`) and, on this platform,
 * does not also bind `127.0.0.1`. Dialling the IPv4 literal therefore gets
 * ECONNREFUSED against a server that is up and answering — the ports show as
 * LISTENING in netstat while every request fails, which is a genuinely
 * confusing pair of symptoms. Resolving `localhost` lets Node try both
 * families (Happy Eyeballs), so this works whichever one Astro picked.
 */
const HOST = 'localhost';
/** How long to wait for a child dev server before giving up on it. */
const READY_TIMEOUT_MS = 90_000;

/**
 * Astro's real entry point, per project.
 *
 * NOT `npm run dev`. Going through npm on Windows needs `shell: true`, which
 * (a) emits a Node deprecation warning about unescaped concatenated arguments,
 * and (b) inserts npm.cmd and cmd.exe between us and the process we want to
 * supervise — so what we spawn is not what ends up listening. Running the .mjs
 * bin with our own `process.execPath` is one process, no shell, no quoting
 * rules, and identical on every platform.
 */
const astroBin = (project) => join(project.dir, 'node_modules', 'astro', 'bin', 'astro.mjs');

const children = [];
let shuttingDown = false;

/** Resolve once something is listening on `port`, or reject after a timeout. */
function waitForPort(port, timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	return new Promise((resolve, reject) => {
		const attempt = () => {
			const socket = connect(port, HOST);
			socket.once('connect', () => {
				socket.destroy();
				resolve();
			});
			socket.once('error', () => {
				socket.destroy();
				if (Date.now() > deadline) reject(new Error(`port ${port} never opened`));
				else setTimeout(attempt, 250);
			});
		};
		attempt();
	});
}

/**
 * Start one project's dev server.
 *
 * TWO MODES, AND BOTH MUST WORK. Astro runs `astro dev` in the foreground
 * normally and daemonizes it under a non-TTY or an AI-agent environment. In
 * background mode the spawned child EXITS while the server keeps running, so:
 *
 *   - readiness is decided by polling the PORT, never by watching the child;
 *   - shutdown asks Astro to stop rather than killing a pid we hold.
 *
 * Those are the only two forms that work in both modes.
 *
 * NO `--ignore-lock` — Astro rejects it in background mode, because the lock
 * file is how `astro dev stop` finds its own server. Stale locks are cleared by
 * the sweep before startup instead.
 *
 * `windowsHide: true` ON EVERY SPAWN IN THIS REPO, and it is not cosmetic.
 * Node defaults it to FALSE, so on Windows each child process pops a console
 * window over whatever the user is doing. `npm run dev` starts eight children
 * before it prints a URL — four `astro dev stop` sweeps, then four servers —
 * and four more on Ctrl-C, so the screen flickers with black rectangles every
 * time. stdio is unaffected: output still reaches the parent, only the window
 * is suppressed. Any spawn added to scripts/ needs it too.
 */
function startProject(project) {
	const child = spawn(
		process.execPath,
		['node_modules/astro/bin/astro.mjs', 'dev', '--port', String(project.port)],
		{ cwd: project.dir, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }
	);
	/*
	 * BUFFER EVERYTHING, PRINT ON FAILURE — quiet on success, complete on
	 * failure. Do not reduce this to a /error|failed/ filter: a filter cannot
	 * know in advance which line will turn out to be the one you needed, and
	 * the last one discarded the message that explained why all four projects
	 * refused to start, leaving only a 90-second timeout.
	 */
	const log = [];
	const keep = (buf) => {
		for (const line of String(buf).split('\n')) {
			const text = line.trimEnd();
			if (text.trim()) log.push(text);
		}
		if (log.length > 60) log.splice(0, log.length - 60);
	};
	child.stdout.on('data', keep);
	child.stderr.on('data', keep);
	children.push({ project, child, log });
	return { child, log };
}

/** Ask Astro to stop each background dev server it started. */
function stopAll() {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log('\n  Stopping dev servers…');
	for (const p of PROJECTS) {
		if (!existsSync(astroBin(p))) continue;
		try {
			spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', 'stop'], {
				cwd: p.dir,
				stdio: 'ignore',
				windowsHide: true,
				timeout: 15_000,
			});
		} catch {
			/* Best effort — a server that is already gone is the desired state. */
		}
	}
	for (const { child } of children) {
		try {
			child.kill();
		} catch {
			/* Already exited; daemonized children usually have. */
		}
	}
}

/* ── the proxy ─────────────────────────────────────────────────────────── */

const server = createServer((req, res) => {
	const pathname = (req.url ?? '/').split('?')[0];

	/*
	 * ROUTING A REQUEST THAT IS NOT UNDER THE SERIES BASE.
	 *
	 * In dev, Vite serves a number of routes from its OWN root rather than under
	 * the project's `base`: `/src/…` for source files a stylesheet references,
	 * `/@fs/…` for anything outside the project root, plus `/@id/` and
	 * `/node_modules/`. None of those carry a project prefix, so a plain
	 * "redirect anything unrecognised to the front door" rule silently ate them —
	 * and the visible symptom was that page backgrounds simply did not render,
	 * with a 302 where an SVG should have been. Nothing errored.
	 *
	 * The requesting page is the answer: its Referer tells us which project asked,
	 * so the sub-resource goes back to the same upstream. Only a request with no
	 * usable Referer — someone typing a bare address — gets the front door.
	 *
	 * This is dev-only. A production build rewrites these to hashed `_astro/`
	 * paths underneath the project's base, where normal routing applies.
	 */
	let target;
	if (pathname.startsWith(SERIES_BASE)) {
		target = projectFor(pathname);
	} else {
		const ref = req.headers.referer;
		let refPath = '';
		try {
			if (ref) refPath = new URL(ref).pathname;
		} catch {
			/* Malformed Referer: treat it as absent. */
		}
		if (!refPath.startsWith(SERIES_BASE)) {
			res.writeHead(302, { Location: `${SERIES_BASE}/` });
			res.end();
			return;
		}
		target = projectFor(refPath);
	}
	const upstream = httpRequest(
		{ host: HOST, port: target.port, path: req.url, method: req.method, headers: req.headers },
		(up) => {
			res.writeHead(up.statusCode ?? 502, up.headers);
			up.pipe(res);
		}
	);
	upstream.on('error', (err) => {
		if (res.headersSent) return res.destroy();
		res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
		res.end(
			`502 — the ${target.label} dev server (port ${target.port}) is not answering.\n\n` +
				`${err.message}\n\nIt may still be starting, or it may have crashed. ` +
				`Check this terminal for [${target.id}] output.\n`
		);
	});
	req.pipe(upstream);
});

/*
 * HMR. Vite's client opens a WebSocket back to the origin that served the page,
 * so it arrives here and must reach the project that served that page.
 *
 * IT CANNOT BE ROUTED BY THE PAGE PATH. Vite's HMR URL is built from
 * `server.hmr.path`, NOT from the page's base — so with Vite's default of `/`,
 * all four projects tell the browser to open `ws://<host>:<port>/`. Identical
 * URLs are unroutable, and Vite adds a per-server `?token=`, so a socket that
 * reaches the wrong project is rejected rather than silently wrong. Each
 * project therefore declares a unique `hmr.path` (see hmrPathOf), and that path
 * is what identifies the owner here.
 *
 * The projectFor() fallback covers a client that predates the config — it will
 * fail the token check, but on the right server, which is the diagnosable
 * version of the failure.
 */
const HMR_ROUTES = new Map(PROJECTS.map((p) => [hmrPathOf(p), p]));

server.on('upgrade', (req, socket, head) => {
	const pathname = (req.url ?? '/').split('?')[0];
	const target = HMR_ROUTES.get(pathname) ?? projectFor(pathname);
	const upstream = connect(target.port, HOST, () => {
		// Replay the handshake verbatim; a WebSocket upgrade is just a GET whose
		// headers must survive intact for the accept-key to validate.
		const headers = Object.entries(req.headers)
			.flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => `${k}: ${x}`) : [`${k}: ${v}`]))
			.join('\r\n');
		upstream.write(`GET ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
		if (head?.length) upstream.write(head);
		upstream.pipe(socket);
		socket.pipe(upstream);
	});
	const drop = () => {
		socket.destroy();
		upstream.destroy();
	};
	upstream.on('error', drop);
	socket.on('error', drop);
});

/**
 * Claim the public port BEFORE starting anything.
 *
 * INVARIANT: nothing is spawned, and no teardown handler is registered, until
 * this resolves. Teardown stops dev servers by asking Astro, and Astro finds
 * them by lock file rather than by who spawned them — so a supervisor that
 * starts servers and THEN fails to bind will, on its way out, kill the servers
 * belonging to the session already running on that port. Binding first means a
 * port conflict costs the running session nothing.
 */
function claimPort() {
	return new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(PORT, () => {
			server.removeListener('error', reject);
			server.on('error', (err) => {
				throw err;
			});
			resolve();
		});
	});
}

/* ── boot ──────────────────────────────────────────────────────────────── */

// Preflight. Without this, a project that was never installed just fails to
// open its port and reports as a 90-second timeout — which reads as "slow" or
// "broken" rather than "run npm install".
const uninstalled = PROJECTS.filter((p) => !existsSync(astroBin(p)));
if (uninstalled.length) {
	console.error(`\n✗ Astro is not installed in: ${uninstalled.map((p) => p.label).join(', ')}`);
	console.error(`\n  Run:  npm run install:all\n`);
	process.exit(1);
}

// Claim the port while we still own nothing — see claimPort() above.
try {
	await claimPort();
} catch (err) {
	if (err.code === 'EADDRINUSE') {
		console.error(`\n✗ Port ${PORT} is already in use.`);
		console.error(`  Most likely \`npm run dev\` is already running in another terminal;`);
		console.error(`  it may also be \`npm run preview\`, which uses the same port on purpose.`);
		console.error(`\n  Nothing was started, so whatever is running there is untouched.`);
		console.error(`  Use it, or run this on another port:  PORT=${PORT + 100} npm run dev\n`);
		process.exit(1);
	}
	throw err;
}

// Only NOW do we own anything, so only now is teardown ours to perform.
for (const sig of ['SIGINT', 'SIGTERM']) {
	process.on(sig, () => {
		stopAll();
		process.exit(0);
	});
}
process.on('exit', stopAll);

/*
 * Clear anything left listening from a previous session BEFORE starting.
 * Astro 7 daemonizes, so dev servers routinely outlive the shell that started
 * them — and a stale lock makes a fresh start fail on a port that looks free.
 */
console.log(`\n  Clearing any dev servers from a previous session…`);
for (const p of PROJECTS) {
	try {
		spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', 'stop'], {
			cwd: p.dir,
			stdio: 'ignore',
			windowsHide: true,
			timeout: 15_000,
		});
	} catch {
		/* Nothing running is the desired state, and that is what an error means. */
	}
}

console.log(`  Starting ${PROJECTS.length} dev servers…\n`);
for (const p of PROJECTS) startProject(p);

const results = await Promise.allSettled(
	PROJECTS.map((p) => waitForPort(p.port, READY_TIMEOUT_MS).then(() => p))
);
const failed = results.flatMap((r, i) => (r.status === 'rejected' ? [PROJECTS[i]] : []));

// Print what the failing children actually said. Anything less turns a real
// error message into "timed out", which is how the --ignore-lock bug survived.
for (const p of failed) {
	const entry = children.find((c) => c.project === p);
	console.error(`\n✗ ${p.label} (port ${p.port}) never started. Its output:\n`);
	const lines = entry?.log ?? [];
	if (lines.length === 0) console.error('    (no output at all)');
	else for (const line of lines) console.error(`    ${line}`);
}

if (failed.length === PROJECTS.length) {
	console.error('\n✗ No dev server came up — see the output above.\n');
	stopAll();
	process.exit(1);
}

{
	console.log(`\n  ${'─'.repeat(58)}`);
	console.log(`  Termux Tutorial series — one server, one URL`);
	console.log(`  ${'─'.repeat(58)}\n`);
	console.log(`    →  http://localhost:${PORT}${SERIES_BASE}/\n`);
	for (const p of PROJECTS) {
		const down = failed.includes(p);
		console.log(
			`    ${down ? '✗' : '·'} ${p.label.padEnd(13)} http://localhost:${PORT}${baseOf(p)}/` +
				(down ? '   (failed to start)' : '')
		);
	}
	console.log(`\n  The series switcher and every cross-course link work here.`);
	console.log(`  Live reload is proxied, so edits in any project still hot-reload.`);
	console.log(`  Ctrl-C stops all ${PROJECTS.length}.\n`);
}
