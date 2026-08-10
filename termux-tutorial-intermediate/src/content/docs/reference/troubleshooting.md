---
title: Troubleshooting
description: Fixes for the failures this course actually produces — hanging API commands, jobs Android killed, and tunnels that will not stay up.
sidebar:
  order: 2
# Utility page, not a step: keep it out of the prev/next chain.
prev: false
next: false
---

The failures this course reliably produces, and what each one actually means.
They are ordered by how often they happen, not by how serious they are.

## A `termux-*` command hangs forever

You run `termux-battery-status` and nothing comes back. No error, no prompt, no
new line — it just sits there until you press **Ctrl-C** (Volume Down + C).

**This is the single most common failure in this course, and the hang *is* the
error message.** A `termux-*` command is only the client half; it opens a socket
and waits for the Termux:API app to answer. If nothing is listening, it waits
forever rather than failing, which is why it looks like your phone froze.

Three causes, in order of likelihood:

1. **The Termux:API app is not installed.** `pkg install termux-api` installs
   the *commands*; the app is a separate install from F-Droid. You need both.
2. **The app and Termux came from different sources.** F-Droid and GitHub builds
   are signed with different keys, and Android will not let them talk. Same
   source for the app and every plugin — no exceptions. Uninstall and reinstall
   the odd one out.
3. **The app is installed but was never opened.** Open it once from the launcher.

## A permission prompt never appears, and the command fails

The first `termux-battery-status` should raise an Android permission dialog. If
you dismissed it once, Android may not ask again.

Grant it by hand: **Settings → Apps → Termux:API → Permissions**. Location and
camera are the two that most often need this, and location additionally needs
the system location toggle on — the permission alone is not enough.

## `termux-location` returns nothing, or takes forever

A GPS fix needs sky. Indoors it can take minutes or never arrive.

Try `termux-location -p network` for a fast, coarse fix from Wi-Fi and cell
towers. It is accurate to a few hundred metres and returns in seconds, which is
usually what a script actually wants.

## `Permission denied` when running your own script

You wrote it, so you may run it — but the file is not marked executable yet:

```bash
chmod +x ~/bin/battery-check
```

If it still fails, the shebang is wrong. Termux is not at `/bin`:

```bash
#!/data/data/com.termux/files/usr/bin/bash
```

`#!/bin/bash` is the single most common copy-paste error from desktop tutorials.

## The script runs by hand but does nothing from cron

Almost always `PATH`. Cron runs with a nearly empty environment, so a command
you type every day is simply not found — and cron discards the error.

Two fixes, and you want both:

```bash
# Capture what happened, so the next failure is not silent.
0 7 * * * $HOME/bin/battery-check >> $HOME/cron.log 2>&1
```

```bash
# Set PATH at the top of the crontab, above the schedule lines.
PATH=/data/data/com.termux/files/usr/bin
```

Then read `~/cron.log`. A cron job with no log is a cron job you cannot debug.

## Cron worked for a day, then quietly stopped

This is Android, not cron. **Doze**, battery optimisation and the
phantom-process killer all stop background work, and none of them tell you.

- Exempt Termux from battery optimisation in Android settings.
- Keep the Termux notification alive — swiping the app away kills the session.
- For work that must survive, prefer `termux-job-scheduler` over cron: it is the
  Android-native scheduler, so the system schedules it rather than fighting it.
- Hold `termux-wake-lock` around genuinely long jobs, and release it after.

Expect scheduled work on Android to be best-effort. A job that must run exactly
on time belongs on a machine that is not a phone.

## `sv-enable crond` says the service does not exist

You installed `termux-services` and did not restart Termux. The supervisor only
picks up new service definitions at launch, and "restart" means **Exit from the
notification**, not swiping the app away.

Then `sv-enable crond`, and `sv status crond` to confirm.

## `Address already in use`

Something is still on that port — usually a server you started earlier and never
stopped.

Pick another port (`8000`, `8081`), or find and stop the old one. Note that
ports **below 1024 will never work** in Termux: they are privileged and Termux
has no root. That is not a bug to work around.

## The server works over Wi-Fi but not through the tunnel

Check in this order, because the answer is usually the first one:

1. **Is the server still running?** The tunnel is a pipe to something. If the
   server stopped, the tunnel returns 502.
2. **Is it bound where the tunnel expects?** `--bind 127.0.0.1` is correct for a
   tunnel — `cloudflared` connects from the phone itself.
3. **Only then suspect the tunnel.** This is exactly why the local-server lesson
   comes first: it lets you tell the two apart.

## The tunnel URL stopped working

Quick-tunnel URLs are ephemeral. Closing `cloudflared`, losing the network, or
the phone sleeping all end the tunnel, and you get a **new URL** next time. Any
link you shared is dead.

That is a feature — an accidental permanent public URL to your phone is worse.

## Something is still exposed and you are not sure what

**Ctrl-C** (Volume Down + C) in the session running the tunnel closes it, and
the same in the server's session stops the server. If you are unsure, the
Termux notification's **Exit** ends every session at once, which closes both.

Then confirm: the tunnel URL should stop resolving, and your phone's IP:8080
should stop answering on the local network.
