/*
 * Avatar — a self-contained, dependency-free avatar. Shows the chosen emoji, or
 * falls back to the user's initials on a gradient derived from their name.
 */
import { avatarGradient, initials } from '../../lib/progress';

export interface AvatarProps {
	name: string;
	emoji?: string;
	size?: number;
	ring?: boolean;
}

export default function Avatar({ name, emoji, size = 40, ring = true }: AvatarProps) {
	return (
		<div
			aria-hidden="true"
			className={`tmx-avatar${ring ? '' : ' tmx-avatar--flat'}`}
			// Only the three values that DEPEND ON PROPS stay here. Shape, weight,
			// family, ink and the emoji-case background moved to .tmx-avatar in
			// global.css — including the old hardcoded #201509, which duplicated
			// --fg-on-emphasis wrongly: it does not flip on parchment, where brass
			// darkens to #8b6914 and near-black initials landed at ~3.5:1.
			style={{
				width: size,
				height: size,
				fontSize: emoji ? size * 0.55 : size * 0.4,
				// The initials fallback is a gradient derived from the NAME, so it
				// cannot be a class. The emoji case falls through to the token
				// background declared on .tmx-avatar.
				background: emoji ? undefined : avatarGradient(name),
			}}
		>
			{emoji || initials(name)}
		</div>
	);
}
