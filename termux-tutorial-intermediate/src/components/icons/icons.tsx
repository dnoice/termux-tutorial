/*
 * Inline SVG icons for the React islands (buttons, terminal chrome, etc.).
 * Self-contained — no CDN, no font — so they work under our COEP policy and
 * offline. Stroke icons inherit `currentColor`; sized via the `size` prop.
 *
 * Astro/MDX content uses astro-icon (<Icon name="fa6-solid:..." />) instead;
 * this set exists only where JSX can't reach that component.
 */
import type { CSSProperties } from 'react';

export type IconName =
	| 'play'
	| 'check'
	| 'check-circle'
	| 'square'
	| 'bolt'
	| 'arrow-right'
	| 'pen'
	| 'rotate'
	| 'trophy'
	| 'terminal'
	| 'x';

const STROKE: Partial<Record<IconName, string>> = {
	check: 'M20 6 9 17l-5-5',
	square: 'M4 5h16v16H4z',
	'arrow-right': 'M4 12h15M13 6l6 6-6 6',
	pen: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
	rotate: 'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5',
	x: 'M6 6l12 12M18 6 6 18',
	terminal: 'M5 7l4 4-4 4M12 15h6',
};

const FILL: Partial<Record<IconName, string>> = {
	play: 'M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z',
	bolt: 'M13 2 4.5 13.2A.6.6 0 0 0 5 14.2h5l-1 7.8 8.5-11.2a.6.6 0 0 0-.5-1H12z',
	trophy:
		'M7 4h10v3a5 5 0 0 1-10 0zM7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3M9 14h6l-.5 4h-5zM8 20h8v1H8z',
};

export interface IconProps {
	name: IconName;
	size?: number;
	style?: CSSProperties;
	className?: string;
	/**
	 * Every icon here sits beside its own text label, so the default is
	 * `true` — hidden from assistive tech and out of the tab order.
	 * Pass a `label` instead when an icon is the ONLY content of a control.
	 */
	'aria-hidden'?: boolean;
	/** Accessible name. Supplying it promotes the svg to `role="img"`. */
	label?: string;
}

export default function Icon({
	name,
	size = 18,
	style,
	className,
	// This prop was declared on IconProps but never destructured, so any
	// caller passing it got silently ignored — a trap for the next person
	// who needs a meaningful icon. It is now honoured, and `label` gives a
	// real accessible name rather than leaving an unnamed graphic.
	'aria-hidden': ariaHidden,
	label,
}: IconProps) {
	const stroke = STROKE[name];
	const fill = FILL[name];
	const isCircle = name === 'check-circle';
	const decorative = ariaHidden ?? !label;
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			className={className}
			style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
			fill="none"
			stroke="none"
			role={decorative ? undefined : 'img'}
			aria-hidden={decorative || undefined}
			aria-label={decorative ? undefined : label}
			// Keeps the svg out of the tab order in IE-era and some mobile
			// engines that still make SVG focusable.
			focusable="false"
		>
			{isCircle && (
				<>
					<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
					<path d="M8.5 12.5 11 15l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
				</>
			)}
			{stroke && (
				<path d={stroke} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			)}
			{fill && <path d={fill} fill="currentColor" />}
		</svg>
	);
}
