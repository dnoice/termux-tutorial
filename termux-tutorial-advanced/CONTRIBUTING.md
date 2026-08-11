# Contributing

Thanks for helping make Termux more approachable! Corrections, clearer
explanations, and new lessons are all welcome.

This is **course three** of the series, and the last one. Its audience has
finished courses one and two (or is equivalently scarred), and it is the first
course where following a bad instruction costs the reader something they cannot
get back in a second. That shapes almost every rule below.

## Ground rules

- **Accuracy first, and test on a real device.** There is no simulator in this
  course to fall back on. Every command should work on a current Termux install
  from F-Droid, against a real `proot-distro` container, on a real phone. More
  of this material than in either earlier course depends on the *particular*
  handset — GPU support especially — so if you cannot verify something, say that
  instead of asserting it.
- **State the cost before the command.** A Debian rootfs is 1.5–3 GB before
  anything is installed into it. PRoot traces every syscall, so everything
  inside runs slower and warmer. A long compile is a hot phone and a flat
  battery. A learner should never discover a cost after paying it — the landing
  page sets this tone and every lesson should keep it.
- **Do not re-teach courses one and two.** `pkg install`, `~/storage`, fish,
  sessions, the extra-keys row, shell scripts, Termux:API and schedulers are all
  assumed knowledge. Reference them, link to the sibling course if a reader
  needs them, but never re-explain them. A lesson that restates earlier material
  reads as filler to the audience that actually got here.
- **Explain *why*, not just *how*.** This audience can follow instructions
  already; what they lack is the model. PRoot being `ptrace`-based syscall
  interception rather than virtualisation is the load-bearing idea of the whole
  course — nearly every failure downstream is a consequence of it, and a lesson
  that skips the model turns those failures into mysteries.
- **Name the failure mode, and say when it is the phone's fault.** This course
  fails in ways that look identical from the outside: `cannot open display` has
  about six causes, a container that will not start looks the same whether the
  rootfs is corrupt or storage is full, and a GPU bridge may simply not work on
  a given SoC. Where the honest answer is "your device may not do this", write
  that instead of handing the reader another flag to try.
- **Assume a phone.** This course is about Android, and most of it is read on
  Android. Check any layout change at 360px wide.
- **Be careful with anything that touches shared storage or the bootloader.**
  The course's whole premise is that none of this needs root or an unlocked
  bootloader. Do not add anything that quietly does.

## Local development

Run these from the repo root (this directory), not from the `termux-tutorials/`
parent workspace. Git lives at that parent, not here.

```bash
npm install
npm run dev
npm run check   # typecheck — must be clean before you open a PR
npm run build   # must pass before you open a PR
```

There are two gates, and CI runs both — for every project in the monorepo, so a
failure here reddens the whole pipeline.

`npm run check` is `astro check`, the TypeScript compiler over the project.
`tsconfig.json` extends `astro/tsconfigs/strict` and that is enforced:
`typescript` and `@astrojs/check` are installed.

> **Heads up:** `npm run check` currently reports **3 errors** for reasons that
> have nothing to do with your change — two from a stale literal type in
> `src/lib/progress.ts` and one from a dead `unbuilt` branch in
> `src/components/overrides/SiteTitle.astro`. See
> [Known issues](CLAUDE.md#known-issues--verified-unfixed) in CLAUDE.md for the
> exact fix for each. If you see exactly those three, that is this, not you —
> and fixing them is a welcome PR of its own.

`npm run build` runs two guard scripts around the build itself:

```bash
node scripts/check-curriculum.mjs && astro build && node scripts/check-links.mjs
```

Either one exits non-zero and takes the build with it. Read the failure — both
print the exact slug or URL at fault — rather than working around the guard. As
of the last verification the build is **green**: 9 lessons, 14 pages, 0 broken
links, 0 missing base prefixes.

## Adding a lesson

Steps 3 and 4 are checked by `scripts/check-curriculum.mjs`, which runs before
every build. Skipping one produces a named error, not a green build with a
broken course.

1. Create a `.md` or `.mdx` file under `src/content/docs/<section>/`. The
   existing sections are `container/`, `desktop/` and `hardware/`.
2. Add frontmatter: `title` and `description`. Utility pages (reference, tools)
   must set **both** `prev: false` and `next: false` to stay out of the prev/next
   chain — the guard rejects one without the other.
   - **If any value contains `": "`, quote it.** An unquoted
     `title: Termux: Advanced` is a YAML mapping inside a mapping, and the build
     fails on a content-collection type error that never mentions the colon.
     This has taken this repo's build down twice. It is a live hazard on this
     course specifically, because `DISPLAY: :0`, `Error: Can't open display:`
     and `proot-distro:` are all natural things to write in a title or a
     description — four descriptions here are quoted for exactly that reason,
     and `index.mdx` documents the trap in a comment above its own title.
3. Add the page to the `sidebar` array in `astro.config.mjs`. **That array is
   the source of order**, both for the menu and for the prev/next pagination
   Starlight builds from it — a lesson in the wrong slot puts the learner on the
   wrong rail. Add a comment saying *why* the lesson sits where it does; every
   other entry in that array has one, and the ordering argument is the part
   that is expensive to reconstruct later. This course's arguments are unusually
   load-bearing: the conceptual PRoot lesson precedes any install, and the
   display server is proven alone before any desktop exists, precisely so that a
   later failure is diagnosable. (`sidebar.order` in frontmatter is inert while
   an explicit `sidebar` array is configured; existing files still carry it, and
   the guard insists those values keep ascending so a later switch to
   `autogenerate` cannot silently reshuffle the course.)
4. If it should count toward course progress, add its slug to `LESSONS` in
   `src/lib/progress.ts`, then drop a
   `<LessonComplete client:only="react" slug="section/slug" />` at the foot of
   the lesson (this requires an `.mdx` file). The slug string must match
   `LESSONS` exactly — the guard compares them character for character.
5. If the new lesson goes at the **end** of the course, move `next: false` onto
   it and off the lesson that used to be last (`where-next`). Exactly one lesson
   may carry it, and it must be the final one, or the chain dead-ends early.
6. Adding a lesson at the **front** means updating `index.mdx`'s hero action and
   its `next.link` to match — both must point at lesson one (today
   `container/why-proot/`), and both must stay relative (no leading slash).
7. If the lesson teaches a skill the `teaches` list in the `schema.org` block in
   `astro.config.mjs` should advertise, add it there too. Nothing enforces that
   one, the beginner course drifted on it twice, and this course's list is
   currently still course two's — so it needs rewriting wholesale rather than
   appending to.

Run `npm run check:curriculum` on its own while you work; it needs no build and
finishes instantly.

### Linking between pages

Write links **root-relative**: `[the XFCE lesson](/desktop/xfce/)`. The
`rehypeBasePaths` plugin in `astro.config.mjs` prefixes `base` at build time, so
the deploy path lives in one place. Never hardcode `/termux-tutorial/advanced/…`
into content.

Two places the plugin cannot reach, because it only rewrites anchors produced
by the Markdown pipeline:

- **Raw `<a href>` in MDX** — use `` <a href={`${base}/desktop/xfce/`}> `` with
  `export const base = import.meta.env.BASE_URL.replace(/\/$/, '')` at the top
  of the file (see `src/content/docs/index.mdx` and `where-next.mdx`).
- **Frontmatter links** (hero actions, `next.link`, `prev.link`) — Starlight
  does not base-prefix these and frontmatter cannot evaluate `BASE_URL`. Use a
  **relative** link with no leading slash (`container/why-proot/`).

A leading slash in either of those places 404s on GitHub Pages — a 200 in dev,
a 404 in production. `scripts/check-links.mjs` runs over `dist/` after the build
and is what catches it: it fails on any internal link that resolves to no file,
any `#fragment` naming an `id` the target page does not have, and any
root-relative internal URL that never picked up the `base` prefix. Run it alone
with `npm run check:links` (it needs an existing `dist/`).

### Linking to the hub and the sibling courses

The three courses and the hub are separate Astro projects that are assembled
into one site at deploy time, so a link to a sibling **cannot be resolved by
this course's link checker** — the target is genuinely not in this `dist/`, and
it sits outside this course's own `base`.

Derive those URLs from the series root rather than writing them by hand:

```js
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const SERIES_ROOT = base.replace(/\/[^/]+$/, '');   // /termux-tutorial
```

`where-next.mdx` keeps them in one `SERIES` object at the top of the file rather
than scattering them through the prose, and `SiteTitle.astro` does the same for
the header switcher. `scripts/check-links.mjs` allowlists exactly four paths —
the series root plus `/beginner/`, `/intermediate/` and `/advanced/` — and
checks them *before* the base-prefix test. Anything outside that set is still
checked normally, which is the point: a typo in a sibling link must still fail.

Do not add a fifth entry to that allowlist for a course that is not yet
assembled into the site. An entry for an undeployed course turns a real 404 into
a silent pass.

### Do not add a practice terminal

There is no terminal on any page of this course, and that is deliberate. Before
you add one, understand what you would be claiming.

`src/components/terminal/shell.ts` is a hand-written interpreter over an
in-memory filesystem. It **cannot install a rootfs**, **cannot open an X11
socket**, and **cannot reach a GPU** — those three things are the course. A
terminal here would answer `proot-distro install debian` with a fiction, and a
learner who "completes" a lesson against a fiction has learned nothing while
believing otherwise. That is a trust bug, not a missing feature.

`index.mdx` says this to the reader in a section of its own, and
`container/why-proot`, `container/first-distro`, `container/living-in-it`,
`desktop/xfce` and `hardware/building` each carry an inline MDX comment
recording it. Keep those comments; they are the only thing standing between this
decision and a well-meaning future pass.

`TermuxTerminal.tsx`, `shell.ts`, `LiveSandbox.tsx`, `PracticeSection.astro` and
`BootSplash.astro` are still on disk, imported by nothing. Leave them in place —
deleting them is a bigger, riskier diff than the dead weight is worth, and a
future lesson that really is plain POSIX shell might want one. The same goes for
the xterm SSR workarounds in `astro.config.mjs`: currently inert, load-bearing
again the moment a terminal returns.

If a future lesson genuinely warrants one, the order of work is: teach
`shell.ts` the commands *with their real failure modes* first, register the
names so highlighting and autosuggestion agree with what actually runs, and only
then add the component. If the simulator cannot represent a failure honestly, it
is better to leave the command out than to fake a success.

## Style

- Markdown follows standard markdownlint defaults (ATX headings, wrapped prose).
- Prefer Starlight asides (`:::note`, `:::tip`, `:::caution`, `:::danger`) over
  bold-shouting for callouts. `:::caution` and `:::danger` earn their keep in
  this course — use them where a mistake costs disk, hours, or a container the
  reader has to rebuild.
- Use `<Steps>` for install and setup sequences; the container and desktop
  lessons set the pattern.
- Every lesson ends with a **Recap** and then
  `<LessonComplete client:only="react" slug="…" />` as the terminator. Match the
  existing files exactly rather than inventing a new closing shape.
- Keep line length reasonable (~80–100 chars) in prose.
- CSS and TypeScript use **tab** indentation. Comments explain *why*, ideally
  citing what was broken before.
- Design tokens only — see [CLAUDE.md](CLAUDE.md) for the token rules. Brass
  (`--color-brand`) is the only accent hue; do not introduce a second one, and
  never write a raw hex in a component.
- Styling belongs in `src/styles/global.css`, not in a JSX `style={{}}` object.
  The few that remain are values only JavaScript can know. Conditional styling
  goes on a `data-*` or `aria-*` attribute and is selected in CSS.
- `src/styles/global.css` is deliberately **unlayered** — do not wrap it in an
  `@layer`. Starlight's own styles live in `@layer starlight.*`, and unlayered
  rules outrank layered ones; that is the only reason this stylesheet can
  restyle the theme at all.

## Touching the progress store

`src/lib/progress.ts` has one rule above all others: **the `localStorage` key
`tmx:advanced:v1` must stay distinct from `tmx:beginners:v1` and
`tmx:intermediate:v1`.** All three courses live under one origin *and* one base
directory, storage is per-origin, and unifying them makes the courses silently
erase each other. The same goes for `EXPORT_KIND`. CLAUDE.md opens with the full
reasoning.

Beyond that:

- Never let a storage failure break a page. Writes are in try/catch because
  storage can be blocked outright; progress is a convenience, not a
  prerequisite.
- Use `setManyComplete` for multi-lesson writes rather than looping
  `setComplete` — each write fires a change event and re-renders every
  subscriber.
- If a write is refused, say so in the UI. `importProgress()` is the case that
  matters: a learner hands over their only backup, and a silent no-op is the
  worst possible outcome.
- `avatarGradient()` derives both stops from `--color-brand`. It used to use an
  unbounded `hsl()` hue — the only code path that could put an arbitrary colour
  on a site whose stated rule is that brass is the single accent. Do not
  reintroduce a hue term.

## Pull requests

- Keep PRs focused — one lesson or fix per PR where possible.
- Make sure `npm run build` succeeds and `npm run check` is no worse than you
  found it (three known errors, listed above — fixing them is welcome).
- Describe what changed and why.

CI runs on pull requests as well as on pushes to `main`, from the **repository
root** workflow that builds all four projects: it pins Node 22, installs with
`npm ci`, typechecks and builds each of hub, beginner, intermediate and
advanced, then assembles them into one site. The deployment steps are skipped
for pull requests, so an outside contribution is never failed by a Pages
permission it cannot have. This course has no workflow of its own and should not
gain one.
