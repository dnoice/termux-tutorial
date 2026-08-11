#!/usr/bin/env node
/**
 * dev.mjs — ONE command, ONE port, ONE URL, for the whole series.
 *
 * THE PROBLEM THIS SOLVES. Four Astro projects meant four `npm run dev`s on
 * four ports, and the one thing the series is built around — walking from the
 * hub into a course and back via the switcher — could not be done on any of
 * them. Those links are absolute (`/termux-tutorial/advanced/…`) and resolve
 * only when all four projects sit under one origin, which happened exactly
 * once: inside the deploy workflow, in CI, after a push. So the primary
 * navigation of the site was the single least-testable thing about it, and
 * "does the switcher work" was a question answered by reading code.
 *
 * HOW. A reverse proxy on one port, routing by the SAME path prefixes GitHub
 * Pages uses. Each child dev server already serves at its own `base`, so paths
 * pass through untouched — no rewriting, no `basePath` trickery, and the URL in
 * your address bar locally is character-for-character the production URL.
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
 * TWO MODES, AND WE MUST SURVIVE BOTH. Astro 7 runs `astro dev` in the
 * foreground normally, but daemonizes it when it detects a non-TTY or an AI
 * agent environment. In background mode the spawned child EXITS immediately
 * while the server keeps running — so liveness cannot be tracked by the child
 * process. That is why readiness is decided by polling the PORT, and why
 * shutdown asks Astro to stop rather than killing a pid we hold: only one of
 * those works in both modes.
 *
 * NO `--ignore-lock`. It looks right — a stale lock from a previous session
 * should not block a start — but Astro rejects it outright in background mode,
 * because the lock file is how `astro dev stop` finds the server it started.
 * The flag made every project fail to launch with an error we had piped away.
 * Stale locks are cleared by the `astro dev stop` sweep before startup instead.
 */
function startProject(project) {
	const child = spawn(
		process.execPath,
		['node_modules/astro/bin/astro.mjs', 'dev', '--port', String(project.port)],
		{ cwd: project.dir, stdio: ['ignore', 'pipe', 'pipe'] }
	);
	/*
	 * BUFFER EVERYTHING, PRINT ON FAILURE.
	 *
	 * This started as a filter that showed only lines matching /error|failed/,
	 * to keep four servers' banners from burying the proxy's own URL. It threw
	 * away the message that mattered: Astro was refusing `--ignore-lock` in
	 * background mode and exiting, and all four projects failed silently while
	 * the supervisor reported a 90-second timeout. A timeout is what you see
	 * when you discard the reason.
	 *
	 * Quiet on success, complete on failure — a filter cannot know in advance
	 * which line will turn out to be the one you needed.
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

	// The bare origin is what a browser opens by default. Send it to the front
	// door rather than 404ing, which reads as a broken server.
	if (pathname === '/' || !pathname.startsWith(SERIES_BASE)) {
		res.writeHead(302, { Location: `${SERIES_BASE}/` });
		res.end();
		return;
	}

	const target = projectFor(pathname);
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
 * URLs are unroutable, and Vite 7 adds a per-server `?token=`, so a socket that
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
 * THIS ORDERING IS THE WHOLE POINT, and getting it wrong caused a genuinely
 * confusing failure. Previously the four dev servers were started first and the
 * proxy bound last, so a second `npm run dev` would start four servers, fail to
 * bind, and then run its shutdown — which stops dev servers by asking Astro to,
 * and Astro finds them by lock file, not by who spawned them. So the second
 * supervisor's cleanup killed the FIRST supervisor's servers, and a healthy
 * session started 502ing because of a command that had already exited.
 *
 * Binding first means a port conflict is discovered while we still own nothing,
 * and the failure costs the running session precisely nothing.
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
