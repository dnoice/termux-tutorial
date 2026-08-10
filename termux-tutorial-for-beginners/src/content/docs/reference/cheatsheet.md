---
title: Command Cheatsheet
description: Every command from the beginner course in one scannable reference.
sidebar:
  order: 1
# Utility page, not a step: keep it out of the prev/next chain.
prev: false
next: false
---

Every command from the course, on one page, ready to grab in a hurry. Each
section links back to the lesson that teaches it, so you can go from "what was
that flag again?" to the explanation in one tap. Bookmark it — future-you in the
middle of something will thank present-you.

<!-- src/styles/print.css strips the nav, sidebars, terminals and the
     lesson-complete control, so this page prints as a clean reference card —
     but nothing on the site said so. `tmx-no-print` is the class print.css
     hides, which keeps the button from printing itself onto the card. -->
<div class="not-content tmx-no-print" style="margin-block: var(--space-block);">
  <button type="button" class="tmx-btn tmx-btn--ghost" onclick="window.print()">
    Print this card
  </button>
</div>

## Shell

Taught in [Upgrade Your Shell to Fish](/start/friendly-shell/).

| Command | Does |
| :------ | :--- |
| `pkg install fish` | Install the fish shell |
| `chsh -s fish` | Make fish your login shell (restart Termux via the notification's **Exit**) |
| `chsh -s bash` | Go back to bash |
| `bash` | Drop into a one-off bash session — for tutorials written for bash |
| `exit` | Leave that session (or close the current Termux session) |

## Packages (`pkg`)

Taught in [Package Management with pkg](/foundations/packages/).

| Command | Does |
| :------ | :--- |
| `pkg update` | Refresh package lists (run first) |
| `pkg upgrade` | Update installed packages |
| `pkg update && pkg upgrade` | Both, second only if the first succeeded |
| `pkg install <name>` | Install a package |
| `pkg uninstall <name>` | Remove a package |
| `pkg search <term>` | Search for packages |
| `pkg list-installed` | List installed packages |

Answering the prompts: `y` for **"Do you want to continue?"** — but **Enter**
(keep your version) for anything mentioning a *configuration file*.

## Shell syntax

The punctuation, as opposed to the commands. Taught in [Installing Termux
Safely](/start/installing/) and [Files &
Folders](/foundations/files-and-folders/).

| Symbol | Means |
| :----- | :---- |
| `&&` | *"and if that worked, then do this"* — the second half is skipped when the first fails |
| `>` | Send output into a file, **overwriting** it |
| `>>` | Send output into a file, **appending** to it |
| `~` | Your home directory |
| `$NAME` | The value stored under that name (`$PREFIX`, `$HOME`) |
| `.` / `..` | Here / the folder above here |

## Navigation

Taught in [Navigating the Filesystem](/foundations/filesystem/).

| Command | Does |
| :------ | :--- |
| `pwd` | Print current directory |
| `ls` | List files |
| `ls -a` | List all files, including hidden |
| `ls -l` | Long listing (sizes, permissions, dates) |
| `cd <dir>` | Enter a directory |
| `cd ..` | Go up one level |
| `cd` / `cd ~` | Go home |
| `echo $PREFIX` | Print where installed packages live |

## Files & folders

Taught in [Files & Folders](/foundations/files-and-folders/).

| Command | Does |
| :------ | :--- |
| `mkdir <dir>` | Make a directory |
| `mkdir -p <a/b/c>` | Make it and any missing parents; no error if it exists |
| `touch <file>` | Create an empty file |
| `cat <file>` | Print a file's contents |
| `echo "text" > <file>` | Write text to a file, **overwriting** it |
| `echo "text" >> <file>` | Append text to a file |
| `cat > <file>` | Take pasted input, then **Ctrl-D** (Vol-Down + D) to save |
| `cp <src> <dst>` | Copy (`-r` for folders) |
| `mv <src> <dst>` | Move or rename |
| `rm <file>` | Delete a file |
| `rm -r <dir>` | Delete a directory and its contents |
| `chmod +x <file>` | Make a file runnable — then `./<file>` to run it. *Not drilled in a lesson; it comes up in [Where to Next](/where-next/)'s first project.* |

:::caution
`rm` is permanent — there's no recycle bin. `ls` the path first, especially with
`rm -r`, and never type `-rf` on autopilot. `rm -rf $PREFIX` deletes every
package you have installed; `rm -rf ~` deletes everything you've written.
:::

## Archiving & backup

Taught in [Files & Folders](/foundations/files-and-folders/) and
[Bridging Android Storage](/foundations/storage/).

| Command | Does |
| :------ | :--- |
| `tar czf <archive.tar.gz> -C <dir> <name>` | Pack a folder into one compressed file |
| `tar tzf <archive.tar.gz>` | List what's inside, without unpacking |
| `tar xzf <archive.tar.gz>` | Unpack it |

The full backup habit — the archive **and** the package list, because
uninstalling Termux takes both:

```bash
mkdir -p ~/storage/shared/termux-backups
tar czf ~/storage/shared/termux-backups/projects-backup.tar.gz -C ~ projects
pkg list-installed > ~/storage/shared/termux-backups/packages.txt
```

## Storage & device

Taught in [Bridging Android Storage](/foundations/storage/) and
[Optimizing the Keyboard](/foundations/extra-keys/).

| Command | Does |
| :------ | :--- |
| `termux-setup-storage` | Bridge Termux to Android shared storage |
| `termux-reload-settings` | Apply changes to `termux.properties` |
| `termux-change-repo` | Switch package mirror when updates fail |

## Shell keys

Taught in [Your First Session](/start/first-session/). Third column is what to
press when the key isn't on your soft keyboard — which is all of them.

| Command / key | Does | On a phone |
| :------------ | :--- | :--------- |
| `whoami` | Show your username | — |
| `clear` | Clear the screen | — |
| `history` | Show past commands, numbered | — |
| **Ctrl-L** | Clear the screen | Vol-Down + L |
| **Ctrl-C** | Cancel the running command — **not** copy | Vol-Down + C |
| **Ctrl-D** | End input (saves a `cat >`) — or close the session | Vol-Down + D |
| **↑ / ↓** | Cycle through command history | Vol-Up + W / S |
| **Tab** or **→** | Accept the autosuggestion / auto-complete | Vol-Up + T / D |
| **Esc** | Leave insert mode in `vim`, cancel a menu | Vol-Up + E |

## Sessions & gestures

Taught in [Sessions, Copy & Paste](/start/sessions-and-copy-paste/). These are
app gestures, not commands — nothing to type.

| Do this | Get this |
| :------ | :------- |
| **Swipe in from the left edge** | The session drawer — every open shell, tap to switch |
| Drawer → **`NEW SESSION`** | Another shell, running alongside the first |
| **Long-press a session** in the drawer | Rename it |
| **Long-press the terminal** | Copy · Paste · More |
| Long-press → **More** → **Select URL** | Every link on screen, as a tappable list |
| **Swipe up** on the terminal | Scroll back through output `clear` pushed away |
| Notification shade → **Exit** | Quit Termux properly — ends **every** session |
| Notification shade → **Acquire wakelock** | Keep a long job alive with the screen off |
| `exit` | Close the current session only |

## Phone keys (no physical keyboard needed)

| Press | Acts as |
| :---- | :------ |
| **Volume Down** + letter | **Ctrl** + letter (e.g. Vol-Down + C = Ctrl-C) |
| **Volume Up** + `E` | **Esc** |
| **Volume Up** + `T` | **Tab** |
| **Volume Up** + `W` / `S` | **↑** / **↓** |
| **Volume Up** + `A` / `D` | **←** / **→** |
| **Volume Up** + `Q` or `K` | Toggle the extra-keys row |
| **Volume Up** + `L` | The pipe, &#124; |
| **Volume Up** + `H` | `~` |
| **Volume Up** + `U` | `_` |
| **Volume Up** + `B` / `F` / `X` | **Alt** + that letter |
| **Volume Up** + `1`–`9` / `0` | **F1**–**F9** / **F10** |
| **Alt** + `.` | Recall the last argument of the previous command |

With a Bluetooth or USB keyboard, none of that is needed — and you additionally
get **Ctrl-Alt-C** (new session), **Ctrl-Alt-N** / **Ctrl-Alt-P** (next /
previous), **Ctrl-Alt-1**…**9** (jump to a session) and **Ctrl-Alt-V** (paste).

## Key files

| Path | Purpose |
| :--- | :------ |
| `~` | Home directory — **where code goes**. Wiped on uninstall, so back it up. |
| `$PREFIX` | Where installed packages live. Also wiped on uninstall. |
| `~/storage/shared` | Android internal storage — documents, media, backups. **No permission bits: scripts can't run here.** |
| `~/.termux/termux.properties` | Termux interface settings (extra-keys, etc.) |

## Golden rules

1. **Install from one source** (F-Droid) — app *and* plugins.
2. **`pkg update` before installing** anything.
3. **Code lives in `~`; backups live in `~/storage/shared/`.** Shared storage
   has no exec bit — `chmod +x` silently does nothing there.

Finished the course? [Where to Next](/where-next/) has three projects that use
everything on this page.
