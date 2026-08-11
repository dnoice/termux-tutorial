import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
 * If a course directory is missing or its LESSONS array cannot be found, the
 * course is reported as `present: false` and the page renders it as "not yet"
 * rather than inventing a total. That is also how `advanced` is handled today.
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
	/** Path segment under the series root. '' would be the hub itself. */
	id: 'beginner' | 'intermediate' | 'advanced';
	number: 1 | 2 | 3;
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
	 * Fail the build instead, the same way BootSplash's must() does.
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

export const COURSES: Course[] = [
	load(
		'beginner',
		1,
		'termux-tutorial-for-beginners',
		'Beginner',
		'Install Termux without breaking it, drive a shell from a phone keyboard, reach your real files, and make the package manager second nature.',
		'tmx:beginners:v1'
	),
	load(
		'intermediate',
		2,
		'termux-tutorial-intermediate',
		'Intermediate',
		'Point that shell at the phone itself — Termux:API for battery, sensors and notifications, scripts that survive a reboot, and a server you can expose and then close.',
		'tmx:intermediate:v1'
	),
	load(
		'advanced',
		3,
		'termux-tutorial-advanced',
		'Advanced',
		'Full distributions under PRoot, a graphical desktop over X11, audio bridging, and building packages of your own.',
		'tmx:advanced:v1'
	),
];

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
