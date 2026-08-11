# Contributing

Thanks for helping make Termux more approachable! Corrections, clearer
explanations, and new lessons are all welcome.

This is **course two** of the series. Its audience has already finished course
one (or is equivalently comfortable), and that shapes almost every rule below.

## Ground rules

- **Accuracy first.** Every command should work on a current Termux install from
  F-Droid. When in doubt, test it on a real device — and for this course that
  matters more than it did for course one, because most of what we teach touches
  Android itself: permissions, Doze, the phantom process killer, and carrier
  NAT all behave differently from a desktop Linux box.
- **Do not re-teach course one.** `pkg install`, `~/storage`, fish, sessions and
  the extra-keys row are assumed knowledge. Reference them, link to the beginner
  course if a reader needs them, but never re-explain them. A lesson that
  restates course one reads as filler to the audience that actually got here.
- **Explain *why*, not just *how*.** The audience can follow instructions
  already; what they lack is the model. Jargon is allowed here in a way it is
  not in course one — but define a term the first time it appears.
- **Name the failure mode.** This course's commands fail *quietly*. A
  `termux-*` command with no companion app hangs forever instead of erroring; a
  permission denied once is never asked for again; a cron job runs for a day and
  then stops because of Doze. A lesson that teaches the happy path only will
  strand people. Say what the failure looks like.
- **Assume a phone.** This course is about Android, and most of it is read on
  Android. Check any layout change at 360px wide.
- **Be careful with the outward-facing lessons.** `serving/tunnels` makes a
  learner's device reachable by strangers. Anything you add there must also say
  how to shut it down.

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
**0 errors, 0 warnings, 0 hints** over 19 files — keep it there. `astro build`
on its own still does not typecheck, so running the build is not a substitute.

`npm run build` runs two guard scripts around the build itself:

```bash
node scripts/check-curriculum.mjs && astro build && node scripts/check-links.mjs
```

Either one exits non-zero and takes the build with it. Read the failure — both
print the exact slug or URL at fault — rather than working around the guard.

> **If the link checker fails, it is your change.** It passes on a clean tree.
> This note used to warn that `scripts/check-links.mjs` held the wrong base path
> and reported every correctly-prefixed link as unprefixed; that is fixed.

## Adding a lesson

Steps 3 and 4 are checked by `scripts/check-curriculum.mjs`, which runs before
every build. Skipping one produces a named error, not a green build with a
broken course.

1. Create a `.md` or `.mdx` file under `src/content/docs/<section>/`. The
   existing sections are `bridge/`, `automation/` and `serving/`.
2. Add frontmatter: `title` and `description`. Utility pages (reference, tools)
   must set **both** `prev: false` and `next: false` to stay out of the prev/next
   chain — the guard rejects one without the other.
   - If a title contains `": "`, **quote it**. An unquoted
     `title: Termux: Intermediate` is a YAML mapping inside a mapping, and the
     build fails on a type error that never mentions the colon. `index.mdx`
     documents this.
3. Add the page to the `sidebar` array in `astro.config.mjs`. **That array is
   the source of order**, both for the menu and for the prev/next pagination
   Starlight builds from it — a lesson in the wrong slot puts the learner on the
   wrong rail. Add a comment saying *why* the lesson sits where it does; every
   other entry in that array has one, and the ordering argument is the part
   that is expensive to reconstruct later. (`sidebar.order` in frontmatter is
   inert while an explicit `sidebar` array is configured; existing files still
   carry it, and the guard insists those values keep ascending so a later switch
   to `autogenerate` cannot silently reshuffle the course.)
4. If it should count toward course progress, add its slug to `LESSONS` in
   `src/lib/progress.ts`, then drop a
   `<LessonComplete client:only="react" slug="section/slug" />` at the foot of
   the lesson (this requires an `.mdx` file). The slug string must match
   `LESSONS` exactly — the guard compares them character for character.
5. If the new lesson goes at the **end** of the course, move `next: false` onto
   it and off the lesson that used to be last (`where-next`). Exactly one lesson
   may carry it, and it must be the final one, or the chain dead-ends early.
6. Adding a lesson at the **front** means updating `index.mdx`'s hero action and
   its `next.link` to match — both must point at lesson one (today
   `bridge/api-setup/`), and both must stay relative (no leading slash).
7. If the lesson teaches a skill the `teaches` list in the `schema.org` block in
   `astro.config.mjs` should advertise, add it there too. Nothing enforces that
   one, and the beginner course drifted on it twice.

Run `npm run check:curriculum` on its own while you work; it needs no build and
finishes instantly.

### Linking between pages

Write links **root-relative**: `[the scheduling lesson](/automation/scheduling/)`.
The `rehypeBasePaths` plugin in `astro.config.mjs` prefixes `base` at build
time, so the deploy path lives in one place. Never hardcode
`/termux-tutorial-intermediate/...` into content.

Two places the plugin cannot reach, because it only rewrites anchors produced
by the Markdown pipeline:

- **Raw `<a href>` in MDX** — use `` <a href={`${base}/automation/scheduling/`}> ``
  with `export const base = import.meta.env.BASE_URL.replace(/\/$/, '')` at the
  top of the file (see `src/content/docs/index.mdx` and `where-next.mdx`).
- **Frontmatter links** (hero actions, `next.link`, `prev.link`) — Starlight
  does not base-prefix these and frontmatter cannot evaluate `BASE_URL`. Use a
  **relative** link with no leading slash (`bridge/api-setup/`).

A leading slash in either of those places 404s on GitHub Pages — a 200 in dev,
a 404 in production. `scripts/check-links.mjs` runs over `dist/` after the build
and is what catches it: it fails on any internal link that resolves to no file,
any `#fragment` naming an `id` the target page does not have, and any
root-relative internal URL that never picked up the `base` prefix. Run it alone
with `npm run check:links` (it needs an existing `dist/`).

**Linking to the sibling courses** — they are paths in the same deployed site,
not separate sites, so build the URL from `BASE_URL` rather than hardcoding an
absolute one. `where-next.mdx` shows the pattern: derive `SERIES_ROOT` from
`base`, keep the URLs in one object at the top of the file, and let
`scripts/check-assembled-links.mjs` verify them after assembly. Absolute
`https://dnoice.github.io/...` links are invisible to every guard in the repo,
which is how two of them rotted into 404s.

### Using the interactive components

Before you add a terminal, read the next section — on this course it is usually
the wrong move.

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
  `shell` (`'fish'` by default).
- A lesson can also drive a terminal from the page:
  `el.dispatchEvent(new CustomEvent('tmx-run', { detail: 'pkg update' }))` on
  the terminal's wrapper element runs that command. It is a DOM event because
  every island is `client:only`, so MDX has no React tree to pass a ref into.
- Every terminal renders a touch key row (`ESC TAB ↑ ↓ ← → / - ~` and a sticky
  `CTRL`). If you teach a key, check it is reachable there — a phone keyboard
  has none of them.

### Do not add a terminal that cannot run the lesson

`shell.ts` was ported from course one. It knows `pkg`, the filesystem, and a
handful of `termux-*` setup commands — and **none** of
`termux-battery-status`, `termux-notification`, `termux-sensor`,
`termux-location`, `jq`, `crontab`, `termux-job-scheduler` or `cloudflared`.

That is why `<TermuxTerminal>` currently appears on the Welcome page only, and
why `PracticeSection` is unused. A terminal that answers `command not found` to
its own lesson's instructions is a trust bug, not a nit — the learner concludes
the *course* is broken.

To add a terminal to a lesson, teach the simulator first:

1. Implement the command in `src/components/terminal/shell.ts`, keeping the
   output faithful to real Termux — **including the failure modes**. A
   `termux-*` command with no companion app installed hangs; it does not print
   an error. If the simulator cannot represent a failure honestly, it is better
   to leave the command out than to fake a success.
2. Register its name so highlighting and autosuggestion agree with what actually
   runs.
3. Then add the `<TermuxTerminal>` and its `<PracticeSection>` wrapper.

For a lesson that is plain POSIX shell rather than Android-specific, the CheerpX
sandbox (`<LiveSandbox />`) is the other option — but it is real x86 Debian, so
it cannot run `termux-*` anything, and it is deliberately confined to one
lesson. If you move it, move `SANDBOX_PATH` in `astro.config.mjs` with it or the
Boot button silently stops working.

## Style

- Markdown follows standard markdownlint defaults (ATX headings, wrapped prose).
- Prefer Starlight asides (`:::note`, `:::tip`, `:::caution`, `:::danger`) over
  bold-shouting for callouts. `:::caution` and `:::danger` earn their keep in
  this course — use them where a mistake is visible to strangers or costs a
  permission that is hard to re-request.
- Use `<Steps>` for install and setup sequences; the bridge lessons set the
  pattern.
- Keep line length reasonable (~80–100 chars) in prose.
- CSS and TypeScript use **tab** indentation. Comments explain *why*, ideally
  citing what was broken before.
- Design tokens only — see [CLAUDE.md](CLAUDE.md) for the token rules. Brass
  (`--color-brand`) is the only accent hue; do not introduce a second one, and
  never write a raw hex in a component.
- Styling belongs in `src/styles/global.css`, not in a JSX `style={{}}` object.
  The few that remain are values only JavaScript can know. Conditional styling
  goes on a `data-*` or `aria-*` attribute and is selected in CSS.
- `src/styles/global.css` is deliberately **unlayered** — do not wrap it in an
  `@layer`. Starlight's own styles live in `@layer starlight.*`, and unlayered
  rules outrank layered ones; that is the only reason this stylesheet can
  restyle the theme at all.

## Touching the progress store

`src/lib/progress.ts` has one rule above all others: **the `localStorage` key
`tmx:intermediate:v1` must stay distinct from the beginner course's
`tmx:beginners:v1`.** Both courses live on one origin, storage is per-origin,
and unifying them makes the two courses silently erase each other. The same goes
for `EXPORT_KIND`. CLAUDE.md opens with the full reasoning.

Beyond that:

- Never let a storage failure break a page. Writes are in try/catch because
  storage can be blocked outright; progress is a convenience, not a
  prerequisite.
- Use `setManyComplete` for multi-lesson writes rather than looping
  `setComplete` — each write fires a change event and re-renders every
  subscriber.
- If a write is refused, say so in the UI. `importProgress()` is the case that
  matters: a learner hands over their only backup, and a silent no-op is the
  worst possible outcome.

## Pull requests

- Keep PRs focused — one lesson or fix per PR where possible.
- Make sure `npm run check` is clean and `npm run build` succeeds.
- Describe what changed and why.

CI runs on pull requests as well as on pushes to `main`: it pins Node 22,
installs with `npm ci`, typechecks, and builds. The deployment steps are skipped
for pull requests, so an outside contribution is never failed by a Pages
permission it cannot have.
