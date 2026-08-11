# global-docs

Shared documentation for the three-part Termux tutorial series. Versioned
separately from the course repos because these outlive any one of them.

```text
audits/
  beginner/         three audits of termux-tutorial-for-beginners
  intermediate/     three audits of termux-tutorial-intermediate
  advanced/         (empty)
  repo/             audits whose subject is the monorepo, not one course
walkthroughs/       first-run walkthroughs: reading a course as a learner
strategy/           curriculum scope for all three courses
archive/            point-in-time working documents, superseded but kept
```

## Naming

`audits/<scope>/<YYYY-MM-DD>-<kind>.md`, where scope is a course or `repo`, and
kind is one of:

| Kind | What it covers |
| :--- | :--- |
| `comprehensive` | Content accuracy, structure, CSS, a11y, performance, SEO, config |
| `visual` | The rendered pages — DOM measurements and screenshots at real viewports |
| `lesson-flow` | Sequence, prerequisites, forward references, the prev/next chain |
| `documentation` | Every documentation surface — inline comments and markdown — against the implementation |

Repo-scoped audits come in two files, because the summary and the evidence serve
different readers: `<date>-<kind>.html` is the report you read, and
`<date>-findings.md` is the raw per-region output you consult before changing a
specific comment. The HTML is the one exception to the markdown convention —
it carries severity encoding and a theme-aware palette that markdown cannot.

The date is when the audit **ran**, not when its findings were fixed. Findings
are closed in place inside the report, with a note explaining the fix — so a
report is both the original finding and its resolution history. Do not delete a
closed finding; the record of what was wrong is the point.

## Status

| Course | Comprehensive | Visual | Lesson flow | Walkthrough |
| :--- | :--- | :--- | :--- | :--- |
| Beginner | ✅ all findings closed | ✅ all closed | ✅ all closed | ✅ 2026-08-10, all 6 closed |
| Intermediate | ⚠️ open | ⚠️ M1/M2 withdrawn; M3–M5 closed | ⚠️ open | — |
| Advanced | — | — | — | — |

### Repo-scoped

| Audit | Scope | State |
| :--- | :--- | :--- |
| `repo/2026-08-11-documentation` | All four projects: inline comments + markdown | ⚠️ **414 findings, none remediated.** 82 P1 (comment contradicts code), 47 P2. Four decisions outstanding before remediation — see the report's closing section. |

That audit's own findings include this file: the tree above described the
advanced course as non-existent while the course shipped nine lessons. Corrected
here because leaving it while adding an index entry beside it would be
incoherent; everything else it found is still untouched and awaiting the
remediation pass.

**Withdrawn findings.** Two Critical/High items in the intermediate visual audit
(M1 "no React island renders", M2 "no terminal markup anywhere") were artifacts
of a dev server with a stale Vite cache, and are withdrawn in place with the
evidence that disproved them. A correction banner sits above that report's
executive summary, which was written on the strength of both. Their neighbours
M3–M5 were real and are now fixed.

The beginner audits are complete: every finding carries a `✅ CLOSED` marker and
a comment describing the fix. The intermediate audits ran on 2026-08-09 against a
course written in a single pass; the Critical and High findings were closed on
2026-08-10 (identity, the battery-check filename mismatch, the tunnel bind
address, the two stub reference pages, code-block overflow), and the Medium and
below remain open.

## Reading order for the intermediate work

1. `audits/intermediate/2026-08-09-comprehensive.md` — start with its executive
   summary; the three Critical findings are the ones that matter.
2. `audits/intermediate/2026-08-09-visual.md` — measured at 390 / 768 / 1440px.
3. `audits/intermediate/2026-08-09-lesson-flow.md` — the chain between lessons.

## A caveat worth carrying

Two of these reports were produced by multi-agent workflows in which some
agents received a malformed prompt and audited the wrong repository. That was
caught and the affected audits were re-run, but it is the reason every finding
in these reports is required to carry a file path, a line number and a quoted
excerpt: a finding you cannot point at is a guess. Treat any finding lacking
that evidence with suspicion, whoever wrote it.
