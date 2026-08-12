// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

/*
 * The series hub — the root of the published site.
 *
 * This is NOT a Starlight project. Starlight is a documentation framework and
 * this is one page: a front door with a cross-course dashboard. Pulling in
 * Starlight would drag a sidebar, a search index and a docs layout onto a page
 * that wants none of them.
 *
 * It reuses the Fire Watch tokens (src/styles/hub.css) so the hub and the
 * courses are visibly one product, but it does not reuse the courses'
 * global.css — most of that file is Starlight bridging, which has nothing to
 * bridge here.
 */
const SITE = process.env.SITE ?? 'https://dnoice.github.io';
const BASE = process.env.BASE ?? '/termux-tutorial';

const BASE_PATH = BASE.replace(/\/$/, '');
const SITE_URL = `${SITE.replace(/\/$/, '')}${BASE_PATH}`;

const TITLE = 'Termux Tutorial — Linux on your Android phone';
/*
 * NOT THE DESCRIPTION THE PAGES USE. src/pages/index.astro and profile.astro
 * each set their own, and nothing in src/ imports this constant — it is
 * exported below and currently has no consumer.
 *
 * It is kept in step with them anyway, because the failure mode of a stale
 * copy parked one import away from every <head> is exactly the drift this
 * whole file set has been audited for. It previously claimed "a live terminal
 * in every lesson", which is false: the beginner course has one on 8 of 11
 * lessons, intermediate on none of its lessons, advanced on none at all.
 */
const DESCRIPTION =
	'A three-part, hands-on Termux course. The first course puts a live terminal in nearly every lesson, so you can start before you install anything.';

export default defineConfig({
	site: SITE,
	base: BASE,
	trailingSlash: 'ignore',
	integrations: [react()],
	build: {
		// Match the courses, so a link to /beginner/ resolves the same way
		// whether it was written here or there.
		format: 'directory',
	},
	vite: {
		/*
		 * A UNIQUE HMR WEBSOCKET PATH, so this project can be told apart behind
		 * the monorepo's single-port dev proxy (scripts/dev.mjs).
		 *
		 * Vite's default is `/`, which means every project in this repo would
		 * tell the browser to open `ws://<host>:<port>/`. Four identical socket
		 * URLs behind one proxy cannot be routed, so every connection would land
		 * on whichever project owns `/` — and Vite stamps a per-server token on
		 * the handshake, so the mis-routed ones are rejected outright rather than
		 * merely confused. The symptom is nasty precisely because it is partial:
		 * one project hot-reloads, the rest silently stop, with nothing in the
		 * terminal and one line in the browser console.
		 *
		 * Must match `hmrPathOf()` in scripts/projects.mjs. Running this course
		 * standalone is unaffected — the client reads the same value either way.
		 */
		server: { hmr: { path: '/@hmr/hub' } },
		build: {
			// One page and one island — a chunk-splitting strategy would produce
			// more requests than it saves.
			assetsInlineLimit: 0,
		},
	},
});

export { SITE_URL, TITLE, DESCRIPTION, BASE_PATH };
