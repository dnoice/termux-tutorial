# Contributing

Thanks for helping make Termux more approachable! Corrections, clearer
explanations, and new lessons are all welcome.

## Ground rules

- **Accuracy first.** Every command should work on a current Termux install from
  F-Droid. When in doubt, test it on a real device.
- **Beginner-friendly tone.** Explain *why*, not just *how*. Avoid jargon, or
  define it the first time it appears.
- **Interactive where it helps.** If a lesson teaches commands the simulator
  supports, add a `<TermuxTerminal>` so readers can try them. Never instruct a
  command the simulator cannot run inside a block that tells the reader to try
  it here — that is a trust bug, not a nit.
- **Assume a phone.** This course is about Android, and most of it is read on
  Android. Check any layout change at 360px wide, and remember the practice
  terminal is only about 40 columns there.

## Local development

Run these from the repo root (this directory), not from the `termux-tutorials/`
parent workspace.

```bash
npm install
npm run dev
npm run check   # typecheck — must be clean before you open a PR
npm run build   # must pass before you open a PR
```

There are two gates, and CI runs both.

`npm run check` is `astro check`, the TypeScript compiler over the project.
`tsconfig.json` extends `astro/tsconfigs/strict` and that is enforced:
`typescript` and `@astrojs/check` are installed, and the tree is currently at
**0 errors, 0 warnings, 0 hints** — keep it there. `astro build` on its own
still does not typecheck, so running the build is not a substitute.

`npm run build` runs two guard scripts around the build itself:

```bash
node scripts/check-curriculum.mjs && astro build && node scripts/check-links.mjs
```

Either one exits non-zero and takes the build with it. Read the failure — both
print the exact slug or URL at fault — rather than working around the guard.

## Adding a lesson

Steps 3 and 4 used to be honour-system; they are now checked by
`scripts/check-curriculum.mjs`, which runs before every build. Skipping one no
longer produces a green build with a broken course — it produces a named error.

1. Create a `.md` or `.mdx` file under `src/content/docs/<section>/`.
2. Add frontmatter: `title` and `description`. Utility pages (reference, tools)
   must set **both** `prev: false` and `next: false` to stay out of the prev/next
   chain — the guard rejects one without the other.
3. Add the page to the `sidebar` array in `astro.config.mjs`. **That array is
   the source of order**, both for the menu and for the prev/next pagination
   Starlight builds from it — a lesson in the wrong slot puts the learner on the
   wrong rail. (`sidebar.order` in frontmatter is inert while an explicit
   `sidebar` array is configured; existing files still carry it, and the guard
   insists those values keep ascending so a later switch to `autogenerate`
   cannot silently reshuffle the course.)
4. If it should count toward course progress, add its slug to `LESSONS` in
   `src/lib/progress.ts`, then drop a
   `<LessonComplete client:only="react" slug="section/slug" />` at the foot of
   the lesson (this requires an `.mdx` file). The slug string must match
   `LESSONS` exactly — the guard compares them character for character.
5. If the new lesson goes at the **end** of the course, move `next: false` onto
   it and off the lesson that used to be last. Exactly one lesson may carry it,
   and it must be the final one, or the chain dead-ends early.
6. Adding a lesson at the **front** means updating `index.mdx`'s hero action and
   its `next.link` to match — both must point at lesson one, and both must stay
   relative (no leading slash).
7. If the lesson teaches a skill the `teaches` list in the `schema.org` block in
   `astro.config.mjs` should advertise, add it there too. Nothing enforces that
   one.

Run `npm run check:curriculum` on its own while you work; it needs no build and
finishes instantly.

### Linking between pages

Write links **root-relative**: `[the storage lesson](/foundations/storage/)`.
The `rehypeBasePaths` plugin in `astro.config.mjs` prefixes `base` at build
time, so the deploy path lives in one place. Never hardcode
`/termux-tutorial/...`.

Two places the plugin cannot reach, because it only rewrites anchors produced
by the Markdown pipeline:

- **Raw `<a href>` in MDX** — use `` <a href={`${base}/foundations/packages/`}> ``
  with `export const base = import.meta.env.BASE_URL.replace(/\/$/, '')` at the
  top of the file (see `src/content/docs/index.mdx`).
- **Frontmatter links** (hero actions, `next.link`, `prev.link`) — Starlight
  does not base-prefix these and frontmatter cannot evaluate `BASE_URL`. Use a
  **relative** link with no leading slash (`start/why-termux/`).

A leading slash in either of those places 404s on GitHub Pages — a 200 in dev,
a 404 in production. `scripts/check-links.mjs` runs over `dist/` after the build
and is what catches it: it fails on any internal link that resolves to no file,
any `#fragment` naming an `id` the target page does not have, and any
root-relative internal URL that never picked up the `base` prefix. Run it alone
with `npm run check:links` (it needs an existing `dist/`).

### Using the interactive components

```mdx
import TermuxTerminal from '../../../components/terminal/TermuxTerminal.tsx';
import PracticeSection from '../../../components/lesson/PracticeSection.astro';

<PracticeSection>

1. **Do the thing.** Type `ls -a`.

<TermuxTerminal client:only="react" hint="Start with: whoami" height={380} />

</PracticeSection>
```

- `client:only="react"` is **required** — these components are browser-only
  (xterm.js touches the DOM at import time).
- **Wrap instructions and their terminal in `<PracticeSection>`.** On a wide
  screen it pins the terminal to the bottom of the viewport so the steps stay
  readable while the learner types, and releases it at the end of the section.
  The wrapper is what bounds that; a terminal outside one just scrolls away.
  Leave a blank line either side of the tags or MDX will not parse the Markdown
  between them.
- Useful props: `hint` (an extra banner line), `height` (defaults to 340; the
  screen also clamps to `45vh` so the soft keyboard cannot bury it), `boot`
  (commands run on mount so a lesson can start from a prepared state), and
  `shell` (`'fish'` by default — `shell="bash"` is how the Fish lesson makes
  `chsh -s fish` visibly change the prompt).
- A lesson can also drive a terminal from the page:
  `el.dispatchEvent(new CustomEvent('tmx-run', { detail: 'pkg update' }))` on
  the terminal's wrapper element runs that command. It is a DOM event because
  every island is `client:only`, so MDX has no React tree to pass a ref into.
- Every terminal renders a touch key row (`ESC TAB ↑ ↓ ← → / - ~` and a sticky
  `CTRL`). If you teach a key, check it is reachable there — a phone keyboard
  has none of them.
- To teach a command the simulator doesn't understand yet, add it to the
  interpreter in `src/components/terminal/shell.ts` (keep responses faithful to
  real Termux output) and register its name so highlighting and autosuggestion
  agree with what actually runs.

## Style

- Markdown follows standard markdownlint defaults (ATX headings, wrapped prose).
- Prefer Starlight asides (`:::note`, `:::tip`, `:::caution`, `:::danger`) over
  bold-shouting for callouts.
- Keep line length reasonable (~80–100 chars) in prose.
- CSS and TypeScript use **tab** indentation. Comments explain *why*, ideally
  citing what was broken before.
- Design tokens only — see [CLAUDE.md](CLAUDE.md) for the token rules. Brass
  (`--color-brand`) is the only accent hue; do not introduce a second one, and
  never write a raw hex in a component.
- Styling belongs in `src/styles/global.css`, not in a JSX `style={{}}` object.
  The five that remain are values only JavaScript can know. Conditional styling
  goes on a `data-*` or `aria-*` attribute and is selected in CSS.
- `src/styles/global.css` is deliberately **unlayered** — do not wrap it in an
  `@layer`. Starlight's own styles live in `@layer starlight.*`, and unlayered
  rules outrank layered ones; that is the only reason this stylesheet can
  restyle the theme at all.

## Pull requests

- Keep PRs focused — one lesson or fix per PR where possible.
- Make sure `npm run check` is clean and `npm run build` succeeds.
- Describe what changed and why.

CI runs on pull requests as well as on pushes to `main`: it pins Node 22,
installs with `npm ci`, typechecks, and builds. The deployment steps are skipped
for pull requests, so an outside contribution is never failed by a Pages
permission it cannot have.
