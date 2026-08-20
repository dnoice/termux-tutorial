<!--
✒ Metadata
    - Title: Documentation Audit Brief (digiSpace Edition - v1.0)
    - File Name: 2026-08-11-documentation-audit-brief.md
    - Relative Path: global-docs/audits/repo/2026-08-11-documentation-audit-brief.md
    - Artifact Type: docs
    - Version: 1.0.0
    - Date: 2026-08-11
    - Update: Thursday, August 20, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Opus 5 (1M context)
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Description:
    The governing standard for the 2026-08-11 repository-wide documentation
    audit. Authored by Dennis and issued as the single rubric every auditor
    worked from. Preserved here verbatim so the audit's findings can be judged
    against the standard that produced them, and so the next audit can reuse it.

✒ Key Features:
    - Two lanes, with inline source documentation as the deeper priority
    - Phase 0: the repository is the source of truth, prose is a claim
    - Six questions that decide whether a comment earns its place
    - KEEP / REWRITE / DELETE / MOVE / AUTOMATE classification
    - Special scrutiny: WAS/NOW, exact measurements, copied comments
    - Non-negotiable guardrails, including multi-agent coordination rules

✒ Other Important Information:
    - Dependencies: none — this is a methodology document
    - Companions in this directory: the report it produced
      (2026-08-11-documentation.html) and the raw per-region evidence
      (2026-08-11-findings.md)
- - - - - - - - -
-->

# About this document

**This is the brief, not the findings.** It is the instruction set the
documentation audit was run against — recovered verbatim from the working
session and saved so it outlives the chat it was issued in.

It is reproduced **exactly as written**, including its use of multiple
top-level headings and its original emphasis. It is a record of what was asked,
so it is deliberately not reformatted to the house markdown style; editing it
would break the thing that makes it useful.

## Why it is worth keeping

The audit it produced found 414 issues across four projects, and the quality of
that output traces directly to three decisions made *here* rather than during
the work:

- **Prose is a claim, not a source of truth.** Auditors were told to verify
  every statement against the implementation, and to mark anything they could
  not confirm as `UNVERIFIED` rather than invent a plausible explanation.
- **The classification is five-way, not two-way.** Because `AUTOMATE` and `MOVE`
  existed as options, invariants held together by comments became build
  assertions, and archaeology moved to `global-docs/decisions/` instead of being
  deleted or left in place.
- **Parallelise inspection, serialise judgement.** Fourteen agents inspected;
  cross-file contradictions came back unresolved for central reconciliation.
  That is what caught the case where two auditors reached opposite conclusions
  about the same hex value and **both were wrong**.

## Reusing it

It is written to be re-runnable. For a later audit, the parts that need
updating are the repository-specific context — project layout, known drift
patterns, the file families that are duplicated — and nothing else. The
standard itself is general.

---

# Documentation Audit

Please initiate a **full-spectrum documentation audit across the repository**.

This audit has **two distinct lanes**. Treat them separately because they have different purposes, failure modes, and standards.

The second lane—**inline source-code documentation—is the higher priority and should receive the deeper review.**

---

## The governing principle

> **Do not optimize for more comments or fewer comments. Optimize for durable understanding.**
>
> Inline documentation should preserve the reasoning, constraints, invariants, couplings, and non-obvious failure modes that the code itself cannot adequately communicate. Historical investigation, benchmark snapshots, and migration archaeology should remain only when they are necessary to maintain the current solution.
>
> **The codebase describes what exists. Good documentation explains what future maintainers need to know in order to understand it correctly and change it safely.**

> **Assume every copied or course-specific comment may be stale until the current implementation proves otherwise. Never let existing prose outrank the code it claims to describe.**


### Phase 0 — Establish the repository as the source of truth

Before changing any documentation, establish the **current implementation** as authoritative.

Do not assume that an existing comment, README, migration note, copied course description, or historical explanation is correct merely because it is already present.

The audit should work in this direction:

> **Current code and current architecture → determine reality → evaluate documentation against that reality.**

Not:

> Existing documentation → assume intent → reinterpret the code to fit it.

Before beginning:

* confirm the GitHub/workflow changes are complete;
* work from the current repository state;
* inventory the documentation surfaces;
* identify obvious cross-file relationships;
* note duplicated or manually synchronized information;
* do not make functional changes merely to make old documentation appear correct.

If documentation and implementation disagree, **flag the disagreement first and determine which reflects the intended current state.**

---

# Lane One — Markdown and out-of-code documentation

Audit all documentation that exists primarily for humans outside the source implementation itself.

This includes, where applicable:

* `README.md`
* Markdown and MDX documentation
* course/tutorial content
* contribution/development documentation
* deployment notes
* architecture notes
* ADRs
* handoff documents
* troubleshooting material
* setup/install instructions
* repository-level documentation
* documentation embedded in supporting non-source artifacts

### What to audit

For each document, ask:

**Is it accurate now?**
Paths, commands, package names, course names, URLs, architecture descriptions, prerequisites, versions, deployment assumptions, file locations, and workflows must reflect the current repository.

**Is it complete enough for its intended reader?**
Do not assume knowledge that the document claims to teach.

**Is it duplicated elsewhere?**
If the same explanation exists in multiple places, determine which should own it and which should reference it.

**Is history being mistaken for documentation?**
Historical context can be useful, but obsolete implementation details should not masquerade as instructions for the present system.

**Does the documentation describe intent as well as mechanics where appropriate?**
Especially for architectural or pedagogical decisions.

**Does terminology remain consistent across the project?**

### Lane One deliverable

Produce a list organized by:

* **Incorrect / stale**
* **Missing**
* **Duplicated**
* **Unclear**
* **Historically useful but misplaced**
* **Good as-is**

Then make or propose the necessary revisions.

---

# Lane Two — Inline documentation throughout the source tree

This is the **primary audit**.

Inspect inline documentation in **every relevant source and configuration file**, not merely JavaScript.

Depending on the repository, this may include:

* `.js`
* `.mjs`
* `.ts`
* `.tsx`
* `.jsx`
* `.astro`
* `.css`
* shell scripts
* Node scripts
* config files
* workflow/configuration files where comments explain behavior
* build tooling
* tests
* utilities
* integration code

Review:

* `//` comments
* `/* ... */` blocks
* `/** ... */` JSDoc
* file headers
* function documentation
* TODO/FIXME/HACK/NOTE comments
* warning comments
* inline rationale beside configuration values
* commented-out code
* comments referring to other files or required synchronization

Do **not** equate this audit with “remove comments” or “make comments shorter.”

The governing question is:

> **Given the surrounding code, architecture, and problem being solved, what would genuinely useful documentation look like here?**

---

# The standard for good inline documentation

For every meaningful comment, ask whether it answers one or more of these questions:

### 1. Why does this exist?

Especially when the implementation looks stranger or more complicated than the obvious alternative.

If the code explains **what**, the comment should usually explain **why**.

---

### 2. What invariant must remain true?

Examples:

* two structures must stay synchronized;
* this route must match another subsystem;
* this stylesheet must remain last;
* this service worker must stay scoped;
* this ordering has semantic meaning;
* this value cannot simply be derived from another value.

These are often among the most valuable comments in a codebase.

---

### 3. What breaks if somebody changes this incorrectly?

Document non-obvious failure modes.

Especially silent ones.

For example:

> Removing this attribute causes the preload to be fetched again.

is substantially more useful than:

> Add `crossorigin`.

---

### 4. What dependency or coupling is not obvious from the local code?

If changing this file requires changing another file, say so.

But then ask the next question:

> **Can that relationship be derived or validated instead?**

A comment saying:

> “Remember to update X manually.”

may be appropriate.

A comment saying:

> “Nothing validates this; you must remember.”

is also evidence that the codebase may need a validation mechanism.

---

### 5. Why was this non-obvious solution chosen over the apparent alternative?

This is useful architectural reasoning.

Keep the **decision**.

Be suspicious of preserving the entire story of how we arrived there.

---

### 6. Under what condition can this workaround be removed?

Compatibility and build-system workarounds should have a recognizable **deletion condition** whenever possible.

That prevents temporary architecture from becoming permanent simply because nobody remembers why it exists.

---

# Classification system for every substantial comment

During the audit, classify comments into one of these buckets:

### KEEP

The comment provides durable information that cannot be readily inferred from the code.

Leave it alone or make only editorial improvements.

---

### REWRITE

The underlying information is important, but the comment is:

* too long;
* confusing;
* imprecise;
* historically overloaded;
* duplicated;
* poorly placed;
* too emotional to communicate priority clearly.

Preserve the reasoning while improving the documentation.

---

### DELETE

The comment:

* merely narrates obvious code;
* repeats identifiers;
* describes behavior already expressed clearly by the implementation;
* refers to code that no longer exists;
* describes another course/project/version;
* is demonstrably incorrect;
* provides no durable maintenance value.

---

### MOVE

The information is useful, but inline source code is the wrong home.

Likely candidates include:

* benchmark reports;
* optimization experiments;
* migration history;
* extensive `WAS / NOW` narratives;
* rejected alternatives;
* historical package-size measurements;
* detailed design essays.

Move those concepts into a suitable architecture/design/history document if retaining them has value.

---

### AUTOMATE / VALIDATE

The comment describes a condition that software should enforce.

Examples:

> “Keep these arrays in sync.”

> “If this route moves, update this constant.”

> “There must be one entry for every instructional lesson.”

> “These colors must meet AA contrast.”

Ask whether this should instead become:

* a build assertion;
* unit test;
* integration test;
* generated value;
* shared data structure;
* lint rule;
* validation script.

The ideal outcome may be **less documentation because the invariant has become executable.**

---

# Special scrutiny areas

Certain comment patterns should automatically trigger deeper inspection.

## `WAS:` / `NOW:`

Determine whether the historical implementation is still needed to understand the current code.

Usually retain:

> why the current architecture exists.

Usually move or delete:

> the full chronology of previous implementations.

Git already preserves implementation history.

---

## Exact measurements

Examples:

* exact byte counts;
* exact file counts;
* exact percentages;
* exact numbers of lessons;
* exact numbers of code blocks;
* exact bundle sizes;
* one-time performance measurements.

Ask:

> **Is this an invariant, or is this a snapshot?**

Snapshots rot quickly.

If the number is important, consider making it reproducible by tooling.

---

## Version-specific claims

Examples:

> “Package X version 6 behaves this way.”

Determine whether:

* the version is pinned;
* the claim still applies;
* the comment needs a deletion/update condition.

---

## Cross-course or copied comments

This repository has already demonstrated the danger of carrying documentation forward while porting code.

Search specifically for:

* references to the wrong course;
* old lesson names;
* old routes;
* previous repository names;
* outdated BASE paths;
* stale package names;
* old architectural assumptions;
* comments describing features absent from the current project.

Treat contradictions between nearby code and prose as **high-priority defects**.

---

## Commentary that duplicates documentation elsewhere

If a large architectural explanation exists at the top of a section, local comments should not repeat the entire explanation.

Prefer:

> one authoritative explanation + small local reminders.

Avoid:

> three slightly different versions of the same story.

---

## Urgency language

Reserve:

* `IMPORTANT`
* `WARNING`
* `INVARIANT`
* all caps

for things whose violation causes meaningful failure.

If everything is emphatic, nothing is.

Personality is welcome; loss of information hierarchy is not.

---

# Do not blindly enforce “comments explain why, never what”

That rule is useful but too simplistic for this project.

Sometimes **what** is non-obvious.

A generated configuration object, compiler workaround, AST traversal, service-worker loader, strange browser requirement, or third-party API behavior may warrant concise explanation of both:

> **what it is doing**

and

> **why it must be done that way.**

Judge documentation contextually.

The objective is not stylistic purity.

The objective is to make the codebase **easier to understand correctly and harder to modify incorrectly.**

---

# Verification rule

Do not rewrite a comment from intuition alone.

For every substantive factual claim, verify it against whichever sources are available in the repository:

* implementation;
* imports;
* package manifest/lockfile;
* related components;
* routes;
* build configuration;
* scripts;
* tests;
* styles;
* workflow configuration;
* generated metadata;
* actual lesson structure.

If a claim cannot be verified, mark it:

> **UNVERIFIED — requires confirmation**

rather than silently preserving or “correcting” it.

---

# Priority order

Work through inline documentation in this order:

**1. Incorrect comments**
Comments that actively contradict the implementation.

**2. Dangerous comments**
Documentation governing hidden coupling, deployment, security, build behavior, routing, or silent failure.

**3. Stale comments**
Old course names, routes, architecture, package versions, paths, counts, or copied material.

**4. Comments masking missing validation**
“Keep these synchronized manually” situations.

**5. Duplicated documentation**

**6. Historical archaeology occupying source files**

**7. Excessive or weak narration**

**8. Pure editorial cleanup**

Correctness before prettiness.

---

# Expected audit output

Do **not** immediately rewrite everything in one giant pass.

First produce an audit report with enough context to understand the proposed changes.

For each significant finding, provide:

**File / location**
Where the documentation occurs.

**Current purpose**
What the comment appears intended to communicate.

**Problem**
Why the current documentation is weak, stale, incorrect, redundant, or misplaced.

**Risk**
What misunderstanding or maintenance failure it could produce.

**Disposition**
KEEP / REWRITE / DELETE / MOVE / AUTOMATE.

**Recommended direction**
What good documentation should communicate instead.

For important cases, include a proposed replacement.

---

# Second pass — remediation

After the audit is understood, perform the documentation cleanup.

While editing:

* preserve useful architectural reasoning;
* preserve important pedagogical reasoning;
* preserve non-obvious failure modes;
* remove stale history;
* eliminate contradictions;
* collapse duplication;
* move long-form history where appropriate;
* make comments proportional to the complexity they explain;
* convert enforceable invariants into validation where practical;
* avoid changing runtime behavior unless explicitly required and separately justified.

---

# Final pass — read the code again without historical context

This is important.

After documentation has been revised, make a second pass pretending you **did not participate in building the project**.

For each non-trivial section, ask:

> If I encountered this six months from now with no memory of the implementation work, would the surrounding code and documentation tell me:

> * what responsibility this section owns?
> * why the unusual parts exist?
> * what I am allowed to change?
> * what must remain true?
> * what else is coupled to it?
> * what failure should I expect if I break that contract?
> * whether a workaround can eventually be removed?

If yes, the documentation is doing its job.

If the comment mainly tells me **what happened six months ago**, it probably is not.

---

# DO NOT — Non-Negotiable Audit Guardrails

This is a **documentation audit first and a documentation remediation effort second**. It is not an open-ended refactor.

All agents and sub-agents participating in this workflow must operate within the following constraints.

### Do not treat existing documentation as authoritative

Existing comments, READMEs, MDX content, handoff notes, and architectural explanations are **claims to be verified**, not sources of truth.

The current implementation and demonstrable repository behavior take precedence.

Do not propagate a statement merely because another file repeats it.

Ten copies of the same stale comment are still stale.

---

### Do not “correct” the code to make an old comment true

If documentation disagrees with implementation, investigate the discrepancy.

Do **not** modify functioning code simply because doing so would restore consistency with an existing comment or document.

Determine which side reflects current intent first.

Documentation remediation must not silently become behavioral remediation.

---

### Do not make unrelated functional changes

While examining documentation, agents will inevitably notice code that could be:

* cleaner;
* shorter;
* faster;
* more elegant;
* more type-safe;
* more abstract;
* reorganized;
* refactored.

Those observations are **out of scope unless they directly affect the truthfulness or maintainability of the documentation being audited**.

Record worthwhile findings separately.

Do not opportunistically refactor the application.

---

### Do not delete comments merely because they are long

Length is not the defect.

A long comment may be entirely justified when it captures:

* a subtle architectural constraint;
* an unavoidable compatibility workaround;
* a dangerous failure mode;
* a non-obvious browser behavior;
* a pedagogical dependency;
* an important deletion condition.

Likewise, a one-line comment can be useless.

Judge comments by **information value and durability**, not word count.

---

### Do not mechanically apply “comments should explain why, not what”

That principle is useful, not absolute.

Some code—particularly generated configuration, AST manipulation, build-system workarounds, browser APIs, service workers, and integration glue—may require a concise explanation of **what is happening before the why becomes understandable**.

Context determines the appropriate documentation.

Do not optimize for slogans.

---

### Do not erase useful reasoning in the name of cleanup

When a comment contains both valuable architectural reasoning and stale historical detail, **separate the two**.

Preserve the durable reasoning.

Remove or relocate the archaeology.

Do not reduce:

> “Here is why this strange implementation must exist.”

to:

> “Workaround.”

The goal is not minimal comments.

The goal is durable understanding.

---

### Do not preserve history inline simply because it is interesting

`WAS:` / `NOW:` narratives, old bundle sizes, migration stories, discarded implementations, debugging chronicles, and benchmark investigations may be valuable historical records.

That does not automatically make the source file their correct home.

Preserve history elsewhere when useful.

Inline source documentation should primarily explain the **current system**.

---

### Do not convert uncertain assumptions into confident documentation

If an agent cannot establish why something exists, it must not invent a plausible explanation.

Use:

> **UNVERIFIED — requires confirmation**

or escalate the finding to the orchestrating agent.

A missing explanation is preferable to a convincing fiction.

---

### Do not silently broaden claims

If the implementation demonstrates that something works in one specific context, do not rewrite the comment as though it were universally true.

Preserve relevant boundaries:

* browser;
* package version;
* course;
* route;
* platform;
* build mode;
* device architecture;
* deployment environment.

Documentation must be at least as precise as the behavior it describes.

---

### Do not retain exact measurements as timeless facts without justification

Byte counts, file counts, percentages, lesson counts, bundle sizes, timing measurements, and similar values should be treated as **snapshots unless the repository enforces them**.

Do not preserve them merely because they once justified a decision.

Either:

* verify that the value remains relevant;
* make it reproducible;
* move it to historical/performance documentation;
* or replace it with the durable conclusion it originally supported.

---

### Do not use comments as a substitute for enforceable invariants

When documentation says things such as:

> “Keep these two lists synchronized.”

> “If this route changes, change this constant too.”

> “There must be one entry per lesson.”

investigate whether the relationship can instead be:

* derived;
* generated;
* shared;
* asserted;
* tested;
* linted;
* validated at build time.

Do not automatically implement such architectural changes during the documentation pass, but **flag them explicitly as AUTOMATE / VALIDATE candidates**.

The audit should expose fragile manual contracts, not merely rewrite their warning labels.

---

# Multi-Agent / Sub-Agent Coordination Guardrails

This part is especially important.

### Do not allow agents to invent their own documentation standard

Every sub-agent must operate from **this same audit rubric**.

Individual agents may identify context-specific considerations, but they must not independently redefine what counts as good documentation.

The orchestrating agent owns the standard.

---

### Do not let multiple agents independently rewrite the same source area

Parallelize **inspection** aggressively.

Parallelize **edits** cautiously.

Each file or clearly defined source region should have one remediation owner at a time.

Otherwise two locally sensible rewrites can:

* contradict one another;
* use different terminology;
* duplicate explanations;
* remove context another agent depended upon;
* create merge conflicts;
* produce inconsistent documentation styles.

---

### Do not let sub-agents make repository-wide conclusions from one file

A sub-agent inspecting one component can report:

> “This appears duplicated elsewhere.”

It should not conclude:

> “This is the canonical implementation.”

until the wider repository has been checked.

Local evidence produces local findings.

Repository-wide claims require repository-wide evidence.

---

### Do not let agents resolve cross-file contradictions independently

When two sources disagree, the discrepancy must be surfaced to the orchestrating agent.

Do not allow Agent A to rewrite file A around one interpretation while Agent B rewrites file B around another.

Cross-file contradictions require **central reconciliation**.

---

### Do not allow audit findings to disappear inside edits

Every substantive remediation should trace back to an identified finding.

The workflow should retain enough record to answer:

> What was wrong?

> Why was it changed?

> What principle justified the change?

> Was behavior affected?

An agent should not quietly “clean up a few other comments while it was there.”

---

### Do not permit undocumented scope expansion

If an agent discovers something outside the assigned documentation scope—such as:

* an actual functional bug;
* broken route;
* security concern;
* dead dependency;
* questionable architectural decision;
* performance regression;
* stale package;
* failing build assumption—

**surface it separately.**

Do not silently fix it unless the orchestrator explicitly expands the task.

A documentation audit may uncover engineering work.

That does not make all discovered engineering work part of the documentation audit.

---

### Do not confuse duplicated effort with verification

Multiple agents may inspect particularly important areas independently when deliberate cross-checking is useful.

But accidental duplication is waste.

The orchestrator should know:

* who owns each repository region;
* which areas deliberately receive a second review;
* which findings require cross-agent reconciliation.

Parallelism should increase coverage, not chaos.

---

### Do not accept a sub-agent’s conclusion merely because it sounds technically sophisticated

Every important finding must be grounded in repository evidence.

Agents are researchers in this workflow, not authorities.

The orchestrator remains responsible for synthesizing and challenging their conclusions.

---

### Do not begin remediation before enough of the audit exists to understand the pattern

This one matters enormously.

If the first agent encounters a giant `WAS/NOW` comment and immediately rewrites it, but later agents discover that the same historical narrative is intentionally duplicated across three courses, we have acted before understanding the architecture.

Perform enough reconnaissance to identify:

* recurring documentation patterns;
* copied structures;
* shared conventions;
* systemic problems;
* canonical sources;

before initiating broad remediation.

**Understand globally before optimizing locally.**

---

### Do not make agents communicate only through modified files

Sub-agents should return **findings and reasoning**, not just patches.

For significant findings, the orchestrator needs:

* location;
* evidence;
* classification;
* reasoning;
* risk;
* proposed disposition.

A diff can show **what changed**.

It cannot reliably communicate **why the agent believed it should change**.

---

# Absolutely Do Not

> **Do not fabricate intent. Do not trust stale prose over current implementation. Do not turn documentation cleanup into an unrequested refactor. Do not allow parallel agents to establish conflicting truths. Do not erase valuable reasoning merely to reduce comment volume. Do not preserve historical noise merely because somebody once took the time to write it. Do not leave manually enforced invariants unflagged. And do not consider the work complete until the repository reads coherently as one system rather than as the accumulated output of multiple independent agents.**

> **The agents may divide the repository. They may not divide reality.**
>
> Each agent investigates a bounded portion of the system, but the final documentation must describe one coherent codebase. The orchestrating agent is responsible for reconciling terminology, architecture, cross-file relationships, duplicated explanations, and contradictory findings before the audit is considered complete.
