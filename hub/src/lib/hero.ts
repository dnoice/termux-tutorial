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
 * IT ALSO HAS TO CLOSE A GAP THE HEADLINES OPEN. Every rotating headline sells
 * capability — searching a 200,000-line file, automating at scale. Lesson one
 * is "here is which APK to download, and why the Play Store build is a dead
 * end". Both are true, but a reader who arrives expecting a power tour and
 * lands on an install guide has been mis-sold, and the only line that can
 * prevent that is this one.
 *
 * So it names the ARC rather than the format. "Three hands-on courses" said
 * nothing about where a novice enters; "from your first install to scripts of
 * your own" says we start before you have the app and end somewhere worth
 * reaching. That is the actual product.
 *
 * The third beat previously read "Nothing to install to start" — two `to`
 * phrases colliding with no object, so the reader had to guess whether "install"
 * meant the courses, the terminal or Termux. Naming Termux removes the guess.
 */
export const HERO_PROMISE =
	'Three courses, from your first install to scripts of your own. A live terminal in every lesson. You don’t need Termux installed to start.';

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
