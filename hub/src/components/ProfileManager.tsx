import { useEffect, useRef, useState } from 'react';
import {
	DEFAULT_PROFILE,
	exportBundle,
	exportFilename,
	importBundle,
	initials,
	readProfile,
	reset,
	stats,
	writeProfile,
	type CourseRef,
	type Profile,
} from '../lib/store.ts';

/*
 * The one place identity is edited for the whole series.
 *
 * Everything here is client-only for the same reason the dashboard is: this
 * data lives in the visitor's browser and nowhere else, so there is nothing
 * to prerender and a server-rendered "Guest" flipping to a real name on
 * hydration would be a worse first frame than a one-line skeleton.
 */

interface Props {
	courses: CourseRef[];
	base: string;
}

/* A small, deliberately opinionated set. A full emoji picker is a lot of
   machinery for a decoration, and the free-text field below accepts anything
   the keyboard can produce anyway. */
const PRESET = ['🐧', '🐟', '🤖', '🦊', '🐙', '🦉', '🌱', '⚡', '🔧', '📦', '🛰️', '🧭'];

type Saved = { kind: 'idle' } | { kind: 'ok'; msg: string } | { kind: 'err'; msg: string };

export default function ProfileManager({ courses, base }: Props) {
	const [ready, setReady] = useState(false);
	const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
	const [draftName, setDraftName] = useState('');
	const [saved, setSaved] = useState<Saved>({ kind: 'idle' });
	const [confirmReset, setConfirmReset] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const [tick, setTick] = useState(0);

	useEffect(() => {
		const p = readProfile(courses);
		setProfile(p);
		setDraftName(p.name === DEFAULT_PROFILE.name ? '' : p.name);
		setReady(true);
		const refresh = () => setTick((n) => n + 1);
		addEventListener('storage', refresh);
		return () => removeEventListener('storage', refresh);
	}, [courses]);

	const live = courses.filter((c) => c.present);
	// `tick` is read here so the stats recompute after a write. eslint would
	// call it unused; it is the dependency that makes this correct.
	void tick;
	const rows = live.map((c) => ({ course: c, s: stats(c) }));
	const done = rows.reduce((n, r) => n + r.s.done, 0);
	const total = rows.reduce((n, r) => n + r.s.total, 0);

	function announce(ok: boolean, msg: string) {
		setSaved(ok ? { kind: 'ok', msg } : { kind: 'err', msg });
		// Long enough to read, short enough not to linger over the next action.
		setTimeout(() => setSaved({ kind: 'idle' }), 4000);
	}

	function commit(next: Profile) {
		setProfile(next);
		const ok = writeProfile(courses, next);
		announce(
			ok,
			ok
				? 'Saved to every course in the series.'
				: 'Could not save — this browser is blocking storage (private mode, or an embedded webview).'
		);
	}

	function saveName(e: { preventDefault(): void }) {
		e.preventDefault();
		const name = draftName.trim() || DEFAULT_PROFILE.name;
		commit({ ...profile, name });
	}

	function doExport() {
		const blob = new Blob([exportBundle(courses)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = exportFilename();
		a.click();
		URL.revokeObjectURL(url);
		announce(true, 'Downloaded. Keep it somewhere you will find it again.');
	}

	async function doImport(file: File) {
		const text = await file.text();
		const res = importBundle(text, courses);
		if (res.ok) {
			const p = readProfile(courses);
			setProfile(p);
			setDraftName(p.name === DEFAULT_PROFILE.name ? '' : p.name);
			setTick((n) => n + 1);
		}
		announce(res.ok, res.ok ? res.summary : res.error);
		if (fileRef.current) fileRef.current.value = '';
	}

	function doReset(only?: CourseRef) {
		const ok = reset(courses, only);
		setTick((n) => n + 1);
		if (!only) {
			setProfile({ ...DEFAULT_PROFILE });
			setDraftName('');
		}
		setConfirmReset(null);
		announce(ok, ok ? (only ? `${only.name} progress cleared.` : 'Everything cleared.') : 'Could not write to storage.');
	}

	if (!ready) return <p className="dash__empty">Reading your profile…</p>;

	const avatar = profile.emoji || initials(profile.name);

	return (
		<div className="prof">
			{/* --- Identity ------------------------------------------------ */}
			<section className="prof__card">
				<h2>You</h2>
				<div className="prof__id">
					<span className="prof__avatar" aria-hidden="true">
						{avatar}
					</span>
					<form className="prof__name" onSubmit={saveName}>
						<label htmlFor="prof-name">Display name</label>
						<div className="prof__row">
							<input
								id="prof-name"
								type="text"
								value={draftName}
								placeholder={DEFAULT_PROFILE.name}
								maxLength={40}
								autoComplete="off"
								onChange={(e) => setDraftName(e.target.value)}
							/>
							<button className="btn btn--primary" type="submit">
								Save
							</button>
						</div>
						<p className="prof__hint">
							Also becomes your shell prompt in the practice terminals — lowercased
							and stripped to letters, digits, <code>_</code> and <code>-</code>,
							the way a real unix username works.
						</p>
					</form>
				</div>

				<fieldset className="prof__emoji">
					<legend>Avatar</legend>
					<div className="prof__emoji-grid">
						{PRESET.map((e) => (
							<button
								key={e}
								type="button"
								className="prof__emoji-btn"
								aria-pressed={profile.emoji === e}
								aria-label={`Use ${e} as your avatar`}
								onClick={() => commit({ ...profile, emoji: e })}
							>
								{e}
							</button>
						))}
						<button
							type="button"
							className="prof__emoji-btn prof__emoji-btn--initials"
							aria-pressed={profile.emoji === ''}
							aria-label="Use your initials instead of an emoji"
							onClick={() => commit({ ...profile, emoji: '' })}
						>
							{initials(profile.name)}
						</button>
					</div>
				</fieldset>
			</section>

			{/* --- Progress ------------------------------------------------ */}
			<section className="prof__card">
				<h2>Progress</h2>
				<p className="prof__total">
					<strong>{done}</strong> of {total} lessons across the series
				</p>
				<div className="prof__courses">
					{rows.map(({ course, s }) => {
						const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
						return (
							<div className="prof__course" key={course.id}>
								<div className="prof__course-head">
									<a href={`${base}/${course.id}/`}>{course.name}</a>
									<span>
										{s.done}/{s.total}
									</span>
								</div>
								<span className="meter">
									<span
										className="meter__fill"
										style={{ inlineSize: `${pct}%` }}
										role="progressbar"
										aria-valuenow={s.done}
										aria-valuemin={0}
										aria-valuemax={s.total}
										aria-label={`${course.name}: ${s.done} of ${s.total} complete`}
									/>
								</span>
								<div className="prof__course-actions">
									{s.next ? (
										<a href={`${base}/${course.id}/${s.next}/`}>Continue →</a>
									) : (
										<span className="prof__done">Finished</span>
									)}
									{confirmReset === course.id ? (
										<span className="prof__confirm">
											Clear {course.name}?
											<button type="button" onClick={() => doReset(course)}>
												Yes
											</button>
											<button type="button" onClick={() => setConfirmReset(null)}>
												No
											</button>
										</span>
									) : (
										<button
											type="button"
											className="prof__linkish"
											onClick={() => setConfirmReset(course.id)}
											disabled={s.done === 0}
										>
											Clear
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{/* --- Backup -------------------------------------------------- */}
			<section className="prof__card">
				<h2>Backup</h2>
				<p className="prof__hint">
					Everything on this page lives in <strong>this browser only</strong>.
					Clearing site data, switching device, or opening a private window all
					start you fresh. A file is the only way to move it.
				</p>
				<div className="prof__actions">
					<button className="btn" type="button" onClick={doExport}>
						Export all progress
					</button>
					<button className="btn" type="button" onClick={() => fileRef.current?.click()}>
						Import from a file
					</button>
					<input
						ref={fileRef}
						type="file"
						accept="application/json,.json"
						className="sr-only"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) void doImport(f);
						}}
					/>
				</div>
				<p className="prof__hint">
					Import also accepts a file exported from inside a single course, so an
					older backup still works.
				</p>

				<div className="prof__danger">
					{confirmReset === '__all__' ? (
						<span className="prof__confirm">
							Erase your name, avatar and every lesson in all three courses?
							<button type="button" onClick={() => doReset()}>
								Erase everything
							</button>
							<button type="button" onClick={() => setConfirmReset(null)}>
								Cancel
							</button>
						</span>
					) : (
						<button
							type="button"
							className="prof__linkish prof__linkish--danger"
							onClick={() => setConfirmReset('__all__')}
						>
							Erase everything
						</button>
					)}
				</div>
			</section>

			{/* One live region for every outcome, so a screen reader hears the
			    result of a save, an import and a reset the same way. */}
			<p
				className={`prof__status prof__status--${saved.kind}`}
				role="status"
				aria-live="polite"
			>
				{saved.kind === 'idle' ? '' : saved.msg}
			</p>
		</div>
	);
}
