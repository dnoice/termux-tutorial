/*
 * The rotating hero.
 *
 * TEN VARIATIONS, ONE PROMISE. Each headline offers a different reason to be
 * curious about a command line; the promise line underneath never changes, so
 * every variation answers "what is this site actually offering me" identically.
 * That split is what lets the headlines be evocative — none of them has to also
 * do the explaining.
 *
 * SINGLE SOURCE OF TRUTH. The copy lives here once. `Hero.astro` renders
 * variant 0 into the HTML as the no-JS fallback AND serialises this same array
 * for the client. Writing the fallback into the markup by hand — the obvious
 * approach — means the same paragraph exists in two files, and the day someone
 * edits one is the day they silently diverge.
 *
 * BACKTICKS ARE MARKUP. A command name set in body serif reads as a word rather
 * than a command, and this is a site about commands. `splitCopy` turns
 * `grep` into a <code> element on both the server and the client, built as DOM
 * nodes rather than innerHTML so nothing here can ever become an injection
 * point.
 */

export interface HeroVariant {
	title: string;
	/** Backticked spans become <code>. */
	copy: string;
}

/*
 * Never rotates. The one line that has to answer "so what is this?".
 *
 * IT CARRIES TWO SEPARATE IDEAS, and the previous version collided them.
 * "Three courses, from your first install … You don't need Termux installed to
 * start" put an install and a not-install two sentences apart. Both were true —
 * the curriculum teaches installing, and the site's own terminal lets you
 * practise before you do — but the line never did that reconciling, so the
 * reader had to. The two ideas are now stated separately:
 *
 *   1. THE CURRICULUM assumes nothing and begins with installation and setup.
 *   2. THE SITE has a live terminal, so learning starts immediately.
 *
 * The live terminal is framed as HOW you learn rather than as a reason not to
 * install anything, which is what removes the contradiction rather than hiding
 * it.
 *
 * IT ALSO NAMES ITS AUDIENCE. "New to Linux, or just new to Termux?" answers
 * the only question a stranger is actually asking — is this meant for me — and
 * answers it for both people who arrive: the one who has never opened a
 * terminal, and the one who has used Linux for years and never touched a phone
 * with it. The rotating headlines above sell capability; this is the line that
 * says who is invited.
 */
export const HERO_PROMISE =
	'New to Linux, or just new to Termux? Start here. Three courses guide you through installing and setting up Termux, learning the command line, and eventually writing scripts of your own. Every lesson includes a live terminal, so you can learn by doing from the very start.';

/*
 * Variant 0 is the fallback that ships in the HTML, so it has to work for
 * someone who has never met a terminal: it does not assume Linux vocabulary,
 * it introduces Termux by name, and "beyond the interface" frames the terminal
 * as somewhere further on rather than as a rejection of the GUI.
 */
export const HERO_VARIANTS: HeroVariant[] = [
	{
		title: 'Beyond the interface',
		copy:
			'Android’s familiar interface is only one way to work. Termux opens a Linux ' +
			'command-line environment where a few precise commands can search, move, ' +
			'filter, transform, and automate at a scale that would be tedious by hand.',
	},
	{
		title: 'There’s another side to Android',
		copy:
			'Beyond apps, menus, and gestures is a command line built for direct, ' +
			'repeatable work. With Termux, tools like `grep`, `find`, `mv`, and `cp` can ' +
			'turn surprisingly large jobs into short commands.',
	},
	{
		title: 'Discover what the command line can do',
		copy:
			'A graphical interface is great for many tasks. The terminal shines when the ' +
			'work gets large, repetitive, or precise. Termux brings that way of working ' +
			'to Android.',
	},
	{
		title: 'Small commands. Big jobs.',
		copy:
			'Search a 200,000-line file. Move hundreds of files. Find exactly what you ' +
			'need. Chain tools together. Termux puts Linux command-line tools to work on ' +
			'Android and lets a few commands handle jobs that would be tedious to do ' +
			'manually.',
	},
	{
		title: 'A different way to work with Android',
		copy:
			'Termux turns commands into a practical way to search, organize, process, and ' +
			'automate. Once the tools start to click, tasks that take dozens of ' +
			'individual actions can often be expressed in a line or two.',
	},
	{
		title: 'Where repetition becomes a command',
		copy:
			'The terminal is built for work you don’t want to do one item at a time. With ' +
			'Termux, you can search huge files, reorganize directories, transform text, ' +
			'and automate repeatable tasks with tools designed for exactly that.',
	},
	{
		/*
		 * Was "Meet Android from the command line", which inverted its subject:
		 * the reader already uses Android daily and does not need to meet it —
		 * the command line is the thing being introduced. Stating it as a claim
		 * about Android instead keeps the surprise and points the introduction
		 * the right way round.
		 */
		title: 'Android has a Linux side',
		copy:
			'Underneath the home screen is the same kernel that runs most of the ' +
			'internet, and the same toolbox that comes with it. Termux is the door to ' +
			'that side of your phone — and to the utilities that make small commands ' +
			'add up to fast, flexible work.',
	},
	{
		title: 'The terminal changes the scale',
		copy:
			'One file or ten thousand. Ten lines or two hundred thousand. Linux tools are ' +
			'built to search, filter, move, and process without making you handle ' +
			'everything one item at a time. Termux brings that power to Android.',
	},
	{
		title: 'Open a terminal. See what changes.',
		copy:
			'Once commands like `grep`, `find`, `mv`, and `cp` start to click, everyday ' +
			'computing looks a little different. Termux gives you a place to learn that ' +
			'way of working directly on Android.',
	},
	{
		title: 'More than taps and menus',
		copy:
			'Some jobs are easier to point at. Others are easier to describe. The command ' +
			'line lets you tell the system exactly what you want done — then repeat it ' +
			'across files, folders, or data without doing the work one piece at a time.',
	},
];

/** Split on backticks into alternating prose / code segments. */
export function splitCopy(copy: string): { code: boolean; text: string }[] {
	return copy
		.split('`')
		.map((text, i) => ({ code: i % 2 === 1, text }))
		.filter((s) => s.text !== '');
}
