# AGENTS.md

Start here, then read [CLAUDE.md](CLAUDE.md) before you edit anything.

## Where the knowledge lives

- **[CLAUDE.md](CLAUDE.md)** — the whole project brief: stack, architecture,
  design-token rules, the known issues, and the gotchas that cost an afternoon.
  It is the single copy on purpose; this file is a pointer so the two cannot
  drift apart.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — contributor workflow: adding a
  lesson, linking between pages, the interactive components, PR expectations.
- **[README.md](README.md)** — what the site is, the npm scripts, the two
  build-time guards, and how it deploys.

## The five that bite hardest

Each is written out in CLAUDE.md; this is the index so you know to go look.

1. **The CSS is deliberately UNLAYERED.** Starlight ships its styles inside
   `@layer starlight.*`, and unlayered rules outrank every layered one — that is
   the only reason `src/styles/global.css` can restyle Starlight at all. Putting
   this file into an `@layer` ranks it *below* Starlight and breaks the theme.
   Tailwind was removed for the same reason it was useless. → "Do not undo".
2. **The xterm UMD/SSR alias in `astro.config.mjs` is load-bearing.**
   `@xterm/xterm@6` has no `exports` map and its `main` is UMD, so SSR resolves
   the wrong build and `import { Terminal }` has no named export — even though
   both terminals are `client:only`. `ssr.noExternal` plus the `resolve.alias`
   keep the build green. → gotcha #3.
3. **`BootSplash.astro` rewrites an Inkscape-pretty-printed SVG.** Every
   attribute is on its own line, so naive `.replace()` patterns match nothing,
   return the input unchanged, and report success — a silent visual bug. Every
   rewrite goes through `must()`, which fails the build instead. → gotcha #6.
4. **The terminal's screen tokens are dark-locked in both themes.** Anything
   drawn on `--tmx-screen` must use `--tmx-screen-muted` / `--tmx-screen-brand`;
   the theme-following `--fg-*` tokens fail AA on that panel in light mode. The
   same colours are duplicated as literal hexes in xterm's `theme` option and in
   the two Expressive Code themes — move all three together. → design rules.
5. **The `sidebar` array in `astro.config.mjs` *is* the curriculum**, and the
   base-path plugin has two blind spots (raw `<a href>` in MDX, frontmatter
   links). Both failures are a 200 in dev and a 404 on Pages. The two build
   guards exist for exactly these. → gotchas #1 and #2.

## Before you touch anything

- Run npm from the repo root (the directory holding `package.json`), never from
  the `termux-tutorials/` parent workspace.
- **The repo is not under version control yet.** There is no undo. Be
  correspondingly careful with deletes and bulk rewrites.
- Two gates must stay green: `npm run check` (typecheck, currently 0/0/0) and
  `npm run build`, which wraps `astro build` in `scripts/check-curriculum.mjs`
  and `scripts/check-links.mjs`. When a guard fails, read the error and fix the
  drift — do not route around the guard.

## Do not re-link this file to CLAUDE.md

These two files were once **hardlinked** — one inode, two names — so writing
either silently rewrote the other, and both sat at identical boilerplate through
edits that all appeared to succeed. They are separate files now (`ls -li`
confirms two inodes). If you ever need to seed one from the other, **copy it;
never link it.**
