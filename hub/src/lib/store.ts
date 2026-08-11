/*
 * The hub's view of every course's saved progress.
 *
 * WHY THIS EXISTS. Each course owns its own localStorage key, deliberately —
 * they must never overwrite each other's completed lists. But that made the
 * PROFILE per-course too, which is wrong: a learner is one person. Set your
 * name in the beginner course and the intermediate course still called you
 * Guest, and nothing in either course could fix it because neither knows the
 * other exists.
 *
 * The hub does. Every course is a path on one origin, so localStorage is
 * shared, and this module is the one place that writes identity to all of them
 * at once. Progress stays strictly per-course; only the profile is unified.
 *
 * The stored shape is the courses' own `ProgressData`, matched exactly — this
 * writes into files the courses read, so drifting from their shape would
 * silently corrupt someone's progress.
 */

export interface Profile {
	name: string;
	/** A single emoji shown as the avatar. Empty string = fall back to initials. */
	emoji: string;
}

export interface ProgressData {
	profile: Profile;
	completed: string[];
}

export const DEFAULT_PROFILE: Profile = { name: 'Guest', emoji: '🐧' };

export interface CourseRef {
	id: string;
	name: string;
	storageKey: string;
	present: boolean;
	total: number;
	lessons: string[];
}

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/** Read one course's blob, tolerating absent, blocked, or hand-mangled storage. */
export function read(key: string): ProgressData {
	if (!isBrowser()) return { profile: { ...DEFAULT_PROFILE }, completed: [] };
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return { profile: { ...DEFAULT_PROFILE }, completed: [] };
		const d = JSON.parse(raw) as Partial<ProgressData>;
		return {
			profile: {
				name: typeof d.profile?.name === 'string' ? d.profile.name : DEFAULT_PROFILE.name,
				emoji: typeof d.profile?.emoji === 'string' ? d.profile.emoji : DEFAULT_PROFILE.emoji,
			},
			completed: Array.isArray(d.completed) ? d.completed.filter((s) => typeof s === 'string') : [],
		};
	} catch {
		// Storage blocked (private mode, embedded webview) or the value is not
		// JSON. Progress is a convenience: degrade to empty, never throw.
		return { profile: { ...DEFAULT_PROFILE }, completed: [] };
	}
}

/** Returns false when the write was refused, so callers can say so out loud. */
export function write(key: string, data: ProgressData): boolean {
	if (!isBrowser()) return false;
	try {
		localStorage.setItem(key, JSON.stringify(data));
		// Same-document listeners (a course open in this tab) use this event;
		// other tabs get the native `storage` event for free.
		window.dispatchEvent(new CustomEvent('tmx:progress-changed'));
		return true;
	} catch {
		return false;
	}
}

/**
 * The profile, unified. Prefers a real name over the default, so a learner who
 * named themselves in one course is recognised everywhere before they have
 * ever visited this page.
 */
export function readProfile(courses: CourseRef[]): Profile {
	let best: Profile | null = null;
	for (const c of courses) {
		const p = read(c.storageKey).profile;
		const named = p.name.trim() && p.name !== DEFAULT_PROFILE.name;
		if (named) return p;
		if (!best) best = p;
	}
	return best ?? { ...DEFAULT_PROFILE };
}

/** Write the profile to EVERY course, which is the whole point of this module. */
export function writeProfile(courses: CourseRef[], profile: Profile): boolean {
	let ok = true;
	for (const c of courses) {
		const d = read(c.storageKey);
		if (!write(c.storageKey, { ...d, profile: { ...profile } })) ok = false;
	}
	return ok;
}

export interface CourseStats {
	done: number;
	total: number;
	/** First lesson not completed — where "continue" lands. */
	next: string | null;
}

export function stats(c: CourseRef): CourseStats {
	if (!c.present) return { done: 0, total: 0, next: null };
	const completed = new Set(read(c.storageKey).completed);
	// Count only slugs this course actually has, so a lesson renamed since the
	// data was written can never push a course past 100%.
	return {
		done: c.lessons.filter((s) => completed.has(s)).length,
		total: c.total,
		next: c.lessons.find((s) => !completed.has(s)) ?? null,
	};
}

/* ------------------------------------------------------------------ *
 * Export / import
 *
 * The courses each export their own file with `kind: 'termux-<course>-progress'`
 * and refuse anything else BY NAME, because the likeliest wrong file a learner
 * picks is the other course's export.
 *
 * The hub exports a BUNDLE of all of them. Import accepts either — a bundle,
 * or a single course's file — because someone who exported from inside a course
 * last month should not be told their own backup is invalid.
 * ------------------------------------------------------------------ */

export const BUNDLE_KIND = 'termux-tutorial-series-progress';

interface Bundle {
	kind: typeof BUNDLE_KIND;
	version: 1;
	exportedAt: string;
	profile: Profile;
	courses: Record<string, { completed: string[] }>;
}

export function exportBundle(courses: CourseRef[]): string {
	const bundle: Bundle = {
		kind: BUNDLE_KIND,
		version: 1,
		exportedAt: new Date().toISOString(),
		profile: readProfile(courses),
		courses: {},
	};
	for (const c of courses) bundle.courses[c.id] = { completed: read(c.storageKey).completed };
	return JSON.stringify(bundle, null, 2);
}

export function exportFilename(date = new Date()): string {
	return `termux-progress-${date.toISOString().slice(0, 10)}.json`;
}

export type ImportResult =
	| { ok: true; summary: string }
	| { ok: false; error: string };

/** Map a single course's export `kind` back to the course it came from. */
function kindToCourse(kind: string, courses: CourseRef[]): CourseRef | undefined {
	// 'termux-beginners-progress' -> 'beginners'; ids are 'beginner' etc.
	const stem = kind.replace(/^termux-/, '').replace(/-progress$/, '');
	return courses.find((c) => c.id === stem || `${c.id}s` === stem || c.id === stem.replace(/s$/, ''));
}

export function importBundle(json: string, courses: CourseRef[]): ImportResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return { ok: false, error: 'That file is not valid JSON. Pick the .json file you exported.' };
	}
	if (!parsed || typeof parsed !== 'object') {
		return { ok: false, error: 'That file does not look like a progress export.' };
	}
	const p = parsed as Record<string, unknown>;
	const kind = typeof p.kind === 'string' ? p.kind : '';

	const known = new Map(courses.map((c) => [c.id, c]));
	let restored = 0;
	let touched: string[] = [];

	if (kind === BUNDLE_KIND) {
		const incoming = (p.courses ?? {}) as Record<string, { completed?: unknown }>;
		for (const [id, payload] of Object.entries(incoming)) {
			const course = known.get(id);
			// Unknown course: the file predates it, or postdates this build. Skip
			// rather than inventing storage nothing will ever read.
			if (!course) continue;
			const list = Array.isArray(payload?.completed) ? payload.completed : [];
			// Prune slugs this course does not have — keeping them would quietly
			// resurrect renamed lessons on the next export.
			const valid = list.filter((s): s is string => typeof s === 'string' && course.lessons.includes(s));
			const d = read(course.storageKey);
			write(course.storageKey, { ...d, completed: valid });
			restored += valid.length;
			touched.push(`${course.name} ${valid.length}/${course.total}`);
		}
	} else if (kind.startsWith('termux-') && kind.endsWith('-progress')) {
		const course = kindToCourse(kind, courses);
		if (!course) {
			return { ok: false, error: `That file is from a course this hub does not know about (${kind}).` };
		}
		const list = Array.isArray(p.completed) ? p.completed : [];
		const valid = list.filter((s): s is string => typeof s === 'string' && course.lessons.includes(s));
		const d = read(course.storageKey);
		write(course.storageKey, { ...d, completed: valid });
		restored += valid.length;
		touched.push(`${course.name} ${valid.length}/${course.total}`);
	} else {
		return {
			ok: false,
			error: 'That is a JSON file, but not a Termux progress export. Look for the one you downloaded from this site.',
		};
	}

	// A profile in the file is worth taking, but never a blank one over a real.
	const prof = p.profile as Partial<Profile> | undefined;
	if (prof && typeof prof.name === 'string' && prof.name.trim()) {
		writeProfile(courses, {
			name: prof.name,
			emoji: typeof prof.emoji === 'string' ? prof.emoji : DEFAULT_PROFILE.emoji,
		});
	}

	if (!touched.length) {
		return { ok: false, error: 'That export contained no lessons this hub recognises.' };
	}
	return { ok: true, summary: `Restored ${restored} completed lesson${restored === 1 ? '' : 's'} — ${touched.join(', ')}.` };
}

/** Clear one course, or every course. Profile is cleared only with everything. */
export function reset(courses: CourseRef[], only?: CourseRef): boolean {
	const targets = only ? [only] : courses;
	let ok = true;
	for (const c of targets) {
		if (!write(c.storageKey, { profile: only ? read(c.storageKey).profile : { ...DEFAULT_PROFILE }, completed: [] })) {
			ok = false;
		}
	}
	return ok;
}

/** Initials fallback, matching the courses' own avatar behaviour. */
export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return '?';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
