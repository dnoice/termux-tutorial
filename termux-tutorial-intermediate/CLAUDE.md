# CLAUDE.md — working notes for agents and new contributors

Project knowledge for **Termux: Intermediate** (course two of three): an Astro 7
+ Starlight 0.41 static course that takes a learner who can already drive the
shell and points that shell at the Android device itself — Termux:API, scripts,
schedulers, and a server exposed to the public internet. Read this before
editing; it records the decisions that are easy to undo by accident.

`AGENTS.md` points here. Keep the knowledge in this file only, so the two
cannot drift apart.

## Where to run npm

**The monorepo root has a `package.json`, and it is the normal place to work.**
`npm run dev` there starts all four projects behind ONE port and ONE URL —
`http://localhost:4321/termux-tutorial/` — routed by the same path prefixes
GitHub Pages uses. That is the only configuration in which the series switcher
and cross-course links resolve: they are absolute paths into sibling courses,
which do not exist in this project's own dev tree.

| Where | Command | For |
| :---- | :------ | :-- |
| root | `npm run dev` | Everything, one URL. The normal one. |
| root | `npm run build` | All four + assemble + cross-course link check |
| root | `npm run check` | Typecheck all four |
| here | `npm run build` | This course alone — curriculum guard, build, link check |
| here | `npm run check` | This course alone |

This directory keeps its own `package.json`, `node_modules` and lockfile, and
the guards described below are still its own. The root is an orchestrator, **not**
an npm workspace: hoisting would merge four projects' Astro/Vite/xterm
resolutions into one tree, and the xterm SSR alias resolves through Node's own
resolver precisely because that resolution is load-bearing.

The four-project topology lives in `scripts/projects.mjs` at the root.

The repo is under git as of 2026-08-10, with a baseline commit taken before any
multi-agent workflow runs. Standing rule: commit a clean baseline BEFORE
launching a workflow.

## This is one repo, one site

All three courses live in the same repository —
<https://github.com/dnoice/termux-tutorial> — and deploy as a single GitHub
Pages site, assembled by `.github/workflows/deploy.yml` at the repo root:

```text
_site/                 <- the hub       (base /termux-tutorial)
_site/beginner/        <- course one    (base /termux-tutorial/beginner)
_site/intermediate/    <- this course   (base /termux-tutorial/intermediate)
_site/advanced/        <- course three  (base /termux-tutorial/advanced)
```

The hub owns the site root. This tree used to show the beginner course there and
described advanced as "when it exists" — both true before the hub was built and
before course three shipped. `scripts/projects.mjs` at the monorepo root is the
one place the layout is declared; prefer it over any prose, including this.

Pages publishes one artifact per repository, which is why the courses cannot
each deploy themselves. Each keeps its own `package.json`, guards and `base`;
they are independent projects that ship together.

Two consequences worth holding on to:

- **This course's link checker cannot see its siblings.** Cross-course links
  resolve only after assembly, so `scripts/check-links.mjs` recognises them and
  **defers** them: `COURSE_SEGMENTS` lists the assembled courses explicitly (so a
  typo in the segment is still caught) and `SIBLING_PREFIXES` is derived from it.
  Deferred is not skipped — `scripts/check-assembled-links.mjs` at the monorepo
  root resolves them against the assembled tree, where all four projects exist at
  once. Add a course when it starts being assembled and not before.
- **The storage keys must stay distinct.** One origin, several paths, and
  `localStorage` is scoped to the origin. Sharing a key makes each course
  overwrite the other's progress and profile, silently.

## The single most breakable thing in this repo

**The `localStorage` key is `tmx:intermediate:v1`, and it must never be
unified with the beginner course's `tmx:beginners:v1`.**

Look for the `KEY` constant in `src/lib/progress.ts` — named rather than
numbered, because the line moves. It looks like a copy-paste leftover from the
port. It is the opposite: it is the fix.

All four projects ship to **paths under one origin AND one base directory** —
`dnoice.github.io/termux-tutorial/{,beginner/,intermediate/,advanced/}` — and
`localStorage` is scoped to the origin, not the path. That makes this *more*
dangerous than it was when the courses were separate repos, not less. A shared
key means every one of them reads and writes the same object: ticking a lesson
here overwrites another course's `completed` array with slugs it does not
recognise, and the profile name and avatar ping-pong between them. There is no
error, no warning, and no recovery — the learner just finds their other course
blank.

The same separation runs through the export/import format. `EXPORT_KIND` is
`termux-intermediate-progress` against `termux-beginners-progress` and
`termux-advanced-progress`, and `importProgress()` rejects the wrong file *by
name* ("That's a JSON file, but not a Termux: Intermediate progress file")
rather than accepting it and silently pruning every slug. The likeliest wrong
file a learner will pick is the other course's export, so it gets a real
message.

Course three exists and has its own key (`tmx:advanced:v1`). `v1` is a schema
version, not a course counter — bump it only when the stored *shape* changes,
never to distinguish a course.

The hub reads all three keys and writes the shared profile back into each of
them (`hub/src/lib/store.ts`). That is the payoff for keeping them distinct, and
another reason not to "consolidate" them.

**One key is correctly shared and should stay that way:** `starlight-theme`.
Light/dark is a preference about a site that visibly looks like one site; it
should carry across. The rule is not "never share storage", it is "never share
*progress*".

## Stack

- **Astro 7** + **Starlight 0.41**, static output, deployed to GitHub Pages by the
  monorepo root's `.github/workflows/deploy.yml` (this course no longer has one
  of its own).
- **React 19** islands for anything interactive (`@astrojs/react`).
- **xterm.js 6** (`@xterm/xterm` + fit + web-links) for both terminals.
- **astro-icon** with the Iconify Font Awesome 6 sets, inlined as SVG at build
  time. `iconDir: 'src/assets/icons'` is configured but that directory does not
  exist; every `<Icon>` resolves from the `@iconify-json/*` packages.
- **Fontsource variable** fonts (Inter, Crimson Pro, Source Serif 4, JetBrains
  Mono), self-hosted — but *not* via the Fontsource entrypoints, which pull
  every subset. The eight **latin** faces are copied into `public/fonts/` by
  `npm run fonts:sync` and declared by the `FONT_FACES` array in
  `astro.config.mjs`, which emits an inline `@font-face` block plus preloads.
  A new family — or any change to a `--font-*` token in `global.css` — must be
  mirrored in `FONT_FACES`, or the face simply will not load.
- **No CSS framework, and no `@layer`.** See "Do not undo" below, which is the
  single most expensive thing on this page to get wrong. Styling is plain CSS
  with tokens in `src/styles/global.css`.

## Architecture

```text
astro.config.mjs        site/base, the rehypeBasePaths plugin, the sidebar
                        (= curriculum order), FONT_FACES + preloads, the two
                        hand-authored Expressive Code themes, og:image tags,
                        the schema.org Course JSON-LD, the scoped COI
                        service-worker <script>, xterm SSR workarounds
src/content/docs/       lessons (.mdx) + reference pages (.md) — 12 files
src/components/
  terminal/shell.ts     the simulator: a hand-written interpreter over an
                        in-memory filesystem. No real code executes.
  terminal/TermuxTerminal.tsx   xterm UI around shell.ts (fish-style
                        autosuggestion + highlighting, touch key row,
                        soft-keyboard handling)
  terminal/LiveSandbox.tsx      the optional real Debian VM (CheerpX/WebVM)
  profile/              Avatar, ProfileBadge, LessonComplete, ProgressDashboard
  lesson/PracticeSection.astro  sticky wrapper — present, currently unused
  splash/BootSplash.astro       the landing page's boot animation
  icons/icons.tsx       inline SVG icons for JSX, where astro-icon can't reach
  overrides/Sidebar.astro       injects the profile badge above Starlight's nav
  overrides/ThemeSelect.astro   replaces Starlight's theme <select>
src/lib/progress.ts     localStorage store + LESSONS + export/import
src/lib/useProgress.ts  React hook over the store's pub/sub
src/styles/global.css   the whole design system
src/styles/print.css    the paper edition; listed LAST in customCss so it wins
public/fonts/           eight latin woff2 faces, written by `npm run fonts:sync`
public/og-default.png   the 1200x630 social card (og-default.svg is its source)
public/coi-serviceworker.js   COOP/COEP shim so SharedArrayBuffer works on Pages
scripts/check-curriculum.mjs  build-time guard: sidebar == LESSONS == files
scripts/check-links.mjs       build-time guard: every internal link in dist/
```

Every React island is `client:only="react"`. There is no server, no API, no
database. The build emits **13 HTML files** — 12 content pages plus `404.html`.

### The curriculum, as it actually stands

Eight lessons in `LESSONS`, three teaching sections plus a reference group:

| # | Slug | Section |
| :- | :--- | :------ |
| 1 | `bridge/api-setup` | The Android Bridge |
| 2 | `bridge/reading-the-device` | The Android Bridge |
| 3 | `bridge/talking-back` | The Android Bridge |
| 4 | `automation/shell-scripts` | Scripting & Automation |
| 5 | `automation/scheduling` | Scripting & Automation |
| 6 | `serving/local-server` | Serving From Your Pocket |
| 7 | `serving/tunnels` | Serving From Your Pocket |
| 8 | `where-next` | Serving From Your Pocket |

`index` (Welcome) sits inside the first sidebar group as step zero. `progress`,
`reference/cheatsheet` and `reference/troubleshooting` form the Reference &
Tools group and are excluded from `LESSONS`, so they never inflate the progress
total.

The ordering is argued in comments in the `sidebar` array and those arguments
are load-bearing: setup lesson first because every later lesson is dead without
Termux:API; scripts *after* the three API lessons because a first script is more
convincing when it composes commands the learner already ran by hand; local
server before tunnels so a learner can tell a server failure from a tunnel
failure; tunnels last of the teaching lessons because it is the only one that
makes the device reachable by strangers.

**Nothing from course one is re-taught.** `pkg install`, `~/storage`, fish,
sessions and the extra-keys row are assumed knowledge — reference them, never
re-explain them.

`reference/cheatsheet.md` and `reference/troubleshooting.md` are written, from
the finished lessons. The cheatsheet is ordered to match the curriculum and
links back to the lesson that teaches each command; troubleshooting is ordered
by how often a failure actually happens, opening with the `termux-*` hang that
is this course's signature failure.

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
  `--tmx-screen-muted` (`#8e8676`) and `--tmx-screen-brand` (`#d4b15c`) are
  **dark-locked**: byte-identical in the `:root` light block and the
  `[data-theme='dark']` block. Anything drawn on `--tmx-screen` — the terminal
  chrome, the status strip, the touch key row — must use them. The
  theme-following `--fg-*` tokens fail AA there in light mode. This is why the
  key row needs no light variant. `--tmx-screen-ink` (the key-row label ink, `#e8dfcc`) is the fourth
  member of the set and matches what `TermuxTerminal.tsx` hands xterm as
  `foreground`.
- **The xterm palette is a third copy of those colours.** `TermuxTerminal.tsx`
  passes literal hexes to xterm's `theme` option (xterm parses real colours, not
  CSS variables), and the two Expressive Code themes in `astro.config.mjs`
  (`fire-watch-obsidian` and `fire-watch-parchment`) do the same for fenced
  code. Change a screen token and all three have to move together, or the same
  command renders in two colours on one page — the exact bug the code themes
  were written to fix.
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
  bar's `width: n%`, the terminals' height). Conditional styling belongs on a
  `data-*` / `aria-*` attribute selector rather than a ternary, so a piece of
  state is expressed once in the DOM instead of twice in the markup. The CTRL
  key's `data-armed` is the worked example.
- **Island text picks its family explicitly.** `.tmx-island` (Inter chrome) /
  `.tmx-island__title` (Crimson Pro) / `.tmx-island__meta` (Inter) /
  `.tmx-island__prose` (Source Serif). Without one of these a new component
  inherits from `body` and silently lands on Inter by accident rather than by
  decision.
- Type scale, line-height, and block rhythm are tokens (`--text-*`,
  `--leading-*`, `--space-block`); do not hardcode font sizes or margins.

## Gotchas that will cost you an afternoon

### 1. The sidebar array *is* the curriculum

`sidebar` in `astro.config.mjs` drives the menu **and** Starlight's prev/next
pagination — it is the rail the learner rides. Utility pages (Your Progress,
Cheatsheet, Troubleshooting) sit in their own group and additionally set
`prev: false` / `next: false` in frontmatter so they never appear as "step two".
Keep the array in sync with `LESSONS` in `src/lib/progress.ts` and with the
`<LessonComplete slug="…">` strings in each lesson.
`scripts/check-curriculum.mjs` (run by `npm run build` and by CI) fails the
build when they drift.

`where-next` is the terminus and the only lesson carrying `next: false`. Its
`prev` is left to Starlight, because it is the last item of the last teaching
group and the array derives it.

The `sidebar.order` values in content frontmatter are **inert** while the groups
use explicit `items` arrays — Starlight only reads `order` under `autogenerate`.
They are kept correct so a future conversion is safe, but they are not the
source of truth. The array is.

### 2. Base paths — one plugin, two blind spots

`base` is **`/termux-tutorial/intermediate`**. The hub owns `/termux-tutorial`
and the sibling courses sit alongside this one at `/termux-tutorial/beginner`
and `/termux-tutorial/advanced` — one repository, one Pages site, four
projects. Content links are authored root-relative (`/bridge/api-setup/`) and
`rehypeBasePaths` in
`astro.config.mjs` prefixes `BASE` at build time. Never hardcode the base into
content. The plugin only sees anchors the Markdown pipeline produced, so it
misses:

- **Raw `<a href>` written in MDX** — build the URL from
  `import.meta.env.BASE_URL` instead. `index.mdx` and `where-next.mdx` both show
  the pattern: `export const base = import.meta.env.BASE_URL.replace(/\/$/, '')`.
- **Frontmatter links** (hero `actions`, `next.link`, `prev.link`) — Starlight
  does not base-prefix them and frontmatter cannot read `BASE_URL`. Use a
  relative link with no leading slash (`bridge/api-setup/`).

Both blind spots fail the same way: a 200 in dev, a 404 on GitHub Pages.

`scripts/check-links.mjs` resolves BASE the same way the config does
(`process.env.BASE ?? '/termux-tutorial/intermediate'`) rather than hardcoding
it, after a ported copy carried the wrong literal and reported every correctly
prefixed link as unprefixed. **Both files hold a copy of the base path; change
one and change the other.**

### 3. The xterm SSR alias

`@xterm/xterm@6` has no `exports` map and its `main` is UMD, so Vite's SSR
resolver picks the UMD build and `import { Terminal }` yields no named export —
even though both terminals are `client:only`. Two workarounds in
`astro.config.mjs` keep the build green: `ssr.noExternal` for the three xterm
packages, and a `resolve.alias` forcing `@xterm/xterm` to
`@xterm/xterm/lib/xterm.mjs`, resolved through Node's own resolver
(`createRequire`) rather than a hardcoded `./node_modules` path, so it survives
pnpm/Yarn PnP and parent-hoisting workspace layouts. If that resolution ever
fails the alias is omitted with a warning rather than throwing on a stale path.
Both terminals still import xterm at module scope, so both workarounds are still
load-bearing. The real fix is to move the xterm imports inside the effects
(`await import('@xterm/xterm')`), which removes them from the SSR graph and lets
the alias and `ssr.noExternal` both be deleted.

### 4. CheerpX is the one CDN, and it moved lessons on purpose

`LiveSandbox.tsx` loads the CheerpX runtime from `cxrtnc.leaningtech.com`
(`CHEERPX_VERSION = '1.1.5'`, pinned) and a Debian image from
`wss://disks.webvm.io`. Everything else — fonts, icons, xterm, React, Starlight
— is bundled and served from our own origin. When you write or edit a "no CDN"
claim, state the exception: optional, one lesson, user-initiated.

It sits on **`automation/shell-scripts`** here, not on a packages lesson as in
the beginner course, and the reason is written into the config: WebVM is x86
Debian, not Android, so it cannot run a single `termux-*` command. It is
worthless on the API lessons and genuinely useful on the one lesson that is
plain POSIX shell — write a script, `chmod` it, run it, break it, with no risk
to a real device.

It needs cross-origin isolation for `SharedArrayBuffer`, which GitHub Pages
cannot supply via headers; `public/coi-serviceworker.js` installs it and costs
that page's first visit one reload. It is injected **only** on that lesson, via
two local additions to the vendored worker — `window.coi.swUrl` (the upstream
`document.currentScript.src` read is null for a dynamically injected tag) and
`window.coi.scope`, set to that lesson's directory so the worker never claims
the rest of the site. `SANDBOX_PATH` in `astro.config.mjs` hardcodes that URL:
**if the shell-scripts lesson's slug moves, move that constant with it.**
Nothing validates it and the failure is silent — the Boot button simply never
leaves its "needs a refresh" state.

### 5. Progress is local, optional, and portable

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

The store has a second consumer class beyond the profile UI: the terminal
prompt. `TermuxTerminal.tsx` reads `load().profile.name`, runs it through
`shellUser()` (lowercase, strip anything outside `[a-z0-9_-]`, cap at 16 chars,
fall back to `u0_a123` for the default "Guest") and puts the result in
`state.env.USER`, so the prompt, `whoami` and `echo $USER` all agree. It
`subscribe()`s to keep that live, and **redraws only when the name actually
changed** — an unconditional `render()` there repaints the input line under the
learner's caret every time any lesson is ticked complete.

### 6. `BootSplash` rewrites Inkscape-formatted SVG — every rewrite is asserted

`components/splash/BootSplash.astro` inlines
`src/assets/termux_linux_elements.svg?raw` and tags its parts at build time so
CSS can animate them. The artwork is **Inkscape-pretty-printed: every attribute
sits on its own line**, so the obvious patterns (`'<svg '`,
`'<rect width="1280" height="832"'`) match *nothing*. `String.replace()` that
matches nothing returns its input unchanged and reports success, so the failure
is a silent visual bug with correct-looking CSS and no element to attach to.
Every rewrite therefore goes through `must()`, which throws and **fails the
build** when a pattern stops matching. If you edit that SVG in a vector editor,
expect `must()` to catch it; fix the pattern, never soften the assertion.

The splash is bound by rules that are easy to erode: once per session
(`sessionStorage`, not local), landing page only (mounted from `index.mdx`, not
a layout override — the last thing that rendered site-wide took the sticky
header with it), skippable by any pointer/key/wheel/touch event, no splash at
all under `prefers-reduced-motion`, and **fails open** — the markup ships
`hidden` and an inline pre-paint script reveals it, so no JS means no curtain.
`.tmx-splash[hidden] { display: none }` in `global.css` is what keeps that last
guarantee true, because the component's own `display: grid` would otherwise beat
the UA sheet's `hidden`.

**The teardown timer is NOT derived here — it is hand-synced, and that is the
hazard.** This copy hardcodes `setTimeout(end, 4400)` in the component while the
phase delays and the 500 ms exit animation live as separate literals in
`global.css`. Change one and you must change the other, with nothing to tell you
that you did not. The beginner course's copy was rebuilt to emit both from one
`T` object and no longer has this problem; porting it forward is the real fix.

### 7. The terminal is built for a phone, and that shows up in five places

`TermuxTerminal.tsx` carries mobile affordances that look decorative and are
not. Removing any of them re-breaks something the series claims to teach:

- **The touch key row** (`ESC TAB ↑ ↓ ← → / - ~` plus a sticky `CTRL`). Gboard
  and the Samsung keyboard have none of these keys. The buttons
  `preventDefault()` on `pointerdown` — taking focus would dismiss the soft
  keyboard, which is the one thing the row must never do — and they feed the
  *same* `handleData` a keystroke does rather than carrying their own copy of
  the key semantics.
- **Sticky CTRL** is held in a ref *and* a state: the ref is what the input
  handler inside the effect reads (that effect must not re-run when the modifier
  toggles), the state is what paints `data-armed`.
- **Tap-to-focus** on the screen div, because xterm's own hit area does not
  cover the frame's padding.
- **`height: min(${height}px, 45vh)`** rather than the bare `height` prop: with
  the soft keyboard up an Android viewport is roughly half height.
- **`window.visualViewport`**, because Android Chrome does *not* fire `resize`
  when the soft keyboard opens. That handler scrolls the frame back into the
  shrunken viewport, and it checks `rootRef.current?.contains(activeElement)`
  first so two terminals on one page do not fight over the scroll position.

The chrome above the screen is a `>_` mark plus `termux` plus **"on Android"**.
The three macOS-style dots were removed: neutralising their colours left the
*shape*, and the shape is the part that claims "desktop window" on a course
about Android. Do not put them back.

### 8. The simulator does not know this course's commands

This is the biggest content-level trap in the repo, and it is why lessons here
look emptier than the beginner course's.

`shell.ts` was ported from course one. It understands `termux-api`,
`termux-change-repo`, `termux-setup-storage`, `termux-reload-settings` and the
general shell — and **nothing** of `termux-battery-status`,
`termux-notification`, `termux-sensor`, `termux-location`, `jq`, `crontab`,
`termux-job-scheduler` or `cloudflared`. That is most of what this course
teaches.

So `<TermuxTerminal>` appears on the **Welcome page only**. `bridge/api-setup`
and `bridge/reading-the-device` carry explicit comments recording that the
omission is deliberate: a terminal that answers `command not found` to the
lesson's own instructions is worse than no terminal, and it is a trust bug
rather than a nit.

Do not "fix" this by dropping terminals onto lessons. Fix it by teaching
`shell.ts` the commands first, keeping the output faithful to real Termux
(including the failure modes — a `termux-*` command with no companion app hangs
forever, it does not error), and registering each name so highlighting and
autosuggestion agree with what actually runs. `PracticeSection.astro` is present
and working and will be wanted the moment a lesson gets a terminal; it is unused
today for the same reason.

### 9. `PracticeSection` is a wrapper because `position: sticky` needs one

Currently unused, but intact and worth understanding before a lesson adopts it.
It wraps instructions + terminal so the terminal can park against the **bottom**
of the viewport while the learner reads the instructions above it.

- **It has to be a wrapper.** Sticky is bounded by its containing block, so a
  bare rule on `.tmx-terminal` would be bounded by the whole article and the
  terminal would ride over the Recap and the prev/next cards to the end of the
  page. The wrapper ends at the section, so the terminal releases there with no
  scroll listener and no JS.
- **Bottom, not top.** The prose sits *above* the terminal; pinning it to the
  top would let the instructions scroll away behind it, which is the failure
  being fixed.

The sticky rule is gated to `(min-width: 72rem) and (min-height: 46rem) and
(pointer: fine)` — phones keep the plain stacked flow, where the soft keyboard
and the `visualViewport` handler already own the geometry. It is deliberately
*not* gated on `prefers-reduced-motion`: sticky is a position, not an animation.

### 10. `ThemeSelect` is ours now

`components/overrides/ThemeSelect.astro` replaces Starlight's three-option
`<select>` with one 40px button that cycles light → dark → system.

- It keeps **Starlight's contract**: the `starlight-theme` localStorage key
  holds `light | dark | auto`, and `:root` carries `data-theme` for the resolved
  value. Break that and Starlight's own pre-paint ThemeProvider fights you.
  (This is also the one storage key shared with the beginner course, correctly
  — see the top of this file.)
- The *chosen* mode is published separately as `:root[data-tmx-mode]`, because
  it differs from `data-theme` whenever the choice is "auto". CSS uses it to
  reveal exactly one of the three inline icons, so no JS swaps icons and there
  is no flash.
- Starlight renders the component **twice** (desktop header and mobile menu), so
  the script uses a delegated document listener and updates every
  `.tmx-theme-toggle`. Never give it an `id`.

## Known issues — verified, unfixed

### `markdown.rehypePlugins` is deprecated

Every `astro build` and every `astro check` prints:

```text
[astro] `markdown.remarkPlugins`, `markdown.rehypePlugins`, and
`markdown.remarkRehype` are deprecated. Pass them to `unified({...})` from
`@astrojs/markdown-remark` directly instead.
```

That is `rehypeBasePaths` — the base-path mechanism from gotcha #2, the one
thing standing between root-relative content links and a site-wide 404 on
Pages. It works, but it sits on an Astro 7 removal path, so the migration to
`unified({...})` is a *when*, not an *if*. Do it deliberately, with
`npm run build` (whose link check is the only thing that would catch a botched
migration — so fix that checker's BASE first) rather than as a drive-by.



## Do not undo

- **The `localStorage` key must stay `tmx:intermediate:v1`**, distinct from the
  beginner course's. Full reasoning at the top of this file. Of everything on
  this page, this is the one a well-meaning cleanup pass is most likely to
  "consolidate", and the damage is invisible until a learner loses a course.
- **The `@layer` declaration was removed on purpose, and Tailwind with it.**
  Unlayered CSS outranks *every* layered rule, and Starlight ships its styles
  inside `@layer starlight.*` — which is the only reason `global.css` can
  restyle Starlight without an escalating specificity war. Re-introducing a
  layer for this file would rank it **below** Starlight's rules and break the
  whole theme. Tailwind emitted only phantom utilities, and
  `@astrojs/starlight-tailwind` only bridged 14 `--sl-*` vars that the BRIDGE
  section already defines. The long comment at the top of `global.css` records
  the full reasoning.
- **The absent terminals on the API lessons.** They are absent because the
  simulator would contradict the lesson — see gotcha #8.
- Storage advice inherited from course one: **code lives in `~`, backups go to
  `~/storage/shared/`** (shared storage has no exec bit and no symlinks). The
  inverse advice was a documented bug.
- The lesson order, the utility pages' `prev: false` / `next: false`, the
  root-relative link convention, and the dark-locked terminal tokens are all
  fixes with measured results behind them.

## Housekeeping

- Tab indentation in CSS/TS. Comments explain *why*, citing the before/after.
- Large bitmaps do not belong in `src/assets/` — retired artwork lives in the
  parent workspace's `global-assets/`. Keep `src/assets/` to the SVGs the build
  actually references (`termux_linux_elements.svg` is one: BootSplash inlines
  it).
- `tsconfig.json` extends `astro/tsconfigs/strict`. `typescript` and
  `@astrojs/check` **are** installed and `npm run check` is green; CI runs it
  before the build, so a type error does fail the pipeline. (The file count and
  error tally are not quoted here on purpose — they are command output, they
  drift, and three documents in this repo already disagreed about them.) `astro build` on its own still does not typecheck —
  run `npm run check` yourself.
- `npm run build` first runs `scripts/check-curriculum.mjs`, which fails the
  build if the `sidebar` array, `LESSONS`, the `.mdx` files and the
  `<LessonComplete slug="…">` strings disagree. It also asserts the frontmatter
  facts that decide the learner's rail and that the four-way comparison cannot
  see: only the **last** lesson may carry `next: false`; utility pages must
  carry **both** `prev: false` and `next: false`; `index.mdx`'s hero action and
  `next.link` must both point at lesson one (`bridge/api-setup/`) and must not
  be root-relative; and the inert `sidebar.order` values must still ascend in
  sidebar order. Keep it passing rather than working around it.
- `npm run build` then runs `scripts/check-links.mjs` over `dist/`, which fails
  the build on any internal link that resolves to no file, on any `#fragment`
  naming an `id` the target page does not have, and on any root-relative
  internal link that never got the `base` prefix — all of which are a 200 in dev
  and a 404 on Pages, so nothing else catches them. Run it alone with
  `npm run check:links` (it needs an existing `dist/`).
- Both the config and the checker hold a copy of the base path. Change one and
  change the other. See Known issues for what happens when you do not.

## Astro reference

Full documentation: <https://docs.astro.build>

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components (React islands)](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Starlight sidebar & pagination](https://starlight.astro.build/guides/sidebar/)
