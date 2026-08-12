# Termux Tutorial

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

> Android runs Linux underneath — Termux is the terminal it never shipped with.

A three-part, hands-on course for [Termux](https://termux.dev), built with
[Astro Starlight](https://starlight.astro.build), pairing plain-English lessons
with a **live, in-browser terminal** so learners practise every command before
touching a device.

All three courses live in **this one repository** and deploy as **one GitHub
Pages site**.

| Piece | Directory | Published at | Status |
| :--- | :--- | :--- | :--- |
| **Hub** | `hub/` | `/termux-tutorial/` | The front door + cross-course dashboard |
| **Beginner** | `termux-tutorial-for-beginners/` | `/termux-tutorial/beginner/` | 11 lessons — audited, complete |
| **Intermediate** | `termux-tutorial-intermediate/` | `/termux-tutorial/intermediate/` | 8 lessons — audited, complete |
| **Advanced** | `termux-tutorial-advanced/` | `/termux-tutorial/advanced/` | 9 lessons — complete, technically reviewed |

Shared documentation — audits, walkthroughs, curriculum strategy — lives in
[`global-docs/`](global-docs/README.md). Each course has its own `README.md`,
`CLAUDE.md` and `CONTRIBUTING.md` with the detail for that course.

## Why one repo

GitHub Pages publishes exactly one artifact per repository. Three repos meant
three sites, three base paths, and cross-links that could rot independently —
and they already had: a misspelled sibling repo name survived three separate
audits, because nobody could confirm which spelling was real. The answer turned
out to be that the sibling repos should not exist.

One repo, one site. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds each course separately — with its own guards and typecheck — then
assembles them:

```text
_site/                 <- the hub (the front door)
_site/beginner/        <- course 1
_site/intermediate/    <- course 2
_site/advanced/        <- course 3
```

The hub reads each course's `LESSONS` array **from disk at build time** for its
dashboard totals, and fails the build if a course is present but unparseable —
so it can never quietly ship claiming a finished course does not exist.

Each course keeps its own `package.json`, dependencies, build guards and `base`.
They are independent projects that happen to ship together.

## Features

- 🐟 **Fish-style practice terminal** — a deterministic, offline Termux simulator
  with grey autosuggestions and live command highlighting, on
  [xterm.js](https://xtermjs.org). It runs no real code: `shell.ts` is a
  hand-written interpreter over an in-memory filesystem.
- 📱 **Built for a phone.** A touch key row supplies `ESC TAB ↑ ↓ ← → / - ~` and a
  sticky `CTRL`, because Gboard has none of them — without it every feature the
  courses teach is unreachable on the device they are about.
- 🐧 **Live Linux sandbox** — an optional real Debian VM in the browser via
  [WebVM](https://webvm.io)/CheerpX, on one lesson per course, booting only on
  click.
- 📊 **Local progress** — per-browser profile and lesson completion in
  `localStorage`. No accounts, no server. The learner's chosen name even becomes
  the shell prompt.
- 🎨 **Fire Watch v6 design system** — Parchment Dossier (light) and Sentinel
  Obsidian (dark), brass gold as the single accent. Plain CSS with tokens; no
  framework.

## Running it — one command, one URL

Everything runs **from this root**. There is one address to remember, and it is
the same path GitHub Pages serves:

```bash
npm run install:all     # once — installs all four projects
npm run dev             # → http://localhost:4321/termux-tutorial/
```

That starts all four dev servers on internal ports and puts a reverse proxy in
front of them, routing by the same path prefixes production uses. **The URL in
your address bar is character-for-character the production URL**, the series
switcher works, cross-course links resolve, and live reload is proxied so edits
in any of the four projects still hot-reload. Ctrl-C stops all four.

| From the root | What it does |
| :------------ | :----------- |
| `npm run dev` | All four dev servers behind one URL. **This is the normal one.** |
| `npm run build` | Builds all four, assembles `_site/`, verifies every cross-course link |
| `npm run preview` | Serves the built `_site/` at the same URL — what Pages will actually serve |
| `npm run check` | Typechecks all four (`astro build` does **not** typecheck) |
| `npm run check:links` | Cross-course link check alone, against an existing `_site/` |
| `npm run check:hmr` | Each project's HMR path matches what the proxy routes |
| `npm run install:all` | `npm install` in all four |

**Live reload needed one non-obvious thing.** Vite builds its HMR WebSocket URL
from `server.hmr.path`, not from the page's base — and the default is `/`, so
all four dev servers would tell the browser to open `ws://localhost:4321/`. Four
identical URLs cannot be routed, and Vite stamps a per-server token on the
handshake, so the three that reached the wrong server would be *rejected*. The
symptom is the nasty kind: the hub hot-reloads, the three courses silently stop,
and nothing appears in any terminal. Each project therefore declares a unique
`vite.server.hmr.path` (`/@hmr/<id>`), and `npm run check:hmr` — which also runs
in CI — fails if a config and the manifest ever disagree.

The four-project layout is **declared** in [`scripts/projects.mjs`](scripts/projects.mjs).
The dev proxy, the assembler, the cross-course link checker and the HMR guard
all read it, so adding a course is one entry there *for those tools*.

**Two places still hold the layout by hand and must be updated with it:**
`.github/workflows/deploy.yml` (its cache-dependency paths and its per-project
install/typecheck/build steps) and `hub/src/lib/courses.ts` (which enumerates
the course ids it renders). Nothing fails if you update the manifest and forget
those — which is exactly the drift shape this repo keeps producing, and why this
paragraph no longer claims the manifest is the only copy. Making CI derive its
matrix from `projects.mjs` is the obvious fix and has not been done.

### Assets — one directory for the whole ecosystem

**`global-assets/` is the assets directory.** Every project reads from it; none
of them keeps its own copy of shared artwork.

```text
global-assets/
  linux_scatter_field_v3.svg        the page background, dark
  linux_scatter_field_v3_light.svg  and light
  termux_linux_elements.svg         inlined by BootSplash at build time
  favicon.svg
  fonts/                            the eight latin woff2 faces
```

Most of it needs no copying at all. A stylesheet writes
`url('../../../global-assets/linux_scatter_field_v3.svg')` and an import writes
`'../../../../global-assets/termux_linux_elements.svg?raw'`; Vite resolves
across the project boundary, hashes the file into that project's `_astro/`, and
rewrites the reference. One file on disk, four projects using it.

Two kinds of asset cannot work that way, so they are **generated copies**:

| Asset | Why it must be copied |
| :--- | :--- |
| `public/favicon.svg` | `public/` is copied verbatim into the output and cannot be aliased or resolved through Vite |
| `public/fonts/*.woff2` | `@font-face` needs a literal, un-hashed URL — and faces are registered *per document*, so a face cached from a course page is unusable on a hub page that never declares it |

```bash
npm run assets:sync      # fan global-assets/ out into every project
npm run assets:check     # verify without writing; exits 1 on drift
npm run assets:sync -- --refresh   # re-pull the fonts from @fontsource-variable first
```

**Not synced, deliberately:** `og-default.png` / `og-default.svg` are per-project.
The social card carries the course's own name, so those four copies genuinely
differ and unifying them would be wrong.

### `scratchpad/` is never committed

`scratchpad/` is the author's own working area for media: artwork that was made
and then set aside, variant explorations kept in case one is wanted later,
superseded revisions, working bundles, screenshots. It is git-ignored and it
**stays** git-ignored — nothing in it is part of the site, and nothing in it
should ever be committed.

The line between the two directories is simply whether the frontend serves it:

| | |
| :--- | :--- |
| `global-assets/` | Everything the site actually uses. Edit here; `assets:sync` fans it out. |
| `scratchpad/` | Everything else the author has made. Git-ignored, on disk only. |

Roughly 9 MB moved from the repository into `scratchpad/` before the repo went
public, including the retired backgrounds and the first boot-splash drawing.

**Removing them from the tree did not remove them from history.** The working
tree is ~7 MB, but a `git clone` still pulls those blobs — the pack is about
10 MB. That is a one-time download and nothing about the published site is
affected. Shrinking it would mean rewriting history, which invalidates every
existing clone and every commit SHA, so it is deliberately not done.

### Working inside one course

You can still drive a single project directly, and the per-course guards are
where the detail lives:

```bash
cd termux-tutorial-for-beginners
npm run build    # curriculum guard + astro build + link check
npm run check    # typecheck
```

Read that course's `CLAUDE.md` first. They are long and load-bearing — they
record the decisions that are expensive to undo by accident.

Adding a lesson means registering its slug in three places — `src/lib/progress.ts`,
the `sidebar` array in `astro.config.mjs`, and the `<LessonComplete slug="…">` in
the lesson. `scripts/check-curriculum.mjs` fails the build if they disagree.

One thing a single course **cannot** check: links into its siblings. Each
course's `check-links.mjs` walks its own `dist/` and is blind across the
boundary, so it *defers* those links; `scripts/check-assembled-links.mjs`
resolves them against the assembled tree. That guard cannot live inside a
course, and it is why a broken cross-course link should never be something you
discover from a failed deploy.

## Before deploying

- [x] **The repository is public** (2026-08-12). Pages does not publish from a
      private repo on the free plan, and going public was chosen over Pro.
- [ ] **Settings → Pages → Source = GitHub Actions**, not "Deploy from a branch".
      The branch method runs Jekyll, which ignores `_astro/` for starting with an
      underscore — the site would lose all its CSS and JS.

These are two independent blockers and they fail in different places. With Pages
never enabled, `actions/configure-pages` fails inside the **build** job with
"Get Pages site failed" — before the deploy job starts at all, which is why a
green build log can still end in a red run.

**Pre-public check, run 2026-08-11 — clean.** Going public exposes every commit,
not just the current tree, so this was checked across the whole history: no
tracked `.env`/key/credential files, no secret-shaped strings in any commit, no
absolute local paths, and nothing ignored-but-tracked. The only email in tracked
content is `lewing@isc.tamu.edu` — Larry Ewing, who drew Tux — which is
attribution, not a leak. It was clean, and the repo went public on 2026-08-12.

## Two things that will bite

**Storage keys are deliberately not shared.** Every project is a path under one
origin *and one base directory*, and `localStorage` is scoped to the origin, not
the path. Beginner uses `tmx:beginners:v1`, intermediate `tmx:intermediate:v1`,
advanced `tmx:advanced:v1`; the hub reads all three and writes the shared profile
back into each. A well-meaning
consolidation would make each course silently overwrite the other's progress and
profile. `starlight-theme` is correctly shared — the rule is never share
*progress*, not never share storage.

**A course's link checker cannot see its siblings.** Cross-course links resolve
only in the assembled site, so each course's `scripts/check-links.mjs`
recognises them and **defers** them: `COURSE_SEGMENTS` lists the assembled
courses explicitly (so a typo in the segment is still caught) and
`SIBLING_PREFIXES` is derived from it. Add a course when it starts being
assembled and not before: an entry for an undeployed course turns a real 404
into a silent pass.

Deferred is not skipped. `scripts/check-assembled-links.mjs` resolves those
links against the assembled tree — the only place all four projects exist at
once — and it runs both in CI and from `npm run build` at this root.

## What this site knows about you

Nothing, with one disclosed exception.

- No accounts, no analytics, no cookies, no tracking, no backend. Static files.
- Your profile name, avatar and progress are written to `localStorage` and never
  transmitted.
- Fonts (four Fontsource variable families, latin subsets) and icons (Font
  Awesome 6 via Iconify, inlined at build) are **self-hosted**, so ordinary
  browsing makes no third-party requests.
- **The exception:** pressing **Boot Linux** in the optional sandbox loads the
  CheerpX runtime from `cxrtnc.leaningtech.com` and streams a Debian image from
  `wss://disks.webvm.io`, exposing your IP and referrer to Leaning Technologies.
  User-initiated, one lesson per course, never without a click.

## The CDN exception

The no-CDN stance is real but not absolute, and the difference matters:

| Runtime dependency | Where it comes from |
| :--- | :--- |
| Fonts, icons, xterm.js, React, Starlight | bundled at build, served from our own origin |
| CheerpX runtime + Debian image (sandbox only) | `cxrtnc.leaningtech.com`, `disks.webvm.io`, at click time |

A multi-gigabyte disk image cannot be self-hosted on Pages. It is acceptable
because the feature is optional, confined to one lesson, user-initiated, and
degrades to a clear error pointing back at the offline simulator — nothing the
courses teach depends on it.

- **Availability.** `CHEERPX_VERSION` is pinned in `LiveSandbox.tsx`. If Leaning
  Technologies retires it the sandbox stops booting. Keep it pinned anyway — a
  floating `latest` trades a predictable break for an unpredictable one.
- **Licensing.** CheerpX is free for non-commercial and educational use, which is
  what this is. Review the [CheerpX licence](https://cheerpx.io) before reusing
  this code commercially. The offline simulator — the actual teaching surface —
  carries no such restriction.

## History

Each course was developed in its own git repository before the monorepo. Those
histories are preserved and readable:

```bash
git --git-dir=_pre-monorepo-history/termux-tutorial-for-beginners.git log --oneline
```

## Contributing

See each course's `CONTRIBUTING.md`. Corrections, new lessons and better
explanations are all welcome.

## Licence

[BSD 3-Clause License](LICENSE) © dnoice
