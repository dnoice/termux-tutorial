# Termux Tutorial

A three-part, hands-on Termux course for Android, with a live terminal built
into the lessons. All three courses live in **this one repository** and deploy
as **one GitHub Pages site**.

| Course | Directory | Published at | Status |
| :--- | :--- | :--- | :--- |
| **Beginner** | `termux-tutorial-for-beginners/` | `/termux-tutorial/` | 11 lessons, audited, complete |
| **Intermediate** | `termux-tutorial-intermediate/` | `/termux-tutorial/intermediate/` | 8 lessons, audited, fixes in progress |
| **Advanced** | `termux-tutorial-advanced/` | `/termux-tutorial/advanced/` | Not started |

Shared documentation — audits, walkthroughs, curriculum strategy — lives in
[`global-docs/`](global-docs/README.md).

## Why one repo

GitHub Pages publishes exactly one artifact per repository. Three repos would
have meant three sites, three base paths and three sets of cross-links that
could rot independently — and they already had: a misspelled sibling repo name
survived three separate audits because nobody could confirm which spelling was
real.

One repo, one site. `.github/workflows/deploy.yml` builds each course
separately, then assembles them:

```text
_site/                 <- beginner course (the site root)
_site/intermediate/    <- intermediate course
_site/advanced/        <- advanced course, when it exists
```

Each course keeps its own `package.json`, its own dependencies, its own build
guards and its own `base`. They are independent projects that happen to ship
together.

## Working on a course

`npm` commands run **inside a course directory**, never at this root:

```bash
cd termux-tutorial-for-beginners
npm install
npm run dev      # localhost:4321
npm run build    # curriculum guard + astro build + link check
npm run check    # typecheck
```

Read that course's `CLAUDE.md` first. Both are long, and both are load-bearing
— they record the decisions that are expensive to undo by accident.

## Before deploying

- [ ] **Settings → Pages → Source = GitHub Actions** (not "Deploy from a branch").
      The branch method runs Jekyll, which ignores `_astro/` because it starts
      with an underscore, and the whole site loses its CSS and JS.
- [ ] **The repo must be public**, or the account needs GitHub Pro. Pages does
      not publish from a private repo on the free plan.

## Two things that will bite

**Storage keys are deliberately not shared.** Every course is a path on one
origin, and `localStorage` is scoped to the origin, not the path. The beginner
course uses `tmx:beginners:v1` and the intermediate `tmx:intermediate:v1`; a
well-meaning consolidation would make each course silently overwrite the other's
progress and profile. `starlight-theme` is correctly shared — the rule is never
share *progress*, not never share storage.

**A course's own link checker cannot see its siblings.** Links between courses
resolve only in the assembled site, so `scripts/check-links.mjs` carries an
explicit `SIBLING_COURSES` allowlist. Add a course to it when it starts being
assembled, and not before — an entry for a course that is not deployed yet turns
a real 404 into a silent pass.

## History

Each course was developed in its own git repository before the move to a
monorepo. Those histories are preserved and readable:

```bash
git --git-dir=_pre-monorepo-history/termux-tutorial-for-beginners.git log --oneline
```

## Licence

See [LICENSE](LICENSE).
