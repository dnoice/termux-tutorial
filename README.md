# Termux Tutorial Series | Part 1 of 3: Starting with Termux

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

> Linux in your pocket, one command at a time.

An interactive, hands-on introduction to [Termux](https://termux.dev) — the Linux
terminal for Android. Built with [Astro Starlight](https://starlight.astro.build),
it pairs plain-English lessons with a **live, in-browser terminal** so learners
practise every command without touching a device.

This is the **beginner** repository in a planned three-part series
([beginner](https://github.com/dnoice/termux-tutorial-for-beginners) →
intermediate → advanced). Only this repository is built and published today; the
intermediate and advanced courses are still empty directories in the parent
workspace, so they are deliberately not linked here yet.

## Features

- 🐟 **Fish-style interactive terminal** — a deterministic, offline Termux
  simulator with grey autosuggestions and live command highlighting, powered by
  [xterm.js](https://xtermjs.org). It runs no real code: `src/components/terminal/shell.ts`
  is a hand-written interpreter over an in-memory filesystem.
- 🐧 **Live Linux sandbox** — an optional, real Debian VM running entirely in the
  browser via [WebVM](https://webvm.io) / CheerpX, for free-form practice. It
  appears on one lesson only and boots only when the learner clicks **Boot Linux**.
- 📊 **Local progress layer** — a per-browser profile (avatar + name) and lesson
  completion tracking, stored in `localStorage`. No accounts, no server.
- 🎨 **Fire Watch v6 design system** — Parchment Dossier (light) and Sentinel
  Obsidian (dark), with brass gold as the single accent. Plain CSS with design
  tokens; no CSS framework.
- ⚡ **Static & serverless** — deploys to GitHub Pages with zero backend.

## Getting started

Run every command from **this directory** (the repo root — it holds
`package.json` and `node_modules`), not from the `termux-tutorials/` parent
workspace that contains the sibling courses and the shared `global-docs/`.

```bash
npm install
npm run dev        # http://localhost:4321/termux-tutorial-for-beginners
```

| Command | Action |
| :------ | :----- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the production site to `dist/` |
| `npm run preview` | Preview the built site locally |

There is no typecheck or lint script yet: `tsconfig.json` extends
`astro/tsconfigs/strict`, but neither `typescript` nor `@astrojs/check` is
installed, and `astro build` does not typecheck. Treat type errors as
uncaught until that is wired up.

## Project structure

```text
src/
├─ assets/            # SVG artwork used by the theme (scatter fields) + HANDOFF notes.
│                     # Source-processed assets only; large bitmaps live outside the repo.
├─ components/
│  ├─ terminal/       # xterm.js simulator (TermuxTerminal + shell.ts) and WebVM (LiveSandbox)
│  ├─ profile/        # local avatar, progress dashboard, per-lesson complete toggle
│  ├─ icons/          # hand-rolled inline SVG icons for React islands
│  └─ overrides/      # Starlight component overrides (Sidebar)
├─ content/docs/      # the lessons (Markdown / MDX)
├─ lib/               # local progress store (localStorage) + React hook
└─ styles/global.css  # the entire design system: tokens, theme, components
public/
└─ coi-serviceworker.js  # cross-origin isolation for WebVM on GitHub Pages
```

Adding a lesson? Register its slug in [`src/lib/progress.ts`](src/lib/progress.ts)
so it counts toward course progress, and add it to the `sidebar` array in
[`astro.config.mjs`](astro.config.mjs) — that array is also what generates the
prev/next pagination, so its order is the learner's route through the course.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the full recipe and
[CLAUDE.md](CLAUDE.md) for the architecture and house rules.

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the site and publishes it to GitHub Pages. Enable Pages under
**Settings → Pages → Build and deployment → GitHub Actions**.

The site path is configured in `astro.config.mjs` via `site` and `base` (override
with the `SITE` / `BASE` environment variables for a fork or custom domain).
Content links are authored root-relative (`/start/why-termux/`) and a
`rehypeBasePaths` plugin prefixes `base` at build time, so the path is
configured in exactly one place.

## What this site knows about you

Nothing, with one disclosed exception.

- No accounts, no analytics, no cookies, no tracking scripts, no backend. The
  site is static files.
- Your profile name, avatar, and lesson progress are written to `localStorage`
  in your browser and are never transmitted.
- Fonts (four Fontsource variable families) and icons (Font Awesome 6 via
  Iconify, inlined as SVG at build time) are **self-hosted**, so ordinary
  browsing makes no third-party requests.
- **The exception:** pressing **Boot Linux** in the optional live sandbox loads
  the CheerpX runtime from `cxrtnc.leaningtech.com` and streams a Debian disk
  image from `wss://disks.webvm.io`. Those requests expose your IP address and
  referrer to Leaning Technologies. It is user-initiated, on one lesson, and
  never happens unless you click.

## Third-party dependencies and the CDN exception

The project's no-CDN stance is real but not absolute, and the difference matters:

| Runtime dependency | Where it comes from |
| :----------------- | :------------------ |
| Fonts, icons, xterm.js, React, Starlight | bundled at build time, served from our own origin |
| CheerpX runtime + Debian disk image (LiveSandbox only) | `cxrtnc.leaningtech.com` and `disks.webvm.io`, fetched at click time |

The CheerpX exception is deliberate: a multi-gigabyte disk image cannot be
self-hosted on GitHub Pages. It is acceptable because the feature is optional,
confined to a single lesson, user-initiated, and degrades to a clear error
message that points back at the offline simulator — the course teaches nothing
that depends on it.

Two consequences to know about:

- **Availability.** `CHEERPX_VERSION` (`1.1.5`) and the disk image URL are
  pinned in `src/components/terminal/LiveSandbox.tsx`. If Leaning Technologies
  retires either, the sandbox stops booting. Keep the version pinned anyway — a
  floating `latest` trades a predictable break for an unpredictable one.
- **Licensing.** CheerpX is **free for non-commercial and educational use**,
  which is what this course is. Review the [CheerpX license](https://cheerpx.io)
  before reusing this code in a commercial project. The offline simulator, which
  is the actual teaching surface, carries no such restriction.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Corrections, new lessons, and better
explanations are all welcome.

## License

[BSD-3](LICENSE) © dnoice
