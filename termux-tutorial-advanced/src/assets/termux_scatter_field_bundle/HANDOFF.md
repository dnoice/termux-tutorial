<!--
✒ Metadata
    - Title: Scatter Field Continuation Handoff (digiSpace Edition - v1.0)
    - File Name: HANDOFF.md
    - Relative Path: HANDOFF.md
    - Artifact Type: docs
    - Version: 1.0.0
    - Date: 2026-08-05
    - Update: Wednesday, August 05, 2026
    - Author: Dennis 'dendogg' Smaltz
    - A.I. Acknowledgement: Anthropic - Claude Fable 5
    - Signature: ︻デ═─── ✦ ✦ ✦ | Aim Twice, Shoot Once!

✒ Description:
    Continuation briefing for the Linux/Android/Termux scatter-field design
    work, moving from Claude.ai chat into Claude Desktop Cowork. Records the
    full project state, the open design defects (led by the blown-out Tux
    anchor), the root cause of the review-pipeline gap that let them ship,
    and the corrected per-iteration visual workflow the Cowork session must
    follow so no iteration goes unreviewed at true opacity again.

✒ Key Features:
    - Complete artifact inventory with versions and lineage
    - Established design language and project conventions in one place
    - Open defect ledger: the solid-vs-stroke ink-mass imbalance, named and diagnosed
    - Honest root-cause account of why the review pipeline missed it
    - Mandatory per-iteration render-and-review workflow for the Cowork session
    - Licensing and attribution state, including the unresolved Termux GPLv3 flag

✒ Other Important Information:
    - Dependencies: none (documentation)
    - Compatible platforms: any Markdown renderer
    - Companion files: the five SVG deliverables and linux_android_icon_kit.zip
- - - - - - - - -
-->

# Scatter Field Continuation Handoff

Briefing for continuing the Linux/Android/Termux scatter-field design in
Claude Desktop Cowork. Everything the next session needs: state, defects,
the workflow correction, and where to start.

## Project Context

The scatter fields are hero-background assets for **Termux for Beginners** —
Dennis's browser-based Termux course site with a live fish sandbox terminal.
Tagline: "The phone in your pocket is a Linux computer that hasn't been
switched on yet." The site has dark (charcoal/gold) and light
(parchment/gold) themes; the fields sit behind the hero at watermark weight.

Design lineage: hand-drawn doodles (v1.0) → symbol polish (v1.1) →
Android/Termux identity pass (v1.2, guided by Dennis's principle: *"there is
a difference between imitate and obscure to the point of little
recognition"*) → open-license icon kit collected → v2 kit remix (current,
under critique).

## Artifact Inventory

| File | Version | State |
| ---- | ------- | ----- |
| `linux_scatter_field.svg` | 1.2.0 | Dark field, hand-drawn symbol set. Approved, in use on the site. |
| `linux_scatter_field_light.svg` | 1.1.0 | Light twin, geometry-identical. Approved. |
| `linux_scatter_field_v2.svg` | 1.0.0 | Kit remix — real brand marks. **Under critique; the working file for this continuation.** |
| `termux_linux_elements.svg` | 1.0.0 | "Termux Constellation" hero plate. Kept as a resource. |
| `linux_android_icon_kit.zip` | — | 69 open-license SVGs (Simple Icons CC0, Feather MIT, Wikimedia figures) + `SOURCES_AND_LICENSES.md`. |
| `HANDOFF.md` | 1.0.0 | This document. |

Dennis is also building his own Inkscape remix from the kit in parallel
(human lane). Merging his selections into the field is a standing goal.

## Established Design Language

- Canvas 1920x1080, radial charcoal gradient (`#171c23 → #13171d → #0f1217`);
  light twin uses parchment (`#faf6ec → #f4eee0 → #ebe3d1`), ink `#6b5f48`.
- Single ink color per variant (`#b7c5d3` dark) set on `g#watermark`, which
  also serves as the global dimmer.
- Role hierarchy in v2: solid brand-mark **anchors** (tier 0.11) / Feather
  outline **chorus** (0.085) / small glyph + texture **sprinkle** (0.06) /
  Termux-authentic text layer (`$PREFIX`, `pkg`, `sshd -p 8022`,
  `aarch64 Android` — no sudo, no systemd).
- Opacity always on wrapper `<g>` tiers, never on `<use>` — librsvg-family
  rasterizers silently drop `<use>` opacity (learned the hard way in v1.1.1).
- Jittered rotations (±3–20°), no two identical neighbors; zero-collision
  layout enforced by the checker script.

## Open Defect Ledger — Start Here

### 1. The blown-out Tux (and the whole defect class)

The v2 Tux anchor (solid `s-linux` glyph, scale 4.6, tier 0.11) reads far
heavier than everything around it. Root cause is general, not Tux-specific:
**a solid silhouette carries several times the ink mass per area of an
outline icon, so equal opacity does not produce equal visual weight.** All
five solid anchors (Tux, Android robot, Termux tile, Debian, Bash) are
suspect; Tux is worst because it is also the largest.

Candidate fixes to evaluate *visually, per iteration*:

- Drop the solid-anchor tier to ~0.055–0.07 while the outline chorus stays
  at 0.085 (mass-balancing: solids dimmer than strokes).
- Convert anchors to stroked outlines of the glyphs (loses the
  solid-vs-outline hierarchy but equalizes weight natively).
- Hybrid: keep one or two solids as intentional focal points, outline the
  rest.

Decide by looking, not by arithmetic — but the coverage metric below gives a
starting ratio.

### 2. Subtler nuances flagged for re-review

Dennis noted further nuances beyond the blow-out. Re-examine at true
opacity, 1:1 scale, in the first Cowork session:

- Android robot weight vs. the chorus (solid, same class of problem).
- Sprinkle uniformity — do the tiny brand glyphs read as texture or noise?
- Rotation rhythm — any accidental alignments or same-angle clusters.
- Anchor-to-text breathing room, especially Tux vs. the `ls -la` block.
- Signature glyph coverage: `︻` and `デ` render as tofu in some font
  stacks; per house rule, outline them to paths in the final.

## Why the Review Pipeline Missed It

Recorded so the next session does not rebuild the same blind spots:

- Chat-side image viewing was intermittent — several renders never reached
  the reviewing model at all, and verification fell back to geometry
  metrics (collisions, extents, quadrant means) that cannot judge aesthetics.
- The boosted-opacity inspection trick (multiply all opacities ~6–7x to make
  the faint field visible) amplifies every element **uniformly**, which is
  precisely the transform that hides *relative* weight imbalance. It
  validates shapes, never balance.
- cairosvg additionally drops `<use>` opacity (fixed in the files by tier
  wrappers, but it means cairosvg output needed double-checking all along).

Lesson: geometric verification and aesthetic review are different jobs. The
first was automated and honest; the second needs true-opacity eyes on every
iteration.

## Mandatory Cowork Iteration Workflow

No iteration is complete until step 4 has actually happened. This is the
"not flying blind" contract.

1. **Edit** `linux_scatter_field_v2.svg` (or its successor).
2. **Render at true opacity** with a renderer that honors the file:

   ```bash
   # preferred (honors group opacity, fast):
   rsvg-convert linux_scatter_field_v2.svg -w 1920 -o iter.png
   # or, since Inkscape is installed and is the ground truth for Dennis:
   inkscape linux_scatter_field_v2.svg --export-type=png -w 1920 -o iter.png
   # cairosvg only as fallback, knowing its <use>-opacity bug
   ```

3. **Generate the review set**, not just the full frame:
   - full field at 1:1;
   - a crop per anchor at 100–200% zoom;
   - per-tier isolation renders (each tier alone at true opacity);
   - the coverage report (below).
4. **View the review set** — Claude opens and inspects every image in
   Cowork before proposing the next change. If viewing fails, stop and hand
   the images to Dennis rather than proceeding on metrics alone (standing
   house rule).
5. **Judge weight balance explicitly**: does any element pull the eye before
   the composition does? Compare against Dennis's site screenshots for
   target subtlety.
6. **Record the iteration** — version bump + changelog line per the
   docstring standard once a change is kept.

### Perceptual-weight instrumentation

To give the review numbers as well as eyes, compute per-element **ink
coverage** — rendered at full opacity, the fraction of the element's
bounding box that is inked, times its tier opacity:

```text
visual_weight ≈ coverage × opacity
solid glyphs:   coverage ~0.35–0.6
outline icons:  coverage ~0.08–0.15
```

Equal weight therefore wants solids at roughly **1/4 to 1/6** of the outline
tier's opacity, not 1.3x above it as v2 shipped. Use this to seed the fix,
then confirm by eye — the metric proposes, the render disposes.

## Conventions That Govern (Quick Recall)

- Every artifact carries the full ✒ Metadata docstring; SemVer + changelog
  discipline on every kept edit.
- SVGs carry all five metadata layers (docstring, namespaces, `<title>`,
  `sodipodi:namedview` with dark pagecolor / no border / px units, RDF/DC
  block). The three pre-v2 fields predate this and carry only the
  docstring — sync them opportunistically, not urgently.
- Single flat layer, no Inkscape layers; groups welcome.
- Signature must render visibly on deliverables; outline `︻` (and any
  uncovered glyph) to paths when font coverage is doubtful.
- Identity anchors stay *recognizable* — imitate, never obscure to the
  point of little recognition.
- Token discipline: one attempt, one adapted retry, then pivot.
- Documentation files are named in UPPERCASE.

## Licensing and Attribution State

- Kit sources documented in `SOURCES_AND_LICENSES.md` inside the zip:
  Simple Icons (CC0), Feather v4.29.2 (MIT, Cole Bemis), Tux (Larry Ewing
  acknowledgment), Android robot (CC BY 3.0, Google's required wording).
- v2's header carries provisional attribution pointing at that document.
- **Unresolved flag:** the Termux mark geometry is GPLv3-only (from
  termux-app). v2 currently leans on nominative use; the final treatment is
  a decision for the joint attribution pass.
- The comprehensive per-deliverable attribution block gets written together
  once Dennis's Inkscape selections merge in — that pass is still pending.

## First Session in Cowork — Suggested Order

The bundle lives at
`...\projects\termux-tutorials\termux-tutorial-for-beginners\src\assets` —
note this is the course site's **live** `src/assets` tree, so iterate on
copies or version bumps, never scratch-edit the file the site is serving.

1. Load this file, the v2 SVG, and the icon kit into the working folder.
2. Stand up the render workflow (step 2 above); confirm Claude can open and
   see `iter.png` before touching the SVG.
3. Baseline review set of v2 as shipped — establish the "before."
4. Fix the anchor-weight defect (coverage metric to seed, eyes to confirm).
5. Walk the subtle-nuance list with Dennis's notes from his Inkscape pass.
6. Merge Dennis's kit selections; write the joint attribution block; bump
   to v2 1.1.0 with changelog.
