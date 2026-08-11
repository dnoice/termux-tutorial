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
| **Intermediate** | `termux-tutorial-intermediate/` | `/termux-tutorial/intermediate/` | 8 lessons — audited, fixes in progress |
| **Advanced** | `termux-tutorial-advanced/` | `/termux-tutorial/advanced/` | Not started |

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
_site/advanced/        <- course 3, when it exists
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

## Working on a course

`npm` commands run **inside a course directory**, never at this root:

```bash
cd termux-tutorial-for-beginners
npm install
npm run dev      # http://localhost:4321/termux-tutorial/beginner/
npm run build    # curriculum guard + astro build + link check
npm run check    # typecheck (astro build does NOT typecheck)
```

Read that course's `CLAUDE.md` first. Both are long and both are load-bearing —
they record the decisions that are expensive to undo by accident.

Adding a lesson means registering its slug in three places — `src/lib/progress.ts`,
the `sidebar` array in `astro.config.mjs`, and the `<LessonComplete slug="…">` in
the lesson. `scripts/check-curriculum.mjs` fails the build if they disagree.

## Previewing the whole series

A dev server serves **one** project at **one** base. The series switcher and
every cross-course link are absolute paths that only line up once all four
projects sit in one tree — so those links 404 on a dev server while being
perfectly correct in production. Verify them by assembling, the way Pages does:

```bash
# From this root, after `npm run build` in each of the four projects
rm -rf _site && cp -r hub/dist _site
for p in beginner:termux-tutorial-for-beginners \
         intermediate:termux-tutorial-intermediate \
         advanced:termux-tutorial-advanced; do
  mkdir -p "_site/${p%%:*}" && cp -r "${p##*:}/dist/." "_site/${p%%:*}/"
done

node scripts/check-assembled-links.mjs _site   # the only check that sees across courses
PORT=4400 node scripts/preview.mjs _site       # click the switcher for real
```

`check-assembled-links.mjs` is the guard that **cannot** live in a course. Each
course's own `check-links.mjs` walks its own `dist/` and is blind to its
siblings, so it defers cross-course links; this resolves them. It runs in
`deploy.yml` too, but running it locally is the point — a broken cross-course
link should not be something you discover from a failed deploy.

## Before deploying

- [ ] **Settings → Pages → Source = GitHub Actions**, not "Deploy from a branch".
      The branch method runs Jekyll, which ignores `_astro/` for starting with an
      underscore — the site would lose all its CSS and JS.
- [ ] **The repo must be public**, or the account needs GitHub Pro. Pages does
      not publish from a private repository on the free plan.

## Two things that will bite

**Storage keys are deliberately not shared.** Every course is a path on one
origin, and `localStorage` is scoped to the origin, not the path. Beginner uses
`tmx:beginners:v1`, intermediate `tmx:intermediate:v1`. A well-meaning
consolidation would make each course silently overwrite the other's progress and
profile. `starlight-theme` is correctly shared — the rule is never share
*progress*, not never share storage.

**A course's link checker cannot see its siblings.** Cross-course links resolve
only in the assembled site, so `scripts/check-links.mjs` carries an explicit
`SIBLING_COURSES` allowlist. Add a course when it starts being assembled and not
before: an entry for an undeployed course turns a real 404 into a silent pass.

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
