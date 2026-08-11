# AGENTS.md

Start here, then read [CLAUDE.md](CLAUDE.md) before you edit anything.

This is **Termux: Intermediate**, course two of three. It was created by porting
the beginner course's shell, which is why a few things in it look like leftovers
and are not — read the list below before you tidy any of them away.

## Where the knowledge lives

- **[CLAUDE.md](CLAUDE.md)** — the whole project brief: stack, architecture,
  design-token rules, the known issues, and the gotchas that cost an afternoon.
  It is the single copy on purpose; this file is a pointer so the two cannot
  drift apart.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — contributor workflow: adding a
  lesson, linking between pages, the interactive components, PR expectations.
- **[README.md](README.md)** — what the site is, the npm scripts, the two
  build-time guards, and how it deploys.

## Read this one first

**The `localStorage` key is `tmx:intermediate:v1`, and it is deliberately
different from the beginner course's `tmx:beginners:v1`.**

Both courses are paths on **one origin** (`dnoice.github.io`), and
`localStorage` is scoped to the origin, not the path. Unify the keys and the two
courses overwrite each other's completed lessons and profile — silently, with no
error and no recovery. The export format is separated for the same reason
(`termux-intermediate-progress` vs `termux-beginners-progress`).

`starlight-theme` is the one key that is correctly shared. The rule is not
"never share storage", it is "never share *progress*". → CLAUDE.md, first
section.

## The state of the build

`npm run build` currently **fails**, in the link checker only, because
`scripts/check-links.mjs` still carries the beginner course's
`const BASE = '/termux-tutorial'` instead of
`/termux-tutorial-intermediate`. Every correctly-prefixed link is therefore
reported as unprefixed (323 of them). The curriculum guard passes, `astro build`
succeeds, and `npm run check` is 0/0/0. → CLAUDE.md, Known issues, which has the
verified one-line fix.

Do not route around the checker. Fix the constant.

## The five that bite hardest

Each is written out in CLAUDE.md; this is the index so you know to go look.

1. **The progress key must stay course-specific.** See above. The single easiest
   thing in this repo to break by "consolidating".
2. **The CSS is deliberately UNLAYERED.** Starlight ships its styles inside
   `@layer starlight.*`, and unlayered rules outrank every layered one — that is
   the only reason `src/styles/global.css` can restyle Starlight at all. Putting
   this file into an `@layer` ranks it *below* Starlight and breaks the theme.
   Tailwind was removed for the same reason it was useless. → "Do not undo".
3. **The xterm UMD/SSR alias in `astro.config.mjs` is load-bearing.**
   `@xterm/xterm@6` has no `exports` map and its `main` is UMD, so SSR resolves
   the wrong build and `import { Terminal }` has no named export — even though
   both terminals are `client:only`. `ssr.noExternal` plus the `resolve.alias`
   keep the build green. → gotcha #3.
4. **The terminal's screen tokens are dark-locked in both themes.** Anything
   drawn on `--tmx-screen` must use `--tmx-screen-muted` / `--tmx-screen-brand`;
   the theme-following `--fg-*` tokens fail AA on that panel in light mode. The
   same colours are duplicated as literal hexes in xterm's `theme` option and in
   the two Expressive Code themes — move all three together. → design rules.
5. **The `sidebar` array in `astro.config.mjs` *is* the curriculum**, and the
   base-path plugin has two blind spots (raw `<a href>` in MDX, frontmatter
   links). Both failures are a 200 in dev and a 404 on Pages. The two build
   guards exist for exactly these. → gotchas #1 and #2.

## Two things that look like bugs and are decisions

- **There is no practice terminal on the lessons.** `shell.ts` was ported from
  course one and knows none of this course's commands — no
  `termux-battery-status`, no `termux-notification`, no `crontab`. A terminal on
  those pages would answer `command not found` to the lesson's own
  instructions. The affected lessons carry comments saying so. Fix it by
  teaching the simulator, never by adding a terminal that lies. → gotcha #8.
- **`PracticeSection.astro` is unused.** Same cause. It is intact and will be
  wanted the moment a lesson gets a terminal.

## Before you touch anything

- Run npm from the repo root (the directory holding `package.json`), never from
  the `termux-tutorials/` parent workspace.
- **Git lives at the monorepo root**, one level up from this course, with a
  baseline commit taken before any multi-agent workflow run. Standing rule:
  commit a clean baseline BEFORE launching a workflow, so a run that goes
  sideways is one `git checkout` from recoverable. Be
  correspondingly careful with deletes and bulk rewrites.
- Two gates must stay green: `npm run check` (typecheck, currently 0/0/0 over 19
  files) and `npm run build`. When a guard fails, read the error and fix the
  drift — do not route around the guard.
- Course one is assumed knowledge, not material to repeat. `pkg`, `~/storage`,
  fish, sessions and the extra-keys row get referenced, never re-explained.

## Never hardlink these files

The beginner course's `AGENTS.md` and `CLAUDE.md` were once **hardlinked** — one
inode, two names — so writing either silently rewrote the other, and both sat at
identical boilerplate through edits that all appeared to succeed.

This repo was seeded by **copying**, which is correct. Keep it that way: if you
ever need to seed one doc from another, or seed course three from this repo,
**copy it; never link it.** (`ls -li` is how you confirm two names are two
inodes.)
