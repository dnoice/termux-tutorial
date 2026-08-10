# Audit — Lesson sequence, logical flow and pedagogy

**Repository:** `termux-tutorial-for-beginners`
**Date:** 2026-08-06
**Scope:** instructional design only — lesson order, the prev/next journey,
step granularity, concept dependency, factual claims, and whether the site
delivers what it promises. Code, visual, accessibility and performance are
covered by `../beginner/2026-08-06-comprehensive.md` and
`../beginner/2026-08-06-visual.md`; findings marked `✅ CLOSED`
there, and everything listed as fixed in `../../archive/2026-08-06-changes-in-flight.md`,
are excluded here.

**Method:** every file in `src/content/docs/` read in full; the prev/next chain
walked against the *built* HTML in `dist/` rather than inferred from config;
every lesson command checked against the `exec()` switch in
`src/components/terminal/shell.ts`; sequencing decisions compared against the
author's earlier hand-built version in `global-resouces/original-idea/`.

## Executive summary

The curriculum itself is sound — the topic order inside Foundations is right,
the writing is unusually good for this genre, and the recently added fish
lesson was the correct call. What is broken is the *rail* the learner is put
on. Starlight builds prev/next from the `sidebar` array in `astro.config.mjs`,
and that array is a navigation menu, not a syllabus: it has a dashboard as step
two and two reference pages as steps eleven and twelve, so the course opens on
a 0%-by-definition progress screen and ends on a troubleshooting page. The
`LESSONS` array in `src/lib/progress.ts` already models the curriculum
correctly as eight lessons — the two data structures disagree about what the
course *is*, and only one of them drives the button the learner actually
presses. Inserting the fish lesson at position 3 left three stale forward
references in `installing.mdx` and created a lesson that instructs `ls` and
`pwd` one page before they are taught; moving it after "Your First Session"
fixes all four at once. Several steps are single bullets hiding a device-side
decision — the F-Droid install prompt, the dpkg config-file prompt (which the
author's own 2025 version *did* warn about and the rewrite dropped), and the
Termux restart, which is documented as a recent-apps swipe when the supported
method is the notification's Exit action. On promises: the storage lesson says
"practice the whole flow here" and the flow's final command, `tar`, is not
implemented in the simulator; the fish lesson's headline payoff — the prompt
changing from `$` to `❯` — is the one thing its own terminal cannot show; and
the cheatsheet's claim to hold "every command from the course" is false in both
directions. Finally, the course has no ending: the last lesson hands the reader
a reference table, and the only mention of the sibling Intermediate course in
the entire content tree is an unlinked sentence in Troubleshooting.

**Findings:** 28 total — 1 Critical, 10 High, 16 Medium, 1 Low.

---

## ✅ Status update — 2026-08-06, same day

The **Critical** finding and the fish-placement cluster are **fixed and
verified**. What changed:

- **Utility pages removed from the learning rail.** `Your Progress`,
  `Command Cheatsheet` and `Troubleshooting` moved into a new
  **"Reference & Tools"** sidebar group and opted out of pagination with
  `prev: false` / `next: false`.
- **`index.mdx` gained an explicit `next`** pointing at Why Termux.
  *Gotcha found while doing it:* Starlight does **not** base-prefix frontmatter
  links, so `/start/why-termux/` built as a bare path that would 404 on GitHub
  Pages. It is now relative (`start/why-termux/`), matching the hero action.
- **Fish moved to position 5**, after Your First Session — exactly as
  recommended. This retired all three stale forward references at once:
  `installing.mdx`'s "two lessons' time" is now "right after your first
  session"; `first-session.mdx` now *forward*-links to fish as the next lesson
  instead of back-referencing it; `friendly-shell.mdx` now points on to
  Navigating the Filesystem.
- **`LESSONS` in `progress.ts` reordered** to mirror the sidebar.
- **`extra-keys.mdx` terminates the chain** (`next: false`) so the course no
  longer dumps the learner on the progress dashboard. This is a placeholder —
  it should point at the **Where to Next** lesson once that is written.

Verified by walking the built `rel="next"` chain in `dist/`:

```text
 1. Termux for Beginners            →  Why Termux (not the Play Store)
 2. Why Termux (not the Play Store) →  Installing Termux Safely
 3. Installing Termux Safely        →  Your First Session
 4. Your First Session              →  Upgrade Your Shell to Fish
 5. Upgrade Your Shell to Fish      →  Navigating the Filesystem
 6. Navigating the Filesystem       →  Bridging Android Storage
 7. Bridging Android Storage        →  Package Management with pkg
 8. Package Management with pkg     →  Optimizing the Keyboard
 9. Optimizing the Keyboard         →  END
```

Utility pages confirmed to carry no `rel="next"`/`rel="prev"` at all.

**Still open from this report:** the two new lessons (**Files & Folders**,
**Where to Next**), the unimplemented `tar` in the storage lesson's "practice
the whole flow", the dpkg config-file prompt, the Termux-restart method, and
the remaining Medium findings below.

---

## The journey as it actually reads

Walked literally, from `dist/`. Each row is the "Next" button the learner sees
at the foot of the page.

| # | Page | Next says | Problem |
| :-- | :--- | :-------- | :------ |
| 1 | Welcome (splash) | **Your Progress** | The page's own two CTAs point at *Why Termux*. The footer disagrees with the hero. |
| 2 | Your Progress | Why Termux | A dashboard reading "0 of 8 lessons complete" before anything has been attempted. |
| 3 | Why Termux | Installing Termux Safely | Correct, and the in-page line matches. |
| 4 | Installing Termux Safely | **Upgrade Your Shell to Fish** | The page says fish is "two lessons' time" away (it is next) and says you will practise `pkg update` "in Your First Session" (which is two away). No closing "Next" line at all. |
| 5 | Upgrade Your Shell to Fish | Your First Session | Matches the in-page line — but the lesson tells you to type "a command you already know, like `ls` or `pwd`", which the *next* lesson introduces. |
| 6 | Your First Session | Navigating the Filesystem | Correct. |
| 7 | Navigating the Filesystem | Bridging Android Storage | Correct. This is where `~` is finally defined — its fourth appearance. |
| 8 | Bridging Android Storage | Package Management with pkg | Correct, though `pkg` has been in use since page 4. |
| 9 | Package Management with pkg | Optimizing the Keyboard | Correct. |
| 10 | Optimizing the Keyboard | **Command Cheatsheet** | The last hands-on moment was two pages ago; this lesson has no terminal. |
| 11 | Command Cheatsheet | **Troubleshooting** | A reference page presented as the penultimate lesson. |
| 12 | Troubleshooting | *(nothing)* | The course ends on a list of things that can go wrong. |

Four of the twelve steps in that chain are not lessons. The learner who trusts
the Next button spends step 2 on a dashboard and steps 11–12 in the appendix,
and can simultaneously be told "🎉 Course complete!" on the progress page
(fires at 8/8) while the Next button still has two pages queued.

## Findings

### Sequence and ordering

#### ✅ CLOSED — The dashboard is step two of the learning path

> **FIXED & VERIFIED.** Utility pages moved to a 'Reference & Tools' group and
> opted out with `prev: false` / `next: false`; `index.mdx` gained an explicit
> (relative) `next`. Verified by walking the built `rel=next` chain: step 2 is
> **Why Termux**, not the dashboard.

**Severity:** Critical
**Location:** `astro.config.mjs:113`; `src/content/docs/progress.mdx:5`;
confirmed in `dist/index.html`

**Evidence:** the sidebar array places the dashboard second inside "Start
Here":

```js
{ label: 'Your Progress', slug: 'progress', badge: { text: 'Local', variant: 'note' } },
```

The built landing page's only pagination link is
`href="/termux-tutorial-for-beginners/progress/"` labelled "Next · Your
Progress". Meanwhile the same page offers `link: start/why-termux/`
(`index.mdx:13`) and `href={`${base}/start/why-termux/`}` (`index.mdx:91`).
`progress.mdx:5` reinforces it with `order: 0` — lesson zero of Start Here.

**Why it matters:** the landing page presents three forward affordances and
they point at two different destinations. The most authoritative-looking one —
the standard docs Next button, at the very bottom, where a reader lands after
finishing the page — sends them to a progress ring that reads 0% because the
course has not started. It also silently demotes "Why Termux" from lesson one.

**Recommendation:** move "Your Progress" out of "Start Here" into its own
group at the foot of the sidebar (the `ProfileBadge` injected by
`overrides/Sidebar.astro` already gives it presence on every page). Then set
frontmatter `prev: false` / `next: false` on `progress.mdx`, and on `index.mdx`
set an explicit `next: { link: '/start/why-termux/', label: 'Why Termux (not
the Play Store)' }`. Starlight honours both.

#### ✅ CLOSED — The Reference module sits inside the linear chain, so the course ends on Troubleshooting

> **FIXED & VERIFIED.** The chain now terminates on the new **Where to Next**
> lesson. Verified by the built-chain walk: 11 steps, ending on Where to Next;
> Cheatsheet and Troubleshooting carry no `rel=next`/`rel=prev` at all.

**Severity:** High
**Location:** `astro.config.mjs:137-143`; `src/lib/progress.ts:32-41`

**Evidence:** the chain runs `foundations/extra-keys` → `reference/cheatsheet`
→ `reference/troubleshooting` → end. `LESSONS` in `progress.ts` contains
exactly eight entries and excludes `index`, `progress`, `cheatsheet` and
`troubleshooting` — the progress model already knows these are not lessons.

**Why it matters:** two data structures disagree about what the course is, and
the one that is wrong drives the button. The most motivated person on the site
— someone who finished — is walked into an appendix and then hits a wall.
`ProgressDashboard.tsx:61` can be showing "🎉 Course complete!" while the Next
button still has two pages to go.

**Recommendation:** `prev: false` / `next: false` on both reference pages, and
make the terminus a real lesson (see "The course has no ending").

#### ✅ CLOSED — Three orderings exist and one of them is inert

> **FIXED.** `scripts/check-curriculum.mjs` now runs as the first step of
> `npm run build` and fails it when the `sidebar` array, `LESSONS` and the content
> files disagree — including that the inert `sidebar.order` values still ascend.
> Build output: 'Curriculum consistent — 10 lessons, sidebar and LESSONS agree.'

**Severity:** Medium
**Location:** `astro.config.mjs:108-144`; `src/lib/progress.ts:32-41`; twelve
`sidebar.order` values across `src/content/docs`

**Evidence:** every sidebar group uses an explicit `items` array, so the
`sidebar.order` frontmatter in all twelve content files is never read. The
values happen to agree with the array today, which is what makes it dangerous.
`progress.mdx` also declares its badge twice — once in frontmatter
(`progress.mdx:6-8`) and once in `astro.config.mjs:113`.

**Why it matters:** the next person who tries to fix the ordering problem above
will edit `order:` in frontmatter, rebuild, and see nothing change. There is no
build error and no test.

**Recommendation:** delete `sidebar.order` from all twelve files (or switch the
groups to `autogenerate` and delete the arrays — pick one), and remove the
duplicated badge. The prior audit's "four hand-maintained sources of truth"
finding covers the validation side.

#### ✅ CLOSED — The fish lesson sits one position too early

> **FIXED & VERIFIED.** Moved to position 5, after Your First Session, which
> retired all three stale forward references at once. Verified by the chain walk:
> Your First Session -> Upgrade Your Shell to Fish -> Navigating the Filesystem.

**Severity:** High
**Location:** `astro.config.mjs:116-121`; `src/content/docs/start/friendly-shell.mdx:65`;
`src/content/docs/start/installing.mdx:59,89`

**Evidence:** three separate symptoms, one cause. `friendly-shell.mdx:65-66`:

> Now type a command you already know, like `ls` or `pwd`, and watch it colour
> itself as you go.

`ls` and `pwd` are first instructed at `first-session.mdx:30-33` — the *next*
lesson — and defined at `filesystem.mdx:37-39`. At this point the learner has
typed exactly three things: `pkg update && pkg upgrade`, `pkg install fish`,
and `chsh`. Meanwhile `installing.mdx:59` says fish is installed "in [two
lessons' time]" when it is the very next lesson, and `installing.mdx:89` says
"You'll practice this exact command — live — in [Your First Session]" when
First Session is two lessons away. All three are artefacts of inserting the new
lesson at position 3.

**Why it matters:** the lesson's one hands-on instruction is unfollowable, and
the previous lesson misdirects the reader twice about where they are going.

**Recommendation:** move "Upgrade Your Shell to Fish" to position 5, after
"Your First Session". That single move makes `installing.mdx:89` point at the
actual next page, makes "two lessons' time" literally correct, and makes "a
command you already know" true. The forward reference already in
`first-session.mdx:21-23` ("If your own Termux doesn't do this yet, run through
Upgrade Your Shell to Fish") reads perfectly as a *next-lesson* teaser.

#### ✅ CLOSED — `pkg` is required from lesson four and explained in lesson nine

> Both halves of the recommendation applied. `installing.mdx` gained the forward-reference
> clause the report costed as the cheapest fix — a tip reading "`pkg` is Termux's app
> store … you get the full tour in Package Management with pkg — for now, `update` then
> `upgrade` is the whole ritual" — so the early use is acknowledged rather than
> unremarked. `packages.mdx` was then reframed from recap to payoff: it now opens "You've
> been using `pkg` since the install lesson … this is the full picture of the command you
> already type more than any other", and leads with **The three you haven't met yet**
> (`search`, `list-installed`, `uninstall`) before the two the reader has run four times.
> `pkg uninstall` is new to the lesson and closes a cheatsheet row that no lesson
> previously covered.

**Severity:** Medium
**Location:** `start/installing.mdx:85`; `start/friendly-shell.mdx:47`;
`start/first-session.mdx:32,37`; `foundations/packages.mdx:12-16`

**Evidence:** `pkg update && pkg upgrade` is the closing step of the install
lesson, `pkg install fish` is the whole of the fish lesson, and `pkg update` /
`pkg install git` are steps 2 and 4 of the first session — all before
`packages.mdx` says what `pkg` is ("a friendly wrapper over Debian's `apt`").

**Why it matters:** this is defensible progressive disclosure, but nothing in
the early lessons acknowledges it, so `packages.mdx` reads as a recap of things
already done rather than a payoff. Its five-row command table contains two
commands the reader has run four times already.

**Recommendation:** cheapest fix is one clause at `installing.mdx:84`: "`pkg`
is Termux's app store — you'll get the full tour in Foundations." Then reframe
`packages.mdx`'s opening as "the full picture of the command you've been using
since lesson two", and lead with `search` / `list-installed` / `uninstall`,
which are genuinely new.

### Steps needing breakdown

#### ✅ CLOSED — Step 2 of the install lesson hides a second Android permission grant

> Expanded from 3 bullets to a 5-step `<Steps>` block, quoting the dialog: (1) wait for
> "Updating repositories" — explicitly "several minutes", not "a minute", with the
> pull-to-refresh recovery for an empty search; (2) search; (3) tap Install; (4) Android's
> "Allow F-Droid to install unknown apps?" → allow; (5) confirm the package-installer
> sheet, which recurs on every update. Step 4 directly names and defuses the contradiction
> the report identified — the reader was told one screen earlier to revoke that exact
> permission from their browser — with one sentence: "A browser with that permission is an
> attack surface; an app store with it is an app store."

**Severity:** High
**Location:** `src/content/docs/start/installing.mdx:41-46`

**Evidence:**

> 1. Open F-Droid and let it refresh its package list (first launch takes a minute).
> 2. Search for **Termux**.
> 3. Open the **Termux** entry (by *Fredrik Fornwall / Termux*) and tap **Install**.

**Why it matters:** on an unrooted device without the F-Droid Privileged
Extension, F-Droid cannot install anything until *it* is granted "install
unknown apps", and Android shows a package-installer confirmation sheet for
every install and every update afterwards. The learner has, one screen earlier,
been correctly taught to *revoke* exactly that permission from their browser
(`installing.mdx:23-32`) — so the reader who absorbed that lesson is primed to
refuse. Separately, F-Droid's first index sync routinely takes several minutes
and can fail outright on a weak connection; "takes a minute" sets the wrong
expectation and a learner whose search returns nothing will assume they did
something wrong.

**Recommendation:** expand to five sub-steps, quoting the dialogs: (1) open
F-Droid and wait for "Updating repositories" to finish — this can take a few
minutes on first run, and if search returns nothing, pull down to refresh and
wait; (2) search Termux; (3) tap Install; (4) Android asks "Allow F-Droid to
install unknown apps?" — allow this one, it is how F-Droid works, and unlike
the browser you *do* want to keep it; (5) confirm the installer sheet.

#### ✅ CLOSED — "Swipe it away from recent apps" is not how Termux is stopped

> Replaced the recents swipe with the notification's Exit action, and added the
> verification half the step was missing. Step 3 now reads: pull down the shade, tap Exit
> on the Termux notification, reopen from the launcher — with a caution explaining *why*
> the swipe fails (Termux runs a foreground service precisely so Android won't kill it on
> swipe, so the old bash session survives and the learner concludes `chsh` failed). New
> step 4 states the success condition (`~ ❯`), the failure symptom (`~ $`), and the remedy
> (a session was still open — repeat). Recap updated to match, and Troubleshooting gained
> a matching "My prompt still shows `$` after `chsh -s fish`" entry, since that page is
> where the stuck learner actually lands.

**Severity:** High
**Location:** `src/content/docs/start/friendly-shell.mdx:60-61`

**Evidence:**

> **Fully restart Termux.** Close it completely — swipe it away from Android's
> recent-apps screen — then reopen. A normal exit isn't always enough.

**Why it matters:** Termux runs a foreground service with a persistent
notification precisely so that Android does *not* kill it when the task is
swiped from recents. Following this literally can leave the old bash session
running, the learner reopens into the same `$` prompt, and concludes `chsh`
failed — the exact symptom the lesson is trying to pre-empt. The supported
method is the **Exit** action on the Termux notification (or `exit` in every
open session).

**Recommendation:** rewrite as: "Pull down the notification shade, find the
Termux notification, and tap **Exit**. Then open Termux again from your
launcher. Your prompt should now end in `❯` instead of `$`. Still showing `$`?
A session was still running — repeat." The verification sentence is the
important half; the step currently ends without telling the learner how to know
it worked.

#### ✅ CLOSED — The first update is one bullet containing five actions and three possible prompts

> One bullet became a 4-step `<Steps>` block plus a data warning. The `&&` is now
> explained where it is first used ("and if that worked, then do this" — it had been used
> site-wide and defined nowhere). The two prompts are split explicitly: `y` for apt's "Do
> you want to continue? [Y/n]", and **Enter** for the dpkg conffile prompt — which is now
> quoted verbatim as a code block showing the `Y/I/N/O/D/Z` options and `[default=N]`,
> with the reason spelled out (`y` overwrites the user's own config). This restores the
> warning the author's own 2025 version carried at original.txt:46 and the rewrite
> dropped. Added the missing Wi-Fi/"tens of megabytes" caution, since this is the first
> thing that downloads real data. Also mirrored as a standalone Troubleshooting entry.

**Severity:** High
**Location:** `src/content/docs/start/installing.mdx:79-89`

**Evidence:**

> The very first thing to do in any fresh Termux install is update the package
> lists. Open Termux and run:
>
> `pkg update && pkg upgrade`
>
> Press **Enter**, and when prompted to continue, type **y**.

**Why it matters:** that single instruction contains: open Termux (already
done in Step 2), run a compound command whose `&&` is never explained anywhere
on the site, wait — this can run for several minutes and megabytes on a fresh
install — answer apt's `Do you want to continue? [Y/n]`, possibly answer a
dpkg **configuration-file** prompt (`Y/I/N/O/D/Z`, where `y` overwrites the
user's own config), and on some builds answer a repository-selection prompt.
The learner is told to expect exactly one of those, and is told to answer `y`,
which is the *wrong* answer to the conffile prompt. The author's own 2025
version got this right — `original-idea/original.txt:46`: "If asked about
config files, sticking with the default (often pressing Enter or 'N') is
usually safe for now." The rewrite dropped the warning.

**Recommendation:** split into numbered sub-steps with expected output, and
split the prompts explicitly: `y` for "Do you want to continue?"; **Enter** (keep
the current version) for anything mentioning a *configuration file*. Add the
data warning — this is the first thing that downloads real megabytes. Extends
the "Smaller content items" note in the existing code audit.

#### ✅ CLOSED — `termux-setup-storage` has no failure branch

> The single device-side decision the reader can get wrong now has its own 4-step block
> and its own recovery path. Added the dialog wording for both Android versions, since it
> differs and the report flagged that: Android 11–12 shows one "photos, media and files"
> prompt; Android 13+ splits into photos/videos, music/audio and files, and all must be
> allowed. Added what success looks like (`ls ~/storage` returning six names) so the
> learner can tell. The recovery caution names the trap the report identified — a second
> `termux-setup-storage` reports "already configured" and does nothing, so the command
> looks fine when it isn't — and gives the manual route: Settings → Apps → Termux →
> Permissions → Files and media → Allow, then re-run. Troubleshooting's storage entry now
> carries the same escape hatch.

**Severity:** Medium
**Location:** `src/content/docs/foundations/storage.mdx:22-24`;
`src/components/terminal/shell.ts:335`

**Evidence:**

> When you run this on a real device, Android pops up a permission dialog asking
> whether to let Termux access your files. Approve it, and Termux creates a
> `~/storage` folder full of shortcuts (symlinks) into your shared storage.

The simulator makes the gap worse by auto-approving:
`` `${YELLOW}[Android] Allow Termux to access photos, media, and files?  ${GREEN}ALLOW${RESET}` ``.

**Why it matters:** this is the only point in the course that requires a
device-side decision the reader can get wrong, and it is the one moment the
sandbox glosses over. Tapping Deny — or dismissing the Android 13+ split media
dialog — leaves a `~/storage` directory whose links do not resolve, after which
every remaining instruction in the lesson fails with errors that do not name
the cause. The learner has no way back because the command reports "already
configured" on a second run (`shell.ts:316-319` models exactly that).

**Recommendation:** add a sub-step: "Tapped Deny, or nothing happened? Go to
**Settings → Apps → Termux → Permissions → Files and media → Allow**, then run
`termux-setup-storage` again." Describe the dialog wording for Android 11+ and
13+, since it differs. Say what `ls ~/storage` looks like when it worked.

#### ✅ CLOSED — The extra-keys config is hand-typed on a phone with no verification step

> Order inverted as recommended: the one-row layout (`ESC CTRL ALT TAB` + arrows) is now
> the taught path, with the two-row layout demoted to "The upgrade" — previously the
> beginner met the hard string first and the simple one thirty lines later as "A minimal
> alternative". Added the missing verification step, `cat ~/.termux/termux.properties`,
> *before* `termux-reload-settings`, and stated the success condition explicitly ("a row
> of grey keys appears above your keyboard within about a second"). The load-bearing
> trailing `\` now has its own caution: one space after it and Termux silently keeps the
> old row, which is the failure mode with no error message. Also added a nano-free path
> using `echo … >` / `cat >`, which the new Files & Folders lesson makes available.

**Severity:** Medium
**Location:** `src/content/docs/foundations/extra-keys.mdx:53-58,88-90`

**Evidence:**

> Add a line like this (in `nano`, just type it out):
>
> ```properties
> extra-keys = [['ESC','/','-','HOME','UP','END','PGUP'], \
>               ['TAB','CTRL','ALT','LEFT','DOWN','RIGHT','PGDN']]
> ```

**Why it matters:** every character class in that string — `[`, `'`, `\`, `,` —
is behind a symbol layer on an Android soft keyboard, at a moment when the
learner does not yet have an extra-keys row (that being the point of the
lesson). The trailing `\` is load-bearing and silently breaks if it picks up a
trailing space. There is no verification step and no statement of what success
looks like. The single-row version, which is what a beginner should type
first, is offered thirty lines later as "A minimal alternative".

**Recommendation:** invert the order — lead with the one-row layout, present
the two-row as the upgrade. Add `cat ~/.termux/termux.properties` as an
explicit verify step before `termux-reload-settings`, warn that a space after
the `\` breaks it, and state the expected result ("a row of grey keys appears
above your keyboard within a second"). The syntax itself is correct.

### Logical flow

#### ✅ CLOSED — In-page "Next" prose and pagination disagree in three places

> The two content-side failures are closed. `installing.mdx` was the only lesson with no
> closing Next section at all — it ended on a Troubleshooting bullet list — and now
> carries a Recap plus "Next: … Your First Session", matching every other lesson's shape
> and the page its Next button actually goes to. Its bare "Troubleshooting" heading (which
> no other lesson has) was renamed "If something went wrong" and gained the F-Droid
> empty-search case. The landing page's third affordance was already fixed by the earlier
> pass; verified index.mdx's hero action, its `next` frontmatter and its footer CTA now
> all resolve to start/why-termux/.

**Severity:** High
**Location:** `index.mdx:13,91` vs `dist/index.html`;
`start/installing.mdx:59,89`

**Evidence:** verified against built HTML for all twelve pages. Six lessons
are correct — `friendly-shell.mdx:100`, `first-session.mdx:69-70`,
`filesystem.mdx:79-80`, `storage.mdx:138-139`, `packages.mdx:102-103`,
`extra-keys.mdx:98-100` and `why-termux.mdx:66-67` all name the page their Next
button actually goes to. The three failures are the landing page (CTAs →
`why-termux`, Next → `progress`) and both forward references in
`installing.mdx`. `installing.mdx` is also the only lesson with no closing
"Next" section at all — it ends on a Troubleshooting bullet list
(`installing.mdx:91-97`).

**Why it matters:** these are the two pages a first-time visitor reads before
deciding whether the site is trustworthy.

**Recommendation:** fix the landing page with explicit `next` frontmatter (see
Critical finding). In `installing.mdx`, after moving the fish lesson, change
"two lessons' time" to "the lesson after next" and add a closing Recap + Next
section matching every other lesson's shape.

#### ✅ CLOSED — `~` is shown four times before it is defined

> Defined at first sight rather than on page six. `installing.mdx:54` explained only half
> the prompt; it now reads "The `~` says you're in your home folder — the one place on the
> phone that belongs to Termux. The `$` says the shell is waiting for a command." Cleared
> the whole class the report listed alongside it: `$PREFIX` (filesystem.mdx now has a
> "That `$` isn't a prompt" tip distinguishing a variable from a prompt character, with
> `echo $PREFIX` to run), `tar czf` (broken down flag by flag in the new Files & Folders
> lesson), `chmod +x` (cheatsheet + troubleshooting now say what it does and why it
> silently fails on shared storage), and `mkdir` (taught before storage.mdx uses it).
> Added `echo $PREFIX` to filesystem.mdx's terminal hint so the variable is run, not just
> tabulated.

**Severity:** Medium
**Location:** `start/installing.mdx:50-54`; `start/friendly-shell.mdx:85-86`;
`start/first-session.mdx:30`; defined at `foundations/filesystem.mdx:18-25`

**Evidence:** `installing.mdx` prints the prompt and explains exactly half of
it:

> ```text
> ~ $
> ```
>
> That `$` is the shell waiting for a command. You made it. 🎉

The `~` is then tabulated twice more in `friendly-shell.mdx:85-86` and used as
a working directory in `first-session.mdx` before `filesystem.mdx` — the sixth
page — finally says what it means. The author's earlier version defined it in
the first sentence the reader ever sees:
`original-idea/original.txt:43` — "The `~` means you're 'home'."

**Why it matters:** the single most common symbol in the entire course is the
one left unexplained longest, and the fix is one clause.

**Recommendation:** `installing.mdx:54` becomes "`~` says you're in your home
folder; `$` says the shell is waiting for a command." Same class of problem,
same fix, for: `chmod +x` (`storage.mdx:77`), `git clone` / `python -m venv` /
`npm install` (`storage.mdx:78-80`), `$PREFIX` (`filesystem.mdx:30` — a `$`
that is not a prompt, unremarked), and `tar czf` (`storage.mdx:113`). All are
dropped on a reader who has installed exactly one package.

#### ✅ CLOSED — Lesson shape holds everywhere except the two ends

> Both broken ends repaired. `installing.mdx` gained the recap and the closing Next it
> lacked, and its anomalous "Troubleshooting" section was renamed so it reads as a lesson
> rather than a reference page. `extra-keys.mdx` — the module terminus whose last hands-on
> moment was two lessons earlier — now has a `<TermuxTerminal>` with hint "pkg install
> nano → mkdir -p ~/.termux → cat ~/.termux/termux.properties → termux-reload-settings",
> exactly the one-line fix the report costed. Three of the four run for real; `nano` hits
> the simulator's NOT_SIMULATED path and says so honestly rather than faking success,
> which the lesson now sets up in prose so it reads as intentional. The course no longer
> goes out on prose.

**Severity:** Medium
**Location:** `start/installing.mdx`; `foundations/extra-keys.mdx`

**Evidence:** the healthy shape — hook → concept → do it in a terminal →
recap → next — is followed by `friendly-shell`, `first-session`, `filesystem`,
`storage` and `packages`. `why-termux` has no do-it and no recap, which is
defensible for a "why" lesson. The two that break it are `installing.mdx` (no
recap, no next, plus a Troubleshooting section no other lesson has) and
`extra-keys.mdx`, which has a recap but no terminal and no practice at all —
despite being the lesson that asks for the most typing.

**Why it matters:** `extra-keys` is the module terminus, so the course's last
hands-on moment is `pkg search python`, two lessons earlier. It goes out on
prose.

**Recommendation:** the simulator already runs three of the four commands in
that lesson — `pkg install nano` (in `PKG_DB`), `mkdir -p ~/.termux` (flags are
filtered) and `termux-reload-settings` (`shell.ts:485-488`). Only `nano` is
missing. Drop a `<TermuxTerminal>` in with
`hint="Try: pkg install nano → mkdir -p ~/.termux → termux-reload-settings"`
and it becomes practicable at the cost of one line of MDX.

#### ✅ CLOSED — "Sandbox" names two different things, most confusingly on the page that has both

> Vocabulary split completed on the content side: "sandbox" is now reserved for the WebVM
> everywhere, and the scripted one is "the practice terminal" — renamed at all four sites
> the report listed (first-session.mdx's tip heading, storage.mdx:29, packages.mdx:34,
> installing.mdx:56) plus index.mdx's panel title, its terminal hint, and its capability
> card. `packages.mdx` is the page that carried both, so it got the most work: the WebVM
> section now opens by contrasting them ("the practice terminal above is scripted … what's
> below is not"), and the no-internet warning explicitly scopes itself — "that limit
> belongs to this live sandbox only … on a real device `pkg install` works exactly as this
> lesson describes" — so it can no longer be misread as meaning the practice terminal's
> `pkg install` is expected to fail. Also did the folder/directory half: `filesystem.mdx`
> now glosses both once, up front.

**Severity:** Medium
**Location:** `index.mdx:70-87`; `foundations/packages.mdx:34,82`;
`start/first-session.mdx:16`; `start/installing.mdx:56`;
`foundations/storage.mdx:29`; `reference/troubleshooting.md:103`

**Evidence:** `index.mdx` brands them separately and well — "The Simulator" and
"The Live Sandbox". Every other page then collapses the distinction:
`first-session.mdx:16` heads its tip "How the sandbox works" (the simulator);
`packages.mdx:34` says "In the sandbox below" (the simulator) forty-eight lines
above `packages.mdx:82` "About the live sandbox" (the WebVM);
`installing.mdx:56` says "the sandboxes on this site"; `storage.mdx:29` "Try it
in the sandbox below".

**Why it matters:** `packages.mdx` is the only page carrying both, and it uses
one word for both. The "**It has no internet connection**" warning attached to
the second one is exactly the sort of thing a reader will misapply to the first
— which would make them think `pkg install git` failing is expected.

**Recommendation:** reserve "sandbox" for the WebVM; call the scripted one "the
practice terminal" everywhere else. The vocabulary split is already half-done —
the LiveSandbox frame title now reads "live linux — real Debian, in your
browser". Same treatment for folder/directory: `storage.mdx` says "folder" six
times while `filesystem.mdx` teaches "directory"; pick one, gloss the other
once, in `filesystem.mdx`.

### Claim verification

Claims checked and found **correct**, for the record: the F-Droid/GitHub
signature-mismatch rule and the uninstall-everything remedy; all six
`~/storage` symlink targets; `external-1` pointing at
`Android/data/com.termux/files` on the card; shared storage having no Unix
permission bits and no symlinks; `pkg` as a wrapper over `apt`; `chsh -s fish`;
the `extra-keys = [[…], \ […]]` continuation syntax; `termux-reload-settings`
applying the key row without a restart; Vol-Down = Ctrl, Vol-Up = Alt,
Vol-Up+Q, Vol-Up+K; `termux-change-repo` as the mirror fix; the ~32
`max_phantom_processes` limit and its immunity to battery settings; and home
plus installed packages being destroyed on uninstall or clear-data. The
problems below are the exceptions.

#### ✅ CLOSED — "Every command works identically in both" is a true statement written to reassure past its own scope

> Bounded in both locations. `installing.mdx:60`'s unqualified "Same shell, different
> outfit — every command works in both" now scopes to "Every command *in this course*" and
> adds the `export FOO=bar` example plus the `bash` / `exit` escape hatch.
> `friendly-shell.mdx` keeps the reassurance and gains a whole "fish is not bash (and one
> day that will matter)" section: a four-row table of the exact things that break (`export
> VAR=value`, `VAR=x cmd`, `$(cmd)`, `~/.bashrc`) with the fish equivalent beside each,
> then the inoculation the report asked for — type `bash`, run the snippet, `exit`. Recap
> now carries the boundary too, so the highest-consequence claim on the site no longer
> ships unhedged.

**Severity:** High
**Location:** `src/content/docs/start/friendly-shell.mdx:91-92`;
`src/content/docs/start/installing.mdx:60`

**Evidence:**

> Different symbol, same idea — the shell is telling you it's ready and showing
> which directory you're in. Every command in this course works identically in
> both.

and, with the scope qualifier removed entirely:

> Same shell, different outfit — every command works in both.

**Why it matters:** fish is not POSIX. `export VAR=value` fails. `VAR=x cmd`
fails. Command substitution is `(cmd)` not `$(cmd)`. `.bashrc` stops being
read. Every `#!/bin/bash` snippet the learner pastes from a search result three
weeks from now will behave differently. The course *makes fish the default* and
then sends the reader out into a bash-shaped internet with a sentence telling
them there is no difference. The author's earlier version was correctly hedged
— `original.txt:75`: "most basic commands work identically to Bash". The
rewrite strengthened a hedge into a falsehood. This is the highest-consequence
claim on the site because its cost is paid later, off-site, with no way to
trace it back.

**Recommendation:** keep the reassurance, add the boundary: "Every command *in
this course* works in both. fish is not bash, though — when a tutorial
elsewhere says `export FOO=bar` and fish complains, that's why. Typing `bash`
drops you into a bash session for one-off cases; `exit` comes back." That is
three sentences and it inoculates the reader.

#### ✅ CLOSED — The Play Store warning is a 2020 fact stated as a 2026 one

> Reshaped from "the Play Store build is bad" to "nothing on the Play Store is Termux",
> which is the danger the reader will actually meet. Kept the danger box and the
> deprecation history (tensed to "was on"), then added the line the report specified:
> there is no official Termux on the Play Store today, and anything found there under that
> name — however polished the listing, however many stars — was published by somebody
> else. This removes the priming problem the report identified, where warning about the
> deprecated build invites the reader to install a clone that "isn't that one". Carrying
> the report's own confidence caveat forward: I could not verify the current Play Store
> listing state from this environment either, so confirm before publishing.

**Severity:** Medium
**Location:** `src/content/docs/start/why-termux.mdx:21-26`

**Evidence:**

> The version of Termux on the Google Play Store is **deprecated and
> unmaintained**. […] Do not use it.

**Why it matters:** the framing tells the reader that *the* Play Store version
is bad, which is the wrong shape of warning for what they will actually
encounter. A beginner searching "Termux" in the Play Store today is far more
likely to be offered a third-party clone, repackage or lookalike by an
unrelated developer than the old official build — and this page has just told
them the danger is the deprecated one, which primes them to install a result
that "isn't that one". The install lesson's careful domain-checking advice
(`installing.mdx:17-19`) has no Play Store equivalent.

**Recommendation:** keep the danger box, add one line: "There is no official
Termux on the Play Store. Anything you find there under that name was published
by someone else — do not install it." Flagging a confidence caveat: I could not
verify the current Play Store listing state from this environment; confirm
before publishing the reworded claim.

#### ✅ CLOSED — The GitHub option is offered to beginners with no caveats attached

> The notes cell now carries both consequences instead of only "you update manually": you
> have to pick the right APK for your phone's CPU (`arm64-v8a`, `armeabi-v7a`, `x86_64`,
> `universal`), and the signing key differs from F-Droid's. Added a caution directly under
> the table making the one-way-door nature visible at the moment of choice — switching
> later means uninstalling Termux and every plugin first — with an in-page anchor to the
> existing "If you already installed Termux" procedure, which previously read as a remedy
> for past mistakes rather than as a consequence of this row. Also named the failure mode:
> picking the wrong architecture produces "App not installed", the same string
> installing.mdx's troubleshooting attributes to an unrelated cause.

**Severity:** Medium
**Location:** `src/content/docs/start/why-termux.mdx:30-33`

**Evidence:**

> | **[GitHub Releases](…)** | Power users | Newest builds, but you update manually. |

**Why it matters:** a reader who takes that row lands on a releases page
listing several APKs split by CPU architecture (`arm64-v8a`, `armeabi-v7a`,
`x86_64`, `universal`) with no guidance on which to pick — and picking wrong
produces "App not installed", which the troubleshooting section
(`installing.mdx:93-94`) attributes to a completely different cause. The page
also never says that F-Droid and GitHub builds carry *different signing keys*,
so switching later means uninstalling the app and every plugin first. That
procedure exists at `why-termux.mdx:56-62` but is presented as a remedy for
past mistakes, not as a consequence of this table.

**Recommendation:** extend the notes cell — "you also have to pick the right
APK for your phone's CPU" — and link the "If you already installed Termux"
section from the table so the one-way-door nature of the choice is visible at
the moment it is made.

#### ✅ CLOSED — Troubleshooting's "Permission denied" gives the less likely cause

> Split into two causes with the discriminator the report specified, phrased as one
> question the stuck learner can answer: are you trying to *run* a file, or just read or
> write one? Branch 1 (reading/writing under `~/storage`) keeps `termux-setup-storage` and
> now also carries the manual permission grant, since the command reports success on a
> second run. Branch 2 is the one that was missing entirely — `chmod +x` under
> `~/storage/shared` reports success and changes nothing, so `./script.sh` fails forever
> no matter how many times it is re-run — with the actual fix as three copyable lines
> (`mv` home, `chmod +x`, `./script.sh`). Previously the page offered one cause and
> prescribed a command the reader had already run.

**Severity:** Medium
**Location:** `src/content/docs/reference/troubleshooting.md:32-40`

**Evidence:**

> **Cause:** you're trying to reach Android storage before bridging it.
>
> **Fix:** run `termux-setup-storage` and approve the Android dialog […]

**Why it matters:** `storage.mdx:76-81` has already taught this reader that the
*other* "Permission denied" exists — `chmod +x` silently doing nothing in
`~/storage/shared`, so `./script.sh` fails forever. Troubleshooting is where a
stuck learner lands, and it offers one cause and prescribes a command they have
already run, with no way to tell which situation they are in.

**Recommendation:** two causes with a one-line discriminator: "Does the path
start with `~/storage`, and have you run `termux-setup-storage`? → grant the
permission. Are you trying to *run* a file rather than read it, and is it under
`~/storage`? → move it to `~` first; shared storage has no exec bit."

#### ✅ CLOSED — The phantom-process fix assumes a computer, ADB and USB debugging

> Reordered so the page a frustrated learner reaches last no longer opens with "your phone
> is broken and fixing it is beyond you". Now leads with four things doable on the phone
> alone — keep long work in the foreground, acquire the wakelock from the Termux
> notification, expect the ~32 limit and prefer one long job to thirty short ones, check
> the OEM battery setting — then presents the free `settings_enable_monitor_phantom_procs`
> feature-flag toggle, and only then the ADB route, explicitly labelled as the only
> complete fix and as needing a computer. The prerequisites the old text assumed are now
> enumerated as steps: tap Build number seven times, enable USB debugging, install
> platform-tools, approve the on-device prompt. Kept the reset-after-reboot caveat and
> added a line making clear this is Android policy, not learner error.

**Severity:** Medium
**Location:** `src/content/docs/reference/troubleshooting.md:65-81`

**Evidence:**

> **Fix:** enable developer options, then run this from a computer with ADB:
>
> ```bash
> adb shell "/system/bin/device_config put activity_manager max_phantom_processes 2147483647"
> ```

**Why it matters:** the diagnosis is right and the commands are right, but
"enable developer options" is itself a multi-step device procedure (tap Build
number seven times, then enable USB debugging), and installing ADB is a
separate project. In a *beginners* course this reads as "your phone is
broken and fixing it is beyond you", on the page a frustrated learner reaches
last.

**Recommendation:** lead with what can be done without a computer — keep
long-running work in the foreground, acquire a wakelock from the Termux
notification, and expect the limit — then present the ADB route as "the only
complete fix, and it needs a computer", with the developer-options steps
enumerated rather than assumed. Link the Intermediate course here as well; this
is the natural handoff point.

#### ✅ CLOSED — The uninstall warning understates what is lost

> The danger box now states that `$PREFIX` goes too — every package ever installed, fish
> and git included — and names the consequence the report identified: restore from the tar
> backup alone and you get your scripts back with nothing left to run them. Added the
> fourth backup step, `pkg list-installed > ~/storage/shared/termux-backups/packages.txt`,
> which also gives `pkg list-installed` (packages.mdx:25) a reason to exist beyond being
> listed. Propagated to the recap, to the cheatsheet's new Archiving & backup section, and
> to troubleshooting.md's "My scripts disappeared" fix, so the habit is stated identically
> in all three places. The `>` is explained inline, since Files & Folders now teaches it.

**Severity:** Low
**Location:** `src/content/docs/foundations/storage.mdx:64-69`

**Evidence:**

> Everything in Termux's private home folder (`~`) evaporates **the instant**
> you uninstall the app or clear its data.

**Why it matters:** `$PREFIX` goes too — every package the learner installed,
fish included. Someone restoring from the tar backup this lesson teaches will
find their scripts back and nothing to run them with.

**Recommendation:** one clause, plus a fourth line in the backup step:
`pkg list-installed > ~/storage/shared/termux-backups/packages.txt`. It is a
genuinely good habit and it gives `pkg list-installed` (`packages.mdx:25`) a
reason to exist.

### Promise vs delivery

Command-by-command check of every lesson instruction against `exec()` in
`shell.ts`. The existing code audit's "Lessons instruct commands the simulator
cannot run" table covers `nano`, `termux-change-repo`, `pkg uninstall`, `ls
-l`, `$PREFIX`, `&&` and the installed-but-not-runnable binaries; `rm`, `cp`,
`mv` and `termux-reload-settings` from that table are now implemented. The
findings below are the ones that table does not contain.

#### ✅ CLOSED — "Practice the whole flow here" — and the flow's last command does not exist

> `tar` implemented: `czf` (create), `tzf` (list) and `xzf` (extract), with `-C <dir>`
> handled before or after the archive name. It stores a member list rather than bytes —
> enough to make `tzf` honest, `xzf` restore the tree, and `ls -l` show a plausible gzip
> size. The real stderr line `tar: Removing leading '/' from member names` is emitted for
> absolute members, followed by a one-line note that `-C ~ projects` is the tidier form,
> so the warning cannot read as failure. A missing target folder produces tar's actual
> two-line failure (`Cannot open: No such file or directory` / `Error is not recoverable:
> exiting now`) plus the `mkdir -p` or `termux-setup-storage` fix — which means the
> lesson's three Steps now have to be done in order to work. Because tar is silent on
> success, one dim line names the silence and points at `tar tzf` to verify. Both the
> lesson's verbatim absolute-path command and the recommended `-C ~ projects` form are
> covered by tests, and the `-C` form is now in SUGGESTIONS.

> Content half done; the simulator half (a real `tar` with `-C` support) was landed
> concurrently in shell.ts, so the lesson and the terminal now agree. The hint on
> storage.mdx's practice terminal was routing *around* the lesson's thesis — it listed
> termux-setup-storage → mkdir → mkdir → ls and omitted `tar` entirely. It now runs the
> full flow including `tar czf … -C ~ projects` and `tar tzf` to inspect the result.
> Adopted the report's better teaching form (`-C ~ projects` rather than an absolute
> `~/projects`) in all three places it appears — storage.mdx, cheatsheet.md,
> troubleshooting.md — with a tip explaining the trade: the absolute form makes tar print
> "Removing leading '/' from member names" and stores a full `data/data/com.termux/…`
> tree, and an unexplained warning after a "successful" backup reads as failure. Added a
> deliberate-failure exercise: run `tar` before `termux-setup-storage` and read the real
> error.

**Severity:** High
**Location:** `src/content/docs/foundations/storage.mdx:110-127`;
`src/components/terminal/shell.ts:34-38`

**Evidence:** step 3 of the Steps block is

```bash
tar czf ~/storage/shared/termux-backups/projects-backup.tar.gz ~/projects
```

immediately followed by "Practice the whole flow here:" and a terminal. `tar`
is not in `COMMAND_NAMES` and has no `case` in `exec()`, so it highlights red
as the learner types and returns `tar: command not found`. The hint on that
same terminal (`storage.mdx:125`) routes around it — "Try: termux-setup-storage
→ mkdir ~/projects → mkdir ~/storage/shared/termux-backups → ls ~/storage" —
omitting the one command the lesson exists to teach, the one repeated verbatim
in `cheatsheet.md:96-98` and `troubleshooting.md:51-53`.

**Why it matters:** the backup rule is the lesson's thesis and the site's third
Golden Rule. It is the single instruction most worth building muscle memory
for, and it is the one the practice terminal silently refuses.

**Recommendation:** implement `tar` in the simulator — it only needs to create
a file node and print the real stderr line, `tar: Removing leading '/' from
member names`, which the lesson should also warn about since an unexplained
warning after a "successful" backup reads as failure. While there: the absolute
path means restoring recreates a full `data/data/com.termux/...` tree;
`tar czf ~/storage/shared/termux-backups/projects-backup.tar.gz -C ~ projects`
is the better thing to teach, in all three places it appears.

#### ✅ CLOSED — The cheatsheet's opening claim is false in both directions

> Both directions repaired. Omissions: a new **Shell** section carries `pkg install fish`,
> `chsh -s fish`, `chsh -s bash`, plus `bash`/`exit` — the Start Here headline lesson had
> no representation at all. Overreach: every previously uncovered row is now taught
> somewhere — mkdir/touch/cat/cp/mv/rm/rm -r by the new Files & Folders lesson, `pkg
> uninstall` by the reframed packages lesson, `history` by first-session's Handy keys, `ls
> -l` by both filesystem and the files lesson. Also closed the "zero internal links"
> repair the report tied to this one: every section now links back to the lesson that
> teaches it, so "what was that flag again?" is one tap from the explanation. Added an
> Archiving & backup section with the full three-line habit (mkdir -p, tar with -C, `pkg
> list-installed > packages.txt`) and a terminus link to Where to Next.

**Severity:** High
**Location:** `src/content/docs/reference/cheatsheet.md:8,18,29,34-49,58-67`

**Evidence:** "Every command from the course, on one page". It contains
commands no lesson teaches — `mkdir`, `touch`, `cat`, `cp`, `mv`, `rm`,
`rm -r`, `ls -l`, `history`, `pkg uninstall` — and it omits the entire Start
Here headline lesson: there is no `pkg install fish`, no `chsh -s fish`, no
`chsh -s bash` row anywhere on the page. The cheatsheet was not updated when
the fish lesson landed. Two of its rows also fail in the simulator: `pkg` has
no `uninstall` branch (`shell.ts:346-401` — returns "unknown subcommand"), and
`ls` collects flags but only ever tests for `a` (`shell.ts:264-285`), so
`ls -l` returns a plausible-looking listing with none of the "sizes,
permissions" the cheatsheet promises.

**Why it matters:** a cheatsheet is a promise about recall. A learner who
practises off it hits an error and a silently-wrong answer, and cannot find the
one command the course spent a whole lesson on.

**Recommendation:** add a "Shell" section with the three `chsh` rows and a
pointer to the fish lesson; mark or remove rows no lesson covers until the
files lesson lands (the prior audit's "cheatsheet has zero internal links" note
is the same repair).

#### ✅ CLOSED — The fish lesson's payoff is the one thing its own terminal cannot show

> `prompt()` now emits `$` when `state.shell === 'bash'` and `❯` when `'fish'`, in both
> the wide and the sub-60-column form, so `chsh` produces a visible change — and `chsh -s
> bash` (which friendly-shell.mdx offers as the undo) visibly reverts it. Added a `shell?:
> 'bash' | 'fish'` prop defaulting to `'fish'`, so every existing page keeps its `~ ❯` and
> the installing.mdx note reconciling the two prompts stays true. `chsh` also now prints a
> line telling the learner to watch the prompt. One content change is still needed to
> close this fully: friendly-shell.mdx's terminal must pass `shell="bash"` — see handoffs.

> Content half done. `TermuxTerminal` gained a `shell` prop concurrently (defaulting to
> fish so every other lesson keeps its `~ ❯`), and friendly-shell.mdx's terminal now
> passes `shell="bash"` — so the session opens on `~ $`, `chsh -s fish` flips it to `~ ❯`,
> and the lesson demonstrates itself instead of contradicting itself. The surrounding
> prose says so explicitly ("This terminal deliberately starts in bash, so you can watch
> the prompt flip from `$` to `❯` — the same change you're about to make on your phone")
> and the hint was changed to "pkg install fish → chsh -s fish (watch the prompt change)".
> Before: the simulator showed the fish prompt from the first keystroke and nothing
> visibly changed — precisely the symptom the lesson tells the reader means the change did
> not take.

**Severity:** Medium
**Location:** `src/content/docs/start/friendly-shell.mdx:68,82-90`;
`src/components/terminal/TermuxTerminal.tsx:121-132`;
`src/components/terminal/shell.ts:143`

**Evidence:** the lesson promises a visible change —

> | bash (default) | `~ $` |
> | fish | `~ ❯` |

— and says "Try the whole sequence right here first". But `prompt()` builds the
prompt from `state.cwd` alone and always emits `❯`; `createState()` starts at
`shell: 'bash'`. So the simulator shows the fish prompt from the first
keystroke, `chsh -s fish` prints "✓ Login shell changed to fish", and nothing
visibly changes — which is precisely the symptom the lesson tells the reader
means the change did not take.

**Why it matters:** this is the one lesson whose result is purely visual, and
the interactive element contradicts the prose.

**Recommendation:** three lines in `prompt()` — emit `$` when
`state.shell === 'bash'` and `❯` when `'fish'`. Add a `shell` prop so the
landing-page terminal can start in fish and keep its look. The lesson then
demonstrates itself.

#### ✅ CLOSED — `mkdir` succeeds in the simulator where it would fail on a device

> `mkdir` no longer calls `mkdirp()` unconditionally. Without `-p` it now requires an
> existing parent (`No such file or directory`, real coreutils behaviour) and reports
> `File exists`; anything under `~/storage` fails while `state.storageLinked` is false,
> with or without `-p`, plus a dim line naming `termux-setup-storage`. `cd`, `ls`,
> `touch`, `cp`/`mv` and `tar` carry the same guard, so storage.mdx step 2 can no longer
> teach a false success at the exact step whose device-side precondition is the lesson's
> whole point.

**Severity:** Medium
**Location:** `src/content/docs/foundations/storage.mdx:104-108`;
`src/components/terminal/shell.ts:176-185`

**Evidence:** step 2 is `mkdir ~/storage/shared/termux-backups`. `mkdirp()`
creates every missing parent unconditionally, so this succeeds in the practice
terminal even when `termux-setup-storage` was never run — whereas on a real
device it returns "No such file or directory" until storage is granted.

**Why it matters:** it teaches a false success at the exact step whose
device-side precondition is the thing the lesson is about, and it removes the
error that would otherwise teach the dependency.

**Recommendation:** make `mkdir` (and `cd`) under `~/storage` fail with the
real error while `state.storageLinked` is false. The state flag already exists
and is already tracked.

#### ✅ CLOSED — Lesson output is authored at desktop widths

> Simulator half only — the doc-table half is content and not mine. The column-padded
> `~/storage/shared     → /sdcard` block is gone; `termux-setup-storage` now prints
> unaligned lines, longest 31 columns (was 52), and lists all six symlinks so the output
> and the lesson's six-row table finally agree. The Android permission prompt is split
> across two lines to fit, and two dim lines were added naming the Deny recovery path
> (Settings → Apps → Termux → Permissions → Files and media → Allow), which is the failure
> branch the flow audit flags separately. `id` was also split into two lines — it was the
> single widest string the sandbox emitted.

> Content half only — the simulator's column-padded output is in shell.ts and not mine.
> Both three-column doc tables the report cited are now two columns. `filesystem.mdx`'s
> Path/Shortcut/What's-there table dropped the column holding the 33-character
> `/data/data/com.termux/files/home`, which moved into prose ("a mouthful —
> /data/data/com.termux/files/home — which is exactly why `~` exists"); the table is now
> Shortcut/What's-there. `storage.mdx`'s Shortcut/Points-to/Typical-use table merged the
> last two columns into one prose cell, with a line saying why: "Two columns, because
> these lines are read on the phone you're configuring." Remaining: capping the
> simulator's `~/storage` output at ~44 columns and dropping its alignment padding
> (shell.ts:336-340).

**Severity:** Medium
**Location:** `src/components/terminal/shell.ts:336-340`;
`foundations/storage.mdx:39-46`; `foundations/filesystem.mdx:27-31`

**Evidence:** the simulator's storage output is column-padded ASCII —

```text
  ~/storage/shared     → /sdcard
  ~/storage/downloads  → /sdcard/Download
```

— and the doc tables around it are three columns wide, one of which holds
`/data/data/com.termux/files/home` (33 characters).

**Why it matters:** the terminal now reaches roughly 55 columns at 390px, so
the emulator side is fixed; what remains is a content decision. These are the
pages a learner reads on the phone they are configuring, and the padded
alignment plus three-column tables are the two authoring patterns that wrap
worst.

**Recommendation:** cap simulator output at ~44 columns and drop the alignment
padding — `~/storage/shared → /sdcard` reads fine unaligned. Replace the
three-column path tables with two-column tables or definition lists, moving the
long absolute path into prose.

#### ✅ CLOSED — What the landing page promises, and what arrives

> Closed the "a beginner will expect it and will not get it" gap: the course now has the
> learner create, edit, copy and delete files. `foundations/files-and-folders.mdx` covers
> mkdir/touch/cat/cp/mv/rm and `>`/`>>`, so `mkdir` at storage.mdx:100 is no longer an
> instruction for a command never introduced — storage now opens its backup steps with
> "Every command here is one you met in Files & Folders; this is what they were for." Also
> fixed "It's embedded in most lessons": `extra-keys.mdx` was the one hands-on lesson
> without a terminal and now has one, taking simulator coverage from 5 of 8 lessons to 8
> of 10 (why-termux and installing are the two that legitimately don't need one).
> Landing-page copy updated from "most lessons" to "nearly every lesson" to match.

**Severity:** Medium
**Location:** `src/content/docs/index.mdx:38-87`

Delivered: "Install it without shooting yourself in the foot" (why-termux +
installing); "Bridge Termux to your real files" (storage); "Command the package
manager" (packages); "a scripted simulator … plus a real Debian VM" — both
exist, and `index.mdx:85` states honestly that the VM appears only in the
packages lesson.

Partly delivered: "It's embedded in most lessons" (`index.mdx:77`) — the
simulator appears in five of eight lessons. `why-termux` and `installing` do
not need it; `extra-keys` does, and is the one without it.

Not promised, but a beginner will expect it and will not get it: the course
never has the learner create a file, edit a file, or run anything. `mkdir`
appears as an instruction at `storage.mdx:100` having never been introduced.
The prior audit's "Missing lesson: file manipulation and destructive-command
safety" is the same hole seen from the code side; from the pedagogy side it is
the reason the course cannot end with a project.

### Gaps

#### ✅ CLOSED — The course has no ending

> Wrote `src/content/docs/where-next.mdx` as the true terminus and pointed
> `extra-keys.mdx` at it, replacing the `next: false` placeholder the earlier pass left
> behind. The page answers the three things the report said were missing: what the learner
> can now do (six capability bullets, each naming commands they actually ran), three
> concrete starter projects using only course material plus one package, and an explicit
> three-card series panel — Beginner (you are here) / Intermediate / Advanced — which is
> now the only entry point to the sibling courses anywhere in the content tree.
> Troubleshooting's dangling "covered properly in the Intermediate course" sentence is now
> a link into it. Chain measured before: extra-keys → END (9 steps, dead stop). After:
> extra-keys → Where to Next → END (11 steps, terminating on a lesson rather than on
> nothing). Because the sidebar array is not mine, `prev` is explicit relative frontmatter
> (`../foundations/extra-keys/`), so the page is reachable and paginated even if the
> config entry lands later.

**Severity:** High
**Location:** `foundations/extra-keys.mdx:98-100`;
`reference/troubleshooting.md:90`; `ProgressDashboard.tsx:61`;
`LessonComplete.tsx:58`

**Evidence:** the last lesson closes with

> That's the Foundations module. Head to the [Command
> Cheatsheet](/reference/cheatsheet/) to keep everything in one place — or check
> your [progress](/progress/).

after which pagination walks the reader Cheatsheet → Troubleshooting → nothing.
`troubleshooting.md:90` — "Long-running background tasks are covered properly
in the Intermediate course" — is the only mention of the sibling courses in the
entire content tree, and it is not a link. The completion signal is split three
ways: `LessonComplete` says "On to the next one" and provides no next link; the
dashboard fires "🎉 Course complete!" at 8/8 while two pages remain in the Next
chain; nothing anywhere says "here is what you can now do".

**Why it matters:** the reader who finishes is the most motivated person the
site will ever have, and is handed a reference table and shown the door.

**Recommendation:** add `foundations/whats-next.mdx` as the true terminus:
what they can now do, two or three concrete starter projects, and an explicit
card to the Intermediate course. Make it the last item in the chain, with
Reference excluded. Link the dangling Intermediate mention. Give
`LessonComplete` a distinct final state on the last lesson.

#### ✅ CLOSED — No prerequisites, no time estimate, no "before you start"

> Added a four-part "Before you start" block to index.mdx, placed immediately under the
> hero terminal so it lands before the reader commits. It leads with the differentiator
> the report said the page states nowhere — you need nothing at all to begin, every lesson
> has a terminal built in, install later — then gives the device floor (Android 7+, ~200
> MB free, Wi-Fi for the first package update because it pulls tens of megabytes), what
> you do *not* need (root, a computer, money), and the duration (about 90 minutes,
> progress saved as you go). The Wi-Fi warning is now stated in both places it matters:
> here, and again as a caution on the install lesson's Step 4.

**Severity:** Medium
**Location:** `src/content/docs/index.mdx`

**Evidence:** "What you'll walk away with" (`index.mdx:38-61`) answers *what
will I be able to do* well — that half is done. What is absent: an Android
version floor (Termux needs Android 7+), free-space and Wi-Fi expectations for
the first `pkg upgrade` and F-Droid's index sync, how long the course takes,
and — a selling point the page never makes — that you can do the whole thing
without a phone, in the browser, and install later.

**Why it matters:** a reader on mobile data who starts lesson four and burns
through a `pkg upgrade` has a bad first experience the site could have
prevented in one line. And the "no device needed" angle is the site's genuine
differentiator, stated nowhere.

**Recommendation:** a four-line "Before you start" block under the hero:
what you need (an Android 7+ phone with ~200 MB free, and Wi-Fi for the first
update — or nothing at all if you want to read and practise here first), how
long (about 90 minutes), and what you do *not* need (root, a computer, money).

## Recommended lesson order

Sidebar array, `LESSONS`, and the prev/next chain should all express this, and
utility pages should be removed from the chain entirely.

```text
Start Here
  1. Welcome (index)                     next → Why Termux
  2. Why Termux (not the Play Store)
  3. Installing Termux Safely
  4. Your First Session
  5. Upgrade Your Shell to Fish

Foundations
  6. Navigating the Filesystem
  7. Files & Folders                     [new]
  8. Bridging Android Storage
  9. Package Management with pkg
 10. Optimizing the Keyboard
 11. Where to Next                       [new]

Utility — in the sidebar, out of the prev/next chain
     Your Progress          prev: false, next: false
     Command Cheatsheet     prev: false, next: false
     Troubleshooting        prev: false, next: false
```

Rationale for each move:

- **Your Progress → out of Start Here, into a Utility group.** It is a
  dashboard, not a step. Removing it makes "Why Termux" lesson one, which is
  what both landing-page CTAs already assume. Fixes the Critical finding.
- **Upgrade Your Shell to Fish → position 5, after Your First Session.** One
  move retires three defects: `installing.mdx:89`'s forward pointer becomes the
  actual next page, `installing.mdx:59`'s "two lessons' time" becomes true, and
  `friendly-shell.mdx:65`'s "a command you already know" stops being false.
  The teaser already in `first-session.mdx:21-23` reads better as a
  next-lesson hook than as a backward reference.
- **Files & Folders → new lesson 7, between Filesystem and Storage.** It is
  the only position that works: `storage.mdx` instructs `mkdir` and `tar` with
  no introduction, and `extra-keys.mdx` needs a text editor. Placing it here
  means storage's backup step is the *payoff* of the previous lesson rather
  than an unexplained command. Covers `mkdir`, `touch`, `cat`, `cp`, `mv`,
  `rm`/`rm -r` with the `rm -rf $PREFIX` danger block, and `tar` for the backup
  habit. Also the natural home for the original guide's `cat > file` +
  Ctrl-D editing sequence, which is the best phone-specific material the author
  ever wrote and exists nowhere in this build.
- **Optimizing the Keyboard stays last of the working lessons.** It needs
  `pkg install nano`, so it must follow Packages. The volume-key fix has
  removed its chicken-and-egg, so it *could* move up into Start Here as a
  quality-of-life win — but only once a lesson has taught an editor. Revisit
  after Files & Folders lands.
- **Where to Next → new terminus.** Gives the chain a destination and the
  three-repo series its only entry point.
- **Cheatsheet and Troubleshooting → out of the chain.** They are references.
  Leaving them in makes the course end on a list of failures and puts the
  progress model (8 lessons, complete at 8/8) permanently at odds with the Next
  button.

Package Management deliberately stays at 9 rather than moving before
Filesystem: `filesystem.mdx` is where `~` gets defined, and every later lesson
depends on that. The `pkg`-before-its-lesson tension is better solved with one
forward-reference clause in `installing.mdx` than by reordering.

## Quick wins

Under thirty minutes each, in descending value:

1. Add `next: { link: '/start/why-termux/', label: 'Why Termux (not the Play
   Store)' }` to `index.mdx` frontmatter, and `prev: false` / `next: false` to
   `progress.mdx`, `cheatsheet.md` and `troubleshooting.md`. Four frontmatter
   edits retire the Critical finding and half the chain problems, without
   touching the sidebar at all.
2. Move the `friendly-shell` entry below `first-session` in
   `astro.config.mjs:116-121` and in `LESSONS` (`progress.ts:35-36`); change
   "two lessons' time" to "the next lesson but one" at `installing.mdx:59`.
   Three defects, one move.
3. `installing.mdx:54` — add "`~` says you're in your home folder" to the
   sentence that currently explains only `$`.
4. `friendly-shell.mdx:91` and `installing.mdx:60` — bound the "every command
   works in both" claim with two sentences about fish not being bash.
5. `friendly-shell.mdx:60-61` — replace the recent-apps swipe with the
   notification **Exit** action, and add the "your prompt should now end in
   `❯`" verification.
6. `installing.mdx:88` — split the prompts: `y` for "Do you want to continue?",
   **Enter** for anything mentioning a configuration file.
7. `cheatsheet.md` — add a Shell section with `pkg install fish`,
   `chsh -s fish`, `chsh -s bash`.
8. `extra-keys.mdx` — swap the one-row and two-row layouts so the simple one
   comes first, and drop in a `<TermuxTerminal>`; three of its four commands
   already run.
9. `troubleshooting.md:90` — make "the Intermediate course" a link.
10. Rename the scripted terminal to "the practice terminal" in
    `first-session.mdx:16`, `storage.mdx:29`, `packages.mdx:34` and
    `installing.mdx:56`, reserving "sandbox" for the WebVM.
11. `ProgressDashboard.tsx:130-143` — "Mark all complete" sits beside "Reset
    progress" and, unlike it, does not confirm. One click zeroes the meaning of
    the progress model.
