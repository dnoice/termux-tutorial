/*
 * ProgressDashboard — the full "Your Progress" view: big avatar, a progress
 * ring, a per-section checklist, and a reset button. Entirely local.
 */
import { useRef, useState } from 'react';
import { useProgress } from '../../lib/useProgress';
import {
	LESSONS,
	setComplete,
	setManyComplete,
	stats,
	reset,
	exportProgress,
	exportFilename,
	importProgress,
} from '../../lib/progress';
import Avatar from './Avatar';
import Icon from '../icons/icons';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function Ring({ percent }: { percent: number }) {
	const r = 34;
	const c = 2 * Math.PI * r;
	return (
		<svg
			width="84"
			height="84"
			viewBox="0 0 84 84"
			className="tmx-dashboard__ring"
			role="img"
			aria-label={`${percent}% of the course complete`}
		>
			{/* Track needs real contrast: --border-default on parchment is a pale
			    cream that left the ring effectively invisible at 0%, so a learner
			    starting the course saw no ring at all. */}
			<circle
				cx="42"
				cy="42"
				r={r}
				fill="none"
				stroke="color-mix(in srgb, var(--color-brand) 22%, var(--border-default))"
				strokeWidth="8"
			/>
			{/* strokeDashoffset is the one genuinely dynamic value here; the
			    transition that animates it moved to .tmx-dashboard__ring-arc. */}
			<circle
				cx="42" cy="42" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
				className="tmx-dashboard__ring-arc"
				stroke="url(#tmxgrad)"
				strokeDasharray={c}
				strokeDashoffset={c * (1 - percent / 100)}
				transform="rotate(-90 42 42)"
			/>
			<defs>
				<linearGradient id="tmxgrad" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="var(--color-brand)" />
					<stop offset="100%" stopColor="var(--color-brand-emphasis)" />
				</linearGradient>
			</defs>
			{/* Size/weight/fill were SVG presentation attributes, i.e. type set
			    somewhere the stylesheet could not see it at all. */}
			<text x="42" y="47" textAnchor="middle" className="tmx-dashboard__ring-label">
				{percent}%
			</text>
		</svg>
	);
}

/**
 * A real checkbox control.
 *
 * Was a bare ⬜/✅ emoji inside a zero-padding <button>: 25x18px (a quarter of
 * the 44x44 minimum), rendered by the OS emoji font so it could not be themed —
 * lavender on Windows, grey on macOS — and the single most off-palette element
 * on an obsidian-and-brass site. Worse, a miss landed on the sibling <a> and
 * navigated the learner off the dashboard.
 */
function Check({ done }: { done: boolean }) {
	return (
		// Checked/unchecked is styled off the parent button's aria-checked, which
		// already had to be right for assistive tech — so there is exactly one
		// place the state is expressed instead of two that can drift.
		<span aria-hidden="true" className="tmx-dashboard__check">
			{done && (
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M20 6 9 17l-5-5"
						stroke="var(--fg-on-emphasis)"
						strokeWidth="3.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			)}
		</span>
	);
}

export default function ProgressDashboard() {
	const data = useProgress();
	const s = stats(data);
	// Toggling a lesson changed state with no announcement, so a screen-reader
	// user got no confirmation the click did anything.
	const [announce, setAnnounce] = useState('');
	const [confirmReset, setConfirmReset] = useState(false);
	// "Mark all complete" is the more destructive of the two bulk actions in a
	// progress tracker — it erases the distinction between what you have and
	// have not done — and it was the one WITHOUT a guard.
	const [confirmAll, setConfirmAll] = useState(false);
	const [transfer, setTransfer] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const sections = [...new Set(LESSONS.map((l) => l.section))];
	const complete = s.total > 0 && s.done === s.total;

	/*
	 * Export / import.
	 *
	 * `progress.mdx` warned that clearing browser data starts you fresh and
	 * offered nothing to do about it, and there was no way to move a run from
	 * the phone Termux is installed on to a laptop. A downloaded JSON file is
	 * the smallest thing that solves both without a server or an account.
	 */
	function doExport() {
		const url = URL.createObjectURL(
			new Blob([exportProgress(data)], { type: 'application/json' })
		);
		const a = document.createElement('a');
		a.href = url;
		a.download = exportFilename();
		a.click();
		// Revoking immediately can cancel the download in some engines; one
		// frame is enough for the click to be consumed.
		requestAnimationFrame(() => URL.revokeObjectURL(url));
		// The result goes in the role="status" paragraph below rather than the
		// aria-live region, so it is never announced twice.
		setTransfer({ tone: 'ok', text: `Saved ${exportFilename()} to your downloads.` });
	}

	async function doImport(file: File) {
		const result = importProgress(await file.text());
		if (!result.ok) {
			setTransfer({ tone: 'bad', text: result.error });
			return;
		}
		const skipped = result.skipped
			? ` ${result.skipped} ${result.skipped === 1 ? 'entry was' : 'entries were'} ignored — they are not lessons in this course.`
			: '';
		setTransfer({
			tone: 'ok',
			text: `Restored ${result.imported} of ${LESSONS.length} lessons.${skipped}`,
		});
	}

	/*
	 * This is a control panel, not an article, so the chrome is Inter — said
	 * explicitly on .tmx-island rather than inherited by accident. The two
	 * exceptions are marked: the section headers are headings and take
	 * --font-heading, and the completion paragraph is running copy and takes
	 * the body serif. Before, all of it was Inter and the section headers were
	 * Inter Bold 15px on a page whose h1 is Crimson Pro 39px.
	 */
	return (
		<div className="not-content tmx-island tmx-dashboard">
			<div className="tmx-dashboard__hero">
				<Avatar name={data.profile.name} emoji={data.profile.emoji} size={64} />
				<div className="tmx-dashboard__hero-id">
					<div className="tmx-island__title">{data.profile.name}</div>
					<div className="tmx-island__meta">
						{complete
							? 'Every lesson complete — you finished the course.'
							: `${s.done} of ${s.total} lessons complete`}
					</div>
				</div>
				<Ring percent={s.percent} />
			</div>

			{sections.map((section) => (
				<div key={section} className="tmx-dashboard__section">
					{/* Was an <h3> sitting directly under the page <h1>, skipping a
					    level — screen-reader users navigating by heading hit a gap
					    in the outline on the one page that is nothing but a list. */}
					<h2 className="tmx-dashboard__section-title">{section}</h2>
					<div className="tmx-dashboard__list">
						{LESSONS.filter((l) => l.section === section).map((l) => {
							const done = data.completed.includes(l.slug);
							return (
								<div key={l.slug} className="tmx-dashboard__item" data-done={done ? 'true' : 'false'}>
									<button
										onClick={() => {
											setComplete(l.slug, !done);
											setAnnounce(
												`${l.title} marked ${!done ? 'complete' : 'incomplete'}`
											);
										}}
										role="checkbox"
										aria-checked={done}
										aria-label={l.title}
										className="tmx-dashboard__toggle"
									>
										<Check done={done} />
									</button>
									<a href={`${BASE}/${l.slug}/`} className="tmx-dashboard__link">
										{l.title}
									</a>
								</div>
							);
						})}
					</div>
				</div>
			))}

			{/*
			 * The completion moment.
			 *
			 * Finishing the course used to change exactly one string on this page
			 * and nothing else — the learner crossed the finish line and the site
			 * did not react. This is the only place brass is used as a full
			 * surface, which is what makes it read as an event.
			 */}
			{complete && (
				<div className="tmx-dashboard__done">
					<div className="tmx-dashboard__done-head">
						<Icon name="trophy" size={22} className="tmx-dashboard__trophy" />
						<h2 className="tmx-island__title">Course complete — all {s.total} lessons.</h2>
					</div>
					{/* Running copy, not chrome — so the body serif, not Inter. */}
					<p className="tmx-island__prose">
						Your phone answers to a script now. You can read its battery, sensors and
						clipboard from the shell, hand work back to Android as notifications and
						toasts, write scripts that survive a reboot and Doze, and put a server on
						the internet — then close the door behind you. That last part is the one
						most people never learn.
					</p>
					<div className="tmx-dashboard__actions">
						<a href={`${BASE}/reference/cheatsheet/`} className="tmx-btn tmx-btn--primary tmx-tap">
							Keep the cheatsheet handy
						</a>
						<a href={`${BASE}/reference/troubleshooting/`} className="tmx-btn tmx-btn--ghost tmx-tap">
							When something breaks
						</a>
					</div>
					<p className="tmx-dashboard__note">
						Export your progress below before you clear this browser's data — it only
						lives here.
					</p>
				</div>
			)}

			{/* Politely announce toggles; the visual state change was silent. */}
			<div aria-live="polite" className="tmx-sr-only">
				{announce}
			</div>

			{/* Move progress between browsers/devices. Local-only storage meant a
			    cleared cache — or simply switching from the phone to a laptop —
			    silently threw the whole run away. */}
			<div className="tmx-dashboard__transfer">
				<button
					onClick={doExport}
					className="tmx-btn tmx-btn--ghost tmx-tap tmx-dashboard__btn"
				>
					Export progress (.json)
				</button>
				<button
					onClick={() => fileRef.current?.click()}
					className="tmx-btn tmx-btn--ghost tmx-tap tmx-dashboard__btn"
				>
					Import progress
				</button>
				{/* A bare <input type="file"> cannot be styled into this system, so
				    it is driven by the button above. It stays in the DOM (not
				    display:none behind a label) so the click() forward works in
				    every engine; `hidden` keeps it out of the tab order and the
				    accessibility tree, where the button is the real control. */}
				<input
					ref={fileRef}
					type="file"
					accept="application/json,.json"
					hidden
					onChange={(e) => {
						const file = e.target.files?.[0];
						// Reset first: picking the SAME file twice fires no change
						// event otherwise, so a retry after a failed import would
						// look like a dead button.
						e.target.value = '';
						if (file) void doImport(file);
					}}
				/>
			</div>

			{transfer && (
				<p
					role={transfer.tone === 'bad' ? 'alert' : 'status'}
					className="tmx-dashboard__status"
					data-tone={transfer.tone === 'bad' ? 'bad' : 'ok'}
				>
					{transfer.text}
				</p>
			)}

			<div className="tmx-dashboard__bulk">
				<button
					onClick={() => {
						// Same two-step guard the reset button already had: this
						// wipes the record of what you actually did, and it used to
						// fire on a single stray tap.
						if (!confirmAll) {
							setConfirmAll(true);
							return;
						}
						setManyComplete(
							LESSONS.map((l) => l.slug),
							true
						);
						setConfirmAll(false);
						setAnnounce('All lessons marked complete');
					}}
					onBlur={() => setConfirmAll(false)}
					className="tmx-btn tmx-btn--ghost tmx-tap tmx-dashboard__btn"
				>
					{confirmAll ? 'Tap again to tick every lesson' : 'Mark all complete'}
				</button>
				{/* Destructive, and it was visually IDENTICAL to the harmless button
				    beside it. Now danger-coloured, ordered last, and behind a
				    two-step confirm instead of a bare confirm(). */}
				<button
					onClick={() => {
						if (!confirmReset) {
							setConfirmReset(true);
							return;
						}
						reset();
						setConfirmReset(false);
						setAnnounce('Progress reset');
					}}
					onBlur={() => setConfirmReset(false)}
					className="tmx-tap tmx-dashboard__reset"
					data-confirm={confirmReset ? 'true' : 'false'}
				>
					{confirmReset ? 'Tap again to confirm — this erases everything' : 'Reset progress'}
				</button>
			</div>
		</div>
	);
}
