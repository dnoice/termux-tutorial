// @ts-check
import { createRequire } from 'node:module';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import icon from 'astro-icon';

// GitHub Pages project site: https://<user>.github.io/<repo>
// Override with the SITE / BASE env vars for a custom domain or fork.
const SITE = process.env.SITE ?? 'https://dnoice.github.io';
const BASE = process.env.BASE ?? '/termux-tutorial/advanced';

/*
 * All three courses live in ONE repository — https://github.com/dnoice/termux-tutorial
 * — and deploy as ONE GitHub Pages site. The beginner course is the site root
 * (`/termux-tutorial`), this one is nested at `/termux-tutorial/intermediate`,
 * and advanced will be `/termux-tutorial/advanced`.
 *
 * That is why REPO_URL is a constant here rather than derived from BASE: the
 * repo name and the base path are no longer the same string.
 */
const REPO_URL = 'https://github.com/dnoice/termux-tutorial';

/** BASE with any trailing slash removed — the form every URL below builds on. */
const BASE_PATH = BASE.replace(/\/$/, '');
/** Absolute origin + base. Crawlers reject relative og:image URLs outright. */
const SITE_URL = `${SITE.replace(/\/$/, '')}${BASE_PATH}`;
/** The social card. 1200×630 PNG in public/; public/og-default.svg is its source. */
const OG_IMAGE = `${SITE_URL}/og-default.png`;

const DESCRIPTION =
	'Course three of the Termux series. Run a real Debian userland under PRoot, bring up an X11 display server and a full XFCE desktop on your phone\'s own screen, hand 3D work to the GPU, and compile packages nobody has built for Android.';

/**
 * The one page that needs cross-origin isolation: `automation/shell-scripts`
 * hosts LiveSandbox (CheerpX/WebVM), the only SharedArrayBuffer consumer.
 *
 * The beginner course parked the sandbox on its packages lesson. It moves here
 * because WebVM is x86 Debian, not Android: it cannot run a single `termux-*`
 * command, so it is worthless on the API lessons and genuinely useful on the
 * one lesson that is plain POSIX shell — write a script, chmod it, run it,
 * break it, with no risk to a real device.
 *
 * IF THAT LESSON EVER MOVES, MOVE THIS TOO — nothing validates it, and the
 * failure is silent: the Boot button simply never leaves its "needs a refresh"
 * state, because the service worker was never registered for that path.
 */
const SANDBOX_PATH = `${BASE_PATH}/automation/shell-scripts/`;
const COI_SW_URL = `${BASE_PATH}/coi-serviceworker.js`;

/**
 * Rewrite root-relative links in content so BASE lives in exactly one place.
 *
 * Markdown/MDX authors write `/start/friendly-shell/` and this prefixes BASE at
 * build time. Previously every cross-lesson link hardcoded
 * `/termux-tutorial-for-beginners/...` (21 of them), which silently breaks the
 * moment `base` changes. It since has: the repo was renamed and BASE is now
 * `/termux-tutorial`, so those 21 links would all be 404s on Pages today. That
 * old path survives in this comment as history and nowhere else in the config —
 * `scripts/check-links.mjs` hardcodes the same BASE and must be changed with it.
 *
 * Skips external links, anchors, mailto/tel, and anything already prefixed.
 */
function rehypeBasePaths() {
	const base = BASE_PATH;
	/** @param {any} tree */
	return (tree) => {
		/** @param {any} node */
		const visit = (node) => {
			if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
				const href = node.properties.href;
				if (
					href.startsWith('/') &&
					!href.startsWith('//') &&
					!href.startsWith(`${base}/`) &&
					href !== base
				) {
					node.properties.href = `${base}${href}`;
				}
			}
			(node.children ?? []).forEach(visit);
		};
		visit(tree);
	};
}

/* ====================================================================== *
 * FONTS — latin-only, self-hosted from public/, two of them preloaded.
 *
 * WAS: four bare `@fontsource-variable/*` imports in `customCss`. Those pull
 * every subset — 21 woff2, 583,712 B, of which 396,028 B (68%) is
 * cyrillic/greek/vietnamese/latin-ext that an English-reading visitor never
 * requests. Worse, no face was preloaded, so the LCP heading's font (Crimson
 * Pro) could not begin downloading until the 101 KB stylesheet had been
 * fetched AND parsed — a serialised round-trip on the critical path, and a
 * visible FOUT on every page.
 *
 * NOW: the eight latin faces are copied into `public/fonts/` by
 * `npm run fonts:sync` (the @fontsource-variable packages stay in
 * package.json as the source of truth for that copy), declared by the inline
 * <style> below, and the two above-the-fold families are preloaded. Files in
 * public/ keep stable, un-hashed URLs, which is the whole reason a hardcoded
 * <link rel="preload"> is safe here — Astro's content-hashed bundle names are
 * not.
 *
 * Nothing is lost: verified against the packages' own unicode-range data, the
 * glyphs the course actually needs outside latin — `❯` (U+276F) and `→`
 * (U+2192) — are in NO subset of any of the four families, so they fell back
 * to a system font before this change too.
 * ====================================================================== */
const LATIN_RANGE =
	'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

/** @typedef {{ family: string, file: string, weight: string, preload?: boolean }} FontFace */

/** @type {FontFace[]} */
const FONT_FACES = [
	// preload: above the fold on every page. Inter is the UI chrome, Crimson
	// Pro is the hero/h1 — i.e. the LCP element on the landing page.
	{ family: 'Inter Variable', file: 'inter-latin-wght', weight: '100 900', preload: true },
	{ family: 'Crimson Pro Variable', file: 'crimson-pro-latin-wght', weight: '200 900', preload: true },
	// Body prose and code: below the fold, and swapping them late is cheap.
	{ family: 'Source Serif 4 Variable', file: 'source-serif-4-latin-wght', weight: '200 900' },
	{ family: 'JetBrains Mono Variable', file: 'jetbrains-mono-latin-wght', weight: '100 800' },
];

/**
 * @param {FontFace} face
 * @param {'normal' | 'italic'} style
 */
const fontUrl = (face, style) => `${BASE_PATH}/fonts/${face.file}-${style}.woff2`;

const fontFaceCss = FONT_FACES.flatMap((face) =>
	/** @type {const} */ (['normal', 'italic']).map(
		(style) =>
			`@font-face{font-family:'${face.family}';font-style:${style};font-display:swap;` +
			`font-weight:${face.weight};src:url(${fontUrl(face, style)}) format('woff2-variations');` +
			`unicode-range:${LATIN_RANGE};}`
	)
).join('');

/**
 * Preload only the upright cuts of the two critical families — four preloads
 * would compete with each other and with the CSS for the same bandwidth.
 *
 * @type {Array<{ tag: 'link', attrs: Record<string, string> }>}
 */
const fontPreloads = FONT_FACES.filter((face) => face.preload).map((face) => ({
	tag: 'link',
	attrs: {
		rel: 'preload',
		href: fontUrl(face, 'normal'),
		as: 'font',
		type: 'font/woff2',
		// Fonts are always fetched in CORS mode, even same-origin. Without this
		// the preload is discarded and the file is downloaded a second time.
		crossorigin: 'anonymous',
	},
}));

/* ====================================================================== *
 * CODE BLOCK SYNTAX THEME — Fire Watch, not Night Owl.
 *
 * WAS: no `expressiveCode` key at all, so Starlight's bundled defaults
 * ('starlight-dark' / 'starlight-light' — both Night Owl derivatives, see
 * @astrojs/starlight/integrations/expressive-code/themes/) shipped verbatim.
 * Measured on /foundations/storage/: the command `termux-setup-storage`
 * rendered as #3B61B0 cornflower blue inside a fenced block while the xterm
 * terminal ~200px below it printed the SAME string in brass #d4b15c. Two
 * colours for one command on one screen — and blue was a fifth competing
 * accent on a system whose brief names brass as the only one.
 *
 * NOW: two hand-authored themes, one dark and one light. No Shiki built-in
 * was close enough: every warm candidate (gruvbox, vitesse, everforest) ships
 * a four-to-six hue rainbow, which is the exact thing being removed here. So
 * the palette is deliberately brass plus a neutral ink ramp:
 *
 *   brass  — what you RUN: command names, builtins, control keywords, storage
 *            modifiers. The same hue the terminal prints commands in, so a
 *            command looks identical whether it is typed or printed.
 *   ink    — what you GIVE it: strings, arguments, variables, constants. On
 *            the strongest neutral, so literals read as data, not decoration.
 *   muted  — comments (italic) and bare operators, which recede.
 *   ember  — `invalid` only. Semantic colours mark state, never decorate.
 *
 * THE HEXES ARE MIRRORED, NOT INVENTED. A Shiki theme is parsed as real
 * colours (Expressive Code does contrast maths over them), so `var(--token)`
 * is not available here the way it is in CSS — every value below is copied
 * from src/styles/global.css and labelled with the token it came from. Change
 * a token there and change it here, or the two drift apart silently.
 *
 * Contrast is measured against the plate Starlight actually paints —
 * --sl-color-gray-6 (#141820) in dark, --sl-color-gray-7 (#efe9de) in light —
 * and every value clears AA. Note the light brass is --color-brand-emphasis
 * (#6f5310, 5.95:1) and NOT --color-brand (#8b6914), which measures 4.21:1 on
 * that plate: under AA for the single most-read token in the whole course.
 * ====================================================================== */

/** @typedef {{ comment: string, brass: string, ink: string, muted: string, danger: string }} SyntaxPalette */

/**
 * The scope→role mapping, shared by both themes so they can never disagree
 * about what a token *means* — only about what colour that meaning is.
 *
 * Scopes were taken from the grammar this course actually uses: 36 of its 42
 * fenced blocks are `bash`, the rest `text` and `properties`.
 *
 * @param {SyntaxPalette} p
 * @returns {Array<{ name: string, scope: string[], settings: { foreground?: string, fontStyle?: string } }>}
 */
const fireWatchSyntax = (p) => [
	{
		name: 'Comments',
		scope: ['comment'],
		settings: { foreground: p.comment, fontStyle: 'italic' },
	},
	{
		// The brass tier. Everything a learner literally types at a prompt.
		name: 'Commands, builtins and keywords',
		scope: [
			'entity.name.command', // bash: `pkg`, `mv`, `termux-setup-storage`
			'support.function', // bash builtins: `echo`, `cd`, `printf`
			'entity.name.function',
			'keyword', // if / then / for / do / done / fi / in
			'storage', // `export`, `alias`, `local`
			'entity.name.tag', // .properties and ini keys
			'support.type.property-name', // json / yaml keys
		],
		settings: { foreground: p.brass },
	},
	{
		// The ink tier — strongest neutral, one step above body text, so the
		// arguments a learner has to retype exactly are the crispest thing in
		// the block. In dark this lands on #e8dfcc, which is byte-identical to
		// the xterm foreground in TermuxTerminal.tsx.
		name: 'Literals and arguments',
		scope: ['string', 'constant', 'support.constant', 'entity.name.type'],
		settings: { foreground: p.ink },
	},
	{
		// `$HOME` must not read as a command. Italic separates it from the
		// brass tier without spending a second hue on it.
		name: 'Variables',
		scope: ['variable', 'support.variable'],
		settings: { foreground: p.ink, fontStyle: 'italic' },
	},
	{
		// Two scope segments beats the one-segment `keyword` rule above, so
		// `=`, `>` and `&&` recede instead of competing with the command word
		// for the accent.
		name: 'Operators',
		scope: ['keyword.operator'],
		settings: { foreground: p.muted },
	},
	{
		name: 'Invalid',
		scope: ['invalid'],
		settings: { foreground: p.danger },
	},
];

/** Sentinel Obsidian. Ratios are against #141820, the dark plate. */
const CODE_THEME_DARK = {
	name: 'fire-watch-obsidian',
	type: /** @type {'dark'} */ ('dark'),
	colors: {
		// Kept in step with --sl-color-gray-6 so Expressive Code's contrast
		// maths sees the plate it will actually paint.
		'editor.background': '#141820', // --bg-surface
		'editor.foreground': '#cfc5b0', // --fg-body        10.38:1
		'terminal.background': '#141820',
	},
	settings: fireWatchSyntax({
		comment: '#8e8676', // --fg-muted        4.93:1
		brass: '#d4b15c', // --color-brand       8.67:1
		ink: '#e8dfcc', // --fg-default         13.42:1
		muted: '#8e8676', // --fg-muted          4.93:1
		danger: '#cc6449', // --color-danger     4.64:1
	}),
};

/** Parchment Dossier. Ratios are against #efe9de, the light plate. */
const CODE_THEME_LIGHT = {
	name: 'fire-watch-parchment',
	type: /** @type {'light'} */ ('light'),
	colors: {
		'editor.background': '#efe9de', // --bg-surface-alt
		'editor.foreground': '#3d3d3d', // --fg-body         8.99:1
		'terminal.background': '#efe9de',
	},
	settings: fireWatchSyntax({
		comment: '#6b5d4f', // --fg-muted                    5.26:1
		// --color-brand-emphasis, not --color-brand: see the block comment.
		brass: '#6f5310', // --color-brand-emphasis          5.95:1
		ink: '#2c2418', // --fg-default                     12.66:1
		muted: '#6b5d4f', // --fg-muted                      5.26:1
		danger: '#8b2d2d', // --color-danger                 6.92:1
	}),
};

/* ====================================================================== *
 * STRUCTURED DATA
 *
 * One `@graph` describing the course as a single entity, emitted site-wide.
 * Site-wide is deliberate: `@id` anchors mean every page points at the SAME
 * Course node rather than declaring eleven competing courses, and Starlight's
 * `head` is the only injection point that reaches every page from config.
 * Keep `name`/`description` in sync with the Starlight options below.
 * ====================================================================== */
const STRUCTURED_DATA = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'Course',
			'@id': `${SITE_URL}#course`,
			name: 'Termux: Advanced',
			description: DESCRIPTION,
			url: `${SITE_URL}/`,
			inLanguage: 'en',
			isAccessibleForFree: true,
			educationalLevel: 'Advanced',
			learningResourceType: 'Interactive tutorial',
			// One entry per lesson in the sidebar below, in the same order. The
			// beginner course drifted here twice — lessons were registered without
			// this list being updated, so it advertised five skills while teaching
			// seven. Nothing validates it, so it is on you. This course arrived
			// carrying course two's seven entries verbatim, which is the same
			// drift by a different route: the list survived a port it did not
			// describe.
			teaches: [
				'Why a PRoot container beats rooting, and what syscall interception can and cannot fake',
				'Installing a full Debian userland with proot-distro, and removing it again',
				'Working inside a container with no init, no systemd and decorative file ownership',
				'Bringing up an X11 display server on Android with Termux:X11',
				'Running a full XFCE desktop on the phone\'s own screen',
				'Bridging a desktop session across the container boundary',
				'Handing 3D work to the phone GPU with virglrenderer and Mesa',
				'Compiling packages for aarch64 on the device itself',
				'Where to take a pocket Linux machine after the series ends',
			],
			coursePrerequisites: 'Termux for Beginners and Termux: Intermediate, or equivalent comfort with pkg, storage, sessions and shell scripting on Android.',
			provider: {
				'@type': 'Organization',
				'@id': `${SITE_URL}#publisher`,
				name: 'dnoice',
				url: `${SITE_URL}/`,
			},
			hasCourseInstance: {
				'@type': 'CourseInstance',
				courseMode: 'online',
				// Self-paced, no schedule — Google requires one of workload or
				// schedule for a valid CourseInstance. The longest in the series:
				// nine lessons, and several of them wait on a multi-gigabyte
				// download or an on-device compile that the learner cannot rush.
				courseWorkload: 'PT5H',
			},
		},
		{
			'@type': 'WebSite',
			'@id': `${SITE_URL}#website`,
			name: 'Termux: Advanced',
			url: `${SITE_URL}/`,
			description: DESCRIPTION,
			inLanguage: 'en',
			publisher: { '@id': `${SITE_URL}#publisher` },
		},
	],
};

/* ====================================================================== *
 * xterm SSR RESOLUTION — see `vite.resolve.alias` at the bottom.
 *
 * WAS: `new URL('./node_modules/@xterm/xterm/lib/xterm.mjs', import.meta.url)`,
 * which assumes npm hoisted the package flat into THIS project root. It breaks
 * under pnpm, Yarn PnP, and any workspace that hoists to a parent — with a
 * cryptic SSR error, not a useful one.
 *
 * NOW: Node's own resolver finds it wherever the package manager put it. If
 * resolution fails (most likely cause: xterm 7 adds an `exports` map, which
 * would forbid deep subpath access and would also make the alias unnecessary),
 * the alias is simply omitted and the build proceeds without it rather than
 * dying on a path that no longer exists.
 *
 * UPGRADE WATCH — pinned to @xterm/xterm@6, which has no `exports` map and
 * whose `main` is UMD. The real fix is to move the xterm imports inside the
 * component effects (`await import('@xterm/xterm')`), which takes xterm out of
 * the SSR graph entirely and lets this block and `ssr.noExternal` both be
 * deleted. That lives in src/components/terminal/, not here.
 * ====================================================================== */
const nodeRequire = createRequire(import.meta.url);
/** @type {string | null} */
let xtermEsmPath = null;
try {
	xtermEsmPath = nodeRequire.resolve('@xterm/xterm/lib/xterm.mjs');
} catch (error) {
	console.warn(
		'[astro.config] Could not resolve @xterm/xterm/lib/xterm.mjs; ' +
			'skipping the SSR alias. If the build fails on a missing named export ' +
			'from @xterm/xterm, this is why.',
		error
	);
}

// https://astro.build/config
export default defineConfig({
	site: SITE,
	base: BASE,
	// The floating Astro toolbar confuses learners (it looks like part of the
	// tutorial). Off by default; devs can re-enable via `astro dev --verbose`
	// or by flipping this flag locally.
	devToolbar: { enabled: false },
	integrations: [
		react(),
		icon({
			// Build-time inlined SVGs from the Font Awesome 6 Iconify sets —
			// no CDN, COEP-safe, offline-friendly. Use as <Icon name="fa6-solid:terminal" />.
			iconDir: 'src/assets/icons',
		}),
		starlight({
			title: 'Termux: Advanced',
			description: DESCRIPTION,
			tagline: 'A full Linux desktop, running on the phone in your hand.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: REPO_URL,
				},
			],
			head: [
				...fontPreloads,
				{
					// @font-face declarations inline, not in the stylesheet: the browser
					// can start fetching the LCP font from the first bytes of <head>
					// instead of after the 101 KB CSS bundle downloads AND parses.
					// See the FONTS block above.
					tag: 'style',
					content: fontFaceCss,
				},

				/* ---- Social card -------------------------------------------------
				 * Starlight already emits twitter:card=summary_large_image, which
				 * PROMISES an image; there was none, so X, Discord, Slack, LinkedIn
				 * and iMessage all rendered a blank or degraded
				 * preview. og:image MUST be absolute — a base-relative path does not
				 * resolve for a crawler. Source artwork: public/og-default.svg. */
				{ tag: 'meta', attrs: { property: 'og:image', content: OG_IMAGE } },
				{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
				{
					tag: 'meta',
					attrs: {
						property: 'og:image:alt',
						content: 'Termux: Advanced — a real Linux desktop, running on your phone.',
					},
				},
				{ tag: 'meta', attrs: { name: 'twitter:image', content: OG_IMAGE } },

				{
					// One Course entity, anchored by @id so every page points at the
					// same node instead of declaring 11 competing courses.
					tag: 'script',
					attrs: { type: 'application/ld+json' },
					content: JSON.stringify(STRUCTURED_DATA),
				},

				{
					/* ---- Cross-origin isolation, SCOPED --------------------------
					 * WAS: a plain <script src="coi-serviceworker.js"> right here, so
					 * every page registered the worker, and every page was then served COEP
					 * `require-corp`, and every first-time visitor paid a self-inflicted
					 * reload — on 10 pages that gain nothing from it. Site-wide
					 * require-corp also silently blocks any future cross-origin
					 * subresource (an embedded video, a screenshot from GitHub's CDN, a
					 * badge) — a landmine for a docs site that will grow.
					 *
					 * NOW: the loader injects the worker only on the one lesson that
					 * hosts LiveSandbox, and registers it with that lesson's directory
					 * as the service-worker SCOPE, so the other ten pages are never
					 * controlled and never reload. `quiet: true` stops it logging on
					 * every load. Both options are local additions to
					 * public/coi-serviceworker.js, documented at the top of that file.
					 *
					 * The astro:page-load listener is insurance: it fires only if
					 * Starlight's ClientRouter is ever enabled, at which point head
					 * scripts stop re-running on navigation and the sandbox page would
					 * otherwise never become isolated. */
					tag: 'script',
					content:
						`(()=>{const P=${JSON.stringify(SANDBOX_PATH)},S=${JSON.stringify(COI_SW_URL)};let done=false;` +
						`const load=()=>{if(done)return;let p=location.pathname;` +
						`if(p.slice(-10)==='index.html')p=p.slice(0,-10);` +
						`if(p.slice(-1)!=='/')p+='/';` +
						`if(p!==P)return;done=true;` +
						`window.coi={quiet:true,swUrl:S,scope:P};` +
						`const s=document.createElement('script');s.src=S;document.head.appendChild(s);};` +
						`load();document.addEventListener('astro:page-load',load);})();`,
				},
				{
					// Pointer-tracked spotlight on cards. One delegated, passive
					// listener; sets CSS vars the stylesheet reads. rAF-throttled.
					tag: 'script',
					content: `(()=>{let f=0,cx=0,cy=0,el=null;const upd=()=>{f=0;if(!el)return;const r=el.getBoundingClientRect();el.style.setProperty('--px',((cx-r.left)/r.width*100)+'%');el.style.setProperty('--py',((cy-r.top)/r.height*100)+'%');};addEventListener('pointermove',(e)=>{const c=e.target.closest&&e.target.closest('.card,.tmx-card');if(!c)return;el=c;cx=e.clientX;cy=e.clientY;if(!f)f=requestAnimationFrame(upd);},{passive:true});})();`,
				},
			],
			customCss: [
				// Fire Watch editorial type system. The four bare
				// `@fontsource-variable/*` entrypoints used to be listed here and
				// pulled 21 woff2 files (583 KB, 68% of it non-latin). They are now
				// declared latin-only from <head> — see the FONTS block above.
				'./src/styles/global.css',
				'@xterm/xterm/css/xterm.css',

				// Paper edition. LAST so it wins on equal specificity against both
				// the design system and xterm's own stylesheet: print is a different
				// rendering target, not a variant of the screen theme.
				'./src/styles/print.css',
			],
			expressiveCode: {
				// One dark theme and one light one, which is what makes Starlight
				// emit `[data-theme='dark']` / `[data-theme='light']` selectors for
				// them (see integrations/expressive-code/preprocessor.ts) — so code
				// follows the site's theme button instead of being pinned to one.
				// Order matters only in that the first is the base variant.
				themes: [CODE_THEME_DARK, CODE_THEME_LIGHT],
				defaultProps: {
					/*
					 * WRAP LONG LINES INSTEAD OF SCROLLING THEM.
					 *
					 * This is a course read on a phone, and a 390px viewport leaves a
					 * ~357px code scrollport. Measured before this change: 75 of 155
					 * blocks overflowed, the worst being a crontab line 1,013px wide —
					 * 65% of it off-screen, including both redirections that were the
					 * point of the example, on a line the learner has to reproduce
					 * character for character.
					 *
					 * Horizontal scrolling inside a 22px strip on a vertically
					 * scrolling page is a bad way to read anything, and a worse way to
					 * copy it. Wrapping trades a scrollbar for an extra line, which on
					 * this content is the right trade every time.
					 *
					 * `preserveIndent` keeps continuation lines aligned under their
					 * command rather than flush left, so a wrapped shell invocation
					 * still reads as one statement. Opt out per block with `wrap=false`
					 * where the line break itself would be misleading (ASCII diagrams,
					 * fixed-column output).
					 */
					wrap: true,
					preserveIndent: true,
				},
				// Supplying `themes` normally flips this OFF, which would move the
				// frame off CSS variables and onto hardcoded hexes baked into the
				// themes above. Kept ON deliberately: the FRAME (plate, tab bar,
				// terminal titlebar, scrollbars) stays bound to --sl-color-*, which
				// the BRIDGE block in global.css maps onto the Fire Watch tokens.
				// global.css therefore keeps owning the frame; these two themes own
				// only the syntax palette.
				useStarlightUiThemeColors: true,
			},
			components: {
				// Inject the local profile badge above the default sidebar nav.
				Sidebar: './src/components/overrides/Sidebar.astro',
				// The series switcher — the only route out of a course. See the
				// component header for why it hangs off SiteTitle.
				SiteTitle: './src/components/overrides/SiteTitle.astro',
				// One cycling button instead of a <select> for three options —
				// see the file header for the geometry it replaces.
				ThemeSelect: './src/components/overrides/ThemeSelect.astro',
			},
			editLink: {
				baseUrl: `${REPO_URL}/edit/main/`,
			},
			lastUpdated: true,
			/* ORDER MATTERS TWICE. Starlight builds the prev/next pagination from
			   this array, so it is not just a menu — it is the rail the learner
			   is put on. Utility pages therefore live in their own group AND opt
			   out of the chain via `prev: false` / `next: false` in their
			   frontmatter, so the course reads Welcome → … → Where to Next
			   instead of opening on an empty progress dashboard and ending on a
			   troubleshooting page.
			   Keep this in sync with LESSONS in src/lib/progress.ts.

			   THE ARC, and why it is this arc: course one ends with a learner who
			   can drive a shell, install packages and reach their own files. It
			   never taught them to write a script, and it never let them touch
			   anything outside the Termux sandbox. So this course opens the two
			   doors the first one left shut — OUT to the device's hardware, then
			   OUT to the network — and puts the missing scripting lesson between
			   them, where it has something worth automating.

			      The Android Bridge   read the phone, then talk back to it
			      Scripting & Automation   stop typing it, start scheduling it
			      Serving From Your Pocket  make the phone answer to the world

			   Nothing from course one is re-taught. `pkg install`, `~/storage`,
			   fish, sessions and the extra-keys row are all assumed knowledge and
			   should be referenced, never explained. */
			sidebar: [
				{
					/* ORDER IS THE ARGUMENT. PRoot comes first because every later
					   lesson runs inside the container it creates, and because the
					   "why not just root the phone" question has to be answered before
					   a learner spends 500MB finding out. */
					label: 'A Real Distribution',
					items: [
						{ label: 'Welcome', slug: 'index' },
						{
							// The conceptual lesson, deliberately before any install.
							// PRoot is syscall interception, not virtualisation, and the
							// difference explains every limitation the rest of the course
							// runs into — no real root, no kernel modules, a speed cost.
							label: 'Root Without Rooting',
							slug: 'container/why-proot',
						},
						{
							// proot-distro, a real Debian rootfs, and the disk and battery
							// cost stated up front rather than discovered.
							label: 'Installing a Full Distro',
							slug: 'container/first-distro',
						},
						{
							// Two package managers, two home directories, two sets of
							// paths. The lesson that stops a learner losing work across
							// the boundary.
							label: 'Living in the Container',
							slug: 'container/living-in-it',
						},
					],
				},
				{
					label: 'A Desktop on Your Phone',
					items: [
						{
							// Termux:X11, NOT VNC. The display server first and alone, so
							// a black screen later can be diagnosed as "the server is
							// fine, the desktop is not" rather than as one big failure.
							label: 'A Display Server on Android',
							slug: 'desktop/x11-server',
						},
						{
							// XFCE on the Termux side first — fewer moving parts than
							// starting inside the container.
							label: 'Bringing Up XFCE',
							slug: 'desktop/xfce',
						},
						{
							// The hard one: server on the host, session in the container,
							// a shared socket as the tether. Last of the desktop lessons
							// because it needs both halves working independently first.
							label: 'The Desktop in the Container',
							slug: 'desktop/across-the-boundary',
						},
					],
				},
				{
					label: 'Hardware & Your Own Builds',
					items: [
						{
							// virglrenderer / mesa. Explicitly framed as experimental,
							// device-dependent, and the most likely thing in the course
							// not to work on a given phone.
							label: 'Handing Work to the GPU',
							slug: 'hardware/gpu',
						},
						{
							// Compiling for aarch64 on the device, and what to do when a
							// package simply is not in the repo.
							label: 'Building Packages of Your Own',
							slug: 'hardware/building',
						},
						{ label: 'Where to Next', slug: 'where-next' },
					],
				},
				{
					label: 'Reference & Tools',
					items: [
						{ label: 'Your Progress', slug: 'progress', badge: { text: 'Local', variant: 'note' } },
						{ label: 'Command Cheatsheet', slug: 'reference/cheatsheet' },
						{ label: 'Troubleshooting', slug: 'reference/troubleshooting' },
					],
				},
			],
		}),
	],
	// Content links are authored root-relative; BASE is applied here at build
	// time so it stays configurable in exactly one place.
	markdown: {
		rehypePlugins: [rehypeBasePaths],
	},
	vite: {
		/*
		 * A UNIQUE HMR WEBSOCKET PATH, so this project can be told apart behind
		 * the monorepo's single-port dev proxy (scripts/dev.mjs).
		 *
		 * Vite's default is `/`, which means every project in this repo would
		 * tell the browser to open `ws://<host>:<port>/`. Four identical socket
		 * URLs behind one proxy cannot be routed, so every connection would land
		 * on whichever project owns `/` — and Vite 7 stamps a per-server token on
		 * the handshake, so the mis-routed ones are rejected outright rather than
		 * merely confused. The symptom is nasty precisely because it is partial:
		 * one project hot-reloads, the rest silently stop, with nothing in the
		 * terminal and one line in the browser console.
		 *
		 * Must match `hmrPathOf()` in scripts/projects.mjs. Running this course
		 * standalone is unaffected — the client reads the same value either way.
		 */
		server: { hmr: { path: '/@hmr/advanced' } },
		ssr: {
			// xterm's Node entry (`main`) is UMD, so `import { Terminal }` fails
			// under SSR. noExternal tells Vite to bundle it and honour the ESM
			// `module` entry, even though these islands are client:only.
			noExternal: ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links'],
		},
		// Belt-and-braces for Vite 8's Environment API: force any @xterm/xterm
		// bare import to resolve to its ESM build (named exports), which the
		// prerender step needs regardless of externalization. Resolved through
		// Node rather than a hardcoded ./node_modules path — see the UPGRADE
		// WATCH block above for why, and for how to delete this entirely.
		resolve: {
			alias: xtermEsmPath
				? [{ find: /^@xterm\/xterm$/, replacement: xtermEsmPath }]
				: [],
		},
		build: {
			rollupOptions: {
				output: {
					/* xterm is 339,824 B raw / 84,833 B gzip. Rollup was hoisting it
					   into the shared island chunk together with react-dom, so the
					   landing page fetched ~148 KB gzip before the terminal could
					   paint, and any page with ANY island paid for xterm whether it
					   rendered a terminal or not.

					   Its own chunk means: the five terminal pages fetch it in
					   parallel with react instead of serially inside one blob, the
					   six pages without a terminal never fetch it at all, and it
					   stays cached across lessons instead of being invalidated every
					   time an island changes.

					   This is the ceiling without touching the components: `client:only`
					   has no deferral semantics, so the chunk is still requested at
					   island-load time. Deferring it needs the directive and the
					   imports to move — see the handoff notes. */
					/** @param {string} id */
					manualChunks(id) {
						if (id.includes('@xterm')) return 'xterm';
						return undefined;
					},
				},
			},
		},
	},
});
