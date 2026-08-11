# One command, one port, one URL — how the dev entry point was built

**Date:** 2026-08-11 · **Touches:** `scripts/*.mjs`, `package.json`, four `astro.config.mjs`, `.github/workflows/deploy.yml`

This file is the **archaeology**. The rules it produced live inline, next to the
code that depends on them; what is recorded here is the reasoning and the
failures, which are worth keeping and are not worth a maintainer scrolling past
every time they open `dev.mjs`.

If you are here because an inline comment pointed you at this file, the thing
you want is probably in "The four failures" below.

---

## The problem

Four Astro projects meant four `npm run dev`s on four ports. The one thing the
series is built around — walking from the hub into a course and back via the
switcher — could not be done on any of them.

Those links are absolute (`/termux-tutorial/advanced/…`) and resolve only when
all four projects sit under one origin. Before this work that arrangement
existed in exactly one place: inside the deploy workflow, in CI, after a push.
**So the primary navigation of the site was its least testable part**, and "does
the switcher work" was a question answered by reading code rather than by
clicking.

## The shape of the fix

A reverse proxy on one port, routing by the *same* path prefixes GitHub Pages
uses. Each child dev server already serves at its own `base`, so paths pass
through untouched — no rewriting, no `basePath` trickery. The URL in the address
bar locally is character-for-character the production URL.

```
localhost:4321/termux-tutorial/            -> hub          (:4331)
localhost:4321/termux-tutorial/beginner/   -> beginner     (:4332)
localhost:4321/termux-tutorial/advanced/   -> advanced     (:4334)
```

The four internal ports are an implementation detail nobody visits.

## The four failures

Each of these produced a rule that is now enforced or documented in place. The
story is here; the rule is in the code.

### 1. HMR cannot be routed by page path

Vite builds its HMR socket URL from `server.hmr.path`, **not** from the page's
base, and the default is `/`. So all four dev servers told the browser to open
`ws://localhost:4321/`. Four identical URLs cannot be told apart by a proxy, and
Vite stamps a per-server token on the handshake — so the three that reached the
wrong server were *rejected*, not merely confused.

The symptom would have been the nasty kind: the hub hot-reloads, the three
courses silently stop, nothing in any terminal, one line in a browser console.
That reads as "HMR is flaky", never as "a string is wrong".

**Rule now enforced:** each project declares a unique `vite.server.hmr.path`
(`/@hmr/<id>`), and `scripts/check-hmr.mjs` — a CI gate and a `npm run dev`
precondition — fails if a config and `scripts/projects.mjs` disagree.

### 2. Bind the public port before spawning anything

The first version started the four dev servers and bound the proxy last. A
second `npm run dev` would therefore start four servers, fail to bind, and then
run its shutdown — and shutdown stops servers by asking *Astro* to, which finds
them by lock file rather than by who spawned them.

**The second supervisor's cleanup killed the first supervisor's servers.** A
healthy session started returning 502s because of a command that had already
exited. This actually happened during development, not in theory.

**Rule now in code:** `claimPort()` runs before any child is spawned, and the
signal/exit handlers that perform teardown are registered only *after* the bind
succeeds — so a port conflict costs the running session nothing.

### 3. `--ignore-lock` is rejected in background mode

Astro 7 runs `astro dev` in the foreground normally but daemonizes it when it
detects a non-TTY or an AI-agent environment. In background mode it refuses
`--ignore-lock` outright, because the lock file is how `astro dev stop` finds
the server it started.

All four projects failed to launch — and the supervisor's log filter had
discarded the message saying so, reporting a 90-second timeout instead.

**Two rules:** no `--ignore-lock` (stale locks are cleared by an `astro dev
stop` sweep before startup instead), and child output is buffered whole and
printed on failure. Quiet on success, complete on failure: a filter cannot know
in advance which line will turn out to be the one you needed.

### 4. Astro binds IPv6 loopback, not `127.0.0.1`

Dialling the IPv4 literal got `ECONNREFUSED` against servers that were up and
answering — ports showing as `LISTENING` in `netstat` while every request
failed, which is a genuinely confusing pair of symptoms.

**Rule now in code:** the proxy dials `localhost` and lets Node try both
families.

## Deletion conditions

These workarounds are tied to specific behaviour and should not outlive it:

| Workaround | Remove when |
| :--- | :--- |
| Buffer-and-print child output | Never — this one is just correct |
| No `--ignore-lock` | Astro accepts it in background mode |
| Poll the port for readiness rather than tracking the child | Astro stops daemonizing, or exposes a ready signal |
| Unique `hmr.path` per project | Vite routes HMR by base, or the projects stop sharing a port |
| `HOST = 'localhost'` | Never — this is correct regardless of which family binds |

Vite 8 deprecates `server.hmr.*` in favour of `server.ws.*`. When that migration
happens it touches four configs **and** the regex in `scripts/check-hmr.mjs`,
which currently recognises only the `hmr` spelling.

## What was replaced

Assembly used to be inline shell in `deploy.yml`, and the cross-course link
check read `_site/index.html` and nothing else — a single page, and the one
least likely to be wrong, since the hub generates its links from a manifest.
Every hand-authored cross-course link in every lesson went unchecked.

`scripts/assemble.mjs` and `scripts/check-assembled-links.mjs` now run the same
way locally and in CI, both reading the layout from `scripts/projects.mjs`.

## The limit of the manifest, stated honestly

`scripts/projects.mjs` is read by the dev proxy, the assembler, the link checker
and the HMR guard. It is **not** read by `.github/workflows/deploy.yml` (which
hand-enumerates cache paths and per-project steps) or by
`hub/src/lib/courses.ts` (which hardcodes the course ids it renders).

Adding a course therefore means editing the manifest *and* those two files, and
nothing enforces the pairing. Making CI derive its matrix from the manifest is
the obvious next step and has not been taken.
