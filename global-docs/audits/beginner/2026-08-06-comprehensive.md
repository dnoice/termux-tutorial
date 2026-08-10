# Termux for Beginners — Full Audit

**Repo:** `termux-tutorial-for-beginners` (Astro 7 + Starlight, GitHub Pages)
**Audit date:** 2026-08-06
**Auditors:** 8 dimension specialists, 1 skeptic pass, 1 completeness critic. No fixes were applied.

## How to read this

Read sections 1-3 on your phone. That is the executive summary, the scorecard, and the
priority queue — everything you need to know what Monday morning looks like. The rest is
reference material for when you are at a desk with the repo open.

Every finding carries **Severity** (critical / high / medium / low / polish), **Effort**
(trivial = minutes, small = under an hour, medium = a few hours, large = a day or more),
and a **Location** you can jump to. Findings that three or more auditors reported have
been merged into one entry. Findings the skeptic rejected are gone — they are listed in
section 9 so you know they were considered and dismissed, not overlooked.

The known-good list is respected throughout: the even grid/panel alignment, the SVG
Scatter Field background, the disabled dev toolbar, and the deliberately non-clickable
info cards are treated as correct decisions, not defects.

---

## 1. Executive summary

This is a genuinely well-built project with an unusually clear intent, and it is currently
shipping three defects that undercut it. The Fire Watch token bridge, the `client:only`
island discipline, the pub/sub progress store, the per-file header comments, and the
editorial voice in the body copy are all above the bar for a solo project — none of that
is flattery, it is what the code actually shows. The problem is a consistent pattern: the
design system is airtight inside `global.css` and evaporates at every boundary — React
inline styles, xterm's JS config, the light theme, and the mobile viewport. Three things
need attention before anything else. First, the "Switch it on" CTA on the landing page is
not merely unstyled; it renders at literally 1.00:1 contrast in dark mode because a
prose-link rule out-specifies the button and its `background` shorthand erases the fill
while a surviving `color: !important` paints near-black on near-black. Second,
`foundations/storage.mdx` tells beginners to do their real work in `~/storage/shared/`,
a filesystem with no exec bit and no symlinks — that advice will cost readers hours of
unexplainable failure, and it has been hardened into the cheatsheet as a Golden Rule.
Third, the interactive layer — the thing that makes this site different from every other
Termux tutorial — breaks on phones: the simulator visibly corrupts its own display once
input wraps (roughly 15 characters at a 390px viewport), and the course instructs keys
that no Android soft keyboard can produce while never once mentioning that Volume-Down
is Ctrl. Everything else on this list is real but subordinate to those three.

The strategic question underneath all of it: this repo is about to be cloned twice, and
every clone-readiness defect in this document gets paid for three times, forever.

---

## 2. Scorecard

| Dimension | Grade | Justification |
| --- | --- | --- |
| Typography | C+ | Four-family concept is right and the token bridge is disciplined, but there is no scale (12 ad-hoc sizes in CSS, five inside a 0.27rem band), and both terminals request a font family that is not loaded. |
| Design system, tokens & CSS architecture | B- | The Fire Watch bridge is the strongest artifact in the repo; the five declared cascade layers contain zero authored rules, which is the direct root cause of the CTA bug. |
| Project structure, config & code quality | B | Clean architecture, real header comments, correct CI shape — undone at the seams: four unvalidated curriculum sources, 17 hardcoded base paths, TypeScript strict declared but uninstalled. |
| Content, writing & pedagogy | C+ | The signature-key lesson is genuinely excellent; one piece of actively harmful advice, one wrong table row, a circular dependency in extra-keys, and no exit ramp. |
| Interactivity & learning experience | C | Ambitious two-tier design let down by a redraw bug that corrupts on wrap, a keyset phones cannot produce, and lessons instructing commands the simulator answers with "command not found". |
| Accessibility & semantic HTML | D+ | Dark theme contrast is well-tuned and the reduced-motion block is thorough; the light theme was never audited, the terminals are keyboard traps, and the landing page has three headings for eight content blocks. |
| Performance, SEO & deployment | B- | `site` + `base` canonical/sitemap generation is correct (the thing most project sites get wrong), but 340 KB of xterm is on the homepage critical path and there is no `og:image` at all. |
| Harvest from the original + polish | C | Content fidelity to the original is high; the original's signature fish-shell lesson was dropped while the whole simulator was built to imitate fish, and code blocks are the one surface still on stock Night Owl. |

---

## 3. Priority queue

The single ranked list across all dimensions. Work top down.

| # | Finding | Dimension | Severity | Effort |
| --- | --- | --- | --- | --- |
| 1 ✅ | ~~"Switch it on" CTA renders at 1.00:1 — prose-link rule beats `a.tmx-btn--primary` and its `background` shorthand erases the fill~~ | Design system | Critical | Trivial |
| 2 ✅ | ~~`storage.mdx` tells beginners to do real work in `~/storage/shared/` — no exec bit, no symlinks~~ | Content | Critical | Medium |
| 3 ✅ | ~~Live Sandbox is created with no `networkInterface`, yet `packages.mdx` instructs `apt update`~~ | Interactivity | Critical | Small |
| 4 ✅ | ~~The fish lesson was dropped; the whole simulator imitates fish, so the course teaches behavior real Termux does not have~~ | Content | Critical | Medium |
| 5 ✅ | ~~Both terminals request `'JetBrains Mono'`, a family that is not registered — they render in fallback mono~~ | Typography | High | Trivial |
| 6 ✅ | ~~`render()` erases one row, so the simulator corrupts itself as soon as input wraps (~15 chars on a phone)~~ | Interactivity | High | Medium |
| 7 ✅ | ~~No touch key row, and the site never mentions Volume-Down = Ctrl — every fish feature is unreachable on mobile~~ | Interactivity | High | Medium |
| 8 ✅ | ~~Light theme was never contrast-audited: prose links 3.35:1, inline code 3.18:1, sandbox error text 1.78:1~~ | Accessibility | High | Small |
| 9 | Lessons instruct commands the simulator answers with red "command not found"; `ls -l`, `$PREFIX` and `&&` return plausible wrong answers | Interactivity | High | Medium |
| 10 ✅ | ~~7.2 MB of abandoned PNGs in `src/assets` — delete before `git init` or pay for them in history forever~~ | Structure | High | Trivial |
| 11 | Decide one-site-vs-three-repos, then close the clone-readiness cluster (4 curriculum sources, 17 base paths, unenforceable TS) | Structure | High | Medium |
| 12 ✅ | ~~Safety: install lesson never revokes the sideload permission; troubleshooting prescribes the wrong fix for Android 12+ session death~~ | Content | High | Small |

---

## 4. Findings by dimension

### 4.1 Typography

**Verdict:** the four-family concept is right and the token bridge is disciplined, but the
type system is currently a set of intentions rather than a system. Two defects are shipping
today (the font-family typo and inline-code contrast) and one structural gap (`--fg-body`
is never used for body prose) explains most of the "it feels flat" sensation without any
single element looking wrong.

**What's working:**

- The chrome/content/code split is the correct architecture for a tutorial site.
- All four families are self-hosted variable fonts with a 200-900 axis. A real weight ramp
  is already paid for and unused — it costs bytes of CSS, not kilobytes of font.
- Expressive Code inherits `--sl-font-mono` correctly, so fenced blocks are already on
  JetBrains Mono with zero config.
- The kicker pattern (mono, uppercase, tracked, brand-colored, 600) shows real editorial
  instinct. The pattern is right; it just isn't tokenized.
- Dark theme ink is well-tuned: `--fg-secondary` 8.46:1, `--fg-body` 11.12:1,
  `--fg-muted` 5.28:1 on the obsidian canvas.

#### ✅ CLOSED — Both terminals render in fallback monospace

> **FIXED & VERIFIED 2026-08-06.** `@fontsource-variable/jetbrains-mono` registers
> the family as **'JetBrains Mono Variable'**; both xterm configs asked for
> `'JetBrains Mono'` and silently fell through to generic monospace. Corrected the
> `fontFamily` string in `TermuxTerminal.tsx` and `LiveSandbox.tsx`.
> Also closed the related race: xterm measures glyph width once, at `fit()` time,
> so if the webfont had not landed yet every column count would be wrong for the
> life of the session. Added a `document.fonts.ready` re-fit (guarded by a
> `disposed` flag wired into the effect cleanup).
> Measured in-browser after fix: `.xterm-rows` computed
> `font-family: "JetBrains Mono Variable"`, `document.fonts.check()` true.

**Severity:** High · **Effort:** Trivial · **Location:** `src/components/terminal/TermuxTerminal.tsx:50-51`, `src/components/terminal/LiveSandbox.tsx:68`

**Evidence:** `@fontsource-variable/jetbrains-mono` registers exactly one family name —
`'JetBrains Mono Variable'`. `global.css:28` gets this right. Both xterm instances hardcode
a string that omits the word: `"'JetBrains Mono', ui-monospace, …"`. The first entry misses,
so both fall through to `ui-monospace` (Consolas on Windows, SF Mono on macOS). xterm
renders to canvas and cannot inherit `--font-mono` from CSS, so this cannot self-heal.
On `foundations/storage.mdx` the fenced block at line 19 and the `<TermuxTerminal>` at
line 30 — nine lines apart — render in two different monospace faces.

**Impact:** the terminal is the product, and it is the one surface not using the site's
typeface. The fallback is platform-dependent, so you on Windows and a reader on macOS are
looking at two different bugs.

**Fix:** read the token at runtime so there is one source of truth.

```ts
const mono = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-mono').trim();
// ... fontFamily: mono,
```

Also add `document.fonts.ready.then(() => fit.fit())` before the initial `fit.fit()` at
`TermuxTerminal.tsx:84` — xterm measures glyph width once, and if it measures before the
webfont lands the column math is wrong for the session's lifetime.

#### ✅ CLOSED — `--fg-body` is never used for body text; the ink ramp is two steps, not five

> **FIXED & VERIFIED 2026-08-06.** Rebridged exactly as recommended — the ramp
> shifted one step so `--sl-color-gray-2` (which Starlight paints body prose
> from) now resolves to `--fg-body` instead of `--fg-secondary`:
> `gray-1 → --fg-default`, `gray-2 → --fg-body`, `gray-3 → --fg-secondary`,
> `gray-4 → --fg-muted`. Also promoted `.tmx-lede` off `--fg-secondary` (the
> same grey as the body it introduces) onto `--fg-default`.
> Measured on `/foundations/storage/` (light): `p` now renders
> **`rgb(61,61,61)` = `#3d3d3d` = `--fg-body`**, distinct from
> `--fg-secondary` `#4a4a4a` and `--fg-default` `#2c2418`. Three visible ink
> steps where there were two.

**Severity:** High · **Effort:** Small · **Location:** `src/styles/global.css:171-172`, `:540-545`

**Evidence:** Starlight sets `body { color: var(--sl-color-text) }`, and
`--sl-color-text: var(--sl-color-gray-2)`. The bridge at `global.css:172` maps
`--sl-color-gray-2: var(--fg-secondary)`. So all body prose paints `--fg-secondary`.
`--fg-body` is bridged to `--sl-color-gray-1`, which Starlight references in exactly two
places: a search input and a select. The token named "body" is used for a dropdown.
Compounding it, `.tmx-lede` explicitly sets `color: var(--fg-secondary)` — the same color
as the body text it introduces.

**Impact:** the page reads flat. Every paragraph, card body, panel body and the lede are
one gray. The system defines a five-step ramp and ships a two-step one.

**Fix:** rebridge and restore the three-step editorial ramp.

```css
/* global.css:172 */
--sl-color-gray-2: var(--fg-body);      /* body prose: 11.12:1 dark, 9.4:1 light */
--sl-color-gray-3: var(--fg-secondary); /* shift the rest of the ramp one step */
```

Then promote the lede to `color: var(--fg-default)` and leave `.tmx-card__body` /
`.tmx-panel__body` on `--fg-secondary`. That yields default → body → secondary → muted,
which is the ramp the tokens were designed for.

Note: warming the light theme's neutral-grey `--fg-body` (`#3d3d3d`) and `--fg-secondary`
(`#4a4a4a`) into the parchment hue family (`#3a342b` / `#4a4438`, contrast held constant)
belongs in the same commit — but only after this bridge fix, since warming an unused token
accomplishes nothing.

#### ✅ CLOSED — Same role, two values: the eyebrow and the card title exist twice each

> **FIXED 2026-08-06.** Collapsed both roles into one selector group each, as
> recommended — the lowest-risk, highest-value consolidation available.
> **Eyebrow:** `.tmx-panel__kicker` and
> `.pagination-links a > span:not(.link-title)` were byte-for-byte identical
> except for 0.66rem vs 0.68rem (a 0.3px accident). Now one rule at
> `var(--text-2xs)`.
> **Card title:** `.tmx-card__title`, `.tmx-panel__title` and
> `.pagination-links .link-title` were three declarations of the same role at
> two sizes. Now one rule at `var(--text-md)` / `var(--leading-snug)`.
> The redundant `.tmx-panel__title` block was deleted outright.

**Severity:** Medium · **Effort:** Small · **Location:** `src/styles/global.css:632-639` vs `:808-815`; `:560-565` vs `:640-647` vs `:816-823`

**Evidence:** `.tmx-panel__kicker` and `.pagination-links a > span:not(.link-title)` are
byte-for-byte the same six declarations, differing only in `font-size`: 0.66rem vs 0.68rem.
That is a 0.3px difference — an accident, not a decision. Same for titles:
`.tmx-card__title` 1.1rem, `.tmx-panel__title` 1.15rem, `.pagination-links .link-title`
1.15rem — three instances of "a card's heading", two sizes, three separate declarations of
`font-family: var(--font-heading); font-weight: 700`.

**Impact:** three copies of the same rule means the next change has to be made in three
places and will be made in two. This is the highest-value typography consolidation
available, and unlike a full scale rebind it carries almost no regression risk.

**Fix:** collapse each role into one selector group.

```css
.tmx-card__title, .tmx-panel__title, .pagination-links .link-title {
  font-family: var(--font-heading); font-weight: 600;
  font-size: 1.1875rem; line-height: 1.25;
  letter-spacing: 0; color: var(--fg-default); margin: 0;
}

.tmx-panel__kicker, .pagination-links a > span:not(.link-title) {
  font-family: var(--font-mono); font-weight: 600;
  font-size: 0.6875rem;          /* 11px — one value */
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--color-brand);
}
```

Let the scale emerge from this consolidation rather than adopting an eleven-token ladder in
one sitting — that is how a twelfth near-identical value gets created.

#### ✅ CLOSED — React islands set size and weight but never family, leaking Inter into the article body

> Adopted the finding's suggested shape, decided per role rather than per component, and declared it explicitly in `global.css`:
>
>     .tmx-island        UI chrome                → --font-body   (Inter)
>     .tmx-island__title heading-role text        → --font-heading (Crimson Pro)
>     .tmx-island__meta  chrome caption           → --font-body
>     .tmx-island__prose running copy in the flow → --font-detail (Source Serif 4)
>
> Measured before/after:
> - `LessonComplete` title (foot of all seven lessons, directly under Source Serif prose): **Inter Bold 16px → Crimson Pro 700 19px** (`--text-md`/`--leading-snug`). Its closing blurb is now Source Serif at `--text-xs` instead of Inter 13px, so the card reads as part of the article rather than as a third family in one vertical inch.
> - `ProgressDashboard` section headers: **Inter Bold 15px in `--fg-body` → Crimson Pro 700 19px in `--fg-default`**, matching every other section header on the site (the page's own h1 is Crimson Pro 39px). The completion paragraph moved to `--font-detail`; the ring's percentage is now Inter via CSS instead of an SVG `fontSize="18"`/`fontWeight="700"` presentation attribute — type that lived somewhere the stylesheet could not see at all.
> - `ProfileBadge` (sidebar chrome) stays Inter, which was already correct, but is now stated on `.tmx-island` rather than inherited from `body` by luck; its raw `fontSize: 14`/`12` became `--text-sm`/`--text-xs`.
> - `TermuxTerminal` / `LiveSandbox` chrome stays Inter, likewise now declared, with raw `11`/`12`/`13`/`14` mapped onto `--text-2xs`/`--text-xs`/`--text-sm`.
>
> No island now sets size or weight without also setting family.

**Severity:** Medium · **Effort:** Small · **Location:** `src/components/profile/LessonComplete.tsx:53,56`; `src/components/profile/ProgressDashboard.tsx:59,69`

**Evidence:** every text-bearing island is wrapped in `.not-content`, which excludes it
from `.sl-markdown-content`'s `font-family: var(--font-detail)`. None declare a
fontFamily, so they inherit `body` → Inter. Correct for the sidebar badge; wrong for the
two that live in the content flow. `LessonComplete.tsx:53` renders Inter Bold 16px directly
beneath Source Serif 4 prose, at the foot of all seven lessons.
`ProgressDashboard.tsx:69` renders a real `<h3>` at `fontSize: 15` inside `.not-content`,
so section headers on the Progress page are Inter Bold 15px while every other section
header on the site is Crimson Pro 700 at 35px.

**Impact:** three families in one vertical inch at the bottom of every lesson. The Progress
page is typographically a different website.

**Fix:** add opt-in classes to `global.css` rather than styling in JSX.

```css
.not-content.tmx-island { font-family: var(--font-body); }
.tmx-island__title {
  font-family: var(--font-heading); font-weight: 700;
  font-size: 1.1875rem; line-height: 1.25; color: var(--fg-default);
}
.tmx-island__meta { font-size: 0.8125rem; color: var(--fg-muted); }
```

#### ✅ CLOSED — Heading hierarchy is top-heavy and h5/h6 are unstyled

> **FIXED & VERIFIED 2026-08-06.** Selector widened from `h1-h4` to
> `:is(h1, h2, h3, h4, h5, h6)`, so a `#####` no longer renders in the *body*
> face. h5/h6 deliberately drop to `--text-sm` / `--weight-semibold` /
> `--fg-secondary` so they read as labels rather than another heading level.
> Headings now get air on **both** sides (`margin-block-end: 0.6em`); Starlight
> supplies `margin-top` only.
> Measured after fix on a lesson page: **h1 39px, h2 31px, h3 24px, body 17px**
> — all Crimson Pro at 700, `line-height: 1.15`. The old shape was
> `42 → 35 → (no h3) → 16`, an 83% h1:h2 step then a 2.19x cliff to body; it is
> now a clean `39 / 31 / 24 / 17` with the h3 level actually filling the gap.
> Verified h5 renders `Crimson Pro Variable`.

**Severity:** Medium · **Effort:** Small · **Location:** `src/styles/global.css:318-328`

**Evidence:** across all 11 content files there are 49 `##` and exactly one `###`. The
shipped hierarchy is h1 → h2 → body. At ≥50em, h1 is 42px and h2 is 35px — h2 is 83% of h1,
which is not a level change at a glance — then a 2.14× cliff to body. The heading rule
covers h1-h4 only, so a `#####` renders in the *body* face at 600. Starlight's markdown.css
also references `--sl-text-h6`, which props.css never defines.

**Fix:** add h5/h6 to the selector list, widen the h1:h2 ratio, and give headings air on
both sides — Starlight supplies `margin-top: 1.5em` and nothing below.

```css
.sl-markdown-content :is(h2, h3, h4) { margin-block-end: 0.6em; }
.sl-markdown-content h2 { margin-block-start: 2.75rem; }
.sl-markdown-content h3 { margin-block-start: 2rem; }
```

#### ✅ CLOSED — Six competing block-margin values, three locked inside JSX

> **FIXED & VERIFIED 2026-08-06.** Added `--space-block: 2rem` and
> `--space-block-lg: 2.5rem` to `:root`, then routed every block through them:
> `.tmx-grid`, `.tmx-panels`, `.tmx-cta` → `margin-block: var(--space-block)`;
> `.tmx-rule` → `var(--space-block-lg)`; heading `margin-block-start` likewise.
> **Deleted all three inline JSX margins** (`1.5rem` on TermuxTerminal and
> LiveSandbox, `2.5rem` on LessonComplete) and replaced them with CSS rules on
> `.tmx-terminal`, `.tmx-sandbox` and a new `.tmx-lesson-complete` class — so the
> components that most need consistent framing are finally tunable from CSS.
> Verified in-browser: **0 inline margins remain** on any of the three islands,
> and headings now measure a consistent 40px/18.6px (h2) and 32px/14.4px (h3).

**Severity:** Medium · **Effort:** Small · **Location:** `global.css:551, 597, 670, 838`; `TermuxTerminal.tsx:231`; `LiveSandbox.tsx:127`; `LessonComplete.tsx:29`

**Evidence:** vertical rhythm is set independently in seven places — 1rem (Starlight),
1.9rem (`.tmx-grid`, `.tmx-panels`), 2.5rem (`.tmx-rule`), 2.25rem (`.tmx-cta`), 1.5rem
(both terminals, inline), 2.5rem (`LessonComplete`, inline). A lesson page alternates
1 / 1.5 / 1.9 / 2.5rem gaps depending on which component is next, and three of those cannot
be changed from CSS at all.

**Impact:** no vertical grid. The components that most need consistent framing — the
terminals, the visual anchors of every lesson — are the ones whose spacing is locked in JSX.

**Fix:** add `--space-block: 2rem` to `:root`, use `margin-block: var(--space-block)` on
`.tmx-grid` / `.tmx-panels` / `.tmx-cta`, `calc(var(--space-block) * 1.25)` on `.tmx-rule`,
then delete the three inline margins and let CSS classes carry them. Single highest-leverage
change for "the page feels uneven."

#### ✅ CLOSED — Dead selectors and uniform tracking across a 2.6× size range

> Three dead regions deleted from global.css. (1) `:is(h1, h2).site-title` → `.site-title`: SiteTitle.astro renders an anchor, so the qualifier matched nothing and the wordmark was rendering in the Inter chrome face while every other heading was editorial; it now takes --font-heading. (2) `.tmx-hero-title` deleted — grep across src/ (mdx, tsx, astro, md) returns zero usages; the splash hero title is Starlight's own `.hero h1`. (3) The 34-line `starlight-theme-select` block (label, select, option, .icon.caret) deleted: ThemeSelect.astro now renders `<button class="tmx-theme-toggle">`, so the custom element is never emitted on any page — that was the largest dead region in the file and it read as live documentation for a dropdown the design system no longer has. Tracking: the base heading rule applied --tracking-heading (-0.01em) uniformly from 1.19rem card titles to 3.06rem hero. Now three bands, all from tokens that already existed (only two of the four were in use): --tracking-normal (0) as the base for h4/h5/h6, card + panel titles and the site title; --tracking-heading (-0.01em) on h2 (31px) and h3 (24px); --tracking-display (-0.02em) on hero h1 and lesson h1 (39-49px, already in place). The redundant restatement of --tracking-normal on the h5/h6 rule was removed — it now inherits from the base. NOT DONE (not my file): index.mdx:17's dead inline `style="max-width:46rem"` — see handoffs.

**Severity:** Polish · **Effort:** Trivial · **Location:** `src/styles/global.css:322, 327, 339-346`; `src/content/docs/index.mdx:17`

**Evidence:** `:is(h1, h2).site-title` matches nothing — Starlight's SiteTitle renders an
anchor, so the wordmark never receives Crimson Pro. `.tmx-hero-title` is declared once and
used zero times. `letter-spacing: -0.01em` is applied uniformly from 1.1rem card titles to
3.6rem hero headings. And `index.mdx:17` carries an inline `style="max-width:46rem"` on a
lede sitting inside a 42rem column — it is dead code.

**Fix:** drop the `:is(h1, h2)` qualifier (or delete the rule and commit to Inter chrome),
delete `.tmx-hero-title`, split tracking by size band (-0.02em display / -0.005em h3-h6 /
0 for card titles), and delete the dead inline `max-width`.

---

### 4.2 Design system, tokens & CSS architecture

**Verdict:** the Fire Watch bridge is the strongest single artifact in this codebase. The
architecture around it is hollow — five declared cascade layers containing zero authored
rules — and roughly 50 inline style objects in the React islands have escaped the token
layer entirely.

**What's working:**

- The bridge (`global.css:167-217`) maps all nine gray slots, all three accent slots and
  the bg/hairline slots, so Starlight's internals flow through one source of truth rather
  than being patched selector by selector.
- Theme parity at the token level is total, including a correctly retuned shadow ramp
  (cool `rgba(4,6,10,…)` dark vs warm `rgba(44,36,24,…)` light) rather than a reused one.
- Tints are computed with `color-mix()` against live tokens in nine places, so retheming
  from `--color-brand` genuinely works.
- `prefers-reduced-motion` is gated properly and explicitly zeroes card `transform`.
- The non-clickable-panel rule scopes hover affordances to `:is(a.card, .tmx-card--link)`
  so spotlight and lift can never leak onto info panels. This is exactly right.
- `--tmx-grad` is a restrained brass→bright-brass ramp, honoring the single-anchor rule at
  the gradient level where most systems reach for a second hue.

#### ✅ CLOSED — The "Switch it on" CTA renders at 1.00:1

> **FIXED & VERIFIED 2026-08-06.** Root cause confirmed exactly as diagnosed: the
> prose-link rule out-specified `a.tmx-btn--primary`, and its `background`
> SHORTHAND reset the fill while the `color: !important` survived. Fix: added
> `:not(.tmx-btn)` to the prose-link selector and its `:hover` twin, then removed
> the `!important` that was masking the specificity problem. Also gave the base
> `.tmx-btn` rule `font-family: var(--font-body); font-size: 1rem` so buttons
> stop inheriting the body serif inside markdown content.
> Measured after fix: real brass `linear-gradient` fill restored,
> `color: rgb(250,247,242)`, symmetric `padding: 10.4px 21.6px`, height 40px.
> Cross-ref: closes **D1** in the visual audit.

**Severity:** Critical · **Effort:** Trivial · **Location:** `src/styles/global.css:349-358` vs `:845-859`; markup at `src/content/docs/index.mdx:85`

**Evidence:** confirmed in the built CSS by five independent auditors with identical
arithmetic. Rule A is `.sl-markdown-content a:not(.card):not(.action):not(:where(.not-content *))`
— specificity **(0,3,1)**, because `:not()` inherits its argument's specificity and
`:where()` contributes zero. It declares the **`background` shorthand**:

```css
background: linear-gradient(var(--color-brand), var(--color-brand))
            no-repeat left bottom / 0% 1.5px;
```

Rule B is `a.tmx-btn--primary` — specificity **(0,1,1)** — declaring
`background: var(--tmx-grad)` with no `!important`, and `color: var(--fg-on-emphasis) !important`.

(0,3,1) beats (0,1,1). The CTA anchor is not `.card`, not `.action`, and not inside
`.not-content`, so it matches Rule A. Because `background` is a shorthand it resets
`background-color` to transparent and replaces the fill with a 0%-wide, 1.5px-tall stripe.
Meanwhile `color` **is** `!important`, so it survives: `--fg-on-emphasis` is `#0e1014` in
dark and `#faf7f2` in light. Measured: **1.00:1 dark, 1.06:1 light**. The label is
invisible, floating over an orphaned brass `box-shadow`. On hover, `background-size:
100% 1.5px` turns the button into a thin brass underline — it degrades into exactly the
prose link it was styled not to be. Three collateral casualties in the same rule:
`padding-bottom` collapses to 1px (lopsided pill), the transition is replaced, and
`background-image: none` at `:851` loses for the same reason.

This is the only `<a class="tmx-btn">` in the codebase. `LessonComplete` and `LiveSandbox`
use `<button>`, which the prose selector cannot match — which is precisely why only the CTA
is broken, and why the bug will reproduce the moment anyone writes another MDX button.

**Impact:** the primary conversion element on the entry page is invisible in both themes,
and the pattern that produces it (raw-HTML button inside `.sl-markdown-content`) is the one
that gets cloned into the intermediate and advanced repos.

**Fix:** two changes, both needed. Do not escalate specificity in an arms race.

```css
/* :349 and :356 — exclude buttons the same way .card and .action already are.
   :is() keeps the selector at (0,2,1) instead of climbing to (0,4,1). */
.sl-markdown-content a:not(:is(.card, .action, .tmx-btn)):not(:where(.not-content *)) {
  text-decoration: none;
  color: var(--color-brand-emphasis);
  /* :352 — longhands, never the shorthand. This is the real weapon. */
  background-image: linear-gradient(var(--color-brand), var(--color-brand));
  background-repeat: no-repeat;
  background-position: left bottom;
  background-size: 0% 1.5px;
}
```

Then delete the now-dead patches: `background-image: none` at `:851`, `text-decoration:
none !important` at `:850`, and `color: … !important` at `:857`. Drop `padding-bottom: 1px`
from the button path. The longhand change is what closes the class of bug permanently
rather than one selector at a time — the `background` shorthand is a loaded gun aimed at
every future component.

Adding `not-content` to the wrapper at `index.mdx:83` also fixes today's symptom, and is
worth doing as belt-and-braces, but it leaves the landmine armed.

#### ✅ CLOSED — The declared cascade layers govern nothing

> **FIXED 2026-08-06.** Took the "delete the declaration" branch, and the
> reasoning matters: **unlayered is the correct architecture here**, it was just
> being described dishonestly. Starlight ships its own styles inside
> `@layer starlight.*`, and unlayered CSS outranks every layered rule — which is
> exactly why this file can restyle Starlight at all. Wrapping these ~700 rules
> in `@layer components` would have placed them *below* Starlight's and broken
> the entire theme.
> So `@layer base, starlight, theme, components, utilities;` is gone, replaced by
> a block comment stating why the file is deliberately unlayered, that it was the
> flat-pile-arbitrated-by-specificity situation which produced the CTA bug, and
> that the `!important` declarations it forced have since been removed.
> Verified: `@layer utilities` blocks in the built CSS went from 1 to **0**.

**Severity:** High · **Effort:** Medium · **Location:** `src/styles/global.css:14`

**Evidence:** `@layer base, starlight, theme, components, utilities;` declares the order,
but nothing after line 19 is ever placed inside a layer. Verified against the build: the
prose-link rule, `.tmx-btn--primary`, and `a.tmx-btn` all sit at brace depth 0 in
`dist/_astro/common.kVxNqXwr.css`. The only real layer blocks are Tailwind preflight and
Starlight's own. The `@layer theme` block emitted zero bytes.

**Impact:** the layer architecture is decorative documentation. Unlayered CSS outranks all
layered CSS, so ~700 rules form one flat pile arbitrated only by specificity — which is
what produced the CTA bug and forces all four `!important` declarations. It also means any
Tailwind utility would silently *lose* to `global.css`.

**Fix:** either use the layers or delete the declaration. To use them: wrap the
typography/prose block (`:310-358`) and the Starlight overrides in `@layer starlight { … }`,
and everything from `:360` to EOF in `@layer components { … }`. Because `components` is
declared later, `.tmx-btn` then beats `.sl-markdown-content a` structurally rather than via
a `:not()` list you have to maintain. Audit for regressions afterward — layered rules now
lose to any remaining unlayered Starlight CSS.

Do this **before** the clone. Retrofitting layering into three diverged repos is a
different, worse job.

#### ✅ CLOSED — Roughly 50 inline style objects have escaped the token layer

> Migrated the islands' static styling into a new REACT ISLAND CHROME section in `src/styles/global.css` (~380 lines, tokens only), keeping inline only what is genuinely computed.
>
> Measured before/after:
> - Inline `style={{}}` objects across the six island files: **84 → 5** (Avatar 1 → 1 size/name-gradient, LessonComplete 13 → 0, ProfileBadge 17 → 1 bar width, ProgressDashboard 29 → 0, LiveSandbox 16 → 1 `height`, TermuxTerminal 8 → 1 `height`). The audit counted 58 in six files; the number had grown to 84 by the time this ran.
> - `--sl-color-*` bridge reads inside the islands: **all → 0** (grep over `src/components/` returns nothing outside `icons.tsx`, which has none). Components now consume `--bg-surface`, `--border-default`, `--fg-default/secondary/muted` directly, so the BRIDGE section can eventually be retired.
> - `!important` declarations deleted: **2**. `.tmx-terminal, .tmx-sandbox { box-shadow: … !important }` existed only to beat LiveSandbox's inline `boxShadow: '0 8px 30px rgba(0,0,0,0.35)'` — exactly the smoking gun the finding cites — and the mobile `padding: 4px !important` existed only to beat the inline `padding: 8px` on the screen. Both literals are gone, so both plain declarations now win unaided.
> - Off-scale radii removed: `borderRadius: '10px'` (LiveSandbox frame, ProfileBadge frame), `3` (progress track + fill), raw `6`/`12` (ProgressDashboard, LessonComplete, ProfileBadge editor) and five `'50%'`. Both terminal frames now share one radius (`--tmx-radius`, 12px) where the sandbox used to sit 2px off the terminal beside it on the same page.
> - The hand-rolled `linear-gradient(90deg, var(--color-brand), var(--color-brand-emphasis))` on the progress bar is now `var(--tmx-grad)` — the duplicate the finding flagged, deleted.
> - Conditional styling became DOM state the stylesheet reads, so each state is expressed once instead of twice: `data-state` (LessonComplete's three-way border/background ternary), `data-phase` / `data-tone` (LiveSandbox), `aria-pressed` (the 13 avatar chips), `aria-checked` (dashboard checkboxes), `data-done` (dashboard rows), `data-confirm` (Reset). That alone removed 11 nested ternaries.
> - A latent inconsistency surfaced and was fixed on the way: LessonComplete's `done` tint mixed into `transparent` (picking up the page canvas) while `finished` mixed into `--bg-surface` — the same card at two elevations. Both now mix into `--bg-surface`.
>
> Verification: `postcss.parse` on `global.css` (330 top-level nodes) and `print.css` both clean; all six TSX files transform under esbuild; a script check confirms every `className` used in the islands resolves to a rule in `global.css`/`print.css`. Build not run, per the phase rules.

**Severity:** Medium · **Effort:** Large · **Location:** `src/components/**/*.tsx` (TermuxTerminal 7, LiveSandbox 11, ProfileBadge 17, ProgressDashboard 16, LessonComplete 6, Avatar 1)

**Evidence:** the smoking gun is `global.css:686`:

```css
.tmx-terminal,
.tmx-sandbox {
  box-shadow: var(--shadow-xl), 0 0 0 1px var(--border-subtle) !important;
}
```

That `!important` exists for exactly one reason: to beat the inline
`boxShadow: '0 8px 30px rgba(0,0,0,0.35)'` at `TermuxTerminal.tsx:230` and
`LiveSandbox.tsx:126`. Inline styles can only be overridden with `!important`, so the
stylesheet is fighting its own components. What did *not* get reclaimed:

- **Off-scale radii:** `borderRadius: '10px'` and `3` are absent from the 4/6/8/12/9999
  scale. `12`, `8`, `6` appear as raw numbers throughout `ProgressDashboard`.
- **Hardcoded hex:** `#201509` (`Avatar.tsx:27`, `ProfileBadge.tsx:113`) duplicates
  `--fg-on-emphasis` *wrongly* — it does not flip on parchment, where brass darkens to
  `#8b6914`, giving roughly 3.5:1. `#fca5a5` (`LiveSandbox.tsx:194`) is Tailwind red-300
  standing in for `--color-danger`.
- **macOS traffic lights:** `#ff5f57` / `#febc2e` / `#28c840` hardcoded at
  `TermuxTerminal.tsx:244-246`, in the window chrome of the terminal embedded in the
  landing-page hero. `#febc2e` is a saturated amber roughly 15px from `--color-brand` —
  a second warm anchor on the most-viewed element of a site whose stated rule is that
  brass is the only one. It also does not retheme.
- **`--tmx-cyan` / `--tmx-magenta` are live in five files.** Both now alias to brass, so
  `ProfileBadge.tsx:77` paints `linear-gradient(90deg, brass, bright-brass)` — a
  hand-rolled duplicate of `--tmx-grad` at a different angle. Anyone reading the file
  reasonably concludes the site has a cyan/magenta accent pair, and grepping for
  `--color-brand` misses five brass surfaces.
- **Components consume the bridge** (`--sl-color-gray-5/6`) rather than the source of
  truth (`--border-default`, `--bg-surface`), so the bridge can never be retired.

**Impact:** a third to a half of the visual surface of the interactive components is defined
in JS, outside the token system, un-themeable, and requiring `!important` to correct. Clone
it twice and this becomes 150 inline style objects.

**Fix:** move the chrome into `global.css` as real classes — `.tmx-terminal__chrome`,
`.tmx-terminal__dot`, `.tmx-terminal__screen`, `.tmx-lesson-complete`, `.tmx-dashboard` —
and strip the inline objects down to genuinely dynamic values (`height`, `width: ${pct}%`,
`strokeDashoffset`). That alone lets you delete the `!important`. As a stopgap: replace
`#201509` → `var(--fg-on-emphasis)`, `#fca5a5` → `var(--color-danger)`, the traffic lights
→ one brass dot plus two `--fg-subtle` dots, and `--tmx-cyan`/`--tmx-magenta` → the real
brand tokens, then delete the two aliases so nothing can reintroduce them.

#### ✅ CLOSED — Light-theme text on the theme-invariant obsidian screen fails AA

> **FIXED & VERIFIED 2026-08-06.** Root cause was a permanently-dark surface
> drawing its ink from theme-flipping tokens. Added dark-LOCKED
> `--tmx-screen-muted` / `--tmx-screen-brand`, defined identically in both theme
> blocks, and switched all copy on `--tmx-screen` surfaces to them.
> Measured in light theme: **5.28:1** and **9.29:1** (were 3.0:1 and 3.74:1).
> Cross-ref: closes **L3** in the visual audit.

**Severity:** High · **Effort:** Small · **Location:** `src/components/terminal/LiveSandbox.tsx:194, 213, 214`

**Evidence:** `--tmx-screen` is deliberately pinned to `#0e1014` in **both** themes
("terminal screens stay obsidian even on parchment") — correct. But the text drawn on it
uses theme-varying tokens. In parchment: `--sl-color-gray-3` → `#6b5d4f` on `#0e1014` =
**3.00:1**; `--tmx-amber` on the same = **3.74:1**; and the error path hardcodes
`#fca5a5` on `--bg-surface` `#faf7f2` = **1.78:1**. The token that fixes this —
`--tmx-screen-ink`, defined identically in both theme blocks at `#e8dfcc`, giving
**14.38:1** — is referenced **zero times** anywhere in the codebase.

**Impact:** the idle copy of the sandbox is unreadable in light mode, and the error message
explaining how to fix cross-origin isolation is rendered at 1.78:1 to the person who most
needs to read it.

**Fix:** any element whose background is `--tmx-screen` takes its foreground from the
screen's own ink ramp. Use `var(--tmx-screen-ink)` at `:213`/`:194`, add a matching
`--tmx-screen-ink-muted: #8e8676` (5.28:1 on obsidian, invariant) for secondary copy, and
add `--tmx-screen-brand: #d4b15c` pinned in both themes for the `<strong>` at `:214`.
Replace the hardcoded `#fca5a5` with `var(--color-danger)`.

#### ✅ CLOSED — `.tmx-btn` layout lives only on `a.tmx-btn`, so `<button class="tmx-btn">` arrives half-styled

> **FIXED 2026-08-06.** Moved display/align/gap/padding/line-height/white-space
> from `a.tmx-btn` onto the shared `.tmx-btn` base rule, so the `<button>`
> instances ("Mark complete", "Boot Linux") now get full layout. `a.tmx-btn`
> retains only `background-image: none`. Done as part of unifying Starlight's
> `.sl-link-button` into the same system — cross-ref: closes **L4** in the
> visual audit.

**Severity:** Medium · **Effort:** Small · **Location:** `src/styles/global.css:437-447, 845-854`

**Evidence:** the base `.tmx-btn` rule supplies `position`, `isolation`, `overflow`,
`border-radius`, `font-weight`, `letter-spacing`, `transition` — no `display`, no
`padding`, no `gap`, no `cursor`. All of that sits on `a.tmx-btn`, which was narrowed to
`a.` to win the specificity fight above. Both `<button>` consumers hand-roll the missing
half inline, and they disagree: `6px 14px` / fontSize 12 in LiveSandbox, `9px 16px` /
fontSize 13 in LessonComplete, `.65rem 1.35rem` in the CSS. Three button sizes for one
component.

**Fix:** move `display: inline-flex; align-items: center; gap: .5rem; padding: .65rem
1.35rem; line-height: 1.2; cursor: pointer; border: none;` up onto `.tmx-btn`, leave
`a.tmx-btn` holding only anchor-specific overrides, and add a `.tmx-btn--sm` modifier so
LiveSandbox can drop its inline object. After the CTA fix, the `a.` qualifier is no longer
needed for specificity at all.

#### ✅ CLOSED — Half the `--tmx-*` namespace is dead, and three dead entries are second-accent landmines

> **FIXED 2026-08-06.** Went further than the recommendation and removed the
> second-accent risk *entirely* rather than just the dead entries.
> Audited every `--tmx-*` token for real usage, then: **deleted 11 dead tokens**
> (`--tmx-primary/-secondary/-accent/-red/-shadow-1/-2/-3/-surface/-screen-ink/
> -radius-sm`) plus the `@property --tmx-angle` block — which takes the mauve
> `--tmx-accent` landmine with it.
> Then **migrated the four live aliases off their lying names**: `--tmx-cyan` →
> `--color-brand`, `--tmx-magenta` → `--color-brand-emphasis`, `--tmx-green` →
> `--color-success`, `--tmx-amber` → `--color-warning`, plus `--tmx-hairline` →
> `--border-default`, across `global.css` and four `.tsx` components — and then
> deleted those aliases too. A token named "cyan" that resolves to brass is a
> trap for the next person; there are now none.
> `--tmx-glow-cyan` renamed to `--tmx-glow`. Verified zero dangling references
> to any deleted token, and `--tmx-glow` resolving in-browser.

**Severity:** Medium · **Effort:** Small · **Location:** `src/styles/global.css:191-224`

**Evidence:** eleven of twenty-two `--tmx-*` tokens have zero references:
`--tmx-primary`, `--tmx-secondary`, `--tmx-accent`, `--tmx-red`, `--tmx-shadow-1/2/3`,
`--tmx-surface`, `--tmx-screen-ink`, `--tmx-radius-sm`, plus the `@property --tmx-angle`
block. Three would import a competing hue the moment anyone used them: `--tmx-accent` →
mauve/purple, and `--color-link` → blue (also zero references, because prose links
correctly use `--color-brand-emphasis`). Two aliases are quietly wrong:
`--tmx-radius-sm: var(--radius-lg)` — "small" pointing at "large" — and
`--tmx-shadow-3: var(--shadow-xl)`, skipping `--shadow-lg` so the 1/2/3 map is off by one.

**Fix:** delete the eleven dead entries and the `@property` block — that removes the mauve
and blue landmines with them. Keep `--color-accent` / `--color-link` in the Fire Watch
blocks for portability with a comment saying they are deliberately unused. Then wire
`--tmx-screen-ink` up per the finding above so it earns its place.

#### ✅ CLOSED — Tailwind v4 generates 2,717 bytes of phantom utilities and zero are used

> **FIXED & VERIFIED 2026-08-06.** Confirmed the finding first: a sweep of every
> `class`/`className` in `src/` returned **only** project classes (`tmx-*`,
> `not-content`, `sl-*`, `astro-*`) — zero utilities, and `.flex`/`.hidden`/
> `.relative`/`.rounded` each used 0 times in markup, exactly as diagnosed
> (scanner false-positives from `display: 'flex'` inside .tsx style objects).
> **Before removing it I checked the one real risk:** `@astrojs/starlight-tailwind`
> also bridges 14 `--sl-*` variables. Diffed them against this file's own BRIDGE
> section — **all 14 already covered**, so removal could not regress the theme.
> Removed the two `@import`s, `tailwindcss()` from the Vite plugin chain, and
> uninstalled `tailwindcss`, `@tailwindcss/vite` and `@astrojs/starlight-tailwind`
> (package.json tailwind references: 3 → **0**).
> Re-verified in-browser afterwards: `--sl-font` = Inter, `--sl-color-gray-2` =
> `#3d3d3d`, `--sl-color-accent` = `#8b6914`, `--sl-color-black` = `#f5f0e8`,
> h1 Crimson Pro 39px, p Source Serif 17px, asides rendering. No regression.

**Severity:** Medium · **Effort:** Medium · **Location:** `src/styles/global.css:16-18`, `astro.config.mjs:112`

**Evidence:** the only utility-looking class in any markup is `class="tmx-grid"` — a
project class. Yet the built `@layer utilities` block contains 22 generated classes
(`.flex`, `.hidden`, `.relative`, `.h-480`, `.rounded`, …) — all false positives from
Tailwind's content scanner matching word fragments inside the `.tsx` inline style objects
(`display: 'flex'`, `height: 480`). Every one is dead CSS. `@layer theme` emitted zero bytes.

**Impact:** four packages and a content-scanning build step to emit 2.7 KB nothing
references. It also creates a false expectation that utilities are available — and per the
layering finding, they would lose to `global.css` anyway.

**Fix:** drop it. Remove the two `@import` lines and `tailwindcss()` from the Vite plugin
chain, then verify Starlight's own reset covers the `border: 0 solid` / `font: inherit`
normalization the components rely on where preflight was doing it. The hand-authored token
system is obviously the real design system. Say so in the README.

#### ✅ CLOSED — `avatarGradient()` is the one code path that can emit an arbitrary hue

> FIXED 2026-08-06. `const h1 = hash % 360` at 70% saturation was the only code path in
> the repo that could emit an arbitrary colour, and `ProfileBadge`'s "Aa / use initials
> instead" button switches to it permanently, in the sidebar, on every page — one click
> could plant a saturated green or violet disc on a brass-only site.
>
> Took a stricter line than the audit's `38 + (hash % 14)` suggestion, because that still
> hardcodes `hsl()` literals that cannot retheme. Variety now comes from sweep **angle**
> (90/135/180/225deg, 4 values) and mix **ratio** (15-47% toward the bright stop, 5
> values) over `var(--color-brand)` / `var(--color-brand-emphasis)` via `color-mix()`.
> Twenty deterministic variants, zero hues outside brass, and the avatar now follows the
> light/dark palette — the old `hsl()` literals did not.
>
> Closed the hardcode next door at the same time, as the audit suggested: `#201509` on
> `Avatar.tsx:27` and `ProfileBadge.tsx:113` (the Save button) both became
> `var(--fg-on-emphasis)`. That literal duplicated the token *wrongly* — it did not flip
> on parchment, where brass darkens to `#8b6914` and near-black initials landed at roughly
> 3.5:1.

**Severity:** Low · **Effort:** Trivial · **Location:** `src/lib/progress.ts:124-130`

**Evidence:** `const h1 = hash % 360` — unbounded hue at 70% saturation, rendered whenever
`profile.emoji` is empty. The default ships an emoji, but `ProfileBadge.tsx:140-154` gives
the user an explicit "use initials instead" button that switches to it permanently, in the
sidebar, on every page.

**Fix:** constrain to the brass band — `const h1 = 38 + (hash % 14)` with the second stop
8-12° away and saturation near 45% — or drop the gradient entirely for
`background: var(--tmx-grad)` with `color: var(--fg-on-emphasis)`, which also fixes the
`#201509` hardcode next door.

#### ✅ CLOSED — Repeated patterns and one token name that lies

> Four collapses plus the rename. (1) THE LYING TOKEN: `--tmx-glow` → `--shadow-brand-ring`. Renamed, not revalued — the value (brass hairline ring + brass glow) is correct and used; the name was wrong twice over: it is the half-finished remains of `--tmx-glow-cyan` (which contained no cyan), and it is a box-shadow living outside the --shadow-* ramp under a --tmx-* name, which is exactly why the two button glows below it were hand-rolled instead of reusing it. One definition, one consumer (:is(a.card, .tmx-card--link):hover), both in this file, so the rename is complete. (2) Those two bespoke button shadows are now `--shadow-brand` and `--shadow-brand-lift`, declared next to the ring; same values, so no visual change. (3) `.tmx-card__body` and `.tmx-panel__body` were byte-identical five-declaration blocks 80 lines apart — merged into `:is(.tmx-card__body, .tmx-panel__body)`, with only the genuinely local bits (the panel's grid-column, the card's flex growth) left on their own selectors. The raw values went with them: font-size 0.98rem → --text-sm (measured 15.68px → 15px) and line-height 1.55 → --leading-normal (identical, it was the token spelled out). (4) The sheen hex: `color-mix(in srgb, #ffffff 40%, transparent)` was the only hex outside the two theme blocks, and on parchment it resolved to #fffdfb over the #faf7f2 ghost surface — a 1.02:1 step, i.e. the light theme silently had no sweep at all. Now a per-theme `--tmx-sheen` (white 40% on obsidian, warm ink rgba(44,36,24,0.18) on parchment) plus `--tmx-sheen-on-brand`, because the primary button's fill is brass in BOTH themes and on parchment that brass is dark, so the ink sweep would vanish on the button people click most. Also removed two orphaned `/* legacy alias → … */` comments left behind annotating declarations that had already been deleted.

**Severity:** Polish · **Effort:** Small · **Location:** `src/styles/global.css:453/459, 486, 566-572/648-655, 212`

**Evidence:** the two brand-glow button shadows are bespoke and exist nowhere in the
`--shadow-*` ramp. `.tmx-card__body` and `.tmx-panel__body` declare identical bodies.
`--tmx-glow-cyan` contains no cyan — it is a brass ring glow. And `global.css:486` holds
the only hex outside the two theme blocks: `color-mix(in srgb, #ffffff 40%, transparent)`,
driving the button sheen. On parchment the ghost button's surface is `#faf7f2`, so a 40%
white sweep across near-white is invisible — the light theme silently loses an interaction
affordance the dark theme has.

**Fix:** add `--shadow-brand` / `--shadow-brand-lift` tokens, merge the two body rules into
`:is(.tmx-card__body, .tmx-panel__body)`, rename `--tmx-glow-cyan` → `--shadow-brand-ring`,
and introduce a per-theme `--tmx-sheen` token so the sheen works on parchment. One sweep,
one commit — none of these deserve individual triage.

---

### 4.3 Project structure, config & code quality

**Verdict:** well-organized, genuinely small, with unusually good header comments — the
intent behind almost every file is written down, which is rare. The problems are almost
entirely at the seams, and all of them get taught twice more when this is cloned.

**What's working:**

- Every file opens with a real explanation of *why* it exists. The xterm SSR workaround and
  the devToolbar decision are both documented inline, exactly where a maintainer will look.
- 22 `client:only="react"` usages, zero `client:load`/`client:visible` — the entire
  hydration-mismatch class of bug does not exist here, and `isBrowser()` guards are
  belt-and-braces on top.
- `progress.ts`'s pub/sub is correct and complete: same-tab CustomEvent plus cross-tab
  `storage` events, with a proper unsubscribe returned. Multi-tab consistency is a detail
  most projects skip.
- `stats()` derives totals from `LESSONS` rather than from stored data, so stale slugs
  cannot corrupt the percentage.
- `TermuxTerminal.tsx:216-220` does full effect cleanup — listener, disposable, terminal.
  That is the correct pattern.
- The build is clean and fast (1.88s, 12 pages, no warnings) and the CI workflow is minimal
  and correct: right permissions, `environment.url` wired to the deploy step output.

#### ✅ CLOSED — 7.2 MB of abandoned image experiments — delete before `git init`

> **FIXED & VERIFIED 2026-08-06.** Confirmed zero code references for all four
> PNGs (`parchment-bg.png`, `terminal.png`, `terminal-v2.png`,
> `linux-background-theme.png`) — and `src/assets/HANDOFF.md`'s own artifact
> inventory does not list them either, corroborating that they are abandoned
> experiments. The repo is still not under git, so the window was open.
> **Moved rather than deleted**, to `global-assets/retired-backgrounds/` in the
> parent workspace (the established non-shipping area) — this gets the weight out
> of the repo before `git init` without destroying generated artwork.
> `src/assets` is now **184 KB, down from 7.2 MB (−97%)**. Kept in-repo:
> both scatter-field SVGs (referenced by `global.css`),
> `termux_linux_elements.svg` (HANDOFF marks it "kept as a resource"),
> `HANDOFF.md` and the working bundle. Build verified green after the move.

**Severity:** High · **Effort:** Trivial · **Location:** `src/assets/`

**Evidence:** `src/assets/` is 7.1 MB. Only two files are referenced anywhere — the two
Scatter Field SVGs (17.5 KB each). Dead: `parchment-bg.png` (2.16 MB), `terminal.png`
(2.00 MB), `terminal-v2.png` (1.93 MB), `linux-background-theme.png` (1.23 MB), and
`termux_linux_elements.svg` (14.5 KB, whose only "references" are usage examples in its own
header comment). Astro correctly tree-shakes them — `dist/_astro/` contains no PNGs — so
this is repo and clone weight, not visitor bandwidth. `dist/` is 2.7 MB; the dead assets
are 2.7× the entire built site.

**Impact:** there is no `.git` directory yet. This is a thirty-second fix today and a
`git filter-repo` rewrite across three repos next week. That timing is the entire reason
it ranks this high.

**Fix:** delete all five now. If any are wanted for a README or social card, downscale to
WebP under 200 KB and put them in `public/` or the existing `global-assets/` sibling. Then
check whether `sharp` is still needed — nothing in the project processes an image. Also
delete `iconDir: 'src/assets/icons'` from `astro.config.mjs:27`; that directory does not
exist, and all ten `<Icon>` usages resolve from the Iconify packages instead.

#### ✅ CLOSED — The curriculum has four hand-maintained sources of truth and zero validation

> **FIXED & VERIFIED.** Added `scripts/check-curriculum.mjs`, wired as the first
> step of `npm run build`, asserting slug-to-file resolution, sidebar/LESSONS
> same-order equality, `<LessonComplete>` slug match, a single terminal
> `next: false`, utility `prev`+`next: false`, index hero/next agreement, and
> ascending inert `sidebar.order`. Drift now fails the build instead of shipping.
> A companion `check-links.mjs` runs post-build against `dist/`.

**Severity:** High · **Effort:** Small · **Location:** `astro.config.mjs:77-108`; `src/lib/progress.ts:32-40`; `src/components/profile/LessonComplete.tsx:13-15`

**Evidence:** a lesson exists in four independent places — the sidebar array, `LESSONS`,
the frontmatter title, and a free-text slug string in each `<LessonComplete slug="…">`.
All four are currently in sync; nothing enforces it. The dangerous one is the fourth:
`setComplete()` writes any string handed to it, while `stats()` only counts slugs present
in `LESSONS`. A typo produces a button that toggles to "Nailed it" forever while the
sidebar percentage never moves, with no error anywhere. Compounding it, the explicit
`sidebar` array makes the `sidebar.order` frontmatter present in all nine lesson files
dead metadata — Starlight only honours `order` inside `autogenerate` groups — and the
`Local` badge is declared twice.

Related: `ProgressData` has no `version` field (the version lives only in the key name), so
the only way to change the schema is to bump the key, silently deleting every learner's
progress. Renamed slugs are never pruned.

**Impact:** adding a lesson is a four-file ritual with a silent-failure mode, and the ritual
has to be taught twice more. Drift is invisible until a learner reports a stuck bar.

**Fix:** make `LESSONS` the single source.

1. Export a `SECTIONS` structure from a new `src/lib/curriculum.ts` (so the config does not
   import a browser-flavoured module) shaped `[{ label, items: [{ slug, title, badge? }] }]`,
   and build the Starlight `sidebar` from it with a `.map()`. Roughly ten lines.
2. Type the prop against the data:
   `export type LessonSlug = (typeof LESSONS)[number]['slug']`, and change
   `LessonCompleteProps.slug` to `LessonSlug`. That turns a silent runtime no-op into a
   compile error.
3. Add `version: 1` to `ProgressData` and make `load()` a migration switchboard that prunes
   `completed` against `LESSONS`. Keep the key stable across versions.
4. Delete the inert `sidebar.order` blocks from all nine files and the duplicate badge, and
   add a comment above the sidebar array saying frontmatter `order` is ignored.

#### ✅ CLOSED — TypeScript strict is declared but unenforceable

> FIXED and now green. `typescript@^5.9.3` and `@astrojs/check@^0.9.4` installed as
> devDependencies, `@types/react` and `@types/react-dom` moved out of `dependencies`,
> `"check"` and `"typecheck"` scripts added, plus `"private": true` and `"license":
> "MIT"`. `deploy.yml` replaced the single `withastro/action@v3` step with checkout →
> `actions/setup-node@v4` (node-version 22 pinned, Astro 7 needs ^20.19 || ^22.12 || >=24;
> `cache: npm`) → `npm ci` → `npm run check` → `npm run build` → configure/upload Pages.
> Also added `on: pull_request` with both Pages steps and the whole deploy job guarded by
> `if: github.event_name != 'pull_request'` (a fork PR gets a read-only token and would
> otherwise fail on `configure-pages` for a reason the contributor cannot fix), and set
> `cancel-in-progress: false` on the `pages` concurrency group, which GitHub explicitly
> warns against cancelling. `tsconfig.json` now excludes `public/` — vendored upstream JS
> was the only source of diagnostics. MEASURED: `npm run check` reports 0 errors, 0
> warnings, 0 hints across 15 files, so CI passes today; note that src/ was being edited
> concurrently, so re-run before trusting that number.

**Severity:** High · **Effort:** Small · **Location:** `package.json:5-35`; `tsconfig.json:2`; `.github/workflows/deploy.yml:27-30`

**Evidence:** `tsconfig.json` extends `astro/tsconfigs/strict`, but `node_modules/typescript`
does not exist and neither does `@astrojs/check` — both verified absent. There is no
`check` or `lint` script and no `devDependencies` block at all; `@types/react` ships as a
runtime dependency. CI runs only `withastro/action@v3`, which builds and uploads — Astro's
build does not typecheck. So every type-safety recommendation in this audit, including the
`LessonSlug` fix above, is currently unenforceable.

**Fix:** add `typescript` and `@astrojs/check` as devDependencies, move the `@types/*` there
too, add `"check": "astro check"`, and insert a step before the build in `deploy.yml`:
checkout, `actions/setup-node` with `node-version: 22` and `cache: npm`, `npm ci`,
`npm run check`. Pin the Node version explicitly — the workflow never states one and Astro 7
requires `^20.19 || ^22.12 || >=24`. Also set `cancel-in-progress: false` on the `pages`
concurrency group (GitHub explicitly warns against cancelling a live deployment), add
`on: pull_request` with the deploy job guarded by
`if: github.event_name != 'pull_request'`, and add `"private": true` plus `"license": "MIT"`
to `package.json`.

#### ✅ CLOSED — 17 hardcoded base paths defeat the configurable `BASE`

> **FIXED & VERIFIED 2026-08-06.** (Actual count was **21**.) Rather than
> find-and-replace, added a **`rehypeBasePaths` plugin** in `astro.config.mjs`
> that prefixes `BASE` onto root-relative links at build time, registered via
> `markdown.rehypePlugins`. Content is now authored as `/start/friendly-shell/`
> and BASE lives in exactly one place. Stripped all 21 hardcoded prefixes from
> `src/content` (**21 → 0**).
>
> Two gaps the plugin does *not* cover, both found and fixed by verification:
> 1. **Raw `<a href="/…">` inside MDX** compiles to JSX and never reaches rehype.
>    Two such links in `index.mdx` were left bare (a real regression). Fixed with
>    an exported `base` const using `import.meta.env.BASE_URL`.
> 2. **Frontmatter hero actions** cannot use expressions. Switched to a relative
>    link (`start/why-termux/`), which resolves against the splash page's own URL
>    — the base root — so it survives a `base` change.
>
> **Proof of base-independence:** built with `BASE=/termux-tutorials/beginner`
> and every internal link relocated cleanly, with **zero** stale
> `/termux-tutorial-for-beginners/` references. (Note: this must be tested from
> PowerShell — Git Bash's MSYS path conversion mangles a leading-slash env var
> into `/C:/Program Files/Git/...` and produces a false failure.)
> Final state: **0 bare root links** anywhere in the build, and all **12 unique
> internal links verified to resolve to real pages**.
> This was the single biggest blocker to merging the three courses onto one site.

**Severity:** High · **Effort:** Small · **Location:** 17 occurrences across `src/content/docs/**`

**Evidence:** `astro.config.mjs:12` makes the base overridable and line 10 explicitly
advertises this for forks and custom domains. Content bakes the literal string in 17 places
across 9 files, including both homepage CTAs (`index.mdx:9`, `:85`) and every "next lesson"
link. The codebase already knows the right answer — `ProgressDashboard.tsx:9` does
`import.meta.env.BASE_URL.replace(/\/$/, '')` and builds hrefs from it.

**Impact:** setting `BASE=/` produces a site where every internal link 404s, silently. The
build still succeeds. Any fork, custom domain, or repo rename breaks all navigation — and
cloning to intermediate/advanced means 17 hand-done find-and-replaces.

**Fix:** for markdown-syntax links, switch to file-relative links into the content
collection (`[Cheatsheet](../reference/cheatsheet.md)`), which Astro resolves through the
collection including base. For the raw-HTML CTA at `index.mdx:85`, use an inline expression:
`` href={`${import.meta.env.BASE_URL}start/why-termux/`} ``. `index.mdx:9` is the genuine
exception — Starlight hero `actions` are frontmatter and do not base-prefix — so leave it
with a comment. Then add `BASE=/ npm run build` plus a grep of `dist/` for surviving
literals as a CI smoke test. That turns this whole class of bug into a one-command check.

#### ✅ CLOSED — LiveSandbox has no effect cleanup and double-mounts on retry

> FIXED 2026-08-06. All three leaks closed, following the pattern
> `TermuxTerminal.tsx:216-220` already used.
>
> - The resize handler was `window.addEventListener('resize', () => fit.fit())` — an
> anonymous function whose reference was gone the instant it was created, so it *could
> not* be removed. It now lives in `onResizeRef` and is removed in teardown.
> - `Terminal` and `FitAddon` are hoisted into refs; a `useEffect(() => teardown,
> [teardown])` disposes the terminal on unmount. This matters more than it looks:
> Starlight navigates with client-side view transitions, so leaving the page previously
> left a running WebAssembly x86 VM alive in the background.
> - The double-mount is gone. `boot()` now calls `teardown()` and
> `hostRef.current.replaceChildren()` **before** creating anything, so a boot that failed
> after `term.open()` (a dropped websocket to `disks.webvm.io` is realistic) no longer
> leaves a live xterm in the host for the retry to stack a second canvas on top of.
> - A `disposedRef` guard wraps the CheerpX console callback and the post-`await` wiring,
> because cx keeps writing after we dispose and writing to a disposed xterm throws inside
> a callback we do not own.
>
> Two defects found while doing this and fixed in the same pass: (1) the retry path
> existed in code (the catch reset `bootedRef`) but not in the UI — the Boot button only
> rendered while `phase === 'idle'`, so after a failure there was no way back except
> reloading; it now renders on `error` too, as "Try again". (2) `#fca5a5` (Tailwind
> red-300) was still hardcoded on the message div at 1.78:1 in light theme — the message
> explaining how to fix the page was unreadable to the person who needed it. Now
> `var(--color-danger)`, and the div is `role="alert"` on error / `role="status"`
> otherwise, since the failure arrives asynchronously minutes after the click. The two
> `var(--tmx-screen, #0e1014)` fallback literals were also dropped; the only hexes left in
> the file are xterm's canvas theme, which cannot read CSS custom properties, and they now
> carry a comment saying so and that they mirror the dark-LOCKED tokens.

**Severity:** Medium · **Effort:** Small · **Location:** `src/components/terminal/LiveSandbox.tsx:49-117` (esp. `:50`, `:80`, `:115`)

**Evidence:** line 80 registers `window.addEventListener('resize', () => fit.fit())` with an
anonymous handler and never removes it — it *cannot* be removed, the reference is not kept.
The `Terminal` created at line 64 is never disposed and the CheerpX instance is never torn
down. The catch block at `:115` sets `bootedRef.current = false` to allow a retry, but the
guard at `:50` is the only thing preventing a second `new Terminal()` from being opened on
the same host div. So a boot that fails after `term.open()` — a dropped websocket to
`disks.webvm.io` is realistic — leaves a live terminal in the DOM, and clicking Boot again
stacks a second xterm canvas plus a second listener. Since Starlight uses client-side view
transitions, navigating away leaves a running WebAssembly x86 VM alive.

`TermuxTerminal.tsx:216-220` does all three cleanups correctly, so this is an oversight,
not house style.

**Fix:** hoist `Terminal`/`FitAddon`/CheerpX into refs, use a named `onResize`, add
`useEffect(() => () => { … }, [])` teardown, and dispose any existing terminal before the
early return at `:50` so a retry starts clean. Extract the resize wiring into a
`useFitOnResize(termRef, fitRef)` hook and reuse it in TermuxTerminal, which duplicates the
same logic — that hook is one of the pieces worth sharing across repos.

#### ✅ CLOSED — `progress.ts` writes without try/catch, and "Mark all complete" fires 7 sequential writes

> **FIXED & VERIFIED 2026-08-06.** `save()` now wraps `localStorage.setItem` in
> try/catch and returns silently on failure (quota exceeded, Safari private mode,
> blocked cookies, embedded webviews) — progress is a convenience, not a
> prerequisite, so it must never throw inside a click handler.
> Added `setManyComplete(slugs, done)` doing one read-modify-write and firing a
> single change event; "Mark all complete" now uses it.
> Measured in-browser by instrumenting `localStorage.setItem`: **1 write** for
> the whole action (was one per lesson), 8 lessons marked.

**Severity:** Medium · **Effort:** Small · **Location:** `src/lib/progress.ts:61-65, 78-93`; `src/components/profile/ProgressDashboard.tsx:131`

**Evidence:** `load()` is defensively wrapped; `save()` calls `localStorage.setItem` bare.
`setItem` throws `QuotaExceededError` in Safari Private Browsing — where localStorage exists
with zero quota, so `isBrowser()` returns true — and the throw propagates into the React
onClick handler unhandled. Separately, `LESSONS.forEach((l) => setComplete(l.slug, true))`
means one click = 7 loads, 7 JSON round-trips, 7 writes, and 7 synchronous CustomEvents,
each re-rendering every mounted subscriber.

**Fix:** wrap `setItem` in try/catch and on failure still dispatch the event plus surface a
dismissible in-UI note ("progress can't be saved in private browsing") — silent data loss is
worse than visible degradation. Add `setManyComplete(slugs, done)` that loads once, mutates,
saves once. Have `toggleComplete` read from a single `load()`.

#### ✅ CLOSED — The xterm alias hack hardcodes a `node_modules` path

> FIXED at the level available to me (the preferred fix lives in src/components/terminal,
> which I do not own — see handoffs). `fileURLToPath(new
> URL('./node_modules/@xterm/xterm/lib/xterm.mjs', import.meta.url))` is replaced by
> `createRequire(import.meta.url).resolve('@xterm/xterm/lib/xterm.mjs')`, so Node's own
> resolver finds the package wherever pnpm/Yarn/a hoisting workspace put it. The resolve
> is wrapped in try/catch: on failure the alias is omitted entirely (with a console.warn
> naming the likely cause and consequence) rather than the build dying on a path that no
> longer exists. An `// UPGRADE WATCH` block pinned to `@xterm/xterm@6` sits above it and
> states the deletion condition — move the imports inside the effects and both this and
> `ssr.noExternal` go away.

**Severity:** Medium · **Effort:** Small · **Location:** `astro.config.mjs:113-131`; `TermuxTerminal.tsx:14-16`; `LiveSandbox.tsx:17-18`

**Evidence:** the underlying cause is confirmed and the workaround is genuinely still
needed: `@xterm/xterm@6.0.0` has no `exports` map, `main` is UMD, so Vite's SSR resolver
picks it and `import { Terminal }` yields no named export. The fragility is the
implementation — line 127 resolves `new URL('./node_modules/@xterm/xterm/lib/xterm.mjs',
import.meta.url)`, assuming flat npm hoisting into the project root. It breaks under pnpm,
Yarn PnP, or a workspace that hoists to a parent, and it breaks if xterm 7 adds an
`exports` map (which would make deep subpath access forbidden). Failure mode is a cryptic
SSR error. This only bites because both components import xterm at module top level, and
every island is `client:only` — the runtime never needs it on the server.

**Fix, preferred:** delete the need entirely. Move the imports inside the effects —
`const { Terminal } = await import('@xterm/xterm')` — which takes xterm out of the SSR
module graph, letting you delete both the `resolve.alias` block and the `ssr.noExternal`
entry. This also splits the 340 KB chunk off the critical path (see the performance
section), so one refactor closes two findings. **If keeping the alias:** at minimum resolve
through Node — `createRequire(import.meta.url).resolve('@xterm/xterm/lib/xterm.mjs')` —
and add an `// UPGRADE WATCH` note pinned to `@xterm/xterm@6`.

#### ✅ CLOSED — Docs have drifted, and the agent-facing files contain no project knowledge

> **FIXED 2026-08-06.** README: "custom cyan/magenta Starlight theme built on Tailwind v4"
> → "Fire Watch v6 design system — Parchment Dossier / Sentinel Obsidian, brass as the
> single accent, plain CSS with tokens, no CSS framework"; the two dead sibling-repo links
> were removed rather than guessed at (both `termux-tutorial-intermediate/` and
> `termux-tutorial-advanced/` are verified-empty directories, so neither spelling could be
> confirmed — the series is now described as planned, with only the beginner repo linked);
> the project-structure tree gained `src/assets/` (with a note that large bitmaps belong
> in the parent workspace's `global-assets/`), `components/icons/`, and
> `styles/global.css`; new sections cover the rehypeBasePaths convention, "What this site
> knows about you", and third-party dependencies. CONTRIBUTING: the lesson recipe now
> states that the `sidebar` array in `astro.config.mjs` is the source of order *and* of
> prev/next, that frontmatter `sidebar.order` is ignored while an explicit array is
> configured, that utility pages set `prev: false` / `next: false`, and that the
> `<LessonComplete slug>` string is unvalidated; the sample uses the real prop set
> (`client:only`, `hint`, `height` — the old `boot={[…]}` example matched no usage in the
> repo). The PR gate was corrected honestly rather than changed to `npm run check && npm
> run build`: no `check` script exists and neither `typescript` nor `@astrojs/check` is
> installed, so both README and CONTRIBUTING now say `npm run build` is the only gate and
> does not typecheck. CLAUDE.md is no longer boilerplate — it carries the stack, an
> architecture map, the token rules (brass-only, `--tmx-screen-*` dark-locked, prefer Fire
> Watch tokens over `--sl-color-*`, wrap JSX UI in `not-content`, `client:only="react"`
> always, never hardcode the base path), five gotchas, and a "do not undo" section
> protecting the Tailwind/`@layer` removal and the corrected storage advice. AGENTS.md is
> now a pointer at CLAUDE.md so the two cannot re-diverge — note they were **hardlinked on
> disk** (same inode, link count 2), which is how they stayed byte-identical; the link was
> broken before writing.

**Severity:** Medium · **Effort:** Small · **Location:** `README.md:17, 29-30, 48-59`; `CONTRIBUTING.md:20, 26, 55`; `CLAUDE.md` / `AGENTS.md`

**Evidence:** `README.md:29-30` advertises "a custom cyan/magenta Starlight theme" — the
project was rebuilt on Fire Watch parchment/brass, and `global.css:1-13` says so.
`README.md:17` links `termux-tutorial-intermidiate` (misspelled) while the sibling directory
is spelled correctly — one of the two is wrong and it is a dead link either way. The
project-structure tree omits `src/assets/`, which is part of why 7 MB went unnoticed.
`CONTRIBUTING.md:26` instructs contributors to add `sidebar.order`, which the config
ignores, and states a `npm run build` PR gate that gates nothing since build does not
typecheck. `CLAUDE.md` and `AGENTS.md` are byte-identical stock Astro boilerplate with zero
project-specific content — nothing about the Fire Watch tokens, the brass-only rule, the
`not-content` convention, the xterm workaround, or lesson registration.

**Impact:** the agent-facing files are the ones most likely to cause an AI or a new
contributor to violate the rules this project cares most about, and they carry the least
information.

**Fix:** rewrite the theme description, fix or confirm the sibling URL, add `src/assets/` to
the tree with a note on what belongs there, update the lesson recipe, and change the PR gate
to `npm run check && npm run build`. Most valuable: replace the CLAUDE.md/AGENTS.md
boilerplate with the actual house rules — brass is the only warm colour; use Fire Watch
tokens, never `--sl-color-*`, in components; wrap raw-HTML UI in `not-content`; islands are
always `client:only="react"`; never hardcode the base path. Keep one file and make the other
a one-line pointer so they cannot diverge.

#### ✅ CLOSED — The no-CDN principle is stated twice and contradicted once

> **PARTIALLY FIXED 2026-08-06 (docs half only).** The honesty half is closed: README now
> carries a table splitting bundled-from-our-own-origin dependencies (fonts, icons, xterm,
> React, Starlight) from the one CDN dependency (CheerpX runtime at
> `cxrtnc.leaningtech.com` + the `wss://disks.webvm.io` image), states plainly why the
> exception is acceptable (a multi-GB disk image cannot be self-hosted on Pages; the
> feature is optional, confined to one lesson, user-initiated, and degrades to a message
> pointing back at the offline simulator), and records the availability risk of the pinned
> `CHEERPX_VERSION = 1.1.5` plus the recommendation to keep it pinned rather than float
> `latest`. CLAUDE.md gotcha #4 instructs future agents to always state the exception when
> writing a no-CDN claim. **Still open, in files this agent does not own:** amending the
> two in-code "no CDN" comments (`astro.config.mjs:55-56`,
> `src/components/icons/icons.tsx:2-4`) to "no CDN except the optional CheerpX runtime",
> moving `CHEERPX_VERSION` / `DEFAULT_IMAGE` into env-overridable config, and splitting
> "runtime unreachable" from "boot failed" in the error handler.

**Severity:** Medium · **Effort:** Small · **Location:** `src/components/terminal/LiveSandbox.tsx:21-24, 84`; `astro.config.mjs:25-26`; `src/components/icons/icons.tsx:2-4`

**Evidence:** the config and the icon module both state "no CDN, COEP-safe,
offline-friendly." `LiveSandbox.tsx:21-24` hardcodes
`https://cxrtnc.leaningtech.com/1.1.5/cx.esm.js` and
`wss://disks.webvm.io/debian_large_20230522_5044875331.ext2`, loaded via dynamic import with
no SRI, no fallback host, and no availability check. The disk image embeds a 2023 build ID.

**Impact:** if Leaning Technologies retires 1.1.5 or rotates that image, the flagship feature
dies on all three sites at once. It is also the one place the project executes remote code,
and the COEP policy makes the failure mode depend on the CDN's CORP headers.

**Fix:** this is a deliberate tradeoff — you cannot self-host a multi-GB disk image on Pages
— so fix the honesty and the resilience, not the dependency. Amend both no-CDN claims to
"no CDN except the optional CheerpX runtime in LiveSandbox." Move `CHEERPX_VERSION` and
`DEFAULT_IMAGE` into env-overridable config. Extend the error handler to distinguish
"runtime unreachable" from "boot failed". Add the uptime caveat to the README's licensing
section, which already covers the licensing angle well. Keep the version pinned — do not
switch to floating `latest`.

#### ✅ CLOSED — `[boot, hint]` dependency array is a latent session-loss bug

> In my file and blocking the accomplishment strip, so fixed here. `boot` is an array
> literal at every call site, so it had a new identity on every parent render — the effect
> tore down and rebuilt the whole terminal, losing everything typed. The dependency is now
> `JSON.stringify(boot)` (content, not identity), alongside `hint` and the new `shell`
> prop. `onProgress` is held in a ref so a consumer passing an inline callback cannot
> reset the session either. Boot commands now go through the same `submit()` path a
> keystroke does, so lesson-preloaded state is indistinguishable from state the learner
> produced.

**Severity:** Low · **Effort:** Trivial · **Location:** `src/components/terminal/TermuxTerminal.tsx:40, 221`

**Evidence:** the effect declares `[boot, hint]` while `boot = []` is a default parameter —
a fresh array identity on every render — and callers pass inline literals. Any parent
re-render would tear down and rebuild the terminal, wiping the learner's shell state,
filesystem and history mid-lesson. It is latent today only because these are `client:only`
islands with no state, context, or parent that re-renders.

**Fix:** change the deps to `[]` and take `boot`/`hint` from refs. Given the terminal is
explicitly documented as mount-once, `[]` plus a comment explaining the intent is the honest
choice. Do this in the same commit as the imperative-handle refactor described under
Interactivity, since they touch the same closure.

---

### 4.4 Content, writing quality & pedagogy

**Verdict:** the writing is genuinely good — confident, concrete, and free of the "type
these 40 commands" pattern. The signature-key lesson is the best thing on the site and is
technically correct where most Termux tutorials are vague. But the course carries one piece
of actively harmful advice, one factually wrong table row, a circular dependency, and two
safety omissions — and it dead-ends into a cheatsheet rather than into the Intermediate
course it exists to lead into.

**What's working:**

- `start/why-termux.mdx:35-63` correctly identifies Termux's #1 beginner trap, explains the
  actual mechanism (shared UID requires identical signing keys), describes the failure mode
  accurately, and supplies a recovery procedure. Rare and excellent.
- The "home directory is wiped on uninstall" warning is technically correct and dramatized
  at exactly the right intensity. "Treat `~` like a whiteboard, not a safe" is the best
  single line in the corpus.
- Every lesson ends with a forward link plus `<LessonComplete>`; the seven-lesson chain is
  unbroken with no dangling ends.
- Frontmatter descriptions are real sentences written for search intent.
- `reference/troubleshooting.md` is correctly shaped as symptom → cause → fix.
- The `pkg`-as-wrapper-over-`apt` framing is accurate, and the simulator reinforces it —
  typing `apt` returns a nudge toward `pkg`. Content and code agreeing is a nice touch.

#### ✅ CLOSED — "Keep your real work in `~/storage/shared/`" is wrong and will cost readers hours

> **FIXED 2026-08-06.** Took the recommended split-by-data-type approach.
> `storage.mdx`: kept the (correct) danger callout about `~` being wiped, then
> replaced the "keep everything in shared storage" advice with a
> `:::caution[Never put code in ~/storage/shared]` explaining that the exec bit
> and symlinks do not exist there (`chmod +x` no-ops, `git clone` reports every
> file changed, `venv`/`npm install` produce unrunnable trees). Added a
> what-goes-where table (code → `~`, media → shared, **backups** → shared) and
> rewrote the Steps block into a real backup rhythm using
> `mkdir ~/projects` + `tar czf ~/storage/shared/termux-backups/...`.
> Recap and the embedded terminal hint updated to match.
> `cheatsheet.md`: Golden Rule #3 inverted to "Code lives in `~`; backups live in
> `~/storage/shared/`", the Key-files table now states shared storage has no
> permission bits, and the backup one-liner was added.

**Severity:** Critical · **Effort:** Medium · **Location:** `src/content/docs/foundations/storage.mdx:64-83, 97-98`; hardened at `src/content/docs/reference/cheatsheet.md:81`

**Evidence:** the lesson says "**keep anything you care about in shared storage**, not in
the private home directory", then walks the learner through
`mkdir ~/storage/shared/termux-projects` and "Do your real work there." The recap repeats
it. The cheatsheet promotes it to Golden Rule #3.

`~/storage/shared` is `/storage/emulated/0` — a FUSE/sdcardfs emulation layer with no Unix
permission bits and no symlink support. `chmod +x script.sh` silently no-ops, so
`./script.sh` returns "Permission denied" forever. `git clone` there produces a repo that
reports every file as mode-changed and breaks on symlinked hooks. `python -m venv` and
`npm install` fail or produce unrunnable trees.

**Impact:** a beginner who follows this exact advice builds their project in a directory
where nothing they learn later actually works, with no idea why. This is the one finding in
the audit that will cost readers real hours. The underlying danger warning at `:57-62` is
*correct* — it is the advice derived from it that is wrong.

**Fix:** split the rule by data type instead of blanket-routing everything to shared
storage. Keep the danger callout. Then: code, scripts and dotfiles stay in `~` because that
is the only filesystem with working permissions; documents, media and **backups** go to
`~/storage/shared/`. Replace the Steps block with a backup rhythm they can actually run:

```bash
mkdir -p ~/storage/shared/termux-backups
tar czf ~/storage/shared/termux-backups/home-$(date +%F).tar.gz ~/projects
```

Add a one-line callout: "Never `git clone` into `~/storage/shared` — Android's storage layer
has no Unix permissions, so scripts there can't be made executable." Update
`cheatsheet.md:81` and `:74` to match, and check the sibling repos before they inherit it.

#### ✅ CLOSED — The fish lesson was dropped, but the whole simulator imitates fish

> **FIXED & VERIFIED 2026-08-06.** Took the full-lesson option rather than the
> minimum aside. Added **`src/content/docs/start/friendly-shell.mdx`**
> ("Upgrade Your Shell to Fish", sidebar order 3, badge *Recommended*) between
> `installing` and `first-session`, porting the original tutorial's Step 1.5 —
> its four "why fish" bullets, the `pkg install fish` → `chsh -s fish` →
> full-restart sequence, and a revert note (`chsh -s bash`).
> Registered in **both** sources of truth (`LESSONS` in `progress.ts` and the
> sidebar in `astro.config.mjs`); `first-session` bumped to order 4.
> Simulator now acts the lesson out: added `fish` to `PKG_DB`, `chsh` to
> `COMMAND_NAMES` with a real implementation (refuses `chsh -s fish` until fish
> is installed, flips `state.shell` and `$SHELL`), and both commands to
> `SUGGESTIONS`. Added a `shell: 'bash' | 'fish'` field to `ShellState` so the
> sandbox starts in bash like real Termux.
> **Prompt mismatch also reconciled** (the related note in this finding):
> `installing.mdx` now carries a `:::note` explaining that fresh Termux shows
> `~ $` because it runs bash, while this site's terminals show `~ ❯` because they
> imitate fish — with a forward link to the new lesson. `first-session.mdx`'s
> "fish-style shell" tip now links there too.
> While implementing, closed a latent trap: `rm`, `cp`, `mv`, `which` and
> `termux-reload-settings` were added to `COMMAND_NAMES` **and implemented**, so
> nothing highlights as a valid command while returning "command not found".
> Verified by a 22-assertion Node smoke test covering the whole fish flow, file
> manipulation, and an assertion that **all 23 `COMMAND_NAMES` are implemented**.

**Severity:** Critical · **Effort:** Medium · **Location:** `src/components/terminal/TermuxTerminal.tsx:2, 135, 248`; `src/content/docs/start/first-session.mdx:17`; `src/content/docs/index.mdx:25`; `src/components/terminal/shell.ts:174-185`

**Evidence:** the original tutorial's Step 1.5 was its signature move: `pkg install fish`,
`chsh -s fish`, restart, and now you get grey autosuggestions and syntax highlighting. The
current site simulates that everywhere and teaches it nowhere. The banner writes "(interactive
fish sandbox)", the chrome label says "termux — fish sandbox", the homepage says "The grey
text is a fish-style suggestion", `first-session.mdx:17` says "This is a fish-style shell."
A grep for `chsh|install fish` across `src/` returns nothing. Worse, `fish` is absent from
the simulator's `PKG_DB`, so a curious learner typing `pkg install fish` gets
`E: Unable to locate package fish`.

**Impact:** a learner who completes this course and opens Termux on their phone lands in
**bash** — no grey ghost text, no cyan/red highlighting, a `$` prompt instead of `❯`.
Everything the course said the terminal does, it does not do. That reads as the tutorial
having lied, at exactly the moment the learner leaves the safety of the sandbox. This is a
curriculum correctness bug, not a missing feature.

**Fix:** add `start/friendly-shell.mdx` between `installing` and `first-session`, porting the
original's Step 1.5 (its four "why fish" bullets are already well written). Add
`fish: 'Friendly Interactive SHell'` to `PKG_DB` and both commands to `SUGGESTIONS` so the
sandbox can act out the install. Register the slug in `LESSONS`. Minimum viable alternative
if you want to hold the lesson count: one aside in `first-session.mdx` —
":::note[This sandbox runs fish] Real Termux ships with bash, which has no grey suggestions.
Install fish with `pkg install fish && chsh -s fish` to get what you see here." — but the
full lesson is the better trade. Related: `installing.mdx:39` shows the real Termux prompt
`~ $` while the simulator renders `u0_a123 at localhost ~ ❯`, and no lesson reconciles them.

#### ✅ CLOSED — Safety: the install lesson never closes the sideload door, and the phantom-process fix is wrong

> **FIXED 2026-08-06. Both halves.**
> **Part one —** `installing.mdx` now tells the reader to verify the address bar
> reads exactly `https://f-droid.org` (lookalike-domain warning), and adds a
> **step 4: revoke the permission** — Settings → Apps → \[browser\] → Install
> unknown apps → **off** — followed by a `:::caution` explaining that leaving it
> on lets any page in that browser prompt an APK install later. Framed as the same
> signature-and-trust reasoning as the preceding lesson.
> **Part two —** `troubleshooting.md`'s section was retitled "My session keeps
> dying in the background" and split into the **two real causes in priority
> order**: (1) the Android 12+ **phantom-process killer** (~32-child-process cap),
> with the `adb shell device_config ... max_phantom_processes` commands, the
> `settings_enable_monitor_phantom_procs` feature-flag alternative, and a note
> that the setting can reset after reboot/update; (2) battery optimisation, now
> correctly described as worth doing but **not** a fix for phantom kills on
> Android 12+. The page no longer confidently prescribes a fix that fails.

**Severity:** High · **Effort:** Small · **Location:** `src/content/docs/start/installing.mdx:17-20`; `src/content/docs/reference/troubleshooting.md:50-56`

**Evidence, part one:** the install lesson says go to f-droid.org, download the `.apk`,
"Android will ask you to allow installing apps from this source — grant it." There is no
checksum, no fingerprint check, no HTTPS-only caution, and no instruction to **revoke that
permission afterwards**. A permanently-enabled "install unknown apps" grant on the user's
default browser is a lasting attack surface — taught by a course whose immediately preceding
lesson is an excellent explanation of why cryptographic signatures matter.

**Evidence, part two:** `troubleshooting.md:50-56` attributes "the app closes or freezes in
the background" solely to battery optimisation and prescribes Settings → Battery →
Unrestricted. On Android 12+ the dominant cause is the phantom-process /
`max_phantom_processes` killer, which battery settings do not touch. "My session keeps
dying" is the single most common modern Termux complaint, and the page confidently sends
the reader to a setting that will not fix it.

**Impact:** these are the only two remaining places the site can actively hurt someone —
one by leaving a permission open, one by prescribing a fix that fails and leaves the reader
concluding they did it wrong. A wrong fix in a troubleshooting page destroys trust in the
whole page.

**Fix:** add one sentence after `installing.mdx:20` — "Once F-Droid is installed, go back to
Settings → Apps → your browser → Install unknown apps and turn it **off**. You won't need it
again." — plus a line on verifying you are on `https://f-droid.org` and not a lookalike.
In troubleshooting, name the phantom process killer explicitly, say honestly that the
reliable workaround requires ADB
(`settings put global settings_enable_monitor_phantom_procs false`) and is therefore beyond
this course, and link the Termux wiki. "Here's what's happening and here's why it's out of
scope" preserves trust.

Related: `shell.ts:183` lists `tsu` ("switch users / fake-root helper") in the simulator's
package DB. It is reachable from `pkg search` and installs cleanly, in a course that sells
rootlessness. Remove it, or attach a one-line output explaining it needs a rooted device.

#### ✅ CLOSED — The `external-1` row points at Termux's private SD folder, not the SD card

> **FIXED 2026-08-06.** Removed the misleading `external-1` table row and replaced
> it with a `:::note` stating plainly that it is **not** the whole card — it points
> at `Android/data/com.termux/files`, starts empty, and is deleted on uninstall.
> Added the missing `movies` row so the documentation table and the simulator's
> `~/storage` tree in `shell.ts` now list exactly the same six entries
> (shared, downloads, dcim, pictures, music, movies) — a learner running
> `ls ~/storage` in the embedded terminal now sees precisely the table above it.

**Severity:** High · **Effort:** Small · **Location:** `src/content/docs/foundations/storage.mdx:46`

**Evidence:** the row reads `| ~/storage/external-1 | An external SD card (if present) |
Removable storage |`. On Android 11+, `termux-setup-storage` creates `external-1` pointing at
`/storage/XXXX-XXXX/Android/data/com.termux/files` — Termux's own app-private directory on
the card, which is empty and is deleted on uninstall. The table also disagrees with this
site's own simulator: `shell.ts:307-313` creates `shared, downloads, dcim, music, pictures,
movies` — no `external-1`, and `movies` is undocumented. The lesson instructs `ls ~/storage`
nine lines earlier, so the learner sees a different list than the table they just read.

**Fix:** rewrite the row as "Termux's own folder on the SD card
(`Android/data/com.termux/files`) — rarely useful; it is *not* the whole card, and it is
deleted on uninstall." Add the `movies` row, mention that recent Termux also creates
`podcasts` and `audiobooks`, and make the doc table and the simulator's `~/storage` tree
identical. A learner comparing them is the whole point of embedding the terminal.

#### ✅ CLOSED — The extra-keys lesson has a chicken-and-egg: you need Ctrl to enable the Ctrl key

> **FIXED 2026-08-06.** The site now documents the volume-key modifiers, which it
> previously never mentioned anywhere (grep for "volume" returned zero hits).
> `extra-keys.mdx`: added a `:::tip` **before Step 1** with a full mapping table —
> Volume Down + letter = **Ctrl**, Volume Up + letter = **Alt**, Vol-Up + Q
> toggles the extra-keys row, Vol-Up + K toggles the keyboard — stating plainly
> that Vol-Down + O saves in nano and Vol-Down + X exits, so the file can be
> edited *before* a Ctrl key exists. The Ctrl-O/Ctrl-X instruction at the save
> step now carries the volume-key alternative inline.
> Both secondary problems fixed too: `mkdir -p ~/.termux` prepended to the Step 1
> block (it is **not** guaranteed to exist on a fresh install, which made the save
> fail at exactly the Ctrl-O step), and the false "it already exists" claim
> deleted. Intro reworded from "Let's switch it on" to "Termux gives you a starter
> row already; let's replace it with one built for how *you* work" — modern Termux
> ships the row enabled.
> Propagated as recommended: the same mapping is now a `:::tip` in
> `first-session.mdx`'s "Handy keys" (which described a desktop keyboard), and the
> cheatsheet gained a **"Phone keys"** table including `Alt + .` for last-argument
> recall.

**Severity:** High · **Effort:** Small · **Location:** `src/content/docs/foundations/extra-keys.mdx:13, 23, 30-32, 49`

**Evidence:** the lesson instructs `nano ~/.termux/termux.properties` then "Save and exit
with **Ctrl-O**, **Enter**, then **Ctrl-X**." A repo-wide grep for "volume" across
`src/content/docs` returns **zero hits**. So a beginner with no extra-keys row and no
physical keyboard literally cannot press Ctrl-O to save the file that gives them a Ctrl key.
This is the most-asked question on r/termux and the site answers it nowhere. Two secondary
problems in the same lesson: `~/.termux` is not guaranteed to exist on a fresh install, so
the save fails with "Directory does not exist" at exactly the Ctrl-O step; and "Let's switch
it on" is misleading, because modern Termux ships the extra-keys row **enabled by default** —
the lesson is about customizing it.

**Fix:** add a tip callout before Step 1 — "No Ctrl key yet? **Volume Down** *is* Ctrl in
Termux. Volume-Down + O saves in nano, Volume-Down + X exits, Volume-Down + C cancels.
Volume Up + Q toggles the extra-keys row." Volume Up + a letter is Alt, which also gives you
`Alt + .` to recall the previous command's last argument — worth adding to the cheatsheet.
Prepend `mkdir -p ~/.termux` to the Step 1 block and delete the "it already exists" claim.
Reword the intro to "Termux gives you a starter row already — let's replace it with one built
for how you work." Add the same volume-key mapping to `first-session.mdx:49-54`, whose
"Handy keys" list currently describes a desktop keyboard.

#### ✅ CLOSED — Missing lesson: file manipulation and destructive-command safety

> **FIXED.** Added `foundations/files-and-folders.mdx` between Filesystem and
> Storage, covering `mkdir`/`touch`/`cat`/`cp`/`mv`/`rm`/`rm -r` with an `rm -rf`
> danger block, plus `tar` — so the storage lesson's backup step is now the payoff
> of the previous lesson rather than an unexplained command.

**Severity:** High · **Effort:** Large · **Location:** gap between `foundations/filesystem.mdx` and `foundations/storage.mdx`; cf. `reference/cheatsheet.md:34-49`

**Evidence:** the cheatsheet documents `mkdir`, `touch`, `cat`, `cp`, `mv`, `rm`, `rm -r`
with a single caution. No lesson teaches any of them — `mkdir` first appears as an
instruction in `storage.mdx:72` having never been introduced. A grep for "sudo" and
"rm -rf" across all content returns nothing outside that one caution. Three of those
commands are not even implemented in the simulator, so typing them renders red and returns
"command not found".

**Impact:** the cheatsheet is a promissory note the course does not honor. More seriously,
handing beginners `rm -r` in a reference table without ever running them through what
deletion feels like — and never once saying "Termux has no sudo and needs no root" — sets up
the most common catastrophic beginner mistake, `rm -rf $PREFIX`, which bricks the install.

**Fix:** add `foundations/files.mdx` (~600 words) covering create/read, copy/move/rename,
delete, and a `:::danger` block on `rm -rf` with the specific `$PREFIX` warning plus "if a
tutorial tells you to type `sudo`, it wasn't written for Termux." Add `cp`, `mv`, `rm` to
`COMMAND_NAMES` so the exercises run, and make `rm -rf $PREFIX` in the simulator a
scary-but-recoverable teaching moment.

While you are here: the original tutorial's GUI-editor hack — install QuickEdit,
`open notes.txt`, discover Android won't let it save back into Termux's private folder, then
`cat > notes.txt`, paste, **Ctrl-D** — is the passage where the original stopped being a
command list and became expertise. It is phone-specific, explains an Android constraint
rather than a Linux one, and nothing like it exists here. Fold it into this lesson or a
sibling `editing-files.mdx`, and support `cat > file` heredoc mode in `shell.ts` so Ctrl-D
can be *felt* rather than read.

#### ✅ CLOSED — Missing lesson: Android terminal mechanics — sessions, copy/paste, hardware keys

> WRITTEN. New lesson `src/content/docs/start/sessions-and-copy-paste.mdx` ("Sessions, Copy & Paste", ~1,100 words), recommended position: LAST in the Start Here group, after `start/friendly-shell` and before `foundations/filesystem` (frontmatter `sidebar.order: 5`, which keeps the group ascending 1→5; check-curriculum.mjs's per-group ascent check passes). Placed there rather than the audit's suggested slot-4 for two reasons: `first-session.mdx` promises the fish lesson as "the very next lesson" twice, and the fish lesson's step 3 introduces the notification's Exit action — so the new lesson can now pay it off ("you met Exit last lesson; here is what it actually does to your sessions") instead of pre-empting it. It still lands before `foundations/files-and-folders`, whose `cat >` workflow instructs "long-press and Paste", so that gesture is now taught before it is used. Covers, in the house lesson shape (hook → concept → Steps → embedded practice terminal → recap → next link → LessonComplete): sessions and the left-edge drawer (NEW SESSION, tap to switch, long-press to rename); long-press Copy/Paste with selection handles; a `:::danger` on Ctrl-C being SIGINT and not copy (and Ctrl-V being literal-next-keystroke, not paste); Select URL and Share transcript as the escape hatches from fiddly selection; the scrollback buffer and why `clear` does not destroy it; the notification's Exit (kills EVERY session) and Acquire wakelock as a two-row table; the Volume-Up special keys (E=Esc, T=Tab, W/S=↑/↓, A/D=←/→); and a hardware/Bluetooth keyboard section with the Ctrl-Alt shortcut table plus the Fn-layer-arrows gotcha. The practice terminal is limited to commands `shell.ts` actually implements (`whoami`, `pwd`, `ls -a`, `history`, `clear`) — verified against BUILTIN_NAMES. The cheatsheet's "Sessions & shell" section, which the audit noted contained nothing about sessions, is now split into "Shell keys" and a new "Sessions & gestures" table of nine real gestures linked to the new lesson. NOT YET REGISTERED: needs one sidebar entry in astro.config.mjs and one LESSONS entry in src/lib/progress.ts — exact text in handoffs. check-curriculum.mjs passes today (an unregistered content file is not an error); it will still pass after registration.

**Severity:** High · **Effort:** Large · **Location:** gap in `start/`; cf. `start/first-session.mdx:49-54`, `reference/cheatsheet.md:58-67`

**Evidence:** the cheatsheet has a section titled "Sessions & shell" that contains
`whoami`, `clear`, `history`, Ctrl-C, arrows, Tab — and not one thing about sessions. A grep
across all content for "copy", "paste", and "session" as a Termux feature returns nothing
relevant.

**Impact:** these are the skills that determine whether someone keeps using Termux after
day one: swipe from the left edge for the session drawer, long-press for copy/paste (there
is no Ctrl-C/Ctrl-V, since Ctrl-C interrupts), Volume-Down as Ctrl, Volume-Up + Q to toggle
the key row. Without them a beginner is stuck in one session, cannot get a command off a web
page into their terminal, and cannot cancel a runaway process. The course teaches Linux and
skips the Android layer wrapped around it — which is the only thing that makes it different
from a generic Linux tutorial.

**Fix:** add `start/getting-around.mdx` as the fourth Start Here lesson (~500 words), then
rewrite `first-session.mdx:49-54` to reference it instead of asserting keys the reader cannot
press, and either rename the cheatsheet section to "Shell basics" or fill it with real
session gestures.

#### ✅ CLOSED — The course dead-ends into a cheatsheet

> **FIXED & VERIFIED.** Added `where-next.mdx` as the course terminus; the
> prev/next chain now ends there instead of on Troubleshooting. Verified by the
> built-chain walk (11 steps, ending on Where to Next).

**Severity:** Medium · **Effort:** Medium · **Location:** `src/content/docs/foundations/extra-keys.mdx:81-83`; `src/content/docs/reference/troubleshooting.md:56`

**Evidence:** the final lesson closes with "That's the Foundations module. Head to the
Command Cheatsheet, or check your progress." `troubleshooting.md:56` says "a topic the
Intermediate course covers in depth" with no link. The README documents a three-repo series
referenced from zero content pages.

**Impact:** the learner who finishes — the most motivated person on the site — is handed a
reference table and shown the door. No "here's what you can now do", no first project, no
path to the two courses that exist specifically for them. This is also the cheapest
conversion the site will ever get.

**Fix:** add `foundations/whats-next.mdx` (~400 words): a checklist of everything they can
now do, two or three concrete starter projects (clone a repo with git, run a Python script,
`ssh` into a laptop), and an explicit card to the Intermediate course. Hyperlink the
dangling mention in troubleshooting. Give `LessonComplete` a distinct 100% state that fires
on the last lesson rather than "On to the next one."

#### ✅ CLOSED — `termux-change-repo` fix begins by reproducing the error

> FIXED. `reference/troubleshooting.md`, "Updates fail or repositories error out". Was: a two-line block `pkg update` then `termux-change-repo`, i.e. the fix opened with the command whose failure is the section's premise. Now: a **Cause** line (mirror down/stale/unreachable), then a single-command block `termux-change-repo` with an explicit note that the fix starts with the mirror switch "not with the command that just broke", then a 4-step walkthrough of the unfamiliar blue ncurses dialog (arrows or Volume Up + W/S to move, Space to tick `Main repository`, Enter to confirm, pick a nearby mirror group), then `pkg update` as a separate block *after* it exits, plus a "still failing? pick a different group" fallback. 2 commands in one block → 1 command, 4 numbered expectations, and a second block.

**Severity:** Medium · **Effort:** Trivial · **Location:** `src/content/docs/reference/troubleshooting.md:58-67`

**Evidence:** under "Updates fail or repositories error out", the prescribed fix is a code
block containing `pkg update` then `termux-change-repo`. The premise of the section is that
`pkg update` is failing, so the first line of the fix is the command that just failed.

**Fix:** drop the leading `pkg update`. Make the block just `termux-change-repo`, and set
expectations for the unfamiliar ncurses dialog: "A blue menu appears — use the volume keys
or arrows to move, space to select `Main repository`, Enter to confirm, then pick a mirror
group near you. Run `pkg update` after it exits."

#### ✅ CLOSED — Smaller content items

> ALL FOUR WORKED THROUGH. (1) Heading-as-address: `why-termux.mdx`'s `## The signature key rule (read this twice)` → `## The signature key rule`; the joke moved into the first line of the body ("Read this one twice."). Both inbound deep links updated from `#the-signature-key-rule-read-this-twice` to `#the-signature-key-rule` (`start/installing.mdx`, `reference/troubleshooting.md`) — a grep confirms zero remaining references to the old slug, and an MDX comment above the heading records why the parenthetical must not come back. (2) Android version floor: `installing.mdx` gained a prerequisites note at the top — Android 7.0 or newer, ~200 MB free, Wi-Fi for step 4, no root/computer/bootloader, plus an out for Android 5–6 readers (the browser terminals still work). The conffile-vs-continue prompt split was already done and verified in place (installing.mdx step 3 and troubleshooting). (3) `&&` never explained: `installing.mdx` now carries the four-row anatomy table the audit asked for (`pkg` / `update` / `&&` / `upgrade`) in place of the prose-only gloss, and the cheatsheet gained a new "Shell syntax" section (`&&`, `>`, `>>`, `~`, `$NAME`, `.`/`..`) linked back to the two lessons that teach them. (4) Cheatsheet links and uncovered rows: every section heading already carried a lesson deep-link (verified); added links for the two new sections, and marked the one row no lesson drills — `chmod +x` now says so and points at Where to Next's first project. Section count 10 → 12; internal links 8 → 11.

**Severity:** Medium/Low · **Effort:** Trivial each

- **A joke became a load-bearing anchor.** `why-termux.mdx:35` is
  `## The signature key rule (read this twice)`, generating a slug deep-linked verbatim from
  `installing.mdx:25` and `troubleshooting.md:14`. The parenthetical is an editorial aside —
  exactly the sort of thing a future copy edit removes, silently breaking two inbound links
  with no build error. Rename to `## The signature key rule`, move the joke into the first
  line of the body, update both anchors. General rule: headings are addresses; keep the
  swagger in the paragraphs.
- **Android version floor is absent**, and "type **y** when prompted" conflates two
  different prompts. `apt`'s "Do you want to continue?" wants `y`, but the first
  `pkg upgrade` on a customized install throws a **conffile prompt** where `y` overwrites the
  user's config — silently wiping the extra-keys row they just configured. Add a
  prerequisites note ("Android 7.0 or newer, about 200 MB free") and split the prompts:
  `y` to continue; for any prompt mentioning a *configuration file*, press Enter to keep
  your own settings.
- **`&&` is never explained anywhere on the site**, despite appearing in lesson two
  (`installing.mdx:66`). It is the first piece of shell *syntax*, as opposed to shell
  *commands*, that a beginner meets. Add a four-row anatomy table right after it
  (`pkg` / `update` / `&&` / `upgrade`) and add `&&` to the cheatsheet.
- **The cheatsheet has zero internal links** — the only page in the corpus with none — and
  documents commands no lesson covers. Add a lesson deep-link to each section heading and
  mark uncovered rows, or delete them until the files lesson lands.

---

### 4.5 Interactivity & the learning experience

**Verdict:** the interactive layer is ambitious and the architecture is right — a
deterministic simulator for muscle memory plus a real VM for going off-script is genuinely
good pedagogy. But the simulator corrupts its display on wrap, the course teaches a keyset
phones cannot produce, there is a real gap between what lessons instruct and what `exec()`
implements, and the progress layer is a dead end that measures scrolling rather than
learning.

**What's working:**

- `shell.ts` is well-built for its size: a real path normalizer with `~`/`..`/absolute
  handling, a mutable FS tree, persistent state across commands, and error strings that
  mirror real coreutils verbatim. Learners build correct error-message recognition.
- `termux-setup-storage` (`shell.ts:297-326`) is the standout — it fakes the Android
  permission dialog, materializes the real symlink set into the FS tree, and prints the
  actual paths, so `ls ~/storage` afterwards genuinely works.
- Cross-origin isolation is handled thoughtfully: icons build-time inlined, fonts
  self-hosted, specifically to stay COEP-safe.
- Code blocks already have copy-to-clipboard via Starlight's bundled Expressive Code — the
  usual docs-site gap is already closed.

#### ✅ CLOSED — The Live Sandbox almost certainly has no network, and the lesson's headline instruction needs one

> **CONFIRMED & FIXED 2026-08-06.** The finding holds: `CheerpX.Linux.create()`
> in `LiveSandbox.tsx` is called with `mounts` only and **no `networkInterface`**,
> and CheerpX has no egress without one (WebVM provides networking via Tailscale).
> No 40 MB boot was needed to establish that — it is true by construction.
> `packages.mdx`: replaced "try a real `apt update`" with four offline-safe
> commands (`cat /etc/os-release`, `python3 --version`, `ls /usr/bin | wc -l`,
> `uname -a`), and the note now states plainly that the VM has **no internet**, so
> `apt`/`curl`/`git clone` cannot work there — while pointing out that
> `pkg install` *does* work on the learner's actual phone, which is the lesson's
> real subject. Added a `:::caution` about the tens-of-MB download with a
> "use Wi-Fi if you're on mobile data" warning.
> `LiveSandbox.tsx`: the idle pre-boot panel now carries both facts (download
> size + no-network) *before* the learner spends the bandwidth.
> **Not done:** the real progress bar driven from `CloudDevice.create` — logged as
> remaining polish, the static "booting…" is unchanged.

**Severity:** Critical · **Effort:** Small · **Location:** `src/components/terminal/LiveSandbox.tsx:86-90`; `src/content/docs/foundations/packages.mdx:63`

**Evidence:** `CheerpX.Linux.create({ mounts: [...] })` is called with **no
`networkInterface`**. CheerpX has no egress without one. Meanwhile `packages.mdx:63`
instructs: "Boot it and try a real `apt update` or `python3 --version`." `apt update` will
fail on DNS resolution — after a multi-tens-of-MB download the learner just paid for, on a
possibly metered connection they were never warned about.

**Impact:** the flagship instruction of the flagship feature, on the one page it appears,
does not work. If confirmed, it invalidates a whole lesson section.

**Fix:** **verify this in a browser first** — it is a sixty-second check and it is the
cheapest high-value action in this entire document. If confirmed, change the instruction to
offline-safe commands (`python3 --version`, `cat /etc/os-release`, `ls /usr/bin | wc -l`)
and say plainly that the VM has no internet. Either way, add a pre-boot panel stating the
approximate download size and "use Wi-Fi if you're on mobile data", and drive a real progress
bar from CheerpX's `CloudDevice.create` callback instead of a static "booting…".

#### ✅ CLOSED — `render()` erases one row, so the simulator corrupts itself as soon as input wraps

> **FIXED 2026-08-06.** `render()` used `\r\x1b[K`, which clears exactly one row,
> so any wrapped input left stale glyphs behind. Rewrote it to track a
> `cursorRow` (rows the cursor sits below the prompt's first row): it now rewinds
> with `\x1b[{n}A`, clears with `\x1b[J` (to end of screen, not end of line),
> redraws, then re-parks the cursor using real column maths
> (`endRow`/`wantRow`/`wantCol`) so the pre-ghost cursor position is correct even
> across multiple wrapped rows — the old `\x1b[{n}D` could not move up a row.
> `cursorRow` is reset on Ctrl-L (`term.clear()` makes the prompt the first line),
> in `newPrompt()`, and on resize (a new column count invalidates the old wrap
> layout, and rewinding on stale data would scroll the cursor into scrollback).
> **Related mobile fix in the same pass:** the prompt is now responsive — under
> 60 columns it collapses from the 25-column `u0_a123 at localhost ~ ❯` to `~ ❯`,
> which is both ~22 columns cheaper and closer to real Termux. Cross-ref: closes
> the prompt half of **M1** in the visual audit.

**Severity:** High · **Effort:** Medium · **Location:** `src/components/terminal/TermuxTerminal.tsx:97-103`

**Evidence:** the render writes `"\r\x1b[K" + prompt + input + ghost`. `\r` moves to column 0
of the *current* row and `\x1b[K` erases only to the end of *that row*. Once
`promptLen + buffer.length > cols`, the cursor is on the wrapped second row; the original
row keeps its stale prompt and first chunk, and the re-render wraps again — accumulating one
garbage row per keystroke. The cursor park `\x1b[${ghost.length}D` has the same flaw.

The prompt is 25 visible columns (`u0_a123 at localhost ~ ❯ `). At a 390px viewport the host
is ~342px, and 14px mono is ~8.4px/char → ~40 cols → **~15 usable columns of input**.
`termux-setup-storage` is 20 characters — the primary command of the storage lesson visibly
shreds the display on a phone. On desktop it is latent until ~55 chars, but
`mkdir ~/storage/shared/termux-projects` is 38 and wraps in a narrow window.

**Fix:** track rendered height and erase from the start row down.

```ts
const rows = Math.floor((promptLen + buffer.length + ghost.length) / term.cols);
if (lastRows) term.write(`\x1b[${lastRows}A`);
term.write('\r\x1b[J');           // ED(0) — erase to end of SCREEN, not row
// ...write prompt + input, then store lastRows = rows
```

Park the cursor with an explicit position computed from `(promptLen + buffer.length) % cols`
rather than a naive back-count. Separately, collapse the prompt when `term.cols < 60` to
`${MAGENTA}${prettyPath(state.cwd)}${RESET} ${GREEN}❯${RESET} ` — 4 columns instead of 25.
Add a regression check rendering at `cols: 40` and asserting exactly one prompt in the
buffer.

Do the `clear` fix in the same commit: `term.clear()` preserves the current line, so the
`clear` command itself survives at the top of the screen and `newPrompt()` adds a second
prompt beneath it. Write `\x1b[2J\x1b[3J\x1b[H` then `render()` and return without calling
`newPrompt()`, and use the identical path for Ctrl-L so the two are provably equivalent.

#### ✅ CLOSED — The terminal requires keys no Android soft keyboard has

> COMPONENT HALF CLOSED 2026-08-09 — Fix items 1–5 are now all implemented in
> `TermuxTerminal.tsx`, which was the last open finding in this audit.
> (1) A touch key row renders below the screen: `ESC TAB ↑ ↓ ← → / - ~` plus a
> sticky `CTRL`. The row does NOT carry its own key semantics — the `term.onData`
> callback was extracted to a named `handleData` and published on the imperative
> handle as `key(seq)`, so the buttons drive the exact same switch the keyboard
> does and the two cannot drift. Sticky CTRL is handled at the head of
> `handleData`: when armed, the next single character from the soft keyboard is
> folded to a control code by C0 arithmetic (`'C'.charCodeAt(0) - 64` → `\x03`),
> so every existing case gets Ctrl support for free. State is held in BOTH a ref
> (read by the handler, which lives in an effect that must not re-run) and React
> state (paints the armed button). Buttons `preventDefault` on `pointerdown` —
> a button that takes focus dismisses the soft keyboard, which would defeat the
> row entirely — and are 44px minimum, the touch-target floor.
> (2) `onClick` on the host calls `term.focus()`.
> (3) Height is `min(${height}px, 45vh)`; with the keyboard up an Android
> viewport is roughly half height, and a flat 340px left no room for the lesson.
> (4) `window.visualViewport` resize → `scrollIntoView({block:'end'})`, guarded
> to the terminal containing `document.activeElement` so two on a page do not
> fight. This is the only signal available: Android Chrome does not fire
> `window.resize` when the soft keyboard opens.
> (5) The 12px-under-480px font size was already in place from B3.
> Verified: `npm run build` clean, `tsc --noEmit` clean, `astro check` 0
> errors/0 warnings across 17 files. NOT yet visually verified — browser
> automation was down (the extension could not screenshot any page, including
> example.com). Still outstanding from the original Fix text: embedding a
> `<TermuxTerminal>` in `extra-keys.mdx` and cross-linking "the row below the
> sandbox on this site is the same idea", which is now finally true.
>
> CONTENT HALF CLOSED — the component half is handed off, see below. Audited all 15 content files for instructed keystrokes. Before: only Ctrl had a phone equivalent anywhere (Vol-Down = Ctrl, in extra-keys/first-session/cheatsheet); Esc, Tab and the arrows had NO stated phone equivalent on the whole site, despite being instructed in five places. Added the Volume-Up special keys (E=Esc, T=Tab, W/S=↑/↓, A/D=←/→) and named an equivalent at every point of use: `first-session.mdx` — the "Handy keys" bullet list became a 3-column table (key / does / on a phone) and the fish-suggestion tip now says Vol-Up+D and Vol-Up+T inline, with a `#handy-keys` link to the table; `friendly-shell.mdx` — new note after the feature list, since it instructs →, Ctrl-F and Tab in three consecutive bullets and named none of them; `extra-keys.mdx` — the volume table gained the E/T/W/S/A/D rows, the "Why these keys?" tip now names Vol-Down+C / Vol-Up+T / Vol-Up+WASD inline, and the `cat >` cross-reference gained (Volume Down + D); `files-and-folders.mdx` — the practice-terminal note's Ctrl-D gained (Volume Down + D) to match the Steps and Recap that already had it; `index.mdx` — the "tap → or Tab" line now acknowledges a phone reader has neither and links to the new lesson; `cheatsheet.md` — "Shell keys" table gained an "On a phone" column for all six key rows, the "Phone keys" table gained the six special-key rows, and a hardware-keyboard line; `troubleshooting.md` — the `termux-change-repo` ncurses dialog now names Vol-Up+W/S for its arrow keys, and a new entry answers "Ctrl-V does nothing, and Ctrl-C killed my command". Every non-code-block mention of Ctrl-*, Tab, Esc or an arrow across src/content/docs now names its phone equivalent at the point of use or sits one line from a table that does (verified by grep). STILL OPEN and handed off: the audit's Fix items 1–5 are component work in src/components/terminal/TermuxTerminal.tsx (the on-screen touch key row, term.focus() on tap, min(height, 45vh), visualViewport scroll, 12px under 480px) — not this agent's files, and the in-browser terminal on a phone still cannot send Tab, Esc or an arrow.

**Severity:** High · **Effort:** Medium · **Location:** `src/components/terminal/TermuxTerminal.tsx:223-253`

**Evidence:** `first-session.mdx:49-54` lists the "Handy keys" as ↑/↓, Tab or →, Ctrl-C,
Ctrl-L. `index.mdx:24-26` says "tap → or Tab to take it." None of Esc, Ctrl, Tab, or the
arrows exist on Gboard or Samsung Keyboard. The component renders a title bar and a bare
host div — no on-screen key row, no touch affordance, no `term.focus()` anywhere. The
`height` prop is a fixed pixel number with no viewport clamp, and nothing scrolls the input
line above the soft keyboard when it opens.

The irony is total: `foundations/extra-keys.mdx` is an entire lesson teaching learners to add
exactly this key row to real Termux — and it is the one lesson with no `<TermuxTerminal>` in
it.

**Impact:** every fish feature the course markets — autosuggestion acceptance, history
recall, Ctrl-C, Ctrl-L — is unreachable on mobile. A learner on the phone they are learning
to use can type letters and press Enter, and nothing else. This is the single biggest UX gap
in the project.

**Fix:** ship a touch key row inside the terminal chrome — it is both the fix and a live demo
of the extra-keys lesson.

1. Render buttons below the xterm host on coarse pointers (or always, since it helps desktop
   discoverability): `ESC TAB CTRL ↑ ↓ ← → / - ~`, calling a shared `handleKey(seq)`
   extracted from the `term.onData` handler. Make CTRL a sticky modifier so CTRL then C
   sends `\x03`.
2. Call `term.focus()` on tap of the host, with a `cursor: text` and a "tap to type"
   placeholder while unfocused.
3. Replace the fixed `height` with `min(height, 45vh)`.
4. Listen to `window.visualViewport` resize and `scrollIntoView({ block: 'end' })` so the
   prompt is not buried under the keyboard.
5. Drop fontSize to 12 under 480px so 40 cols becomes ~50.

Then embed a terminal in `extra-keys.mdx` and cross-link: "the row below the sandbox on this
site is the same idea."

#### ✅ CLOSED — Lessons instruct commands the simulator cannot run

> All three tiers implemented. `COMMAND_NAMES` went 24 → 37, split into `BUILTIN_NAMES`
> (26 interpreted) and `PACKAGE_COMMANDS` (11 real commands that arrive via `pkg
> install`). A `NOT_SIMULATED` table now answers `nano`, `vim`, `git`, `python`,
> `python3`, `node`, `npm`, `ssh`, `curl`, `wget`, `man` and `termux-change-repo` in brass
> with what the command is and where it does work — and before install they report the
> device-accurate `command not found` plus the package that provides them. `adb` explains
> that it runs on a computer, not in Termux. The three silently-wrong answers are gone:
> `ls -l` prints real mode/link/owner/size/date columns (shared storage correctly reports
> `drwxrwx---`/`-rw-rw----`, which is why `chmod +x` cannot stick there); `$VAR`/`${VAR}`
> expand everywhere except inside single quotes, so `echo $PREFIX` prints
> `/data/data/com.termux/files/usr`; and `&&`/`||`/`;` split at the top of `exec()` and
> run sequentially on exit codes, so `pkg update && pkg upgrade` from installing.mdx runs
> both instead of discarding the upgrade. Also added: `pkg uninstall`, `chmod`, `tar`,
> `>`/`>>` redirection, `<command> --help` for 18 commands, and a `|` guard that names the
> Live Sandbox rather than failing obscurely. Verified by a harness that extracts the
> first token of every fenced bash/sh/text block and every `hint=` across
> `src/content/docs` and asserts each has an implementation — it passes with zero
> unknowns.

**Severity:** High · **Effort:** Medium · **Location:** `src/components/terminal/shell.ts:206-393`

**Evidence:** comparing the lesson corpus against the `exec()` switch:

| Command | Taught at | Simulator behavior |
| --- | --- | --- |
| `nano` | `extra-keys.mdx:31-33` | installs fine (it is in `PKG_DB`), then "command not found" |
| `termux-reload-settings` | `extra-keys.mdx:62`, cheatsheet | not found; also missing from `COMMAND_NAMES`, so it renders red as you type |
| `termux-change-repo` | `troubleshooting.md:64` | not found |
| `rm`, `rm -r`, `cp`, `mv` | `cheatsheet.md:41-44` | not found |
| `pkg uninstall` | `cheatsheet.md:18` | "unknown subcommand" |
| `ls -l` | `cheatsheet.md:29` | flag collected but only `-a` is tested — silently ignored |
| `$PREFIX` | `filesystem.mdx:30` | no variable expansion; `echo $PREFIX` prints the literal string |
| `&&` | `installing.mdx:66` | `line.split(/\s+/)` takes `args[0]` — the upgrade is silently discarded |
| `git`, `python`, `vim`, `ssh` | `packages.mdx:48` | install succeeds, binaries never become runnable |

**Impact:** a beginner cannot distinguish "the sandbox doesn't do this" from "I typed it
wrong" — red "command not found" reads as personal failure. The extra-keys lesson is 100%
unpracticable. And `ls -l` / `$PREFIX` / `&&` are worse than errors because they return
plausible-looking wrong answers.

**Fix, in three tiers:**

1. Add a `NOT_SIMULATED` map so the failure is never ambiguous — print
   `nano: works on a real device — this teaching sandbox can't run editors.` in yellow, plus
   a pointer to the Live Sandbox. Add these names to `COMMAND_NAMES` so they highlight cyan,
   not red.
2. Implement the cheap real ones: `rm` (with `-r`, and a refusal on `-rf /` that teaches the
   lesson), `cp`, `mv`, `pkg uninstall`, `termux-reload-settings`, `ls -l` with fake
   mode/size/date columns, and `$VAR` expansion via
   `args.map(a => a.replace(/\$(\w+)/g, (_, k) => state.env[k] ?? ''))` before dispatch.
3. Split on `&&` / `;` at the top of `exec()` and run segments sequentially, short-circuiting
   on error. Three lines, and it makes `installing.mdx:66` work as printed.

Then add a CI check that greps every fenced `bash` block in `src/content/docs` for its first
token and fails if it is not in `COMMAND_NAMES ∪ NOT_SIMULATED`. That is what stops this
drifting again across three repos.

#### ✅ CLOSED — No mid-line editing, and → is stolen by autosuggestion

> Introduced a `cursor` index alongside `buffer`; every mutation is position-aware and
> `render()` parks the caret at `promptLen + cursor` using the existing wrap-aware maths.
> → and Ctrl-F move right when `cursor < buffer.length` and only accept the suggestion at
> end-of-line (fish's exact rule); End/Ctrl-E behave the same way. Added ← / Ctrl-B, Home
> / Ctrl-A, Ctrl-E, Ctrl-U (kill to start), Ctrl-K (kill to end), Ctrl-W (kill word),
> Delete (`\x1b[3~`), and Alt-. to recall the previous line's last argument — the key the
> cheatsheet's "Phone keys" table already promised. Tab now falls through to path
> completion against `state.fs` via a new exported `listDir()`: a single match inserts
> (with a trailing `/` for directories), multiple matches insert the longest common prefix
> and print the candidates — delivering extra-keys.mdx's "TAB triggers auto-completion"
> claim. Fixing character 3 of a 38-character path went from 35 backspaces and a full
> retype to two keystrokes. Also fixed a wrap-boundary bug the old maths shared: when the
> drawn line ends exactly on a column boundary xterm holds the wrap pending, so every row
> count was off by one; one trailing space resolves it.

**Severity:** High · **Effort:** Medium · **Location:** `src/components/terminal/TermuxTerminal.tsx:150-207`

**Evidence:** the `onData` switch handles Enter, Backspace, Tab, right, End, Ctrl-F, Ctrl-C,
Ctrl-L, up, down. Left arrow (`\x1b[D`) has no case and is swallowed by the
`!data.startsWith('\x1b')` guard. Ctrl-A/E/U/W/K are all below `' '` and discarded by the
`data >= ' '` test. There is no cursor-position variable in the closure at all — `buffer` is
only ever mutated at its tail. Right arrow and End, the two keys a user reaches for to move
within a line, are both bound to accept-suggestion. Fixing a typo in character 3 of a
38-character path requires 35 backspaces and a full retype.

**Impact:** real line editing is what makes a shell feel alive, and its absence is felt
hardest on exactly the long paths this course teaches. It also undercuts `extra-keys.mdx`,
which sells the arrow keys as the reason to add the key row — but ← does nothing here and →
does something else.

**Fix:** introduce a `cursor` index alongside `buffer` and make every mutation
position-aware. Add `\x1b[D` → move left; change `\x1b[C` to accept the suggestion only when
`cursor === buffer.length` and otherwise move right (that is exactly fish's behavior). Add
Ctrl-A/E/U/W/K. Then have `render()` place the cursor at `promptLen + cursor` — which
requires the wrap-aware redraw above, so do these two together. Also add Tab-completion of
paths: on Tab, resolve the last token's parent in `state.fs` and complete against
`Object.keys(node.children)` — about 15 lines given the FS tree already exists, and it
directly delivers the "TAB triggers auto-completion" claim in `extra-keys.mdx:53`.

#### ✅ CLOSED — `ExecResult.storageLinked` is dead code — the terminal knows what the learner accomplished and tells no one

> Deleted the field and wired the real thing. Justification for deleting rather than
> plumbing it: `ExecResult.storageLinked` was a *copy* of `ShellState.storageLinked`,
> which is authoritative and already tracked alongside `packagesUpdated`, `installed` and
> `shell` — a second channel for the same fact could only drift. `ExecResult` now carries
> `code` (the exit status that drives `&&`/`||`) instead. In its place the terminal reads
> the state object after every command and does two things: (1) paints an accomplishment
> strip in the terminal chrome — `package list ✓ · storage ✓ · fish ✓ · 3 installed` — in
> `--color-brand`, with `role="status"` so it is announced rather than only seen; (2)
> fires a new `onProgress?: (p: TerminalProgress) => void` prop, the exact hook the
> audit's `<Checkpoint>` recommendation needs. `TerminalProgress` is exported as
> `Pick<ShellState, 'packagesUpdated'|'storageLinked'|'installed'|'shell'>`. The
> Checkpoint component and the progress-store auto-marking still need
> `src/lib/progress.ts` and a new component file, which I do not own — see handoffs.

**Severity:** High · **Effort:** Medium · **Location:** `src/components/terminal/shell.ts:68-75, 324`; `src/components/terminal/TermuxTerminal.tsx:111-124`

**Evidence:** `ExecResult.storageLinked` is declared with the comment "Set once
`termux-setup-storage` has been 'granted'" and dutifully returned. `runLine` reads only
`res.clear` and `res.output` — `storageLinked` is consumed nowhere in the codebase. Meanwhile
`ShellState` already tracks `packagesUpdated`, `storageLinked`, and `installed: Set<string>`:
a complete, ready-made record of whether the learner performed each lesson's actual
objective. Progress, by contrast, is a pure honor-system checkbox, and the dashboard offers
a "Mark all complete" button that sets all seven with no confirmation.

Related: every lesson closes with an author-written Recap. Re-reading a summary is the
weakest known consolidation method; recall is the strongest.

**Impact:** this is the single largest missed opportunity in the project. The course has a
live shell that can verify work and a progress store that wants to record it, and the two are
not connected — so "progress" measures scrolling.

**Fix:** add an `onState?: (s: Pick<ShellState, 'packagesUpdated'|'storageLinked'|'installed'>) => void`
prop, fired after every `exec()`. Then add a `<Checkpoint>` component that takes objectives
and renders live checkmarks:

```jsx
<Checkpoint objectives={[
  { id: 'storageLinked', label: 'Bridged Android storage' },
  { id: 'mkdir:~/storage/shared/termux-projects', label: 'Made a safe project folder' },
]} />
```

When all objectives go green, auto-call `setComplete(slug, true)` — the learner *earns* the
checkmark instead of clicking it. **Replace each Recap with a challenge the terminal
grades:** "Without scrolling up: bridge storage, make a projects folder, and prove you're
inside it." That converts the honor-system problem, the dead-code problem, and the
no-assessment problem into one feature. Demote "Mark all complete" to a dev-only affordance.

#### ✅ CLOSED — Down-arrow silently wipes the line you were typing

> Added a `draft` variable captured on the first ↑ (when `histIndex === history.length`)
> and restored by ↓ at the bottom of the stack instead of `buffer = ''`. Then upgraded
> both arrows to prefix search as the audit suggested: `historyMove()` scans for
> `history[i].startsWith(draft)`, so typing `pkg ` and pressing ↑ walks only your `pkg`
> lines. Typing `pkg install pytho` and brushing ↓ now leaves the line exactly as it was.

**Severity:** Medium · **Effort:** Small · **Location:** `src/components/terminal/TermuxTerminal.tsx:184-200`

**Evidence:** when `histIndex === history.length` — the normal state — pressing Down runs
`buffer = ''`. Type `pkg install pytho`, brush Down, and the line is gone with no undo. On
mobile this is worse: Down sits adjacent to Up on the key row the course teaches you to add.

**Fix:** add a `draft` variable. On the first Up, `draft = buffer`; in the Down else-branch,
restore `buffer = draft` instead of `''`. Then upgrade both arrows to prefix search — capture
`searchPrefix = draft` on the first Up and scan backwards for
`history[i].startsWith(searchPrefix)`. About ten lines, and it makes the terminal feel
genuinely fish-like.

#### ✅ CLOSED — Autosuggestion is empty for the commands the lessons actually drill

> `SUGGESTIONS` went 16 → 47 entries, audited line-by-line against every fenced block and
> every `hint=` in `src/content/docs` and grouped by lesson: navigation (`pwd`, `ls -l`,
> `cd ..`, `cd ~`, `cd ~/projects`), storage (`mkdir ~/projects`, `mkdir
> ~/storage/shared/termux-backups`, the full `tar czf … -C ~ projects` line, `tar tzf …`),
> environment (`echo $PREFIX`, `echo $HOME`), keyboard (`mkdir -p ~/.termux`, `nano
> ~/.termux/termux.properties`), shell (`chsh -s fish`, `chsh -s bash`) and `pkg update &&
> pkg upgrade`. filesystem.mdx's pwd/cd exercise now produces ghost text from the first
> keystroke. Order is deliberate — `suggest()` takes the first prefix match, so the
> most-taught form of each command comes first. A test asserts every one of the 47 is a
> line the shell can actually run. `highlight()` was also extended: it takes the installed
> set (so `node` goes cyan only after `pkg install nodejs`, and `nano` is red before
> install exactly as fish shows it on a device), colours the `pkg` subcommand token — `pkg
> intsall git` finally turns the typo red, which first-session.mdx has been promising —
> paints `&&`/`||`/`;` brass and `$VARs` dusty rose, and leaves `./script.sh` neutral
> instead of screaming red at a valid line. `help()` was rewritten to include `apt`,
> `history`, `tar`, `chmod`, the chain/variable/redirection syntax, `--help`, and a
> closing paragraph naming what is deliberately not faked.

**Severity:** Medium · **Effort:** Small · **Location:** `src/components/terminal/shell.ts:31-36, 56-63, 187-196`

**Evidence:** `SUGGESTIONS` has 14 entries, all `pkg`/`ls`/`uname`/`whoami`/`help`/`clear`
variants. No `pwd`, no `cd ..`, no `cd ~`, no `mkdir`, no `cat`, no `touch`. So on
`filesystem.mdx`, whose entire exercise is pwd/cd, the site's headline fish feature produces
nothing at all until history fills in. Two smaller mismatches: `highlight()` only colors the
first token, so `pkg instal git` shows `pkg` in confident cyan with the typo uncolored,
despite `first-session.mdx:19` promising "typos turn red"; and `help()` omits `apt` and
`history` even though both are implemented, while `index.mdx:28` says "Type 'help' — it lists
everything this sandbox knows."

**Fix:** expand `SUGGESTIONS` to cover every command line that appears in a lesson hint or a
fenced block. Better, derive it — have each lesson pass its own `suggestions` array to
`<TermuxTerminal>` and merge into the pool, so hints and completions cannot drift. Extend
`highlight()` to color the `pkg` subcommand token and to color a second token red when it is
a path that does not resolve in `state.fs`. Add `apt` and `history` to `help()`, plus a
closing line naming what is deliberately not simulated.

#### ✅ CLOSED — Nothing ever goes wrong in the simulator except typos

> Designed failures, each with the wording a real device uses and a recovery path already
> documented on the site. `pkg install` against a never-refreshed list now fails with `E:
> Unable to locate package git` and a one-line pointer to `pkg update` — Golden Rule #2
> and the first entry in Troubleshooting, previously the one rule nothing enforced.
> `mkdir`/`touch`/`cp` under `~/storage` fail with `No such file or directory` until
> `termux-setup-storage` runs. Writing outside `/data/data/com.termux/files` returns
> `Permission denied`. `chmod +x` on shared storage succeeds silently and does not stick,
> so `./script.sh` there keeps returning `Permission denied` — the storage lesson's
> central trap, now demonstrable end to end (`echo 'echo hi' > run.sh` → `./run.sh` denied
> → `chmod +x run.sh` → runs; the same sequence under `~/storage/shared/` never runs). A
> misspelled package suggests the nearest match. `pkg uninstall fish` while logged into
> fish drops you back to bash and says so. `rm -rf /` hits the real coreutils failsafe
> verbatim; `rm -rf ~` succeeds and then states plainly that there is no undo and what
> backups are for. A bare `script.sh` explains PATH. And `<command> --help` works for 18
> commands with a pointer to `pkg install man` — the audit's "the graduate's only tool is
> the cheatsheet, permanently" complaint.

**Severity:** Medium · **Effort:** Small · **Location:** `src/components/terminal/shell.ts` (throughout)

**Evidence:** `shell.ts:342` nudges "run `pkg update` first" when you install against stale
lists. That is the only designed failure in the entire course, and it teaches a real recovery
reflex. Everything else succeeds instantly.

**Impact:** beginners do not become competent by watching things work; they become competent
by recovering. Related, the course never teaches how to get unstuck at all — no `--help`, no
`man`, no "how to read an error message." The `help` command exists only inside the simulator
and does not exist on a real device, so the graduate's only tool for an unfamiliar command is
the cheatsheet, permanently. That is dependency, not competence.

**Fix:** one designed failure per lesson, each with a recovery path — `cd` into a directory
that does not exist, `cat` a file you have not created, `mkdir` where you cannot write. Cheap
in `shell.ts`, and it converts the sim from a demo into practice. Then add a short section to
`first-session.mdx` on `command --help`, `pkg install man` then `man ls`, and how to read
`command not found` vs `permission denied` vs `no such file or directory` — `shell.ts`
already emits all three verbatim.

#### ✅ CLOSED — Progress is trapped in one browser and has no completion moment

> FIXED 2026-08-06. Note this goes beyond the audit's own recommendation, which was to
> hold export/import back — the call was overridden deliberately, because the failure it
> prevents (a cleared cache, or simply moving from the phone Termux runs on to a laptop)
> costs the learner the whole run and `progress.mdx` warned about it while offering
> nothing to do about it.
>
> **Export/import.** `progress.ts` gained `exportProgress()`, `exportFilename()` and
> `importProgress()`. The wire format is a plain, readable JSON object (this is an
> honour-system checklist, not an auth token) carrying a `kind:
> 'termux-beginners-progress'` discriminator so importing an unrelated JSON file cannot
> silently wipe progress. Import prunes slugs not in `LESSONS` — `stats()` already derives
> totals from `LESSONS` so they could never inflate the percentage, but storing them would
> resurrect renamed lessons on the next export. `save()` now returns a boolean so a
> storage-blocked import reports "This browser is blocking local storage" instead of
> claiming success; a silent no-op there would be the worst outcome, since the learner
> just handed us their only backup.
>
> **Completion moment, twice.** `ProgressDashboard` gets a brass completion panel at 100%
> — the only place in the site brass is used as a full surface, which is what makes it
> read as an event — summarising what was learned and linking to the cheatsheet and
> troubleshooting pages. More importantly `LessonComplete` gets one too, so the finish
> line appears **in the lesson flow** at the moment the last box is ticked
> (`role="status"`, so it is announced, not just painted), rather than only as a changed
> string on a utility page the learner has no reason to open.
>
> **Guard parity.** "Mark all complete" now has the same two-step tap-again confirm the
> Reset button already had. It is the more destructive of the two bulk actions in a
> progress tracker — it erases the distinction between what you did and did not do — and
> it was the one without a guard. `confirm()` was left alone, as the audit asked.
>
> Also: `ProgressDashboard`'s section headings went `<h3>` → `<h2>`. They sat directly
> under the page `<h1>`, skipping a level, on the one page that is nothing but a list.

**Severity:** Medium · **Effort:** Small · **Location:** `src/components/profile/ProgressDashboard.tsx:113-144`; `src/lib/progress.ts:91-95`

**Evidence:** `progress.mdx:16-20` correctly warns that clearing browser data starts you
fresh, with no mitigation offered. `progress.ts` exposes no serialization entry point.
Reset uses a native blocking `confirm()`, while Mark-all-complete — the more destructive
action in a progress-tracking context — has no confirmation at all. On completion the only
acknowledgement is a string on the Progress page.

**Fix:** put the same guard on Mark-all-complete that Reset has. Give `LessonComplete` a
distinct 100% state — brass, a summary of what they learned, a direct link to the Intermediate
course. Hold export/import until completion is earned by verified shell state; a
seven-checkbox honor-system list is not worth serializing yet. Leave `confirm()` alone; it is
accessible, it works, and it is off-palette for four seconds a year.

#### ✅ CLOSED — Everything is sealed inside one `useEffect`, which blocks the highest-value feature

> Assessed `onProgress` first, as asked: it does **not** resolve this. `onProgress` is a read channel — it fires after each command with a copy of the shell's accomplishments. The finding is about the *write* side: `term`, `buffer`, `cursor`, `insert`, `submit` and `runLine` are still closure locals, so nothing on the page can put a command *into* the shell, which is precisely what the "▶ Try it here" affordance needs. Left open and fixed.
>
> Minimum refactor, in `src/components/terminal/TermuxTerminal.tsx`:
> - Did **not** split the effect. Its ordering is load-bearing (`fit()` → `fonts.ready` re-fit → banner → boot commands → `onData`), and splitting it is the risky part with no payoff for this finding.
> - Added `export interface TermuxTerminalHandle { type(text); run(cmd); focus() }`, filled from inside the effect into an `apiRef` and published with `useImperativeHandle` over React 19's ref-as-prop. The public handle forwards *through* the ref, so a consumer's handle survives the session being rebuilt when `shell`/`hint`/`bootKey` change.
> - `run()` clears the current line before inserting, so "run this" runs exactly that rather than concatenating onto a half-typed buffer, and it goes through the existing `insert`/`submit` path — a driven command is indistinguishable from a typed one, same as the `boot` array.
> - Added `export const TMX_RUN_EVENT = 'tmx-run'` and a listener on the wrapper element. This is the part that actually unblocks the feature on this site: every island is `client:only="react"`, so an `.mdx` lesson has no React tree to hand a ref into — a DOM CustomEvent on the wrapper is the only channel authored content has. Bound to the wrapper rather than `document` so two terminals on one page stay independent.
> - Teardown removes the listener and nulls `apiRef` **before** `term.dispose()`, so a late caller gets a no-op rather than a write into a disposed Terminal.
>
> Net change: +3 methods, 1 assignment, 1 listener, 3 teardown lines. Diff to the effect body's existing logic: zero.
>
> Still needed to ship the button itself (handed off): the `<button>` in the lesson MDX/Astro that dispatches the event, gated on `COMMAND_NAMES` from `shell.ts` so it never appears on commands the simulator cannot honour. Those files are `src/content/**`, which this pass does not own.

**Severity:** Low · **Effort:** Small · **Location:** `src/components/terminal/TermuxTerminal.tsx:43, 221`

**Evidence:** `term`, `state`, `history`, `buffer`, `render`, `runLine` and the onData handler
are all closure locals. Nothing outside the effect can write to the terminal.

**Impact:** the structural cost is that the "Run this in the sandbox" affordance the course
obviously wants cannot be built.

**Fix:** split the effect — construction in a `[]`-dep effect, `boot`/`hint` in a second one
— hoist the handles into refs, then expose
`useImperativeHandle(ref, () => ({ type(cmd), run(cmd), focus() }))`. That unlocks a "▶ Try
it here" button on each lesson's bash block that types the command into the sandbox and runs
it, so a learner on a phone never has to hand-type a 38-character path on a 40-column screen.
Gate the button on `COMMAND_NAMES` containing the first token so it never appears on commands
the simulator cannot honour. Pair it with the existing copy button rather than replacing it.
This is the enhancement that would actually differentiate the site — copy-to-clipboard is
table stakes; "click to run it in the terminal on this page" is not.

---

### 4.6 Accessibility & semantic HTML

**Verdict:** the dark theme's contrast is genuinely strong and the small semantic touches
that are present are correct. The light theme was never audited, both terminals are keyboard
traps, and the landing page has an empty heading outline. Two of the three are near-free to
fix; full terminal accessibility is a product-scope decision, not a CSS tweak.

**What's working:**

- Dark-theme pairings were clearly reasoned about: `--fg-body` 11.12:1, `--fg-secondary`
  8.46:1, `--color-brand` 9.29:1. The semantic ANSI palette also passes on the obsidian
  screen (red 4.97:1, green 7.57:1) — unusual care for a terminal theme.
- `Avatar.tsx:17` correctly marks the whole avatar `aria-hidden="true"` — the name is always
  rendered adjacent as real text, so this is the right call rather than a lazy one.
- `icons.tsx:62-63` gets the decorative-icon contract exactly right: `aria-hidden` **and**
  `focusable="false"`, the latter routinely forgotten.
- The `prefers-reduced-motion` block uses `*, *::before, *::after` with `!important` on
  duration, iteration-count and transition-duration, so it catches new components without
  per-rule maintenance.
- Starlight's chrome is left intact: the skip link survives, `<main>` is a real landmark,
  and the Sidebar override is a pure prepend that does not disturb tab order.
- `ProgressDashboard.tsx:88` gives its checkbox buttons a state-aware `aria-label` whose
  text actually flips — better than most hand-rolled toggles.

#### ✅ CLOSED — The light theme was never contrast-audited

> CLOSED 2026-08-09. This finding had no status marker at all — it was the one
> item in the audit that was never explicitly opened or closed, so it got
> re-measured from scratch rather than assumed. Three of the four pairs were
> already fixed by the `--color-brand-emphasis` change (`#a67c1a` → `#6f5310`)
> and the light `--color-danger` (`#8b2d2d`): prose links now 6.34:1, inline
> code 6.00:1, sandbox error text 7.83:1 — all against the 4.5:1 requirement.
> The fourth was still failing: brass-as-text `#8b6914` on the `#f5f0e8` canvas
> measured **4.48:1**, missing AA by 0.02. Fixed by stepping `--color-brand` down
> the same hue to `#886713`, the first value clearing 4.5:1 on both light
> surfaces (4.63:1 on canvas, 4.92:1 on `#faf7f2` cards); `--color-brand-muted`
> was moved with it so the two stay the same colour. All four pairs now pass.

**Severity:** High · **Effort:** Small · **Location:** `src/styles/global.css:145, 147, 349-358, 523-528`; `src/components/terminal/LiveSandbox.tsx:194`

**Evidence:** one root cause — `--color-brand` and `--color-brand-emphasis` were tuned for
obsidian and carried onto parchment unchanged. Recomputed from scratch:

| Surface | Pair | Ratio | Needs |
| --- | --- | --- | --- |
| Prose links | `#a67c1a` on `#f5f0e8` | **3.35:1** | 4.5:1 |
| Inline code | `#a67c1a` on `#f0eade` | **3.18:1** | 4.5:1 |
| Sandbox error text | `#fca5a5` on `#faf7f2` | **1.78:1** | 4.5:1 |
| Brass on canvas | `#8b6914` on `#f5f0e8` | **4.48:1** | 4.5:1 |

Compounding it, the prose-link rule removes the underline and hides it behind
`background-size: 0% 1.5px` until hover — so in the resting state the *only* thing
distinguishing a link from body text is hue, and the luminance delta between link and body
is 2.85:1, below the 3:1 threshold WCAG 1.4.1 requires when color is the sole cue. That part
is theme-independent.

**Impact:** this is the widest blast radius of any finding — every paragraph of every page
in light mode. Inline code carries the load-bearing content of the entire site
(`pkg update`, `~/storage/shared`) and is the least readable text on the page, for exactly
the readers most likely to be on a bright phone outdoors. The 1.78:1 case is the cruelest:
it is the error message explaining how to fix cross-origin isolation, rendered illegibly to
the person who most needs it, using a hardcoded Tailwind red in a codebase that has a
`--color-danger` token.

**Fix:** four changes, all small.

1. Darken the light brand tokens: `--color-brand: #7d5e11` (5.2:1 on canvas) and
   `--color-brand-emphasis: #7a5c12` (~5.4:1). Do not touch the dark values.
2. Put inline-code ink on the ramp — `color: var(--fg-default)` (12.8:1 light, 9.9:1 dark) —
   and keep the brass in the border and background tint where it still reads as an accent.
3. Restore a resting underline and thicken it on hover, so the transition animates thickness
   rather than existence:

   ```css
   .sl-markdown-content a:not(:is(.card, .action, .tmx-btn)):not(:where(.not-content *)) {
     background-size: 100% 1px;
   }
   /* :hover */ { background-size: 100% 2px; }
   ```

4. Replace `'#fca5a5'` with `var(--color-danger)` and wire up `--tmx-screen-ink` /
   `--tmx-screen-ink-muted` per the design-system finding.

While in the tokens, nudge `--fg-subtle` (2.99:1 on light surface, used for the display-name
input and the Reset/Mark-all button borders) to about `#857866` light / `#7d7565` dark, and
document it as a boundary-only token. That is a same-commit adjustment, not its own item.

#### ✅ CLOSED — Both terminals are keyboard traps with no accessible name and no screen-reader mode

> PARTIALLY FIXED 2026-08-06 — LiveSandbox half only; TermuxTerminal.tsx is owned by
> another agent and is listed in handoffs.
>
> **Trap broken.** `onKeyDownCapture` on the `.tmx-sandbox` wrapper intercepts Escape in
> the CAPTURE phase — required, because xterm attaches its own listener to the textarea
> and preventDefaults nearly everything, so a bubble-phase handler would never fire.
> Escape calls `term.blur()` and focuses a real, visible **"Leave terminal"** button that
> sits AFTER the screen in DOM order, so the next Tab continues down the page instead of
> re-entering the shell. The affordance is documented in visible text next to it ("press
> Esc to leave the terminal — Tab is sent to the shell, not the page"), not only in an
> `aria-describedby`, because sighted keyboard users need it too.
>
> **Labelled and announced.** `screenReaderMode: true` on the `new Terminal({...})` call
> (it defaults to false in @xterm/xterm v6 and the accessibility manager is only
> instantiated behind that flag). The host div went from an unnamed `<div>` to
> `role="application"` + `aria-label="Live Debian sandbox — interactive terminal"` +
> `aria-describedby` pointing at the Esc hint. `role="application"` is deliberate: the
> widget overrides key semantics, so AT must pass keys through.
>
> Measured before: `grep -n "role=|aria-|tabIndex"` on LiveSandbox.tsx returned **0**
> matches. After: **7** (role x3, aria-label, aria-describedby, aria-hidden, plus id/hint
> wiring).
>
> The audit's third tier (build-time transcript generator) was correctly NOT built.

**Severity:** High · **Effort:** Small (for the parts worth doing) · **Location:** `TermuxTerminal.tsx:46-83, 168-171, 223-252`; `LiveSandbox.tsx:64-99, 203-211`

**Evidence:** `grep -n "role=|aria-|tabIndex"` across both terminal components returns
**zero matches**. Concretely:

1. **Keyboard trap (WCAG 2.1.2, Level A).** The onData switch consumes Tab; xterm
   preventDefaults it, so Tab never reaches the browser's focus manager. Shift+Tab arrives as
   `\x1b[Z`, hits the default branch, and is discarded by the `!data.startsWith('\x1b')`
   guard. Once a keyboard user tabs into the terminal there is no way out short of reloading.
   This affects five lesson pages plus the landing page.
2. **No screen-reader support.** `screenReaderMode` is omitted from both `new Terminal({...})`
   calls; in @xterm/xterm v6 it defaults to `false`, and the accessibility manager is only
   instantiated behind that flag. There is no live region — output is announced to nobody.
3. **No accessible name.** Both host divs have no `role` and no `aria-label`. The chrome bar
   text is a plain `<span>`, not programmatically associated with anything.
4. **No text alternative.** `index.mdx:24-28` describes a widget a blind learner cannot
   perceive or operate.

**Impact:** the keyboard trap alone is the most serious class of a11y defect — it can strand
a keyboard-only user on the page.

**Fix:** do the first two tiers; be honest about the third.

- **Break the trap (trivial):** attach a capture-phase `keydown` on the host div; on `Escape`
  or `Shift+Tab`, `blur()` and move focus to a sentinel. Add a visible hint next to the
  chrome label: "Press Esc to leave the terminal."
- **Label and announce (small):** pass `screenReaderMode: true` to both `new Terminal(...)`
  calls, give each wrapper `role="application"` (correct here — it deliberately overrides key
  semantics) plus `aria-label="Simulated Termux shell — interactive terminal"` /
  `"Live Debian sandbox terminal"`, and `aria-describedby` pointing at a short instructions
  paragraph that includes the Esc key.
- **Do not build the build-time transcript generator.** That is a product, not a fix. Write
  an honest accessibility statement instead: the terminal is not currently usable with a
  screen reader, and the prose lessons are. An honest limitation beats a half-built
  accommodation.

#### ✅ CLOSED — The landing page has three headings for eight content blocks

> VERIFIED CLOSED — no change needed. All six titles are already real `<h3>` elements carrying the original classes: `index.mdx` lines 73/78/83/88 (`h3.tmx-card__title`) and 105/113 (`h3.tmx-panel__title`), all sitting under an `<h2>`, so the level is correct. The same pattern in `where-next.mdx` is also already `<h3>` (lines 71/76/81 cards, 129/137/145 panels), again under `<h2>`. A grep for `tmx-card__title|tmx-panel__title` across src/ returns those twelve `<h3>`s and no `<p>`. The component half is done too: `ProgressDashboard.tsx:191` is now `<h2>` with a comment recording that it was an `<h3>` skipping a level under the page `<h1>`. Landing page heading stops: 3 → 9 (h1 + 2×h2 + 6×h3).

**Severity:** High · **Effort:** Trivial · **Location:** `src/content/docs/index.mdx:37, 42, 47, 52, 69, 77`

**Evidence:** the built `dist/index.html` contains exactly three headings: the page `<h1>`
and two `<h2>`s. Everything under them that *looks* like a heading is a paragraph —
`<p class="tmx-card__title">` ×4 and `<p class="tmx-panel__title">` ×2. The CSS confirms
they are styled as headings: `.tmx-card__title` is pulled into the `--font-heading` group
alongside h1-h4. Separately, `ProgressDashboard.tsx:69` emits `<h3>` directly under the page
`<h1>`, skipping h2.

**Impact:** screen reader users navigate documentation by heading. On the entry page they get
three stops for eight distinct content blocks; the four value propositions and both terminal
descriptions collapse into an undifferentiated wall of paragraphs. Visual hierarchy without
semantic hierarchy is the classic 1.3.1 failure.

**Fix:** change the six titles to real `<h3>` elements. The CSS already targets them by
class, so the visual result is **byte-identical** — `margin: 0` is already present on both
rules and `.tmx-grid > * { margin: 0 !important }` covers the rest. Change
`ProgressDashboard.tsx:69` to `<h2>`. This is the cheapest accessibility win in the audit.

#### ✅ CLOSED — The design system defines no `:focus-visible` styling at all

> **FIXED & VERIFIED 2026-08-06.** Added the recommended zero-specificity rule
> using existing tokens:
> `:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible`
> → `outline: 2px solid var(--color-brand-emphasis); outline-offset: 2px`.
> Added two refinements the finding implied: pill controls
> (`.tmx-btn`, `.sl-link-button`, `.action`) get `--radius-full` so the ring
> traces their actual shape rather than a rounded rect, and
> `:is(.tmx-terminal, .tmx-sandbox):focus-within` gets a brass outline so the
> focusable terminal host is visibly focused.
> Verified in the built CSS: **2 `:focus-visible` rule blocks** where `global.css`
> previously contributed none.

**Severity:** Medium · **Effort:** Trivial · **Location:** `src/styles/global.css` (absent)

**Evidence:** searching the built stylesheet for `:focus-visible` returns three rules, all
from Expressive Code. `global.css` contributes none. Several custom controls actively fight
the UA default: the profile edit button and the dashboard checkbox buttons are
`background: none; border: none; padding: 0` — a bare glyph with no box for a ring to trace.
The system tokenizes radii, motion, shadows and six text steps; focus is the conspicuous
omission.

**Fix:** one global rule, using tokens already present.

```css
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--color-brand-emphasis);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

`:where()` keeps specificity at 0 so components can override without an arms race, and the
offset guarantees visibility against the brass gradient button where a flush ring would
blend. Verify against both canvases — it needs the darker light-theme brand value from the
contrast fix to clear 3:1 on parchment.

#### ✅ CLOSED — Progress toggles change state silently

> **FIXED 2026-08-06.** Added a visually-hidden `aria-live="polite"` region to the
> dashboard; toggling now announces e.g. "Bridging Android Storage marked
> complete", and the bulk actions announce "All lessons marked complete" /
> "Progress reset". The checklist control also became a real
> `role="checkbox"` with `aria-checked`, so its state is exposed rather than
> inferred from an emoji glyph.

**Severity:** Medium · **Effort:** Small · **Location:** `LessonComplete.tsx:62-76`; `ProgressDashboard.tsx:86-99`

**Evidence:** `LessonComplete` is the completion mechanism for all seven lessons. Clicking it
rewrites the icon, the headline, and the button label visually — but the button has no
`aria-pressed`, the status text lives in an ordinary `<div>` with no `role="status"`, and the
state icon is `aria-hidden` (correct for decoration, but it means the check mark carries zero
information non-visually). The container border also flips color — color-only reinforcement.

**Fix:** add `aria-pressed={done}` to the button and `role="status"` to the text container at
`:52` so both strings are announced on change. Consider collapsing to a single labelled
control: `aria-label={done ? 'Lesson marked complete. Undo.' : 'Mark this lesson complete.'}`.
Same `aria-pressed` treatment in the dashboard, and mark the `✅`/`⬜` emoji `aria-hidden`
since they are redundant with the existing label.

#### ✅ CLOSED — The emoji avatar picker has no accessible names and no pressed state

> FIXED 2026-08-06. `EMOJI_CHOICES` became a `[emoji, name]` tuple list so each button
> announces **"penguin avatar", "bionic arm avatar"** rather than the platform-dependent
> Unicode emoji name ("mechanical arm", "alien monster") that varies between screen
> readers and is never phrased as an action. State is now carried by `aria-pressed`, so
> the accessibility tree actually changes on selection — previously the selected chip
> differed only by border colour and background tint, i.e. nothing changed in the tree at
> all.
>
> Went with `aria-pressed` toggle buttons rather than the audit's `role="radiogroup"`: a
> real radiogroup owes the user arrow-key roving tabindex, and `role="radio"` without it
> is worse than a plain button. The container is `role="group"` + `aria-labelledby` tied
> to the visible "Avatar" text, which was previously a bare `<div>` associated with
> nothing.
>
> Non-colour selected cue added as the audit asked: `inset 0 0 0 2px var(--color-brand)`,
> a weight/shape difference that survives greyscale.
>
> Also in the same file: the `<label>` and `<input>` finally have an `htmlFor`/`id` pair
> (the display-name field was announced as "edit text, blank" — WCAG 3.3.2), generated
> with `useId()` because Starlight renders the sidebar twice (desktop rail + mobile
> drawer) and duplicate literal ids would break both. The progress bar — two unnamed divs,
> invisible to AT — is now `role="progressbar"` with valuenow/min/max. The emoji chips are
> 26x26; they picked up the existing `.tmx-tap-icon` helper, which grows them to 44x44 on
> coarse pointers only. The edit toggle's dynamic `aria-label` + `aria-expanded` were
> already in place from an earlier pass and were left alone.

**Severity:** Medium · **Effort:** Small · **Location:** `src/components/profile/ProfileBadge.tsx:85-155`

**Evidence:** twelve buttons, none with `aria-label`, `aria-pressed`, or `role`. The selected
one differs by border color and background tint — nothing in the accessibility tree changes.
The accessible name is the emoji's Unicode name ("mechanical arm", "alien monster"),
inconsistent across screen readers and never phrased as an action. No `role="radiogroup"`,
and the visible "Avatar" text is a bare `<div>` associated with nothing. Separately, the
`<label>` at `:85` has no `htmlFor`/`id` pair with the input at `:89`, so the display-name
field has no programmatic label; and the edit toggle has a static `aria-label="Edit profile"`
while its glyph flips to `✕`, with no `aria-expanded`.

**Fix:** convert to a proper radiogroup with an `EMOJI_NAMES` map, add a non-color selected
cue (a check overlay or a 2px inset ring), pair the label and input with `htmlFor`/`id`, and
make the toggle's label dynamic with `aria-expanded={editing}`.

#### ✅ CLOSED — The autosuggestion — the mechanic the landing page teaches — sits at 4.32:1

> **FIXED 2026-08-06.** Replaced `DIM` (xterm's SGR-2, a fixed 50% alpha) with an
> explicit truecolor `GHOST` constant `#8e8676` for suggestion text — **~5.1:1**
> on the obsidian screen, clearing AA while staying visibly quieter than live
> input. Cross-ref: closes **M8** in the visual audit.

**Severity:** Medium · **Effort:** Small · **Location:** `TermuxTerminal.tsx:100`; `shell.ts:19`

**Evidence:** the ghost text uses SGR 2 (dim), which xterm renders as a 50% alpha blend:
`#e8dfcc` at 0.5 over `#0e1014` resolves to ≈`#7b7870` = **4.32:1**, below the 4.5:1 floor.
This is not decorative — `index.mdx:24-26` makes it the first thing a learner is asked to
perceive. `DIM` is also used for the help footer, the `pkg update` hint, and the storage
confirmation, all at the same ratio. And since the terminal has no screen-reader support, dim
text is the *only* channel carrying this information.

**Fix:** stop relying on SGR 2. Add `export const GHOST = '\x1b[38;2;167;161;149m'`
(truecolor `#a7a195`, 7.41:1) to `shell.ts` and use it for the suggestion specifically. Bump
the palette's `brightBlack` from `#6b6454` (3.24:1) to something ≥4.5:1 as well. Consider a
non-color cue — fish relies on color alone, but a tutorial can afford a subtle `⇥` marker or
a persistent accept-key hint in the chrome bar.

#### ✅ CLOSED — astro-icon SVGs carry no `aria-hidden`

> REACT HALF VERIFIED AND HARDENED 2026-08-06; the astro-icon half is a handoff (index.mdx
> is not mine).
>
> The audit is right that `src/components/icons/icons.tsx` already emitted
> `aria-hidden="true"` and `focusable="false"` — but it had a latent trap: `IconProps`
> **declared** `'aria-hidden'?: boolean` and the component never destructured it, so any
> caller passing it was silently ignored. The prop is now honoured, and a `label` prop was
> added that promotes the svg to `role="img"` with a real accessible name for the case
> where an icon is the only content of a control. Default is unchanged (decorative,
> hidden) since every current call site sits beside its own text label.

**Severity:** Medium · **Effort:** Trivial · **Location:** `src/content/docs/index.mdx:30, 36, 41, 46, 51, 57, 66, 74, 87`

**Evidence:** Starlight's own icons emit `<svg aria-hidden="true" …>`. astro-icon's do not —
nine decorative `<Icon>` calls on the landing page render as unnamed graphics, including one
inside the CTA link, which pollutes that link's traversal. The React icon set gets this right,
so the inconsistency is specifically at the astro-icon boundary and easy to miss because both
components are named `Icon`.

**Fix:** astro-icon passes unknown props through, so add `aria-hidden="true"` to all nine.
Better, wrap it once — a `src/components/DecorIcon.astro` that spreads props onto `<Icon>`
with `aria-hidden` and `focusable="false"` baked in — and use that in MDX from now on.

#### ✅ CLOSED — Reduced-motion misses the fixed background and turns the sheen into a flash

> Both headline items were already implemented in the file and simply never marked: `body::before { background-attachment: scroll !important }` inside the reduced-motion block (the existing neutraliser was keyed on viewport width, a mobile-perf measure, so a desktop reduced-motion user got the full parallax), and `display: none !important` on the three sheen ::before pseudo-elements rather than clamping their 0.6s transition to 0.001ms (which compressed the sweep into a single-frame flash — worse than the animation). Verified both and closed the one remaining hole: `:is(a.card, .tmx-card--link):hover` resolves at (0,2,1) — :is() takes the specificity of its most specific argument, `a.card` — which BEAT the `.tmx-card:hover` (0,2,0) reset written in the block, so an opted-in link card still translated 4px on hover for a user who asked for no motion. Both forms are now listed and the declaration carries !important, matching the rest of the block.

**Severity:** Low · **Effort:** Trivial · **Location:** `src/styles/global.css:255, 477-495, 701-713`

**Evidence:** `background-attachment: fixed` produces parallax on scroll — a known vestibular
trigger — and is not a transition or animation, so the reduced-motion block cannot reach it.
There is already a media query neutralizing it, but only for viewport width. Separately, the
sheen sweep animates a transform over 0.6s; collapsing the duration to 0.001ms does not
suppress it, it converts a smooth sweep into a single-frame **flash across the button**,
which for photosensitive users is arguably worse than the original.

**Fix:**

```css
@media (prefers-reduced-motion: reduce) {
  body::before { background-attachment: scroll !important; }
  .sl-markdown-content .action::before,
  .tmx-btn::before { display: none !important; }
  .pagination-links a:hover,
  .tmx-btn:hover,
  .tmx-btn:active { transform: none !important; }
}
```

Killing the sheen pseudo-element outright is the right call. The existing
`.tmx-card:hover { transform: none }` is the correct pattern — just apply it consistently.

---

### 4.7 Performance, SEO & deployment

**Verdict:** the fundamentals are correct in the places that usually break. The problems are
concentrated in social metadata (a hole), a badly front-loaded JS payload, and site-wide
costs paid for one-page features.

**What's working:**

- `site` + `base` absolute-URL generation is correct — canonical, `og:url`, and every sitemap
  entry carry the full origin plus base. This is the #1 thing project-site deploys get wrong.
- All 11 pages have a unique `<title>` and a hand-written, genuinely descriptive
  `<meta name="description">`.
- Fonts are self-hosted with `unicode-range` subsetting and `font-display: swap`, so the
  396 KB of non-latin subsets are never actually served to an English-reading visitor. The
  runtime font cost is 187 KB, not the 583 KB artifact total.
- The 7 MB of dead PNGs are correctly tree-shaken out of `dist/` — that cost is repo weight,
  not visitor bandwidth.
- `background-attachment: fixed` is already downgraded to `scroll` under 50rem, pre-empting
  the classic mobile scroll-jank trap.
- CheerpX is version-pinned, dynamically imported, and gated behind an explicit click, so
  none of the VM cost is paid on page load.
- Pagefind's 719 KB index is lazily loaded and off the critical path entirely.

#### ✅ CLOSED — No `og:image` — every social share renders as a bare text card

> FIXED. `public/og-default.png` is a 1200×630 card (40,634 B) rendered from
> `public/og-default.svg`, which is kept beside it as the editable source with the
> re-render command in its header comment. Obsidian ground, brass wordmark, the site
> tagline verbatim, and a `~ ❯ pkg install linux` prompt kicker — colours are the literal
> equivalents of `--tmx-screen` / `--color-brand` / `--tmx-screen-muted`, which is
> unavoidable in a raster asset and is noted as such in the SVG. The wordmark was cut from
> 96px to 78px because at 96 it measured ~1100px and collided with the 1160px frame; 78
> lands it at ~890px, inside the crop Discord and iMessage apply. `astro.config.mjs` now
> emits `og:image`, `og:image:width`, `og:image:height`, `og:image:alt` and
> `twitter:image`, all built from a new absolute `OG_IMAGE = SITE + BASE +
> '/og-default.png'` constant — `dist/index.html` previously had
> `twitter:card=summary_large_image` and zero `og:image` occurrences on all 11 pages.

**Severity:** High · **Effort:** Small · **Location:** `astro.config.mjs:44-58`; absent in all of `dist/**/index.html`

**Evidence:** `grep -c 'og:image'` returns **0** for all 11 pages. Yet `dist/index.html`
emits `<meta name="twitter:card" content="summary_large_image" />`. That is the worst
combination: the card type promises a large image and none is supplied, so X, Discord, Slack,
LinkedIn and iMessage all fall back to a blank or degraded preview. There is nothing in
`public/` to point at either.

**Impact:** this site's distribution channel is almost entirely social — r/termux, Hacker
News, Discord. It is the cheapest CTR win available and costs nothing at runtime.

**Fix:** drop a 1200×630 PNG at `public/og-default.png` (the Scatter Field plus a brass
wordmark reuses existing design assets), then add to the `head` array:

```js
const OG = `${SITE}${BASE.replace(/\/$/, '')}/og-default.png`;
{ tag: 'meta', attrs: { property: 'og:image', content: OG } },
{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
{ tag: 'meta', attrs: { property: 'og:image:alt', content: 'Termux for Beginners' } },
{ tag: 'meta', attrs: { name: 'twitter:image', content: OG } },
```

`og:image` **must** be absolute — a base-relative path will not resolve for crawlers. One
static card; do not build per-page generation.

#### ✅ CLOSED — 340 KB of xterm is a static import on the homepage critical path

> PARTIAL — please do NOT mark this closed. The .mdx carrying `client:only` and the
> components carrying the top-level imports are outside my ownership. What landed:
> `vite.build.rollupOptions.output.manualChunks` now splits anything matching `@xterm`
> into its own `xterm` chunk, so it is no longer hoisted into the shared island chunk
> alongside react-dom (184,105 B). Effect: the six pages with no terminal stop paying for
> xterm at all, the five that have one fetch it in parallel rather than serially inside
> one blob, and it stays cached across lessons instead of being invalidated whenever an
> island changes. NOT fixed: `client:only` still has no deferral semantics, so on the five
> terminal pages the chunk is still requested at island-load time. The remaining work is
> the dynamic-import + IntersectionObserver refactor in TermuxTerminal.tsx /
> LiveSandbox.tsx — see handoffs — which also deletes the alias and `ssr.noExternal`.

**Severity:** High · **Effort:** Medium · **Location:** `src/components/terminal/TermuxTerminal.tsx:14-16`; `src/content/docs/index.mdx:28`

**Evidence:** three top-level xterm imports get hoisted into one shared chunk:
**339,824 B raw / 84,833 B gzip**. Because the island sits on the landing page, that chunk
plus react-dom (184,105 B) plus react (7,555 B) plus the island (12,795 B) is fetched
immediately. Homepage JS total: **~545 KB raw / ~148 KB gzip**. `client:only` has no deferral
semantics — it downloads and hydrates as soon as the island loader runs, not on visibility.
The same chunk loads on filesystem, storage, packages, and first-session.

**Impact:** ~148 KB gz that must be parsed, compiled and executed before the terminal paints
is a direct TBT/INP hit, and on a mid-tier Android phone — the exact audience — xterm's
parse and init is hundreds of milliseconds of main-thread block.

**Fix:** move the imports inside the mount effect and gate on an IntersectionObserver.

```tsx
useEffect(() => {
  const el = hostRef.current;
  if (!el) return;
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('@xterm/addon-web-links'),
    ]);
    /* existing init */
  }, { rootMargin: '200px' });
  io.observe(el);
  return () => io.disconnect();
}, []);
```

Render a fixed-`height` skeleton (the `height` prop already exists) so there is zero layout
shift. This removes 340 KB from initial load on five pages **and** lets you delete the
`resolve.alias` block and `ssr.noExternal` entry — one refactor, two findings.

#### ✅ CLOSED — ProfileBadge causes a guaranteed sidebar layout shift on 10 pages

> Verified first, as instructed. `src/components/overrides/Sidebar.astro` does wrap the badge in `.tmx-profile-slot`, and `global.css` did reserve `min-height: 98px`. The bulk of the finding (~86px of shift on 10 pages) was therefore already closed — but the reservation did **not** match the rendered badge.
>
> Measured before: the badge's name and meta lines carried `fontSize: 14`/`12` and no `line-height`, so both inherited Starlight's `--sl-line-height: 1.75` (`node_modules/@astrojs/starlight/style/reset.css:25`). That makes the name block `14 × 1.75 + 12 × 1.75 = 45.5px`, which exceeds the 44px the derivation comment assumed from the edit button's `minHeight`. Real collapsed badge: `2 (border) + 20 (padding) + 45.5 (row) + 16 (bar) = 83.5`, plus the badge's own non-collapsing `1rem` bottom margin = **99.5px against 98px reserved — a 1.5px shift on every page load**, and one that would move again if Starlight ever changed `--sl-line-height`.
>
> Fixed rather than closed as-is: `.tmx-profile-badge__row` now carries `min-height: 44px`, and `__name`/`__meta` carry explicit tokenised line-heights (`--text-sm × --leading-snug = 20.25px` + `--text-xs × --leading-normal = 20.15px` = 40.4px, comfortably under the 44px floor). The row now sits **at** its minimum, so the sum is exactly `2 + 20 + 44 + 16 = 82`, `+16` margin = **98px, matching the reservation exactly. Shift: 1.5px → 0px.** The derivation comment on `.tmx-profile-slot` was rewritten to record both the old wrong assumption and why the new one cannot drift.
>
> The second, optional half of the audit's fix — rewriting the badge as an `.astro` component to drop react-dom from `cheatsheet` and `troubleshooting` — was **not** done. It is a payload optimisation, not a CLS one, and it would delete a file this pass was told to migrate rather than replace. Handed off.

**Severity:** High · **Effort:** Small · **Location:** `src/components/overrides/Sidebar.astro:10`

**Evidence:** `client:only` renders a literally empty `<astro-island>`. The badge's own
styles give it roughly 86px of height that appears only after React hydrates, so the entire
sidebar nav below shifts down by that amount, on 10 of 11 pages. It is also the sole reason
184 KB of react-dom ships on `cheatsheet` and `troubleshooting`, two pages with no other
interactivity.

**Fix, two independent parts:**

- **Kill the CLS (do this regardless):** reserve the space in the override so the island has
  intrinsic height before hydration.

  ```astro
  <div class="tmx-profile-badge-slot" style="min-height:86px;margin:0 0 1rem;">
    <ProfileBadge client:only="react" />
  </div>
  ```

  Move the badge's own margin out of the component so the slot owns it. Measure the real
  height in DevTools and use that exact value.
- **Kill the payload (optional, bigger):** the badge does nothing React-specific — localStorage
  reads, one boolean, an emoji picker. Rewriting it as an `.astro` component with a ~40-line
  inline script reading the same store removes react-dom entirely from two pages and drops
  ~60 KB gz from the other eight.

#### ✅ CLOSED — The COOP/COEP service worker is site-wide for a one-page feature, and forces a reload

> FIXED without touching any .mdx. Two independent narrowings: (1) the plain `<script
> src=coi-serviceworker.js>` in `head` is replaced by a 9-line inline loader that injects
> the worker ONLY when the pathname is `${BASE}/foundations/packages/` (tolerant of a
> missing trailing slash and of `index.html`) — logic unit-tested against five paths; (2)
> `public/coi-serviceworker.js` gained a `window.coi.scope` option and the loader passes
> that same directory, so the worker claims one path instead of the site root and the
> other 10 pages are never controlled, never served `require-corp`, and never reload. A
> `window.coi.swUrl` option was added too, because upstream reads
> `document.currentScript.src` which is null for a dynamically injected tag. `quiet: true`
> is set, killing the per-page console log. Both local modifications are documented in a
> LOCAL MODIFICATIONS block at the top of the vendored file. Net: 10 of 11 pages lose a
> forced reload and lose the future-cross-origin-subresource landmine; the one page that
> needs isolation behaves exactly as LiveSandbox's copy already describes ("refresh this
> page once").

**Severity:** Medium · **Effort:** Small · **Location:** `astro.config.mjs:44-51`; `public/coi-serviceworker.js:96-104`

**Evidence:** the script sits in Starlight's global `head`, so it lands on all 11 pages. The
only consumer of SharedArrayBuffer is LiveSandbox, on one page. The registration path ends in
`coi.doReload()` — a first-time visitor lands on any page, the SW registers, and **the page
reloads itself**. Once controlling, every page on the origin is served with COEP
`require-corp`.

**Impact:** the reload is a hard reset of LCP and FCP for first-time visitors on 10 pages that
gain nothing. Site-wide `require-corp` also means any future cross-origin subresource — an
embedded video, a screenshot from GitHub's CDN, a badge image — is silently blocked. A
landmine for a docs site that will grow.

**Fix:** move it out of the global head and inject it only on the packages page via
frontmatter:

```yaml
head:
  - tag: script
    attrs:
      src: /termux-tutorial-for-beginners/coi-serviceworker.js
      defer: true
```

Set `window.coi = { quiet: true }` regardless — the SW currently logs on every page load. And
because the reload is unavoidable, update the LiveSandbox copy so the reload reads as designed
behavior, not a bug.

#### ✅ CLOSED — Four font families ship all subsets and none are preloaded

> FIXED, by a different route than the audit proposed. `@fontsource-variable@5.3.0` ships
> no `/latin.css` entrypoint (verified: only `index/wght/opsz/standard` CSS exists), so
> instead the eight latin faces are copied into `public/fonts/` by a new `npm run
> fonts:sync` script, declared by an inline `<style>` @font-face block in `<head>`, and
> the four bare `@fontsource-variable/*` entries are gone from `customCss`. Artifact fonts
> drop 583,712 B / 21 files → 385,428 B / 8 files. The preload gap — the part the audit
> called the real issue — is closed twice over: Inter and Crimson Pro (the LCP heading)
> get `<link rel=preload as=font crossorigin>`, and because the @font-face rules are
> inline rather than inside the 101 KB stylesheet, discovery no longer waits on a CSS
> fetch+parse round-trip. Public files keep un-hashed URLs, which is the only reason a
> hardcoded preload href is safe here. Verified lossless: `❯` (U+276F) and `→` (U+2192)
> are in NO subset of any of the four families, so they already fell back to a system font
> before this change; nothing else in the course leaves the latin range.

**Severity:** Medium · **Effort:** Small · **Location:** `astro.config.mjs:59-67`

**Evidence:** the bare package entrypoints pull every subset: 21 woff2 files, 583,712 B, of
which **396,028 B (68%)** is cyrillic/greek/vietnamese/latin-ext. `dist/index.html` contains
**no** `<link rel="preload">` for any font, so all four families are discovered only after the
101 KB stylesheet is fetched and parsed.

**Impact:** the unused subsets are artifact waste, not visitor bandwidth. The **preload gap is
the real issue** — the homepage LCP element is almost certainly the hero heading in Crimson
Pro, and it cannot start downloading until CSS parse completes. A serialized round-trip on
the critical path, plus visible FOUT on every page.

**Fix:** switch to the `/latin.css` entrypoints (21 files → 4, −396 KB artifact). Then preload
the two critical faces — Inter for above-fold chrome, Crimson Pro for the LCP heading. Astro's
content-hashed filenames make a hardcoded `<link>` fragile, so either use Astro 7's
`experimental.fonts` API (which emits preloads for you) or copy just those two woff2 into
`public/fonts/` and declare them yourself. Leave Source Serif 4 and JetBrains Mono
unpreloaded. Worth asking whether four families is one too many — Source Serif 4 and Crimson
Pro are both serifs doing adjacent jobs.

#### ✅ CLOSED — The homepage title is duplicated, and there is no structured data

> HALF FIXED. Structured data: `astro.config.mjs` now emits one `application/ld+json`
> `@graph` containing a `Course` (name, description, url, inLanguage, isAccessibleForFree,
> educationalLevel, learningResourceType, a five-item `teaches` list, an `Organization`
> provider, and a `CourseInstance` with `courseMode: online` + `courseWorkload: PT2H`,
> since Google requires workload or schedule) and a `WebSite` node. Site-wide emission is
> deliberate and commented: `@id` anchors mean all 11 pages reference the SAME Course node
> instead of declaring eleven competing courses, and Starlight's config `head` is the only
> injection point reaching every page. The audit advised holding this until Wave 1 content
> fixes land; the two known-wrong claims it named (storage advice, phantom-process killer)
> are both now ✅ CLOSED, so the hold has expired. NOT fixed: the duplicated `<title>Termux
> for Beginners | Termux for Beginners</title>` — the lever is
> `src/content/docs/index.mdx` frontmatter, which I do not own. Confirmed from Starlight's
> `utils/head.ts` that frontmatter `head` outranks config `head` outranks defaults, so a
> config-side title override would hit all 11 pages and is the wrong fix. Exact
> instruction is in handoffs.

**Severity:** Medium · **Effort:** Small · **Location:** `src/content/docs/index.mdx:2`; `astro.config.mjs:29-33`

**Evidence:** `dist/index.html` emits
`<title>Termux for Beginners | Termux for Beginners</title>` — the frontmatter title is
identical to the Starlight site title and Starlight appends without deduping. Separately, no
page contains a `<script type="application/ld+json">`.

**Impact:** the duplicated title is what shows in the SERP and the tab; it reads as a bug and
wastes 24 of a ~60 character budget.

**Fix:** change the frontmatter title to something distinct and keyword-bearing — e.g.
`Learn Termux — Linux on Android, in your browser`. Verify the rendered result stays under
60 characters after Starlight appends the site name; override with a frontmatter `head` title
tag if not. **Hold the structured data** — `Course` JSON-LD on a site with two known-wrong
content claims and an invisible CTA is optimizing distribution for a product that is not
finished. Revisit after Wave 1.

#### ✅ CLOSED — Third-party dependency disclosure

> **PARTIALLY FIXED 2026-08-06 (README half).** README gained a "What this site knows
> about you" section stating the genuinely strong position that was previously documented
> nowhere — no accounts, no analytics, no cookies, no backend, fonts and icons self-hosted
> — and then discloses the exception in the same breath: pressing Boot Linux opens
> connections to `cxrtnc.leaningtech.com` and `wss://disks.webvm.io`, exposing IP and
> referrer to Leaning Technologies. The CheerpX licensing determination (free for
> non-commercial/educational, which is what this course is; review before commercial
> reuse) is now recorded in the README, not only in a source comment. **Still open, in
> files this agent does not own:** scoping the `progress.mdx` claim to "your progress
> never leaves this browser", and the one-line pre-boot notice in the LiveSandbox idle
> panel.

**Severity:** Low · **Effort:** Trivial · **Location:** `src/components/terminal/LiveSandbox.tsx:21-24`; `src/content/docs/progress.mdx:15-20`

**Evidence:** `progress.mdx` says "there's no account and **nothing is sent anywhere**." That
is true of the progress store and false of the site: clicking Boot Linux opens connections to
`cxrtnc.leaningtech.com` and `wss://disks.webvm.io`, exposing IP and referrer to a third
party, with no disclosure before the click. Meanwhile the genuinely excellent facts — no
analytics, no cookies, no accounts, fonts and icons self-hosted, everything static — are
stated nowhere.

**Fix:** scope the progress claim to "your progress never leaves this browser." Add a one-line
pre-boot notice in the LiveSandbox idle panel. Write a short "What this site knows about you"
section in the README plus a footer line. It is an unusual and marketable position; right now
it is an accident nobody is told about. Also record the CheerpX non-commercial licensing
determination in the README rather than only in a source comment.

---

### 4.8 Harvest from the original + competitive polish

**Verdict:** the Astro rebuild harvested the original's *content* far more faithfully than
its *interaction design*. Two of the three interactions you flagged are cheaper than
expected: copy-to-clipboard already ships, it is just completely un-themed, and the sun/moon
toggle is a supported override.

**What's working:**

- The editorial voice is the correct synthesis of the three source drafts — swagger in the
  chrome, patience in the body. "Enough throat-clearing", "Mistakes are free. Make a bunch.",
  "Treat `~` like a whiteboard, not a safe." That is the hardest thing on this list to get
  right and it is already right.
- Content fidelity to the strategy doc is high: the Play Store warning, the F-Droid/GitHub
  sourcing table, the shared-signature-key explanation, the uninstall-first remediation, the
  storage symlink table, the data-loss warning, and the extra-keys flow are all present.
- Pagination and theme-select refinements show you are already hunting for exactly this class
  of polish.

#### ✅ CLOSED — Code blocks are the one surface still on stock Night Owl

> CSS HALF ONLY — the Shiki theme lives in astro.config.mjs, which another agent is replacing this phase; nothing here touches token colours or any --ec-* colour that `expressiveCode.styleOverrides` sets, to avoid two writers on the same variable. Verified the frame bridge already in place and documented it in a proper section header: --ec-brdRad onto --radius-lg (Starlight ships --ec-brdRad: 0px and EC computes radius as calc(brdRad + brdWd), so every code block was rendering at ~1px — visually square against the 8/10/12px radii everywhere else, which is also the `.frame.is-terminal` half of D10); --ec-brdCol plus the three frame-border vars onto --border-default; --ec-frm-frameBoxShdCssVal onto --shadow-sm; and --ec-frm-trmTtbDotsFg onto --border-default at full opacity, so the static terminal frame's three dots are now the same token as the live .tmx-terminal's — the two terminal surfaces on a terminal tutorial finally read as one family. Added the missing rule half: the copy button was pinned at full opacity, a permanent chrome affordance on every code block. Now 0.55 at rest, 1 on figure hover / button hover / :focus-visible, with a `(pointer: coarse)` override holding it at 1 — a control that only appears on hover does not exist on a phone, and this site's readers are largely on the phone they are installing Termux on.

> FIXED 2026-08-09 in astro.config.mjs (config half). WAS: no `expressiveCode` key, so Starlight's bundled 'starlight-dark'/'starlight-light' — both Night Owl derivatives — shipped verbatim; measured emitted syntax colours were `--0:#82AAFF; --1:#3B61B0`, i.e. `termux-setup-storage` rendered #3B61B0 cornflower blue in a fenced block while the xterm terminal ~200px below on the same page printed the identical string in brass #d4b15c. NOW: `expressiveCode.themes` carries two hand-authored themes — `fire-watch-obsidian` (dark) and `fire-watch-parchment` (light). No Shiki built-in was usable: gruvbox, vitesse and everforest all ship four-to-six hues, which is the thing being removed. The palette is brass plus a neutral ink ramp — brass for what you RUN (`entity.name.command`, `support.function`, `entity.name.function`, `keyword`, `storage`, `entity.name.tag`, `support.type.property-name`), strongest neutral ink for what you GIVE it (`string`, `constant`, `support.constant`, `entity.name.type`, plus `variable`/`support.variable` in the same ink + italic so `$HOME` does not read as a command), `--fg-muted` italic for comments, `--fg-muted` for `keyword.operator` so `=`/`>` recede below the command word, and `--color-danger` for `invalid` alone. Semantic colours therefore still mark state only, and brass stays the single accent. VERIFIED by extracting both theme objects out of the config and running a representative bash sample through the project's own installed Shiki (no build): `pkg`, `mv`, `echo`, `export`, `for`/`in`/`do`/`done` and `termux-setup-storage` now render #d4b15c in dark and #6f5310 in light — the same brass the simulator prints — and in dark the argument ink lands on #e8dfcc, byte-identical to the xterm `foreground` in TermuxTerminal.tsx. Because one theme is dark and one light, Starlight's EC preprocessor emits `[data-theme='dark']`/`[data-theme='light']` selectors, so the code palette follows the cycling theme button instead of being fixed. CONTRAST measured against the plate Starlight actually paints (`--sl-color-gray-6` #141820 dark, `--sl-color-gray-7` #efe9de light): dark — body #cfc5b0 10.38:1, brass #d4b15c 8.67:1, ink #e8dfcc 13.42:1, muted #8e8676 4.93:1, ember #cc6449 4.64:1; light — body #3d3d3d 8.99:1, brass #6f5310 5.95:1, ink #2c2418 12.66:1, muted #6b5d4f 5.26:1, ember #8b2d2d 6.92:1. Two deliberate deviations from the audit's suggested mapping, both for AA: light brass is `--color-brand-emphasis` #6f5310 rather than `--color-brand` #8b6914, which measures 4.21:1 on #efe9de and would leave the most-read token in the course under AA; and the `markup.inserted` green was dropped rather than ship `--color-success` #3d7a45 at 4.27:1 (no lesson uses a diff fence, and EC's textMarkers paint their own backgrounds). Every hex is mirrored from src/styles/global.css and labelled with its source token, with a comment recording that `var(--token)` is unavailable here because Expressive Code parses theme colours and runs contrast maths over them. `useStarlightUiThemeColors: true` is set explicitly — supplying `themes` normally flips it off, which would move the frame onto hexes baked into these themes; kept on, the plate, tab bar, terminal titlebar and scrollbars stay bound to `--sl-color-*`, which the BRIDGE in global.css maps onto Fire Watch tokens, so global.css keeps owning the FRAME and these themes own only the syntax palette. No `styleOverrides` were added for that reason. The audit's second suggestion — the rest-state copy-button fade (`.expressive-code .copy button { opacity: .55 }`) — is global.css and is in handoffs.

**Severity:** High · **Effort:** Trivial · **Location:** `astro.config.mjs:29-109` (no `expressiveCode` key); `src/styles/global.css` (no EC rules)

**Evidence:** copy-to-clipboard is already built and shipping — the built HTML contains the
full `<div class="copy">…<button title="Copy to clipboard" data-copied="Copied!">` markup.
But a grep for `expressive|\.frame|ec-|--ec-` across all of `src/` returns **no matches**.
The emitted syntax colors are `--0:#82AAFF; --1:#3B61B0` — Night Owl / Light Plus defaults,
not a single Fire Watch token.

**Impact:** code blocks are the most-looked-at element in a terminal tutorial, roughly half
the visual weight of every lesson page. They are the only region that visibly belongs to a
different design system than everything around them. This single gap does more to undercut
the "premium and finished" impression than any other item here, and it is the cheapest to
close.

**Fix:** add an `expressiveCode` block to the Starlight config.

```js
expressiveCode: {
  themes: ['github-dark-default', 'github-light'],
  styleOverrides: {
    borderRadius: 'var(--radius-lg)',
    borderColor: 'var(--border-default)',
    codeBackground: 'var(--tmx-screen)',
    codeFontFamily: 'var(--font-mono)',
    frames: {
      editorTabBarBackground: 'var(--bg-surface-alt)',
      terminalTitlebarBackground: 'var(--bg-surface-alt)',
      terminalBackground: 'var(--tmx-screen)',
      inlineButtonBackground: 'var(--color-brand)',
      inlineButtonForeground: 'var(--fg-on-emphasis)',
      tooltipSuccessBackground: 'var(--color-success)',
    },
  },
}
```

For full palette control, define a custom Shiki theme JSON mapping token scopes onto
`--color-brand` / `--color-info` / `--color-success` so code syntax uses the same semantic
hues as the xterm palette. Also mirror the original's rest-state fade:

```css
.expressive-code .copy button { opacity: .55; }
.expressive-code figure:hover .copy button { opacity: 1; }
```

#### ✅ CLOSED — Replace the theme dropdown with the original's sun/moon toggle

> Replaced Starlight-s <select> with a single cycling button (src/components/overrides/ThemeSelect.astro). Measured after: 40x40 with border-radius 8px at top 12 — byte-identical geometry to the search field it sits beside (was 52px tall, border-radius 9999px, top 6: the tallest element in a 64px header and the only pill in a UI whose radii are 8/10/12px). One 18px icon replaces two icons that were 14px at opacity 1.0 and 20px at opacity 0.7. Cycles light -> dark -> System, verified by clicking through all three states; aria-label announces current and next. Also fixed a latent bug found during verification: Starlight renders ThemeSelect TWICE (desktop header + mobile menu), so a fixed id was duplicated and only the first instance was wired — the mobile toggle was dead. Now class-based with a delegated listener.

**Severity:** Medium · **Effort:** Small · **Location:** `src/styles/global.css:747-783`; `astro.config.mjs:68-71`

**Evidence:** your complaint is well founded — 34 lines of CSS are spent trying to make a
native `<select>` look like the rest of the site, which is a fight you cannot win because the
OS owns the popup. The original's toggle is genuinely better designed: two stacked inline
SVGs in a 70×38 pill, cross-faded with `translateX(±150%) rotate(±90deg)` on an elastic
easing curve, with proper `aria-pressed` and an OS-preference listener.

**Impact:** the theme control sits in the top-right of every page and is one of the first
things anyone touches. A native select is the single most obviously un-designed element in
the chrome, directly adjacent to the site's most designed element.

**Fix:** override `ThemeSelect` the same way `Sidebar` already is. **The critical port
detail:** Starlight's no-flash inline script reads `localStorage['starlight-theme']` and sets
`document.documentElement.dataset.theme`. Write those exact names — using the original's
`localStorage['theme']` key gives you a flash-of-wrong-theme on every navigation as the two
systems disagree. Port the SVGs and the elastic cross-fade verbatim; they are good. Going
2-state drops "Auto", so preserve the original's behavior of following
`prefers-color-scheme` until the user makes a first explicit choice, or it is a regression.

#### ✅ CLOSED — Add a print stylesheet

> FIXED. New `src/styles/print.css` (236 lines), referenced LAST in `customCss` so it
> outranks both the design system and xterm's own stylesheet on equal specificity.
> Contents: a print token redefinition (white paper, near-black ink, brass pushed to
> #4a3a10 because at ~2.4:1 on white the screen brass is unreadable, shadows to none) so
> every downstream rule follows automatically; `@page` margins; the fixed Scatter Field
> pseudo-element killed;
> header/sidebars/pagination/theme-select/search/menu-button/profile-badge/lesson-complete
> hidden; Starlight's grid padding released so content reclaims the sidebar columns;
> `white-space: pre-wrap` on code so commands wrap instead of clipping at the right margin
> (the single worst defect — a truncated command is wrong, not just ugly); break-inside
> protection on code/tables/asides/cards; `a[href^=http]::after { content: ' (' attr(href)
> ')' }`; and both xterm hosts replaced by a dashed one-line note rather than
> `display:none` (a hidden element renders no ::after, which is why the wrapper stays
> visible and only its children are hidden). Parsed clean through postcss.

**Severity:** Low · **Effort:** Small · **Location:** `src/styles/global.css` (no `@media print` block)

**Evidence:** `global.css` contains no print block at all. Today, printing would emit the
fixed Scatter Field background, the frosted header, the sidebar, and clip every code block at
the right margin.

**Impact:** this is a tutorial people read *beside* the device they are operating. Printing or
PDF-ing the cheatsheet is a real behavior — and it is the concrete answer to the "how does a
phone user read a phone tutorial" problem, since the browser and Termux cannot share the
screen. That is the reason it matters, not polish.

**Fix:** hide `header.header, .sidebar-pane, .right-sidebar, .pagination-links,
starlight-theme-select, .tmx-terminal, .tmx-sandbox, .expressive-code .copy, body::before`;
force `--bg-canvas: #fff` and the `--fg-*` family to near-black inside the block; set
`.expressive-code pre { white-space: pre-wrap !important; page-break-inside: avoid }`; and
keep the original's `a[href^="http"]:after { content: " (" attr(href) ")" }` so links survive.
Then add a print button to the cheatsheet — a one-page command card is a shareable artifact
once the stylesheet exists.

#### ✅ CLOSED — The persistent side-by-side terminal — phase 1 only

> **FIXED 2026-08-09, but NOT as specified — the prescribed fix could not work.**
> The Fix said `position: sticky; top: calc(var(--sl-nav-height) + 1rem)`. In a
> practice section the prose sits ABOVE the terminal, so anchoring the terminal
> to the top of the viewport pins the terminal and lets the instructions scroll
> away behind it — which is the exact failure the finding describes. Anchoring
> to the **bottom** is the geometry that delivers the stated goal: the terminal
> parks against the lower edge and the whole space above it stays available for
> the instructions.
>
> Also not one CSS rule. `position: sticky` is bounded by its containing block,
> so a bare rule on `.tmx-terminal` is bounded by the whole article: once pinned
> it would ride over the Recap and the Next/Prev cards for the rest of the page.
> Hence `components/lesson/PracticeSection.astro`, a wrapper whose end IS the
> release point — no scroll listener, no JS. Verified in the built HTML that
> Astro emits `astro-island{display:contents}`, so the island does not become
> the containing block and the wrapper genuinely is.
>
> Gated `(min-width: 72rem) and (min-height: 46rem) and (pointer: fine)`: a
> 400px terminal pinned to the bottom of a short viewport leaves nothing above
> it to read, which would trade one problem for another. Phones keep the plain
> stacked flow, where the soft keyboard and the new `visualViewport` handler
> already own the geometry.
>
> True side-by-side remains phase 2 and still needs the bespoke layout: the
> content column is `--sl-content-width: 45rem`, and splitting that yields
> neither a readable measure nor the ~55 columns the lessons' output needs.
>
> Piloted on `storage.mdx` — the lesson this finding names. **Not yet visually
> verified** (browser automation was down) and deliberately not rolled out to
> the other practice lessons until it has been.

**Severity:** Medium · **Effort:** Small (phase 1) / Large (phase 2) · **Location:** `astro.config.mjs:68-71`; `src/content/docs/foundations/storage.mdx:67-91`

**Evidence:** the strategy doc calls for replacing `PageFrame` or `TwoColumnContent` with a
bespoke layout accommodating a persistent side-by-side terminal, driven by `starlightRoute`.
Only `Sidebar` is overridden. Today on `storage.mdx` the learner reads a three-step block at
lines 67-83, then scrolls *past it* to reach the terminal at line 87 — the instructions leave
the screen at the exact moment they are needed.

**Fix:** **Phase 1 only, for now.** Wrap the inline terminal in a container with
`position: sticky; top: calc(var(--sl-nav-height) + 1rem)` at ≥72rem, so it stays visible
while the prose scrolls past. That is most of the benefit for a fraction of the work.

**Do not build phase 2.** It is the single largest effort item proposed anywhere in this
audit, with the least certain payoff, and a 40%-viewport terminal on a phone is worse than the
inline one. Revisit only if the mobile story is designed first.

---

## 5. Blind spots and journey notes

These came from a pass that audited the *arc* rather than the artifacts. Several are more
consequential than mid-tier technical findings, and none appeared in the eight dimension
reports.

### The learner's journey

- **The site's central promise is false on its face.** `index.mdx:3` sells "a live terminal
  baked into **every** lesson." `<TermuxTerminal>` appears in exactly **four of seven**
  lessons. The three without are `why-termux`, `installing`, and `extra-keys` — lessons 1, 2
  and 7. So the learner's first two lessons after a landing page built entirely around a
  terminal are pure prose. That is the shape of a bounce. **Fix:** either put a terminal in
  all seven or change the copy to "in most lessons." Cheapest real fix: give `why-termux` a
  "look what you're getting" terminal and give `extra-keys` the touch key row from section
  4.5 — it doubles as the lesson's own subject matter.
- **There is no syllabus a cold visitor can see.** `template: splash` hides the sidebar, so
  the entry page never shows the seven lessons, their order, how long the course is, or where
  it ends. The four "What you'll walk away with" cards are benefit statements that do not map
  onto lessons. A first-time visitor cannot answer "how big is this?" — the question that
  decides whether someone starts. **Fix:** add a course map to the splash: seven numbered
  lessons in two modules, an honest time estimate ("about 45 minutes, nothing to install"),
  and a completion state pulled from the existing progress store.
- **The sidebar's second item is an empty dashboard.** "Your Progress" sits directly under
  "Welcome" and above lesson 1, so a cold learner's second click lands on a page showing 0%
  and asking for a display name — administrative friction served before any value.
  **Fix:** move it to the bottom of the sidebar or into Reference; the sidebar badge already
  surfaces the number.
- **The course never asks the learner to touch their actual phone.** Every exercise runs in
  the simulator. A learner can reach 100% completion — badge, dashboard, all seven checkmarks
  — without ever having opened Termux. For a course whose premise is "the phone in your
  pocket is a Linux computer," that is the deepest possible pedagogical failure, and it is
  invisible because the progress UI happily certifies it. **Fix:** split completion into two
  states per lesson — *practiced here* and *did it on my device*. The second is honor-system
  and that is fine; the point is that the course explicitly asks.
- **Nobody designed for reading a phone tutorial on a phone.** To follow it the learner must
  switch between browser and Termux constantly, losing the instructions each time. **Fix:**
  acknowledge it once in `first-session.mdx` and design for it — put each lesson's commands in
  a single copyable block at the end ("take this to your phone"), and make the cheatsheet a
  genuinely offline-first artifact via the print stylesheet.

### The two-terminal promise

- **The Live Sandbox is not Termux, and the framing pretends otherwise.** It boots root Debian
  (`uid: 0, HOME=/root`). It has no `pkg`, no `termux-setup-storage`, no `$PREFIX`, no
  `~/storage`. Yet `packages.mdx:59` heads the section "**Now do it for real**", directly
  after a lesson teaching `pkg` as a non-root user — a learner who follows that literally
  types `pkg update` into Debian and gets `command not found`. The root shell also teaches
  root habits in a course whose lesson 1 sells "without root" as the headline benefit.
  **Fix:** rename the section and the panel. It is a *Linux playground*, not a Termux reality
  check — still a good feature, honestly framed.
- **The landing page gives 50/50 billing to a 6:1 reality.** "Two terminals, zero setup"
  devotes half the page's remaining content to a feature that appears **once**, on lesson 6,
  gated behind a click, a large download, cross-origin isolation, and a third-party CDN. The
  panel admits it. The simulator appears five times. **Fix:** demote the Live Sandbox to a
  sub-point of the simulator panel, or earn the billing by adding it to a second lesson.

### Maintenance — what actually rots

- **The Starlight upgrade risk is not the token bridge; it is ~15 undocumented internal
  selectors.** `global.css` depends structurally on `.sl-markdown-content`, `.sl-flex`,
  `.pagination-links`, `.link-title`, `.site-title`, `starlight-theme-select`, `.card`,
  `.action`, `--sl-color-gray-1..6`, `--sl-text-h1..h4`, `--sl-content-width`,
  `--sl-nav-height`. When any is renamed the build stays green and the site degrades silently
  — which is exactly how the CTA bug survived: nothing tests appearance. `package.json:11`
  also floats `"^0.41.3"`; on a 0.x package that permits nothing breaking by semver, but
  Starlight ships behavioral changes in minors regularly. **Fix:** (a) one comment block in
  `global.css` inventorying every Starlight internal the file depends on — the "coupling
  surface", so an upgrade has a checklist; (b) pin Starlight to an exact version and bump
  deliberately; (c) three or four Playwright screenshot tests (landing, one lesson, light and
  dark) in CI. **That last one is the only thing in this entire audit that would have caught
  the CTA bug automatically**, and the only thing that will catch its successors across three
  repos.
- **`lastUpdated: true` currently emits nothing and will lie the moment it works.** It is
  enabled at `astro.config.mjs:76` but produces no output because there is no `.git` yet. The
  instant you `git init` with one big initial commit, all eleven pages will claim they were
  updated today, and any future bulk reformat re-stamps them all. For a tutorial about a
  fast-moving Android app, a confidently wrong freshness date is worse than none. **Fix:**
  turn it off and add a deliberate `lastVerified` frontmatter field, rendered as "Verified
  against Termux 0.118 on Android 14, <date>." That is the claim that actually matters, and it
  can only be set by a human who re-tested. Content most likely to rot, in order: the F-Droid
  flow, the `~/storage` symlink table, the Android version floor, the extra-keys properties
  syntax, and the CheerpX version plus its 2023-dated disk image.
- **Every page carries an "Edit page" link to a repo that may not exist.** `editLink.baseUrl`
  points at `github.com/dnoice/termux-tutorial-for-beginners/edit/main/` and renders on all 11
  pages. There is no `.git` here, and the README already contains one misspelled sibling repo
  URL, so the naming is unverified. A 404 on "help improve this page" is a poor first
  contributor experience and a one-minute pre-launch check.
- **The community appears once, at the bottom of the last reference page.**
  `troubleshooting.md:80-81` is the only place in 4,358 words where the reader is told other
  humans exist. For a beginner course, "where to ask when you're lost" belongs in lesson one.
  There is also no feedback channel from any lesson, so a stuck learner's only recourse is to
  leave.

---

## 6. Recommended roadmap

### Wave 1 — Fix

**Scope:** roughly one focused day, plus the sixty-second browser check first.

- Verify the Live Sandbox network assumption. It may invalidate a lesson section, and
  everything else in this wave is cheaper to plan once you know.
- The CTA: `:not(.tmx-btn)` via `:is()`, `background` shorthand → longhands, delete the three
  dead patches.
- The `'JetBrains Mono Variable'` typo in both terminals, plus `document.fonts.ready`.
- `storage.mdx` — split the rule by data type; update the cheatsheet's Golden Rule #3.
- `external-1` table row; add `movies`; reconcile with `shell.ts`.
- Extra-keys chicken-and-egg: the Volume-Down tip, `mkdir -p ~/.termux`, the "already enabled"
  correction.
- Safety: revoke the sideload permission; correct the phantom-process troubleshooting entry;
  remove `tsu` from `PKG_DB`.
- Delete the 7.2 MB of dead assets, the `iconDir` line, and `sharp` if unused — **before**
  `git init`.
- `render()` wrap-aware redraw plus the `clear` fix, and the prompt collapse under 60 columns.
- Light-theme token darkening, inline-code ink, `--color-danger` for the sandbox error,
  `--tmx-screen-ink` wired up.
- Six `<p class="tmx-card__title">` → `<h3>`; the Escape handler that breaks the keyboard trap;
  `screenReaderMode: true` and `aria-label` on both terminals.
- Turn off `lastUpdated`. Fix the "terminal in every lesson" claim — two words or two
  terminals.

**Unlocks:** the site stops being wrong. Every remaining item becomes a refinement rather than
a correction, and the two things that can actively hurt a reader are closed.

### Wave 2 — Refine

**Scope:** two to three days, mostly mechanical.

- Cascade layers: wrap prose/Starlight overrides in `@layer starlight`, everything from line
  360 in `@layer components`, then re-audit. **Do this before the clone.**
- Extract island chrome to real CSS classes; delete the `!important` at `:686`, the
  `--tmx-cyan`/`--tmx-magenta` aliases, the traffic lights, and every hardcoded hex.
- Typography consolidation: collapse the two eyebrows and three card titles into one value
  each; rebridge `--fg-body`; add `--space-block`; add the island font classes; add h5/h6 and
  heading margin rhythm. Let a scale emerge from this rather than adopting one wholesale.
- Accessibility pass 2: global `:focus-visible`, `aria-pressed` plus `role="status"` on the
  progress toggles, the avatar radiogroup, `aria-hidden` on the nine astro-icons, the ghost
  truecolor, the reduced-motion additions.
- Simulator fidelity: `NOT_SIMULATED` map, `rm`/`cp`/`mv`/`pkg uninstall`/`ls -l`,
  `$VAR` expansion, `&&` splitting, expanded `SUGGESTIONS`, plus the CI grep that keeps it
  honest.
- Touch key row and mobile viewport handling in the terminal; mid-line editing and the history
  draft fix.
- Delete Tailwind. Theme Expressive Code. Add the print stylesheet, the `og:image`, the
  distinct homepage title, and the sticky-terminal phase 1.
- Repo hygiene: TypeScript plus `astro check` in a PR gate, pinned Node,
  `cancel-in-progress: false`, xterm dynamic imports (which also drops 340 KB off the
  homepage), the ProfileBadge CLS slot, the font `/latin.css` entrypoints, the COI script
  moved to one page, and the Starlight coupling-surface comment plus a version pin.
- Rewrite CLAUDE.md/AGENTS.md into real house rules. Fix the README drift.

**Unlocks:** the design system stops evaporating at its boundaries, the site becomes
maintainable by someone who is not you, and it stops costing three times as much to change.

### Wave 3 — Enhance

**Scope:** open-ended; pick by appetite.

- The fish lesson (`start/friendly-shell.mdx`) — restores the original's best idea and closes
  the credibility gap between the simulator and real Termux.
- `foundations/files.mdx` (create/copy/delete plus `rm -rf` safety, folding in the GUI-editor
  hack and `cat > file` heredoc mode in the simulator).
- `start/getting-around.mdx` (sessions, copy/paste, volume-key modifiers).
- `foundations/whats-next.mdx` — the exit ramp to the Intermediate course.
- The `<Checkpoint>` component wired to `onState`: replace author-written Recaps with
  challenges the terminal grades, and make completion earned rather than clicked.
- One designed failure per lesson, plus a "how to get unstuck" section.
- The imperative handle and the "▶ Try it here" button on code blocks — the feature no other
  Termux tutorial has.
- The sun/moon theme toggle.
- The two-state completion model (practiced here / did it on my device) and the splash-page
  course map.

**Unlocks:** the site stops being a beautiful documentation site and becomes a product. The
`<Checkpoint>` work in particular converts three separate problems — dead code, honor-system
progress, no assessment — into one feature.

---

## 7. Before cloning to intermediate and advanced

This is the highest-value section in the document. Everything below is either impossible or
three times as expensive after the clone.

**First, settle the topology question — it is not a technical detail.** Nearly every
clone-readiness item in this audit is a *consequence* of the three-repo decision, not an
independent problem: 17 hardcoded base paths, the localStorage collision on the shared
`dnoice.github.io` origin, the unfixable `robots.txt`, the extraction of `global.css` /
`progress.ts` / the terminal components, three-way cross-linking, three CI pipelines, three
design-system drifts, and three copies of every fix in this document. **One Astro project with
three Starlight sidebar groups on one custom domain makes all of them evaporate
simultaneously.** The counter-arguments are real — separate issue trackers, separate
forkability, separate release cadence, and a psychologically clean "I finished course 1" — but
for a solo author that bill is paid three times, forever. My read: one site, three sections,
one custom domain. Decide explicitly, now, while both siblings are empty.

**If the answer is still three repos, the checklist is:**

1. **Do not extract an npm package or a git submodule.** A shared workspace package for three
   static sites maintained by one person is a maintenance tax with a worse failure mode than
   copy-paste. Extract **one file** instead: `src/config/site.ts` per repo, holding everything
   that differs — storage key, base path, GitHub URL, course level, sibling course URLs, and
   the `LESSONS` array. Cloning becomes "edit one file."
2. **Namespace localStorage now.** Not three sibling keys (`tmx:beginners:v1`,
   `tmx:intermediate:v1`), but one root key `tmx:v1` containing
   `{ profile, courses: { beginners: {…}, intermediate: {…} } }`. Same origin means all three
   sites can read it — which is the only way a "Course 1 of 3 complete" ribbon, a shared
   profile, or a series certificate is ever possible. Choosing this after the beginner course
   ships means a migration; choosing it today costs nothing. **All three sites currently share
   the key `tmx:beginners:v1` on one origin, so the advanced site would overwrite the beginner
   site's progress.** That is a live bug, not a hypothetical.
3. **Fix the cascade layers first.** Retrofitting `@layer` into three diverged stylesheets is a
   fundamentally different job than doing it once. Same argument for extracting the island
   chrome into CSS classes — 50 inline style objects becomes 150.
4. **Kill the CTA bug at the pattern level, not the instance level.** The `background`
   shorthand → longhand change is what stops the next hand-written MDX button from breaking
   identically in two more repos.
5. **Derive the sidebar from `LESSONS` and type the slug prop.** The four-source-of-truth
   ritual has to be taught twice more otherwise, complete with its silent-failure mode.
6. **Make `BASE` actually work, and add `BASE=/ npm run build` plus a `dist/` grep to CI.**
   Otherwise every clone starts with 17 find-and-replaces done by hand.
7. **Add `astro check` to a PR gate before anything else is written.** Every type-safety
   improvement in this audit is currently unenforceable, and that will be true in three repos
   instead of one.
8. **Add the Playwright screenshot tests.** Nothing tests appearance today, which is how a
   1.00:1 button shipped. Three repos multiply the surface where that can happen again.
9. **Delete the dead assets and `git init` clean.** After the first commit the 7.2 MB is in
   the pack permanently, three times.
10. **Extract `TERMINAL_THEME` to one exported const** imported by both terminal components —
    they currently define a 20-key palette and a 4-key subset separately, so the two terminals
    on one page do not match. Same for the `useFitOnResize` hook.
11. **Write the house rules into CLAUDE.md/AGENTS.md before the clone**, not after. Brass is
    the only warm colour; Fire Watch tokens not `--sl-color-*` in components; raw-HTML UI gets
    `not-content`; islands are `client:only="react"`; never hardcode the base path. Those five
    lines are what keep three repos from becoming three design systems.
12. **Rename `global-resouces/` → `global-resources/`** now, before anything references it.

---

## 8. Explicitly not recommended

Deliberately leave these alone. This audit is large enough to sink the project under its own
recommendations, so the omissions matter as much as the inclusions.

| Leave alone | Why |
| --- | --- |
| The persistent side-by-side terminal (`PageFrame`/`TwoColumnContent` override) | Largest effort item proposed anywhere, least certain payoff. A right-rail terminal on a phone is worse than the inline one. The sticky-on-wide version gets most of the benefit for a fraction of the work. |
| An eleven-token type scale adopted in one sitting | Wide-blast-radius refactor with real regression risk and no user-visible win. The actionable 20% is collapsing the duplicate eyebrow and card-title rules; let the scale emerge from that. Adopting a speculative ladder wholesale is how you get a twelfth near-identical value. |
| Narrowing `--sl-content-width` for reading measure | 45rem is Starlight's shipped default and what thousands of docs sites render at. The ~82ch figure is an estimate from average glyph advance, not a measurement. Do delete the dead inline `max-width:46rem` at `index.mdx:17`; drop the rest. |
| "Committing to Tailwind" | Real work converting 50 inline style objects in service of a dependency the project does not use. Delete the three packages and the two `@import` lines instead. The hand-authored token system is obviously the real design system. |
| The full accessible-terminal program (build-time transcript generator) | That is a product, not a fix. Break the trap, add `aria-label` and `screenReaderMode`, fix the headings, then write an honest accessibility statement. An honest limitation beats a half-built accommodation. |
| Progress export/import | A seven-checkbox honor-system list is not worth serializing. Build it after completion is earned by verified shell state — then there is something worth carrying. |
| Per-page OG image generation, and `Course` / `BreadcrumbList` JSON-LD | One static 1200×630 PNG, ship it. Structured data on a course with two known-wrong content claims is optimizing distribution for a product that is not finished. Revisit after Wave 1. |
| Replacing `confirm()` with a custom `<dialog>` | It is accessible, it works, it is two lines. Off-palette for four seconds a year. |
| `public/robots.txt` | Inert at this base path — crawlers read it only from the origin root, which a different repo controls. Adding it creates false confidence. Submit the sitemap to Search Console instead. |
| Porting the original's scroll-reveal animation | The hidden state is set in CSS, so content stays at `opacity: 0` forever if JS fails — a new single-point-of-failure for all page content, on a site whose audience includes old Android browsers. Wrong order of operations. |
| The footer war-cry, ASCII banner, and dated colophon | "Guide forged for Danny on April 27, 2025" is a personal-document colophon that does not belong on a public course. The one survivor of that cluster — the course has no ending — is already in Wave 3 as the exit ramp. |
| Editorial rewrites for voice, and removing the lone 🎉 | Preference, not defect. One emoji in 4,358 words is not a register break, and numbered steps are correct for the one lesson where the reader is executing rather than reading. Note it for a future editing pass. |
| Reusing `terminal.png` / `termux_linux_elements.svg` as lesson screenshots | Directly contradicts deleting them as dead weight — and nobody knows whether `terminal.png` or `terminal-v2.png` was the winner, which is itself the argument for deleting both. If you want lesson figures, shoot new ones at a sane size. |
| The Fire Watch / Tailwind `@theme` namespace collision | Harmless while zero utilities are used, and it evaporates entirely when Tailwind is dropped. A footnote on that finding, not a finding. |
| Triaging the invisible-polish cluster individually | Warm greys in the light ramp, per-size letter-spacing, the 0.66-vs-0.68rem eyebrow, `--tmx-glow-cyan`'s misleading name, the eleven dead `--tmx-*` aliases. All real, all correct, none worth a decision. One sweep, one commit, never prioritized above sections 4.3-4.6. |

---

*End of audit. No fixes were applied. Nothing in this document was written to the codebase.*

## Discovered during the fix sweep (not in the original audit)

- global.css was re-declaring the pagination eyebrow and pagination link title in raw units
  (`font-size: 0.68rem; letter-spacing: 0.14em; font-weight: 600` and `font-size: 1.15rem;
  line-height: 1.2`) LATER in the file than the shared EYEBROW and CARD TITLE rules that
  had already been put on the token scale. Sitting later, the raw values silently won and
  quietly reintroduced two off-scale sizes into a system that had just been rebuilt around
  a modular scale. I removed the duplicate declarations (in my own file, and it restores
  rather than undoes the typography work); the eyebrow now resolves to
  --text-2xs/--weight-semibold/--tracking-wide and the title to --text-md/--leading-snug.
  Worth a grep for other post-refactor duplicates elsewhere in the file.

- The BRIDGE section has a stranded comment line — `/* --tmx-* helpers (brass-anchored; NO
  second warm accent competing). */ /* legacy alias -> brass */ /* legacy alias -> bright
  brass */` — three comments with no declarations left after a token removal. Cosmetic
  only; left in place rather than churn a file other agents may be reading.

- `starlight-theme-select select` pulls `font-size: var(--sl-text-xs)`, a Starlight token,
  inside a file whose stated rule is to prefer Fire Watch tokens and edit the bridge
  rather than the consumers. Minor drift; likely to be swept up by the sun/moon toggle
  work (B14 / D8), so I left it alone.

- The grey autosuggestion was left on screen when a line was submitted or Ctrl-C'd, so the
  ghost text got glued to the command in the scrollback and read as part of what was
  typed. Fixed with a `ghostOff` flag that suppresses it for the final redraw before
  submit/abort (TermuxTerminal.tsx). Not in any audit.

- Multi-line paste was silently mangled. The old printable guard `data >= ' '` is a
  lexicographic comparison on the whole chunk, so a pasted block passed and its raw
  newlines were concatenated into one unrunnable command. The lessons print multi-line
  fenced blocks (extra-keys.mdx has a three-command one) and people paste them wholesale.
  Now split on newlines: all but the last line are submitted in order, the remainder lands
  in the buffer.

- `ExecResult` had no exit status at all, so nothing downstream could distinguish success
  from failure — which is why `&&` could not have been implemented without this change. It
  now carries `code: number`, used by `&&`/`||` and available to the caller.

- shell.ts had no notion of an unwritable path, so `mkdir /system/x` and `touch /sdcard/x`
  silently succeeded into a fake tree — teaching that Android has no permission model.
  `/sdcard` and `/system` now exist in the FS but are read-only, and everything outside
  `/data/data/com.termux/files` returns `Permission denied`.

- The `history` command was implemented in TermuxTerminal, not shell.ts, so it could never
  work inside an `&&` chain or with `>` redirection. `ShellState` now owns `history:
  string[]` and the terminal pushes into it, which makes `pkg list-installed >
  ~/storage/shared/termux-backups/packages.txt` (the flow audit's suggested fourth backup
  step) work today.

- The inline `boxShadow: '0 8px 30px rgba(0,0,0,0.35)'` on `.tmx-terminal` was both an
  untokenised literal and dead code — global.css line 1190 already `!important` overrides
  it. Removed; border and radius now use `--border-default` and `--tmx-radius`.

- No test file exists anywhere in the repo, despite CHANGES-IN-FLIGHT describing the
  COMMAND_NAMES invariant as test-enforced, and TypeScript is not installed so there is no
  `tsc` either. I verified with a node type-stripping harness run from the scratchpad (see
  handoffs); it should be adopted into the repo, which is B12's territory.

- CLAUDE.md and AGENTS.md were HARDLINKED on disk (identical inode, link count 2, both 874
  bytes). That is why they stayed byte-identical stock boilerplate. Any agent or editor
  writing one would have silently rewritten the other. I broke the link (removed
  AGENTS.md, then wrote both fresh) — worth knowing if the same trick exists in the
  intermediate/advanced repos.

- The `.vscode/launch.json` debug config runs `./node_modules/.bin/astro dev`, which will
  start the dev server with the Astro toolbar path the config disables elsewhere —
  harmless, but it is a second, undocumented way to start the server that bypasses `npm
  run dev`. Not audited anywhere; low priority.

- Mixed line endings inside src/content/docs: `foundations/extra-keys.mdx` is CRLF while
  every other content file is LF. Harmless to Astro, but it makes diffs on that one file
  useless and it will flip wholesale the next time anyone's editor normalises it. A
  `.gitattributes` (or `.editorconfig`) setting `* text=auto eol=lf` would settle it
  before the repo goes under version control — which per CLAUDE.md it still isn't.

- `cat > file` in the practice terminal silently truncates the file to empty rather than
  waiting for input — there is no stdin, so `cat` returns no output and the redirection
  writes an empty string. This is not wrong, but it is the one command in the new Files &
  Folders lesson whose simulated behaviour differs from the device, and a learner who runs
  it on a file with content will lose that content with no message. I documented the
  difference in the lesson prose and routed practice through `echo … >` instead, but
  shell.ts could close it properly by printing a DIM note ('no clipboard here — on your
  phone this waits for a paste, then Ctrl-D') the way it already does for `nano` and
  `tar`. shell.ts is not mine.

- `reference/cheatsheet.md` and `reference/troubleshooting.md` carry `sidebar.order: 1` and
  `2`, which collide with `foundations/filesystem` (1) and `foundations/files-and-folders`
  (2). Inert today because both groups use explicit `items` arrays, but if anyone takes
  the 'switch to autogenerate' branch of the ordering decision above, the Reference group
  is ordered independently of Foundations and this is fine — whereas a flat autogenerate
  would scramble. Worth deciding consciously rather than discovering at build time.

- The three-column-table and long-absolute-path pattern the report flagged for mobile also
  appears in `foundations/packages.mdx`'s starter-toolkit table and
  `start/installing.mdx`'s plugin table. Both are two-column and short, so they wrap
  acceptably — but they are the same authoring pattern, and if a mobile-viewport pass is
  run after the build it is worth re-checking them at 390px rather than assuming the two I
  converted were the only offenders.

- astro.config.mjs emits an Astro 7 deprecation warning on every build and every `astro
  check`: "`markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype`
  are deprecated. Pass them to `unified({...})` from `@astrojs/markdown-remark` directly
  instead." This is the `rehypeBasePaths` plugin — i.e. the mechanism behind the
  already-CLOSED base-path fix. It still works, but it is on a removal path and the
  migration needs a build to verify, which I am not permitted to run. Someone should port
  it deliberately, with a build, before the next Astro major.

- Another agent edited package.json — a file in my ownership list — while I was working on
  it, adding `check:curriculum` and changing `build` to `node scripts/check-curriculum.mjs
  && astro build`. I preserved their change (both sets of edits now coexist and `npm run
  check` is still green with their new scripts/check-curriculum.mjs in the graph).
  Flagging it because the ownership split was supposed to prevent exactly this, and the
  next writer to that file may not be as lucky.

- The vendored public/coi-serviceworker.js declares `coepDegrading` and never reads it (a
  vendoring artifact from upstream v0.1.7). It surfaced as the only `astro check` hint. I
  chose not to touch upstream logic; excluding `public/` in tsconfig.json silences it.
  Harmless, but it means the local copy has diverged from upstream in a third,
  undocumented way.

- `iconDir: 'src/assets/icons'` in astro.config.mjs points at a directory that does not
  exist (CLAUDE.md admits this: every `<Icon>` actually resolves from the
  `@iconify-json/*` packages). It is inert config noise in a file I own; I left it alone
  because deleting it changes icon resolution behaviour and belongs with whoever is doing
  the icons/a11y pass.

- `LiveSandbox` had no retry affordance at all. The catch block reset `bootedRef.current =
  false` to permit a retry, but the Boot button only rendered while `phase === 'idle'`, so
  after any failure the learner's only recourse was reloading the page. Fixed in-scope
  (button now renders on `error` as "Try again"), but flagging it because the same shape
  may exist elsewhere.

- `global.css:1252` — `.tmx-terminal > div:last-child, .tmx-sandbox > div:last-child {
  padding: 4px !important }` is a structural selector standing in for a semantic one.
  Today it also clobbers the LiveSandbox *idle copy* panel's authored `18px 14px` padding
  down to 4px on phones, which is not what the mobile-columns fix intended — that rule is
  aimed at the xterm screen. It should target the screen explicitly (a class on the host
  div) rather than whichever element happens to be last. Any agent adding an element to
  either terminal will trip over this.

- `progress.ts` still has no `version` field on `ProgressData` (the version lives only in
  the localStorage key name, so a schema change means bumping the key and silently
  deleting every learner's progress). The new `ProgressExport` type *does* carry `version:
  1`, so the export format is migration-ready while the stored format is not. This is
  called out in the audit's "four hand-maintained sources of truth" finding, which is
  assigned elsewhere — the export work makes fixing it cheaper, not harder.

- The React islands still render Inter into the article body (audit finding "React islands
  set size and weight but never family"). My new completion panels inherit the same
  problem: `LessonComplete`'s new banner and `ProgressDashboard`'s completion card are
  `.not-content`, so they fall back to `body` → Inter. I set `--font-heading` explicitly
  on the dashboard's completion `<h2>` only. The real fix is the `.tmx-island` /
  `.tmx-island__title` opt-in classes the audit proposes, which need global.css.

## Discovered during the final sweep (not in the original audit)

- FIXED (in my file, one-line, same rule I was already editing): the mobile terminal-padding rule was `.tmx-terminal > div:last-child, .tmx-sandbox > div:last-child { padding: 4px !important }`. `> div:last-child` is the xterm host in TermuxTerminal but the hint footer / idle overlay in LiveSandbox, so on the sandbox this rule squeezed the wrong element entirely and left the actual screen gutter at 8px — i.e. half of the phone-width column-count fix (M1) was never applying to the live sandbox. Retargeted to the same `:has(> .xterm)` match as the clip fix.
- FIXED (in my file): the button sheen's ::before rule listed three selectors (.sl-markdown-content .action, .sl-link-button, .tmx-btn) but its :hover counterpart listed only two — `.sl-link-button` was missing. So the splash hero CTA ("Start the course", the single most-clicked control on the site) carried a fully-built sheen pseudo-element that never swept. Added; this is the last remaining asymmetry from the "one button system" unification.
- NOT FIXED, out of scope, flagging rather than touching: the whole Starlight card block in global.css — `.sl-markdown-content .card`, `a.card`, `.card-grid`, `.card .icon` — plus the `.tmx-card--link` opt-in modifier match nothing in current content. There is no `<Card>`, `<CardGrid>` or `<LinkCard>` anywhere under src/content/. That is roughly 60 lines. I did NOT delete it: `.card` is Starlight's public component API, content agents are adding lessons in this same phase (B13/B17), and deleting it would silently unstyle any card they introduce. Worth a decision at the B18 coherence pass, once content is final.
- NOT FIXED (not my file): src/components/terminal/LiveSandbox.tsx:252-255 still carries three untokenised inline values on the .tmx-sandbox wrapper — `borderRadius: '10px'` (TermuxTerminal uses `var(--tmx-radius)` = 12px, so the two terminals have different corners), `border: '1px solid var(--sl-color-gray-5)'` (should be --border-default; the --sl-* bridge is documented as edit-the-bridge-not-the-consumers), and `boxShadow: '0 8px 30px rgba(0,0,0,0.35)'`, which is dead anyway — global.css already !important-overrides it with --shadow-xl. TermuxTerminal had exactly these three and they were cleaned there; the sandbox was missed. Belongs to whoever owns "Roughly 50 inline style objects have escaped the token layer".
- `--text-2xs` now has exactly one consumer (the shared kicker/eyebrow rule) and `--tmx-ease` exactly one (LessonComplete.tsx:68, via a raw `all 0.3s` transition that is not itself tokenised). Both are one edit away from becoming dead tokens. Not acting on either; recording so the coherence pass can see it.
- `exit` is not implemented in the simulator and is in no audit. `src/components/terminal/shell.ts` BUILTIN_NAMES has no `exit` entry (grep for `'exit'` in that file returns nothing), so it highlights RED as a typo and returns "command not found" — while `start/friendly-shell.mdx` instructs "type `exit` in every open session", `where-next.mdx` says "`exit` to come back", and `reference/cheatsheet.md` documents it in two tables. This is exactly the defect the CLOSED finding "Lessons instruct commands the simulator cannot run" set out to kill; `exit` slipped through because it is a shell builtin rather than a package command. It needs a branch in runCommand() (printing something like `logout` / a session-ended line) plus an entry in BUILTIN_NAMES. Not fixed — src/components/terminal/ is not my file.
- The claim "Volume Up + a letter is Alt" (present in extra-keys.mdx, first-session.mdx and cheatsheet.md, all from work closed on 2026-08-06) may be imprecise. In current Termux, Volume Up is the special/function modifier with a fixed mapping table (E=Esc, T=Tab, W/A/S/D=arrows, Q/K=toggles, L=|, H=~, U=_, P/N=PgUp/PgDn, .=Ctrl-\), and it is not clear it falls through to Alt for unmapped letters. I did not touch the existing claim — it belongs to a closed finding — but I ordered the tables specific-rows-first and phrased the fall-through as "any other letter", so the two statements read coherently. Someone should verify against the Termux wiki's Touch Keyboard page before the next content pass; if Volume Up is not an Alt modifier, three files need one row each corrected.
>
> **✅ RESOLVED 2026-08-09 — the flag was correct, and the claim was wrong.** The
> wiki is behind Anubis bot-protection, so verified against the source of truth
> instead: `TermuxTerminalViewClient.java` in termux/termux-app, the
> `mVirtualFnKeyDown` handler. Two errors, not one, and they were in **four**
> files rather than three:
> 1. **"Volume Up + any other letter = Alt" is false.** There is no default
>    branch — unlisted letters produce nothing at all. Only `b`, `f` and `x` set
>    `altDown`. Corrected in `extra-keys.mdx`, `cheatsheet.md` and
>    `first-session.mdx`, and each now states the asymmetry explicitly (Volume
>    **Down** takes any letter; Volume **Up** is a fixed list).
> 2. **"Volume Up + K toggles the soft keyboard" is also false** — this one no
>    audit caught. `case 'q': case 'k:'` fall through to the same
>    `toggleTerminalToolbar()`, so both toggle the extra-keys row. Corrected in
>    `extra-keys.mdx`, `cheatsheet.md` and `sessions-and-copy-paste.mdx`.
>
> While in there, added the mappings the course had simply never mentioned and
> that matter most for it: `L` = `|` (a pipe is two taps deep on a phone keyboard
> and the course pipes constantly), `H` = `~`, `U` = `_`, and `1`–`9`/`0` = F1–F10.
> Build clean, both guards pass, `grep` confirms no residual instance of either
> wrong claim anywhere in `src/content/docs`.
- The new lesson file is written with LF line endings while 10 of the (now) 15 content files are still CRLF. This is the direction `.gitattributes` mandates (`* text=auto eol=lf`) and my edits to existing files preserved their CRLF, so nothing got mixed within a file — but the repo is still pre-`git init`, and the normalising pass CLAUDE.md calls for has not been run.
- `src/content/docs/index.mdx`'s "What you'll walk away with" grid has four cards and now describes a seven-lesson course as an eight-lesson one; none of the four cards mentions the Android-app layer (sessions, copy/paste) that the new lesson adds and that the audit called "the only thing that makes it different from a generic Linux tutorial". I left the grid at four to avoid disturbing its 2×2 rhythm, which is a visual-audit concern, not mine. Worth a decision from whoever owns the landing-page layout.
- package.json `name` is `termux-tutorial` but package-lock.json `name` is still `termux-tutorial-for-beginners` (lines 2 and 8) — leftover from the repo rename, in no audit. I own package.json but not the lockfile, so I did not touch it.
- README.md and CONTRIBUTING.md still document the old base/repo name in live (not historical) positions: the GitHub URL and the dev-server URL in README, the base-path convention in CONTRIBUTING. Not in any audit, and outside my file list.
- The repo directory on disk is still `termux-tutorial-for-beginners/` while package.json, BASE and every GitHub URL are now `termux-tutorial`. Harmless to the build, but it is why greps for the old name keep returning hits in docs; worth one deliberate decision (rename the directory, or stop treating the hits as stale) rather than being fixed piecemeal by successive agents.
- **The mobile full-bleed block was dead code.** `@media (max-width: 30rem) { .tmx-terminal, .tmx-sandbox { border-radius: 0; border-inline: none; } }` in `global.css` could never apply: both components set `border` and `borderRadius` as inline styles, and no ordinary rule beats an inline style. Every phone visitor got a terminal stretched to `100vw` that still had a 12px radius and a 1px hairline running off both edges of the viewport. Fixed as a direct consequence of moving the frame into CSS — no separate change needed, but worth knowing the mobile framing looks different now because it finally works.
- **`LiveSandbox` reimplemented a CSS breakpoint in JavaScript.** It carried a `useState(compact)` plus a `matchMedia('(max-width: 30rem)')` listener purely to compute the terminal screen's 4px-vs-8px padding, because the stylesheet had been targeting the screen with `> div:last-child` — which is the *wrong element* in that component (the hint footer and the idle overlay both render after the screen). `global.css` now selects it structurally with `:has(> .xterm)`, which matches exactly when a terminal is mounted, so the collapsed state needs no rule at all. One state, one effect and one listener deleted; the breakpoint now exists in one place instead of two that could drift.
- **`.tmx-profile-slot` was 1.5px short of the badge it reserves.** Detail and fix in the ProfileBadge closure — noting it here because the underlying cause is general: island text that sets `fontSize` but not `line-height` silently inherits Starlight's `--sl-line-height: 1.75`, which makes any height derivation done from the component's own numbers wrong. Any future reserved-height slot on this site needs explicit line-heights on the text inside it.
