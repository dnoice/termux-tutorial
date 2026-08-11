# Termux Tutorial Series | Part 3 of 3: Termux: Advanced

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

> A whole distribution, a real desktop, and the GPU — on a phone, with no root
> and no unlocked bootloader.

Course three of a three-part series on [Termux](https://termux.dev). Course one
taught the shell; course two pointed that shell at the device. This one goes
underneath it: a real Debian userland running in user space under **PRoot**, a
**Termux:X11** display server, a full **XFCE** desktop drawn on the phone's own
screen, OpenGL bridged out to the **GPU** where the hardware allows, and
packages **compiled on the handset** for `aarch64`. Built with
[Astro Starlight](https://starlight.astro.build).

This is the **advanced** course. It is one of four projects in a single
repository — the hub, beginner, intermediate and advanced — that build
separately and deploy as **one** GitHub Pages site. See
[Deployment](#deployment).

Nothing from the earlier courses is re-taught. `pkg`, `~/storage`, fish,
sessions, the extra-keys row, shell scripts, Termux:API and schedulers are all
assumed knowledge — referenced, never re-explained.

The course is **nine lessons** in three sections (A Real Distribution, A Desktop
on Your Phone, Hardware & Your Own Builds), plus a Welcome page and three
reference pages: **thirteen content pages**, fourteen built HTML files once
`404.html` is counted. The order lives in the `sidebar` array in
`astro.config.mjs` and is enforced at build time — see
[Build-time guards](#build-time-guards).

## This course has its own progress store, and that is not an accident

Read this before you "tidy up" anything in `src/lib/progress.ts`.

Progress and profile live in `localStorage` under the key **`tmx:advanced:v1`**.
The beginner course uses **`tmx:beginners:v1`** and the intermediate course
**`tmx:intermediate:v1`**. The three keys must never be reconciled, because:

- all three courses are published as *paths under one origin and one base
  directory* — `dnoice.github.io/termux-tutorial/beginner/`,
  `…/intermediate/`, `…/advanced/`;
- `localStorage` is scoped to the **origin**, not the path.

So a single shared key would make all three courses read and write the same
object. Finishing a lesson here would silently overwrite the other courses'
completed lists with slugs they have never heard of, and the learner's profile
name and avatar would ping-pong between the three sites. Nothing would error;
progress would simply evaporate.

The same reasoning covers the export/import file: `EXPORT_KIND` here is
`termux-advanced-progress`, and `importProgress()` is meant to reject a sibling
course's file *by name* rather than importing slugs it will then discard. (That
separation is currently only half-applied — see
[Known state of the build](#known-state-of-the-build).)

One shared key **is** correct and should stay shared: `starlight-theme`. A
learner's light/dark choice carrying across all three courses and the hub is the
desired behaviour, since they are visibly the same site.

## Features

- 🐧 **A real distribution, not an emulator** — Debian in user space via PRoot,
  with `apt`, real paths and real permissions. The opening lesson is conceptual
  on purpose: PRoot is `ptrace`-based syscall interception, not virtualisation,
  and that single fact explains every limitation the rest of the course runs
  into.
- 🖥️ **A desktop on the screen in your hand** — Termux:X11 brought up and proven
  *alone* first, then XFCE on the Termux side, then the hard version: server on
  the host, session in the container, a shared socket as the tether. Layered
  that way so a black screen is diagnosable rather than mysterious.
- 🎮 **The GPU, where your phone allows it** — `virglrenderer` and `mesa`
  bridging OpenGL out of the container. Explicitly framed as experimental and
  device-dependent: it is the most likely thing in the series not to work on a
  given handset, and the lesson says so rather than pretending otherwise.
- 🔨 **Builds of your own** — compiling for `aarch64` on the device, so "it
  isn't in the repo" stops being the end of the conversation.
- 💸 **Honest about what it costs.** This is the first course in the series where
  a mistake costs something real: a rootfs is 1.5–3 GB before you install
  anything into it, PRoot traces every syscall so everything inside runs slower
  and warmer, and a long build on a phone is a genuinely hot phone. The landing
  page leads with that, not with a feature list.
- 📊 **Local progress layer** — a per-browser profile (avatar + name) and lesson
  completion tracking in `localStorage`, with JSON **export and import** so
  progress can move from the phone the course is about to the laptop it is
  often read on. No accounts, no server.
- 🧭 **A series switcher in the header** — every page carries a route to the hub
  and to the other two courses, so three Starlight sites read as one series
  instead of three dead ends.
- 🎨 **Fire Watch v6 design system** — Parchment Dossier (light) and Sentinel
  Obsidian (dark), with brass gold as the single accent, and a one-button theme
  control that cycles light → dark → system. Plain CSS with design tokens; no
  CSS framework.
- ⚡ **Static & serverless** — deploys to GitHub Pages with zero backend, and in
  this course makes **zero third-party requests** at runtime.

### There is no practice terminal in this course

The earlier courses put an interactive simulator on nearly every page. This one
does not, anywhere, and that is a decision rather than an omission.

The practice terminal is a hand-written interpreter over an in-memory
filesystem. It cannot install a Debian rootfs, it cannot open an X11 socket, and
it cannot talk to a GPU — which is the whole of what this course teaches. A
terminal that answered `proot-distro login debian` with anything at all would be
lying about the one thing the learner came for, and a lesson you can fake your
way through is a lesson you have not learned.

So this course needs your actual device. Every command is one you run for real,
and every failure is one you will actually have to read. The landing page states
this in prose, and five lesson files carry inline comments recording it so that
nobody "fixes" it later.

The ported components (`TermuxTerminal.tsx`, `shell.ts`, `LiveSandbox.tsx`,
`PracticeSection.astro`, `BootSplash.astro`) are still on disk and are imported
by nothing. Leave them; adding one back to a page is the mistake, not deleting
them.

## Getting started

Run every command from **this directory** (the one holding `package.json` and
`node_modules`), not from the `termux-tutorials/` parent workspace that contains
the hub, the sibling courses and the shared `global-docs/`. Git lives at that
parent, not here.

```bash
npm install
npm run dev        # http://localhost:4321/termux-tutorial/advanced
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
devDependencies and CI runs `npm run check` as a gate before the build. `astro
build` does not typecheck on its own, so run `npm run check` yourself.

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
  (`container/why-proot/`), or either is written root-relative (frontmatter
  links are not base-prefixed);
- the inert `sidebar.order` frontmatter values stop ascending within a group.

[`scripts/check-links.mjs`](scripts/check-links.mjs) runs **after** the build,
over the emitted HTML in `dist/`, and fails it when:

- an internal `href` or `src` resolves to no file (a directory URL is satisfied
  by its `index.html`);
- a `#fragment` names an `id` that does not exist on the target page;
- a root-relative internal URL never received the `base` prefix — the signature
  failure of a raw `<a href>` in MDX or a link written in frontmatter, both of
  which `rehypeBasePaths` cannot reach.

That script carries a **`SIBLINGS`** allowlist, because a course cannot see its
siblings in its own `dist/`. The hub and the other two courses are real,
resolvable paths in the assembled site while being genuinely absent from the
tree this script walks — and they sit *outside* this course's own `base`, so
without the allowlist every one of them is reported as "missing the base
prefix", which is the opposite of true. The sibling test therefore runs **before**
the base-prefix test, and the paths are listed explicitly rather than
pattern-matched so a typo in a sibling link is still caught.

Both the script and `astro.config.mjs` resolve the base the same way
(`process.env.BASE ?? '/termux-tutorial/advanced'`). **If you change one, change
the other.**

## Project structure

```text
src/
├─ assets/            # SVG artwork + HANDOFF notes. Source-processed assets
│                     # only; large bitmaps live outside the repo.
├─ components/
│  ├─ profile/        # local avatar, progress dashboard + export/import, per-lesson toggle
│  ├─ overrides/      # Starlight overrides: Sidebar, SiteTitle (series switcher), ThemeSelect
│  ├─ icons/          # hand-rolled inline SVG icons for React islands
│  ├─ terminal/       # ported from course two — UNUSED here (see above)
│  ├─ lesson/         # PracticeSection — ported, UNUSED here
│  └─ splash/         # BootSplash — ported, UNUSED here
├─ content/docs/      # the lessons (Markdown / MDX) — 13 pages
├─ lib/               # local progress store (localStorage) + React hook
└─ styles/
   ├─ global.css      # the entire design system: tokens, theme, components
   └─ print.css       # the paper edition; loaded last so it wins on print
scripts/
├─ check-curriculum.mjs  # pre-build guard: sidebar == LESSONS == files == frontmatter
└─ check-links.mjs       # post-build guard: every internal link in dist/ resolves
public/
├─ coi-serviceworker.js  # COOP/COEP shim — shipped, never registered in this course
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

## Known state of the build

Verified 2026-08-11.

**`npm run build` passes.** The curriculum guard reports 9 lessons with sidebar
and `LESSONS` in agreement, 14 pages build, and the link checker finds 0 broken
links and 0 missing base prefixes across all 14.

**`npm run check` fails: 3 errors, 0 warnings, 0 hints over 20 files.** All three
are leftovers of the port from course two, and all three are one-line fixes:

- `src/lib/progress.ts` — the `ProgressExport` interface still declares
  `kind: 'termux-intermediate-progress'` while `EXPORT_KIND` is
  `'termux-advanced-progress'`, producing a ts(2322) at line 164 and a ts(2367)
  at line 204. The import rejection message on line 209 still names *"Termux:
  Intermediate"* too — no compiler error, but wrong in front of a learner.
- `src/components/overrides/SiteTitle.astro:47` — a `c.unbuilt` branch that no
  `COURSES` entry declares, ts(2339). Permanently falsy.

Separately, and without any error attached: `astro.config.mjs` still carries
course-two identity strings — the site `DESCRIPTION`, the `schema.org` `Course`
name, `educationalLevel`, `teaches` list and prerequisites, and the
`og:image:alt` — which render into every page's `<head>`. The Starlight `title`
and `tagline` are correct, which is what makes the rest easy to miss.

Full detail, with the exact fix for each, is in
[CLAUDE.md](CLAUDE.md#known-issues--verified-unfixed).

## Deployment

**This course has no deploy workflow of its own, and must not grow one.** There
is no `.github/` directory here.

GitHub Pages publishes exactly one artifact per repository, so the four projects
in this monorepo cannot each deploy themselves. The single workflow at the
**repository root** — `.github/workflows/deploy.yml`, one directory up — pins
**Node 22**, caches npm on each project's `package-lock.json`, then for each of
hub, beginner, intermediate and advanced runs `npm ci`, `npm run check` and
`npm run build`. It assembles the four `dist/` trees into one site:

```text
_site/                 <- the hub      (base /termux-tutorial)
_site/beginner/        <- course one   (base /termux-tutorial/beginner)
_site/intermediate/    <- course two   (base /termux-tutorial/intermediate)
_site/advanced/        <- this course  (base /termux-tutorial/advanced)
```

…then fails loudly if any of those four `index.html` files is missing, and
re-checks every hub link against the assembled tree — the only place a
hub→course link can be verified, since no individual course's link checker can
see across the boundary.

It runs on pushes to `main`, on pull requests targeting `main`, and on manual
dispatch. A pull request gets the typecheck and the build but **never the
deployment**: both Pages steps and the whole `deploy` job are skipped on
`pull_request` events, so a fork PR — whose token is read-only — cannot fail on
`configure-pages` for a reason the contributor is unable to fix. The concurrency
group deliberately sets `cancel-in-progress: false`; interrupting a live Pages
deployment can leave the site half-published.

Enable Pages under **Settings → Pages → Build and deployment → GitHub Actions**.
Note that Pages from a private repository requires GitHub Pro or higher.

This course's path is configured in `astro.config.mjs` via `site`
(`https://dnoice.github.io`) and `base` (`/termux-tutorial/advanced`), either of
which the `SITE` / `BASE` environment variables override for a fork or custom
domain. Content links are authored root-relative (`/container/why-proot/`) and a
`rehypeBasePaths` plugin prefixes `base` at build time, so the path is
configured in one place — plus the copy in `scripts/check-links.mjs` that has to
be kept in step with it.

## What this site knows about you

Nothing, and in this course there is no exception.

- No accounts, no analytics, no cookies, no tracking scripts, no backend. The
  site is static files.
- Your profile name, avatar, and lesson progress are written to `localStorage`
  in your browser under `tmx:advanced:v1` and are never transmitted. Exporting
  progress writes a JSON file to your own downloads folder and uploads nothing.
- Fonts and icons are **self-hosted**. The eight latin `woff2` faces are copied
  out of the `@fontsource-variable` packages into `public/fonts/` by
  `npm run fonts:sync`, then declared by an inline `@font-face` block in
  `<head>` with the two above-the-fold families preloaded. Icons are Font
  Awesome 6 via Iconify, inlined as SVG at build time.
- The built site references **no third-party subresource at all** — verified
  against `dist/`: zero external `src` attributes, and none of course two's
  CheerpX/WebVM code paths are reachable, because this course has no live
  sandbox. The only outbound links are ordinary documentation links a reader has
  to click (the Termux wiki, GitHub, Reddit).
- `public/coi-serviceworker.js` is still shipped but is **never registered**: its
  loader only fires on a page path that does not exist in this course. No page
  here is cross-origin isolated.

Note that the course *teaches* things that touch the network and the device —
downloading a multi-gigabyte rootfs, `apt` inside a container, compiling from
source. Those run on the learner's own device, from their own shell. This site
is not involved.

## Sharing, search and print

Three things the site emits that are easy to miss because they never appear on
screen:

- **Social card.** `public/og-default.png` (1200×630, drawn from
  `public/og-default.svg`) is emitted as `og:image` / `twitter:image` with
  dimensions and alt text. The URL is absolute — crawlers reject a
  base-relative one — so it is built from `site` + `base` in `astro.config.mjs`.
  The alt text is still course two's; see
  [Known state of the build](#known-state-of-the-build).
- **Structured data.** One `schema.org` `Course` node in an `application/ld+json`
  `@graph`, injected site-wide and anchored by `@id` so every page points at the
  same course rather than declaring one course per page. Its `name`,
  `description`, `educationalLevel` and `teaches` list are hand-maintained next
  to the Starlight options — nothing validates them, and they are currently
  still describing course two.
- **Print stylesheet.** `src/styles/print.css` is loaded **last** in `customCss`
  so it outranks the design system on equal specificity. Print is treated as a
  separate rendering target, not a variant of the screen theme.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Corrections, new lessons, and better
explanations are all welcome.

## License

[MIT](LICENSE) © dnoice
