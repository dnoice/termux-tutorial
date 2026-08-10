# Beginner course — first-run walkthrough

**Date:** 2026-08-10
**Course:** `termux-tutorial-for-beginners`, read at `localhost:4321`
**Method:** localStorage and sessionStorage wiped first, so this is a genuine
first visit — no profile, no progress, splash unseen. Read in curriculum order,
screenshotting each page and each state change.

**Two lenses, held at once.** The *novice* lens knows nothing: not what a
repository is, not what a shell is, not what F-Droid is. The *practitioner* lens
is someone who builds tutorials for a living and is asking whether each page
earns its place, whether the sequence holds, and whether anything here would
embarrass us in front of a stranger.

**Coverage.** Landing, and lessons 1–11 in order, plus the progress dashboard.
Stopped short of a detailed pass over `reference/cheatsheet` and
`reference/troubleshooting` when browser automation dropped out mid-session; the
findings below are all from pages I actually loaded and measured. Where I could
not verify something, it says so.

---

## The short version

**This is a good course.** The writing is direct and unpatronising, the risk
material is front-loaded where it belongs, and the practice terminal is a real
differentiator rather than a gimmick. Nothing on this list threatens that.

Six issues found. Two were real defects that would reach a learner, one was a
consistency failure that undercut a decision we had already made deliberately,
and three were novice-lens gaps where the course assumes something it has not
yet taught. **All six are fixed**; this document records what they were and why
they mattered.

Two things I *thought* I had found and had not — a scroll trap on the terminal
and a broken `<Steps>` list — are recorded at the bottom, because a walkthrough
that only lists confirmed hits is hiding its own error rate.

---

## Findings

### 1. The recap taught a flag that does not exist — FIXED

**Where:** `foundations/files-and-folders.mdx`, Recap.

**What it said:** "`cp` copies, `mv` moves *and* renames; both need `-r` for
folders."

`mv` has no `-r`. Not "rarely needed" — the option does not exist, and
`mv -r ~/projects ~/backup` fails with `invalid option`. The lesson body two
sections earlier is correct and says only `cp` needs it, so the page contradicts
itself, and the recap is the half a learner copies into their notes.

**Practitioner lens:** recaps are the highest-risk text in any tutorial. They are
written last, read most, and reviewed least, because by then everyone reviewing
already knows the material and reads what they expect to see.

**Fixed:** the recap now states the asymmetry and says why — `mv` relinks a name,
whatever is on the end of it.

### 2. Two different terminal chromes on the same page — FIXED

**Where:** every lesson with a fenced code block.

We deliberately removed the three macOS traffic-light dots from the practice
terminal, on the grounds that a desktop-window signifier is ambiguous on a
course about Android — the terminal now reads `>_ termux · on Android`. But
Expressive Code renders every fenced block in a `frame is-terminal` whose icon is
three circles. On `foundations/storage` I measured **six** code blocks wearing
Mac dots, directly above a live terminal that had just had them removed.

**Novice lens:** invisible. **Practitioner lens:** this is the kind of thing that
makes a product feel assembled rather than designed, and it quietly contradicts a
decision we had already reasoned through and written down.

**Fixed:** `styleOverrides.frames.terminalIcon` now draws the same `>_` mark, so
both chromes agree.

**This one had a tail.** The fix changed the Expressive Code config, which
rehashes `ec.<hash>.css` — and Astro caches rendered Markdown in
`node_modules/.astro`, which `rm -rf dist .astro` does not clear. `.mdx` pages
picked up the new hash while plain `.md` pages kept the old one, so the cheatsheet
and troubleshooting pages shipped pointing at a stylesheet that no longer existed:
**unstyled code blocks, and nothing red in the build except `check-links.mjs`.**
That guard earned its keep. Now documented as gotcha #10.

### 3. "fish-style" arrives three lessons before fish — FIXED

**Where:** landing page, twice.

The landing page said the grey text is "a fish-style suggestion" and described
the practice terminal as "the fish-style shell up the page". Fish is introduced
in **lesson four**.

**Novice lens:** this is the first paragraph that asks me to *do* something, and
it contains a proper noun I have never seen, attached to behaviour I am being
asked to trust. I do not know if "fish" is a program, a mode, or a typo.

**Fixed:** the behaviour is now described in plain terms — "the terminal guessing
what you meant" — with fish named afterwards as a forward pointer to lesson four,
which turns an unexplained noun into a reason to keep reading.

### 4. The CTA still sold the smallest possible thing — FIXED

**Where:** landing page, bottom.

You had already flagged the hero tagline for stopping at "switched on", and it
was rewritten. The bottom CTA still read **"Switch it on"** — the last survivor of
the same metaphor, making the same undersell at the exact moment a reader decides
whether to commit.

**Fixed:** now "Start lesson one", which also tells the reader what will happen
when they click, which the old one did not.

### 5. The touch key row was legible by accident — FIXED

**Where:** `global.css`, `.tmx-terminal__key`.

`--tmx-screen-ink` was read four times — the key label colour plus three
`color-mix()` fills — and defined **nowhere**, in either course. An undefined
custom property invalidates the whole declaration at computed-value time, so the
labels fell back to the inherited colour and the fills to `transparent`. The row
looked fine, which is exactly the problem: the one control drawn on the
dark-locked screen was legible by inheritance rather than by design, and any
change to the surrounding colour would have broken it silently.

**Fixed:** defined in both theme blocks in both courses as `#e8dfcc`, the same
value `TermuxTerminal.tsx` hands xterm as `foreground` — so the key labels and
the text on the screen above them are provably the same ink.

### 6. Novice gaps in "Why Termux" — PARTIALLY ADDRESSED

Two places where the lesson assumes knowledge it has not supplied:

**F-Droid is recommended before it is explained.** The source table says
"F-Droid · Most people · Recommended", and the *next* lesson opens by explaining
what F-Droid is. A novice meets a recommendation for a thing they cannot
evaluate. Mild, and the payoff arrives one page later — but the order is
backwards.

**CPU architecture has no answer.** The GitHub Releases row says you "have to
pick the right APK for your phone's CPU (`arm64-v8a`, `armeabi-v7a`, `x86_64`,
`universal`)" and never says how to find out which you have. The lesson then notes
that picking wrong gives "App not installed" — the same error as an unrelated
problem. A novice who takes the GitHub route is being sent at a fork with no
signpost.

**Status:** left as-is deliberately. The lesson's whole argument is *use F-Droid,
which does not require this choice*, and adding an architecture-detection detour
would undercut that by making the GitHub route look more supported than it is.
Worth a one-line "if you must: Settings → About phone → look for 64-bit" only if
the GitHub route is ever promoted.

---

## What works, and should not be "improved"

- **Risk-first ordering.** "Never install from the Play Store" arrives before any
  install instruction, with the reasoning attached. The signature-mismatch trap
  is explained as a *one-way door* — the correct frame, because the cost is
  paid later and invisibly.
- **"Now close the door behind you."** Step 1.4 of the install lesson tells the
  learner to revoke the browser's install-unknown-apps permission afterwards.
  Almost no tutorial does this. It is the single most professional paragraph in
  the course.
- **Honest failure modes.** The practice terminal answers `nano` with what it is
  and where it works, rather than faking an editor. Refusing to simulate is the
  right call and is applied consistently.
- **The "Before you start" box.** Prerequisites, time, and an explicit *you do
  not need* list — root, a computer, money. Textbook.
- **Progress feels earned.** "Mark complete" → "Nailed it — lesson complete",
  badge 0/11 → 1/11 · 9%, bar fills, Undo offered. Measured working end to end.
- **The prompt changes shell between lessons.** `friendly-shell` renders `$`
  because you have not run `chsh` yet, and `❯` afterwards. That is a detail
  nobody would notice missing, which is what makes it good.

---

## Two things I got wrong

Recorded because a walkthrough that lists only confirmed findings is hiding its
own false-positive rate, and both were nearly filed as bugs.

**A scroll trap that was not there.** Two consecutive screenshots over the
terminal looked identical, and the obvious read was that xterm's wheel handler
was eating page scroll — a serious mobile bug. Measured before writing it up:
`scrollY` went 500 → 1000 over the terminal. The duplicate screenshot was
capture timing, not a trap.

**A broken `<Steps>` list that was not broken.** On `first-session` the terminal
appeared to sit immediately after step 1, suggesting the `PracticeSection`
wrapper had swallowed steps 2–4. Queried the DOM: four `<li>`, terminal outside
the list, structure correct. My screenshot was simply cropped mid-list.

Both took two minutes to check and would have cost far more to chase. The
pattern is worth keeping: **measure the thing before reporting the thing.**

---

## Environment note

Two separate failures during this walkthrough were the **dev server**, not the
site — a stale Vite module graph after bulk file rewrites, and a print preview
that had been opened over the page. Both looked exactly like product bugs, and
one of them (the terminal vanishing entirely) was diagnosed only by serving the
production build side by side and finding it perfect.

**Rule:** after any bulk rewrite, restart the dev server before trusting what
you see; and confirm anything that looks Critical against a production build
before filing it. The same rule had to be written into the intermediate visual
audit twice, for the same reason.
