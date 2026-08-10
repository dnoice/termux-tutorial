# Audit — Lesson sequence, prerequisites and the integrity of the learning path

**Repository:** `termux-tutorial-intermediate`
**Date:** 2026-08-09
**Scope:** instructional design only — lesson order, the prev/next rail,
prerequisite chain, forward references, redundancy, cross-lesson contradictions,
internal link integrity, and the shape of the course. Code, visual,
accessibility and performance are other agents' dimensions and are excluded here
except where a code artefact *is* the curriculum (`astro.config.mjs`'s `sidebar`,
`src/lib/progress.ts`'s `LESSONS`, `scripts/check-curriculum.mjs`).

**Method:** every file in `src/content/docs/` read in full, in sidebar order;
the `sidebar` array and `LESSONS` compared by hand and by running
`node scripts/check-curriculum.mjs`; every internal link enumerated with a regex
sweep and resolved against the content tree; every "course one" back-reference
checked against the actual beginner content at
`termux-tutorial-for-beginners/src/content/docs/`; word counts taken for both
courses to calibrate lesson size. The beginner course is reference only — no
beginner defect is reported below.

**Findings:** 17 total — 2 Critical, 3 High, 6 Medium, 3 Low, 3 Nit.

---

## Executive summary

The **rail is sound** — and that is a genuine and slightly surprising result
given how this course was written. `scripts/check-curriculum.mjs` runs as the
first step of `npm run build`, and it enforces the four things the beginner
course's flow audit had to fix by hand: the sidebar and `LESSONS` agree in order,
every lesson has a matching `<LessonComplete>`, exactly one lesson carries
`next: false` and it is the last one, and the landing page's hero and `next`
frontmatter both point at lesson one. It passes:
`✓ Curriculum consistent — 8 lessons, sidebar and LESSONS agree.` Every lesson
also hands off to the next by name in its closing line, and all twenty internal
links resolve. The class of defect that dominated the beginner audit is
structurally prevented here.

What is broken is everything the checker cannot see. The lessons were written by
separate agents who could not read each other's files, and the damage is exactly
where that predicts. **Lesson 5 schedules a script lesson 4 never created**:
`shell-scripts.mdx` builds `~/bin/battery-check` and explicitly tells the learner
to drop the `.sh`; `scheduling.mdx` then names `battery-check.sh` in all five of
its references, so `chmod` errors, the crontab entry runs nothing, and the
job-scheduler silently registers a path that does not exist — the precise
silent-failure mode that lesson spends 200 lines teaching the learner to
diagnose. **Both reference pages are literal stubs** carrying `<!-- STUB -->`
comments and two sentences of "Coming up:", while three lessons and the terminus
link to them as finished work — including `tunnels.mdx`, whose last word of
safety advice on the only lesson that exposes the device to strangers is "The
Troubleshooting page has the rest." **`scheduling.mdx` tells the learner to run
`export EDITOR=nano` and put it in `~/.bashrc`**, on a course whose stated
prerequisite installs fish as the login shell and whose prerequisite lesson
explicitly tabulates `export FOO=bar` as *"Fails — fish uses `set -x FOO bar`"* —
and `shell-scripts.mdx`, 250 lines earlier, gets the identical problem right with
a two-branch bash/fish fork. Two agents, one problem, opposite answers.

The prerequisite direction is inverted in one place and duplicated in three.
`jq` is installed from scratch in lesson 1, re-verified in lesson 2, and then
`pkg install`ed *again* in lesson 4 under the heading "the missing half of that
toolkit". Command substitution is handed to the learner as a working tool in
lesson 2 (`level=$(termux-battery-status | jq .percentage)`) and then introduced
as new in lesson 4 ("This is the one that makes scripts worth writing"). And the
three volume-key punctuation shortcuts are re-taught sixteen times across all six
teaching lessons.

On shape: **every lesson except the first is longer than the longest lesson in
the beginner course.** Beginner lessons run 645–1622 words (mean 1065);
intermediate lessons run 1633–3419 (mean 2661). `shell-scripts.mdx` at 3419 words
and 11 top-level sections is a complete shell-scripting primer plus a phone
editing workflow plus a WebVM plus a debugger — and its optional "tens of
megabytes" Debian VM asks the learner to redo, in a sandbox, the exact exercise
they completed on the phone forty lines earlier.

Finally: the course cites course one **ten times across five lessons** — "the
rule from Files & Folders in course one", "the paste trick from course one", "the
extra-keys lesson in course one", "the gesture from course one" — and links to it
**zero times**. The only beginner URL anywhere in `src/` is a JS constant on the
last page. With both reference pages stubbed, a learner who has gone fuzzy on a
prerequisite has no door out of this site at all.

---

## The curriculum exactly as it currently stands

Order is the `sidebar` array in `astro.config.mjs:555-644`, which is also the
prev/next rail. Section is the sidebar group; `LESSONS` in
`src/lib/progress.ts:32-41` agrees with all eight, in this order.

| # | Slug | Title | Section | Words | In `LESSONS` |
| :-- | :--- | :---- | :------ | ----: | :----------- |
| — | `index` | Termux: Intermediate *(splash)* | The Android Bridge | 1002 | no — utility |
| 1 | `bridge/api-setup` | Wiring Up Termux:API | The Android Bridge | 1633 | yes |
| 2 | `bridge/reading-the-device` | Reading the Device | The Android Bridge | 3233 | yes |
| 3 | `bridge/talking-back` | Talking Back to Android | The Android Bridge | 2675 | yes |
| 4 | `automation/shell-scripts` | From Commands to Scripts | Scripting & Automation | 3419 | yes |
| 5 | `automation/scheduling` | Making It Run Itself | Scripting & Automation | 3290 | yes |
| 6 | `serving/local-server` | A Web Server in Your Pocket | Serving From Your Pocket | 2777 | yes |
| 7 | `serving/tunnels` | Opening a Door to the Internet | Serving From Your Pocket | 2262 | yes |
| 8 | `where-next` | Where to Next | Serving From Your Pocket | 1721 | yes |
| — | `progress` | Your Progress | Reference & Tools | 170 | no — utility |
| — | `reference/cheatsheet` | Command Cheatsheet | Reference & Tools | **25 of prose (stub)** | no — utility |
| — | `reference/troubleshooting` | Troubleshooting | Reference & Tools | **16 of prose (stub)** | no — utility |

Word counts are `wc -w` on the whole file, so they include frontmatter and
imports; that is consistent with the beginner-course figures quoted in finding
12, so the comparison holds. The two stub figures are prose only — `wc -w`
reports 116 and 166 for those files, but all but one sentence each is
frontmatter and the `<!-- STUB -->` comment.

`shell-scripts` carries `badge: Interactive` and is the sole `LiveSandbox` host
(`SANDBOX_PATH`, `astro.config.mjs:37`). `tunnels` carries `badge: Careful`.
`where-next` carries `badge: Finish` and `next: false`.

## The journey as it actually reads

Each row is the "Next" affordance at the foot of the page, derived by Starlight
from the sidebar array. Verified against frontmatter and the closing prose line
of every lesson.

| # | Page | Next button | Closing prose says | Agrees |
| :-- | :--- | :---------- | :----------------- | :----- |
| 0 | Welcome (splash) | Wiring Up Termux:API | hero + CTA both → `bridge/api-setup/` | yes |
| 1 | Wiring Up Termux:API | Reading the Device | "Reading the Device" (`:266`) | yes |
| 2 | Reading the Device | Talking Back to Android | "Talking Back to Android" (`:553`) | yes |
| 3 | Talking Back to Android | From Commands to Scripts | "From Commands to Scripts" (`:420`) | yes |
| 4 | From Commands to Scripts | Making It Run Itself | "Making It Run Itself" (`:620`) | yes |
| 5 | Making It Run Itself | A Web Server in Your Pocket | "A Web Server in Your Pocket" (`:529`) | yes |
| 6 | A Web Server in Your Pocket | Opening a Door to the Internet | "Opening a Door to the Internet" (`:409`) | yes |
| 7 | Opening a Door to the Internet | Where to Next | "Where to Next" (`:341`) | yes |
| 8 | Where to Next | *(none —* `next: false`*)* | CTA → `progress/` | yes |

Nine steps, all nine lessons, no utility page in the chain, one terminus. This
is the thing the beginner course had to be repaired to achieve, and it arrived
correct. Say so in the handoff — the findings below are all *inside* the
lessons, not in the rail between them.

---

## Findings

### Contradictions between lessons

#### 1. Lesson 5 schedules a file lesson 4 never creates

**Severity:** Critical
**Location:** `automation/shell-scripts.mdx:148,291-296,484,521-523`;
`automation/scheduling.mdx:96,168,194,349,357`

**Evidence:** lesson 4 creates the script without an extension, twice —
`cat > ~/bin/battery-check` (`:148` and `:484`) — runs it as
`battery-check` / `battery-check 90` (`:522-523`), and then makes the naming
explicit and deliberate (`:291-296`):

> **Drop the `.sh` while you are here.** The extension does nothing — the shebang
> decides what runs the file, not the name. `mv ~/bin/greet.sh ~/bin/greet` and
> you type `greet`, like every other command on the system.

Lesson 5 then names `battery-check.sh` in **all five** places it refers to the
script:

```text
scheduling.mdx:96   */15 * * * * /data/data/com.termux/files/home/bin/battery-check.sh
scheduling.mdx:168  0 7 * * * /data/data/com.termux/files/home/bin/battery-check.sh
scheduling.mdx:194  0 7 * * * …/bin/battery-check.sh >> …/cron.log 2>&1
scheduling.mdx:349  chmod +x ~/bin/battery-check.sh
scheduling.mdx:357    --script /data/data/com.termux/files/home/bin/battery-check.sh \
```

**Why it matters:** three separate failures, in escalating cruelty. `chmod`
(`:349`) errors immediately with `No such file or directory` — that one at least
speaks. The crontab entry (`:96`) is accepted by `crontab -e` without complaint
and then runs nothing, forever, with cron's output going to a mail system the
lesson itself says does not exist on a phone. And `termux-job-scheduler`
(`:356-363`) registers the job successfully, so `--pending` lists it and
everything looks correct. This is exactly the silent-failure class the lesson
opens by promising to explain — *"you will do exactly that, put the phone in your
pocket, and find in the morning that nothing ran. No error. No log. No clue"* —
and the learner following it literally is now debugging Doze, App Standby and the
phantom process killer for a typo in the filename.

**Recommendation:** one-line fix — change all five to `battery-check`. Then add
the same discipline as a guard: `scripts/check-curriculum.mjs` already parses
content files, and a check that every `~/bin/<name>` or
`/data/data/com.termux/files/home/bin/<name>` string in the content tree resolves
to a name some lesson actually creates would have caught this at build time.

#### 2. The quoting caution cites the example that breaks its own rule

**Severity:** Medium
**Location:** `bridge/talking-back.mdx:114` vs `:143-144`

**Evidence:** the worked example uses **double** quotes on the outside:

```bash
  --button2-action "termux-toast 'Fine. Ten minutes.'"
```

Twenty lines later the caution states the opposite rule and points at that exact
flag as its illustration:

> Most of the time you want single quotes on the outside and doubles inside, as
> in the `--button2-action` above. Get it backwards and the button will happily
> run something you didn't mean.

**Why it matters:** the caution is correct and the reason it gives is correct —
outer double quotes expand `$VAR` at *post* time rather than at *tap* time. But
the learner is told to copy the pattern from a line that does the reverse. The
lesson's own later composite example (`:373`,
`--button2-action 'termux-toast -g top "Fine."'`) and its `--on-delete` example
(`:152`) both follow the rule properly. Only the cited one does not.

**Recommendation:** flip `:114` to `--button2-action 'termux-toast "Fine. Ten
minutes."'`, or repoint the caution's citation at `--on-delete` on `:152`. Either
is a one-line edit; the first is better because it makes the flagship example
teach the flagship rule.

#### 3. `tunnels.mdx` tells the learner to check a binding it never told them to set

**Severity:** Medium
**Location:** `serving/tunnels.mdx:115` vs `:317-320`; against
`serving/local-server.mdx:75,130-146`

**Evidence:** lesson 7 starts the server with no bind flag (`:113-116`):

```bash
python -m http.server 8080
```

Lesson 6 has already established that this listens on everything —
`local-server.mdx:142-146`: *"Leave `--bind` off entirely and Python still listens
everywhere — that's already the default."* Lesson 7 then closes with (`:317-319`):

> Check the server is bound to `localhost:8080` and still running *before*
> blaming the tunnel

**Why it matters:** the learner cannot act on that instruction, because nothing
told them to bind to localhost and the command they were given does the opposite.
Worse, it is the wrong way round for the lesson's own thesis: this is the one
lesson about not exposing more than you meant to, it spends a `:::danger:::` box
on *what* to serve, and it leaves the server answering on the LAN as well as
through the tunnel. The tunnel only ever connects to `127.0.0.1:8080` — the
lesson says so itself at `:68` and `:151` — so `--bind 127.0.0.1` is both the
correct instruction and the one that makes the closing tip true.

**Recommendation:** change `:115` to
`python -m http.server 8080 --bind 127.0.0.1` and add one clause: "127.0.0.1
this time, not `0.0.0.0` — the tunnel is on this phone, so nobody else needs to
reach the server directly." That converts an inconsistency into a callback that
reinforces lesson 6's best section.

### Orphaned prerequisites

#### 4. Lesson 5 gives bash-only instructions on a course whose prerequisite installs fish

**Severity:** High
**Location:** `automation/scheduling.mdx:77-86`; contrast
`automation/shell-scripts.mdx:260-278`

**Evidence:** `scheduling.mdx` step 1 of "Writing your first crontab":

> 1. **Give cron an editor to open.** `crontab -e` launches whatever `$EDITOR`
>    says, and on a fresh Termux that variable is usually empty.
>
>    ```bash
>    export EDITOR=nano
>    ```
>
>    Put that line in `~/.bashrc` so you only do it once.

The prerequisite course installs fish as the **login shell** — its lesson is
badged `Recommended` (`termux-tutorial-for-beginners/src/content/docs/start/friendly-shell.mdx:5-7`)
— and that same lesson tabulates the two things this instruction does
(`friendly-shell.mdx:134,137`):

| `export FOO=bar` | Fails — fish uses `set -x FOO bar` |
| `~/.bashrc` | Never read — fish uses `~/.config/fish/config.fish` |

`shell-scripts.mdx:260-278`, in the immediately preceding lesson, handles the
identical problem correctly:

> 2. **Add it.** Which line depends on the shell you settled on in course one:
>
>    ```bash
>    # bash
>    echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
>    ```
>
>    ```bash
>    # fish
>    fish_add_path ~/bin
>    ```

**Why it matters:** the fish learner — the default learner, by the prerequisite
course's own recommendation — types `export EDITOR=nano` and gets
`fish: Unknown command: export`. They then put a line in a file fish never reads
and conclude they did it wrong. This is the single clearest fingerprint of the
parallel-agent process in the whole repo: two adjacent lessons, one problem, and
only one of them remembered which shell the reader is in.

**Recommendation:** mirror `shell-scripts.mdx`'s two-branch block —
`set -Ux EDITOR nano` for fish (universal, so it needs no config file at all),
`export EDITOR=nano` plus `~/.bashrc` for bash. While there, sweep the rest of
the course for the same class: `local-server.mdx:352,361-363` (`&`, `jobs`,
`kill %1`) and `local-server.mdx:352` (`2>&1`) should be spot-checked against
fish before publishing.

#### 5. Nothing in either course installs `nano`, and lesson 5 requires it

**Severity:** Medium
**Location:** `automation/scheduling.mdx:81,99-101`

**Evidence:** `:81` sets `EDITOR=nano` and `:99` gives nano-specific save keys:

> 4. **Save and exit.** In nano that's **Ctrl-O**, **Enter**, then **Ctrl-X**

There is no `pkg install nano` anywhere in this repo — the full list of installs
in the intermediate content tree is `termux-api`, `jq`, `cronie`,
`termux-services`, `python` (conditional), `nodejs`, `net-tools`/`iproute2`,
`procps`, `curl` and `cloudflared`. The beginner course does install it
(`foundations/extra-keys.mdx:78`), but the same lesson offers a documented
no-nano path at `:154` ("No nano? Use the trick from Files & Folders"), so a
learner can legitimately arrive here without it.

**Why it matters:** with `EDITOR` set to a binary that does not exist,
`crontab -e` fails to open anything, and the learner is stranded on step 2 of the
lesson's central procedure with an error about an editor they were never told to
install.

**Recommendation:** add `pkg install nano` as step 0, or point `EDITOR` at
something guaranteed present and note the alternative. One line.

#### 6. "Python is almost certainly already on your phone" — neither course puts it there

**Severity:** Medium
**Location:** `serving/local-server.mdx:70`

**Evidence:**

> Python is almost certainly already on your phone; if not, `pkg install python`.

Termux ships no Python. The beginner course mentions it in exactly two places,
and neither installs it as an instructed step: `foundations/packages.mdx:68` is a
"starter toolkit" suggestion prefaced *"Once you're comfortable, these are the
packages most people install on day one"*, and
`foundations/packages.mdx:96`'s `python3 --version # yes, Python is already here`
is a command to run **inside the WebVM Debian image**, not on the phone.

**Why it matters:** the lesson's opening move — the command the entire lesson
hangs off — returns `python: command not found` for a learner who followed both
courses literally, one sentence after being told it would almost certainly work.
The hedge is present, so this is recoverable; the cost is a confidence hit at the
worst moment, on the lesson that opens the last module.

**Recommendation:** invert it: "This needs Python, which Termux does not ship —
`pkg install python` (skip it if `python --version` already answers)." Then the
sentence is true on every device and the check is the learner's, not the page's.

### Redundancy

#### 7. `jq` is introduced three times, in three lessons, twice as if new

**Severity:** High
**Location:** `bridge/api-setup.mdx:194-239`;
`bridge/reading-the-device.mdx:52-74`; `automation/shell-scripts.mdx:435-482`

**Evidence:** lesson 1 installs it, explains the pipe, teaches `-r`, and explains
why filters get single-quoted:

> ## Install `jq` while you're here
> … `jq` is the tool that pulls a single value out of it, and the rest of this
> course leans on it constantly.
> ```bash
> pkg install jq
> ```

Lesson 2 re-verifies and re-teaches the same three forms in a table
(`:54-74`), which is defensible as a checkpoint —
*"`jq` is the JSON tool you installed last lesson. Confirm it's there"* — though
`-r` gets its full introduction a second time (*"`-r` is the flag you'll forget
and then remember forever"*).

Lesson 4 then does it a third time, as **step 1 of its central procedure**, with
no acknowledgement that it is already installed (`:435-440`):

> 1. **Install `jq`** — a tool that reads JSON and prints the piece you asked
>    for. Every `termux-*` command from the last two lessons speaks JSON, so this
>    is the missing half of that toolkit.
>
>    ```bash
>    pkg install jq
>    ```

Steps 2 and 3 of that same block (`:443-482`) then re-teach `termux-battery-status`,
the pipe, `.percentage` and `-r` — all of which are lesson 2's Steps 1–3 nearly
verbatim.

**Why it matters:** by lesson 4 the reader has installed jq once, verified it
once, and used it in perhaps thirty examples. Being told it is "the missing half
of that toolkit" is not a recap, it reads as *the page does not know what you
have already done* — which is corrosive on a course whose entire pitch is that it
builds. It also costs the highest-value lesson in the course roughly 350 words of
its budget on material that is three lessons old. ("the last two lessons" is
itself off by one: jq came from lesson 1, three back.)

**Recommendation:** delete step 1 of `shell-scripts.mdx:435-440` and compress
steps 2–3 to a single sentence — "You already know what
`termux-battery-status | jq -r '.percentage'` prints; here is that same line
living inside a file." Keep lesson 2's checkpoint (`which jq`) as-is; it is
cheap and it is honestly framed.

#### 8. The same three volume-key shortcuts are re-taught in all six teaching lessons

**Severity:** Low
**Location:** `bridge/api-setup.mdx:216`;
`bridge/reading-the-device.mdx:41-50,408,537`;
`bridge/talking-back.mdx:192,211,409`;
`automation/shell-scripts.mdx:160-174,462`;
`automation/scheduling.mdx:85,184,398`; `serving/tunnels.mdx:97`

**Evidence:** `Volume Up + L` (`|`), `Volume Up + H` (`~`) and
`Volume Up + U` (`_`) appear sixteen times across the six teaching lessons —
every one of them. `reading-the-device.mdx:36-50` gives them a whole `##` section
("The two keys this lesson leans on"); `shell-scripts.mdx:160-174` gives them a
`:::note:::` ("The four keys this lesson needs most"); both cite course one as
the source. `Volume Down + C` for Ctrl-C is separately re-explained thirteen
times across the same six lessons. The pipe itself is *defined* twice —
`api-setup.mdx:214` (*"The `|` is a pipe — it sends one command's output into the
next instead of onto your screen"*) and again three lessons later at
`shell-scripts.mdx:462` (*"The `|` is a pipe — **Volume Up + L** — and it means
send what that printed into this"*).

**Why it matters:** individually each is a kindness; collectively it is the
course telling the learner six times that it does not trust them to have done the
prerequisite. Real cost is attention and page budget in exactly the lessons that
are already too long (findings 12 and 7).

**Recommendation:** teach it once, properly, in lesson 1 — where the pipe is
first needed — and thereafter use a bare parenthetical (`Vol-Up + L`) with a link
back. Once the cheatsheet exists (finding 9) it is the natural home.

### Promise vs delivery

#### 9. Both reference pages are stubs, and four pages link to them as finished

**Severity:** Critical
**Location:** `reference/cheatsheet.md` (18 lines, one sentence of prose);
`reference/troubleshooting.md` (21 lines, one sentence of prose); linked from
`serving/tunnels.mdx:320`, `where-next.mdx:176`, `where-next.mdx:178`, and both
sidebar entries at `astro.config.mjs:640-641`

**Evidence:** the entire body of `reference/troubleshooting.md`:

```markdown
<!-- STUB — created so the sidebar entry, the links out of the progress
     dashboard and the build's link check all resolve. Fill it in LAST, from
     the failures the finished lessons can actually cause. …  -->

Coming up: the handful of failures this course reliably produces, and what each
one actually means.
```

`cheatsheet.md` is the same shape. Both are reachable from the sidebar with no
badge or marker saying they are empty. Meanwhile `where-next.mdx:176-183`
describes their contents in confident detail:

> - The [Command Cheatsheet](/reference/cheatsheet/) has every `termux-*`
>   command, cron field, scheduler flag and tunnel invocation from this course on
>   one page.
> - [Troubleshooting](/reference/troubleshooting/) covers the failures this
>   course actually produces: the API command that hangs instead of erroring, …

And `tunnels.mdx:317-321` — the last tip on the most dangerous lesson in the
course, the one that hands a stranger-reachable URL to a beginner:

> :::tip[It worked over Wi-Fi and fails through the tunnel?]
> … The [Troubleshooting](/reference/troubleshooting/) page has the rest.

**Why it matters:** the link check passes, so nothing flags it. The learner who
takes the course's own advice at the two moments it most matters — "I finished,
where's the reference?" and "my tunnel is broken, where's the help?" — lands on
two sentences beginning "Coming up:". The signature failure of this entire course
is a command that *hangs silently*; the page a stuck learner reaches for that is
empty. This is the largest gap between what the site promises and what it
contains, and unlike every other finding here it cannot be fixed with a line
edit.

**Recommendation:** write both, from the finished lessons, in sidebar order,
each section linking back to the lesson that teaches it — the format is already
specified in the stubs' own comments and modelled by
`termux-tutorial-for-beginners/src/content/docs/reference/`. The troubleshooting
list is already enumerated in `troubleshooting.md:12-18` and again in
`where-next.mdx:180-183`; it needs writing, not designing. Until they exist,
either badge them `Coming soon` in the sidebar or soften the three prose claims —
a promise the reader can verify is false in one tap is worse than no promise.

#### 10. Ten references to course one, zero links to it

**Severity:** High
**Location:** `automation/shell-scripts.mdx:21,66,135,162,234,260,400`;
`bridge/api-setup.mdx:53,243`; `bridge/reading-the-device.mdx:49,495`;
`serving/local-server.mdx:328`; only beginner URL in `src/` is
`where-next.mdx:32`

**Evidence:** the course leans on named beginner lessons constantly, always in
plain prose:

> the rule from Files & Folders in course one (`shell-scripts.mdx:66`)
> Use the paste trick from course one instead (`shell-scripts.mdx:135`)
> From the extra-keys lesson in course one (`shell-scripts.mdx:162`)
> exactly as the beginner course's storage lesson warned (`api-setup.mdx:53`)
> the gesture from course one (`local-server.mdx:328`)
> remember from the beginner course that `~` is wiped on uninstall (`reading-the-device.mdx:495`)

A grep of the entire `src/` tree for the beginner site's URL returns exactly one
hit — a JavaScript constant on the terminus page:

```js
export const SERIES = {
  beginner: 'https://dnoice.github.io/termux-tutorial/',
```

**Why it matters:** the course's own front matter (`index.mdx:57-59`) says
`pkg`, `~/storage`, fish, sessions and the extra-keys row "are treated as things
you know" — a reasonable contract, but one that has to come with a door. A
learner who has forgotten the `cat >` + Ctrl-D trick is named the trick, told it
came from a specific lesson in a specific course, and given no way to reach it
short of leaving the site and searching. Compounded by finding 9: with the
reference pages empty, there is currently **no** recovery path from a
prerequisite gap anywhere on this site.

**Recommendation:** the two courses are separate deployments, so these are
external links and `scripts/check-links.mjs` will skip them — which means they
must be centralised or they will rot. Put a `SERIES` / `COURSE_ONE` map in
`src/lib/` (or export the one already in `where-next.mdx:31-34`), and turn the
ten prose citations into links through it. Prioritise the six that name a
specific lesson.

### Sequence and prerequisite ordering

#### 11. Command substitution is used as a tool in lesson 2 and introduced as new in lesson 4

**Severity:** Medium
**Location:** `bridge/reading-the-device.mdx:122-137`;
`bridge/talking-back.mdx:356-360`; introduced at
`automation/shell-scripts.mdx:338-350`

**Evidence:** lesson 2's Steps block, step 4, presented as the payoff of the
whole lesson:

> 4. **Put it in a variable.** This is the move the rest of the course is built
>    on:
>
>    ```bash
>    level=$(termux-battery-status | jq .percentage)
>    echo "Battery is at $level%"
>    ```
>
> `$( … )` runs the command inside and hands back its output.

Lesson 3 uses it again (`:359`, `PCT=$(termux-battery-status | jq -r .percentage)`).
Lesson 4 then opens a `##` section with:

> ## Command substitution: putting output into a variable
>
> This is the one that makes scripts worth writing. `$(command)` runs the command
> and hands you back what it printed.

The same inversion applies to shell variables generally: lesson 4's "Arguments,
variables and quotes" (`:305-336`) introduces `name="$1"` and the no-spaces-around-`=`
rule two lessons after the learner was told to type `level=$(…)`.

**Why it matters:** `astro.config.mjs:592-595` states the sequencing thesis
explicitly — scripting comes *after* the API lessons because *"a first script is
far more convincing when it composes commands the learner already ran by hand"* —
and that thesis is right. But the execution has lessons 2 and 3 quietly teaching
the two most important pieces of lesson 4's syllabus, so lesson 4 either
re-teaches them cold (as it does) or is left with a hole. The reader who is
paying attention notices that the course does not know what it has told them.

**Recommendation:** keep the order — it is correct. Reframe lesson 4's two
sections as payoffs rather than introductions, exactly as the beginner audit's
`packages.mdx` fix did: "You have been writing `level=$(…)` since Reading the
Device. Here is the name for it, and the two rules that stop it biting you." Then
lead each section with the part that *is* new (`"${1:-20}"`, the quoting rules,
`$#`) rather than the part that is two lessons old.

#### 12. `shell-scripts.mdx` is doing the work of three lessons

**Severity:** Medium
**Location:** `automation/shell-scripts.mdx` — 3419 words, 622 lines, 11 `##`
sections

**Evidence:** measured against the finished course next door. Beginner lessons
run **645–1622 words**, mean 1065:

```text
filesystem 645 · why-termux 651 · first-session 666 · packages 805
friendly-shell 905 · extra-keys 1198 · storage 1223 · installing 1372
sessions-and-copy-paste 1560 · files-and-folders 1622
```

Intermediate lessons run **1633–3419**, mean 2661. Every lesson except
`api-setup` (1633) exceeds the *largest* beginner lesson. `shell-scripts.mdx`
alone carries: what a script is; the first script and `chmod`; the shebang and
two wrong shebangs; a phone editing workflow; a `!`-in-double-quotes gotcha; a
WebVM sandbox; `PATH` and `~/bin` with a bash/fish fork; arguments, variables and
three quoting rules; command substitution; `if`, `test` and exit codes;
`set -eu`; a 30-line real script; and `sh -x` debugging. That is a shell-scripting
primer, and in the beginner course's own granularity it would be three lessons.

**Why it matters:** it is also the lesson with the highest failure cost — every
later lesson depends on the learner having a working script — and the one most
likely to be read on a phone in one sitting. `scheduling.mdx` (3290 words) has the
same problem for the same reason: cron, plus Doze/App Standby/phantom processes,
plus `termux-job-scheduler`, plus Termux:Boot, is four lessons of material behind
one "Next" button.

**Recommendation:** split `shell-scripts` at the `PATH` boundary — "Your First
Script" (file, shebang, `chmod`, `./`, the phone editing workflow, the sandbox)
and "Scripts That Take Instructions" (`PATH`/`~/bin`, arguments, quoting,
substitution, `if`/exit codes, `set -eu`, the battery script, `sh -x`). Both land
near 1700 words, which is the top of the beginner course's range. If a split is
not wanted, the cheapest mitigation is deleting the redundancy in findings 7 and
8, which is worth ~500 words on this page alone. `scheduling` splits equally
cleanly at "Then you put the phone in your pocket" (`:226`).

#### 13. The optional Debian VM asks the learner to redo, offline, the exercise they just did for real

**Severity:** Medium
**Location:** `automation/shell-scripts.mdx:192-242` (VM section) vs `:44-93`
(the same exercise on the phone)

**Evidence:** the on-phone Steps block at `:46-93` has the learner
`mkdir -p ~/bin && cd ~/bin`, write a file, hit `Permission denied`, `chmod +x`,
and run it. One hundred lines later the sandbox section says:

> Inside it, `/bin/sh` is the right shebang — it is Debian, not Termux. Try this:
>
> ```bash
> mkdir -p ~/bin && cd ~/bin
> cat > greet.sh
> ```
> …
> ```bash
> ./greet.sh          # Permission denied — read it, it is the point
> chmod +x greet.sh
> ```

preceded by (`:202-206`):

> :::caution[Before you boot it — this is a big download]
> The VM pulls **tens of megabytes** of disk image on first boot. **Use Wi-Fi if
> you're on mobile data.**

**Why it matters:** the stated value of the sandbox (`:192-206`) is *"you can
break it somewhere that does not matter"* — which is an argument for putting it
**before** the device version, not after. As written, the learner spends tens of
megabytes to re-run an exercise they already completed successfully, with the
only new content being `${1:-world}` (four characters of argument default, which
`:332-336` teaches properly later anyway). On the audience this course names —
mid-range phone, often mobile data — that is a real cost for near-zero new
information, and the most likely outcome is that it is skipped, which makes the
one interactive element in the course dead weight.

**Recommendation:** either move the sandbox above the on-phone Steps block and
reframe it as the rehearsal ("do it here first, where nothing matters, then do it
on the phone"), or keep it where it is and give it material the phone section
does not have — arguments, `if`, exit codes, a deliberate `set -eu` abort, and
`sh -x`, all of which are plain POSIX and all of which currently have no
practice surface at all. The second is better: it gives the four hardest concepts
on the page somewhere to be tried.

### Smaller inconsistencies

#### 14. The terminus says seven lessons; the dashboard it links to counts eight

**Severity:** Low
**Location:** `where-next.mdx:39-40`; `src/lib/progress.ts:32-41`;
`astro.config.mjs:316-324,337-339`

**Evidence:** `where-next.mdx:39`:

> Seven lessons, and none of them were theory — you ran all of it on real
> hardware.

`LESSONS` contains **eight** entries (`where-next` is one of them), and
`stats()` (`progress.ts:128-132`) derives the dashboard total from
`LESSONS.length`. The page's own CTA (`:190`) sends the learner straight to that
dashboard. `astro.config.mjs`'s `teaches` array lists seven, and its
`CourseInstance` comment says "seven lessons" — so the discrepancy is a
convention question, not a bug, but it is visible.

**Why it matters:** the last sentence a finisher reads before clicking through
to a progress ring that says "8" tells them there were seven. Small, but it is
the one moment the course is asking to be trusted about what it delivered. The
beginner course avoids this by not stating a count on its terminus
(`where-next.mdx:35`: "That's the whole beginner course").

**Recommendation:** "Seven teaching lessons" — or drop the number, as course one
does.

#### 15. `where-next` presents Termux:Boot as a command

**Severity:** Nit
**Location:** `where-next.mdx:66`

**Evidence:** in the lesson-5 recap bullet: "`termux-boot` for surviving a
reboot." There is no `termux-boot` command; `scheduling.mdx:450-489` correctly
teaches it as an **app** installed from F-Droid plus a `~/.termux/boot/` script.

**Recommendation:** "**Termux:Boot** for surviving a reboot."

#### 16. Reading the Device miscounts its own commands

**Severity:** Nit
**Location:** `bridge/reading-the-device.mdx:463-467`

**Evidence:**

> You have just worked through seven commands. Six of them read something the
> phone knows about *you*

The lesson teaches nine: `termux-battery-status`, `termux-wifi-connectioninfo`,
`termux-telephony-deviceinfo`, `termux-telephony-cellinfo`, `termux-sensor`,
`termux-location`, `termux-camera-info`, `termux-camera-photo`,
`termux-microphone-record`. Seven of those read something about the person
(everything but battery and camera-info).

**Why it matters:** it opens the privacy section — the most serious three
paragraphs in the course — with a number the reader can disprove by scrolling up.

**Recommendation:** "nine commands. Seven of them read something the phone knows
about *you*."

#### 17. The sandbox says "three lines" and shows two

**Severity:** Nit
**Location:** `automation/shell-scripts.mdx:215-220`

**Evidence:**

> Then type these three lines, and finish with <kbd>Ctrl-D</kbd>:
>
> ```bash
> #!/bin/sh
> echo "Hello, ${1:-world}."
> ```

**Recommendation:** "these two lines".

---

## Checked and found correct, for the record

- **The prev/next rail.** All nine steps, correct order, no utility page in the
  chain, exactly one terminus, and every closing prose line names the page its
  Next button actually goes to. Verified against frontmatter and by running
  `check-curriculum.mjs`.
- **The sidebar / `LESSONS` agreement**, including order, and every
  `<LessonComplete slug>` matching its `LESSONS` entry.
- **`sidebar.order` frontmatter** — inert (all groups use explicit `items`), but
  ascending 0–8 and guarded by check 9 of `check-curriculum.mjs`, so a later
  switch to `autogenerate` is a no-op.
- **All twenty internal markdown links** resolve to existing content files. No
  404s, no mis-scoped paths, no root-relative frontmatter links (the beginner
  course's GitHub Pages trap).
- **`index.mdx`'s three forward affordances** — hero action (`:27`), `next`
  frontmatter (`:34`) and footer CTA (`:143`) — all resolve to
  `bridge/api-setup/`, and the first two are correctly relative.
- **The module arc.** Read → write → automate → serve → expose is the right
  order, and the two most load-bearing sequencing decisions are correct and
  correctly justified in `astro.config.mjs:544-554,592-595,615-618`: scripting
  after the API lessons (so the first script composes commands the learner is
  already sick of retyping), and local server before tunnel (so a tunnel failure
  is distinguishable from a server failure). `local-server.mdx:19-22` and
  `tunnels.mdx:317-319` both state that dependency out loud to the learner.
- **Handoffs into the beginner course's assumed knowledge** for `pkg`,
  `~/storage`, `~`, `$PREFIX`, `>`/`>>`, `cat >` + Ctrl-D, the volume-key
  modifiers, sessions and the extra-keys row — all genuinely taught there. The
  exceptions are findings 4, 5 and 6.
- **`chmod +x`**, which the beginner cheatsheet flags as *"Not drilled in a
  lesson"*, is properly taught from scratch here (`shell-scripts.mdx:36-42,82-93`)
  including the deliberate `Permission denied` failure. Correct call.

---

## Suggested order of work

1. **Finding 1** (five `.sh` strings in `scheduling.mdx`) — one edit, removes a
   silent failure from the course's own worked example.
2. **Finding 4** (fish/`export` in `scheduling.mdx`) — one block, unblocks the
   default learner.
3. **Findings 2, 3, 5, 6, 14, 15, 16, 17** — eight one-line edits.
4. **Finding 9** (write the two reference pages) — the largest single piece of
   missing work in the repo, and the one that unblocks finding 8's cleanup.
5. **Findings 7, 10, 11** — the redundancy and back-link sweep; do 7 and 11
   together, since both are edits to the same two sections of
   `shell-scripts.mdx`.
6. **Findings 12, 13** — the split, once the content above is stable. Doing it
   before the redundancy sweep would mean splitting text that is about to be
   deleted.
