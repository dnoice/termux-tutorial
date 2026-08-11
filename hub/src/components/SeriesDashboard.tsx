import { useEffect, useState } from 'react';
import {
	DEFAULT_PROFILE,
	initials,
	readProfile,
	stats,
	type CourseRef,
	type CourseStats,
} from '../lib/store.ts';

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
 *
 * READING AND WRITING LIVE IN store.ts, not here. This component used to carry
 * its own copies of readCourse/readProfile, and they had already drifted: the
 * local one coerced an empty emoji to a penguin, so a learner who chose "use my
 * initials" on the profile page got a penguin on the hub. Two implementations
 * of the same rule is how that happens, every time.
 */

/*
 * The manifest the page hands over. Structurally identical to store.ts's
 * CourseRef, which is the type actually used below — this alias exists only so
 * the prop reads as "what the page passes" at the call site.
 */
export type CourseManifest = CourseRef;

interface Props {
	courses: CourseManifest[];
	/** Series root, e.g. `/termux-tutorial`. Used to build every link out. */
	base: string;
}

export default function SeriesDashboard({ courses, base }: Props) {
	const [ready, setReady] = useState(false);
	const [states, setStates] = useState<Record<string, CourseStats>>({});
	const [profile, setProfile] = useState(DEFAULT_PROFILE);

	useEffect(() => {
		const read = () => {
			const next: Record<string, CourseStats> = {};
			for (const c of courses) next[c.id] = stats(c);
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
				{/*
				 * A link, not a decoration. It was aria-hidden — correct while it was
				 * purely ornamental beside the name, and an outright violation the
				 * moment it became focusable: Tab would land on something no screen
				 * reader could announce. The label carries the destination and the
				 * glyph inside stays hidden, so the name is read once, not twice.
				 *
				 * Empty emoji means "use my initials", which is a real choice on the
				 * profile page — not a missing value to be defaulted away.
				 */}
				<a
					className="dash__avatar"
					href={`${base}/profile/`}
					aria-label={`${profile.name} — open your profile`}
				>
					<span aria-hidden="true">{profile.emoji || initials(profile.name)}</span>
				</a>
				<span className="dash__who">
					<p className="dash__name">{profile.name}</p>
					<p className="dash__sub">
						{untouched
							? 'No progress saved yet'
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
