/**
 * projects.mjs — the topology of this monorepo, declared once.
 *
 * WHY THIS FILE EXISTS. The same four-project layout was written out by hand in
 * `deploy.yml`, in the README's assembly snippet, in every course's
 * `check-links.mjs`, and in the hub's course loader. Four copies of one fact,
 * and the fact changes every time a course is added. That is the shape of every
 * drift bug this repo has produced: a value that must be edited in N places,
 * where nothing fails when you edit N-1 of them.
 *
 * Everything that needs to know the layout — the dev proxy, the assembler, the
 * link checker, CI — imports it from here.
 *
 * ORDER MATTERS. `slot: ''` (the hub) must come LAST in routing decisions,
 * because its base is a prefix of every other base: `/termux-tutorial` matches
 * `/termux-tutorial/advanced/...` too. Route by longest prefix, and the helper
 * below does that for you rather than leaving it to each caller to remember.
 */

/** The series root — the path GitHub Pages serves the assembled tree from. */
export const SERIES_BASE = process.env.BASE ?? '/termux-tutorial';

/**
 * @typedef {object} Project
 * @property {string} id     Stable identifier, also the dev-server label.
 * @property {string} dir    Directory name, relative to the monorepo root.
 * @property {string} slot   Sub-path in the assembled tree; '' is the root (hub).
 * @property {string} label  Human name for logs.
 * @property {number} port   Internal dev-server port. Never the one you visit.
 */

/**
 * The HMR WebSocket path for a project, which MUST be unique per project.
 *
 * WHY THIS EXISTS AT ALL. Vite injects its HMR path into the client as
 * `server.hmr.path`, default `"/"` — so out of the box every one of these four
 * dev servers tells the browser to open `ws://<host>:<port>/`. Four identical
 * URLs behind one proxy cannot be told apart, so every socket would land on
 * whichever project owns `/`, and Vite stamps a per-server token on the
 * handshake, so the three that arrived at the wrong server would be rejected
 * rather than merely confused. The visible symptom is subtle and awful: the hub
 * hot-reloads, the three courses silently do not, and nothing reports an error
 * except one line in the browser console.
 *
 * Each project therefore sets `vite.server.hmr.path` to this value, and the
 * proxy routes upgrades by it. Keep the two in step — that is what
 * `npm run check:hmr` verifies.
 */
export const hmrPathOf = (p) => `/@hmr/${p.id}`;

/** @type {Project[]} */
export const PROJECTS = [
	{ id: 'hub', dir: 'hub', slot: '', label: 'Hub', port: 4331 },
	{
		id: 'beginner',
		dir: 'termux-tutorial-for-beginners',
		slot: 'beginner',
		label: 'Beginner',
		port: 4332,
	},
	{
		id: 'intermediate',
		dir: 'termux-tutorial-intermediate',
		slot: 'intermediate',
		label: 'Intermediate',
		port: 4333,
	},
	{
		id: 'advanced',
		dir: 'termux-tutorial-advanced',
		slot: 'advanced',
		label: 'Advanced',
		port: 4334,
	},
];

/** The course projects — everything that is not the hub. */
export const COURSES = PROJECTS.filter((p) => p.slot !== '');

/** The base path a project is served from, e.g. `/termux-tutorial/advanced`. */
export const baseOf = (p) => (p.slot ? `${SERIES_BASE}/${p.slot}` : SERIES_BASE);

/**
 * Which project owns a URL path? Longest-prefix match, so the hub — whose base
 * prefixes all three courses — only wins when no course does.
 *
 * @param {string} pathname
 * @returns {Project}
 */
export function projectFor(pathname) {
	let best = PROJECTS[0];
	let bestLen = -1;
	for (const p of PROJECTS) {
		const base = baseOf(p);
		if ((pathname === base || pathname.startsWith(`${base}/`)) && base.length > bestLen) {
			best = p;
			bestLen = base.length;
		}
	}
	return best;
}
