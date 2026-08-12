# CLAUDE.md — working notes for agents and new contributors

Project knowledge for **Termux: Advanced** (course three of three): an Astro 7
+ Starlight 0.41 static course that stops treating Android as the platform and
starts treating it as the host — a real Debian userland under PRoot, an X11
display server, XFCE drawn on the phone's own screen, the GPU where the device
allows it, and packages compiled on the handset. Read this before editing; it
records the decisions that are easy to undo by accident.

`AGENTS.md` points here. Keep the knowledge in this file only, so the two
cannot drift apart.

## Where to run npm

**The monorepo root now has a `package.json`, and it is the normal place to
work.** `npm run dev` there starts all four projects behind ONE port and ONE
URL — `http://localhost:4321/termux-tutorial/` — routed by the same path
prefixes GitHub Pages uses. That is the only configuration in which the series
switcher and cross-course links resolve; a single course's dev server cannot
serve them, because they are absolute paths into siblings that do not exist in
its tree.

| Where | Command | For |
| :---- | :------ | :-- |
| root | `npm run dev` | Everything, one URL. The normal one. |
| root | `npm run build` | All four + assemble + cross-course link check |
| root | `npm run check` | Typecheck all four |
| here | `npm run build` | This course alone — curriculum guard, build, link check |
| here | `npm run check` | This course alone |

This directory still holds its own `package.json`, `node_modules` and lockfile,
and the guards below are still this course's own. The root is an orchestrator,
**not** an npm workspace: hoisting would put four projects' Astro/Vite/xterm
resolutions in one tree, and the xterm SSR alias resolves through Node's own
resolver precisely because that resolution is load-bearing.

The four-project topology lives in `scripts/projects.mjs` at the root. It used
to be written by hand in `deploy.yml`, the README and each course's link
checker — four copies of one fact, which is the shape of every drift bug this
repo has produced.

Git lives at the monorepo root, not in this directory (`.git` is one level up).
The baseline for this course is the commit
`20d3884 Scaffold the advanced course: PRoot, X11, GPU, builds`. Standing rule:
commit a clean baseline BEFORE launching a multi-agent workflow.

## The single most breakable thing in this repo

**The `localStorage` key is `tmx:advanced:v1`, and it must never be unified
with `tmx:beginners:v1` or `tmx:intermediate:v1`.**

Look for the `KEY` constant in `src/lib/progress.ts` — named rather than
numbered, because the line moves. It looks like a copy-paste leftover from the
port. It is the opposite: it is the fix.

All three courses ship as **paths on one origin**, assembled into a single
GitHub Pages site:

```text
https://dnoice.github.io/termux-tutorial/               the hub
https://dnoice.github.io/termux-tutorial/beginner/
https://dnoice.github.io/termux-tutorial/intermediate/
https://dnoice.github.io/termux-tutorial/advanced/      this course
```

`localStorage` is scoped to the **origin**, not the path — and here the three
courses do not even differ by hostname the way separate repos once did. They
are four paths under one origin and one base directory. A shared key means all
three sites read and write the same object: ticking a lesson here overwrites the
beginner course's `completed` array with slugs it does not recognise, and the
profile name and avatar ping-pong between courses. There is no error, no
warning, and no recovery — the learner just finds their other course blank.

Because the courses now sit on the same origin **and** under the same base
directory, this is *more* dangerous here than it was in course two, not less. A
"consolidate the duplicated store" pass across the monorepo is the exact change
that breaks it, and the damage is invisible until a learner loses a course.

`v1` is a schema version, not a course counter — bump it only when the stored
*shape* changes, never to distinguish a course.

The same separation runs through the export/import format: `EXPORT_KIND` is
`termux-advanced-progress`, against the siblings' `termux-beginners-progress`
and `termux-intermediate-progress`.

That constant arrived from course two half-updated, and the interface that had
to match it did not — two hand-synced string literals, which a port is
guaranteed to separate. It is fixed: `ProgressExport['kind']` now reads
`typeof EXPORT_KIND`, so there is ONE string and the next port changes it once.
No line number is quoted here, because the fix moved the declaration and the
old pointer stopped landing.

**One key is correctly shared and should stay that way:** `starlight-theme`.
Light/dark is a preference about a site that visibly *is* one site; it should
carry across all three courses and the hub. The rule is not "never share
storage", it is "never share *progress*".

## This is one repo, one site

All three courses plus the hub live in the same repository —
<https://github.com/dnoice/termux-tutorial> — and deploy as a single GitHub
Pages site, assembled by `.github/workflows/deploy.yml` at the **monorepo root**:

```text
_site/                 <- the hub      (base /termux-tutorial)
_site/beginner/        <- course one   (base /termux-tutorial/beginner)
_site/intermediate/    <- course two   (base /termux-tutorial/intermediate)
_site/advanced/        <- this course  (base /termux-tutorial/advanced)
```

**This course has no deploy workflow of its own, and must not grow one.** There
is no `.github/` directory here at all. Pages publishes exactly one artifact per
repository, so the courses cannot each deploy themselves; the root workflow
installs, typechecks and builds each project in turn, copies each `dist/` into
its slot, and fails loudly if any of the four `index.html` files is missing. It
also re-checks the hub's cross-links against the assembled tree, which is the
only place a hub→course link can be verified at all.

Each course keeps its own `package.json`, its own guards and its own `base`;
they are independent projects that ship together.

Two consequences worth holding on to:

- **This course's link checker cannot see its siblings.** Cross-course links
  resolve only after assembly, so `scripts/check-links.mjs` carries an explicit
  `SIBLINGS` set. Add a course when it starts being assembled and not before —
  an entry for an undeployed course turns a real 404 into a pass.
- **The storage keys must stay distinct.** See the section above.

## Stack

- **Astro 7** (`^7.0.2`) + **Starlight 0.41** (`^0.41.3`), static output,
  deployed by the monorepo root's `.github/workflows/deploy.yml`.
- **React 19** islands for anything interactive (`@astrojs/react` `^6.0.1`).
  Only two islands are actually mounted by content in this course:
  `LessonComplete` (nine lessons) and `ProgressDashboard` (`progress.mdx`), plus
  `ProfileBadge` from the Sidebar override.
- **xterm.js 6** (`@xterm/xterm` + fit + web-links) is **installed but unused by
  any page here.** No content file imports a terminal — see
  [No practice terminal](#no-practice-terminal-anywhere-and-that-is-the-design)
  below. `@xterm/xterm/css/xterm.css` is still listed in `customCss`, and the
  build emits **no xterm JS chunk** because nothing imports it.
- **astro-icon** with the Iconify Font Awesome 6 sets (`fa6-solid`,
  `fa6-regular`, `fa6-brands`), inlined as SVG at build time.
  `iconDir: 'src/assets/icons'` is configured but that directory does not exist;
  every `<Icon>` resolves from the `@iconify-json/*` packages.
- **Fontsource variable** fonts (Inter, Crimson Pro, Source Serif 4, JetBrains
  Mono), self-hosted — but *not* via the Fontsource entrypoints, which pull
  every subset. The eight **latin** faces are copied into `public/fonts/` by
  `npm run fonts:sync` and declared by the `FONT_FACES` array in
  `astro.config.mjs`, which emits an inline `@font-face` block plus preloads.
  A new family — or any change to a `--font-*` token in `global.css` — must be
  mirrored in `FONT_FACES`, or the face simply will not load.
- **No CSS framework, and no `@layer`.** See "Do not undo" below, which is the
  single most expensive thing on this page to get wrong. Styling is plain CSS
  with tokens in `src/styles/global.css` (2,999 lines) and
  `src/styles/print.css` (240).

## Architecture

```text
astro.config.mjs        site/base, the rehypeBasePaths plugin, the sidebar
                        (= curriculum order), FONT_FACES + preloads, the two
                        hand-authored Expressive Code themes, og:image tags,
                        the schema.org Course JSON-LD, the scoped COI
                        service-worker <script>, xterm SSR workarounds
src/content/docs/       lessons (.mdx) + reference pages (.md) — 13 files
src/components/
  profile/              Avatar, ProfileBadge, LessonComplete, ProgressDashboard
                        — the only React the learner actually meets here
  overrides/Sidebar.astro     injects the profile badge above Starlight's nav
  overrides/SiteTitle.astro   the SERIES SWITCHER — new in this course
  overrides/ThemeSelect.astro replaces Starlight's theme <select>
  icons/icons.tsx       inline SVG icons for JSX, where astro-icon can't reach
  terminal/shell.ts             ported, 1,392 lines, UNUSED here
  terminal/TermuxTerminal.tsx   ported, UNUSED here
  terminal/LiveSandbox.tsx      ported, UNUSED here
  lesson/PracticeSection.astro  ported, UNUSED here
  splash/BootSplash.astro       ported, UNUSED here (no landing-page splash)
src/lib/progress.ts     localStorage store + LESSONS + export/import
src/lib/useProgress.ts  React hook over the store's pub/sub
src/styles/global.css   the whole design system
src/styles/print.css    the paper edition; listed LAST in customCss so it wins
public/fonts/           eight latin woff2 faces, written by `npm run fonts:sync`
public/og-default.png   the 1200x630 social card (og-default.svg is its source)
public/coi-serviceworker.js   COOP/COEP shim — shipped, never registered here
scripts/check-curriculum.mjs  build-time guard: sidebar == LESSONS == files
scripts/check-links.mjs       build-time guard: every internal link in dist/
```

Every React island is `client:only="react"`. There is no server, no API, no
database. The build emits **14 HTML files** — 13 content pages plus `404.html`
— and a `dist/` of about 3.3 MB.

### The curriculum, as it actually stands

Nine lessons in `LESSONS`, three teaching sections plus a reference group:

| # | Slug | Section |
| :- | :--- | :------ |
| 1 | `container/why-proot` | A Real Distribution |
| 2 | `container/first-distro` | A Real Distribution |
| 3 | `container/living-in-it` | A Real Distribution |
| 4 | `desktop/x11-server` | A Desktop on Your Phone |
| 5 | `desktop/xfce` | A Desktop on Your Phone |
| 6 | `desktop/across-the-boundary` | A Desktop on Your Phone |
| 7 | `hardware/gpu` | Hardware & Your Own Builds |
| 8 | `hardware/building` | Hardware & Your Own Builds |
| 9 | `where-next` | Hardware & Your Own Builds |

`index` (Welcome) sits inside the first sidebar group as step zero. `progress`,
`reference/cheatsheet` and `reference/troubleshooting` form the Reference &
Tools group and are excluded from `LESSONS`, so they never inflate the progress
total.

The ordering is argued in comments in the `sidebar` array and those arguments
are load-bearing:

- **PRoot before any install.** `why-proot` is conceptual and deliberately
  first, because "why not just root the phone" has to be answered before a
  learner spends 500 MB finding out, and because syscall interception explains
  every limitation the rest of the course runs into.
- **The display server alone, before any desktop.** `x11-server` proves
  Termux:X11 works by itself so that a black screen later is diagnosable as
  "the server is fine, the desktop is not" rather than as one big failure.
- **XFCE on the Termux side before XFCE in the container.** Fewer moving parts
  first; `across-the-boundary` needs both halves working independently.
- **GPU before builds, both last.** `hardware/gpu` is explicitly framed as
  experimental and device-dependent — the most likely thing in the course not to
  work on a given phone — so it must not sit anywhere a learner would read a
  failure there as a failure of the course.

**Nothing from courses one and two is re-taught.** `pkg`, `~/storage`, fish,
sessions, the extra-keys row, scripts, `termux-api` and schedulers are all
assumed knowledge — reference them, never re-explain them.

`reference/cheatsheet.md` and `reference/troubleshooting.md` are **written**,
from the finished lessons. The cheatsheet is ordered to match the curriculum and
opens with the three costs that apply to nearly every line (no terminal, disk
and heat, phone-keyboard key bindings); troubleshooting is ordered by how often
a failure actually happens, opening with `cannot open display`, which is this
course's signature failure.

## No practice terminal anywhere, and that is the design

This is the biggest structural difference between this course and the other two,
and the most likely thing for a future pass to "fix" by breaking it.

**No page in this course mounts `<TermuxTerminal>`, `<LiveSandbox>`,
`<PracticeSection>` or `<BootSplash>`.** Verified: the only components any
content file imports are `LessonComplete` and `ProgressDashboard`.

The reason is not laziness, it is that the simulator cannot tell the truth here.
`shell.ts` is a hand-written interpreter over an in-memory filesystem. It

- **cannot install a rootfs** — `proot-distro install debian` downloads and
  unpacks 1.5–3 GB onto real storage; there is nothing to fake that is not a
  lie;
- **cannot open an X11 socket** — Termux:X11 is a companion *app* drawing on the
  Android surface, outside anything a browser tab can model;
- **cannot reach a GPU** — `virglrenderer` bridges OpenGL to the phone's actual
  hardware, which is the entire point of that lesson and is device-dependent
  even on a real device.

A terminal that answered `proot-distro login debian` with anything at all would
be lying about the one thing the course teaches, and a lesson you can fake your
way through is a lesson you have not learned. It is a trust bug, not a missing
feature.

`index.mdx` states this out loud in a section called **"No practice terminal in
this course"**, and six lesson files carry inline MDX comments recording that
the omission is deliberate: `why-proot`, `first-distro`, `living-in-it`,
`x11-server`, `xfce`, `building`. Note that five of them open with the literal
string `No <TermuxTerminal>` and `x11-server` says the same thing in different
words — so grepping for the marker finds five and under-counts. Do not delete
those comments, and do not add a terminal.

The ported components stay on disk because deleting them is a bigger, riskier
diff than leaving them, and because a future lesson that *is* plain POSIX shell
could legitimately want one. If you ever add one back, teach `shell.ts` the
commands first — including the failure modes — and read the CONTRIBUTING recipe.

Three live consequences of there being no terminal:

- **`SANDBOX_PATH` in `astro.config.mjs` points at a page that does not exist**
  here (`/termux-tutorial/advanced/automation/shell-scripts/`, a course-two
  slug). The COI loader script still ships in every page's `<head>`, but its
  path test never matches, so `public/coi-serviceworker.js` is never registered
  and no page is ever cross-origin isolated. Harmless today; dead weight that
  will mislead the next reader.
- **The xterm SSR workarounds are inert but should stay.** `ssr.noExternal`, the
  `resolve.alias` through `createRequire`, and the `manualChunks` xterm split
  all still sit in the config. Nothing imports xterm, so no chunk is emitted and
  none of it fires. They become load-bearing again the instant a terminal
  returns, and deleting them buys nothing.
- **There is no boot splash on the landing page.** `BootSplash.astro` and its
  `must()` build-time SVG assertions exist but are never rendered, so the SVG
  rewrite guard does not run in this course's build.

## Design system rules

`src/styles/global.css` adopts **Fire Watch Design Tokens v6**: Parchment
Dossier (light) and Sentinel Obsidian (dark).

- **Tokens only.** Never write a raw hex or rgba in components or CSS. Use
  `--bg-*`, `--fg-*`, `--color-*`, `--border-*`, `--shadow-*`, `--text-*`,
  `--leading-*`, `--space-block`, `--radius-*`.
- **Brass is the only accent.** `--color-brand` is the single warm anchor
  (`#d4b15c` dark, `#886713` light). Do not introduce a second hue. Semantic
  colours (`--color-success/danger/warning/info`) are for state only, never
  decoration.
- **Terminal surfaces are dark in both themes.** `--tmx-screen` (`#0e1014`),
  `--tmx-screen-ink` (`#e8dfcc`), `--tmx-screen-muted` (`#8e8676`) and
  `--tmx-screen-brand` (`#d4b15c`) are **dark-locked**: byte-identical in the
  `:root` light block and the `[data-theme='dark']` block. Nothing in this
  course renders a terminal, but the tokens are still consumed by the code-block
  chrome and by the ported components — keep them locked, and keep anything
  drawn on `--tmx-screen` using them. The theme-following `--fg-*` tokens fail
  AA there in light mode.
- **The Expressive Code themes are a second copy of those colours.** The two
  hand-authored themes in `astro.config.mjs` (`fire-watch-obsidian` and
  `fire-watch-parchment`) pass literal hexes, because Shiki parses real colours
  and `var(--token)` is not available. Every value is labelled with the token it
  was copied from. Change a token and move the theme with it, or the same
  command renders in two colours on one page. Note the light brass is
  `--color-brand-emphasis` (`#6f5310`), **not** `--color-brand`, which is under
  AA on the light plate for the most-read token in the course.
- **Token names state the role, not a guess.** `--font-ui` resolves to Inter,
  the chrome face; the body-prose face is `--font-detail` (Source Serif 4).
  Renaming a `--font-*` token is safe from `FONT_FACES` — that array keys off
  family *names* — but grep the whole of `src/` first, because a missed consumer
  degrades silently to the inherited family rather than erroring.
- **Prefer Fire Watch tokens over `--sl-color-*`** in your own rules. The BRIDGE
  section of `global.css` maps Starlight's variables onto ours; edit the bridge,
  not the consumers.
- **Wrap raw-HTML/JSX UI in `not-content`** so Starlight's prose styles (link
  underlines, list spacing) do not attack component markup.
- **Island styling lives in CSS, not in JSX.** Static styling belongs in the
  **REACT ISLAND CHROME** section of `global.css`; the few surviving inline
  `style={{}}` objects are values only JS can know (an avatar's size, a progress
  bar's `width: n%`). Conditional styling belongs on a `data-*` / `aria-*`
  attribute selector rather than a ternary, so a piece of state is expressed
  once in the DOM instead of twice in the markup.
- **Island text picks its family explicitly.** `.tmx-island` (Inter chrome) /
  `.tmx-island__title` (Crimson Pro) / `.tmx-island__meta` (Inter) /
  `.tmx-island__prose` (Source Serif). Without one of these a new component
  inherits from `body` and silently lands on Inter by accident rather than by
  decision.
- Type scale, line-height, and block rhythm are tokens (`--text-*`,
  `--leading-*`, `--space-block`); do not hardcode font sizes or margins.

## Gotchas that will cost you an afternoon

### 1. The YAML colon-space trap — it has cost this repo two builds

An unquoted YAML scalar containing `": "` is parsed as a **nested mapping**, not
a string. `title: Termux: Advanced` is `{title: {Termux: Advanced}}`, and the
build dies on a content-collection type error that never once mentions the
colon. It has taken this repo down twice.

Both survivors are documented in place:

- `src/content/docs/index.mdx` — `title: 'Termux: Advanced'`, with a comment
  block above it explaining exactly this. That same frontmatter also overrides
  the `<title>` tag, because the site title *is* "Termux: Advanced" and an
  unmodified page title renders as `Termux: Advanced | Termux: Advanced`.
- Four descriptions are quoted for the same reason and must stay quoted:
  `container/first-distro` (`'proot-distro: installing…'`), `desktop/xfce`
  (`'XFCE4 on the Termux side: install, DISPLAY…'`), `hardware/gpu`
  (`'virglrenderer and mesa: bridging OpenGL…'`), and `where-next`
  (`'The end of the series: what the learner…'`).

**Rule: if a frontmatter value contains `": "`, wrap it in single quotes.** This
course's subject matter makes it far more likely than in the earlier two —
`DISPLAY: :0`, `Error: Can't open display:` and `proot-distro:` are all natural
things to write in a title or description.

### 2. The sidebar array *is* the curriculum

`sidebar` in `astro.config.mjs` drives the menu **and** Starlight's prev/next
pagination — it is the rail the learner rides. Utility pages (Your Progress,
Cheatsheet, Troubleshooting) sit in their own group and additionally set
`prev: false` / `next: false` in frontmatter so they never appear as "step two".
Keep the array in sync with `LESSONS` in `src/lib/progress.ts` and with the
`<LessonComplete slug="…">` strings in each lesson.
`scripts/check-curriculum.mjs` (run by `npm run build` and by CI) fails the
build when they drift. It currently reports
`✓ Curriculum consistent — 9 lessons, sidebar and LESSONS agree.`

`where-next` is the terminus and the only lesson carrying `next: false`. Its
`prev` is left to Starlight, because it is the last item of the last teaching
group and the array derives it.

The `sidebar.order` values in content frontmatter are **inert** while the groups
use explicit `items` arrays — Starlight only reads `order` under `autogenerate`.
They are kept correct (0–9, ascending per group) so a future conversion is safe,
and the guard enforces that, but they are not the source of truth. The array is.

### 3. Base paths — one plugin, two blind spots

`base` is **`/termux-tutorial/advanced`**. Content links are authored
root-relative (`/container/why-proot/`) and `rehypeBasePaths` in
`astro.config.mjs` prefixes `BASE` at build time. Never hardcode the base into
content. The plugin only sees anchors the Markdown pipeline produced, so it
misses:

- **Raw `<a href>` written in MDX** — build the URL from
  `import.meta.env.BASE_URL` instead. `index.mdx` and `where-next.mdx` both show
  the pattern: `export const base = import.meta.env.BASE_URL.replace(/\/$/, '')`.
- **Frontmatter links** (hero `actions`, `next.link`, `prev.link`) — Starlight
  does not base-prefix them and frontmatter cannot read `BASE_URL`. Use a
  relative link with no leading slash (`container/why-proot/`).

Both blind spots fail the same way: a 200 in dev, a 404 on GitHub Pages.

`scripts/check-links.mjs` resolves BASE the same way the config does
(`process.env.BASE ?? '/termux-tutorial/advanced'`) rather than hardcoding it,
so `BASE=/preview npm run build` stays honest. **Both the config and the checker
hold a copy of the base path. Change one and change the other.**

### 4. Cross-course links: the `SIBLINGS` set exists because dist/ is blind

A course cannot see its siblings in its own `dist/`. The hub and the other two
courses are real, resolvable paths in the *published* site and genuinely absent
from the tree `check-links.mjs` can walk — and they sit **outside** this course's
own `base`, so a naive checker reports them as "missing the base prefix", which
is the opposite of true.

`scripts/check-links.mjs` therefore derives the series root from BASE and
**defers** cross-course links rather than resolving them:

```js
const SERIES_ROOT = BASE.replace(/\/[^/]+$/, '') || '';   // /termux-tutorial
const COURSE_SEGMENTS = ['beginner', 'intermediate', 'advanced'];
const SIBLING_PREFIXES = COURSE_SEGMENTS
  .filter((s) => s !== OWN_SEGMENT)
  .map((s) => `${SERIES_ROOT}/${s}/`);
```

Three things about that are load-bearing:

- **The sibling test runs BEFORE the base-prefix test.** Ordering it the other
  way reports every sibling link as unprefixed.
- **Course segments are listed explicitly rather than pattern-matched**, so a
  typo in the segment (`/intermidiate/…`) is still caught. Add a course when it
  starts being assembled and not before — an entry for an undeployed course
  turns a real 404 into a pass.
- **Deferred is not skipped.** These links are checked for real by
  `scripts/check-assembled-links.mjs` at the **monorepo root**, which walks the
  assembled tree where all four projects exist at once.

This was an exact-match set of the four course *roots*, which allowed `/termux-tutorial/beginner/` and rejected
`/termux-tutorial/beginner/start/why-termux/` — it permitted only the least
useful cross-course link there is. **The cost was invisible and real:** the
agent writing `container/why-proot` hit the rejection, concluded deep
cross-course links were unsupported, and wrote around it by naming the sibling
courses in prose instead of linking to them. When a guard cannot express the
correct thing, authors route around the guard. If you find content that
conspicuously refuses to link somewhere obvious, suspect a checker before you
suspect the author.

`where-next.mdx` builds those URLs from `SERIES_ROOT` (derived from `base`) and
keeps them in one `SERIES` object at the top of the file rather than scattering
them through the prose. `SiteTitle.astro` derives its links the same way.

### 5. `SiteTitle` is the series switcher, and it is new in this course

`components/overrides/SiteTitle.astro` replaces Starlight's site title with a
three-course switcher plus a link to the hub.

Each course is a self-contained Starlight site whose sidebar knows only its own
lessons, so without this there is no route out of a course except the back
button — three websites, not a series. `SiteTitle` is the one override that
renders in the header on **every** page in both the desktop and mobile layouts,
and it already owns the "click here to go home" affordance, so it needs no
second bar and no `PageFrame` override (the last thing to override `PageFrame`
took the sticky header with it).

Paths are derived from `BASE_URL`, never hardcoded — the file is copied verbatim
into each course and **`const CURRENT = 'advanced'` is the only line that differs
between copies.** Starlight's own `<Default>` still renders inside it, so the
site name, the home link and the logo slot survive.

It used to carry a `c.unbuilt` ternary for courses that had not shipped yet.
Course three shipping removed the last `unbuilt: true`, which left a branch that
could never be taken and a property no entry declared — one typecheck error in
each of the three copies of this file. The branch is gone from all three. If a
fourth course is ever staged, restore it **together with** the flag on the
entry rather than leaving a permanently-false test behind.

### 6. Progress is local, optional, and portable

`src/lib/progress.ts` is a single `localStorage` key with a pub/sub. Writes are
wrapped in try/catch because storage can be blocked outright (Safari private
mode, embedded webviews). Progress is a convenience, never a prerequisite —
never let a storage failure break a page. Batch multi-lesson writes with
`setManyComplete` rather than looping `setComplete` (each write fires a change
event and re-renders every subscriber).

`save()` returns `false` when the write was refused, and callers are expected to
say so out loud. `importProgress()` is the case that matters: a learner hands
over their only backup, and a silent no-op there would be the worst possible
outcome, so a refused write becomes a visible error.

Import **prunes unknown slugs** rather than storing them. `stats()` derives
totals from `LESSONS` so unknown slugs could never inflate the percentage, but
keeping them would silently resurrect renamed lessons on the next export.

`avatarGradient()` derives its two stops from `--color-brand` and varies only
the sweep angle and mix ratio. It used to be `hsl(${hash % 360} …)` — an
unbounded hue, and the only code path in the repo that could emit an arbitrary
colour onto a site whose stated rule is that brass is the single accent. Do not
reintroduce a hue term.

In this course the store has **only** the profile UI as a consumer. The terminal
prompt was the second consumer in courses one and two; there is no terminal
here, so `shellUser()` and its `subscribe()` are unused code paths.

### 7. `ThemeSelect` is ours now

`components/overrides/ThemeSelect.astro` replaces Starlight's three-option
`<select>` with one 40px button that cycles light → dark → system.

- It keeps **Starlight's contract**: the `starlight-theme` localStorage key
  holds `light | dark | auto`, and `:root` carries `data-theme` for the resolved
  value. Break that and Starlight's own pre-paint ThemeProvider fights you.
  (This is also the one storage key correctly shared across all three courses —
  see the top of this file.)
- The *chosen* mode is published separately as `:root[data-tmx-mode]`, because
  it differs from `data-theme` whenever the choice is "auto". CSS uses it to
  reveal exactly one of the three inline icons, so no JS swaps icons and there
  is no flash.
- Starlight renders the component **twice** (desktop header and mobile menu), so
  the script uses a delegated document listener and updates every
  `.tmx-theme-toggle`. Never give it an `id`.

## Known issues — verified, unfixed

Verified by running the gates on 2026-08-11, after the port-drift fixes landed.

- `npm run build` — **passes.** Curriculum guard green (9 lessons), 14 pages
  built, link checker green (0 broken, 0 unprefixed over 14 pages).
- `npm run check` — **passes: 0 errors, 0 warnings, 0 hints over 20 files.**
- `node scripts/check-assembled-links.mjs _site` from the monorepo root —
  **passes:** 45 pages, 1,391 internal links, 142 crossing a course boundary,
  0 broken.

### FIXED — the three port-drift errors this course shipped with

Recorded because they are the *shape* of bug this monorepo produces, and the
next course port will produce them again. All three came from the same cause:
a file copied from course two, with the identity edits applied to some lines and
not others. Nothing catches that except `astro check`, which is a CI gate — so
they blocked the whole monorepo's pipeline, not just this course.

1. **`progress.ts` was half-ported.** `EXPORT_KIND` said
   `'termux-advanced-progress'` while the `ProgressExport` interface still
   declared `kind: 'termux-intermediate-progress'` — two hand-synced string
   literals that a port is guaranteed to separate. The interface now reads
   `kind: typeof EXPORT_KIND`, so there is one string and the next port changes
   it once. The import-rejection message also named the wrong course, which is
   the same drift in a place the compiler cannot see.
2. **`SiteTitle.astro` had a dead `unbuilt` branch.** Shipping course three
   removed the last `unbuilt: true`, leaving a permanently-false ternary against
   a property no entry declared — one error in **each of the three copies** of
   that file. Removed in all three.
3. **`astro.config.mjs` shipped course two's identity.** `DESCRIPTION`,
   `STRUCTURED_DATA` (`name` ×2, `educationalLevel`, a `teaches` list of seven
   course-two skills, `coursePrerequisites`, `courseWorkload`) and
   `og:image:alt` all still described Termux:API, scripts and tunnels. No error
   attached — it simply rendered into every page's `<head>` and would have been
   what search results showed. The `teaches` list now has nine entries matching
   the nine lessons; nothing validates it, so it is still on you.

### 4. FIXED — `SANDBOX_PATH` pointed at a page that does not exist

It held a course-two slug (`automation/shell-scripts`) for a directory this
course does not have, so the COI loader shipped in all 13 pages and could never
fire. Two changes:

- `SANDBOX_PATH` is now `null` — the honest value for a course with no
  `LiveSandbox`. See
  [No practice terminal](#no-practice-terminal-anywhere-and-that-is-the-design).
- The loader entry is emitted **only when `SANDBOX_PATH` is set**, so this
  course now ships none of it rather than shipping an inert script. Verified: 0
  built pages reference `coi-serviceworker`.

It is also now **enforced** — `scripts/check-curriculum.mjs` fails the build if a
non-null `SANDBOX_PATH` does not resolve to a real content file, which is what
would have caught the original drift. If a sandbox is ever added here, set the
constant to that lesson's path and the guard will confirm it.

### 5. `markdown.rehypePlugins` is deprecated

Every `astro build` and every `astro check` prints:

```text
[astro] `markdown.remarkPlugins`, `markdown.rehypePlugins`, and
`markdown.remarkRehype` are deprecated. Pass them to `unified({...})` from
`@astrojs/markdown-remark` directly instead.
```

That is `rehypeBasePaths` — the base-path mechanism from gotcha #3, the one
thing standing between root-relative content links and a site-wide 404 on
Pages. It works, but it sits on an Astro 7 removal path, so the migration to
`unified({...})` is a *when*, not an *if*. Do it deliberately, with
`npm run build` (whose link check is the only thing that would catch a botched
migration) rather than as a drive-by.

## Do not undo

- **The `localStorage` key must stay `tmx:advanced:v1`**, distinct from both
  siblings. Full reasoning at the top of this file. Of everything on this page,
  this is the one a well-meaning cleanup pass is most likely to "consolidate",
  and the damage is invisible until a learner loses a course.
- **There is no practice terminal, and there must not be one** until `shell.ts`
  can honestly represent a rootfs, an X11 socket or a GPU — which it cannot.
  Full reasoning above; `index.mdx` says it to the learner in prose, and five
  lessons carry the comment.
- **This course has no deploy workflow and must not get one.** GitHub Pages
  publishes one artifact per repository; the root workflow assembles all four
  projects. A `.github/workflows/deploy.yml` here would either be ignored or
  fight the real one for the Pages deployment.
- **The `@layer` declaration was removed on purpose, and Tailwind with it.**
  Unlayered CSS outranks *every* layered rule, and Starlight ships its styles
  inside `@layer starlight.*` — which is the only reason `global.css` can
  restyle Starlight without an escalating specificity war. Re-introducing a
  layer for this file would rank it **below** Starlight's rules and break the
  whole theme. Tailwind emitted only phantom utilities, and
  `@astrojs/starlight-tailwind` only bridged 14 `--sl-*` vars that the BRIDGE
  section already defines. The long comment at the top of `global.css` records
  the full reasoning.
- **The `SIBLINGS` allowlist in `check-links.mjs`** and its position *before*
  the base-prefix test. Both are fixes with a measured failure behind them.
- **Quoted frontmatter values containing `": "`.** Unquoting one is a build
  failure whose error message never mentions the colon.
- Storage advice inherited from course one: **code lives in `~`, backups go to
  `~/storage/shared/`** (shared storage has no exec bit and no symlinks). The
  inverse advice was a documented bug. It matters more here: a PRoot rootfs on
  shared storage cannot work at all.
- The lesson order, the utility pages' `prev: false` / `next: false`, the
  root-relative link convention, and the dark-locked terminal tokens are all
  fixes with measured results behind them.

## Housekeeping

- Tab indentation in CSS/TS. Comments explain *why*, citing the before/after.
- **Shared artwork lives in `global-assets/` at the monorepo root, and this
  project keeps no copy of it.** Stylesheets reach it with
  `url('../../../global-assets/…')` and build-time imports with
  `'../../../../global-assets/…?raw'`; Vite resolves across the project
  boundary and hashes the file into this project's own `_astro/`. `src/assets/`
  is empty here and should stay that way.

  Two exceptions are generated copies, because `public/` cannot be aliased:
  `public/favicon.svg` and `public/fonts/*.woff2`. Run `npm run assets:sync`
  from the root after changing either upstream; `npm run assets:check` fails on
  drift. `public/og-default.*` is deliberately NOT synced — the social card
  names this course, so the copies genuinely differ.

  Media the frontend does not serve lives in the git-ignored `scratchpad/` —
  including the `termux_scatter_field_bundle/` working set and its `.zip`, which
  used to sit in `src/assets/` here and which the build never referenced.
- `tsconfig.json` extends `astro/tsconfigs/strict`. `typescript` and
  `@astrojs/check` **are** installed, and CI runs `npm run check` as a gate
  before the build — so a type error here fails the pipeline for the **whole
  monorepo**, not just this course. That is worth remembering before shipping a
  half-finished port. `astro build` on its own does not typecheck; run
  `npm run check` yourself.
- `npm run build` first runs `scripts/check-curriculum.mjs`, which fails the
  build if the `sidebar` array, `LESSONS`, the `.mdx` files and the
  `<LessonComplete slug="…">` strings disagree. It also asserts the frontmatter
  facts that decide the learner's rail and that the four-way comparison cannot
  see: only the **last** lesson may carry `next: false`; utility pages must
  carry **both** `prev: false` and `next: false`; `index.mdx`'s hero action and
  `next.link` must both point at lesson one (`container/why-proot/`) and must
  not be root-relative; and the inert `sidebar.order` values must still ascend
  in sidebar order. Keep it passing rather than working around it.
- `npm run build` then runs `scripts/check-links.mjs` over `dist/`, which fails
  the build on any internal link that resolves to no file, on any `#fragment`
  naming an `id` the target page does not have, and on any root-relative
  internal link that never got the `base` prefix — all of which are a 200 in dev
  and a 404 on Pages, so nothing else catches them. Run it alone with
  `npm run check:links` (it needs an existing `dist/`).

## Astro reference

Full documentation: <https://docs.astro.build>

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components (React islands)](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Starlight sidebar & pagination](https://starlight.astro.build/guides/sidebar/)
