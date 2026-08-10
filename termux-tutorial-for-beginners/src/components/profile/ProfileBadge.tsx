/*
 * ProfileBadge — the persistent profile widget shown at the top of the sidebar.
 * Displays the local avatar, name, and an overall progress bar. Clicking opens a
 * small inline editor to change the display name and pick an emoji avatar.
 *
 * All state is local (localStorage) via the progress store — nothing leaves the
 * browser.
 */
import { useId, useState } from 'react';
import { useProgress } from '../../lib/useProgress';
import { setProfile, stats } from '../../lib/progress';
import Avatar from './Avatar';

/*
 * Twelve avatar buttons shipped with no accessible name at all, so a screen
 * reader read each one as its Unicode emoji name — "mechanical arm",
 * "alien monster" — which varies by platform and is never phrased as an
 * action. These names are authored, so the control announces what it DOES.
 */
const EMOJI_CHOICES: ReadonlyArray<readonly [emoji: string, name: string]> = [
	['🐧', 'penguin'],
	['🐟', 'fish'],
	['🦊', 'fox'],
	['🐙', 'octopus'],
	['🤖', 'robot'],
	['🐳', 'whale'],
	['🌵', 'cactus'],
	['⚡', 'lightning bolt'],
	['🔥', 'flame'],
	['🚀', 'rocket'],
	['🦾', 'bionic arm'],
	['👾', 'space invader'],
];

export default function ProfileBadge() {
	const data = useProgress();
	const [editing, setEditing] = useState(false);
	const [nameDraft, setNameDraft] = useState(data.profile.name);
	const s = stats(data);
	// Stable ids so <label for> / aria-labelledby survive the island being
	// mounted more than once (Starlight renders the sidebar twice: desktop
	// rail + mobile drawer), which duplicate literal ids would break.
	const uid = useId();
	const nameInputId = `${uid}-name`;
	const avatarGroupId = `${uid}-avatar`;

	const openEditor = () => {
		setNameDraft(data.profile.name);
		setEditing(true);
	};

	const saveName = () => {
		const name = nameDraft.trim() || 'Guest';
		setProfile({ name });
		setEditing(false);
	};

	/*
	 * Presentation lives in the ISLAND CHROME section of global.css. The only
	 * value left inline is the progress-bar width, which is genuinely dynamic.
	 * Selected/unselected chips are expressed with `aria-pressed` alone — the
	 * state was already in the DOM for assistive tech, so the stylesheet reads
	 * it rather than the component branching on it twice.
	 */
	return (
		<div className="tmx-profile-badge tmx-island not-content">
			<div className="tmx-profile-badge__row">
				<Avatar name={data.profile.name} emoji={data.profile.emoji} size={40} />
				<div className="tmx-profile-badge__id">
					<div className="tmx-profile-badge__name">{data.profile.name}</div>
					<div className="tmx-profile-badge__meta">
						{s.done}/{s.total} lessons · {s.percent}%
					</div>
				</div>
				<button
					onClick={editing ? () => setEditing(false) : openEditor}
					aria-label={editing ? 'Close profile editor' : 'Edit profile'}
					aria-expanded={editing}
					className="tmx-profile-badge__edit tmx-tap-icon"
				>
					{editing ? '✕' : '✎'}
				</button>
			</div>

			{/* Progress bar. The numeric "n/8 · n%" line above is the visible
			    label; the bar itself was a pair of unnamed divs, invisible to
			    assistive tech. */}
			<div
				className="tmx-profile-badge__bar"
				role="progressbar"
				aria-valuenow={s.percent}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`Course progress: ${s.done} of ${s.total} lessons complete`}
			>
				<div className="tmx-profile-badge__bar-fill" style={{ width: `${s.percent}%` }} />
			</div>

			{editing && (
				<div className="tmx-profile-badge__editor">
					{/* The label had no htmlFor and the input no id, so the field
					    was programmatically unlabelled — announced as "edit text,
					    blank" (WCAG 3.3.2). */}
					<label htmlFor={nameInputId} className="tmx-profile-badge__label">
						Display name
					</label>
					<div className="tmx-profile-badge__field">
						<input
							id={nameInputId}
							className="tmx-profile-badge__input"
							value={nameDraft}
							onChange={(e) => setNameDraft(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && saveName()}
							maxLength={24}
						/>
						<button onClick={saveName} className="tmx-profile-badge__save">
							Save
						</button>
					</div>

					<div id={avatarGroupId} className="tmx-profile-badge__group-label">
						Avatar
					</div>
					{/* Twelve toggle buttons, none of which announced a name or a
					    state: the selected one differed only by border colour and
					    background tint, so nothing at all changed in the
					    accessibility tree. aria-pressed carries the state, the
					    authored label carries the name, and the group is tied to
					    the visible "Avatar" text via aria-labelledby. */}
					<div role="group" aria-labelledby={avatarGroupId} className="tmx-profile-badge__emoji-grid">
						{EMOJI_CHOICES.map(([emoji, label]) => (
							<button
								key={emoji}
								type="button"
								onClick={() => setProfile({ emoji })}
								aria-pressed={data.profile.emoji === emoji}
								aria-label={`${label} avatar`}
								// 26x26 chips on a touch screen; the existing helper
								// grows them to 44x44 on coarse pointers only.
								className="tmx-profile-badge__chip tmx-tap-icon"
							>
								<span aria-hidden="true">{emoji}</span>
							</button>
						))}
						<button
							type="button"
							onClick={() => setProfile({ emoji: '' })}
							aria-pressed={data.profile.emoji === ''}
							aria-label="Use my initials instead of an emoji"
							className="tmx-profile-badge__chip tmx-profile-badge__chip--initials"
						>
							Aa
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
