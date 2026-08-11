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
const DESCRIPTION =
	'A three-part, hands-on Termux course with a live terminal in every lesson. Start at the beginning, or pick up where you left off.';

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
		build: {
			// One page and one island — a chunk-splitting strategy would produce
			// more requests than it saves.
			assetsInlineLimit: 0,
		},
	},
});

export { SITE_URL, TITLE, DESCRIPTION, BASE_PATH };
