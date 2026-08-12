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
 * TermuxTerminal — an interactive, fish-flavoured Termux shell for tutorials.
 *
 * Renders xterm.js and wires keystrokes to the deterministic simulated shell in
 * ./shell.ts. Borrows the parts of fish that make a terminal feel alive:
 *   • grey inline autosuggestions (accept with → / Tab / End, at end-of-line)
 *   • real line editing — ←/→ inside the buffer, Ctrl-A/E/U/K/W, Alt-.
 *   • prefix-filtered history that never eats the line you were typing
 *   • live command highlighting (valid = cyan, impossible = red)
 *   • a two-tone prompt that shows which shell you are in
 *
 * Drop it into any MDX lesson with `client:only="react"`:
 *   <TermuxTerminal client:only="react" boot={["pkg update"]} />
 *
 * The session can also be driven from outside — see TermuxTerminalHandle and
 * TMX_RUN_EVENT below.
 */
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import {
	createState,
	exec,
	highlight,
	listDir,
	prettyPath,
	suggest,
	BOLD,
	CYAN,
	DIM,
	GHOST,
	GREEN,
	MAGENTA,
	PREFIX,
	RESET,
	type ShellState,
} from './shell';
import { load, subscribe } from '../../lib/progress';

/** What the learner has actually accomplished, for a future <Checkpoint>. */
export type TerminalProgress = Pick<ShellState, 'packagesUpdated' | 'storageLinked' | 'installed' | 'shell'>;

/**
 * The session's write side.
 *
 * `onProgress` made the shell state READABLE from outside, which is half the
 * problem: everything that can WRITE to the terminal — `term`, `buffer`,
 * `cursor`, `insert`, `submit` — is still a local of the one big effect, so
 * nothing on the page could put a command into the shell. That is what blocks
 * the "▶ Try it here" affordance (tap a command in the lesson, watch it run in
 * the terminal on the same page) rather than making a learner hand-type a
 * 38-character path on a 40-column phone screen.
 *
 * Rather than tear the effect apart — its ordering is load-bearing: fit, then
 * fonts.ready re-fit, then banner, then boot commands, then onData — the
 * handles it already builds are published through a ref the effect fills in
 * and clears. Same closure, one extra assignment.
 */
export interface TermuxTerminalHandle {
	/** Insert text at the caret without running it. */
	type(text: string): void;
	/** Replace the current line with `cmd` and press Enter. */
	run(cmd: string): void;
	focus(): void;
	/** Feed a raw key sequence through the normal input path (the touch row). */
	key(seq: string): void;
}

/**
 * The event a lesson dispatches at the terminal's wrapper element:
 *
 *   el.dispatchEvent(new CustomEvent('tmx-run', { detail: 'pkg update' }))
 *
 * This exists because every island on this site is `client:only="react"`, so
 * an .mdx page has no React tree to hand a ref into — a DOM event is the only
 * channel authored content actually has.
 */
export const TMX_RUN_EVENT = 'tmx-run';

export interface TermuxTerminalProps {
	/** Commands auto-run on mount so a lesson can show state without typing. */
	boot?: string[];
	/** Extra banner line under the default welcome message. */
	hint?: string;
	/**
	 * Screen height in CSS pixels, defaulting to 340 — but a CEILING, not a
	 * fixed value: it is applied as `min(${height}px, 45vh)` and floored by CSS
	 * at 12rem. With the soft keyboard up an Android viewport is roughly half
	 * height, and a flat 340px screen plus chrome plus the key row left no room
	 * for the lesson. Anything reasoning about the rendered height must account
	 * for all three, not just this number.
	 */
	height?: number;
	/**
	 * Which login shell the session starts in. Defaults to `fish` so every
	 * existing lesson keeps its `~ ❯` prompt; the Friendly Shell lesson can pass
	 * `shell="bash"` so `chsh -s fish` visibly changes something, which is the
	 * one payoff that lesson is entirely about.
	 */
	shell?: 'bash' | 'fish';
	/**
	 * Fired after every command with the learner's real accomplishments. This is
	 * the hook that replaced the dead `ExecResult.storageLinked` flag: the shell
	 * state is authoritative, so consumers read it rather than a copy.
	 */
	onProgress?: (p: TerminalProgress) => void;
	/** React 19 passes refs as a plain prop; see TermuxTerminalHandle. */
	ref?: Ref<TermuxTerminalHandle>;
}

/**
 * The touch key row's contents: [label, sequence sent, accessible name].
 *
 * Deliberately the keys the LESSONS instruct, not a general-purpose keyboard —
 * Tab and the arrows drive fish's autosuggestion and history, Esc is instructed
 * for dialogs, and `/ - ~` are the punctuation buried behind two taps on a phone
 * keyboard while appearing in nearly every path the course types. CTRL is
 * appended separately because it is a modifier, not a key.
 */
/**
 * Turn the learner's profile name into something that could actually BE a Unix
 * username, because the prompt is teaching what a prompt looks like.
 *
 * "Dennis Smaltz" is not a username; `dennis` is. So: lowercase, drop anything
 * that is not a letter, digit, underscore or hyphen, and cap the length so a
 * long name cannot eat the 40 columns a phone has. Falls back to the real
 * Android-style ID when the profile is still the default — a learner who has
 * not introduced themselves should see what Termux actually ships, which is
 * also what `first-session.mdx` documents.
 */
function shellUser(name: string): string {
	const clean = name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '')
		.replace(/[^a-z0-9_-]/g, '')
		.slice(0, 16);
	return clean && clean !== 'guest' ? clean : 'u0_a123';
}

const TOUCH_KEYS: ReadonlyArray<readonly [string, string, string]> = [
	['ESC', '\x1b', 'Escape'],
	['TAB', '\t', 'Tab'],
	['↑', '\x1b[A', 'Up arrow — previous command'],
	['↓', '\x1b[B', 'Down arrow — next command'],
	['←', '\x1b[D', 'Left arrow'],
	['→', '\x1b[C', 'Right arrow — accept suggestion'],
	['/', '/', 'Slash'],
	['-', '-', 'Hyphen'],
	['~', '~', 'Tilde — your home folder'],
];

export default function TermuxTerminal({
	boot = [],
	hint,
	height = 340,
	shell = 'fish',
	onProgress,
	ref,
}: TermuxTerminalProps) {
	const rootRef = useRef<HTMLDivElement>(null);
	const hostRef = useRef<HTMLDivElement>(null);
	const statusRef = useRef<HTMLSpanElement>(null);
	/* Filled by the effect below, cleared by its teardown. The public handle
	   forwards through it so a consumer's ref survives the session being rebuilt
	   (a `shell` or `hint` change tears the effect down and runs it again). */
	const apiRef = useRef<TermuxTerminalHandle | null>(null);
	useImperativeHandle(
		ref,
		() => ({
			type: (text: string) => apiRef.current?.type(text),
			run: (cmd: string) => apiRef.current?.run(cmd),
			focus: () => apiRef.current?.focus(),
			key: (seq: string) => apiRef.current?.key(seq),
		}),
		[]
	);

	/* Sticky CTRL for the touch key row. Two representations on purpose: the ref
	   is what the input handler reads (it lives inside an effect that must not
	   re-run when the modifier toggles), the state is what paints the button. */
	const ctrlRef = useRef(false);
	const [ctrlArmed, setCtrlArmed] = useState(false);
	const setCtrl = (on: boolean) => {
		ctrlRef.current = on;
		setCtrlArmed(on);
	};
	/* Effects must not re-run when a parent re-renders. `boot` is an array
	   literal at every call site, so a plain `[boot]` dependency gave it a new
	   identity each render and tore down the whole session — losing everything
	   the learner had typed. Depend on its CONTENT instead. */
	const bootKey = JSON.stringify(boot);
	const onProgressRef = useRef(onProgress);
	onProgressRef.current = onProgress;

	useEffect(() => {
		if (!hostRef.current) return;

		/* Column budget beats glyph size on a phone. At 14px the terminal measured
		   39 columns at 390px (35 at 360px) against ~80-column authored output, so
		   taught commands broke mid-token. 12px buys roughly a third more columns;
		   combined with the full-bleed framing in global.css it clears the ~55
		   columns the lessons actually need. */
		const narrow = typeof window !== 'undefined' && window.innerWidth < 480;

		const term = new Terminal({
			convertEol: true,
			cursorBlink: true,
			fontSize: narrow ? 12 : 14,
			// MUST be 'JetBrains Mono Variable' — that is the family name
			// @fontsource-variable/jetbrains-mono actually registers. Asking for
			// 'JetBrains Mono' silently falls through to the generic monospace.
			fontFamily:
				"'JetBrains Mono Variable', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace",
			// Sentinel Obsidian screen (Fire Watch): graphite background,
			// parchment-cream ink, brass cursor, and a semantic ANSI palette
			// (success=pine, danger=ember, warning/commands=brass, info=cornflower,
			// accent=dusty rose).
			theme: {
				background: '#0e1014',
				foreground: '#e8dfcc',
				cursor: '#d4b15c',
				cursorAccent: '#0e1014',
				selectionBackground: '#222833',
				black: '#222833',
				red: '#cc6449',
				green: '#5fb573',
				yellow: '#e8c878',
				blue: '#7fb6e0',
				magenta: '#c89aab',
				cyan: '#d4b15c',
				white: '#e8dfcc',
				brightBlack: '#6b6454',
				brightRed: '#d94e3a',
				brightGreen: '#7cc98d',
				brightYellow: '#f0d68f',
				brightBlue: '#9fc9ea',
				brightMagenta: '#d7b3c0',
				brightCyan: '#e8c878',
				brightWhite: '#f5efe2',
			},
		});
		const fit = new FitAddon();
		term.loadAddon(fit);
		term.loadAddon(new WebLinksAddon());
		term.open(hostRef.current);
		fit.fit();

		/* xterm measures glyph width once, at fit() time. If JetBrains Mono is
		   still loading it measures the fallback and every column count is wrong
		   for the life of the session. Re-fit once the webfont has landed. */
		let disposed = false;
		if (typeof document !== 'undefined' && document.fonts) {
			document.fonts.ready.then(() => {
				if (disposed) return;
				fit.fit();
				cursorRow = 0;
				render();
			});
		}

		const state = createState();
		state.shell = shell;
		state.env.SHELL = `${PREFIX}/bin/${shell}`;
		/* The prompt says who you are, so once a learner has named their local
		   profile it should say THEIR name — the session stops being a generic
		   demo and starts being theirs. `whoami` and `echo $USER` read the same
		   field, so all three agree without special-casing. */
		state.env.USER = shellUser(load().profile.name);
		const history = state.history; // owned by the shell so `history` and `>` work
		let histIndex = 0;
		let buffer = '';
		/* Where the caret sits INSIDE the buffer. Everything below is
		   position-aware; before this existed, `buffer` was only ever mutated at
		   its tail, so fixing character 3 of a 38-character path meant 35
		   backspaces and a full retype. */
		let cursor = 0;
		/* The half-typed line stashed when history navigation begins. Down used to
		   assign `buffer = ''` in its else-branch, so brushing ↓ silently destroyed
		   whatever you were composing — on the very key row this course teaches
		   people to add, where ↓ sits next to ↑. */
		let draft = '';
		/* Set for the final redraw before a line is abandoned or submitted. The
		   grey suggestion is a live hint, not part of what you typed — leaving it
		   on screen glued the ghost to the command in the scrollback. */
		let ghostOff = false;

		/* The prompt is responsive. The full fish-style prompt is 25 columns —
		   on a 390px phone the terminal is only ~39 columns wide, which left a
		   learner 14 characters before their own typing wrapped mid-word. Below
		   60 columns we fall back to `~ ❯`, which is also closer to what real
		   Termux ships. The glyph tracks the login shell (bash `$`, fish `❯`) so
		   `chsh` produces the visible change friendly-shell.mdx promises.
		   Returns [ansi, plainLength] so render() can do cursor maths on the
		   VISIBLE width, not the escape-laden string. */
		const prompt = (): [string, number] => {
			const path = prettyPath(state.cwd);
			const glyph = state.shell === 'fish' ? '❯' : '$';
			if (term.cols < 60) {
				return [`${MAGENTA}${path}${RESET} ${GREEN}${glyph}${RESET} `, path.length + 3];
			}
			const plain = `${state.env.USER} at localhost ${path} ${glyph} `;
			return [
				`${GREEN}${state.env.USER}${RESET} ${DIM}at${RESET} ${CYAN}localhost${RESET} ` +
					`${MAGENTA}${path}${RESET} ${GREEN}${glyph}${RESET} `,
				plain.length,
			];
		};

		/* Rows the cursor currently sits BELOW the prompt's first row. The old
		   render() used `\r\x1b[K`, which erases exactly one row — so as soon as
		   the input wrapped, the redraw left stale text behind and the line
		   visibly corrupted itself. We now rewind to the prompt's first row and
		   clear everything below it. */
		let cursorRow = 0;

		/** Redraw the current input line with highlight + grey autosuggestion. */
		const render = () => {
			const cols = Math.max(20, term.cols || 80);
			// fish only offers the ghost when the caret is at end-of-line —
			// otherwise → would have to mean two things at once.
			const atEnd = cursor === buffer.length;
			const ghost = atEnd && !ghostOff ? suggest(buffer, history) : '';
			const [promptAnsi, promptLen] = prompt();

			/*
			 * ONE write, not six.
			 *
			 * This used to issue a separate term.write() per step. xterm queues
			 * writes and can flush and PAINT between them, so the intermediate
			 * state — line erased by \x1b[J, prompt not yet redrawn — was a real
			 * frame the eye caught on every single keystroke. That was the
			 * "prompt disappears and reappears" hiccup: not a timing problem, an
			 * atomicity one. Assembling the whole sequence and writing it once
			 * means the erase and the redraw land in the same frame and the
			 * intermediate state is never presentable.
			 */
			const out: string[] = [];

			// 1. Rewind to the prompt's first row, then clear to end of screen.
			if (cursorRow > 0) out.push(`\x1b[${cursorRow}A`);
			out.push(`\r\x1b[J`);

			// 2. Draw prompt + highlighted input + grey suggestion.
			out.push(`${promptAnsi}${highlight(buffer, state.installed)}${GHOST}${ghost}${RESET}`);

			const endPos = promptLen + buffer.length + ghost.length;
			// When the text ends exactly on a column boundary xterm holds the wrap
			// pending, so the cursor is still on the PREVIOUS row and every row
			// count below would be off by one. One trailing space resolves it; the
			// next render's \x1b[J erases it.
			if (endPos > 0 && endPos % cols === 0) out.push(' ');

			// 3. Park the cursor at the caret position inside the real input,
			//    accounting for however many rows the text wrapped across.
			const wantPos = promptLen + cursor;
			const endRow = Math.floor(endPos / cols);
			const wantRow = Math.floor(wantPos / cols);
			const wantCol = wantPos % cols;
			if (endRow > wantRow) out.push(`\x1b[${endRow - wantRow}A`);
			out.push('\r');
			if (wantCol > 0) out.push(`\x1b[${wantCol}C`);

			term.write(out.join(''));

			cursorRow = wantRow;
		};

		/** Paint the accomplishment strip in the terminal chrome. */
		const paintStatus = () => {
			const bits: string[] = [];
			if (state.packagesUpdated) bits.push('package list ✓');
			if (state.storageLinked) bits.push('storage ✓');
			if (state.shell === 'fish') bits.push('fish ✓');
			if (state.installed.size) bits.push(`${state.installed.size} installed`);
			if (statusRef.current) statusRef.current.textContent = bits.join(' · ');
			onProgressRef.current?.({
				packagesUpdated: state.packagesUpdated,
				storageLinked: state.storageLinked,
				installed: state.installed,
				shell: state.shell,
			});
		};

		const newPrompt = () => {
			buffer = '';
			cursor = 0;
			draft = '';
			term.write(`\r\n`);
			cursorRow = 0;
			render();
		};

		const runLine = (line: string) => {
			const res = exec(state, line);
			if (res.clear) term.clear();
			// One write for the same reason render() uses one: a per-line loop
			// lets xterm paint partial output, so long results arrived in visible
			// chunks rather than as a result.
			if (res.output.length) term.write(res.output.map((l) => `\r\n${l}`).join(''));
			paintStatus();
		};

		/** Take the grey suggestion. Only ever called with the caret at the end. */
		const accept = () => {
			const ghost = suggest(buffer, history);
			if (!ghost) return false;
			buffer += ghost;
			cursor = buffer.length;
			render();
			return true;
		};

		/**
		 * Tab-completion of paths against the simulated filesystem — the
		 * "TAB triggers auto-completion" claim extra-keys.mdx sells the key row on.
		 */
		const completePath = () => {
			const frag = (buffer.slice(0, cursor).match(/(\S*)$/) ?? ['', ''])[1];
			if (!frag) return false;
			const slash = frag.lastIndexOf('/');
			const dirPart = slash >= 0 ? frag.slice(0, slash + 1) : '';
			const stem = slash >= 0 ? frag.slice(slash + 1) : frag;
			const entries = listDir(state, dirPart || '.');
			if (!entries) return false;
			const hits = entries.filter((e) => e.name.startsWith(stem) && (stem.startsWith('.') || !e.name.startsWith('.')));
			if (!hits.length) return false;

			// Longest common prefix, so a partial completion still moves you along.
			let common = hits[0].name;
			for (const h of hits) {
				while (!h.name.startsWith(common)) common = common.slice(0, -1);
			}
			const suffix = common.slice(stem.length) + (hits.length === 1 && hits[0].isDir ? '/' : '');
			if (suffix) {
				buffer = buffer.slice(0, cursor) + suffix + buffer.slice(cursor);
				cursor += suffix.length;
			} else if (hits.length > 1) {
				// Nothing more in common — show the choices, fish-style.
				term.write(`\r\n${DIM}${hits.map((h) => h.name + (h.isDir ? '/' : '')).join('  ')}${RESET}\r\n`);
				cursorRow = 0;
			}
			render();
			return true;
		};

		/** ↑/↓ walk only the entries starting with what you had typed. */
		const historyMove = (dir: -1 | 1) => {
			if (histIndex === history.length) draft = buffer;
			const prefix = draft;
			let i = histIndex;
			for (;;) {
				i += dir;
				if (i < 0) return;
				if (i >= history.length) {
					histIndex = history.length;
					buffer = draft;
					cursor = buffer.length;
					render();
					return;
				}
				if (!prefix || history[i].startsWith(prefix)) {
					histIndex = i;
					buffer = history[i];
					cursor = buffer.length;
					render();
					return;
				}
			}
		};

		const insert = (text: string) => {
			buffer = buffer.slice(0, cursor) + text + buffer.slice(cursor);
			cursor += text.length;
			render();
		};

		/** Enter: run what is on the line and open a fresh prompt. */
		const submit = () => {
			const line = buffer;
			// Repaint with the caret at the end and no ghost, so the line left in
			// the scrollback is exactly the command that ran.
			cursor = buffer.length;
			ghostOff = true;
			render();
			ghostOff = false;
			if (line.trim()) {
				history.push(line);
				histIndex = history.length;
			}
			runLine(line);
			newPrompt();
		};

		// Welcome banner mirroring a real first launch.
		term.writeln(`${BOLD}${CYAN}Welcome to Termux!${RESET}  ${DIM}(practice terminal)${RESET}`);
		term.writeln(`${DIM}Grey text is a suggestion — → or Tab takes it. Type 'help'.${RESET}`);
		if (hint) term.writeln(`${MAGENTA}➜ ${hint}${RESET}`);
		term.write(`\r\n`);
		render();
		paintStatus();

		// Boot commands go through the same path a keystroke would, so a lesson's
		// pre-run state is indistinguishable from state the learner produced.
		for (const cmd of boot) {
			buffer = cmd;
			cursor = cmd.length;
			submit();
		}

		/* Named, because the touch key row feeds the SAME handler rather than
		   carrying its own copy of the key semantics — duplicating them in a
		   click handler is how the two drift apart.

		   INVARIANT: every sequence TOUCH_KEYS sends has a case below. ESC was
		   the exception for a while — it sends a bare '\x1b', had no case, and the
		   default branch rejected it, so tapping ESC did nothing at all. If you
		   add a key to the row, add its case here in the same commit; nothing
		   tests this pairing. */
		const handleData = (raw: string) => {
			let data = raw;

			/* Sticky CTRL, armed from the key row. A soft keyboard has no Ctrl at
			   all, so the row arms the modifier and the NEXT character the keyboard
			   produces is folded into a control code here — the same C0 arithmetic
			   a real terminal does (Ctrl-C is 'C' minus 64). Doing it at the head of
			   the handler means every existing case gets it for free. */
			if (ctrlRef.current && data.length === 1) {
				const upper = data.toUpperCase();
				if (upper >= '@' && upper <= '_') {
					data = String.fromCharCode(upper.charCodeAt(0) - 64);
				}
				setCtrl(false);
			}

			/* A paste arrives as one chunk. The lessons print multi-line fenced
			   blocks (three commands in extra-keys.mdx alone) and people paste
			   them wholesale; the old printable-only guard let the raw newlines
			   through and concatenated every line into one unrunnable command. */
			if (data.length > 1 && /[\r\n]/.test(data)) {
				const lines = data.split(/\r\n|\r|\n/);
				const tail = lines.pop() ?? '';
				for (const l of lines) {
					insert(l);
					submit();
				}
				if (tail) insert(tail);
				return;
			}

			switch (data) {
				case '\r': // Enter
					submit();
					break;
				case '\x7f': // Backspace — delete BEFORE the caret
					if (cursor > 0) {
						buffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor);
						cursor--;
						render();
					}
					break;
				case '\x1b[3~': // Delete — delete AT the caret
					if (cursor < buffer.length) {
						buffer = buffer.slice(0, cursor) + buffer.slice(cursor + 1);
						render();
					}
					break;
				case '\t': // Tab — take the suggestion, else complete a path
					if (!accept()) completePath();
					break;
				case '\x1b[D': // ← move left
				case '\x02': // Ctrl-B
					if (cursor > 0) { cursor--; render(); }
					break;
				case '\x1b[C': // → move right, or take the suggestion at end-of-line
				case '\x06': // Ctrl-F
					if (cursor < buffer.length) { cursor++; render(); }
					else accept();
					break;
				case '\x1b[H': // Home
				case '\x1bOH':
				case '\x1b[1~':
				case '\x01': // Ctrl-A
					if (cursor !== 0) { cursor = 0; render(); }
					break;
				case '\x1b[F': // End — jump to end, or take the suggestion once there
				case '\x1bOF':
				case '\x1b[4~':
				case '\x05': // Ctrl-E
					if (cursor < buffer.length) { cursor = buffer.length; render(); }
					else accept();
					break;
				case '\x15': // Ctrl-U — kill to start of line
					if (cursor > 0) { buffer = buffer.slice(cursor); cursor = 0; render(); }
					break;
				case '\x0b': // Ctrl-K — kill to end of line
					if (cursor < buffer.length) { buffer = buffer.slice(0, cursor); render(); }
					break;
				case '\x17': { // Ctrl-W — kill the word before the caret
					if (!cursor) break;
					const head = buffer.slice(0, cursor).replace(/\S+\s*$/, '');
					buffer = head + buffer.slice(cursor);
					cursor = head.length;
					render();
					break;
				}
				case '\x1b.': // Alt-. — recall the last argument (cheatsheet, Phone keys)
				case '\x1b_': {
					const prev = history[history.length - 1] ?? '';
					const last = prev.trim().split(/\s+/).pop() ?? '';
					if (last && last !== prev.trim()) insert((cursor && buffer[cursor - 1] !== ' ' ? ' ' : '') + last);
					break;
				}
				case '\x03': // Ctrl-C
					// Park the caret at the end first so ^C lands where a real shell
					// puts it, rather than in the middle of the abandoned line.
					cursor = buffer.length;
					ghostOff = true;
					render();
					ghostOff = false;
					term.write(`${DIM}^C${RESET}`);
					newPrompt();
					break;
				case '\x0c': // Ctrl-L — clear screen
					term.clear();
					cursorRow = 0; // clear() makes the prompt line the first line
					render();
					break;
				case '\x1b': // ESC — dismiss the ghost suggestion, as fish does
					// The key row offers ESC, so it must do something. fish's own
					// behaviour is the honest one: drop the autosuggestion from
					// view and leave the typed buffer alone. ghostOff is transient
					// by design — the next keystroke re-renders and it returns.
					ghostOff = true;
					render();
					ghostOff = false;
					break;
				case '\x1b[A': // ↑ previous matching history entry
					historyMove(-1);
					break;
				case '\x1b[B': // ↓ next entry — or back to the line you were typing
					historyMove(1);
					break;
				default:
					// Printable input only, inserted AT the caret. Handles pastes too
					// (xterm delivers those as one multi-character chunk).
					if (data && !data.startsWith('\x1b') && ![...data].some((c) => c < ' ')) {
						insert(data);
					}
			}
		};

		const disposable = term.onData(handleData);

		/* Publish the write side. Everything here already existed as a closure
		   local; the only new code is the assignment and its teardown, which is
		   why this does not disturb the ordering above. */
		const api: TermuxTerminalHandle = {
			type: (text) => {
				if (!text) return;
				insert(text);
				term.focus();
			},
			run: (cmd) => {
				if (!cmd.trim()) return;
				// "Run this" means run exactly this, so whatever was half-typed is
				// replaced rather than concatenated into an unrunnable line.
				buffer = '';
				cursor = 0;
				insert(cmd);
				submit();
				term.focus();
			},
			focus: () => term.focus(),
			key: (seq) => {
				handleData(seq);
				// Focus last: the row exists to supplement the soft keyboard, so a
				// tap must never be the thing that dismisses it.
				term.focus();
			},
		};
		apiRef.current = api;

		/* The DOM channel — see TMX_RUN_EVENT. Bound to the wrapper rather than
		   the document so two terminals on one page stay independent. */
		const root = rootRef.current;
		const onRunEvent = (e: Event) => {
			const cmd = (e as CustomEvent<string>).detail;
			if (typeof cmd === 'string') api.run(cmd);
		};
		root?.addEventListener(TMX_RUN_EVENT, onRunEvent);

		const onResize = () => {
			// Crossing the 480px boundary changes the column budget, so re-apply
			// the font size before re-fitting.
			const nowNarrow = window.innerWidth < 480;
			const wantSize = nowNarrow ? 12 : 14;
			if (term.options.fontSize !== wantSize) term.options.fontSize = wantSize;
			fit.fit();
			// Column count changed, so the previous wrap layout (and therefore
			// cursorRow) no longer describes the screen. Reset before redrawing
			// so we never rewind the cursor up into scrollback.
			cursorRow = 0;
			render();
		};
		window.addEventListener('resize', onResize);

		/* Rename the session live when the learner edits their profile. Without
		   this the prompt would keep whatever name it read at mount until the
		   page reloaded — and the profile badge sits on the same screen, so the
		   two would visibly disagree. Only redraws when the name actually
		   changed, so unrelated progress events (ticking a lesson complete) do
		   not repaint the input line under the caret. */
		const onProfile = () => {
			const next = shellUser(load().profile.name);
			if (next === state.env.USER) return;
			state.env.USER = next;
			render();
		};
		const unsubscribe = subscribe(onProfile);

		/* The soft keyboard does NOT fire window resize on Android Chrome — it
		   resizes the visual viewport only, which is why the prompt could end up
		   buried under the keyboard with no event to react to. visualViewport is
		   the one signal that fires, so scroll the frame's bottom edge back into
		   the shrunken viewport when it does. Guarded because Firefox shipped it
		   late and it is absent under SSR. */
		const vv = window.visualViewport;
		const onViewport = () => {
			// Only when this terminal is the thing being typed into — otherwise
			// every terminal on the page fights to scroll itself into view.
			if (!rootRef.current?.contains(document.activeElement)) return;
			rootRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
		};
		vv?.addEventListener('resize', onViewport);

		return () => {
			disposed = true; // stop the pending fonts.ready callback
			window.removeEventListener('resize', onResize);
			vv?.removeEventListener('resize', onViewport);
			unsubscribe();
			root?.removeEventListener(TMX_RUN_EVENT, onRunEvent);
			// Clear before dispose(): a late caller must get a no-op, not a write
			// into a torn-down Terminal.
			if (apiRef.current === api) apiRef.current = null;
			disposable.dispose();
			term.dispose();
		};
		// `boot` is intentionally absent: bootKey encodes its contents, and using
		// the array itself resets the session on every parent render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bootKey, hint, shell]);

	/*
	 * Frame, chrome and screen are classes in global.css now. The one value
	 * left inline is `height`, which is a prop. Two things that were inline
	 * mattered more than they looked:
	 *   • `border` + `borderRadius` silently defeated the mobile full-bleed
	 *     block, which sets `border-radius: 0` / `border-inline: none` — no
	 *     ordinary rule beats an inline style, so a phone got a 100vw terminal
	 *     with rounded corners and hairlines running off both edges.
	 *   • the screen's 8px gutter is now owned by the `:has(> .xterm)` rule,
	 *     which is also where the content-box fix for the 8px row clip lives.
	 */
	return (
		<div ref={rootRef} className="tmx-terminal tmx-island not-content">
			<div className="tmx-terminal__chrome">
				{/*
				 * The three dots are gone. Neutralising the macOS traffic-light
				 * COLOURS fixed the palette problem but left the SHAPE, and the
				 * shape is the part that says "desktop window" — so the chrome
				 * was quietly claiming to be a Mac (or an iOS sheet, or nothing
				 * in particular) while the course is about Android.
				 *
				 * A prompt glyph says what this actually is with no OS claim at
				 * all: a Termux session. It also matches the `>_` motif already
				 * running through the site's artwork, and `aria-hidden` keeps it
				 * out of the accessibility tree since the label carries the name.
				 */}
				<span className="tmx-terminal__mark" aria-hidden="true">&gt;_</span>
				<span className="tmx-terminal__label">termux</span>
				<span className="tmx-terminal__os">on Android</span>
				{/* The accomplishment strip. The shell already knew whether storage was
				    bridged, the package list refreshed and what was installed — and told
				    nobody. Now the frame acknowledges it, and role="status" announces it. */}
				<span ref={statusRef} role="status" className="tmx-terminal__status" />
			</div>
			{/* `min(…, 45vh)` rather than a flat pixel height: with the soft keyboard
			    up, an Android viewport is roughly half its usual height, and a fixed
			    340px screen plus chrome plus the key row left no room for the page
			    the terminal is supposed to be illustrating. */}
			<div
				ref={hostRef}
				className="tmx-terminal__screen"
				style={{ height: `min(${height}px, 45vh)` }}
				onClick={() => apiRef.current?.focus()}
			/>
			{/*
			 * THE TOUCH KEY ROW.
			 *
			 * The course teaches ↑/↓, Tab, Ctrl-C and Ctrl-L, and none of those keys
			 * exist on Gboard or the Samsung keyboard — so on the phone this course
			 * is about, every fish feature it markets was unreachable. This row is
			 * the fix, and it doubles as a live demo of the extra-keys lesson, which
			 * teaches learners to enable the very same row in real Termux.
			 *
			 * Shown on every device, not just coarse pointers: it advertises which
			 * keys matter, and a desktop learner reading about Volume-Up+T benefits
			 * from seeing TAB sitting right there.
			 */}
			<div className="tmx-terminal__keys" role="group" aria-label="Terminal keys">
				{TOUCH_KEYS.map(([label, seq, name]) => (
					<button
						key={label}
						type="button"
						className="tmx-terminal__key"
						aria-label={name}
						// The whole point is to supplement the soft keyboard, so the
						// button must never take focus — that would dismiss it.
						onPointerDown={(e) => e.preventDefault()}
						onClick={() => apiRef.current?.key(seq)}
					>
						{label}
					</button>
				))}
				<button
					type="button"
					className="tmx-terminal__key"
					aria-label="Control (applies to the next key)"
					aria-pressed={ctrlArmed}
					data-armed={ctrlArmed ? '' : undefined}
					onPointerDown={(e) => e.preventDefault()}
					onClick={() => {
						setCtrl(!ctrlRef.current);
						apiRef.current?.focus();
					}}
				>
					CTRL
				</button>
			</div>
		</div>
	);
}
