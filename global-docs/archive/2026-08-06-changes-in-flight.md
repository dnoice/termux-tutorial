# Changes in flight — 2026-08-06

**Read this before auditing `termux-tutorial-for-beginners`.** It exists so a
reviewer or agent can tell *pre-existing problems* apart from *work already
done*, and does not waste effort re-reporting things that are fixed.

Three audits were produced on 2026-08-06 and have been worked through:

| Audit | File | Closed |
| :---- | :--- | -----: |
| Code / content / a11y / perf | `../audits/beginner/2026-08-06-comprehensive.md` | 48 / 67 |
| Rendered pages, 3 viewports | `../audits/beginner/2026-08-06-visual.md` | 31 / 35 |
| Lesson sequencing and flow | `../audits/beginner/2026-08-06-lesson-flow.md` | 24 / 28 |
| **Total** | | **103 / 130** |

Anything **already closed** in those files is marked `✅ CLOSED` in its heading,
with a note describing the fix and the measured result. **Treat a `✅ CLOSED`
heading as authoritative: do not re-report it.**

## Already fixed (do not re-report)

### Content / claims

- `foundations/storage.mdx` — the old advice ("keep your real work in
  `~/storage/shared/`") was wrong and is gone. Now: **code lives in `~`,
  backups go to `~/storage/shared/`**, because shared storage has no exec bit
  and no symlinks. `reference/cheatsheet.md` Golden Rule #3 was inverted to
  match.
- `foundations/storage.mdx` — the `external-1` row was corrected (it is Termux's
  own private folder on the card, not the card), and a `movies` row was added so
  the doc table and the simulator's `~/storage` tree list the same six entries.
- **New lesson** `start/friendly-shell.mdx` ("Upgrade Your Shell to Fish"). The
  site simulated fish everywhere and taught it nowhere. It now sits **after**
  `start/first-session`, not before it — the flow audit found it depended on a
  command the learner had not met yet.
- **New lesson** `foundations/files-and-folders.mdx` ("Files & Folders"),
  between `filesystem` and `storage`. This is the code audit's *"Missing lesson:
  file manipulation and destructive-command safety"* — it teaches
  `mkdir`/`cp`/`mv`/`rm` and carries the `rm -rf` danger table, and it is placed
  before `storage` so that lesson's backup step stops using unexplained commands.
- **New lesson** `where-next.mdx` ("Where to Next"), the course terminus. This is
  the code audit's *"The course dead-ends into a cheatsheet"* — the chain now
  ends on a real lesson that links the sibling repositories.
- `start/installing.mdx` — now verifies the F-Droid domain, and adds a step to
  **revoke** the "install unknown apps" permission afterwards. Also gained a note
  reconciling the real `~ $` bash prompt with the site's `~ ❯` fish prompt.
- `foundations/extra-keys.mdx` — added the **volume-key modifiers**
  (Vol-Down = Ctrl, Vol-Up = Alt), which the site previously mentioned nowhere;
  fixed the chicken-and-egg (you needed Ctrl to enable Ctrl); added
  `mkdir -p ~/.termux`. Same mapping propagated to `first-session.mdx` and a new
  "Phone keys" table in the cheatsheet.
- `reference/troubleshooting.md` — session-death section rewritten around the
  Android 12+ **phantom-process killer** (the previous battery-optimisation-only
  answer was wrong for Android 12+).
- `foundations/packages.mdx` — now states plainly that the WebVM sandbox has
  **no internet**; the old "try a real `apt update`" instruction (which cannot
  work) was replaced with offline-safe commands, plus a download-size warning.

### Learner-facing strings in `LiveSandbox.tsx`

Rewritten from developer-speak. Do not report these as jargon:

- cross-origin-isolation notice → "Almost ready — refresh this page once and the
  Boot button will work."
- SharedArrayBuffer error → "This page needs one refresh before the VM can
  start. Refresh, then press Boot Linux again."
- boot failure → "Couldn't start the VM. … No harm done — the practice terminal
  above works the same way."
- frame title → "live linux — real Debian, in your browser"

### Simulator (`components/terminal/shell.ts`)

Now additionally supports: `fish` (package), `chsh`, `rm`, `cp`, `mv`, `which`,
`termux-reload-settings`. A test asserts every command in `COMMAND_NAMES` is
actually implemented, so nothing highlights as valid and then reports
"command not found".

### Sequencing and the prev/next rail

The flow audit's Critical finding is closed. The chain now reads Welcome →
Why Termux → … → Where to Next:

- `index.mdx`'s hero action **and** its `next.link` both point at
  `start/why-termux/` — the progress dashboard is no longer step two.
- `progress.mdx`, `reference/cheatsheet.md` and `reference/troubleshooting.md`
  all carry both `prev: false` and `next: false`, so the course no longer ends
  in an appendix. They sit in their own "Reference & Tools" sidebar group and are
  excluded from `LESSONS`.
- `next: false` moved off `foundations/extra-keys.mdx` (where it was a
  placeholder that silently truncated the course) onto `where-next.mdx`.
- The inert `sidebar.order` frontmatter was **kept, not deleted** — the guard
  below asserts the values still ascend, so a later switch to `autogenerate`
  cannot reshuffle the course. The duplicated "Local" badge on `progress.mdx` is
  gone; the sidebar array is authoritative.

### Toolchain and build gates

- `typescript` and `@astrojs/check` are installed. `npm run check`
  (= `npm run typecheck` = `astro check`) reports **0 errors, 0 warnings,
  0 hints**. Strict mode is no longer decorative.
- `npm run build` is now
  `node scripts/check-curriculum.mjs && astro build && node scripts/check-links.mjs`.
  The first fails the build when the `sidebar` array, `LESSONS`, the content
  files, the `<LessonComplete slug="…">` strings and four frontmatter facts
  disagree; the second fails it on any internal link in `dist/` that resolves to
  nothing, any dead `#fragment`, or any root-relative URL missing the `base`
  prefix. This closes the code audit's *"four hand-maintained sources of truth
  and zero validation"*.
- `.github/workflows/deploy.yml` was rewritten: runs on `pull_request` as well
  as `push`, pins Node 22, caches npm, runs `npm run check` as a typecheck gate,
  skips both Pages steps and the whole `deploy` job on PRs, and sets
  `cancel-in-progress: false`.

### Presentation

- Base paths: content links are now authored root-relative (`/start/…`) and a
  `rehypeBasePaths` plugin applies `base` at build time. Do not report
  `/start/…` links as missing the base prefix — that is deliberate.
- Mobile terminal: 12px font below 480px plus full-bleed framing, raising the
  column count from ~39 toward ~55 at 390px. The **responsive prompt** collapses
  to `~ ❯` under 60 columns.
- Fonts are self-hosted latin-only: eight `woff2` faces copied into
  `public/fonts/` by `npm run fonts:sync`, declared by an inline `@font-face`
  block, two families preloaded. The four `@fontsource-variable/*` entrypoints
  are no longer imported.
- The COOP/COEP service worker is scoped to the one lesson that needs it
  (`foundations/packages`) via local `swUrl` + `scope` additions to
  `public/coi-serviceworker.js`. It no longer controls the rest of the site.
- Added and user-visible: `og:image` (`public/og-default.png`, 1200×630) with
  dimensions and alt text, a site-wide `schema.org` `Course` JSON-LD graph, and
  a print stylesheet (`src/styles/print.css`, loaded last in `customCss`).
- Contrast, button unification, active-nav legibility, heading/list fonts,
  obsidian-panel tokens — all closed; see the `✅ CLOSED` notes.

## Still open (fair game)

27 findings across the three audits still lack a `✅ CLOSED` marker. They are
listed here by their exact headings so they can be found in the source files.

### Code audit — 19 unmarked

Design system and CSS:

- React islands set size and weight but never family, leaking Inter into the
  article body
- Dead selectors and uniform tracking across a 2.6× size range
- Roughly 50 inline style objects have escaped the token layer
- Repeated patterns and one token name that lies
- Code blocks are the one surface still on stock Night Owl

Content and pedagogy:

- Missing lesson: Android terminal mechanics — sessions, copy/paste, hardware
  keys
- `termux-change-repo` fix begins by reproducing the error
- Smaller content items

Interactivity:

- The terminal requires keys no Android soft keyboard has
- Everything is sealed inside one `useEffect`, which blocks the highest-value
  feature
- The persistent side-by-side terminal — phase 1 only
- Replace the theme dropdown with the original's sun/moon toggle

Accessibility:

- The light theme was never contrast-audited
- The landing page has three headings for eight content blocks
- Reduced-motion misses the fixed background and turns the sheen into a flash

Performance:

- ProfileBadge causes a guaranteed sidebar layout shift on 10 pages

Three further unmarked headings are **resolved in code but never marked**; verify
before spending time on them:

- *The curriculum has four hand-maintained sources of truth and zero validation*
  → `scripts/check-curriculum.mjs` exists, is wired into `npm run build`, and
  passes.
- *Missing lesson: file manipulation and destructive-command safety* →
  `foundations/files-and-folders.mdx`.
- *The course dead-ends into a cheatsheet* → `where-next.mdx`.

### Visual audit — 4 unmarked

- D8. Theme dropdown is the only pill in the header and 13px taller than its
  neighbours
- D10. Terminals reserve 400px, use 5–11 of 25 rows, and clip 8px of content
- L8. `.tmx-panel__kicker` scrapes past AA by 0.15 at the smallest type size on
  the site
- M5. No theme control anywhere on the landing page at phone width

### Flow audit — 4 unmarked

All four are **substantively addressed in code** but were never marked closed.
Re-verify against `astro.config.mjs` and `src/content/docs/` before re-reporting:

- *The dashboard is step two of the learning path* → `index.mdx` now points at
  `start/why-termux/` from both the hero action and `next.link`.
- *The Reference module sits inside the linear chain, so the course ends on
  Troubleshooting* → the three utility pages carry `prev: false` / `next: false`
  and `where-next.mdx` is the terminus.
- *Three orderings exist and one of them is inert* → partially: the inert
  `sidebar.order` values were kept rather than deleted, but
  `check-curriculum.mjs` now fails the build if they stop ascending, and the
  duplicated badge is gone. The audit's literal recommendation (delete them) was
  not taken.
- *The fish lesson sits one position too early* → `start/friendly-shell` now
  follows `start/first-session`.

### Known issues found outside the audits

Recorded in the repo's `CLAUDE.md` under "Known issues — verified, unfixed":

- `astro.config.mjs` emits an Astro 7 deprecation warning on every build and
  every check: `markdown.rehypePlugins` is deprecated in favour of
  `unified({...})` from `@astrojs/markdown-remark`. The plugin in question is
  `rehypeBasePaths`, i.e. the base-path mechanism. It works, but it is on a
  removal path.
- `CLAUDE.md` and `AGENTS.md` were **hardlinked** on disk — one inode, two names
  — so writing either silently rewrote the other, which is why both stayed at
  identical boilerplate. The link has been broken; they are now separate files
  with distinct content. Copy, never link, if seeding one from the other.
- Content line endings are mixed: 11 of the 14 files under
  `src/content/docs/` are CRLF, and 3 are LF (`foundations/packages.mdx`,
  `reference/cheatsheet.md`, `start/why-termux.mdx`). The repo is **not under
  version control yet**; land a `.gitattributes` containing `* text=auto eol=lf`
  before `git init`, or the first normalising edit becomes a whole-file diff.
