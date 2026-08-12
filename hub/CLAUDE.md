# CLAUDE.md — working notes for agents and new contributors

Project knowledge for the **series hub**: the front door at `/termux-tutorial`,
the cross-course dashboard, and the only editor that writes a learner's name
into all three courses. It is a plain **Astro 7** project with `src/pages/` —
**not Starlight** — and that single fact invalidates most of what the three
course `CLAUDE.md` files will tell you. Read this before editing; it records the
decisions that are easy to undo by accident, and one real gap that nothing here
will warn you about.

There is no `AGENTS.md` in this directory. Keep the knowledge in this file.

## Where to run npm

**The monorepo root has a `package.json`, and it is the normal place to work.**
`npm run dev` there starts all four projects behind ONE port and ONE URL —
`http://localhost:4321/termux-tutorial/` — routed by the same path prefixes
GitHub Pages uses. That is the only configuration in which the hub's links into
the courses resolve at all: every one of them is an absolute path into a sibling
project that does not exist in this project's own dev tree.

| Where | Command | For |
| :---- | :------ | :-- |
| root | `npm run dev` | Everything, one URL. The normal one. |
| root | `npm run build` | All four + assemble + cross-course link check |
| root | `npm run check` | Typecheck all four |
| here | `npm run build` | This project alone — **build only, no guards** |
| here | `npm run check` | This project alone |

That table matches the three courses' so the four cannot drift, but **the "here"
rows do not mean the same thing.** In a course, `npm run build` runs a curriculum
guard and a link checker either side of the build. Here it is exactly
`astro build` (`package.json` line 9) and nothing else. See "This project has no
guards of its own" below — it is the most important section on this page.

This directory keeps its own `package.json`, `node_modules` and lockfile. The
root is an orchestrator, **not** an npm workspace: hoisting would put four
projects' Astro/Vite/xterm resolutions in one tree, and the courses' xterm SSR
alias resolves through Node's own resolver precisely because that resolution is
load-bearing. The hub has no xterm and no such alias, but it shares the
consequence.

The four-project topology lives in `scripts/projects.mjs` at the root, and
`src/lib/courses.ts` now imports it rather than restating it. Git lives at the
monorepo root, not here (`.git` is one level up). Standing rule: commit a clean
baseline BEFORE launching a multi-agent workflow.

## This is plain Astro, not Starlight

`integrations: [react()]` is the entire integration list (`astro.config.mjs`
line 32), and `package.json` has no `@astrojs/starlight` — its dependencies are
`astro`, `@astrojs/react`, `@astrojs/check`, `react`, `react-dom` and
`typescript`. Starlight is a documentation framework; this is a front door.
Pulling it in would drag a sidebar, a search index and a docs layout onto a page
that wants none of them.

**Every Starlight gotcha in the course files therefore does not apply here:**

- **There is no "the sidebar array *is* the curriculum".** There is no sidebar,
  no curriculum and no prev/next rail. Routes come from files in `src/pages/`,
  and there are exactly two: `index.astro` and `profile.astro`.
- **There are no frontmatter base-prefix blind spots.** There is no content
  collection, no `.mdx`, and no `rehypeBasePaths` plugin — so there is also no
  deprecation warning about `markdown.rehypePlugins`, which both course builds
  print. Every internal link is built in `.astro` from
  `import.meta.env.BASE_URL.replace(/\/$/, '')` (`index.astro` line 9,
  `profile.astro` line 8). That is the only pattern; keep it.
- **There is no `ThemeSelect` override contract to break.** The hub has no
  Starlight `ThemeProvider` to fight with. It still honours Starlight's storage
  contract deliberately — see the storage section.
- **The `@layer` hazard is not a hazard here.** That rule exists because
  Starlight ships its styles inside `@layer starlight.*`. Nothing here is
  layered and nothing here restyles Starlight.
- **No Expressive Code, no Pagefind, no sitemap, no astro-icon.** The courses'
  "clear `node_modules/.astro` when you change `expressiveCode`" trap cannot
  happen here.

The build emits **two HTML files** — `dist/index.html` and
`dist/profile/index.html`. Note there is **no `404.html`**: each course emits one
(`_site/beginner/404.html` and its two siblings) and the assembled site root does
not have one. Adding a page means adding a file to `src/pages/`; nothing else
needs updating.

## It is the site root, and its base is a prefix of every other base

All four projects deploy as ONE GitHub Pages site, assembled by
`.github/workflows/deploy.yml` at the **monorepo root**:

```text
_site/                 <- THIS PROJECT   base /termux-tutorial
_site/beginner/        <- course one     base /termux-tutorial/beginner
_site/intermediate/    <- course two     base /termux-tutorial/intermediate
_site/advanced/        <- course three   base /termux-tutorial/advanced
```

`base` is `process.env.BASE ?? '/termux-tutorial'` (`astro.config.mjs` line 19).
Because that string is a **prefix of all three course bases**,
`/termux-tutorial` matches `/termux-tutorial/advanced/…` too — so anything
routing by path must match the LONGEST prefix, not the first. `projectFor()` in
`scripts/projects.mjs` already does that, and its header says `slot: ''` must
lose ties. Do not write path routing of your own; import that.

`scripts/assemble.mjs` copies `hub/dist/` to the `_site/` root and each course's
`dist/` into its slot. It refuses to assemble anything if any of the four is
missing a `dist/index.html`, so a half-built tree never ships.

**This project has no deploy workflow of its own and must not grow one.** Pages
publishes exactly one artifact per repository.

## This project has no guards of its own — read this before touching a link

The three courses each ship `scripts/check-curriculum.mjs` and
`scripts/check-links.mjs`, wired into their own `npm run build`. **The hub ships
neither. There is no `hub/scripts/` directory at all**, and the build script is
bare `astro build`.

The consequences are not obvious and they will bite:

- **`cd hub && npm run build` verifies nothing.** It compiles two pages and
  exits happy. A typo in a course slug, in the `REFS` array (`index.astro` line
  35), or in any `${base}/…/` link builds green here and 404s on Pages.
- **The only thing that checks a hub link is
  `scripts/check-assembled-links.mjs` at the monorepo root.** It walks the
  assembled `_site/` tree — the only tree in which all four projects exist at
  once — and it runs from root `npm run build` (root `package.json` line 39) and
  from the CI step named "Verify cross-course links" in `deploy.yml`. It never
  runs from this directory.
- **Nearly every outbound link on the hub crosses a course boundary**, and those
  are precisely the links that no per-project checker can resolve. The hub is
  the project whose links are least checkable locally and most checked globally.

**So: never call a hub link change verified until root `npm run build` passes.**
The line to look for is the last one it prints. Most recent run:

```text
✓ Assembled site: 45 pages, 1393 internal links, 144 of them crossing a
  course boundary — 0 broken, 0 unprefixed.
```

`npm run check` here (`astro check`) is a real gate and CI runs it before the
build, so a type error in this project fails the pipeline for the **whole
monorepo**. `astro build` does not typecheck; run `npm run check` yourself.

## `lib/courses.ts`: an invariant enforced rather than remembered

This is the best example in the repo of the difference between a rule you write
down and a rule the build enforces, and it is worth copying elsewhere.

The hub needs each course's lesson count (the progress denominator) and its
first-lesson slug (the "continue" link). It could hardcode them. Instead
`src/lib/courses.ts` reads each course's `src/lib/progress.ts` **from disk at
build time** and regex-parses the `LESSONS` array (`parseLessons`, line 84) and
the `const KEY = '…'` line (`parseStorageKey`, line 95). `progress.ts` is already
the single source of truth for a course's curriculum — the courses' own
`check-curriculum.mjs` enforces that it agrees with the sidebar and the content
files — so reading it here extends that guarantee to the hub for free.

**The load-bearing part is the failure mode.** At line 122, a `progress.ts` that
exists but parses to **zero** lessons throws and fails the build:

```text
Hub: found <path> but parsed 0 lessons from its LESSONS array. The course's
curriculum format changed — fix the parser in hub/src/lib/courses.ts rather
than shipping a hub that says this course does not exist.
```

It does not fall back to `present: false`. Why that matters: `present: false`
renders the card as **"Not written yet"** (`index.astro` lines 105–113). If the
throw were a fallback, the day somebody reformats a course's `LESSONS` array is
the day the hub starts telling every visitor that a finished nine-lesson course
does not exist — with a green build, no warning, and nobody looking. "The file
moved and the regex stopped matching" and "the course does not exist" produce
identical output, and only one of them should ever ship.

That is the whole pattern: **derive the fact so it cannot go stale, and make the
derivation loud when it breaks.** A comment saying "keep this number in sync"
would have been the alternative, and it would have been wrong within a month.

Three things follow that are easy to break:

- **`WORKSPACE` is `join(process.cwd(), '..')` (line 55), not derived from
  `import.meta.url`.** Astro bundles this module before running it, so
  `import.meta.url` points at a build chunk, not at `src/lib/`. The first version
  of this file walked three levels up from the wrong place, found nothing, and
  reported every course as "not written yet" WITHOUT FAILING — the exact bug the
  throw now prevents. npm scripts run from the package root, so cwd is `hub/`.
  Run the build any other way and this breaks.
- **Presence is tested on the FILE, not the directory** (`existsSync` on
  `<dir>/src/lib/progress.ts`, line 103). A course whose `progress.ts` is moved
  or renamed reports `present: false` and renders as "not yet" — the same silent
  lie the throw exists to prevent, arriving through the one door the throw does
  not cover, because execution never reaches it. That is the remaining hole in
  this mechanism. Nothing catches it today.
- **The ids, directory names and labels come from `scripts/projects.mjs`**
  (`import { COURSES as TOPOLOGY }`, line 15; consumed at line 180). They used to
  be literals here, which made this the fifth copy of the topology after
  `deploy.yml`, the README and each course's link checker. What `projects.mjs`
  does not declare — the hub's course blurbs and the storage-key fallbacks —
  stays here, keyed by those ids (lines 150 and 168). A course added to
  `projects.mjs` and not here gets an empty blurb, which is visible on the page;
  the old duplicated list produced a silent wrong number instead.

## `lib/store.ts` is the single storage layer

Every read and write of course data on the hub goes through `src/lib/store.ts`.
No component touches `localStorage` for progress directly, and that is not
tidiness — `SeriesDashboard.tsx` used to carry its own copies of
`readCourse`/`readProfile` and they had already drifted: the local one coerced an
empty emoji to a penguin, so a learner who chose "use my initials" on the profile
page got a penguin on the hub. Two implementations of one rule diverge every
time.

- **`readProfile(courses)`** (line 92) reads every course key and returns the
  first REAL name it finds, so a learner who named themselves inside one course
  is recognised on the hub before they have ever opened the profile page.
- **`writeProfile(courses, profile)`** (line 104) writes the profile into
  **every** course's blob while preserving each one's `completed` array. That is
  the entire reason this module exists.
- **`stats(c)`** (line 120) counts only slugs the course actually has, so a
  lesson renamed since the data was written can never push a course past 100%.
- **`read` / `write`** (lines 45 and 66) wrap `localStorage` in try/catch.
  Storage can be blocked outright (private mode, embedded webviews). Progress is
  a convenience, never a prerequisite. `write` returns `false` when refused and
  callers are expected to say so out loud — `ProfileManager` does.

**The keys must stay distinct: `tmx:beginners:v1`, `tmx:intermediate:v1`,
`tmx:advanced:v1`** — line 10 of each course's `progress.ts`. All four projects
are paths on ONE origin under ONE base directory, and `localStorage` is scoped to
the **origin**, not the path. A shared key means each course overwrites the
others' `completed` array with slugs it does not recognise, silently, with no
recovery. The hub is the project most likely to tempt someone into
"consolidating" them, because it is the one place that reads all three — and
reading all three is exactly what the distinct keys make possible. `v1` is a
schema version, not a course counter.

**Consolidation is NOT finished, and the hub does not own identity.** All three
courses still ship `src/components/profile/ProfileBadge.tsx`, mounted live by
`overrides/Sidebar.astro`, and its Save button and avatar chips call that
course's own `setProfile()` (`progress.ts` line 79) — which loads and saves ONE
key. So a learner who renames themselves in a course sidebar changes that course
and no sibling. The hub is **the only editor that writes to every course**; it is
not the only editor there is. `ProfileManager.tsx` and `SeriesDashboard.tsx` both
carry that caveat in comments. Do not "simplify" either back into a past-tense
claim that the hub owns identity now — it was written that way once and it was
not true.

## Storage keys: the `tmx:` convention and its one exception

Every key this site writes is prefixed `tmx:`, and that is a **checkable claim**
rather than a style preference. `SettingsDialog.astro` reports how much the site
has stored by summing keys with that prefix (line 235:
`if (!k || !k.startsWith('tmx:')) continue;`). A key outside the convention is
invisible in that readout — and invisible storage is exactly what this site tells
people it does not do.

| Key | Written by | Notes |
| :-- | :--------- | :---- |
| `tmx:beginners:v1` / `tmx:intermediate:v1` / `tmx:advanced:v1` | `store.ts` | Per-course progress + profile. Distinct, deliberately. |
| `tmx:hero:v1` | `Hero.astro` | Which headline was shown last. |
| `tmx:motion` | `SettingsDialog.astro` | **Hub only today.** No course reads it or styles against `data-tmx-motion`. |
| `tmx:splash-seen` | `SettingsDialog.astro` | `sessionStorage`, per-course by design; the replay button clears it. |
| `starlight-theme` | `Layout.astro`, `SettingsDialog.astro` | **The one sanctioned exception.** |

`starlight-theme` is not ours to rename. Starlight owns that name, and the
courses' `ThemeSelect` overrides honour its contract: the key holds the choice
(`light | dark | auto`) and `<html data-theme>` holds the resolved value. The hub
is not Starlight but sits on the same origin, so it reads and writes the same
key — which is the whole reason a theme chosen in a course carries into the hub
and back, and why the hub does not feel like a different website. It is correctly
**excluded** from the settings readout: it is a preference about presentation, not
data about the learner. **Any further exception needs the same deliberate
decision.** The convention is what makes the privacy claim checkable.

`Layout.astro` lines 46–65 apply that key inline and synchronously **before first
paint**, setting both `data-theme` and `data-tmx-mode`. Anything later is a flash
of the wrong theme on every visit.

Note that not every preference in the settings dialog carries into a course, and
the dialog's own header comment lists which do. Do not restore a blanket
"everything here applies everywhere" claim — that sentence was there and only one
key made it true.

## The boot splash

`src/components/splash/BootSplash.astro` + `splash.css`. **The hub is the only
project that renders one** — the courses each still carry an unmounted copy of
the older component, deliberately, so a per-course splash stays a mount away.

It is a port of a standalone review harness that lives outside the repo at
`scratchpad/load-screen-idea/`, with its own `SPLASH_INTEGRATION.md` covering
the full cue sheet, public API and event contract. **Retime the sequence
there**, diff, then re-port; that file is the reviewable version.

Four things about it that are easy to break:

- **The engine binds artwork by element id and mutates nothing.** The component
  it replaced rewrote the SVG with regex at build time to inject class names.
  That is a bad bet against a hand-authored Inkscape file — attributes sit on
  their own lines, so a re-export can silently stop matching. If you re-export
  the artwork, check the `NODES` and `LINES` tables at the top of the script:
  a renamed id drops that element from the choreography **without throwing**, so
  a clean console is not proof. Watch for a chip that never mounts.
- **CSS owns HOW, the script owns WHEN.** Every `animation-delay` is supplied by
  the engine as `--tx-d`, pre-divided by the speed multiplier. Adding a delay in
  `splash.css` desynchronises the two clocks.
- **The artwork brings ~160 element ids into the document.** `#title`,
  `#background`, `#panel`, `#dots`, `#prompt` and `#metadata` are the plausible
  collisions. None collides with the hub today — verified — but check before
  adding markup with generic ids.
- **`prefers-reduced-data` is handled in `hub.css`, not in `splash.css`.** The
  component covers reduced motion (a static path on a 2.2x-compressed clock, so
  those visitors are not held on a still image) and short viewports; data-saver
  is the one case left to the host, and it hides the splash outright.

The artwork of record is `global-assets/termux_linux_elements.svg`, imported
`?raw`. The superseded first drawing is retired to `scratchpad/retired-artwork/`.

## Design system: Fire Watch v6

`src/styles/hub.css` (1,573 lines) imports `src/styles/_tokens.css` (273 lines).
The same rules as the courses apply:

- **Tokens only.** Never a raw hex or rgba in a component or a rule.
- **Brass is the only accent.** `--color-brand` is `#d4b15c` dark
  (`_tokens.css` line 145) and `#886713` light (line 227). **`#8b6914` is NOT
  the brand colour** — that value is live as `--color-warning` in the light block
  (line 216). The light brand was stepped down *from* `#8b6914` because it
  measured 4.48:1 on the parchment canvas and AA is 4.5:1; the reasoning sits
  above the declaration. The two are one hex digit apart and confusing them
  reintroduces a contrast failure.
- **Terminal tokens are dark-locked** (`--tmx-screen`, `--tmx-screen-ink`,
  `--tmx-screen-muted`, `--tmx-screen-brand`) — byte-identical in both theme
  blocks. The hub renders no terminal, but they are consumed by shared chrome;
  keep them locked.
- **Token names state the role, not a guess.** `--font-ui` resolves to Inter, the
  chrome face; the face that sets body prose is `--font-detail` (Source Serif 4).

### How `_tokens.css` relates to the courses

The file header says this too; this is the summary, and it is not what the header
used to claim.

- It is a **hand-maintained copy** of the courses' tokens, one-way. Values are
  identical to `termux-tutorial-for-beginners/src/styles/global.css`, and all
  three courses declare the same 146 token names, so the beginner course is not
  special — it is just the one this was taken from. **Change a value in a course
  and change it here**, or the hub and the courses drift into two slightly
  different products.
- It is a **subset**: 78 custom properties here against 146 in `global.css`. The
  68 left behind are 52 Starlight `--sl-*` bridge vars, 8 Expressive Code
  `--ec-*` vars and 8 course-only helpers. None of them has anything to bridge in
  a project with no Starlight; only `--sl-font` and `--sl-font-mono` came over.
- **"Re-extract" is not an operation.** No script does it, and a whole-file copy
  would import 68 names that resolve to nothing here. Adding a token is a
  deliberate edit: copy the course's declaration exactly.
- **NO ALIASES.** `hub.css` once referenced `--bg-raised`, `--font-display` and
  `--leading-relaxed`, none of which is declared anywhere in this repo — 14
  `var()` lookups resolving to nothing, so those elements silently fell back to
  inherited or initial values. The fix was to point `hub.css` at the tokens that
  already exist (`--bg-elevated`, `--font-heading`, `--leading-prose`), not to
  declare three more names for the same three facts. The note above
  `--font-heading` in `_tokens.css` is the standing rule. A genuinely hub-only
  token goes in a clearly marked block, never as an alias.

One behaviour worth knowing: the dark block is `:root, :root[data-theme='dark']`
(`_tokens.css` lines 110–111) and light is opt-in via `:root[data-theme='light']`
(line 193). `Layout.astro`'s pre-paint script always sets `data-theme`, so this
never shows in practice — but with JavaScript disabled the hub renders **dark
regardless of `prefers-color-scheme`**.

## Stack

- **Astro 7** (`^7.0.2`), static output, `base` `/termux-tutorial`,
  `trailingSlash: 'ignore'`, and `build.format: 'directory'` — the last one
  deliberately matching the courses so a link to `/beginner/` resolves the same
  way whether it was written here or there.
- **React 19** (`^19.2.7`) via `@astrojs/react` (`^6.0.1`). Two islands, both
  `client:only="react"`: `SeriesDashboard` on index, `ProfileManager` on profile.
  Both are client-only for the same reason — this data lives in the visitor's
  browser and nowhere else, so there is nothing meaningful to prerender, and a
  server-rendered "Guest" or "0%" flipping on hydration is a worse first frame
  than a one-line skeleton.
- **No CSS framework and no `@layer`.** Plain CSS, tokens in `_tokens.css`.
- `vite.build.assetsInlineLimit: 0` — one page and one island; a chunk-splitting
  strategy would produce more requests than it saves.
- `vite.server.hmr.path` is `/@hmr/hub`, which **must** match `hmrPathOf()` in
  `scripts/projects.mjs`. Vite's default is `/`, so four dev servers behind one
  proxy would all tell the browser to open the same socket URL and three would be
  rejected — the hub hot-reloads and the courses silently stop, with one line in
  the browser console and nothing in the terminal. Root `npm run check:hmr`
  verifies the two agree, and root `npm run dev` runs it first.

## Architecture

```text
astro.config.mjs        site/base, react(), the unique HMR path, and the
                        SITE_URL / TITLE / DESCRIPTION exports
src/pages/index.astro   the front door: mark, hero, dashboard, three course
                        cards, the privacy note, the footer
src/pages/profile.astro name + avatar, per-course progress, export/import, reset
src/layouts/Layout.astro  <head>, canonical + og tags, the pre-paint theme script
src/components/
  Hero.astro            ten rotating headlines over one fixed promise
  PromptMark.astro      the `>_` mark — ONE copy, used by both pages
  SeriesDashboard.tsx   cross-course progress (client:only)
  ProfileManager.tsx    identity, progress, backup, reset (client:only)
  SettingsDialog.astro  native <dialog>: theme, motion, storage readout
src/lib/courses.ts      parses each course's progress.ts FROM DISK at build time
src/lib/store.ts        the localStorage layer for all three course keys
src/lib/hero.ts         hero copy — one array, server fallback + client rotation
src/styles/hub.css      the hub's own CSS
src/styles/_tokens.css  Fire Watch tokens, copied from the courses
src/assets/             the two Scatter Field SVGs (--tmx-bg-image, per theme)
public/favicon.svg, public/og-default.png
```

There is no server, no API and no database. Nothing on this site is sent
anywhere; the index page says so to the learner in prose.

## Gotchas

### 1. `PromptMark.astro` exists so the mark cannot drift

The `>_` beside the wordmark was inline in **both** pages — byte-identical SVG
path data, with the explanation of why it is geometry and not `&gt;_` text
written on the `index.astro` copy only. The profile copy read as unexplained
magic numbers, and any change to the geometry had to be made twice with nothing
to catch you if you made it once. It is one component now, used by both. Do not
inline it again, and do not give it a `<style>` block: its classes
(`.hub__mark-icon`, `.hub__mark-chevron`, `.hub__mark-caret`) are global rules in
`hub.css`, and scoping them would silently detach the hover, the caret blink and
the `[data-tmx-motion='reduce']` opt-out.

### 2. Everything the hub links to is in another project

The course cards, the reference links and the "continue" links all point into
`_site/beginner|intermediate|advanced/`. In this project's own `dist/` none of
those exist. That is normal and is why the assembled link check is the only
verification that means anything here. It is also why `npm run dev` at the root
is the only dev configuration in which the hub is actually usable.

### 3. `tick` in `ProfileManager` looks unused and is not

`void tick;` (`ProfileManager.tsx`) is there because the stats must recompute
after a write. Removing it because a linter called it unused breaks the refresh.

### 4. `storage` fires only for OTHER documents

Both islands subscribe to the `storage` event, which by specification does not
fire in the document that performed the write. That is the case that matters —
a course open in another tab. `store.ts` also dispatches a
`tmx:progress-changed` CustomEvent on every write (line 80); **nothing in the hub
listens for it today**, because the two islands live on different pages. It is
kept because it costs nothing and is the hook a second island on one page would
need. If you add one, subscribe to it — do not assume `storage` will tell you
about your own write.

## Known issues — verified, unfixed

### The hub ships no fonts, so it does not render in the courses' faces

Verified: there is **no `@font-face` rule, no font preload, no `public/fonts/`
directory and no Fontsource dependency anywhere in this project**
(`public/` contains only `favicon.svg` and `og-default.png`). The courses declare
eight latin woff2 faces via the `FONT_FACES` array in their own
`astro.config.mjs`. `@font-face` is registered per document, so a font file
already cached from a course page cannot be used by a hub page that never
declares the family.

The practical effect is that every `--font-*` token here falls through to its
fallback stack: `--font-heading` and `--font-detail` both land on **Georgia**
rather than Crimson Pro and Source Serif 4, and `--font-ui` lands on the system
UI face rather than Inter. The tokens name the variable families first, and
`hub.css` sets `body { font-family: var(--font-detail) }`, so the intent is
clearly the courses' typography.

**Whether this is deliberate is UNVERIFIED** — nothing in this project, the root
README or the deploy workflow documents it either way, and the stated purpose of
`_tokens.css` is that the hub and the courses are "provably one product". Treat
it as an open question, not as a settled decision, and resolve it deliberately
rather than as a drive-by.

### The footer credits Starlight on a page that does not use it

Both pages' footers read "Built with Astro + Starlight. BSD 3-Clause."
(`index.astro` line 131, `profile.astro` line 44). It is defensible as a credit
for the assembled *site*, three quarters of which is Starlight, and it is
learner-facing copy — so it has been left alone rather than changed on an
agent's judgement. Flagged here so the next reader knows it was noticed, not
missed.

## Do not undo

- **The three `localStorage` keys must stay distinct.** Full reasoning above.
  Of everything on this page, this is the one a well-meaning cleanup pass is most
  likely to "consolidate" — and the hub, which reads all three, is where that
  temptation lives. The damage is invisible until a learner loses a course.
- **`starlight-theme` must stay shared and must keep Starlight's contract.** The
  rule is not "never share storage", it is "never share *progress*".
- **The zero-lesson throw in `courses.ts` is not a bug to soften.** Turning it
  back into a `present: false` fallback restores exactly the failure it was
  written to prevent.
- **`courses.ts` must keep deriving from `scripts/projects.mjs` and from the
  courses' `progress.ts` on disk.** Hardcoding the lesson counts, ids or
  directory names back into this file recreates the fifth copy of the topology.
- **This project has no deploy workflow and must not get one.** Pages publishes
  one artifact per repository; the root workflow assembles all four.
- **`PromptMark.astro` stays one component**, without a scoped `<style>` block.
- **`WORKSPACE = join(process.cwd(), '..')`.** Not `import.meta.url`. It has
  already failed silently once that way.

## Housekeeping

- Tab indentation in CSS/TS. Comments explain *why*, citing the before/after.
- `tsconfig.json` extends `astro/tsconfigs/strict` and adds only the React JSX
  options. `allowJs` comes from `astro/tsconfigs/base`, which is what lets
  `courses.ts` import `scripts/projects.mjs` and pick up its JSDoc types.
- `npm run check` is currently green: **0 errors, 0 warnings, 0 hints over 13
  files.** CI runs it before the build, so a type error here fails the pipeline
  for the whole monorepo.
- Licence: **BSD-3-Clause** — `package.json` line 6, and the full text in
  `hub/LICENSE`. Same as the root and all three courses.

## Astro reference

Full documentation: <https://docs.astro.build>

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components (React islands)](https://docs.astro.build/en/guides/framework-components/)
- [Configuring `base`](https://docs.astro.build/en/reference/configuration-reference/#base)
