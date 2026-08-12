import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
/*
 * The three course ids, directory names and display labels are DECLARED in
 * scripts/projects.mjs at the monorepo root — the same file the dev proxy, the
 * assembler, the link checker and CI read. They used to be written out again
 * here, which made this the fifth copy of a fact that changes whenever a course
 * is added, and nothing fails when you edit four of the five.
 *
 * The import resolves at build time: allowJs is on (astro/tsconfigs/base), so
 * the JSDoc @typedef in projects.mjs types this call site, and Vite bundles the
 * module for the server pass — this file is server-only anyway, it reads
 * node:fs. Verified with `npx astro check` and a full `npm run build`.
 */
import { COURSES as TOPOLOGY } from '../../../scripts/projects.mjs';

/*
 * Course metadata, READ FROM THE COURSES AT BUILD TIME.
 *
 * The hub needs each course's lesson count and first-lesson slug to draw a
 * progress bar and a "continue" link. Hardcoding those numbers here would make
 * the hub quietly wrong the first time somebody adds a lesson — and nothing
 * would fail, the bar would just report the wrong denominator forever.
 *
 * So this parses each course's `src/lib/progress.ts`, which is already the
 * single source of truth for its curriculum (the courses' own
 * check-curriculum.mjs enforces that it agrees with the sidebar and the content
 * files). Reading it here extends that guarantee to the hub for free.
 *
 * PRESENCE IS TESTED ON THE FILE, NOT THE DIRECTORY. load() calls
 * existsSync() on `<dir>/src/lib/progress.ts` — so a course whose directory has
 * not been created yet AND a course whose progress.ts has been moved or renamed
 * both report `present: false`, and the page renders them as "not yet" rather
 * than inventing a total. Only the first of those is a state anyone wants; the
 * second is a silent lie the same shape as the one the throw below catches, and
 * the file check cannot tell them apart. All three courses are present today —
 * `advanced` was the last to arrive and parses nine lessons — so nothing
 * currently takes that branch.
 *
 * A progress.ts that EXISTS but parses to zero lessons is the case that IS
 * caught: it is treated as a build failure, not as absence — see the throw
 * further down. The distinction matters because "the LESSONS format changed and
 * the regex stopped matching" looks exactly like "the course does not exist",
 * and only one of those should ship.
 */

/*
 * The monorepo root, resolved from the working directory rather than from
 * import.meta.url. Astro bundles this module before running it, so
 * import.meta.url points at a build chunk, not at src/lib/ — the first version
 * of this file walked three levels up from the wrong place, found nothing, and
 * reported every course as "not written yet" WITHOUT FAILING. npm scripts run
 * from the package root, so cwd is hub/ and its parent is the workspace.
 */
const WORKSPACE = join(process.cwd(), '..');

export interface CourseLesson {
	slug: string;
	title: string;
}

export interface Course {
	/**
	 * Path segment under the series root — `p.id` from scripts/projects.mjs,
	 * which declares `id === slot` for all three courses, so the URLs built
	 * from this field are the assembled paths. Widened from a hardcoded union
	 * to `string` because the set of ids now comes from projects.mjs; a union
	 * here would be that list written down a second time.
	 */
	id: string;
	/** 1-based position in the series, taken from the order projects.mjs declares. */
	number: number;
	name: string;
	blurb: string;
	/** The localStorage key that course writes. Deliberately distinct per course. */
	storageKey: string;
	/** Directory in the monorepo. */
	dir: string;
	present: boolean;
	lessons: CourseLesson[];
}

/** Pull `{ slug: '…', title: '…' }` pairs out of a LESSONS array literal. */
function parseLessons(source: string): CourseLesson[] {
	const block = source.match(/export const LESSONS[^=]*=\s*\[([\s\S]*?)\n\];/);
	if (!block) return [];
	const out: CourseLesson[] = [];
	for (const m of block[1].matchAll(/slug:\s*'([^']+)'\s*,\s*title:\s*'((?:[^'\\]|\\.)*)'/g)) {
		out.push({ slug: m[1], title: m[2].replace(/\\'/g, "'") });
	}
	return out;
}

/** Read one course's storage key from its own source, rather than restating it. */
function parseStorageKey(source: string, fallback: string): string {
	return source.match(/const KEY = '([^']+)'/)?.[1] ?? fallback;
}

function load(
	id: Course['id'],
	number: Course['number'],
	dir: string,
	name: string,
	blurb: string,
	fallbackKey: string
): Course {
	const progress = join(WORKSPACE, dir, 'src', 'lib', 'progress.ts');
	if (!existsSync(progress)) {
		return { id, number, name, blurb, storageKey: fallbackKey, dir, present: false, lessons: [] };
	}
	const source = readFileSync(progress, 'utf8');
	const lessons = parseLessons(source);

	/*
	 * A course whose progress.ts exists but yields no lessons is a PARSE
	 * failure, not an empty course — and silently rendering it as "not written
	 * yet" is how the hub would ship claiming a finished course does not exist.
	 * Fail the build instead, the same way must() does in the COURSES'
	 * splash/BootSplash.astro — there is no BootSplash in the hub.
	 */
	if (lessons.length === 0) {
		throw new Error(
			`Hub: found ${progress} but parsed 0 lessons from its LESSONS array. ` +
				`The course's curriculum format changed — fix the parser in ` +
				`hub/src/lib/courses.ts rather than shipping a hub that says this ` +
				`course does not exist.`
		);
	}
	return {
		id,
		number,
		name,
		blurb,
		storageKey: parseStorageKey(source, fallbackKey),
		dir,
		present: lessons.length > 0,
		lessons,
	};
}

/*
 * What projects.mjs does NOT declare, because nothing else in the repo needs
 * it: the hub's marketing blurb for each course, and a storage-key fallback.
 *
 * The fallback is only ever used when a course directory is absent, or when its
 * progress.ts stops matching `const KEY = '…'` — parseStorageKey() reads the
 * real key out of the course's own source first. Keeping the literals means a
 * present-but-unparseable course still gets a plausible key rather than
 * `undefined`; they are the values on line 10 of each course's progress.ts.
 *
 * Keyed by the ids projects.mjs declares. A new course added there and not
 * here gets an empty blurb and an empty fallback key, which is visible on the
 * page — not a silent wrong number, which is what the old duplicated list
 * produced.
 */
const BLURBS: Record<string, string> = {
	beginner:
		'Install Termux without breaking it, drive a shell from a phone keyboard, reach your real files, and make the package manager second nature.',
	intermediate:
		'Point that shell at the phone itself — Termux:API for battery, sensors and notifications, scripts that survive a reboot, and a server you can expose and then close.',
	/*
	 * "audio bridging" was here and the advanced course has no audio lesson —
	 * a phantom sold on the hub's own course card. Its nine lessons are three
	 * container/, three desktop/, two hardware/ and where-next; grep for
	 * audio|pulseaudio|sound across that course's content returns two hits,
	 * both the ordinary word "sounds" in prose. The GPU lesson, which the
	 * blurb omitted, is one of the four things it actually teaches. This
	 * sentence now names one thing from each section.
	 */
	advanced:
		'A real Debian userland under PRoot, a desktop drawn on the phone’s own screen with Termux:X11 and XFCE, 3D work handed to the GPU where the hardware allows, and packages compiled on the handset.',
};

const FALLBACK_KEYS: Record<string, string> = {
	beginner: 'tmx:beginners:v1',
	intermediate: 'tmx:intermediate:v1',
	advanced: 'tmx:advanced:v1',
};

export const COURSES: Course[] = TOPOLOGY.map((p, i) =>
	load(p.id, i + 1, p.dir, p.label, BLURBS[p.id] ?? '', FALLBACK_KEYS[p.id] ?? '')
);

/** What the client island needs. Nothing here is secret; it is all public metadata. */
export const COURSE_MANIFEST = COURSES.map((c) => ({
	id: c.id,
	number: c.number,
	name: c.name,
	storageKey: c.storageKey,
	present: c.present,
	total: c.lessons.length,
	lessons: c.lessons.map((l) => l.slug),
}));
