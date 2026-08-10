---
title: Troubleshooting
description: Fixes for the most common problems beginners hit with Termux.
sidebar:
  order: 2
# Utility page, not a step: keep it out of the prev/next chain.
prev: false
next: false
---

Stuck? Most beginner problems fall into a handful of buckets. Find your symptom
below.

## A plugin (API, Styling…) does nothing

**Cause:** the plugin and the main app were installed from **different sources**,
so their [signature keys](/start/why-termux/#the-signature-key-rule)
don't match.

**Fix:** uninstall the plugin and reinstall it from the **same source** as the
main app (F-Droid for both is the easy path).

## F-Droid finds no results when I search for Termux

**Cause:** F-Droid's repository index hasn't finished downloading. On a first
run this takes minutes, not seconds, and it fails silently on a weak connection.

**Fix:** wait for "Updating repositories" to finish, then pull down on the app
list to refresh and search again. See [Installing Termux
Safely](/start/installing/).

## My prompt still shows `$` after `chsh -s fish`

**Cause:** the old shell session was never actually closed. Swiping Termux away
from Android's recent-apps screen does **not** stop it — it runs a foreground
service specifically so that won't kill it.

**Fix:** pull down the notification shade, find the Termux notification, and tap
**Exit**. Then reopen Termux from your launcher. The prompt should end in `❯`.
Still `$`? Another session was open — repeat. See [Upgrade Your Shell to
Fish](/start/friendly-shell/).

## Ctrl-V does nothing, and Ctrl-C killed my command instead of copying

**Cause:** neither shortcut means what it means everywhere else. In a terminal
`Ctrl-C` sends *interrupt* — it stops the running command — and `Ctrl-V` inserts
the next keystroke literally. Both meanings predate the copy/paste shortcuts by
decades, and terminals kept them.

**Fix:** **long-press the terminal** and use the **Copy** / **Paste** buttons
that appear. To select text, long-press on it first and drag the two handles.
See [Sessions, Copy & Paste](/start/sessions-and-copy-paste/).

## `pkg upgrade` asked me about a configuration file

**Cause:** a package ships a new default config and you (or a script) changed
the old one. dpkg is asking which to keep, with options `Y/I/N/O/D/Z`.

**Fix:** press **Enter**. That takes the default — `N`, keep your current
version — which is the safe answer until you know you want otherwise. Typing `y`
here **overwrites your own settings**, and it is *not* the same question as
apt's "Do you want to continue? [Y/n]", where `y` is correct.

## `pkg install` says "Unable to locate package"

**Cause:** your package lists are stale, or the name is misspelled.

**Fix:**

```bash
pkg update
pkg install <name>
```

If it still fails, run `pkg search <partial-name>` to find the exact package
name.

## "Permission denied" when touching files

There are **two** of these and they need opposite fixes. One question tells them
apart: *are you trying to **run** a file, or just read or write one?*

### You're reading or writing, and the path starts with `~/storage`

**Cause:** you haven't bridged Android storage yet, or you tapped Deny on the
permission dialog.

**Fix:** run `termux-setup-storage` and approve the Android dialog. If nothing
appears — because the command thinks it already ran — grant it by hand at
**Settings → Apps → Termux → Permissions → Files and media → Allow**, then run
`termux-setup-storage` again. See [Bridging Android
Storage](/foundations/storage/).

### You're trying to *run* a file that lives under `~/storage`

**Cause:** shared storage has **no Unix permission bits**. `chmod +x script.sh`
there reports success and changes nothing, so `./script.sh` says *Permission
denied* forever, no matter how many times you re-run `chmod`.

**Fix:** move it home and run it from there.

```bash
mv ~/storage/shared/script.sh ~/
chmod +x ~/script.sh
./script.sh
```

**Code lives in `~`; only backups belong in `~/storage/shared/`.**

## My scripts disappeared

**Cause:** they were in the private home directory (`~`), and Termux was
uninstalled or had its app data cleared. That folder is wiped in those cases.

**Fix (prevention):** keep working in `~` — it's the only filesystem where
scripts can actually run — and **back it up** to Android storage, which survives
uninstalls:

```bash
mkdir -p ~/storage/shared/termux-backups
tar czf ~/storage/shared/termux-backups/projects-backup.tar.gz -C ~ projects
pkg list-installed > ~/storage/shared/termux-backups/packages.txt
```

The `-C ~ projects` keeps the archive tidy — without it tar warns about
*"Removing leading '/' from member names"* and stores the full
`data/data/com.termux/…` path inside. The package list matters too: uninstalling
Termux takes `$PREFIX` with it, so a restore without it gives you back your code
and nothing to run it with.

Don't move your code itself into `~/storage/shared/` — that filesystem has no
exec bit, so nothing there will run. See [Bridging Android
Storage](/foundations/storage/).

## My session keeps dying in the background

This is the most common modern Termux complaint, and it usually has **two**
separate causes. Try them in this order.

### 1. The phantom-process killer (Android 12 and newer)

**Cause:** Android 12+ silently kills any app that runs more than ~32 child
processes, and Termux's whole job is running child processes. Battery settings do
**not** affect this. If you're on Android 12+, this is probably your problem.

**What you can do right now, with just the phone:**

- **Keep long-running work in the foreground.** Leave Termux on screen while it
  runs. The killer targets processes Android considers abandoned.
- **Acquire a wakelock** from the Termux notification (pull down the shade and
  tap **Acquire wakelock**). It doesn't defeat the phantom-process killer, but
  it stops the *other* cause below.
- **Expect the limit.** Prefer one long job to thirty short ones, and don't be
  surprised when a big `pkg upgrade` or a parallel build gets cut off.
- **Check your OEM's own killer.** Settings → Apps → Termux → Battery →
  **Unrestricted** (see below).

**The only complete fix, and it needs a computer.** Some devices also expose a
toggle at **Settings → Developer options → Feature flags →
`settings_enable_monitor_phantom_procs`** — check there first, because it's
free. Otherwise:

1. On the phone: **Settings → About phone**, tap **Build number** seven times
   until it says you're a developer.
2. **Settings → System → Developer options → USB debugging** → on.
3. On a computer, install **ADB** (Android's platform-tools) and plug the phone
   in. Approve the "Allow USB debugging?" prompt on the phone.
4. Then run:

   ```bash
   adb shell "/system/bin/device_config set_sync_disabled_for_tests persistent"
   adb shell "/system/bin/device_config put activity_manager max_phantom_processes 2147483647"
   ```

The setting can reset after a reboot or a system update, so you may need to
reapply it. None of this is your fault or a sign you did something wrong — it's
an Android policy Termux has no way to opt out of.

### 2. Battery optimisation

**Cause:** Android is putting Termux to sleep to save power.

**Fix:** in **Settings → Apps → Termux → Battery**, set it to **Unrestricted**
(wording varies by manufacturer). Worth doing regardless — but on Android 12+ it
will not fix phantom-process kills on its own.

Long-running background tasks — wakelocks, `termux-wake-lock`, services and
scheduling — are covered properly in the **Intermediate course**, which is the
natural next step from here. [Where to Next](/where-next/) has the link.

## Updates fail or repositories error out

**Cause:** the mirror your install points at is down, stale, or unreachable from
your network.

**Fix:** switch to a different mirror. The premise here is that `pkg update` is
already failing, so the fix starts with the mirror switch, not with the command
that just broke:

```bash
termux-change-repo
```

That opens a blue full-screen menu — an ncurses dialog, not a normal prompt, and
it is nobody's idea of obvious:

1. Move with the **arrow keys** (**Volume Up + W / S**) or the volume keys.
2. Press **Space** to tick `Main repository`.
3. Press **Enter** to confirm.
4. Pick a mirror group near you, and **Enter** again.

When it exits you are back at a normal prompt. *Now* run:

```bash
pkg update
```

Still failing? Run `termux-change-repo` again and pick a different group — some
mirrors are simply down.

## The live sandbox on this site won't boot

**Cause:** the page isn't cross-origin isolated yet, or your browser is older.

**Fix:** refresh the page once (the service worker needs one load to activate),
then press **Boot Linux** again. Use a current version of Chrome, Edge, or
Firefox. The practice terminals throughout the course work regardless — the live
sandbox is optional in every lesson.

## Still stuck?

- Re-read [Why Termux (not the Play Store)](/start/why-termux/) — most odd behaviour traces back to install source.
- Ask the community: the official [Termux Wiki](https://wiki.termux.com) and
  [r/termux](https://www.reddit.com/r/termux/) are friendly and active.
