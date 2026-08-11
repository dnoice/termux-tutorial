# AGENTS.md

Start here, then read [CLAUDE.md](CLAUDE.md) before you edit anything.

This is **Termux: Advanced**, course three of three. It was created by copying
the intermediate course's shell, which is why a few things in it look like
leftovers — some of which are decisions, and some of which are genuinely
half-finished ports. The list below tells you which is which.

## Where the knowledge lives

- **[CLAUDE.md](CLAUDE.md)** — the whole project brief: stack, architecture,
  design-token rules, the known issues, and the gotchas that cost an afternoon.
  It is the single copy on purpose; this file is a pointer so the two cannot
  drift apart.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — contributor workflow: adding a
  lesson, linking between pages and across courses, PR expectations.
- **[README.md](README.md)** — what the site is, the npm scripts, the two
  build-time guards, and how the series deploys.

## Read this one first

**The `localStorage` key is `tmx:advanced:v1`, and it is deliberately different
from `tmx:beginners:v1` and `tmx:intermediate:v1`.**

All three courses are paths under **one origin and one base directory**
(`dnoice.github.io/termux-tutorial/{beginner,intermediate,advanced}/`), and
`localStorage` is scoped to the origin, not the path. Unify the keys and the
three courses overwrite each other's completed lessons and profile — silently,
with no error and no recovery. The export format is separated for the same
reason (`termux-advanced-progress` vs the siblings' kinds).

Because the courses now share an origin *and* a base directory, this is more
dangerous here than it was in course two, and a monorepo-wide "deduplicate the
store" pass is exactly the change that breaks it.

`starlight-theme` is the one key that is correctly shared. The rule is not
"never share storage", it is "never share *progress*". → CLAUDE.md, first
section.

## The state of the gates

Verified 2026-08-11:

- **`npm run build` passes.** Curriculum guard green (9 lessons), 14 HTML pages
  built, link checker green — 0 broken links, 0 missing base prefixes.
- **`npm run check` fails: 3 errors, 0 warnings, 0 hints over 20 files.** CI
  runs it as a gate before the build, so the monorepo pipeline is red until they
  are fixed. All three are one-line fixes in files that are not documentation:
  1. `src/lib/progress.ts:152` — the `ProgressExport` interface still declares
     `kind: 'termux-intermediate-progress'` while `EXPORT_KIND` (line 159) is
     `'termux-advanced-progress'`. Two errors, ts(2322) and ts(2367), from one
     stale literal type.
  2. `src/lib/progress.ts:209` — same port, no compiler error: the import
     rejection message still names "Termux: **Intermediate** progress file".
  3. `src/components/overrides/SiteTitle.astro:47` — a `c.unbuilt` branch no
     `COURSES` entry declares, ts(2339). Permanently falsy; delete the ternary.

→ CLAUDE.md, Known issues, which has the exact text of each error.

Do not route around the guards. Fix the drift.

## The five that bite hardest

Each is written out in CLAUDE.md; this is the index so you know to go look.

1. **The progress key must stay course-specific.** See above. The single easiest
   thing in this repo to break by "consolidating".
2. **`base` is `/termux-tutorial/advanced`, and this course has NO deploy
   workflow.** There is no `.github/` directory here, deliberately. All three
   courses plus the hub are one repository deploying one Pages site, assembled
   by `.github/workflows/deploy.yml` at the **monorepo root**. Pages publishes
   one artifact per repository; a workflow here would fight the real one.
   → "This is one repo, one site".
3. **There is deliberately no practice terminal anywhere in this course.** The
   simulator cannot install a rootfs, cannot open an X11 socket and cannot reach
   a GPU — which is the entire subject matter. A terminal here would answer the
   lesson's own instructions with a lie. `index.mdx` says so to the learner in
   prose; five lesson files carry the comment. → "No practice terminal anywhere".
4. **The CSS is deliberately UNLAYERED.** Starlight ships its styles inside
   `@layer starlight.*`, and unlayered rules outrank every layered one — that is
   the only reason `src/styles/global.css` can restyle Starlight at all. Putting
   this file into an `@layer` ranks it *below* Starlight and breaks the theme.
   Tailwind was removed for the same reason it was useless. → "Do not undo".
5. **The YAML colon-space trap has taken this build down twice.** An unquoted
   frontmatter value containing `": "` is parsed as a nested mapping, and the
   error never mentions the colon. Five values in this course are quoted
   *because of it* — `index.mdx`'s title and four descriptions. On a course full
   of `DISPLAY: :0` and `Error: Can't open display:`, assume you will hit it.
   → gotcha #1.

## Three things that look like bugs and are decisions

- **`shell.ts`, `TermuxTerminal.tsx`, `LiveSandbox.tsx`,
  `PracticeSection.astro` and `BootSplash.astro` are all on disk and all
  unused.** They came across with the port. Deleting them is a bigger and
  riskier diff than leaving them; adding them back to a page is the actual
  mistake. → gotcha under "No practice terminal".
- **The xterm SSR alias, `ssr.noExternal` and the `manualChunks` xterm split are
  inert.** Nothing imports xterm, so the build emits no xterm chunk and none of
  it fires. Leave them: they become load-bearing again the moment a terminal
  returns, and deleting them buys nothing.
- **`public/coi-serviceworker.js` ships but is never registered.** Its loader
  tests `location.pathname` against `SANDBOX_PATH`, which is still the
  course-two slug `automation/shell-scripts/` — a page that does not exist here.
  Harmless, but it will mislead the next reader, so it is listed under Known
  issues rather than left as folklore.

## Before you touch anything

- Run npm from **this directory** (the one holding `package.json`), never from
  the `termux-tutorials/` parent workspace.
- **Git lives at the monorepo root, one level up.** This directory is not its
  own repository. The baseline for this course is
  `20d3884 Scaffold the advanced course: PRoot, X11, GPU, builds`. Commit a
  clean baseline before launching a multi-agent workflow.
- Two gates must go green: `npm run check` (currently 3 errors — see above) and
  `npm run build` (currently passing). When a guard fails, read the error and
  fix the drift; both print the exact slug or URL at fault.
- Courses one and two are assumed knowledge, not material to repeat. `pkg`,
  `~/storage`, fish, sessions, the extra-keys row, scripts, `termux-api` and
  schedulers all get referenced, never re-explained.
- This is the course where a mistake costs the reader something real — gigabytes
  of disk, a hot phone, an hour of a failed build. Say so where it is true.

## Never hardlink these files

The beginner course's `AGENTS.md` and `CLAUDE.md` were once **hardlinked** — one
inode, two names — so writing either silently rewrote the other, and both sat at
identical boilerplate through edits that all appeared to succeed.

This repo was seeded by **copying**, which is correct. Keep it that way: if you
ever need to seed one doc from another, or seed a fourth course from this repo,
**copy it; never link it.** (`ls -li` is how you confirm two names are two
inodes.)
