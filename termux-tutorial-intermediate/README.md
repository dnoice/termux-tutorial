# Termux Tutorial Series | Part 2 of 3: Termux: Intermediate

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

> Your phone already runs Linux. Now make it answer to you — and then make it
> run without you.

Course two of a three-part series on [Termux](https://termux.dev). Where course
one taught the shell, this one points the shell at the **device**: battery,
network, sensors, GPS, camera and the notification tray through
**Termux:API**; then scripts, schedules, and a web server your pocket serves to
the open internet. Built with [Astro Starlight](https://starlight.astro.build).

This is the **intermediate** repository
([beginner](https://github.com/dnoice/termux-tutorial) → intermediate →
[advanced](https://github.com/dnoice/termux-tutorial-advanced)). The closing
lesson, **Where to Next**, links to the sibling *repositories* and to the
beginner course's live site rather than to pages that would 404.

Nothing from course one is re-taught. `pkg install`, `~/storage`, fish,
sessions and the extra-keys row are assumed knowledge — referenced, never
re-explained.

The course is **eight lessons** in three sections (The Android Bridge,
Scripting & Automation, Serving From Your Pocket), plus a Welcome page and
three reference pages: **twelve content pages**, thirteen built HTML files once
`404.html` is counted. The order lives in the `sidebar` array in
`astro.config.mjs` and is enforced at build time — see
[Build-time guards](#build-time-guards).

## This course has its own progress store, and that is not an accident

Read this before you "tidy up" anything in `src/lib/progress.ts`.

Progress and profile live in `localStorage` under the key
**`tmx:intermediate:v1`**. The beginner course uses **`tmx:beginners:v1`**. The
two keys must never be reconciled, because:

- both courses are published as *paths on one origin* —
  `dnoice.github.io/termux-tutorial` and
  `dnoice.github.io/termux-tutorial-intermediate`;
- `localStorage` is scoped to the **origin**, not the path.

So a single shared key would make the two courses read and write the same
object. Finishing a lesson here would silently overwrite the beginner course's
completed list with slugs it has never heard of, and the learner's profile name
and avatar would ping-pong between the two sites. Nothing would error; progress
would simply evaporate.

The same reasoning covers the export/import file: `EXPORT_KIND` here is
`termux-intermediate-progress`, the beginner course's is
`termux-beginners-progress`, and `importProgress()` rejects the other course's
file by name rather than importing slugs it will then discard.

One shared key **is** correct and should stay shared: `starlight-theme`. A
learner's light/dark choice carrying across both courses is the desired
behaviour, since they are visibly the same site.

## Features

- 📡 **Termux:API as the spine of the course** — three lessons on the bridge
  between the Linux side of the phone and the Android side: installing both
  halves so their signatures match, reading the device, and talking back to it
  with notifications, dialogs and speech.
- 🤖 **Automation that survives Android** — scripts first, then `cron` *and*
  `termux-job-scheduler`, plus the part no desktop tutorial covers: Doze, the
  phantom process killer, and wakelocks.
- 🌐 **A server in your pocket** — a local HTTP site over Wi-Fi first, so a
  learner can tell a server failure from a tunnel failure, then a real public
  HTTPS URL through an outbound tunnel. That last lesson spends more words on
  shutting the tunnel down than on opening it.
- 🐟 **Fish-style interactive terminal** — a deterministic, offline Termux
  simulator with grey autosuggestions and live command highlighting, powered by
  [xterm.js](https://xtermjs.org). It runs no real code:
  `src/components/terminal/shell.ts` is a hand-written interpreter over an
  in-memory filesystem. It appears on the **Welcome page only** — see
  [Where the terminal is not](#where-the-terminal-is-not).
- ⌨️ **A touch key row on every terminal** — `ESC TAB ↑ ↓ ← → / - ~` plus a
  sticky `CTRL`. Gboard and the Samsung keyboard have none of those keys, so on
  the device this course is actually about, they are the only way to reach the
  features being taught.
- 📱 **Built for a phone, not shrunk to fit one** — narrower viewports get a
  smaller font for more columns, the screen clamps to `45vh` so the soft
  keyboard cannot bury it, and a `visualViewport` handler scrolls the prompt
  back into view when that keyboard opens.
- 🐧 **Live Linux sandbox** — an optional, real Debian VM running entirely in
  the browser via [WebVM](https://webvm.io) / CheerpX. It sits on **one**
  lesson, *From Commands to Scripts*, and boots only when the learner clicks
  **Boot Linux**.
- 📊 **Local progress layer** — a per-browser profile (avatar + name) and lesson
  completion tracking in `localStorage`, with JSON **export and import** so
  progress can move from the phone the course is about to the laptop it is
  often read on. No accounts, no server.
- 🎨 **Fire Watch v6 design system** — Parchment Dossier (light) and Sentinel
  Obsidian (dark), with brass gold as the single accent, and a one-button theme
  control that cycles light → dark → system. Plain CSS with design tokens; no
  CSS framework.
- ✨ **A boot sequence on the landing page** — once per session, skippable by any
  tap or key, and skipped entirely under `prefers-reduced-motion`. The page
  underneath is fully rendered and interactive the whole time.
- ⚡ **Static & serverless** — deploys to GitHub Pages with zero backend.

### Where the terminal is not

The practice simulator is on the Welcome page and nowhere else, and that is a
decision rather than an omission. `shell.ts` implements `termux-api`,
`termux-change-repo`, `termux-setup-storage` and friends, but it has **no branch
for `termux-battery-status`, `termux-notification`, `termux-sensor`** or any of
the other commands this course is built on. Dropping a terminal onto those
lessons would answer their own instructions with `command not found`, which is
a trust bug rather than a missing feature. Each of those lessons carries a
comment saying so.

Two ways to close that gap, in preference order: teach `shell.ts` the commands
(and keep the output faithful to real Termux), or lean on the CheerpX sandbox
where the lesson is plain POSIX shell rather than Android-specific.

`src/components/lesson/PracticeSection.astro` is present and working but
currently unused by any lesson, for the same reason.

## Getting started

Run every command from **this directory** (the repo root — it holds
`package.json` and `node_modules`), not from the `termux-tutorials/` parent
workspace that contains the sibling courses and the shared `global-docs/`.

```bash
npm install
npm run dev        # http://localhost:4321/termux-tutorial-intermediate
```

| Command | Action |
| :------ | :----- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Guard the curriculum, build to `dist/`, then check every built link |
| `npm run preview` | Preview the built site locally |
| `npm run check` | Typecheck with `astro check` (`npm run typecheck` is an alias) |
| `npm run check:curriculum` | Run the curriculum guard on its own — no build needed |
| `npm run check:links` | Run the link check on its own — needs an existing `dist/` |
| `npm run fonts:sync` | Re-copy the eight latin `woff2` faces into `public/fonts/` |

`tsconfig.json` extends `astro/tsconfigs/strict`, and strict mode is enforced
rather than decorative: `typescript` and `@astrojs/check` are real
devDependencies, and `npm run check` currently reports **0 errors, 0 warnings,
0 hints** over 19 files. `astro build` still does not typecheck on its own, so
run `npm run check` yourself — CI runs it as a separate gate before the build.

### Build-time guards

`npm run build` is three steps, not one:

```bash
node scripts/check-curriculum.mjs && astro build && node scripts/check-links.mjs
```

Both guards exit non-zero and fail the build. They exist because the course
order lives in several hand-maintained places, and the two ways it breaks are
invisible in `npm run dev` — they only show up as a 404 on GitHub Pages.

[`scripts/check-curriculum.mjs`](scripts/check-curriculum.mjs) runs **before**
the build and fails it when:

- a `slug` in the `sidebar` array has no matching file under `src/content/docs/`;
- the sidebar's lessons and `LESSONS` in `src/lib/progress.ts` are not the same
  slugs **in the same order** (the four utility pages — Welcome, Your Progress,
  Cheatsheet, Troubleshooting — are excluded from `LESSONS` by design, so they
  never inflate the progress total);
- a lesson has no `<LessonComplete slug="…">`, or its slug string does not match
  its `LESSONS` slug exactly;
- any lesson other than the **last** one sets `next: false`, or the last one
  does not;
- a utility page other than Welcome fails to set **both** `prev: false` and
  `next: false` (Welcome is step zero and needs its `next`);
- `index.mdx`'s hero action and `next.link` do not both point at lesson one
  (`bridge/api-setup/`), or either is written root-relative (frontmatter links
  are not base-prefixed);
- the inert `sidebar.order` frontmatter values stop ascending within a group.

[`scripts/check-links.mjs`](scripts/check-links.mjs) runs **after** the build,
over the emitted HTML in `dist/`, and fails it when:

- an internal `href` or `src` resolves to no file (a directory URL is satisfied
  by its `index.html`);
- a `#fragment` names an `id` that does not exist on the target page;
- a root-relative internal URL never received the `base` prefix — the signature
  failure of a raw `<a href>` in MDX or a link written in frontmatter, both of
  which `rehypeBasePaths` cannot reach.

That script hardcodes `BASE` at the top to match `base` in `astro.config.mjs`.
**If you change one, change the other** — and note that this repo's copy is
currently wrong, which is the one thing standing between it and a green build.
See [Known issues](CLAUDE.md#known-issues--verified-unfixed) in CLAUDE.md.

A third guard runs inside the build itself:
[`BootSplash.astro`](src/components/splash/BootSplash.astro) tags parts of an
SVG at build time and asserts that every rewrite matched something, so artwork
that changes shape fails the build instead of silently shipping a broken
animation.

## Project structure

```text
src/
├─ assets/            # SVG artwork used by the theme and the boot splash + HANDOFF notes.
│                     # Source-processed assets only; large bitmaps live outside the repo.
├─ components/
│  ├─ terminal/       # xterm.js simulator (TermuxTerminal + shell.ts) and WebVM (LiveSandbox)
│  ├─ profile/        # local avatar, progress dashboard + export/import, per-lesson toggle
│  ├─ lesson/         # PracticeSection — present, currently unused (see above)
│  ├─ splash/         # BootSplash — the landing page's boot animation
│  ├─ icons/          # hand-rolled inline SVG icons for React islands
│  └─ overrides/      # Starlight component overrides (Sidebar, ThemeSelect)
├─ content/docs/      # the lessons (Markdown / MDX) — 12 pages
├─ lib/               # local progress store (localStorage) + React hook
└─ styles/
   ├─ global.css      # the entire design system: tokens, theme, components
   └─ print.css       # the paper edition; loaded last so it wins on print
scripts/
├─ check-curriculum.mjs  # pre-build guard: sidebar == LESSONS == files == frontmatter
└─ check-links.mjs       # post-build guard: every internal link in dist/ resolves
public/
├─ coi-serviceworker.js  # cross-origin isolation for WebVM, scoped to one lesson
├─ fonts/                # eight latin woff2 faces, written by `npm run fonts:sync`
├─ og-default.png        # the 1200x630 social card (og-default.svg is its source)
└─ favicon.svg
```

Adding a lesson? Register its slug in [`src/lib/progress.ts`](src/lib/progress.ts)
so it counts toward course progress, and add it to the `sidebar` array in
[`astro.config.mjs`](astro.config.mjs) — that array is also what generates the
prev/next pagination, so its order is the learner's route through the course.
Get either wrong and `npm run build` stops with a named error instead of
shipping a lesson that is navigable but uncountable. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the full recipe and
[CLAUDE.md](CLAUDE.md) for the architecture and house rules.

## Unfinished content

Two pages are deliberate stubs, created so the sidebar entries, the links out of
the progress dashboard and the build's link check all resolve:

- `src/content/docs/reference/cheatsheet.md`
- `src/content/docs/reference/troubleshooting.md`

Both are meant to be written **last**, from the finished lessons — the
cheatsheet as one section per lesson in sidebar order, the troubleshooting page
from the failures the lessons actually produce. Each file carries an HTML
comment listing what belongs in it.

## Deployment

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on pushes to
`main`, on pull requests targeting `main`, and on manual dispatch. Every run
pins **Node 22** (Astro 7 requires `^20.19 || ^22.12 || >=24`, and inheriting
whatever the runner image ships means a runner bump can break the build with no
change here), caches npm on `package-lock.json`, installs with `npm ci`, then
runs `npm run check` as a typecheck gate before `npm run build`.

A pull request gets the typecheck and the build but **never the deployment**:
both Pages steps and the whole `deploy` job are skipped on `pull_request`
events, so a fork PR — whose token is read-only — cannot fail on
`configure-pages` for a reason the contributor is unable to fix. The concurrency
group deliberately sets `cancel-in-progress: false`; interrupting a live Pages
deployment can leave the site half-published.

Enable Pages under **Settings → Pages → Build and deployment → GitHub Actions**.

The site path is configured in `astro.config.mjs` via `site`
(`https://dnoice.github.io`) and `base` (`/termux-tutorial-intermediate`),
either of which the `SITE` / `BASE` environment variables override for a fork or
custom domain. Content links are authored root-relative
(`/bridge/api-setup/`) and a `rehypeBasePaths` plugin prefixes `base` at build
time, so the path is configured in one place — plus the copy in
`scripts/check-links.mjs` that has to be kept in step with it.

## What this site knows about you

Nothing, with one disclosed exception.

- No accounts, no analytics, no cookies, no tracking scripts, no backend. The
  site is static files.
- Your profile name, avatar, and lesson progress are written to `localStorage`
  in your browser under `tmx:intermediate:v1` and are never transmitted. The
  practice terminal reads your name to build its prompt; that also never leaves
  the page. Exporting progress writes a JSON file to your own downloads folder
  and uploads nothing.
- Fonts and icons are **self-hosted**. The eight latin `woff2` faces are copied
  out of the `@fontsource-variable` packages into `public/fonts/` by
  `npm run fonts:sync`, then declared by an inline `@font-face` block in
  `<head>` with the two above-the-fold families preloaded. Icons are Font
  Awesome 6 via Iconify, inlined as SVG at build time. Ordinary browsing makes
  no third-party requests.
- A COOP/COEP service worker (`public/coi-serviceworker.js`) is registered on
  exactly one page — the shell-scripts lesson that hosts the sandbox — and
  scoped to that lesson's directory, so it never controls the other pages. It
  rewrites response headers inside your own browser and transmits nothing.
- **The exception:** pressing **Boot Linux** in the optional live sandbox loads
  the CheerpX runtime from `cxrtnc.leaningtech.com` and streams a Debian disk
  image from `wss://disks.webvm.io`. Those requests expose your IP address and
  referrer to Leaning Technologies. It is user-initiated, on one lesson, and
  never happens unless you click.

Note that the course *teaches* things that reach the network — Termux:API
sensor reads, cron jobs, and above all a public tunnel URL. Those run on the
learner's own device, from their own shell. This site is not involved.

## Third-party dependencies and the CDN exception

The project's no-CDN stance is real but not absolute, and the difference matters:

| Runtime dependency | Where it comes from |
| :----------------- | :------------------ |
| Fonts, icons, xterm.js, React, Starlight | bundled at build time, served from our own origin |
| CheerpX runtime + Debian disk image (one lesson) | `cxrtnc.leaningtech.com` and `disks.webvm.io`, fetched at click time |

The CheerpX exception is deliberate: a multi-gigabyte disk image cannot be
self-hosted on GitHub Pages. It is acceptable because the feature is optional,
confined to a single lesson, user-initiated, and degrades to a clear error
message — the course teaches nothing that depends on it.

Two consequences to know about:

- **Availability.** `CHEERPX_VERSION` (`1.1.5`) and the disk image URL are
  pinned in `src/components/terminal/LiveSandbox.tsx`. If Leaning Technologies
  retires either, the sandbox stops booting. Keep the version pinned anyway — a
  floating `latest` trades a predictable break for an unpredictable one.
- **Licensing.** CheerpX is **free for non-commercial and educational use**,
  which is what this course is. Review the [CheerpX license](https://cheerpx.io)
  before reusing this code in a commercial project.

## Sharing, search and print

Three things the site emits that are easy to miss because they never appear on
screen:

- **Social card.** `public/og-default.png` (1200×630, drawn from
  `public/og-default.svg`) is emitted as `og:image` / `twitter:image` with
  dimensions and alt text. The URL is absolute — crawlers reject a
  base-relative one — so it is built from `site` + `base` in `astro.config.mjs`.
- **Structured data.** One `schema.org` `Course` node in an `application/ld+json`
  `@graph`, injected site-wide and anchored by `@id` so every page points at the
  same course rather than declaring one course per page. It carries
  `educationalLevel: 'Intermediate'` and a `coursePrerequisites` naming the
  beginner course. Its `teaches` list and the `name` / `description` are
  hand-maintained next to the Starlight options — nothing validates them, so
  keep them in step when the curriculum changes.
- **Print stylesheet.** `src/styles/print.css` is loaded **last** in `customCss`
  so it outranks both the design system and xterm's own stylesheet on equal
  specificity. Print is treated as a separate rendering target, not a variant of
  the screen theme.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Corrections, new lessons, and better
explanations are all welcome.

## License

[MIT](LICENSE) © dnoice
