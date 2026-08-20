<!--
✒ Metadata
    - Title: Portable Documentation Audit Brief (digiSpace Edition - v2.0)
    - File Name: documentation-audit-brief.md
    - Relative Path: global-docs/templates/documentation-audit-brief.md
    - Artifact Type: docs
    - Version: 2.0.0
    - Date: 2026-08-20
    - Update: Thursday, August 20, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5 (1M context)
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Description:
    A drop-in documentation audit standard for any repository. Generalised from
    the brief that produced the 2026-08-11 Termux Tutorial audit, with the
    operating lessons from actually running it folded in.

✒ Key Features:
    - Fill-in project context block; nothing else needs editing per repo
    - Two lanes, inline source documentation weighted as the deeper priority
    - KEEP / REWRITE / DELETE / MOVE / AUTOMATE classification
    - Non-negotiable guardrails, including multi-agent coordination rules
    - "Lessons from running this" — the failure modes v1 did not anticipate

✒ Other Important Information:
    - Dependencies: none — methodology only
    - Changelog:
        2.0.0 (2026-08-20) — Generalised for any repository. Added the project
          context block, the partition-by-file-family rule, contested-fact
          adjudication, guard falsification, verify-in-the-mode-users-use, the
          live-vs-historical value trap, and derive-or-delete for counts.
        1.0.0 (2026-08-11) — Original, authored for the Termux Tutorial monorepo.
- - - - - - - - -
-->

# Documentation Audit

Initiate a **full-spectrum documentation audit across the repository**.

This audit has **two distinct lanes**. Treat them separately: they have
different purposes, failure modes, and standards.

The second lane — **inline source-code documentation — is the higher priority
and should receive the deeper review.**

---

## Before you start: fill this in

Everything below this block is repository-agnostic. This block is not. Fill it
in before issuing the brief, and give the *same* filled-in copy to every agent.

```text
REPOSITORY
  Root path:
  What it is, in two sentences:
  Languages / frameworks / build system:
  How it is built and deployed:

TOPOLOGY
  Projects / packages / apps, and how they relate:
  Where the layout is declared, if anywhere:

KNOWN DUPLICATION
  Files that exist in more than one copy:
  For each: byte-identical, or intentionally divergent?
  (If you do not know, MEASURE IT before partitioning the work. See
  "Partition by file family" below — this single fact changes the plan.)

KNOWN DRIFT HISTORY
  Bugs this repo has already shipped from stale or copied documentation:
  Ports, renames, migrations, extractions that carried prose along with code:

GUARD RAILS THAT ALREADY EXIST
  Build assertions, linters, tests, CI gates:
  What they cover, and what they conspicuously do not:

CONVENTIONS THAT ARE LOAD-BEARING
  Design tokens, naming rules, ordering requirements, invariants:
  Anything where two files must agree and nothing enforces it:
```

If any line reads "unknown", establish it in Phase 0 rather than guessing.

---

## The governing principle

> **Do not optimize for more comments or fewer comments. Optimize for durable
> understanding.**
>
> Inline documentation should preserve the reasoning, constraints, invariants,
> couplings, and non-obvious failure modes that the code itself cannot
> adequately communicate. Historical investigation, benchmark snapshots, and
> migration archaeology should remain only when they are necessary to maintain
> the current solution.
>
> **The codebase describes what exists. Good documentation explains what future
> maintainers need to know in order to understand it correctly and change it
> safely.**

> **Assume every copied or context-specific comment may be stale until the
> current implementation proves otherwise. Never let existing prose outrank the
> code it claims to describe.**

### Phase 0 — Establish the repository as the source of truth

Before changing any documentation, establish the **current implementation** as
authoritative.

Do not assume that an existing comment, README, migration note, copied
description, or historical explanation is correct merely because it is present.

Work in this direction:

> **Current code and current architecture → determine reality → evaluate
> documentation against that reality.**

Not:

> Existing documentation → assume intent → reinterpret the code to fit it.

Before beginning:

* confirm any in-flight build/CI/tooling changes are complete;
* work from the current repository state;
* inventory the documentation surfaces;
* identify obvious cross-file relationships;
* **measure duplication** — which files exist in multiple copies, and whether
  those copies are identical;
* note manually synchronized information;
* do not make functional changes merely to make old documentation appear
  correct.

If documentation and implementation disagree, **flag the disagreement first and
determine which reflects the intended current state.**

---

# Lane One — Markdown and out-of-code documentation

Audit all documentation that exists primarily for humans outside the source
implementation itself: `README` files, other Markdown/MDX, contributor and
development docs, deployment notes, architecture notes, ADRs, handoff documents,
troubleshooting material, setup instructions, and documentation embedded in
supporting non-source artifacts.

### What to audit

**Is it accurate now?** Paths, commands, package names, URLs, architecture
descriptions, prerequisites, versions, deployment assumptions, file locations,
and workflows must reflect the current repository.

**Is it complete enough for its intended reader?** Do not assume knowledge that
the document claims to teach.

**Is it duplicated elsewhere?** If the same explanation exists in multiple
places, determine which should own it and which should reference it.

**Is history being mistaken for documentation?** Historical context can be
useful, but obsolete implementation details must not masquerade as instructions
for the present system.

**Does it describe intent as well as mechanics where appropriate?**

**Does terminology remain consistent across the project?**

### Lane One deliverable

A list organized by: **Incorrect / stale**, **Missing**, **Duplicated**,
**Unclear**, **Historically useful but misplaced**, **Good as-is**. Then make or
propose the revisions.

---

# Lane Two — Inline documentation throughout the source tree

This is the **primary audit**.

Inspect inline documentation in **every relevant source and configuration
file**, not merely the primary language: source files of all types, stylesheets,
shell scripts, build tooling, config and workflow files where comments explain
behaviour, tests, utilities, and integration code.

Review `//` comments, block comments, docstrings/JSDoc, file headers, function
documentation, `TODO`/`FIXME`/`HACK`/`NOTE` markers, warning comments, inline
rationale beside configuration values, commented-out code, and comments
referring to other files or required synchronization.

Do **not** equate this audit with "remove comments" or "make comments shorter."

The governing question:

> **Given the surrounding code, architecture, and problem being solved, what
> would genuinely useful documentation look like here?**

---

# The standard for good inline documentation

For every meaningful comment, ask whether it answers one or more of these:

### 1. Why does this exist?

Especially when the implementation looks stranger or more complicated than the
obvious alternative. If the code explains **what**, the comment should usually
explain **why**.

### 2. What invariant must remain true?

Two structures that must stay synchronized; a route that must match another
subsystem; an ordering with semantic meaning; a value that cannot simply be
derived from another value. These are often the most valuable comments in a
codebase.

### 3. What breaks if somebody changes this incorrectly?

Document non-obvious failure modes, especially silent ones.

> Removing this attribute causes the preload to be fetched again.

is substantially more useful than:

> Add `crossorigin`.

### 4. What dependency or coupling is not obvious from the local code?

If changing this file requires changing another, say so. Then ask the next
question:

> **Can that relationship be derived or validated instead?**

A comment saying "remember to update X manually" may be appropriate. It is also
evidence that the codebase needs a validation mechanism.

### 5. Why was this non-obvious solution chosen over the apparent alternative?

Keep the **decision**. Be suspicious of preserving the entire story of how you
arrived there.

### 6. Under what condition can this workaround be removed?

Compatibility and build-system workarounds should carry a recognizable
**deletion condition** wherever possible. That prevents temporary architecture
from becoming permanent because nobody remembers why it exists.

---

# Classification system for every substantial comment

### KEEP

Provides durable information that cannot be readily inferred from the code.
Leave alone, or make editorial improvements only.

### REWRITE

The information matters, but the comment is too long, confusing, imprecise,
historically overloaded, duplicated, poorly placed, or too emotional to
communicate priority clearly. Preserve the reasoning; improve the documentation.

### DELETE

Narrates obvious code; repeats identifiers; describes behavior already clear
from the implementation; refers to code that no longer exists; describes another
project or version; is demonstrably incorrect; provides no durable value.

### MOVE

Useful, but inline source is the wrong home: benchmark reports, optimization
experiments, migration history, extensive `WAS / NOW` narratives, rejected
alternatives, historical measurements, detailed design essays. Relocate to an
architecture/decision/history document if retaining them has value.

### AUTOMATE / VALIDATE

The comment describes a condition software should enforce:

> "Keep these arrays in sync." · "If this route moves, update this constant." ·
> "There must be one entry per X." · "These colors must meet AA contrast."

Ask whether it should become a build assertion, unit or integration test,
generated value, shared data structure, lint rule, or validation script.

**The ideal outcome may be less documentation, because the invariant became
executable.**

---

# Special scrutiny areas

## `WAS:` / `NOW:`

Determine whether the historical implementation is still needed to understand
the current code. Usually retain *why the current architecture exists*; usually
move or delete *the full chronology*. Version control already preserves history.

## Exact measurements

Byte counts, file counts, percentages, item counts, bundle sizes, one-time
performance measurements.

> **Is this an invariant, or a snapshot?**

Snapshots rot. If the number matters, make it reproducible by tooling.

**Derive or delete.** Where the thing is enumerated nearby, the list *is* the
count — a number adjacent to its own enumeration is redundant the moment either
changes. Where it is not enumerated, the number is unverifiable, and vague-but-
true ("several common causes") beats precise-but-rotting. Replacing a wrong
count with a right one is the wrong move; it just resets the clock.

## Version-specific claims

> "Package X version 6 behaves this way."

Determine whether the version is pinned, whether the claim still applies, and
whether the comment needs a deletion or update condition. **Check the installed
version, not the documented one.** If the behaviour is real but the version is
incidental, state the behaviour without the version number so it cannot rot.

## Copied comments and ported code

Porting code carries its prose along, and the prose is not typechecked. Search
specifically for: references to the wrong project or module; old names; old
routes; previous repository names; outdated base paths; stale package names;
outdated architectural assumptions; comments describing features absent from the
current context.

Treat contradictions between nearby code and prose as **high-priority defects**.

## Commentary that duplicates documentation elsewhere

Prefer one authoritative explanation plus small local reminders. Avoid three
slightly different versions of the same story.

## Urgency language

Reserve `IMPORTANT`, `WARNING`, `INVARIANT`, and all caps for things whose
violation causes meaningful failure. If everything is emphatic, nothing is.
Personality is welcome; loss of information hierarchy is not.

---

# Do not blindly enforce "comments explain why, never what"

That rule is useful but too simplistic. Sometimes **what** is non-obvious: a
generated configuration object, a compiler workaround, AST traversal, a service
worker, a strange browser requirement, or third-party API behavior may warrant
concise explanation of both **what it is doing** and **why it must be done that
way**.

The objective is not stylistic purity. It is to make the codebase **easier to
understand correctly and harder to modify incorrectly.**

---

# Verification rule

Do not rewrite a comment from intuition alone. For every substantive factual
claim, verify against whatever the repository offers: implementation, imports,
package manifest and lockfile, related components, routes, build configuration,
scripts, tests, styles, workflow configuration, generated metadata, actual data
structures.

If a claim cannot be verified, mark it:

> **UNVERIFIED — requires confirmation**

rather than silently preserving or "correcting" it.

---

# Priority order

1. **Incorrect** — comments that actively contradict the implementation.
2. **Dangerous** — documentation governing hidden coupling, deployment,
   security, build behavior, routing, or silent failure.
3. **Stale** — old names, routes, architecture, versions, paths, counts, copied
   material.
4. **Comments masking missing validation** — "keep these synchronized manually".
5. **Duplicated documentation.**
6. **Historical archaeology occupying source files.**
7. **Excessive or weak narration.**
8. **Pure editorial cleanup.**

Correctness before prettiness.

---

# Expected audit output

Do **not** immediately rewrite everything in one giant pass. First produce an
audit report. For each significant finding:

**File / location** · **Current purpose** · **Problem** · **Risk** ·
**Disposition** (KEEP / REWRITE / DELETE / MOVE / AUTOMATE) · **Recommended
direction** · **Evidence** (file:line, value, or command output).

For important cases, include a proposed replacement.

---

# Second pass — remediation

After the audit is understood, perform the cleanup. Preserve useful
architectural and domain reasoning; preserve non-obvious failure modes; remove
stale history; eliminate contradictions; collapse duplication; move long-form
history where appropriate; make comments proportional to the complexity they
explain; convert enforceable invariants into validation where practical; avoid
changing runtime behavior unless explicitly required and separately justified.

---

# Final pass — read the code again without historical context

After documentation has been revised, make a second pass pretending you **did
not participate in building the project**. For each non-trivial section, ask:

> If I encountered this six months from now with no memory of the implementation
> work, would the surrounding code and documentation tell me:
>
> * what responsibility this section owns?
> * why the unusual parts exist?
> * what I am allowed to change?
> * what must remain true?
> * what else is coupled to it?
> * what failure should I expect if I break that contract?
> * whether a workaround can eventually be removed?

If yes, the documentation is doing its job. If the comment mainly tells you
**what happened six months ago**, it probably is not.

---

# Lessons from running this

These are failure modes the first version of this brief did not anticipate.
They cost real time. Read them before planning the work.

### Partition by file family, not by directory

If the same file exists in several copies, **one agent must own all copies of
it**. An agent holding a single copy cannot distinguish intentional divergence
from drift, and several agents each meeting the same stale narrative in
isolation will produce several conflicting rewrites of it.

Measure the duplication in Phase 0 and let it dictate the partition. Partial
duplication is the dangerous case — some copies identical, others deliberately
different — because it looks like full duplication until you diff it.

### The orchestrator adjudicates contested facts personally

When two auditors report opposite conclusions about the same thing, **do not
pick the more confident one**. Go and measure it.

In practice: two auditors disagreed about whether a hex value appeared in the
codebase. One said it appeared nowhere; the other said it appeared in three
config files. **Both were wrong.** The value was live and correct as one token,
*and* separately misquoted as a different token. The obvious remediation — a
find-and-replace — would have silently broken a working colour.

Which generalises to:

### A live value and a stale reference look identical to a search

Before any bulk replacement, classify every occurrence by whether it is the
thing or a reference to the thing. Correct history is not stale documentation:
a comment saying "X was changed to Y because Z" *should* still contain X.

### Prove every new guard can fail

A guard that cannot fail is theatre. After adding a build assertion, **break the
thing it guards on purpose**, confirm it fails with a useful message and a
non-zero exit, then restore. Record that you did.

### Verify in the mode the user actually uses

Build-verified is not dev-verified. A cross-boundary asset reference can build
perfectly and be broken in the dev server, because the two resolve paths
differently. If the project has more than one run mode, check the one people
spend their time in — and check the rendered output, not just the exit code.

### Fix on the spot; do not accumulate a flag list

A flag is a promise to do work later, and later is how the debt was created.
When something is surfaced, verify it is real and fix it in the same pass. This
applies to agents too: tell them explicitly that "flagged for follow-up" is not
an acceptable disposition inside their own scope.

The exception is genuine scope boundaries — a functional bug found during a
documentation pass is reported, not silently fixed. That is a different rule and
it still holds.

### Distinguish "reduce duplication" from "synchronise duplication"

Making N copies agree is worse than making there be fewer copies. When a fact
must be known in several places, first ask whether the number of places can be
reduced. Only if it cannot should you add a guard to keep them aligned — and a
guard is still better than a comment asking people to remember.

### Documents that describe the audit are in scope for the audit

Status tables, indexes and READMEs describing the work drift like anything else,
and are rarely re-read. Follow every reference they contain; a pointer to a file
that does not exist is the same defect class the audit exists to remove.

---

# DO NOT — Non-Negotiable Audit Guardrails

This is **a documentation audit first and a documentation remediation effort
second**. It is not an open-ended refactor.

### Do not treat existing documentation as authoritative

Comments, READMEs, handoff notes and architectural explanations are **claims to
be verified**, not sources of truth. Ten copies of the same stale comment are
still stale.

### Do not "correct" the code to make an old comment true

If documentation disagrees with implementation, investigate. Determine which
side reflects current intent first. Documentation remediation must not silently
become behavioral remediation.

### Do not make unrelated functional changes

Cleaner, shorter, faster, more elegant, more type-safe, reorganized — all out of
scope unless they directly affect the truthfulness or maintainability of the
documentation being audited. Record worthwhile findings separately.

### Do not delete comments merely because they are long

Length is not the defect. A long comment may be entirely justified by a subtle
constraint, an unavoidable workaround, a dangerous failure mode, or an important
deletion condition. A one-line comment can be useless. Judge by **information
value and durability**, not word count.

### Do not mechanically apply "why, not what"

Generated configuration, AST manipulation, build-system workarounds, platform
APIs and integration glue may require a concise explanation of **what** before
the **why** becomes understandable.

### Do not erase useful reasoning in the name of cleanup

When a comment contains both valuable reasoning and stale detail, **separate the
two**. Do not reduce "here is why this strange implementation must exist" to
"workaround".

### Do not preserve history inline simply because it is interesting

`WAS`/`NOW` narratives, old measurements, migration stories, discarded
implementations and debugging chronicles may be valuable records. That does not
make the source file their correct home.

### Do not convert uncertain assumptions into confident documentation

If you cannot establish why something exists, do not invent a plausible
explanation. Use **UNVERIFIED — requires confirmation** or escalate. A missing
explanation is preferable to a convincing fiction.

### Do not silently broaden claims

Preserve relevant boundaries: platform, version, environment, module, route,
build mode, architecture. Documentation must be at least as precise as the
behavior it describes.

### Do not retain exact measurements as timeless facts without justification

Treat them as snapshots unless the repository enforces them. Verify, make
reproducible, relocate to historical documentation, or replace with the durable
conclusion they originally supported.

### Do not use comments as a substitute for enforceable invariants

Investigate whether the relationship can be derived, generated, shared,
asserted, tested, linted, or validated at build time. Do not implement such
changes during the documentation pass unless authorised, but **flag them
explicitly as AUTOMATE / VALIDATE candidates**. The audit should expose fragile
manual contracts, not merely rewrite their warning labels.

---

# Multi-Agent / Sub-Agent Coordination Guardrails

### Do not allow agents to invent their own documentation standard

Every sub-agent operates from **this same rubric**, given verbatim. The
orchestrating agent owns the standard.

### Do not let multiple agents independently rewrite the same source area

Parallelize **inspection** aggressively. Parallelize **edits** cautiously. Each
file or clearly defined region has one remediation owner at a time. Otherwise
two locally sensible rewrites contradict each other, use different terminology,
duplicate explanations, remove context another agent depended on, or create
conflicts.

### Do not let sub-agents make repository-wide conclusions from one file

"This appears duplicated elsewhere" is a valid local finding. "This is the
canonical implementation" is not, until the wider repository has been checked.

### Do not let agents resolve cross-file contradictions independently

Discrepancies are surfaced to the orchestrator. Cross-file contradictions
require **central reconciliation**.

### Do not allow audit findings to disappear inside edits

Every substantive remediation should trace back to an identified finding. The
record must answer: what was wrong, why was it changed, what principle justified
it, was behavior affected. **Decide where that record lives before starting**,
and make sure it is somewhere that will still exist later.

### Do not permit undocumented scope expansion

A functional bug, broken route, security concern, dead dependency, questionable
architectural decision, performance regression, stale package or failing build
assumption gets **surfaced separately**. A documentation audit may uncover
engineering work. That does not make all discovered engineering work part of it.

### Do not confuse duplicated effort with verification

Deliberate cross-checking of important areas is useful. Accidental duplication
is waste. The orchestrator should know who owns each region, which areas
deliberately receive a second review, and which findings require reconciliation.

### Do not accept a sub-agent's conclusion because it sounds sophisticated

Every important finding must be grounded in repository evidence. Agents are
researchers in this workflow, not authorities. The orchestrator synthesizes and
challenges.

### Do not begin remediation before enough of the audit exists to understand the pattern

If the first agent rewrites a large historical comment, and later agents
discover the same narrative is intentionally duplicated across several modules,
you have acted before understanding the architecture.

Perform enough reconnaissance to identify recurring patterns, copied structures,
shared conventions, systemic problems and canonical sources.

**Understand globally before optimizing locally.**

### Do not make agents communicate only through modified files

Sub-agents return **findings and reasoning**, not just patches: location,
evidence, classification, reasoning, risk, proposed disposition. A diff shows
**what changed**; it cannot communicate **why the agent believed it should**.

---

# Absolutely Do Not

> **Do not fabricate intent. Do not trust stale prose over current
> implementation. Do not turn documentation cleanup into an unrequested
> refactor. Do not allow parallel agents to establish conflicting truths. Do not
> erase valuable reasoning merely to reduce comment volume. Do not preserve
> historical noise merely because somebody once took the time to write it. Do
> not leave manually enforced invariants unflagged. And do not consider the work
> complete until the repository reads coherently as one system rather than as
> the accumulated output of multiple independent agents.**

> **The agents may divide the repository. They may not divide reality.**
>
> Each agent investigates a bounded portion of the system, but the final
> documentation must describe one coherent codebase. The orchestrating agent is
> responsible for reconciling terminology, architecture, cross-file
> relationships, duplicated explanations, and contradictory findings before the
> audit is considered complete.
