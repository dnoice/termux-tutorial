/*
 * A tiny simulated Termux shell.
 *
 * This is NOT a real Linux VM — it is a deterministic, offline interpreter for
 * a curated subset of Termux/Android commands, purpose-built for tutorials.
 * Every response mirrors what a real, freshly-installed Termux session prints,
 * so learners build correct muscle memory before touching their device.
 *
 * Two rules govern every case in `runCommand()`:
 *   1. Never invent a plausible-looking answer. If the sandbox can't do a thing,
 *      it says so in yellow (see NOT_SIMULATED) rather than faking success.
 *      `ls -l`, `$PREFIX` and `&&` used to return confidently wrong output,
 *      which is worse for a beginner than an error they can read.
 *   2. Failures are part of the curriculum. Installing against a stale package
 *      list, writing outside the Termux sandbox, `chmod +x` on shared storage,
 *      running a script without the exec bit — all fail exactly the way a real
 *      device fails them, with the same wording the Troubleshooting page uses.
 *
 * For a genuine sandbox that runs unmodified binaries, see the WebVM-backed
 * LiveSandbox component instead.
 */

export const RESET = '\x1b[0m';
export const CYAN = '\x1b[36m';
export const GREEN = '\x1b[32m';
export const YELLOW = '\x1b[33m';
export const MAGENTA = '\x1b[35m';
export const RED = '\x1b[31m';
export const DIM = '\x1b[2m';
/**
 * Ghost text for fish-style autosuggestions.
 *
 * NOT `DIM` (SGR 2): xterm renders dim as 50% alpha, which composited to
 * ~4.2:1 on the obsidian screen — under AA for 14px text, for the one mechanic
 * the landing page explicitly tells people to look for. This explicit truecolor
 * grey measures ~5.1:1 while still reading as clearly quieter than live input.
 */
export const GHOST = '\x1b[38;2;142;134;118m';
export const BOLD = '\x1b[1m';

export const HOME = '/data/data/com.termux/files/home';
export const PREFIX = '/data/data/com.termux/files/usr';
/** Everything Termux is allowed to write to lives under here. */
const TERMUX_FILES = '/data/data/com.termux/files';

/**
 * Commands this sandbox actually interprets. Always available, no install.
 *
 * `termux-change-repo` is here because it genuinely ships with Termux — it just
 * draws a full-screen menu we decline to fake (see NOT_SIMULATED).
 */
export const BUILTIN_NAMES = [
	'pkg', 'apt', 'termux-setup-storage', 'termux-reload-settings',
	'termux-change-repo', 'ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'echo',
	'whoami', 'id', 'uname', 'env', 'clear', 'help', 'history', 'chsh', 'rm',
	'cp', 'mv', 'which', 'chmod', 'tar', 'exit', 'bash',
];

/**
 * Real commands the lessons name that arrive via `pkg install`, mapped to the
 * package that provides them. Before install they behave like a real device:
 * `command not found`. After install they hit NOT_SIMULATED and explain
 * themselves instead of pretending to run.
 */
export const PACKAGE_COMMANDS: Record<string, string> = {
	nano: 'nano', vim: 'vim', git: 'git', python: 'python', python3: 'python',
	node: 'nodejs', npm: 'nodejs', ssh: 'openssh', curl: 'curl', wget: 'wget',
	man: 'man',
};

/**
 * Every command name the shell knows about — used for fish-style highlighting
 * and by the "no name highlights as valid then reports command not found"
 * invariant. Anything added here MUST have a branch in `runCommand()`.
 */
export const COMMAND_NAMES = [...BUILTIN_NAMES, ...Object.keys(PACKAGE_COMMANDS)];

/**
 * Full command lines offered as fish-style autosuggestions.
 *
 * Audited line-by-line against every fenced block and every `hint=` in
 * src/content/docs: the old 14-entry list was all pkg/ls/uname, so the
 * filesystem lesson — whose entire exercise is pwd/cd — produced no ghost text
 * at all until history filled in. Order matters: `suggest()` takes the first
 * prefix match, so the shortest/most-taught form of each command comes first.
 */
export const SUGGESTIONS = [
	// packages — the rhythm taught in packages.mdx and installing.mdx
	'pkg update', 'pkg update && pkg upgrade', 'pkg upgrade',
	'pkg install fish', 'pkg install git', 'pkg install nano',
	'pkg install python', 'pkg install nodejs', 'pkg install vim',
	'pkg install openssh', 'pkg install man',
	'pkg search python', 'pkg list-installed', 'pkg uninstall nano',
	// shell — friendly-shell.mdx
	'chsh -s fish', 'chsh -s bash', 'which fish',
	// files & folders — files-and-folders.mdx. This lesson was added after the
	// list was last audited, so its whole exercise (mkdir/touch/cat/cp/mv/rm/tar)
	// produced no ghost text at all — the exact defect the audit that produced
	// this array set out to fix. Placed BEFORE the storage and keyboard groups
	// because `suggest()` returns the FIRST prefix match: this lesson comes
	// earlier in the course, so `cat ` and `tar ` should complete to its short
	// teaching forms, not to storage's long backup paths.
	'mkdir projects', 'mkdir -p ~/a/b/c',
	'touch notes.txt', 'cat notes.txt', 'cat > notes.txt',
	'cp notes.txt notes-backup.txt', 'cp -r ~/projects ~/projects-copy',
	'mv notes.txt shopping.txt',
	'rm notes-backup.txt', 'rm -r ~/projects-copy',
	'tar czf projects.tar.gz -C ~ projects',
	'tar tzf projects.tar.gz', 'tar xzf projects.tar.gz',
	'chmod +x backup.sh',
	// storage — storage.mdx
	'termux-setup-storage', 'termux-reload-settings',
	'ls ~/storage', 'ls ~/storage/shared', 'cd ~/storage/downloads',
	'mkdir ~/projects', 'mkdir ~/storage/shared/termux-backups',
	'tar czf ~/storage/shared/termux-backups/projects-backup.tar.gz -C ~ projects',
	'tar tzf ~/storage/shared/termux-backups/projects-backup.tar.gz',
	'pkg list-installed > ~/storage/shared/termux-backups/packages.txt',
	// navigation — filesystem.mdx
	'pwd', 'ls', 'ls -a', 'ls -l', 'cd ~', 'cd ..', 'cd ~/projects',
	// environment — filesystem.mdx puts $PREFIX in a table AND runs it in a
	// fenced block, so the suggestion has to match what the lesson types
	'echo $PREFIX', 'echo $HOME', 'env',
	// keyboard — extra-keys.mdx
	'mkdir -p ~/.termux', 'nano ~/.termux/termux.properties',
	'cat ~/.termux/termux.properties',
	// first session + getting unstuck
	'whoami', 'id', 'uname -a', 'history', 'help', 'clear', 'ls --help',
];

/**
 * Fish-style autosuggestion: the best full-line completion for `buffer`.
 * Prefers the most recent matching history entry, then the curated list.
 * Returns only the remaining suffix (what fish shows in grey), or ''.
 */
export function suggest(buffer: string, history: string[]): string {
	if (!buffer) return '';
	for (let i = history.length - 1; i >= 0; i--) {
		if (history[i].startsWith(buffer) && history[i] !== buffer) return history[i].slice(buffer.length);
	}
	const hit = SUGGESTIONS.find((s) => s.startsWith(buffer) && s !== buffer);
	return hit ? hit.slice(buffer.length) : '';
}

const PKG_SUBCOMMANDS = ['update', 'upgrade', 'install', 'uninstall', 'search', 'list-installed'];

/** Colour `$VAR` / `${VAR}` inside an argument list, fish-style. */
function paintVars(rest: string): string {
	return rest.replace(/\$\{?\w+\}?/g, (v) => `${MAGENTA}${v}${RESET}`);
}

function paintSegment(seg: string, installed?: ReadonlySet<string>): string {
	const m = seg.match(/^(\s*)(\S+)([\s\S]*)$/);
	if (!m) return seg;
	const [, lead, head, rest] = m;
	// A path invocation (./backup.sh, /usr/bin/x) is never a "command name" —
	// leave it neutral rather than screaming red at a perfectly valid line.
	if (head.startsWith('./') || head.startsWith('/') || head.startsWith('~')) {
		return `${lead}${head}${paintVars(rest)}`;
	}
	// Cyan means "this will run". A package command is only runnable once it is
	// installed — which is exactly what fish shows you on a real device. Resolve
	// through PACKAGE_COMMANDS so `node` goes cyan after `pkg install nodejs`.
	const provider = PACKAGE_COMMANDS[head];
	const runnable =
		BUILTIN_NAMES.includes(head) || !!installed?.has(head) || (!!provider && !!installed?.has(provider));
	if (runnable) {
		let tail = rest;
		if (head === 'pkg') {
			// The old highlight() only ever coloured token one, so `pkg instal git`
			// showed `pkg` in confident cyan with the typo uncoloured — despite
			// first-session.mdx promising "typos turn red".
			tail = rest.replace(/^(\s+)(\S+)/, (_, sp: string, sub: string) =>
				PKG_SUBCOMMANDS.includes(sub)
					? `${sp}${CYAN}${sub}${RESET}`
					: PKG_SUBCOMMANDS.some((s) => s.startsWith(sub))
						? `${sp}${sub}`
						: `${sp}${RED}${sub}${RESET}`
			);
		}
		return `${lead}${CYAN}${head}${RESET}${paintVars(tail)}`;
	}
	const known = COMMAND_NAMES.some((c) => c.startsWith(head));
	if (known) return `${lead}${head}${paintVars(rest)}`;
	return `${lead}${RED}${head}${RESET}${paintVars(rest)}`;
}

/**
 * Colour a command line fish-style: cyan when the head will actually run,
 * default while it is still a valid prefix, red once it can't become valid.
 * Chain operators are brass and `$VARs` are dusty rose, so `&&` and `$PREFIX`
 * read as *syntax* rather than as part of the previous word.
 *
 * `installed` is optional so the pure-string call sites (and tests) still work.
 */
export function highlight(buffer: string, installed?: ReadonlySet<string>): string {
	const parts = buffer.split(/(\s*(?:&&|\|\||;)\s*)/);
	let out = '';
	for (let i = 0; i < parts.length; i++) {
		out += i % 2 === 1 ? `${YELLOW}${parts[i]}${RESET}` : paintSegment(parts[i], installed);
	}
	return out;
}

type FsNode = {
	type: 'dir' | 'file';
	content?: string;
	children?: Record<string, FsNode>;
	/** Exec bit. Never set under ~/storage — that filesystem has none. */
	exec?: boolean;
	/** Member list when the node is a tar archive, so `tar tzf` can list it. */
	members?: string[];
	mtime?: number;
};

/** Result of running a whole command line (which may be several `&&` segments). */
export interface ExecResult {
	/** Lines to print (already ANSI-coloured). */
	output: string[];
	/** When true, the caller should wipe the screen before printing the prompt. */
	clear?: boolean;
	/**
	 * Exit status of the last segment; 0 is success. Drives `&&` / `||` here and
	 * lets the caller react to failure. (This replaces the old `storageLinked`
	 * flag, which merely duplicated `ShellState.storageLinked` and was read by
	 * nobody — the caller now watches the authoritative state object instead.)
	 */
	code: number;
}

/** Mutable shell state threaded between commands. */
export interface ShellState {
	cwd: string; // absolute path
	fs: FsNode;
	env: Record<string, string>;
	packagesUpdated: boolean;
	storageLinked: boolean;
	installed: Set<string>;
	/** Login shell. `chsh -s fish` flips it — the Friendly Shell lesson acts this out. */
	shell: 'bash' | 'fish';
	/** Command history, owned here so `history` works inside `&&` chains and `>`. */
	history: string[];
}

const BOOT_TIME = Date.now();

function dir(children: Record<string, FsNode> = {}): FsNode {
	return { type: 'dir', children, mtime: BOOT_TIME };
}

function freshFs(): FsNode {
	return dir({
		data: dir({
			data: dir({
				'com.termux': dir({
					files: dir({
						home: dir({ '.termux': dir() }),
						usr: dir({ bin: dir(), etc: dir(), lib: dir() }),
					}),
				}),
			}),
		}),
		// Present but not writable — so `touch /sdcard/x` fails the way it does on
		// a device, instead of silently succeeding into a fake tree.
		sdcard: dir(),
		system: dir({ bin: dir() }),
	});
}

export function createState(): ShellState {
	return {
		cwd: HOME,
		fs: freshFs(),
		env: {
			HOME,
			PREFIX,
			SHELL: `${PREFIX}/bin/bash`,
			USER: 'u0_a123',
			PATH: `${PREFIX}/bin`,
			TERM: 'xterm-256color',
			LANG: 'en_US.UTF-8',
		},
		packagesUpdated: false,
		storageLinked: false,
		installed: new Set(),
		shell: 'bash', // real Termux ships bash; the fish lesson changes this
		history: [],
	};
}

/** Collapse the home prefix to `~` for display. */
export function prettyPath(path: string): string {
	return path === HOME ? '~' : path.startsWith(HOME + '/') ? '~' + path.slice(HOME.length) : path;
}

function normalize(base: string, target: string): string {
	if (!target) return base;
	let start = target.startsWith('/') ? '' : base;
	if (target === '~' || target.startsWith('~/')) start = '', (target = HOME + target.slice(1));
	const parts = (start + '/' + target).split('/').filter(Boolean);
	const stack: string[] = [];
	for (const p of parts) {
		if (p === '.') continue;
		if (p === '..') stack.pop();
		else stack.push(p);
	}
	return '/' + stack.join('/');
}

function resolve(fs: FsNode, path: string): FsNode | null {
	const parts = path.split('/').filter(Boolean);
	let node: FsNode = fs;
	for (const p of parts) {
		if (node.type !== 'dir' || !node.children?.[p]) return null;
		node = node.children[p];
	}
	return node;
}

function parentOf(path: string): string {
	return path.slice(0, path.lastIndexOf('/')) || '/';
}

function baseOf(path: string): string {
	return path.slice(path.lastIndexOf('/') + 1);
}

function mkdirp(fs: FsNode, path: string): FsNode {
	const parts = path.split('/').filter(Boolean);
	let node = fs;
	for (const p of parts) {
		node.children ??= {};
		node.children[p] ??= dir();
		node = node.children[p];
	}
	return node;
}

/** Android only lets Termux write inside its own files/ tree. */
function writable(path: string): boolean {
	return path === TERMUX_FILES || path.startsWith(TERMUX_FILES + '/');
}

/** True for anything under ~/storage — the FUSE layer with no exec bit. */
function onSharedStorage(path: string): boolean {
	return path === HOME + '/storage' || path.startsWith(HOME + '/storage/');
}

/**
 * Directory listing for Tab completion. Exported so the terminal can complete
 * paths without reaching into the FS tree itself.
 */
export function listDir(state: ShellState, path: string): { name: string; isDir: boolean }[] | null {
	const node = resolve(state.fs, normalize(state.cwd, path));
	if (!node || node.type !== 'dir') return null;
	return Object.entries(node.children ?? {}).map(([name, c]) => ({ name, isDir: c.type === 'dir' }));
}

// Packages the tutorial pretends it can install, with a plausible description.
const PKG_DB: Record<string, string> = {
	fish: 'Friendly Interactive SHell — autosuggestions + syntax highlighting',
	git: 'distributed version control system',
	python: 'Python 3 programming language',
	nodejs: 'Node.js JavaScript runtime (node, npm)',
	vim: 'Vi IMproved text editor',
	nano: 'small, friendly text editor',
	openssh: 'SSH client and server',
	man: 'manual pages — the built-in help for every command',
	curl: 'command-line data transfer tool',
	wget: 'network downloader',
	tsu: 'switch users / fake-root helper',
	'termux-api': 'CLI access to Android device features',
};

/**
 * Real commands this teaching shell deliberately declines to fake, and why.
 * A yellow "here is what this is and where it does work" beats both a silent
 * lie and a red `command not found` a beginner reads as personal failure.
 */
interface Declined {
	why: string;
	then?: string;
}
const NOT_SIMULATED: Record<string, Declined> = {
	/*
	 * `bash` is TAUGHT, in four places: friendly-shell.mdx offers it as the
	 * escape hatch when a guide assumes bash, and installing.mdx, where-next.mdx
	 * and the cheatsheet repeat it. Before this entry the simulator had no branch
	 * for it, so a learner following the lesson on the page that HOSTS a terminal
	 * typed the command they had just been told to use and watched it highlight
	 * red as "command not found" — the lesson contradicted by the widget beside
	 * it. `exit` had the identical gap and was fixed after an earlier audit; this
	 * is the same defect, found the same way.
	 */
	bash: {
		why: 'starts a nested interactive shell this practice terminal cannot host.',
		then: 'On your phone it drops you straight into bash; type exit to come back to fish.',
	},
	nano: {
		why: 'takes over the whole screen, and this practice terminal only has one line.',
		then: 'On your phone it opens right here. Save with Ctrl-O, Enter, then Ctrl-X.',
	},
	vim: {
		why: 'takes over the whole screen, and this practice terminal only has one line.',
		then: 'On your phone: press i to type, Esc, then :wq and Enter to save.',
	},
	git: {
		why: 'needs a network, and this practice terminal is offline by design.',
		then: 'It works normally on your phone once you have run: pkg install git',
	},
	python: {
		why: 'starts an interactive interpreter this practice terminal cannot host.',
		then: 'Try the Live Sandbox on the packages lesson — it runs a real Python 3.',
	},
	python3: {
		why: 'starts an interactive interpreter this practice terminal cannot host.',
		then: 'Try the Live Sandbox on the packages lesson — it runs a real Python 3.',
	},
	node: {
		why: 'starts an interactive interpreter this practice terminal cannot host.',
		then: 'It works normally on your phone once you have run: pkg install nodejs',
	},
	npm: {
		why: 'needs a network, and this practice terminal is offline by design.',
		then: 'It works normally on your phone once you have run: pkg install nodejs',
	},
	ssh: {
		why: 'needs a network, and this practice terminal is offline by design.',
		then: 'Connecting to other machines is covered in the Intermediate course.',
	},
	curl: { why: 'needs a network, and this practice terminal is offline by design.' },
	wget: { why: 'needs a network, and this practice terminal is offline by design.' },
	man: {
		why: 'opens a full-screen pager this practice terminal cannot draw.',
		then: "Here, try '<command> --help' instead — every built-in supports it.",
	},
	'termux-change-repo': {
		why: 'opens a full-screen menu this practice terminal cannot draw.',
		then: "On your phone: pick a mirror, press Enter, then run 'pkg update'.",
	},
};

/** One-line usage, so `--help` works and the course stops depending on a cheatsheet. */
const USAGE: Record<string, string> = {
	ls: 'ls [-a] [-l] [path...]        list what is in a directory',
	cd: 'cd [path]                     change directory ("cd" alone goes home)',
	pwd: 'pwd                           print the directory you are in',
	cat: 'cat <file>                    print a file',
	mkdir: 'mkdir [-p] <dir>              make a directory (-p makes parents too)',
	touch: 'touch <file>                  create an empty file',
	rm: 'rm [-r] [-f] <path>           delete — permanently, no recycle bin',
	cp: 'cp [-r] <src> <dst>           copy',
	mv: 'mv <src> <dst>                move or rename',
	chmod: 'chmod +x|-x|<mode> <file>     change permissions (needs a real filesystem)',
	tar: 'tar czf <archive> [-C <dir>] <paths...>   make a .tar.gz backup\n' +
		'tar tzf <archive>             list what is inside one\n' +
		'tar xzf <archive> [-C <dir>]  unpack one',
	echo: 'echo <text>                   print text ($VARS are expanded)',
	which: 'which <command>               show which file a command runs',
	env: 'env                           print every environment variable',
	pkg: 'pkg update | upgrade | install <p> | uninstall <p> | search <q> | list-installed',
	chsh: 'chsh -s <shell>               change your login shell (fish or bash)',
	uname: 'uname [-a]                    print system information',
	history: 'history                       list the commands you have run',
};

function stripAnsi(s: string): string {
	return s.replace(/\x1b\[[0-9;]*m/g, '');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function stamp(ms: number): string {
	const d = new Date(ms);
	return (
		`${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, ' ')} ` +
		`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
	);
}

function sizeOf(node: FsNode): number {
	if (node.type === 'dir') return 4096;
	if (node.members) return node.members.length * 128 + 96; // plausible gzip size
	return (node.content ?? '').length;
}

/**
 * Permission string for `ls -l`.
 *
 * Shared storage really does report `drwxrwx---` / `-rw-rw----` with no `x`
 * anywhere — that is the whole reason `chmod +x` cannot stick there, and the
 * storage lesson's central warning. Showing it makes the rule visible instead
 * of asking the reader to take it on faith.
 */
function modeOf(node: FsNode, path: string): string {
	if (onSharedStorage(path)) return node.type === 'dir' ? 'drwxrwx---' : '-rw-rw----';
	if (node.type === 'dir') return 'drwx------';
	return node.exec ? '-rwx------' : '-rw-------';
}

function help(state: ShellState): string[] {
	return [
		`${BOLD}Practice terminal — commands it really runs:${RESET}`,
		`  ${CYAN}pkg${RESET} update | upgrade | install <p> | uninstall <p> | search <q>`,
		`  ${CYAN}pkg${RESET} list-installed`,
		`  ${CYAN}termux-setup-storage${RESET}   bridge Termux to Android storage`,
		`  ${CYAN}termux-reload-settings${RESET} apply termux.properties changes`,
		`  ${CYAN}ls${RESET} [-a] [-l]  ${CYAN}cd${RESET}  ${CYAN}pwd${RESET}  ${CYAN}cat${RESET}  ${CYAN}mkdir${RESET} [-p]  ${CYAN}touch${RESET}`,
		`  ${CYAN}cp${RESET}  ${CYAN}mv${RESET}  ${CYAN}rm${RESET} [-r]  ${CYAN}chmod${RESET}  ${CYAN}which${RESET}  ${CYAN}tar${RESET} czf|tzf|xzf`,
		`  ${CYAN}chsh${RESET} -s fish  ${CYAN}echo${RESET}  ${CYAN}env${RESET}  ${CYAN}whoami${RESET}  ${CYAN}id${RESET}  ${CYAN}uname${RESET} [-a]`,
		`  ${CYAN}apt${RESET}  ${CYAN}history${RESET}  ${CYAN}clear${RESET}  ${CYAN}help${RESET}`,
		``,
		`${BOLD}It also understands:${RESET}`,
		`  ${YELLOW}&&${RESET} ${DIM}and${RESET} ${YELLOW}||${RESET} ${DIM}and${RESET} ${YELLOW};${RESET}  chain commands`,
		`  ${MAGENTA}$PREFIX${RESET} ${MAGENTA}$HOME${RESET}      variables expand`,
		`  ${YELLOW}>${RESET} ${DIM}and${RESET} ${YELLOW}>>${RESET}         send output into a file`,
		`  ${CYAN}<command> --help${RESET}  what a command takes`,
		``,
		`${DIM}Deliberately not faked: editors (nano, vim), interpreters (python,${RESET}`,
		`${DIM}node), anything needing a network (git, curl, ssh), and pipes. Type${RESET}`,
		`${DIM}one and it tells you where it does work.${RESET}`,
		state.storageLinked
			? `${DIM}Storage is bridged. Backups go to ~/storage/shared/.${RESET}`
			: `${DIM}Start with: pkg update  —  then termux-setup-storage.${RESET}`,
	];
}

/* ------------------------------------------------------------------ *
 * Line parsing: chaining, quoting, variable expansion, redirection.
 * All three were missing, and all three returned confidently wrong
 * answers rather than errors — `pkg update && pkg upgrade` silently
 * discarded the upgrade, `echo $PREFIX` printed the literal string.
 * ------------------------------------------------------------------ */

type Joiner = '&&' | '||' | ';' | null;

function splitChain(line: string): { text: string; joiner: Joiner }[] {
	const segs: { text: string; joiner: Joiner }[] = [];
	let cur = '';
	let joiner: Joiner = null;
	let quote: string | null = null;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (quote) {
			cur += c;
			if (c === quote) quote = null;
			continue;
		}
		if (c === "'" || c === '"') { quote = c; cur += c; continue; }
		if (c === '&' && line[i + 1] === '&') { segs.push({ text: cur, joiner }); joiner = '&&'; cur = ''; i++; continue; }
		if (c === '|' && line[i + 1] === '|') { segs.push({ text: cur, joiner }); joiner = '||'; cur = ''; i++; continue; }
		if (c === ';') { segs.push({ text: cur, joiner }); joiner = ';'; cur = ''; continue; }
		cur += c;
	}
	segs.push({ text: cur, joiner });
	return segs.filter((s, i) => s.text.trim() !== '' || i === 0);
}

function expandVars(s: string, env: Record<string, string>): string {
	return s.replace(/\$\{(\w+)\}|\$(\w+)/g, (_, a, b) => env[a ?? b] ?? '');
}

interface Parsed {
	tokens: string[];
	redirect: { path: string; append: boolean } | null;
	pipe?: boolean;
}

function tokenize(line: string, env: Record<string, string>): Parsed {
	const tokens: string[] = [];
	let cur = '';
	let has = false;
	let redirect: Parsed['redirect'] = null;
	let pending: 'w' | 'a' | null = null;
	const push = () => {
		if (!has) return;
		if (pending) { redirect = { path: cur, append: pending === 'a' }; pending = null; }
		else tokens.push(cur);
		cur = '';
		has = false;
	};
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (c === "'") { // single quotes are literal — no expansion, like a real shell
			has = true;
			i++;
			while (i < line.length && line[i] !== "'") cur += line[i++];
			continue;
		}
		if (c === '"') {
			has = true;
			i++;
			let s = '';
			while (i < line.length && line[i] !== '"') s += line[i++];
			cur += expandVars(s, env);
			continue;
		}
		if (c === ' ' || c === '\t') { push(); continue; }
		if (c === '>') {
			push();
			if (line[i + 1] === '>') { pending = 'a'; i++; } else pending = 'w';
			continue;
		}
		if (c === '|') return { tokens, redirect, pipe: true };
		if (c === '$') {
			const m = line.slice(i).match(/^\$\{(\w+)\}|^\$(\w+)/);
			if (m) {
				has = true;
				cur += env[m[1] ?? m[2]] ?? '';
				i += m[0].length - 1;
				continue;
			}
		}
		has = true;
		cur += c;
	}
	push();
	return { tokens, redirect };
}

interface Ran {
	output: string[];
	clear?: boolean;
	code: number;
}

/** Write captured output into a file node. Returns an error string, or null. */
function writeFile(state: ShellState, rawPath: string, body: string, append: boolean): string | null {
	const full = normalize(state.cwd, rawPath);
	if (!writable(full)) return `bash: ${rawPath}: Permission denied`;
	const parent = resolve(state.fs, parentOf(full));
	if (!parent || parent.type !== 'dir') return `bash: ${rawPath}: No such file or directory`;
	parent.children ??= {};
	const existing = parent.children[baseOf(full)];
	const prev = append && existing?.type === 'file' ? (existing.content ?? '') + '\n' : '';
	parent.children[baseOf(full)] = { type: 'file', content: prev + body, mtime: Date.now() };
	return null;
}

/* ------------------------------------------------------------------ *
 * Command implementations.
 * ------------------------------------------------------------------ */

/** Guards against a runaway `./script.sh` that calls itself. */
let scriptDepth = 0;

function declined(cmd: string, d: Declined): Ran {
	const out = [`${YELLOW}${cmd} ${d.why}${RESET}`];
	if (d.then) out.push(`${DIM}${d.then}${RESET}`);
	return { output: out, code: 1 };
}

function notFound(state: ShellState, name: string): Ran {
	return { output: [`${RED}${state.shell}: ${name}: command not found${RESET}`], code: 127 };
}

function runCommand(state: ShellState, tokens: string[]): Ran {
	const [cmd, ...args] = tokens;
	const out: string[] = [];
	let code = 0;
	const err = (m: string) => { out.push(`${RED}${m}${RESET}`); code = 1; };
	const note = (m: string) => out.push(`${DIM}${m}${RESET}`);

	// `<command> --help` for everything the sandbox implements. The course
	// otherwise graduates people whose only reference is the cheatsheet.
	if (args.includes('--help') || args.includes('-h')) {
		const u = USAGE[cmd];
		if (u) {
			return {
				output: [
					...u.split('\n').map((l) => {
						const head = l.split(/\s{2,}/)[0];
						return `${CYAN}${head}${RESET}${l.slice(head.length)}`;
					}),
					`${DIM}On a real device: pkg install man, then 'man ${cmd}'.${RESET}`,
				],
				code: 0,
			};
		}
	}

	// A real command that has not been installed yet behaves exactly as it does
	// on a device — and then says which package provides it.
	if (cmd in PACKAGE_COMMANDS && !state.installed.has(PACKAGE_COMMANDS[cmd])) {
		const r = notFound(state, cmd);
		r.output.push(`${DIM}Install it first: pkg install ${PACKAGE_COMMANDS[cmd]}${RESET}`);
		return r;
	}
	if (cmd in NOT_SIMULATED) return declined(cmd, NOT_SIMULATED[cmd]);

	switch (cmd) {
		case 'help':
			return { output: help(state), code: 0 };

		case 'clear':
			return { output: [], clear: true, code: 0 };

		/*
		 * `exit` slipped through the "lessons instruct commands the simulator
		 * cannot run" sweep because it is a shell BUILTIN, not a package command —
		 * so neither the PACKAGE_COMMANDS pass nor the pkg-install pass caught it.
		 * Meanwhile three files instruct it: friendly-shell.mdx ("type `exit` in
		 * every open session"), where-next.mdx ("`exit` to come back"), and the
		 * cheatsheet documents it in two tables. Typing it highlighted RED as a
		 * typo and answered "command not found" — the exact trust bug the sweep
		 * existed to kill.
		 *
		 * Nothing here can actually close a session, so it says so plainly rather
		 * than faking a logout: the sandbox is one session and always has been.
		 */
		case 'exit':
			return {
				output: [
					`${DIM}logout${RESET}`,
					`${YELLOW}This practice terminal is a single session, so there is nothing to exit.${RESET}`,
					`${DIM}On your device this closes the current session — or drops you back to`,
					`fish if you had typed ${RESET}bash${DIM} to run something bash-shaped.${RESET}`,
				],
				code: 0,
			};

		case 'echo':
			return { output: [args.join(' ')], code: 0 };

		case 'pwd':
			return { output: [state.cwd], code: 0 };

		case 'whoami':
			return { output: [state.env.USER], code: 0 };

		case 'id':
			return {
				output: [
					`uid=10123(${state.env.USER}) gid=10123(${state.env.USER})`,
					`groups=10123(${state.env.USER}),3003(inet),9997(everybody)`,
				],
				code: 0,
			};

		case 'uname':
			return {
				output: [args.includes('-a') ? 'Linux localhost 4.14.190 #1 SMP PREEMPT aarch64 Android' : 'Linux'],
				code: 0,
			};

		case 'env':
			return { output: Object.entries(state.env).map(([k, v]) => `${k}=${v}`), code: 0 };

		case 'history':
			return {
				output: state.history.map((h, i) => `${DIM}${String(i + 1).padStart(3)}${RESET}  ${h}`),
				code: 0,
			};

		case 'cd': {
			const raw = args.find((a) => !a.startsWith('-')) ?? HOME;
			const target = normalize(state.cwd, raw);
			const node = resolve(state.fs, target);
			if (!node) {
				err(`cd: ${raw}: No such file or directory`);
				if (onSharedStorage(target) && !state.storageLinked)
					note("~/storage doesn't exist yet — run termux-setup-storage first.");
			} else if (node.type !== 'dir') err(`cd: ${raw}: Not a directory`);
			else state.cwd = target;
			return { output: out, code };
		}

		case 'ls': {
			const flags = args.filter((a) => a.startsWith('-')).join('');
			const paths = args.filter((a) => !a.startsWith('-'));
			const showHidden = flags.includes('a');
			const long = flags.includes('l');
			const targets = paths.length ? paths : ['.'];
			for (const raw of targets) {
				const target = normalize(state.cwd, raw);
				const node = resolve(state.fs, target);
				if (targets.length > 1) out.push(`${raw}:`);
				if (!node) {
					err(`ls: cannot access '${raw}': No such file or directory`);
					if (onSharedStorage(target) && !state.storageLinked)
						note("~/storage doesn't exist yet — run termux-setup-storage first.");
					continue;
				}
				if (node.type === 'file') {
					out.push(long ? longLine(baseOf(target), node, target, state) : raw);
					continue;
				}
				const entries = Object.entries(node.children ?? {})
					.filter(([n]) => showHidden || !n.startsWith('.'))
					.sort(([a], [b]) => a.localeCompare(b));
				if (!entries.length) continue;
				if (long) {
					// `total` is disk blocks, same as coreutils prints.
					const blocks = entries.reduce((s, [, c]) => s + Math.ceil(sizeOf(c) / 1024) * 4, 0);
					out.push(`total ${blocks}`);
					for (const [n, c] of entries) out.push(longLine(n, c, `${target}/${n}`, state));
				} else {
					out.push(entries.map(([n, c]) => (c.type === 'dir' ? `${CYAN}${n}${RESET}` : n)).join('   '));
				}
			}
			return { output: out, code };
		}

		case 'cat': {
			if (!args.length) return { output: [], code: 0 };
			for (const raw of args.filter((a) => !a.startsWith('-'))) {
				const target = normalize(state.cwd, raw);
				const node = resolve(state.fs, target);
				if (!node) err(`cat: ${raw}: No such file or directory`);
				else if (node.type === 'dir') err(`cat: ${raw}: Is a directory`);
				else if (node.members) {
					// Real `cat` on a .tar.gz spews binary. Say so, and point at the
					// command that actually answers "what is in my backup?".
					note(`(binary file — a gzip archive of ${node.members.length} items)`);
					note(`List it instead with: tar tzf ${raw}`);
				} else out.push(...(node.content ?? '').split('\n'));
			}
			return { output: out, code };
		}

		case 'mkdir': {
			const parents = args.some((a) => /^-\w*p/.test(a));
			const ops = args.filter((a) => !a.startsWith('-'));
			if (!ops.length) return err('mkdir: missing operand'), { output: out, code };
			for (const raw of ops) {
				const full = normalize(state.cwd, raw);
				if (!writable(full)) { err(`mkdir: cannot create directory '${raw}': Permission denied`); continue; }
				// mkdirp() used to create every missing parent unconditionally, so
				// `mkdir ~/storage/shared/termux-backups` succeeded even when storage
				// had never been bridged — teaching a false success at exactly the
				// step whose device-side precondition is the lesson's whole point.
				if (onSharedStorage(full) && !state.storageLinked) {
					err(`mkdir: cannot create directory '${raw}': No such file or directory`);
					note("~/storage doesn't exist yet — run termux-setup-storage first.");
					continue;
				}
				if (resolve(state.fs, full)) {
					if (!parents) err(`mkdir: cannot create directory '${raw}': File exists`);
					continue;
				}
				const parent = resolve(state.fs, parentOf(full));
				if (!parent) {
					if (!parents) { err(`mkdir: cannot create directory '${raw}': No such file or directory`); continue; }
					mkdirp(state.fs, full);
					continue;
				}
				if (parent.type !== 'dir') { err(`mkdir: cannot create directory '${raw}': Not a directory`); continue; }
				parent.children ??= {};
				parent.children[baseOf(full)] = dir();
			}
			return { output: out, code };
		}

		case 'touch': {
			const ops = args.filter((a) => !a.startsWith('-'));
			if (!ops.length) return err('touch: missing file operand'), { output: out, code };
			for (const raw of ops) {
				const full = normalize(state.cwd, raw);
				if (!writable(full)) { err(`touch: cannot touch '${raw}': Permission denied`); continue; }
				const parent = resolve(state.fs, parentOf(full));
				if (parent?.type !== 'dir') {
					err(`touch: cannot touch '${raw}': No such file or directory`);
					if (onSharedStorage(full) && !state.storageLinked)
						note("~/storage doesn't exist yet — run termux-setup-storage first.");
					continue;
				}
				parent.children ??= {};
				const existing = parent.children[baseOf(full)];
				if (existing) existing.mtime = Date.now();
				else parent.children[baseOf(full)] = { type: 'file', content: '', mtime: Date.now() };
			}
			return { output: out, code };
		}

		case 'chmod': {
			const ops = args.filter((a) => !a.startsWith('-') || /^-[xrw]$/.test(a));
			const mode = ops[0];
			const files = ops.slice(1);
			if (!mode || !files.length) return err('chmod: missing operand'), { output: out, code };
			// `+x`, or an octal mode whose OWNER digit is odd (7, 5, 3, 1 = +x).
			const octal = mode.match(/^[0-7]{3,4}$/) ? mode.slice(-3, -2) : '';
			const wantsExec = /\+x/.test(mode) || (octal !== '' && Number(octal) % 2 === 1);
			for (const raw of files) {
				const full = normalize(state.cwd, raw);
				const node = resolve(state.fs, full);
				if (!node) { err(`chmod: cannot access '${raw}': No such file or directory`); continue; }
				// The storage lesson's central trap, made real: on shared storage the
				// call SUCCEEDS and the bit does not stick. Nothing is printed —
				// because on a device nothing is printed. The lesson lands later,
				// when ./script.sh still says Permission denied.
				if (onSharedStorage(full)) continue;
				if (/-x/.test(mode)) node.exec = false;
				else if (wantsExec) node.exec = true;
			}
			return { output: out, code };
		}

		case 'termux-setup-storage': {
			if (state.storageLinked) {
				note('Shared storage already configured.');
				return { output: out, code: 0 };
			}
			state.storageLinked = true;
			const home = resolve(state.fs, HOME)!;
			home.children!['storage'] = dir({
				shared: dir(), downloads: dir(), dcim: dir(),
				music: dir(), pictures: dir(), movies: dir(),
			});
			// Unaligned on purpose: the old column-padded block was authored at
			// desktop width and wrapped mid-arrow on a 390px phone.
			//
			// BUDGET: keep every line here under ~50 columns with ANSI stripped —
			// that is what fits a 390px phone at this font size. Measure before
			// adding a longer one; nothing enforces it. (This claimed 31 columns
			// long after the block had grown past it.)
			return {
				output: [
					`${YELLOW}[Android] Allow Termux to access photos, media${RESET}`,
					`${YELLOW}and files?${RESET}  ${GREEN}ALLOW${RESET}`,
					`${GREEN}✓${RESET} Created ${CYAN}~/storage${RESET}:`,
					`  shared → /sdcard`,
					`  downloads → /sdcard/Download`,
					`  dcim → /sdcard/DCIM`,
					`  music, pictures, movies`,
					`${DIM}Run 'ls ~/storage' to see them.${RESET}`,
					`${DIM}Tapped Deny by mistake? Settings → Apps → Termux →${RESET}`,
					`${DIM}Permissions → Files and media → Allow, then re-run this.${RESET}`,
				],
				code: 0,
			};
		}

		case 'apt': {
			// apt is real in Termux; pkg is the friendly wrapper. Route it rather
			// than dead-ending, then say why pkg is the one the course teaches.
			if (!args.length) return { output: [`${DIM}Tip: use 'pkg' — the Termux-friendly wrapper around apt.${RESET}`], code: 0 };
			const r = runCommand(state, ['pkg', ...args]);
			r.output.unshift(`${DIM}(pkg is the Termux wrapper for this — same result, shorter to type.)${RESET}`);
			return r;
		}

		case 'pkg':
			return pkg(state, args);

		case 'chsh': {
			// `chsh -s fish` — the Friendly Shell lesson's payoff.
			const target = args[args.indexOf('-s') + 1] ?? args[0];
			if (!target) return err('chsh: usage: chsh -s <shell>'), { output: out, code };
			const name = target.replace(/.*\//, '');
			if (name !== 'fish' && name !== 'bash') return err(`chsh: ${target}: shell not found`), { output: out, code };
			if (name === 'fish' && !state.installed.has('fish')) {
				err('chsh: fish: shell not found');
				note('Install it first: pkg install fish');
				return { output: out, code };
			}
			state.shell = name;
			state.env.SHELL = `${PREFIX}/bin/${name}`;
			return {
				output: [
					`${GREEN}✓${RESET} Login shell changed to ${CYAN}${name}${RESET}.`,
					`${DIM}Watch the prompt below: bash shows ~ $ and fish shows ~ ❯.${RESET}`,
					`${DIM}On a real device you'd fully close and reopen Termux first.${RESET}`,
				],
				code: 0,
			};
		}

		case 'which': {
			const q = args.find((a) => !a.startsWith('-'));
			if (!q) return { output: [], code: 0 };
			const pkgName = PACKAGE_COMMANDS[q];
			if (BUILTIN_NAMES.includes(q) || (pkgName && state.installed.has(pkgName)) || state.installed.has(q))
				return { output: [`${PREFIX}/bin/${q}`], code: 0 };
			out.push(`${DIM}which: no ${q} in (${state.env.PATH})${RESET}`);
			if (pkgName) note(`Install it with: pkg install ${pkgName}`);
			return { output: out, code: 1 };
		}

		case 'rm': {
			const paths = args.filter((a) => !a.startsWith('-'));
			const recursive = args.some((a) => /^-\w*[rR]/.test(a));
			const force = args.some((a) => /^-\w*f/.test(a));
			if (!paths.length) {
				if (!force) err('rm: missing operand');
				return { output: out, code: force ? 0 : 1 };
			}
			for (const raw of paths) {
				const full = normalize(state.cwd, raw);
				// coreutils' real failsafe, verbatim. Worth meeting once, safely.
				if (full === '/') {
					err("rm: it is dangerous to operate recursively on '/'");
					err('rm: use --no-preserve-root to override this failsafe');
					continue;
				}
				const parent = resolve(state.fs, parentOf(full));
				const node = resolve(state.fs, full);
				if (!node || !parent?.children) {
					if (!force) err(`rm: cannot remove '${raw}': No such file or directory`);
					continue;
				}
				if (!writable(full)) { err(`rm: cannot remove '${raw}': Permission denied`); continue; }
				if (node.type === 'dir' && !recursive) { err(`rm: cannot remove '${raw}': Is a directory`); continue; }
				delete parent.children[baseOf(full)];
				if (full === HOME) {
					// There is no undo on a device either. Put the learner back on
					// their feet, but do not pretend it was harmless.
					mkdirp(state.fs, HOME + '/.termux');
					state.cwd = HOME;
					note('Home is empty. On a real device there is no undo —');
					note('this is exactly what backups in ~/storage/shared/ are for.');
				} else if (state.cwd === full || state.cwd.startsWith(full + '/')) {
					state.cwd = HOME;
				}
			}
			return { output: out, code };
		}

		case 'cp':
		case 'mv': {
			const paths = args.filter((a) => !a.startsWith('-'));
			const recursive = args.some((a) => /^-\w*[rRa]/.test(a));
			if (paths.length < 2) return err(`${cmd}: missing destination file operand`), { output: out, code };
			const srcPath = normalize(state.cwd, paths[0]);
			const dstPath = normalize(state.cwd, paths[1]);
			const src = resolve(state.fs, srcPath);
			if (!src) return err(`${cmd}: cannot stat '${paths[0]}': No such file or directory`), { output: out, code };
			if (cmd === 'cp' && src.type === 'dir' && !recursive)
				return err(`cp: -r not specified; omitting directory '${paths[0]}'`), { output: out, code };

			// If the destination is an existing directory, drop the source inside it.
			const dstNode = resolve(state.fs, dstPath);
			const finalPath = dstNode?.type === 'dir' ? `${dstPath}/${baseOf(srcPath)}` : dstPath;
			if (!writable(finalPath)) return err(`${cmd}: cannot create '${paths[1]}': Permission denied`), { output: out, code };
			const parent = resolve(state.fs, parentOf(finalPath));
			if (parent?.type !== 'dir') {
				err(`${cmd}: cannot create '${paths[1]}': No such file or directory`);
				if (onSharedStorage(finalPath) && !state.storageLinked)
					note("~/storage doesn't exist yet — run termux-setup-storage first.");
				return { output: out, code };
			}
			parent.children ??= {};
			const copy: FsNode = structuredClone(src);
			// Copying onto shared storage drops the exec bit, because that
			// filesystem cannot carry one. This is the trap, not a bug.
			if (onSharedStorage(finalPath)) stripExec(copy);
			copy.mtime = Date.now();
			parent.children[baseOf(finalPath)] = copy;
			if (cmd === 'mv') {
				const sp = resolve(state.fs, parentOf(srcPath));
				if (sp?.children) delete sp.children[baseOf(srcPath)];
			}
			return { output: out, code };
		}

		case 'tar':
			return tar(state, args);

		case 'termux-reload-settings':
			return {
				output: [`${GREEN}✓${RESET} Settings reloaded. ${DIM}(extra-keys and styling applied)${RESET}`],
				code: 0,
			};

		default:
			return unknown(state, cmd);
	}
}

function stripExec(node: FsNode): void {
	node.exec = false;
	for (const c of Object.values(node.children ?? {})) stripExec(c);
}

function longLine(name: string, node: FsNode, path: string, state: ShellState): string {
	const label = node.type === 'dir' ? `${CYAN}${name}${RESET}` : name;
	return (
		`${modeOf(node, path)} ${node.type === 'dir' ? 2 : 1} ${state.env.USER} ${state.env.USER} ` +
		`${String(sizeOf(node)).padStart(5)} ${stamp(node.mtime ?? BOOT_TIME)} ${label}`
	);
}

/**
 * The last resort. A bare `script.sh` that exists right here is the single most
 * common beginner mistake after `command not found`, so it gets its own answer.
 */
function unknown(state: ShellState, cmd: string): Ran {
	const r = notFound(state, cmd);
	if (cmd === 'adb') {
		r.output.push(`${DIM}adb runs on a computer plugged into your phone, not inside${RESET}`);
		r.output.push(`${DIM}Termux. See the phantom-process fix in Troubleshooting.${RESET}`);
		return r;
	}
	const here = resolve(state.fs, normalize(state.cwd, cmd));
	if (here?.type === 'file') {
		r.output.push(`${DIM}That file is right here. Run it with:  ./${cmd}${RESET}`);
		r.output.push(`${DIM}The current folder is not on your PATH — that is deliberate.${RESET}`);
		return r;
	}
	r.output.push(`${DIM}Type 'help' to see what this practice terminal supports.${RESET}`);
	return r;
}

function pkg(state: ShellState, args: string[]): Ran {
	const out: string[] = [];
	const sub = args[0];
	const err = (m: string) => out.push(`${RED}${m}${RESET}`);
	const note = (m: string) => out.push(`${DIM}${m}${RESET}`);

	if (sub === 'update') {
		state.packagesUpdated = true;
		return {
			output: [
				'Get:1 https://packages.termux.dev/apt/termux-main stable',
				'Reading package lists... Done',
				`${GREEN}All repositories are up to date.${RESET}`,
			],
			code: 0,
		};
	}

	if (sub === 'upgrade') {
		if (!state.packagesUpdated) note("Hint: run 'pkg update' first to refresh the package lists.");
		return {
			output: [
				...out,
				'Reading package lists... Done',
				'Building dependency tree... Done',
				`${GREEN}0 upgraded, 0 newly installed — your base system is current.${RESET}`,
			],
			code: 0,
		};
	}

	if (sub === 'install') {
		const names = args.slice(1).filter((a) => !a.startsWith('-'));
		if (!names.length) return err('pkg: install requires a package name'), { output: out, code: 1 };
		// The designed failure the whole course is built around: Golden Rule #2,
		// and its own section in Troubleshooting. Installing against a package
		// list you never refreshed fails on a real device with exactly this, and
		// recovering from it is the reflex worth owning.
		if (!state.packagesUpdated) {
			out.push('Reading package lists... Done');
			for (const n of names) err(`E: Unable to locate package ${n}`);
			note("Your package lists are empty. Run 'pkg update', then try again.");
			return { output: out, code: 100 };
		}
		let code = 0;
		for (const n of names) {
			if (!(n in PKG_DB)) {
				err(`E: Unable to locate package ${n}`);
				const near = Object.keys(PKG_DB).find((k) => k.startsWith(n.slice(0, 3)));
				if (near) note(`Did you mean '${near}'?  Or search: pkg search ${n}`);
				code = 100;
				continue;
			}
			if (state.installed.has(n)) { note(`${n} is already the newest version.`); continue; }
			state.installed.add(n);
			out.push(`Installing ${CYAN}${n}${RESET} (${PKG_DB[n]}) ...`, `${GREEN}✓${RESET} ${n} installed.`);
		}
		return { output: out, code };
	}

	if (sub === 'uninstall' || sub === 'remove') {
		const names = args.slice(1).filter((a) => !a.startsWith('-'));
		if (!names.length) return err('pkg: uninstall requires a package name'), { output: out, code: 1 };
		let code = 0;
		for (const n of names) {
			if (!state.installed.has(n)) {
				err(`E: Package '${n}' is not installed, so not removed`);
				code = 100;
				continue;
			}
			state.installed.delete(n);
			out.push(`Removing ${CYAN}${n}${RESET} ...`, `${GREEN}✓${RESET} ${n} removed.`);
			if (n === 'fish' && state.shell === 'fish') {
				// Removing the shell you are logged into is a real way to lock
				// yourself out. Model the recovery rather than the wreckage.
				state.shell = 'bash';
				state.env.SHELL = `${PREFIX}/bin/bash`;
				note('That was your login shell — you are back on bash.');
			}
		}
		return { output: out, code };
	}

	if (sub === 'search') {
		const q = (args[1] ?? '').toLowerCase();
		const hits = Object.entries(PKG_DB).filter(([n, d]) => n.includes(q) || d.toLowerCase().includes(q));
		if (!hits.length) return { output: [`${DIM}No packages match '${q}'.${RESET}`], code: 1 };
		return { output: hits.map(([n, d]) => `${CYAN}${n}${RESET} - ${d}`), code: 0 };
	}

	if (sub === 'list-installed') {
		return {
			output: state.installed.size
				? [...state.installed].sort().map((n) => `${CYAN}${n}${RESET}/stable`)
				: [`${DIM}No packages installed yet. Try: pkg update && pkg install git${RESET}`],
			code: 0,
		};
	}

	err(`pkg: unknown subcommand '${sub ?? ''}'`);
	note('Try: update, upgrade, install, uninstall, search, list-installed');
	return { output: out, code: 1 };
}

/**
 * `tar czf|tzf|xzf` — the storage lesson's final step, and the one command the
 * "practice the whole flow here" terminal used to refuse outright.
 *
 * It stores a member list rather than bytes, which is enough to make `tzf` and
 * `xzf` honest and to give the archive a plausible size in `ls -l`.
 */
function tar(state: ShellState, args: string[]): Ran {
	const out: string[] = [];
	const err = (m: string) => out.push(`${RED}${m}${RESET}`);
	const warn = (m: string) => out.push(`${YELLOW}${m}${RESET}`);
	const note = (m: string) => out.push(`${DIM}${m}${RESET}`);

	const rest = [...args];
	const modeTok = rest.shift() ?? '';
	const mode = modeTok.replace(/^-/, '');
	if (!/^[cxt]/.test(mode)) {
		err(`tar: You must specify one of the '-Acdtrux' options`);
		note('Backup:  tar czf <archive.tar.gz> -C <dir> <name>');
		note('Inspect: tar tzf <archive.tar.gz>');
		return { output: out, code: 2 };
	}

	// -C <dir> may appear before or after the archive name.
	let chdir: string | null = null;
	const operands: string[] = [];
	for (let i = 0; i < rest.length; i++) {
		if (rest[i] === '-C') { chdir = rest[++i] ?? '.'; continue; }
		if (rest[i].startsWith('-')) continue;
		operands.push(rest[i]);
	}
	const archiveRaw = operands.shift();
	if (!archiveRaw) return err('tar: Refusing to read archive contents from terminal'), { output: out, code: 2 };
	const archivePath = normalize(state.cwd, archiveRaw);
	const base = chdir ? normalize(state.cwd, chdir) : state.cwd;

	if (mode.startsWith('c')) {
		if (!operands.length) {
			err('tar: Cowardly refusing to create an empty archive');
			return { output: out, code: 2 };
		}
		const parent = resolve(state.fs, parentOf(archivePath));
		if (!writable(archivePath) || parent?.type !== 'dir') {
			// The real failure a learner hits when they skip `mkdir` or
			// `termux-setup-storage` — two lines, exactly as tar prints them.
			err(`tar: ${archiveRaw}: Cannot open: No such file or directory`);
			err('tar: Error is not recoverable: exiting now');
			if (onSharedStorage(archivePath) && !state.storageLinked)
				note('~/storage does not exist yet — run termux-setup-storage first.');
			else note(`Make the folder first:  mkdir -p ${prettyPath(parentOf(archivePath))}`);
			return { output: out, code: 2 };
		}
		const members: string[] = [];
		let strippedLeadingSlash = false;
		for (const raw of operands) {
			const full = normalize(base, raw);
			const node = resolve(state.fs, full);
			if (!node) {
				err(`tar: ${raw}: Cannot stat: No such file or directory`);
				err('tar: Exiting with failure status due to previous errors');
				return { output: out, code: 2 };
			}
			// Absolute member names get their leading '/' stripped — real tar warns
			// about this, and an unexplained warning after a "successful" backup
			// reads as failure unless the learner has seen it named.
			const rel = chdir ? raw.replace(/^\.\//, '') : full.replace(/^\//, '');
			if (!chdir && full.startsWith('/')) strippedLeadingSlash = true;
			collectMembers(node, rel, members);
		}
		if (strippedLeadingSlash) {
			warn("tar: Removing leading '/' from member names");
			note('Harmless — but that is why -C ~ projects is the tidier form.');
		}
		const parentDir = parent;
		parentDir.children ??= {};
		parentDir.children[baseOf(archivePath)] = {
			type: 'file',
			members,
			mtime: Date.now(),
		};
		// tar is silent on success, which reads as "nothing happened" to a
		// beginner. Name the silence once and point at how to verify.
		note(`tar says nothing when it works. Check it:  tar tzf ${archiveRaw}`);
		return { output: out, code: 0 };
	}

	const archive = resolve(state.fs, archivePath);
	if (!archive || archive.type !== 'file') {
		err(`tar: ${archiveRaw}: Cannot open: No such file or directory`);
		err('tar: Error is not recoverable: exiting now');
		return { output: out, code: 2 };
	}
	if (!archive.members) {
		err(`tar: This does not look like a tar archive`);
		err('tar: Error is not recoverable: exiting now');
		return { output: out, code: 2 };
	}

	if (mode.startsWith('t')) return { output: archive.members.slice(), code: 0 };

	// x — unpack, relative to -C or the current directory.
	if (!writable(base)) return err(`tar: ${prettyPath(base)}: Cannot open: Permission denied`), { output: out, code: 2 };
	for (const m of archive.members) {
		const full = normalize(base, m);
		if (m.endsWith('/')) mkdirp(state.fs, full);
		else {
			mkdirp(state.fs, parentOf(full));
			const p = resolve(state.fs, parentOf(full))!;
			p.children ??= {};
			p.children[baseOf(full)] ??= { type: 'file', content: '', mtime: Date.now() };
		}
	}
	note(`Unpacked ${archive.members.length} items into ${prettyPath(base)}.`);
	return { output: out, code: 0 };
}

function collectMembers(node: FsNode, rel: string, into: string[]): void {
	if (node.type === 'file') { into.push(rel); return; }
	into.push(rel.endsWith('/') ? rel : rel + '/');
	for (const [n, c] of Object.entries(node.children ?? {})) collectMembers(c, `${rel.replace(/\/$/, '')}/${n}`, into);
}

/** Run `./script.sh` — the payoff for the exec-bit rule the storage lesson teaches. */
function runScript(state: ShellState, raw: string): Ran {
	const full = normalize(state.cwd, raw);
	const node = resolve(state.fs, full);
	if (!node) return { output: [`${RED}${state.shell}: ${raw}: No such file or directory${RESET}`], code: 127 };
	if (node.type === 'dir') return { output: [`${RED}${state.shell}: ${raw}: Is a directory${RESET}`], code: 126 };
	if (!node.exec) {
		const out = [`${RED}${state.shell}: ${raw}: Permission denied${RESET}`];
		out.push(
			onSharedStorage(full)
				? `${DIM}This file is on shared storage, which has no exec bit —${RESET}`
				: `${DIM}Files are not executable until you say so:${RESET}`
		);
		out.push(
			onSharedStorage(full)
				? `${DIM}'chmod +x' there succeeds and changes nothing. Move it under ~.${RESET}`
				: `${DIM}  chmod +x ${raw}${RESET}`
		);
		return { output: out, code: 126 };
	}
	if (scriptDepth > 3) return { output: [`${RED}${raw}: too many levels of recursion${RESET}`], code: 1 };
	scriptDepth++;
	try {
		const out: string[] = [];
		let code = 0;
		for (const line of (node.content ?? '').split('\n').slice(0, 25)) {
			if (!line.trim() || line.trim().startsWith('#')) continue;
			const r = exec(state, line);
			out.push(...r.output);
			code = r.code;
		}
		return { output: out, code };
	} finally {
		scriptDepth--;
	}
}

/** Execute one raw command line against (and mutating) the shell state. */
export function exec(state: ShellState, raw: string): ExecResult {
	const output: string[] = [];
	let clear = false;
	let code = 0;

	for (const seg of splitChain(raw)) {
		// `&&` runs the next command only if the last one succeeded; `||` only if
		// it failed. `pkg update && pkg upgrade` (installing.mdx) used to drop the
		// upgrade on the floor and report success.
		if (seg.joiner === '&&' && code !== 0) continue;
		if (seg.joiner === '||' && code === 0) continue;

		const parsed = tokenize(seg.text, state.env);
		if (parsed.pipe) {
			output.push(`${YELLOW}Pipes ( | ) are not simulated here.${RESET}`);
			output.push(`${DIM}The Live Sandbox on the packages lesson runs real ones.${RESET}`);
			code = 2;
			continue;
		}
		if (!parsed.tokens.length) {
			// A bare redirection still truncates the file, same as a real shell.
			if (parsed.redirect) {
				const e = writeFile(state, parsed.redirect.path, '', parsed.redirect.append);
				if (e) { output.push(`${RED}${e}${RESET}`); code = 1; }
			}
			continue;
		}

		const head = parsed.tokens[0];
		const ran = head.startsWith('./') || head.startsWith('/') || head.startsWith('~/')
			? runScript(state, head)
			: runCommand(state, parsed.tokens);

		if (ran.clear) { clear = true; output.length = 0; }

		if (parsed.redirect && !ran.clear) {
			const e = writeFile(state, parsed.redirect.path, ran.output.map(stripAnsi).join('\n'), parsed.redirect.append);
			if (e) { output.push(`${RED}${e}${RESET}`); code = 1; continue; }
		} else {
			output.push(...ran.output);
		}
		code = ran.code;
	}

	return { output, clear: clear || undefined, code };
}
