/*
 * ═══════════════════════════════════════════════════════════════════════════
 * NOT RENDERED IN THIS COURSE. Read this before trusting anything below.
 *
 * Termux: Advanced mounts no practice terminal, no live sandbox and no boot
 * splash — deliberately, and its landing page says so to the learner in a
 * section called "No practice terminal in this course". The simulator cannot
 * install a rootfs, open an X11 socket or reach a GPU, so a terminal that
 * answered `proot-distro login debian` would be lying about the one thing this
 * course teaches.
 *
 * This file was ported from course two and kept, because deleting it is a
 * bigger and riskier diff than leaving it and because a future lesson that IS
 * plain POSIX shell could legitimately want it back.
 *
 * CONSEQUENCE FOR EVERY COMMENT BELOW: they describe behaviour as it occurs in
 * courses one and two. Here, none of it executes — nothing imports this module,
 * so it is not in any bundle. Do not "fix" a lesson to match a claim made in
 * this file, and do not treat these comments as evidence about this course.
 *
 * If you ever mount it here: teach shell.ts this course's commands first
 * (including their failure modes), and fix SANDBOX_PATH in astro.config.mjs,
 * which still names a course-two slug.
 * ═══════════════════════════════════════════════════════════════════════════
 */
/*
 * LiveSandbox — a real, x86 Linux VM in the browser via CheerpX / WebVM.
 *
 * Unlike TermuxTerminal (a scripted simulation), this boots an unmodified
 * Debian/Alpine image entirely client-side using WebAssembly. It requires a
 * cross-origin-isolated context (SharedArrayBuffer) — supplied on GitHub Pages
 * by /coi-serviceworker.js — and pulls CheerpX from Leaning Technologies' CDN.
 *
 * The VM is heavy (tens of MB), so it only boots when the learner clicks
 * "Boot Linux". When isolation or the network is unavailable we fail loudly
 * and point back to the offline simulator.
 *
 * CheerpX is free for non-commercial and educational use; review the license
 * at https://cheerpx.io before shipping a commercial build.
 *
 * ACCESSIBILITY NOTE — read before changing the markup below.
 * xterm consumes Tab, and Shift+Tab arrives as an escape sequence it also
 * swallows, so a keyboard user who tabbed in could not tab out: a WCAG 2.1.2
 * keyboard trap. The escape hatch is Esc, wired on the wrapper in the CAPTURE
 * phase so it fires before xterm sees the key, and it lands focus on a real,
 * visible "Leave terminal" button that sits AFTER the screen in DOM order —
 * so the next Tab continues down the page instead of re-entering the shell.
 * The hint is visible text, not just an aria-describedby, because sighted
 * keyboard users need it too.
 */
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import Icon from '../icons/icons';

const CHEERPX_VERSION = '1.1.5';
const CHEERPX_URL = `https://cxrtnc.leaningtech.com/${CHEERPX_VERSION}/cx.esm.js`;
// Public Debian mini image published by Leaning Technologies for demos.
const DEFAULT_IMAGE = 'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2';

type Phase = 'idle' | 'loading' | 'running' | 'error';

export interface LiveSandboxProps {
	/** Override the disk image (must be a CheerpX-compatible block device URL). */
	image?: string;
	height?: number;
}

export default function LiveSandbox({ image = DEFAULT_IMAGE, height = 420 }: LiveSandboxProps) {
	const hostRef = useRef<HTMLDivElement>(null);
	const exitRef = useRef<HTMLButtonElement>(null);
	const termRef = useRef<Terminal | null>(null);
	const fitRef = useRef<FitAddon | null>(null);
	/* The old code registered `window.addEventListener('resize', () => fit.fit())`
	   with an anonymous handler, so the reference was gone the moment it was
	   created and the listener could never be removed. Keeping it in a ref is
	   the whole fix. */
	const onResizeRef = useRef<(() => void) | null>(null);
	/* Guards the CheerpX console callback: cx keeps writing after we dispose the
	   terminal, and writing to a disposed xterm throws inside a callback we do
	   not own. */
	const disposedRef = useRef(false);
	const bootedRef = useRef(false);

	const [phase, setPhase] = useState<Phase>('idle');
	const [message, setMessage] = useState('');

	const uid = useId();
	const hintId = `${uid}-hint`;

	/**
	 * Release everything this component created.
	 *
	 * Previously nothing was released: the resize listener leaked, the Terminal
	 * was never disposed, and because Starlight navigates with client-side view
	 * transitions, leaving the page left a running WebAssembly x86 VM alive in
	 * the background.
	 */
	const teardown = useCallback(() => {
		disposedRef.current = true;
		if (onResizeRef.current) {
			window.removeEventListener('resize', onResizeRef.current);
			onResizeRef.current = null;
		}
		try {
			termRef.current?.dispose();
		} catch {
			// dispose() on an already-torn-down terminal is not worth a crash.
		}
		termRef.current = null;
		fitRef.current = null;
		// CheerpX exposes no public teardown; detaching the console at least
		// stops it writing into a disposed terminal.
	}, []);

	useEffect(() => teardown, [teardown]);

	// Report isolation status up front so the learner knows what to expect.
	useEffect(() => {
		if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
			setMessage(
				'Almost ready — refresh this page once and the Boot button will work.'
			);
		}
	}, []);

	/* The screen's padding used to be resolved HERE — a useState plus a
	   matchMedia listener duplicating global.css's own 30rem breakpoint —
	   because the stylesheet targeted the screen with `> div:last-child`, which
	   is the wrong element in this component (the hint footer and the idle
	   overlay both render after it). global.css now selects it structurally,
	   with `:has(> .xterm)`: that matches exactly when a terminal is mounted, so
	   the collapsed state needs no padding rule at all. State, effect and
	   listener deleted. */

	async function boot() {
		if (bootedRef.current || !hostRef.current) return;
		/* A boot that failed AFTER term.open() left a live xterm canvas in the
		   host div and reset bootedRef, so pressing Boot again stacked a second
		   terminal plus a second resize listener on the same node. Tearing down
		   first makes a retry start from a clean host. */
		teardown();
		hostRef.current.replaceChildren();
		disposedRef.current = false;
		bootedRef.current = true;
		setPhase('loading');
		setMessage('Loading CheerpX runtime…');

		if (!window.crossOriginIsolated) {
			setPhase('error');
			setMessage(
				'This page needs one refresh before the VM can start. Refresh, then press Boot Linux again.'
			);
			bootedRef.current = false;
			return;
		}

		try {
			const term = new Terminal({
				convertEol: true,
				cursorBlink: true,
				fontSize: 14,
				// 'JetBrains Mono Variable' — the family @fontsource-variable
				// registers. Plain 'JetBrains Mono' falls back to generic mono.
				fontFamily:
					"'JetBrains Mono Variable', ui-monospace, Menlo, Consolas, monospace",
				// Defaults to false in @xterm/xterm v6, and the accessibility
				// manager is only instantiated behind this flag — without it the
				// VM's output is announced to nobody at all.
				screenReaderMode: true,
				/* The only place literals are legitimate: xterm paints to a
				   canvas and cannot read CSS custom properties. These mirror the
				   dark-LOCKED screen tokens (--tmx-screen / --tmx-screen-ink /
				   --color-brand), which are identical in both themes by design,
				   so they cannot drift out of sync with the palette. */
				theme: {
					background: '#0e1014',
					foreground: '#e8dfcc',
					cursor: '#d4b15c',
					selectionBackground: '#222833',
				},
			});
			termRef.current = term;
			const fit = new FitAddon();
			fitRef.current = fit;
			term.loadAddon(fit);
			term.open(hostRef.current);
			fit.fit();

			const onResize = () => {
				if (disposedRef.current) return;
				fitRef.current?.fit();
			};
			onResizeRef.current = onResize;
			window.addEventListener('resize', onResize);

			term.writeln('Booting Debian via CheerpX — this can take a moment on first run…');

			// Dynamic ESM import keeps CheerpX out of the main bundle.
			const CheerpX = await import(/* @vite-ignore */ CHEERPX_URL);

			const cx = await CheerpX.Linux.create({
				mounts: [
					{ type: 'ext2', path: '/', dev: await CheerpX.CloudDevice.create(image) },
				],
			});

			// The component can unmount mid-boot (view transitions); bail rather
			// than wire a torn-down terminal to a live VM.
			if (disposedRef.current) return;

			cx.setCustomConsole(
				(buf: Uint8Array) => {
					if (disposedRef.current) return;
					term.write(new Uint8Array(buf));
				},
				term.cols,
				term.rows
			);
			term.onData((data: string) => {
				for (const ch of data) cx.sendCharToConsole(ch.charCodeAt(0));
			});

			setPhase('running');
			setMessage('');
			await cx.run('/bin/bash', ['--login'], {
				env: ['HOME=/root', 'TERM=xterm-256color', 'USER=root'],
				cwd: '/root',
				uid: 0,
				gid: 0,
			});
		} catch (e) {
			setPhase('error');
			setMessage(
				`Couldn't start the VM. ${e instanceof Error ? e.message : String(e)}. ` +
					'No harm done — the practice terminal above works the same way.'
			);
			teardown();
			bootedRef.current = false;
		}
	}

	/**
	 * Capture-phase Escape handler — the trap door.
	 *
	 * Capture matters: xterm attaches its own listener to the textarea and
	 * preventDefaults nearly everything, so a bubble-phase handler here would
	 * never run.
	 */
	const onKeyDownCapture = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key !== 'Escape') return;
		e.preventDefault();
		e.stopPropagation();
		termRef.current?.blur();
		exitRef.current?.focus();
	};

	/* Only 'loading' and 'running' put a real screen on the page. On 'error' the
	   terminal has been torn down, so keeping the host open would leave a blank
	   420px obsidian slab under the explanation. */
	const live = phase === 'loading' || phase === 'running';
	/* The retry path existed in code (the catch reset bootedRef) but not in the
	   UI: the Boot button only rendered while idle, so after a failure there was
	   no way back short of reloading the page. */
	const canBoot = phase === 'idle' || phase === 'error';

	/*
	 * Chrome is classes in global.css now. Only `height` stays inline, because
	 * it is a prop toggled against the collapsed state. Two literals went with
	 * the move: `borderRadius: '10px'` (off the 4/6/8/12/9999 scale, and 2px
	 * away from the terminal above it on the same page) and
	 * `boxShadow: '0 8px 30px rgba(0,0,0,0.35)'` — the single reason global.css
	 * had to carry an `!important` on the terminal shadow.
	 */
	return (
		<div className="tmx-sandbox tmx-island not-content" onKeyDownCapture={onKeyDownCapture}>
			<div className="tmx-sandbox__chrome">
				<span className="tmx-sandbox__title">live linux — real Debian, in your browser</span>
				{canBoot && (
					<button onClick={boot} className="tmx-btn tmx-btn--primary tmx-tap tmx-sandbox__boot">
						<Icon name={phase === 'error' ? 'rotate' : 'play'} size={14} />
						{phase === 'error' ? 'Try again' : 'Boot Linux'}
					</button>
				)}
				{phase === 'loading' && (
					<span className="tmx-sandbox__state" data-phase="loading">
						booting…
					</span>
				)}
				{phase === 'running' && (
					<span className="tmx-sandbox__state" data-phase="running">
						<span className="tmx-sandbox__pulse" />
						live
					</span>
				)}
			</div>

			{message && (
				<div
					// Errors arrive asynchronously, minutes after the click, with no
					// visual change anywhere near the button that started it.
					role={phase === 'error' ? 'alert' : 'status'}
					className="tmx-sandbox__message"
					data-tone={phase === 'error' ? 'error' : 'info'}
				>
					{message}
				</div>
			)}

			<div
				ref={hostRef}
				// role="application" is correct here and not a cop-out: the widget
				// deliberately overrides normal key semantics, so AT must pass keys
				// through. It was previously an unnamed, unlabelled <div>.
				role="application"
				aria-label="Live Debian sandbox — interactive terminal"
				aria-describedby={live ? hintId : undefined}
				className="tmx-sandbox__screen"
				style={{ height: live ? height : 0 }}
			/>

			{live && (
				<div className="tmx-sandbox__foot">
					<span id={hintId} className="tmx-sandbox__hint">
						Keyboard: press <kbd>Esc</kbd> to leave the terminal — Tab is sent to the
						shell, not the page.
					</span>
					<button
						ref={exitRef}
						type="button"
						onClick={() => termRef.current?.blur()}
						className="tmx-tap tmx-sandbox__exit"
					>
						Leave terminal
					</button>
				</div>
			)}

			{phase === 'idle' && (
				<div className="tmx-sandbox__idle">
					Hit <strong>Boot Linux</strong> to spin up a full, throwaway Debian box — right
					here in the page. Nothing touches your device, and it wipes clean on refresh.
					{/* Stated up front: the learner is about to spend tens of MB, and the
					    VM has no egress (CheerpX gets none without a networkInterface). */}
					<div className="tmx-sandbox__idle-warn">
						⚠ Downloads tens of MB on first boot — use Wi-Fi if you're on mobile data.
					</div>
					<div className="tmx-sandbox__idle-note">
						No internet inside the VM, so <code>apt</code>, <code>curl</code> and{' '}
						<code>git clone</code> won't work. Try <code>cat /etc/os-release</code> or{' '}
						<code>python3 --version</code> instead.
					</div>
				</div>
			)}
		</div>
	);
}
