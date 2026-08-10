# Termux Intermediate Course — Consolidated Audit

**Repo:** `termux-tutorial-intermediate` (Astro + Starlight, GitHub Pages)
**Reference / quality bar:** `termux-tutorial-for-beginners`
**Audit date:** 2026-08-09
**Auditors:** 8 dimension specialists, consolidated by a 9th pass. No fixes were applied.

## How to read this

Sections 1-3 are the summary, the blockers, and the high-severity queue — that is
everything needed to decide what ships. Sections 4-6 are the long tail. Section 7 records
what was merged, dropped, or re-scoped, so dismissed findings are visibly considered
rather than silently lost.

Every finding carries **Severity**, **Effort** (small = under an hour, medium = a few
hours, large = a day or more), and a **Location**. Findings reported by more than one
auditor are merged into a single entry and attributed to both.

Two conventions inherited from the beginner audit are respected here: the stylesheet is
deliberately **unlayered** (Starlight ships `@layer starlight.*` and unlayered wins), and
the boot splash is a deliberate feature. Neither is reported as a defect.

## 1. Executive summary

The intermediate course is structurally sound and the prose is good, but it is a copy of
the beginner shell that has not finished becoming its own course. The defects cluster into
three groups, and the grouping matters more than the individual counts.

**Group one — the course still identifies as the beginner course.** Its social card, its
course-completion copy, its GitHub links, and its "Edit this page" affordance all still
belong to course one. A learner who finishes the intermediate course is congratulated for
installing Termux and using `pkg`. This is the single most visible class of defect and
every instance is a small, mechanical fix.

**Group two — one deploy-blocking contradiction.** The repo's own base path and the
beginner course's forward link to it disagree about this repository's name
(`termux-tutorial-intermediate` vs the misspelled `termux-tutorial-intermidiate`, which the
beginner course's audited comment asserts is the real live URL). Exactly one is correct.
If the base path is wrong the entire deployed site 404s; if the beginner link is wrong the
series has no path from course one to course two. This needs a human decision before
deploy, not a code change.

**Group three — the automation and serving lessons contain instructions that fail
silently on a real phone.** The flagship example schedules `battery-check.sh` when the
previous lesson created `battery-check`; cron reports nothing, so the job simply never
runs. The Termux:Boot recipe commands a service supervisor it never starts. The tunnel
lesson exposes a folder on the local network while its prose asserts the opposite. These
are the findings most likely to cost a learner an evening, and they are exactly the class
of bug the course sets out to teach against.

The reference pages (`cheatsheet.md`, `troubleshooting.md`) are 18- and 21-line stubs
while three places in the frame make itemised present-tense promises about their contents.
That is the only finding rated **Large** effort — it is unwritten content, not a bug.

### Scorecard

| Severity | Count | What it means |
| -------- | ----- | ------------- |
| Critical | 3 | Ships a visibly wrong or broken experience; fix before deploy |
| High | 12 | Misleads a learner or breaks an affordance on every page |
| Medium | 19 | Real defect, contained blast radius |
| Low | 24 | Correctness and consistency; safe to batch |
| Nit | 10 | Polish |
| **In scope** | **68** | |
| Out of scope | 7 | Real defects, but in the beginner repo — see Appendix A |

## 2. Blockers

### C1. The scheduling lesson schedules a file the learner does not have

**Severity:** Critical · **Effort:** Small · **Dimension:** Automation module
**Location:** `src/content/docs/automation/scheduling.mdx:96, 168, 194, 349, 357`

`shell-scripts.mdx` builds the tool without an extension — line 148 `cat > ~/bin/battery-check`,
line 521 `chmod +x ~/bin/battery-check` — and line 291 explicitly tells the learner to drop
the `.sh`. Every one of the five references in `scheduling.mdx` then adds it back:

```text
*/15 * * * * /data/data/com.termux/files/home/bin/battery-check.sh
```

The lesson itself states that cron's output goes nowhere. So the crontab installs cleanly,
the job runs on schedule, the path does not exist, and nothing is ever reported. The
learner gets no error, no log, and no clue — the flagship example of the automation module
silently does nothing. `termux-job-scheduler` at line 357 fails the same way.

**Fix:** Drop `.sh` from all five references, or change the previous lesson to keep it.
The extensionless form is the one the course argues for, so change `scheduling.mdx`.

### C2. The social card advertises the beginner course

**Severity:** Critical · **Effort:** Small · **Dimension:** Design parity, A11y/SEO
**Location:** `public/og-default.png`, `public/og-default.svg`, wired at `astro.config.mjs:18`

`og-default.png`, `og-default.svg` and `favicon.svg` are **byte-identical** to the beginner
repo's copies (verified with `cmp`). The SVG's own text nodes read:

```text
Termux for Beginners
Linux in your pocket, one command at a time.
```

Meanwhile `astro.config.mjs:437` sets `og:image:alt` to
`'Termux: Intermediate — your phone, talking to its own hardware.'` — alt text describing
an image that does not exist.

Every share of course two on any platform renders a card headlined with course one. A
learner who has just finished the beginner course sees its card and reasonably concludes
the link is a duplicate.

**Fix:** Re-render both card assets with the intermediate title and tagline. The alt text
already describes the card that should be there.

### C3. The course-complete screen congratulates the learner for finishing course one

**Severity:** Critical · **Effort:** Small · **Dimension:** Course frame, Design parity
**Location:** `src/components/profile/ProgressDashboard.tsx:230-233`,
`src/components/profile/LessonComplete.tsx:89-91`

Both strings are inherited verbatim from the beginner repo — `ProgressDashboard.tsx:230-233`
is byte-for-byte identical to the beginner file at the same lines:

```text
You can install Termux without trusting the Play Store build, drive a shell
from a phone keyboard, move between Android storage and the Linux side
without losing files, and install what you need with pkg.
That is the whole foundation — everything after this is just more commands.
```

`src/lib/progress.ts` was correctly re-authored with the intermediate lesson slugs, so this
banner definitely fires here — only the copy was left behind. A learner who has just wired
up Termux:API, read their GPS, fought Doze and published a tunnel is told their achievement
was installing Termux, and then told the series is essentially over.

**Fix:** Rewrite both strings against the intermediate outcomes. The closing line
"that is the whole foundation" is the beginner course's hand-off and must not appear here.

## 3. High severity

### H1. The repo's base path and the beginner course's link to it disagree

**Severity:** High · **Effort:** Small (decision, not code) · **Dimension:** Course frame
**Location:** `astro.config.mjs:11`; beginner `src/content/docs/where-next.mdx:31`

```js
const BASE = process.env.BASE ?? '/termux-tutorial-intermediate';
```

The beginner course points at a different, misspelled name, with an audited comment
asserting it is deliberate:

```js
// The repo name really is misspelled ("intermidiate") — that is the live URL, not a
// typo to fix here.
intermediate: 'https://github.com/dnoice/termux-tutorial-intermidiate',
```

Exactly one of these is right. If the live repo is `...intermidiate`, every URL on the
deployed intermediate site carries a base path that does not exist and the whole course
404s on GitHub Pages. If it is `...intermediate`, the beginner course's only forward link
to course two is dead. **This cannot be resolved from inside the tree — it needs the
actual GitHub repo name.**

### H2. Every page's GitHub and "Edit this page" links point at the beginner repo

**Severity:** High · **Effort:** Small · **Dimension:** A11y/SEO, Course frame
**Location:** `astro.config.mjs:411` (header icon), `astro.config.mjs:528` (`editLink.baseUrl`)

```js
href: 'https://github.com/dnoice/termux-tutorial',           // :411
'https://github.com/dnoice/termux-tutorial/edit/main/',      // :528
```

Starlight appends the page's source path to `editLink.baseUrl`, so every one of the 12
built pages ships a footer link resolving to a path that does not exist in the beginner
repo. Anyone who spots a wrong command and clicks "Edit page" to fix it lands on a 404 —
which selects against exactly the contributors worth having. Reported independently by two
auditors.

### H3. `--tmx-screen-ink` is referenced four times and defined nowhere

**Severity:** High · **Effort:** Small · **Dimension:** Design parity, Typography
**Location:** `src/styles/global.css:1662-1664, 1672` (beginner: `:1655-1657, 1665`)

```css
.tmx-terminal__key {
	color: var(--tmx-screen-ink);
	background: color-mix(in srgb, var(--tmx-screen-ink) 8%, transparent);
	border: 1px solid color-mix(in srgb, var(--tmx-screen-ink) 16%, transparent);
}
```

A grep across `src/`, `scripts/` and `astro.config.mjs` in **both repos** finds only
consumers — never a definition. `LiveSandbox.tsx:148` names the token in a comment as if it
existed. An undefined custom property with no fallback is invalid at computed-value time:
`color` falls back to inherited page ink, and both `color-mix()` values collapse to
transparent, so the key loses its background and border as well.

The key row's parent is `background: var(--tmx-screen)` = `#0e1014`, **dark-locked in both
themes**. In the parchment theme the inherited ink is `#2c2418`, giving roughly **1.75:1** —
effectively invisible. **This bug is present in the shipped beginner course too**, so
fixing it here should be ported back.

### H4. Wake-lock advice contradicts the Doze section on the same page

**Severity:** High · **Effort:** Medium · **Dimension:** Automation module
**Location:** `src/content/docs/automation/scheduling.mdx:236-238` vs `:298-300` and `:431`

Line 236 states the true fact — "**in Doze, the system ignores wake locks**" — and the page
then twice presents a wake lock as the cron-in-Doze answer, including in the comparison
table at line 431, which is the part learners act on because it is the summary. The step
that actually makes this work on stock Android — exempting Termux from battery
optimisation — appears once, at line 282, framed as a Xiaomi/Samsung/Huawei footnote.

**Fix:** Promote the battery-optimisation exemption to the main path and correct the table.

### H5. The Termux:Boot script commands a supervisor it never starts

**Severity:** High · **Effort:** Small · **Dimension:** Automation module
**Location:** `src/content/docs/automation/scheduling.mdx:472-478`

```sh
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock
sv up crond
```

The lesson establishes the dependency itself at line 38: `termux-services` starts its
supervisor from the login profile. A Termux:Boot script is not a login shell and does not
source `$PREFIX/etc/profile`, so `runsvdir` is not running and `sv up crond` has nothing to
talk to. Boot-script output goes nowhere, so the failure is invisible: the learner reboots
believing cron is restored.

**Fix:** Start `runsvdir` in the boot script before `sv up`.

### H6. The shell-quoting caution points at an example that demonstrates the opposite

**Severity:** High · **Effort:** Small · **Dimension:** Android Bridge module
**Location:** `src/content/docs/bridge/talking-back.mdx:142`

The text says "you want single quotes on the outside and doubles inside, as in the
`--button2-action` above." The example above, at line 114, is the reverse:

```text
--button2-action "termux-toast 'Fine. Ten minutes.'"
```

This is the one place in the module where quoting changes behaviour — early versus
tap-time expansion — and the caution's own worked example contradicts its rule. A learner
who follows the text gets precisely the bug the caution exists to prevent. The correct
pattern does appear later at line 373.

### H7. `termux-microphone-record` is taught without its permission prompt

**Severity:** High · **Effort:** Small · **Dimension:** Android Bridge module
**Location:** `src/content/docs/bridge/reading-the-device.mdx:439-460`

The whole microphone section contains no permission text, while the camera section
immediately above it does list the grant path. `RECORD_AUDIO` is a runtime permission, and
because this command detaches and returns the prompt immediately, the Android dialog
appears *after* the shell already looks like it succeeded. Android 11's deny-twice rule
then makes it fail silently and permanently, with no dialog and no error.

### H8. Both reference pages are stubs, but the frame promises their contents

**Severity:** High · **Effort:** Large · **Dimension:** Course frame
**Location:** `src/content/docs/reference/cheatsheet.md` (18 lines),
`src/content/docs/reference/troubleshooting.md` (21 lines)

Both are a comment plus a "Coming up:" sentence. `where-next.mdx:176-183` describes them in
the present tense — the cheatsheet "**has** every `termux-*` command, cron field, scheduler
flag and tunnel invocation from this course" — and the progress dashboard links to both as
the course payoff. A learner whose cron job died overnight taps "When something breaks" and
lands on "Coming up:". The failure is worst exactly when the learner is most stuck.

### H9. The tunnel lesson's server has no `--directory`

**Severity:** High · **Effort:** Small · **Dimension:** Serving module (security)
**Location:** `src/content/docs/serving/tunnels.mdx:115`

```bash
python -m http.server 8080
```

The previous lesson introduced `--directory` for exactly this reason. The happy path is
safe only because `cd ~/www` is two lines above; every other path is not. A new Termux
session starts in `$HOME`, the lesson itself tells learners to work in two sessions, and
the recap at line 333 repeats the bare command. The serve root becomes whatever the working
directory happens to be — against a danger callout 30 lines earlier warning never to point
a tunnel at `~`, which holds `.ssh`, shell history, and `.gitconfig`.

### H10. The tunnel server binds all interfaces while the prose says localhost

**Severity:** High · **Effort:** Small · **Dimension:** Serving module (security)
**Location:** `src/content/docs/serving/tunnels.mdx:115`, contradicted at `:68` and `:318`

Python's `http.server` listens on all interfaces by default — the course establishes this
itself in `local-server.mdx:142`. But `tunnels.mdx:68` describes the architecture as "your
local server on `127.0.0.1:8080`" and the troubleshooting tip at line 318 says to check it
is "bound to `localhost:8080`". While the tunnel is open the folder is simultaneously
readable by every device on the same Wi-Fi, and the lesson never says so. A tunnel only
needs loopback, so this is pure extra attack surface in the one lesson most about exposure.

**Fix:** `--bind 127.0.0.1` in the tunnel lesson, which also makes the prose true.

### H11. The shutdown check only looks for `cloudflared`

**Severity:** High · **Effort:** Small · **Dimension:** Serving module (security)
**Location:** `src/content/docs/serving/tunnels.mdx:281-292`

```bash
pgrep -a cloudflared
```

followed by "No output means nothing is running." localtunnel is presented as a co-equal
option and recapped as "the no-install-fuss alternative", but a globally npm-installed `lt`
runs as a `node` process and never matches that pattern. A localtunnel learner runs the
verification step, sees nothing, and walks away believing the door is shut while a public
URL still points at their phone. The step also never verifies the server itself stopped.

### H12. The desktop prose measure runs ~80 characters

**Severity:** High · **Effort:** Small · **Dimension:** Typography
**Location:** `src/styles/global.css:2318` (beginner: `:2309`)

```css
@media (min-width: 30rem) and (max-width: 63.9rem) {
	.sl-markdown-content { max-width: 68ch; margin-inline: auto; }
}
```

The rule's own comment identifies 720px ≈ 80 characters as the readability problem it
exists to solve — but the cap stops at 63.9rem. Above that the sidebar docks and the column
returns to Starlight's 45rem (720px) default, because `--sl-content-width` is never
overridden. The exact measure judged worth fixing on a tablet ships unfixed on every
desktop lesson page, well above the 45-75 character band. **Also present in the beginner
course.**

## 4. Medium

Real defects with a contained blast radius.

| # | Finding | Location | Dimension |
| - | ------- | -------- | --------- |
| M1 | The first crontab the learner installs is missing everything the lesson later says it needs, and they are never told to go back and fix it | `src/content/docs/automation/scheduling.mdx:93-96 and 221-224` | Automation module |
| M2 | `#!/usr/bin/env` is never mentioned, despite being the shebang the learner will meet everywhere and one that genuinely breaks on Termux | `src/content/docs/automation/shell-scripts.mdx:114-124` | Automation module |
| M3 | The `-z "$level"` guard and its friendly Termux:API message are largely unreachable under `set -eu` | `src/content/docs/automation/shell-scripts.mdx:496-505` | Automation module |
| M4 | The new 'Careful' sidebar badge fails WCAG AA contrast in light mode (3.99:1) | `astro.config.mjs:628` | A11y / perf / SEO / build |
| M5 | The landing page eagerly loads xterm + react-dom for a terminal the page itself says cannot run this course | `src/content/docs/index.mdx:61` | A11y / perf / SEO / build |
| M6 | Three docs still declare the build broken by a bug that is already fixed | `CLAUDE.md:435` | A11y / perf / SEO / build |
| M7 | Gradient-clipped text in the landing lede prints as a blank gap | `src/styles/global.css:633` | Typography (shared shell) |
| M8 | font-weight: 800 introduces a fifth weight outside the declared 400/500/600/700 ramp | `src/styles/global.css:638` | Typography (shared shell) |
| M9 | Telephony section names only the location permission; the Phone permission the commands need is never mentioned | `src/content/docs/bridge/reading-the-device.mdx:221` | Android Bridge module |
| M10 | SMS is listed as a permission Android will simply prompt for; on Android 10+ an F-Droid-installed Termux:API cannot be granted it at all | `src/content/docs/bridge/api-setup.mdx:168` | Android Bridge module |
| M11 | "Approve it and the prompt never comes back" is false for exactly this app on Android 11+ | `src/content/docs/bridge/api-setup.mdx:169` | Android Bridge module |
| M12 | The jq single-quoting convention established in lesson 1 is abandoned throughout lesson 2 | `src/content/docs/bridge/reading-the-device.mdx:105` | Android Bridge module |
| M13 | "Allow only while using the app" is recommended as the location minimum without saying it stops working the moment Termux isn't in front | `src/content/docs/bridge/reading-the-device.mdx:363` | Android Bridge module |
| M14 | Landing page requires the beginner course and never links to it | `src/content/docs/index.mdx:57-59` | Course frame |
| M15 | "About 300 MB free" is likely well short of what the course installs | `src/content/docs/index.mdx:68-69` | Course frame |
| M16 | The two lessons directly contradict each other on whether closing a Termux session kills the process in it | `src/content/docs/serving/local-server.mdx:367-368` | Serving module (security) |
| M17 | http.server follows symlinks out of the served directory, and the `ls -a` safety check the lesson teaches will not reveal it | `src/content/docs/serving/tunnels.mdx:104-108` | Serving module (security) |
| M18 | The command that binds all interfaces appears 235 lines before the warning about what that means on shared Wi-Fi | `src/content/docs/serving/local-server.mdx:75` | Serving module (security) |
| M19 | `tmx:splash-seen` sessionStorage key is not namespaced per course, so the beginner site suppresses the intermediate boot splash | `src/components/splash/BootSplash.astro:119` | Design system / CSS parity |

## 5. Low

Correctness and consistency. Safe to batch into one pass.

| # | Finding | Location | Dimension |
| - | ------- | -------- | --------- |
| L1 | The `sh -x` trace is fabricated and does not match the script it claims to be tracing | `src/content/docs/automation/shell-scripts.mdx:561-574` | Automation module |
| L2 | `Permission denied` error is shown with the wrong shell prefix — `sh:` where the same file later correctly says `bash:` | `src/content/docs/automation/shell-scripts.mdx:75-77` | Automation module |
| L3 | "Then type these three lines" is followed by two lines | `src/content/docs/automation/shell-scripts.mdx:215-220` | Automation module |
| L4 | Tab completion is recommended for typing a crontab, which is edited in nano where tab completion does not exist | `src/content/docs/automation/scheduling.mdx:181-184` | Automation module |
| L5 | `export EDITOR=nano` assumes nano is installed; the beginner course explicitly installs it as a step | `src/content/docs/automation/scheduling.mdx:77-86` | Automation module |
| L6 | `jq` is introduced as a new install two lessons after the course already installed and taught it | `src/content/docs/automation/shell-scripts.mdx:435-441` | Automation module |
| L7 | "Termux has no `/bin`" is not quite true on modern Android, and the real reason `#!/bin/sh` is wrong is different | `src/content/docs/automation/shell-scripts.mdx:121-124` | Automation module |
| L8 | Dead Starlight card CSS re-imported from a pre-fix snapshot of the beginner stylesheet | `src/styles/global.css:660` | A11y / perf / SEO / build |
| L9 | JSON-LD `teaches` lists 7 items against 8 registered lessons, contradicting its own comment | `astro.config.mjs:312` | A11y / perf / SEO / build |
| L10 | No robots.txt and no sitemap.xml despite `site` being configured | `public` | A11y / perf / SEO / build |
| L11 | Eleven off-token typography literals bypass the scale, including a 16px button size that is not on it | `src/styles/global.css:749` | Typography (shared shell) |
| L12 | --fg-subtle fails AA in both themes and has zero consumers — a live trap on the bottom rung of the ink ramp | `src/styles/global.css:148` | Typography (shared shell) |
| L13 | `which` is used as the install-verification step but is never introduced and may not exist on a fresh Termux | `src/content/docs/bridge/api-setup.mdx:76` | Android Bridge module |
| L14 | The `termux-location` sample output is presented as complete, unlike every other sample in the module | `src/content/docs/bridge/reading-the-device.mdx:320` | Android Bridge module |
| L15 | `termux-toast -b` / `-c` are documented without the value format, so the obvious guess fails | `src/content/docs/bridge/talking-back.mdx:208` | Android Bridge module |
| L16 | The summary table hands learners the short sensor name the lesson itself calls unreliable | `src/content/docs/bridge/reading-the-device.mdx:526` | Android Bridge module |
| L17 | "Seven lessons... you ran all of it on real hardware" conflicts with the dashboard's count and with lesson four | `src/content/docs/where-next.mdx:41-42` | Course frame |
| L18 | "About 3 hours" is optimistic for a course with real hardware waits | `src/content/docs/index.mdx:76` | Course frame |
| L19 | The practice terminal is framed as a course fixture but exists on exactly one page | `src/content/docs/index.mdx:108-121` | Course frame |
| L20 | "There is no server in Node's standard library" is inaccurate | `src/content/docs/serving/local-server.mdx:280-282` | Serving module (security) |
| L21 | "It is already installed" states as fact something Termux does not ship | `src/content/docs/serving/local-server.mdx:299` | Serving module (security) |
| L22 | global.css still titles itself "Termux for Beginners — design system" | `src/styles/global.css:2` | Design system / CSS parity |
| L23 | PracticeSection.astro is shipped but imported by zero lessons, leaving its CSS hook dead | `src/components/lesson/PracticeSection.astro (whole file); hook at src/styles/global.css:1628` | Design system / CSS parity |
| L24 | print.css ships `.tmx-no-print` with no consumer — the paper edition has no way in | `src/styles/print.css:115` | Design system / CSS parity |

## 6. Nit

Polish. None of these affect correctness.

| # | Finding | Location | Dimension |
| - | ------- | -------- | --------- |
| N1 | "With `90` it will almost certainly fire" ignores the `DISCHARGING` half of the script's own condition | `src/content/docs/automation/shell-scripts.mdx:520-528` | Automation module |
| N2 | The JSON-LD course description and the homepage meta description are two different sentences | `astro.config.mjs:20` | A11y / perf / SEO / build |
| N3 | The type scale's documented "1.25 / major third" claim holds only for its top four rungs | `src/styles/global.css:80` | Typography (shared shell) |
| N4 | "You have just worked through seven commands" — nine are taught | `src/content/docs/bridge/reading-the-device.mdx:464` | Android Bridge module |
| N5 | "Every JSON key here is `full_of_underscores`" — most of them aren't | `src/content/docs/bridge/reading-the-device.mdx:43` | Android Bridge module |
| N6 | `--image-path ~/shot.png` doesn't match the `~/shot.jpg` the previous lesson created | `src/content/docs/bridge/talking-back.mdx:180` | Android Bridge module |
| N7 | Keyboard-key markup is inconsistent across the three lessons and with the beginner course | `src/content/docs/bridge/api-setup.mdx:150` | Android Bridge module |
| N8 | Course 3 panel is labelled "Next" where the beginner labels the same non-existent course "Later" | `src/content/docs/where-next.mdx:165` | Course frame |
| N9 | The shutdown sequence requires a package install mid-shutdown | `src/content/docs/serving/tunnels.mdx:283-287` | Serving module (security) |
| N10 | Mixed line endings across component files (CRLF vs LF) where the reference is uniformly LF | `src/components/ (6 of 12 files)` | Design system / CSS parity |

## 7. Merged, dropped, and re-scoped

The eight specialists returned **82 raw findings**. This report carries **68 in scope**
plus **7 out of scope**, after 7 entries were merged as duplicates. Nothing was discarded
on judgement alone — every change is recorded here.

### Two auditors audited the wrong repository

This is the most important caveat in this report, and it is a **workflow defect, not an
auditor defect**.

Three of the nine agents in this run — including the consolidator — received the literal
string `[object]` instead of a task brief. The orchestrator failed to serialise the prompt.
The two affected specialists both noticed, said so explicitly in their returns, and
inferred a remit rather than stalling:

- One inferred **typography** from the project memory, which names a full typography audit
  as the next major task.
- One inferred **tutorial content accuracy** from the shape of the output schema.

Both then audited `termux-tutorial-for-beginners` — the repo named in the memory and the
current working directory — rather than the intermediate course that the other six agents
were pointed at. The tell is unambiguous: `foundations/files-and-folders.mdx` exists only
in the beginner tree, and the two auditors cite `--tmx-screen-ink` at lines 1655-1665
(beginner) where the parity auditor cites 1662-1672 (intermediate).

The two sets were then handled differently, because they are not equivalent:

- **Typography (6 findings, retained in scope).** The two stylesheets are near-identical
  clones — 2648 vs 2655 lines. Every typography finding was re-verified against the
  intermediate tree and **all of them reproduce there**: `68ch` at `:2318`,
  `font-weight: 800` at `:638`, `background-clip: text` at `:635-636`. They are reported
  above with intermediate line numbers, and flagged where they also affect the shipped
  beginner course.
- **Content (7 findings, moved to Appendix A).** These cite beginner-only lesson files.
  They are real and verified — the `mv -r` recap error at `files-and-folders.mdx:269` was
  confirmed by reading the file — but they say nothing about the repo under audit.

**The intermediate course therefore has no dedicated content-accuracy pass over its
lesson prose beyond the three per-module specialists.** If a general content-integrity
sweep was intended, it has not happened, and one agent should be re-dispatched.

### Merged duplicates

Seven entries collapsed into three findings. Independent rediscovery is corroboration, so
severity was taken as the higher of the pair in each case except where noted.

| Merged into | Reported by | Resolution |
| ----------- | ----------- | ---------- |
| C2 — social card | Design parity (Critical) + A11y/SEO (High) | Kept Critical |
| C3 — course-complete copy | Course frame (Critical) + Design parity (High, ×2 files) | Kept Critical; both files listed |
| H2 — repo URLs | A11y/SEO (High + Medium) + Course frame (Medium) | Kept High; one root cause, two lines |
| H3 — `--tmx-screen-ink` | Typography (Critical) + Design parity (High) | **Downgraded to High** |
| L — dead Starlight card CSS | A11y/SEO (Low) + Design parity (Low) | Kept Low |

### Downgraded

- **`--tmx-screen-ink` — Critical to High.** The contrast arithmetic is right and the
  token really is undefined in both repos, but the blast radius is one control: the touch
  key row inside the terminal island. It does not break a page, block a lesson, or mislead
  a learner about Termux. It is the worst of the visual defects and still not on the same
  tier as a course that congratulates you for the wrong curriculum.
- **Dead Starlight card CSS — held at Low, not raised.** Roughly 60 lines of `.card`,
  `.card-grid` and `.tmx-card--link` rules match nothing in `src/content/` (verified: zero
  `<Card>`, `<CardGrid>` or `<LinkCard>` usages). Both auditors were right that it is dead.
  It is deliberately not raised further: the beginner repo's own final sweep considered
  deleting it and chose not to, on the grounds that `.card` is Starlight's public component
  API and deleting it silently unstyles any card a future lesson introduces. That reasoning
  transfers. Worth a decision, not a fix.

### Considered and not raised

- **The unlayered stylesheet.** Correct by design — Starlight ships `@layer starlight.*`
  and unlayered rules win. Excluded by the brief and confirmed unchanged here.
- **The boot splash.** A deliberate feature with documented guard rails, not a defect.
- **`sessionStorage` splash key.** `tmx:splash-seen` is identical in both repos and both
  sites deploy to `https://dnoice.github.io`, so they share one origin and one
  `sessionStorage`. Viewing the beginner course therefore suppresses the intermediate
  course's splash in the same browser session. This is retained as a **Medium** rather than
  dropped as cosmetic, because it is a genuine cross-course interaction the single-repo
  auditors could not have seen individually.

### Not verified

Two things in this report cannot be settled from inside the tree and are explicitly left
open rather than guessed:

- **H1, the repository name.** Requires checking the actual GitHub remote. The report
  states the contradiction and refuses to pick a side.
- **Rendered contrast values.** The contrast ratios in H3 and M4 are computed from the
  token values in the stylesheet, not sampled from a rendered page. No browser pass was
  run in this consolidation.

## Appendix A: findings against the beginner course

These are real, verified defects, but they sit in `termux-tutorial-for-beginners` —
not the repo under audit. They are recorded so the work is not lost. Section 7 explains
why they were raised against the wrong tree.

| Severity | Finding | Location |
| -------- | ------- | -------- |
| High | Recap teaches `mv -r`, which is not a real flag — and the simulator accepts it, so the error only surfaces on the learner's phone | `src/content/docs/foundations/files-and-folders.mdx:269` |
| Medium | The capstone "warm up" terminal is seeded with a hint that cannot succeed from a fresh session | `src/content/docs/where-next.mdx:114` |
| Medium | Keyboard lesson tells learners to `cat` a file back and "see your line" in a terminal where that file can never exist | `src/content/docs/foundations/extra-keys.mdx:140` |
| Low | Section heading says "two" over a table of three commands | `src/content/docs/foundations/packages.mdx:34` |
| Low | The `mkdir -p` teaching point is a no-op in the practice terminal because `~/.termux` is pre-seeded | `src/content/docs/foundations/extra-keys.mdx:82` |
| Nit | Cheatsheet attributes `termux-change-repo` to two lessons that never mention it | `src/content/docs/reference/cheatsheet.md:139` |
| Nit | Storage lesson's main `tar` practice terminal is the only one on the site not wrapped in `PracticeSection` | `src/content/docs/foundations/storage.mdx:194` |
