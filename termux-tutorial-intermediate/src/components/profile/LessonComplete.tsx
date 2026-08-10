/*
 * LessonComplete — a "mark this lesson complete" toggle placed at the foot of
 * each lesson. Writes to the local progress store, so the sidebar badge and
 * dashboard update instantly.
 *
 *   <LessonComplete client:only="react" slug="foundations/storage" />
 */
import { useProgress } from '../../lib/useProgress';
import { setComplete, stats, LESSONS } from '../../lib/progress';
import Icon from '../icons/icons';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface LessonCompleteProps {
	/** Must match a lesson slug in LESSONS (e.g. "foundations/storage"). */
	slug: string;
}

export default function LessonComplete({ slug }: LessonCompleteProps) {
	const data = useProgress();
	const done = data.completed.includes(slug);
	const s = stats(data);
	/* Ticking the LAST box used to look exactly like ticking the first: the
	   course had no finish line anywhere in the lesson flow, only a changed
	   string on a utility page the learner had no reason to open. */
	const finished = done && s.total > 0 && s.done === s.total;
	/* The last lesson in the curriculum is the course terminus. Ticking it used
	   to say "On to the next one" — pointing at a next lesson that does not
	   exist — regardless of whether anything came after it. Derived from LESSONS
	   rather than hardcoding a slug, so it follows the curriculum automatically
	   (check-curriculum.mjs already guarantees LESSONS matches the sidebar). */
	const isTerminus = LESSONS.length > 0 && LESSONS[LESSONS.length - 1].slug === slug;

	/*
	 * Three states, one attribute. Border and background used to be a pair of
	 * nested inline ternaries; `data-state` puts the state in the DOM and lets
	 * global.css decide what it looks like — which is also how the two tints
	 * stopped disagreeing (`done` mixed into `transparent`, i.e. the page
	 * canvas, while `finished` mixed into --bg-surface: the same card at two
	 * different elevations).
	 *
	 * Type is deliberate rather than inherited. This card sits in the article
	 * flow at the foot of every lesson, so its heading takes the site heading
	 * face (--font-heading) and its closing paragraph takes the body serif
	 * (--font-detail); only the chrome line stays Inter. Before, all three were
	 * Inter because .not-content excluded them from the prose rules and nothing
	 * declared a family.
	 */
	return (
		<div
			className="not-content tmx-island tmx-lesson-complete"
			data-state={finished ? 'finished' : done ? 'done' : 'todo'}
		>
			<div className="tmx-lesson-complete__row">
				<span className="tmx-lesson-complete__mark">
					<Icon name={done ? 'check-circle' : 'square'} size={22} />
				</span>
				<div className="tmx-lesson-complete__copy">
					<div className="tmx-island__title">
						{done ? 'Nailed it — lesson complete.' : 'Finished this lesson?'}
					</div>
					<div className="tmx-island__meta">
						{done
							? isTerminus
								? 'Saved locally in this browser. That was the last lesson.'
								: 'Saved locally in this browser. On to the next one.'
							: 'Check it off to track your run through the course.'}
					</div>
				</div>
				<button
					onClick={() => setComplete(slug, !done)}
					className={`tmx-btn tmx-lesson-complete__btn ${done ? 'tmx-btn--ghost' : 'tmx-btn--primary'}`}
				>
					<Icon name={done ? 'rotate' : 'check'} size={16} />
					{done ? 'Undo' : 'Mark complete'}
				</button>
			</div>

			{finished && (
				// role="status" so the finish line is ANNOUNCED at the moment the
				// last box is ticked, not just painted.
				<div role="status" className="tmx-lesson-complete__banner">
					<Icon name="trophy" size={20} className="tmx-lesson-complete__trophy" />
					<div className="tmx-lesson-complete__copy">
						<div className="tmx-island__title">
							That was the last one — all {s.total} lessons complete.
						</div>
						<p className="tmx-island__prose tmx-island__prose--sm">
							Your phone answers to a script now — its sensors and clipboard readable,
							Android notifications writable, jobs that outlive a reboot, and a server
							you can expose and then shut properly.{' '}
							{/* .not-content excludes this from Starlight's prose link
							    styling, so it would otherwise render as a default
							    browser-blue underline — a second hue. */}
							<a href={`${BASE}/progress/`} className="tmx-lesson-complete__link">
								See your run and export it
							</a>{' '}
							— progress lives only in this browser.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
