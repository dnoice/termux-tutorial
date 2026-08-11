import { useEffect, useState } from 'react';

/*
 * The cross-course dashboard.
 *
 * THIS WORKS BECAUSE OF A DECISION MADE MUCH EARLIER. Every course is a path on
 * one origin, and `localStorage` is scoped to the ORIGIN, not the path — so the
 * hub can read every course's progress without a backend, an account, or any
 * data leaving the browser. The courses keep deliberately DISTINCT keys
 * (`tmx:beginners:v1`, `tmx:intermediate:v1`) precisely so they do not
 * overwrite each other; the payoff is that they can all be read here.
 *
 * It renders on the client only. Progress is per-browser, so there is nothing
 * meaningful to prerender — and a server-rendered "0%" that flips to "45%" on
 * hydration would be a worse first frame than a brief skeleton.
 */

export interface CourseManifest {
	id: string;
	number: number;
	name: string;
	storageKey: string;
	present: boolean;
	total: number;
	lessons: string[];
}

interface Props {
	courses: CourseManifest[];
	/** Series root, e.g. `/termux-tutorial`. Used to build course links. */
	base: string;
}

interface Stored {
	profile?: { name?: string; emoji?: string };
	completed?: string[];
}

interface CourseState {
	done: number;
	total: number;
	/** First lesson not yet completed — where "continue" should land. */
	next: string | null;
}

function readCourse(c: CourseManifest): CourseState {
	if (!c.present) return { done: 0, total: 0, next: null };
	let data: Stored = {};
	try {
		data = JSON.parse(localStorage.getItem(c.storageKey) ?? '{}') as Stored;
	} catch {
		// Storage blocked, or somebody hand-edited the value. Either way the
		// dashboard is a convenience: degrade to zero rather than throwing and
		// taking the whole page with it.
		data = {};
	}
	const completed = new Set(Array.isArray(data.completed) ? data.completed : []);
	// Count only slugs this course actually has, so a renamed lesson left in
	// storage can never push a course above 100%.
	const done = c.lessons.filter((s) => completed.has(s)).length;
	const next = c.lessons.find((s) => !completed.has(s)) ?? null;
	return { done, total: c.total, next };
}

/** The profile is per-course, but a learner is one person: take the first real name. */
function readProfile(courses: CourseManifest[]): { name: string; emoji: string } {
	for (const c of courses) {
		try {
			const d = JSON.parse(localStorage.getItem(c.storageKey) ?? '{}') as Stored;
			const name = d.profile?.name?.trim();
			if (name && name !== 'Guest') return { name, emoji: d.profile?.emoji || '🐧' };
		} catch {
			/* keep looking */
		}
	}
	return { name: 'Guest', emoji: '🐧' };
}

export default function SeriesDashboard({ courses, base }: Props) {
	const [ready, setReady] = useState(false);
	const [states, setStates] = useState<Record<string, CourseState>>({});
	const [profile, setProfile] = useState({ name: 'Guest', emoji: '🐧' });

	useEffect(() => {
		const read = () => {
			const next: Record<string, CourseState> = {};
			for (const c of courses) next[c.id] = readCourse(c);
			setStates(next);
			setProfile(readProfile(courses));
			setReady(true);
		};
		read();
		// Another tab — a course open next door — may change progress while this
		// page is open. `storage` fires only for OTHER documents, which is
		// exactly the case that matters here.
		addEventListener('storage', read);
		return () => removeEventListener('storage', read);
	}, [courses]);

	const live = courses.filter((c) => c.present);
	const done = live.reduce((n, c) => n + (states[c.id]?.done ?? 0), 0);
	const total = live.reduce((n, c) => n + c.total, 0);
	const pct = total ? Math.round((done / total) * 100) : 0;

	// The course to continue: the first live one that is not finished.
	const resume = live.find((c) => (states[c.id]?.done ?? 0) < c.total);
	const resumeState = resume ? states[resume.id] : undefined;

	if (!ready) {
		return (
			<div className="dash">
				<p className="dash__empty">Reading your progress…</p>
			</div>
		);
	}

	const untouched = done === 0;

	return (
		<div className="dash">
			<div className="dash__head">
				<span className="dash__avatar" aria-hidden="true">
					{profile.emoji}
				</span>
				<span className="dash__who">
					<p className="dash__name">{profile.name}</p>
					<p className="dash__sub">
						{untouched
							? 'No progress saved in this browser yet'
							: `${done} of ${total} lessons complete`}
					</p>
				</span>
				<span className="dash__pct" aria-hidden="true">
					{pct}%
				</span>
			</div>

			{untouched ? (
				<p className="dash__empty">
					Your progress is stored in this browser only — no account, nothing sent
					anywhere. Finish a lesson and it will show up here, across all three
					courses.
				</p>
			) : (
				<div className="dash__rows">
					{live.map((c) => {
						const s = states[c.id] ?? { done: 0, total: c.total, next: null };
						const cpct = c.total ? Math.round((s.done / c.total) * 100) : 0;
						return (
							<div className="dash__row" key={c.id}>
								<span className="dash__row-name">{c.name}</span>
								<span className="dash__row-count">
									{s.done}/{c.total}
								</span>
								<span className="meter">
									<span
										className="meter__fill"
										style={{ inlineSize: `${cpct}%` }}
										role="progressbar"
										aria-valuenow={s.done}
										aria-valuemin={0}
										aria-valuemax={c.total}
										aria-label={`${c.name}: ${s.done} of ${c.total} lessons complete`}
									/>
								</span>
							</div>
						);
					})}
				</div>
			)}

			<div className="dash__actions">
				{resume && resumeState?.next ? (
					<a className="btn btn--primary" href={`${base}/${resume.id}/${resumeState.next}/`}>
						{untouched ? 'Start the first lesson' : `Continue ${resume.name}`}
					</a>
				) : (
					<a className="btn btn--primary" href={`${base}/beginner/`}>
						Revisit the beginner course
					</a>
				)}
				{/* The hub owns identity now. This used to send people INTO the
				    beginner course to edit a profile that is supposed to be theirs
				    across all three — and edits made there never reached the others. */}
				<a className="btn" href={`${base}/profile/`}>
					Manage your profile
				</a>
			</div>
		</div>
	);
}
