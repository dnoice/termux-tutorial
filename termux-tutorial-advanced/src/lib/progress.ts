/*
 * Local-only profile + progress store.
 *
 * Everything lives in localStorage under a single key — no account, no server,
 * no network. A tiny pub/sub keeps every mounted component (sidebar badge,
 * per-lesson buttons, the dashboard) in sync, and the browser `storage` event
 * keeps multiple tabs consistent.
 */

/*
 * NEVER SHARE THIS KEY WITH ANOTHER COURSE — not even to "consolidate the
 * duplicated store", which is the exact change that breaks it.
 *
 * The four projects are PATHS on one origin AND one base directory
 * (/termux-tutorial/{,beginner,intermediate,advanced}), and localStorage is
 * scoped to the origin, not the path. A shared key means each course silently
 * overwrites the others' `completed` array and profile: no error, no warning,
 * no recovery — the learner just finds their other course blank.
 *
 * `v1` is a SCHEMA version, not a course counter. Bump it only when the stored
 * shape changes, never to distinguish a course.
 *
 * The payoff for keeping them distinct: hub/src/lib/store.ts reads all three
 * keys and writes the shared profile back into each.
 */
const KEY = 'tmx:advanced:v1';
const EVENT = 'tmx:progress-changed';

export interface Profile {
	name: string;
	/** A single emoji shown as the avatar. Empty = use initials. */
	emoji: string;
}

export interface ProgressData {
	profile: Profile;
	/** Slugs of completed lessons. */
	completed: string[];
}

/** Canonical curriculum — the source of truth for progress totals. */
export interface Lesson {
	slug: string;
	title: string;
	section: string;
}

export const LESSONS: Lesson[] = [
	{ slug: 'container/why-proot', title: 'Root Without Rooting', section: 'A Real Distribution' },
	{ slug: 'container/first-distro', title: 'Installing a Full Distro', section: 'A Real Distribution' },
	{ slug: 'container/living-in-it', title: 'Living in the Container', section: 'A Real Distribution' },
	{ slug: 'desktop/x11-server', title: 'A Display Server on Android', section: 'A Desktop on Your Phone' },
	{ slug: 'desktop/xfce', title: 'Bringing Up XFCE', section: 'A Desktop on Your Phone' },
	{ slug: 'desktop/across-the-boundary', title: 'The Desktop in the Container', section: 'A Desktop on Your Phone' },
	{ slug: 'hardware/gpu', title: 'Handing Work to the GPU', section: 'Hardware & Your Own Builds' },
	{ slug: 'hardware/building', title: 'Building Packages of Your Own', section: 'Hardware & Your Own Builds' },
	{ slug: 'where-next', title: 'Where to Next', section: 'Hardware & Your Own Builds' },
];

const DEFAULT: ProgressData = { profile: { name: 'Guest', emoji: '🐧' }, completed: [] };

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export function load(): ProgressData {
	if (!isBrowser()) return structuredClone(DEFAULT);
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return structuredClone(DEFAULT);
		const parsed = JSON.parse(raw) as Partial<ProgressData>;
		return {
			profile: { ...DEFAULT.profile, ...parsed.profile },
			completed: Array.isArray(parsed.completed) ? parsed.completed : [],
		};
	} catch {
		return structuredClone(DEFAULT);
	}
}

/** Returns false when the write was refused, so callers can say so out loud. */
function save(data: ProgressData): boolean {
	if (!isBrowser()) return false;
	try {
		localStorage.setItem(KEY, JSON.stringify(data));
	} catch {
		// Quota exceeded, or storage blocked entirely (Safari private mode,
		// "block all cookies", some embedded webviews). Progress is a
		// convenience, never a prerequisite — degrade silently rather than
		// throwing inside a click handler and breaking the page.
		return false;
	}
	window.dispatchEvent(new CustomEvent(EVENT));
	return true;
}

export function setProfile(patch: Partial<Profile>): ProgressData {
	const data = load();
	data.profile = { ...data.profile, ...patch };
	save(data);
	return data;
}

export function isComplete(slug: string): boolean {
	return load().completed.includes(slug);
}

export function setComplete(slug: string, done: boolean): ProgressData {
	const data = load();
	const set = new Set(data.completed);
	done ? set.add(slug) : set.delete(slug);
	data.completed = [...set];
	save(data);
	return data;
}

export function toggleComplete(slug: string): ProgressData {
	return setComplete(slug, !isComplete(slug));
}

/**
 * Set many slugs at once. "Mark all complete" previously called setComplete()
 * per lesson, so it did N read-modify-write cycles and fired N change events —
 * N re-renders of every subscribed component for one user action.
 */
export function setManyComplete(slugs: string[], done: boolean): ProgressData {
	const data = load();
	const set = new Set(data.completed);
	for (const slug of slugs) done ? set.add(slug) : set.delete(slug);
	data.completed = [...set];
	save(data);
	return data;
}

export function reset(): ProgressData {
	if (isBrowser()) localStorage.removeItem(KEY);
	if (isBrowser()) window.dispatchEvent(new CustomEvent(EVENT));
	return structuredClone(DEFAULT);
}

export interface ProgressStats {
	done: number;
	total: number;
	percent: number;
}

export function stats(data: ProgressData = load()): ProgressStats {
	const total = LESSONS.length;
	const done = LESSONS.filter((l) => data.completed.includes(l.slug)).length;
	return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/* ------------------------------------------------------------------ *
 * Export / import
 *
 * Progress lives in one localStorage key, so it was trapped in one browser
 * on one device: `progress.mdx` warned that clearing browser data starts you
 * fresh and offered no way out. A learner who does the first half of the
 * course on a phone (the device Termux actually runs on) and the rest on a
 * laptop had no way to carry it across, and the store exposed no
 * serialization entry point at all.
 *
 * The file is deliberately a plain, readable JSON object rather than an
 * opaque blob — this is an honour-system checklist, not an auth token.
 * ------------------------------------------------------------------ */

/*
 * DECLARED BEFORE THE INTERFACE, AND THE INTERFACE KEYS OFF IT.
 *
 * This constant and `ProgressExport['kind']` used to be two independent string
 * literals that had to be kept equal by hand, and porting a course is exactly
 * the moment they stop being equal: this file arrived from course two with
 * EXPORT_KIND correctly updated and the interface still saying
 * `termux-intermediate-progress`, which is two of the three typecheck errors
 * the advanced course shipped with. `typeof EXPORT_KIND` makes that
 * unrepresentable — there is now one string, and the next port changes it once.
 */
export const EXPORT_KIND = 'termux-advanced-progress' as const;

/** Wire format for an exported progress file. */
export interface ProgressExport {
	/** Guards against importing an unrelated JSON file and wiping progress. */
	kind: typeof EXPORT_KIND;
	version: 1;
	exportedAt: string;
	profile: Profile;
	completed: string[];
}

/** Serialize current progress as pretty-printed JSON. */
export function exportProgress(data: ProgressData = load()): string {
	const payload: ProgressExport = {
		kind: EXPORT_KIND,
		version: 1,
		exportedAt: new Date().toISOString(),
		profile: { ...data.profile },
		completed: [...data.completed],
	};
	return JSON.stringify(payload, null, 2);
}

/** Suggested download filename, e.g. `termux-progress-2026-08-06.json`. */
export function exportFilename(date: Date = new Date()): string {
	return `termux-progress-${date.toISOString().slice(0, 10)}.json`;
}

export type ImportResult =
	| { ok: true; data: ProgressData; imported: number; skipped: number }
	| { ok: false; error: string };

/**
 * Replace stored progress from an exported file.
 *
 * Every failure path returns a message a learner can act on rather than
 * throwing — this runs inside a file-picker handler, and an exception there
 * would leave the dashboard looking like nothing happened.
 *
 * Unknown slugs are PRUNED rather than stored: `stats()` already derives
 * totals from LESSONS so they could never inflate the percentage, but keeping
 * them would silently resurrect renamed lessons on the next export.
 */
export function importProgress(json: string): ImportResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return { ok: false, error: "That file isn't valid JSON." };
	}
	if (!parsed || typeof parsed !== 'object') {
		return { ok: false, error: "That file doesn't look like a progress file." };
	}
	const candidate = parsed as Partial<ProgressExport>;
	if (candidate.kind !== EXPORT_KIND) {
		return {
			ok: false,
			// Names THIS course, because the likeliest wrong file by far is a
			// sibling course's export — same site, same button, different slugs.
			// Course three has two siblings to be confused with, not one.
			error: "That's a JSON file, but not a Termux: Advanced progress file.",
		};
	}
	if (!Array.isArray(candidate.completed)) {
		return { ok: false, error: 'That progress file is missing its lesson list.' };
	}

	const known = new Set(LESSONS.map((l) => l.slug));
	const incoming = candidate.completed.filter((s): s is string => typeof s === 'string');
	const completed = [...new Set(incoming.filter((s) => known.has(s)))];

	const data: ProgressData = {
		profile: { ...DEFAULT.profile, ...(candidate.profile ?? {}) },
		completed,
	};
	// A silent no-op here would be the worst outcome: the learner hands us
	// their only backup and we say nothing while storage refuses the write.
	if (!save(data)) {
		return {
			ok: false,
			error: "This browser is blocking local storage, so progress can't be saved here.",
		};
	}
	return {
		ok: true,
		data,
		imported: completed.length,
		skipped: incoming.length - completed.length,
	};
}

/** Subscribe to any change (same tab via CustomEvent, cross-tab via storage). */
export function subscribe(cb: () => void): () => void {
	if (!isBrowser()) return () => {};
	const onStorage = (e: StorageEvent) => {
		if (e.key === KEY) cb();
	};
	window.addEventListener(EVENT, cb);
	window.addEventListener('storage', onStorage);
	return () => {
		window.removeEventListener(EVENT, cb);
		window.removeEventListener('storage', onStorage);
	};
}

/*
 * Deterministic gradient derived from a name, for the initials avatar.
 *
 * Was `hsl(${hash % 360} 70% 55%)` — an UNBOUNDED hue at 70% saturation, and
 * the only code path in the repo that could emit an arbitrary colour. The
 * "Aa / use initials instead" button in ProfileBadge switches to it
 * permanently, in the sidebar, on every page — so one click could plant a
 * saturated green or violet disc on a site whose stated rule is that brass is
 * the single accent.
 *
 * Variety now comes from sweep ANGLE and mix RATIO instead of hue, and both
 * stops are derived from --color-brand, so the avatar also rethemes with the
 * light/dark palette (the old hsl() literals did not).
 */
export function avatarGradient(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
	const angle = 90 + (hash % 4) * 45; // 90 / 135 / 180 / 225deg
	const lift = 15 + ((hash >>> 3) % 5) * 8; // 15-47% toward the bright stop
	return (
		`linear-gradient(${angle}deg, var(--color-brand), ` +
		`color-mix(in srgb, var(--color-brand-emphasis) ${lift}%, var(--color-brand)))`
	);
}

export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return '?';
	return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}
