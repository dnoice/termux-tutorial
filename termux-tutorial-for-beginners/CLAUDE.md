# CLAUDE.md — working notes for agents and new contributors

Project knowledge for **Termux for Beginners**: an Astro 7 + Starlight 0.41
static course that teaches Termux with an in-browser terminal. Read this before
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
launching a workflow, so a run that goes sideways is one `git checkout` from
recoverable.

## This is one repo, one site

All three courses live in the same repository —
<https://github.com/dnoice/termux-tutorial> — and deploy as a single GitHub
Pages site, assembled by `.github/workflows/deploy.yml` at the repo root:

```text
_site/                 <- the hub       (base /termux-tutorial)
_site/beginner/        <- this course   (base /termux-tutorial/beginner)
_site/intermediate/    <- course two    (base /termux-tutorial/intermediate)
_site/advanced/        <- course three  (base /termux-tutorial/advanced)
```

The hub owns the site root; this course sits at `/termux-tutorial/beginner`.
The tree here used to put this course at the root and describe advanced as not
yet existing — both true before the hub was built and before course three
shipped. `scripts/projects.mjs` at the monorepo root declares the layout; prefer
it over any prose, including this.

Pages publishes one artifact per repository, which is why the courses cannot
each deploy themselves. Each keeps its own `package.json`, guards and `base`;
they are independent projects that ship together.

Two consequences worth holding on to:

- **This course's link checker cannot see its siblings.** Cross-course links
  resolve only after assembly, so `scripts/check-links.mjs` recognises them and
  **defers** them: `COURSE_SEGMENTS` lists the assembled courses explicitly (so a
  typo in the segment is still caught), `SIBLING_PREFIXES` is derived from it.
  Deferred is not skipped — `scripts/check-assembled-links.mjs` at the monorepo
  root resolves them against the assembled tree. Add a course when it starts
  being assembled and not before.
- **The storage keys must stay distinct.** One origin, several paths, and
  `localStorage` is scoped to the origin. Sharing a key makes each course
  overwrite the other's progress and profile, silently.

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
  Mono), self-hosted — but *not* via the Fontsource entrypoints. Those pulled 21
  woff2 (583 KB, 68% of it non-latin). The eight **latin** faces are copied into
  `public/fonts/` by `npm run fonts:sync` and declared by the `FONT_FACES` array
  in `astro.config.mjs`, which emits an inline `@font-face` block plus preloads.
  A new family — or any change to a `--font-*` token in `global.css` — must be
  mirrored in `FONT_FACES`, or the face simply will not load.
- **No CSS framework, and no `@layer`.** Tailwind and
  `@astrojs/starlight-tailwind` were removed deliberately, and so was the
  `@layer` declaration — see "Do not undo" below, which is the single most
  expensive thing on this page to get wrong. Styling is plain CSS with tokens in
  `src/styles/global.css`.

## Architecture

```text
astro.config.mjs        site/base, the rehypeBasePaths plugin, the sidebar
                        (= curriculum order), FONT_FACES + preloads, the two
                        hand-authored Expressive Code themes, og:image tags,
                        the schema.org Course JSON-LD, the scoped COI
                        service-worker <script>, the card-spotlight inline
                        script, xterm SSR workarounds
src/content/docs/       lessons (.mdx) + reference pages (.md) — 15 files
src/components/
  terminal/shell.ts     the simulator: a hand-written interpreter over an
                        in-memory filesystem. No real code executes.
  terminal/TermuxTerminal.tsx   xterm UI around shell.ts (fish-style
                        autosuggestion + highlighting, touch key row,
                        soft-keyboard handling)
  terminal/LiveSandbox.tsx      the optional real Debian VM (CheerpX/WebVM)
  profile/              Avatar, ProfileBadge, LessonComplete, ProgressDashboard
  lesson/PracticeSection.astro  sticky wrapper around a lesson's terminal
  splash/BootSplash.astro       the landing page's boot animation
  icons/icons.tsx       inline SVG icons for JSX, where astro-icon can't reach
  overrides/Sidebar.astro       injects the profile badge above Starlight's nav
  overrides/ThemeSelect.astro   replaces Starlight's theme <select>
src/lib/progress.ts     localStorage store + LESSONS (curriculum totals)
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
database. The build emits **16 HTML files** — 15 content pages plus `404.html`.

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
- **Terminal surfaces are dark in both themes.** `--tmx-screen`,
  `--tmx-screen-muted` and `--tmx-screen-brand` are **dark-locked**:
  byte-identical in the `:root` light block and the `[data-theme='dark']` block.
  Anything drawn on `--tmx-screen` — the terminal chrome, the status strip, the
  touch key row — must use them. The theme-following `--fg-*` tokens fail AA
  there in light mode. This is why the key row needs no light variant. `--tmx-screen-ink` (the key-row
  label ink, `#e8dfcc`) is the fourth member of the set and matches what
  `TermuxTerminal.tsx` hands xterm as `foreground`.
- **The xterm palette is a third copy of those colours.** `TermuxTerminal.tsx`
  passes literal hexes to xterm's `theme` option (xterm parses real colours, not
  CSS variables), and the two Expressive Code themes in `astro.config.mjs` do the
  same for fenced code. Change a screen token and all three have to move
  together, or the same command renders in two colours on one page — which is
  the exact bug the code themes were written to fix.
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
- **Island styling lives in CSS, not in JSX.** The React islands used to carry
  84 inline `style={{}}` objects; they now carry 5, and all of them are values
  only JS can know (an avatar's size, a progress bar's `width: n%`, the two
  terminals' height). Everything static belongs in the **REACT ISLAND CHROME**
  section of `global.css`, and conditional styling belongs on a `data-*` /
  `aria-*` attribute selector rather than a ternary — so a piece of state is
  expressed once in the DOM instead of twice in the markup. The CTRL key's
  `data-armed` is the worked example.
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
`<LessonComplete slug="…">` strings in each lesson. `scripts/check-curriculum.mjs`
(run by `npm run build` and by CI) fails the build when they drift.

The `sidebar.order` values still present in content frontmatter are **inert**
while the groups use explicit `items` arrays — Starlight only reads `order`
under `autogenerate`. They are kept correct so a future conversion is safe, but
they are not the source of truth. The array is.

### 2. Base paths — one plugin, two blind spots

Content links are authored root-relative (`/start/why-termux/`) and
`rehypeBasePaths` in `astro.config.mjs` prefixes `BASE` at build time. Never
hardcode `/termux-tutorial/…`. The plugin only sees anchors the
Markdown pipeline produced, so it misses:

- **Raw `<a href>` written in MDX** — build the URL from
  `import.meta.env.BASE_URL` instead (`index.mdx` shows the pattern).
- **Frontmatter links** (hero `actions`, `next.link`, `prev.link`) — Starlight
  does not base-prefix them and frontmatter cannot read `BASE_URL`. Use a
  relative link with no leading slash.

Both blind spots fail the same way: a 200 in dev, a 404 on GitHub Pages.

### 3. The xterm SSR alias

`@xterm/xterm@6` has no `exports` map and its `main` is UMD, so Vite's SSR
resolver picks the UMD build and `import { Terminal }` yields no named export —
even though both terminals are `client:only`. Two workarounds in
`astro.config.mjs` keep the build green: `ssr.noExternal` for the three xterm
packages, and a `resolve.alias` forcing `@xterm/xterm` to
`@xterm/xterm/lib/xterm.mjs`, resolved through Node's own resolver
(`createRequire`) rather than a hardcoded `./node_modules` path, so it survives
pnpm/Yarn PnP layouts. Both terminals still import xterm at module scope, so
both workarounds are still load-bearing. The real fix is to move the xterm
imports inside the effects (`await import('@xterm/xterm')`), which removes them
from the SSR graph and lets the alias and `ssr.noExternal` both be deleted.

### 4. CheerpX is the one CDN, and it is deliberate

`LiveSandbox.tsx` loads the CheerpX runtime from `cxrtnc.leaningtech.com`
(`CHEERPX_VERSION`, pinned) and a Debian image from `wss://disks.webvm.io`.
Everything else — fonts, icons, xterm, React, Starlight — is bundled and served
from our own origin. When you write or edit a "no CDN" claim, state the
exception: optional, one lesson, user-initiated. CheerpX is free for
non-commercial/educational use; a commercial fork must review its licence.

It needs cross-origin isolation for `SharedArrayBuffer`, which GitHub Pages
cannot supply via headers; `public/coi-serviceworker.js` installs it and costs
that page's first visit one reload. It used to be registered site-wide from
`head`, which made every built page `require-corp` and charged every one of them
the self-inflicted reload. It is now injected **only** on the packages lesson,
via two local additions to the vendored worker — `window.coi.swUrl` (the
upstream `document.currentScript.src` read is null for a dynamically injected
tag) and `window.coi.scope`, set to that lesson's directory so the worker never
claims the rest of the site. `SANDBOX_PATH` in `astro.config.mjs` hardcodes that
URL: **if the packages lesson's slug moves, move that constant with it.** The
failure is silent — the Boot button just never leaves its "needs a refresh"
state.

The prose in those two files still counts the site as eleven pages ("10 pages
that gain nothing", "the other ten pages", "eleven competing courses"). It is
fifteen content pages now. The counts are stale, the mechanism they describe is
not.

### 5. Progress is local and must stay optional

`src/lib/progress.ts` is a single `localStorage` key with a pub/sub. Writes are
wrapped in try/catch because storage can be blocked outright (Safari private
mode, embedded webviews). Progress is a convenience, never a prerequisite —
never let a storage failure break a page. Batch multi-lesson writes with
`setManyComplete` rather than looping `setComplete` (each write fires a change
event and re-renders every subscriber).

The store now has a second consumer class beyond the profile UI: the terminal
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
is a silent visual bug with correct-looking CSS and no element to attach to —
it happened twice. Every rewrite therefore goes through `must()`, which throws
and **fails the build** when a pattern stops matching. If you edit that SVG in a
vector editor, expect `must()` to catch it; fix the pattern, never soften the
assertion.

The splash itself is bound by rules that are easy to erode: once per session
(`sessionStorage`, not local), landing page only (mounted from `index.mdx`, not
a layout override — the last thing that rendered site-wide took the sticky
header with it), skippable by any pointer/key/wheel/touch event, no splash at
all under `prefers-reduced-motion`, and **fails open** — the markup ships
`hidden` and an inline pre-paint script reveals it, so no JS means no curtain.
`.tmx-splash[hidden] { display: none }` in `global.css` is what keeps that last
guarantee true, because the component's own `display: grid` would otherwise beat
the UA sheet's `hidden`.

**Do not quote a total runtime for this splash.** The component derives it: one
`T` object of phase durations produces BOTH the CSS custom properties and the
teardown delay, so the "change one, change the other" hazard this section used
to warn about no longer exists — that is the whole point of the rewrite. Read
`T` and `teardownAt` in the component if you need the number.

Note that the **intermediate and advanced copies are an older revision** of this
component: they still hardcode `setTimeout(end, 4400)` with the 500 ms exit
animation separate in `global.css`, which is the hand-synced version this one
replaced. Their headers no longer claim a total. Porting this file forward would
remove the hand-sync entirely; that is a code change, not a doc change.

### 7. The terminal is built for a phone, and that shows up in five places

`TermuxTerminal.tsx` carries mobile affordances that look decorative and are
not. Removing any of them re-breaks something the course claims to teach:

- **The touch key row** (`ESC TAB ↑ ↓ ← → / - ~` plus a sticky `CTRL`). Gboard
  and the Samsung keyboard have none of these keys, so without the row every
  fish feature the lessons market is unreachable on the device the course is
  about. The buttons `preventDefault()` on `pointerdown` — taking focus would
  dismiss the soft keyboard, which is the one thing the row must never do — and
  they feed the *same* `handleData` a keystroke does rather than carrying their
  own copy of the key semantics.
- **Sticky CTRL** is held in a ref *and* a state: the ref is what the input
  handler inside the effect reads (that effect must not re-run when the modifier
  toggles), the state is what paints `data-armed`.
- **Tap-to-focus** on the screen div, because xterm's own hit area does not
  cover the frame's padding.
- **`height: min(${height}px, 45vh)`** rather than the bare `height` prop: with
  the soft keyboard up an Android viewport is roughly half height, and a flat
  340px screen plus chrome plus key row left no room for the lesson.
- **`window.visualViewport`**, because Android Chrome does *not* fire `resize`
  when the soft keyboard opens. That handler scrolls the frame back into the
  shrunken viewport, and it checks `rootRef.current?.contains(activeElement)`
  first so two terminals on one page do not fight over the scroll position.

The chrome above the screen is a `>_` mark plus `termux` plus **"on Android"**.
The three macOS-style dots were removed: neutralising their colours left the
*shape*, and the shape is the part that claims "desktop window" on a course
about Android. Do not put them back.

### 8. `PracticeSection` is a wrapper because `position: sticky` needs one

`components/lesson/PracticeSection.astro` wraps instructions + terminal so the
terminal can park against the **bottom** of the viewport while the learner reads
the instructions above it. Two decisions inside that are not obvious:

- **It has to be a wrapper.** Sticky is bounded by its containing block, so a
  bare rule on `.tmx-terminal` would be bounded by the whole article and the
  terminal would ride over the Recap and the prev/next cards to the end of the
  page. The wrapper ends at the section, so the terminal releases there with no
  scroll listener and no JS.
- **Bottom, not top.** The prose sits *above* the terminal; pinning the terminal
  to the top of the viewport would let the instructions scroll away behind it,
  which is the failure being fixed.

The sticky rule is gated to `(width >= 72rem) and (height >= 46rem) and
(any-pointer: fine)`. **`any-pointer`, not `pointer`** — a laptop with a
touchscreen reports a coarse primary pointer while still having a mouse, and
`pointer: fine` would exclude it. Phones keep the plain stacked flow, where the soft keyboard
and the `visualViewport` handler already own the geometry. It is deliberately
*not* gated on `prefers-reduced-motion`: sticky is a position, not an animation.

### 9. `ThemeSelect` is ours now

`components/overrides/ThemeSelect.astro` replaces Starlight's three-option
`<select>` with one 40px button that cycles light → dark → system. Things to
know before touching it:

- It keeps **Starlight's contract**: the `starlight-theme` localStorage key
  holds `light | dark | auto`, and `:root` carries `data-theme` for the resolved
  value. Break that and Starlight's own pre-paint ThemeProvider fights you.
- The *chosen* mode is published separately as `:root[data-tmx-mode]`, because
  it differs from `data-theme` whenever the choice is "auto". CSS uses it to
  reveal exactly one of the three inline icons, so no JS swaps icons and there
  is no flash.
- Starlight renders the component **twice** (desktop header and mobile menu), so
  the script uses a delegated document listener and updates every
  `.tmx-theme-toggle`. Never give it an `id`.

### 10. Changing `expressiveCode` config? Clear `node_modules/.astro` too

The Expressive Code stylesheet is emitted as `dist/_astro/ec.<hash>.css`, and the
hash covers the EC **config** — themes, `styleOverrides`, plugins. Change any of
it and the filename changes.

Astro's content layer caches rendered Markdown in
**`node_modules/.astro/data-store.json`**, including the `<link>` to that
stylesheet. `rm -rf dist .astro` does **not** clear it, because it lives under
`node_modules/`. The result is a split build: `.mdx` pages get the new hash and
plain `.md` pages keep the old one, pointing at a file that no longer exists —
so the two reference pages shipped with completely unstyled code blocks while
every lesson looked fine.

Nothing about the build is red when this happens except `scripts/check-links.mjs`,
which catches it as an internal link resolving to no file. That is the guard
earning its keep; do not work around it. The fix is
`rm -rf node_modules/.astro dist .astro && npm run build`.

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
migration) rather than as a drive-by.


## Do not undo

- **The `@layer` declaration was removed on purpose, and Tailwind with it.**
  Unlayered CSS outranks *every* layered rule, and Starlight ships its styles
  inside `@layer starlight.*` — which is the only reason `global.css` can
  restyle Starlight without an escalating specificity war. Re-introducing a
  layer for this file would rank it **below** Starlight's rules and break the
  whole theme. The old declaration was decorative anyway (nothing was ever
  placed in a layer). Tailwind emitted only phantom utilities, and
  `@astrojs/starlight-tailwind` only bridged 14 `--sl-*` vars that the BRIDGE
  section already defines. The long comment at the top of `global.css` records
  the full reasoning.
- Storage advice: **code lives in `~`, backups go to `~/storage/shared/`**
  (shared storage has no exec bit and no symlinks). The inverse advice was a
  documented bug.
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
  `@astrojs/check` **are** installed and `npm run check` is green (0 errors, 0
  warnings, 0 hints over 19 files); CI runs it before the build, so a type error
  does fail the pipeline. `astro build` on its own still does not typecheck —
  run `npm run check` yourself.
- `npm run build` first runs `scripts/check-curriculum.mjs`, which fails the
  build if the `sidebar` array, `LESSONS`, the `.mdx` files and the
  `<LessonComplete slug="…">` strings disagree. It also asserts the four
  frontmatter facts that decide the learner's rail and that the four-way
  comparison cannot see: only the **last** lesson may carry `next: false` (a
  placeholder on `extra-keys` once truncated the course one lesson early with a
  green build); utility pages must carry **both** `prev: false` and
  `next: false`; `index.mdx`'s hero action and `next.link` must both point at
  lesson one and must not be root-relative; and the inert `sidebar.order` values
  must still ascend in sidebar order. That is the guard for gotcha #1; keep it
  passing rather than working around it.
- `npm run build` then runs `scripts/check-links.mjs` over `dist/`, which fails
  the build on any internal link that resolves to no file, on any `#fragment`
  naming an `id` the target page does not have, and on any root-relative
  internal link that never got the `base` prefix. That is the guard for gotcha
  #2 — all of those are a 200 in dev and a 404 on Pages, so nothing else catches
  them. Run it alone with `npm run check:links` (it needs an existing `dist/`).
- `scripts/check-links.mjs` resolves `BASE` as `process.env.BASE ?? '<literal>'`,
  matching how `astro.config.mjs` resolves it, so `BASE=/preview npm run build`
  stays honest. Both files still hold a copy of that literal: change one and
  change the other, or the checker reports every correctly-prefixed link as
  unprefixed.

## Astro reference

Full documentation: <https://docs.astro.build>

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components (React islands)](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Starlight sidebar & pagination](https://starlight.astro.build/guides/sidebar/)
