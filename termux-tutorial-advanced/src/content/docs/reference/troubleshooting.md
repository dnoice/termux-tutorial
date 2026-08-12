---
title: Troubleshooting
description: Fixes for the failures this course actually produces — black screens, missing sockets, and builds that will not link.
sidebar:
  order: 2
# Utility page, not a step: keep it out of the prev/next chain.
prev: false
next: false
---

The failures this course reliably produces, and what each one actually means.
They are ordered by how often they happen, not by how serious they are.

Two things before you start reading. **There is no practice terminal in this
course**, so every symptom below came off a real device — yours. And more of
these than in either earlier course are **your particular phone's opinion**
rather than something you typed wrong. Where that is the case, this page says
so instead of handing you another flag to try.

## `cannot open display`, or `Can't open display: :0`

The most common failure in this course by a wide margin, and it is almost never
a broken display server.

`DISPLAY` is one environment variable. `export` sets it for **that shell and
the things that shell starts**, and nothing else — so it is gone the moment you
open a second Termux session, log into the container, or come back tomorrow.

Read the error before you change anything, because the two forms mean different
things:

- **Nothing after the colon** — `DISPLAY` is unset. The client had no address
  at all.
- **A number after the colon** — it is set, and nothing is serving that number.

Then check the chain, in this order:

```bash
echo $DISPLAY
```

```bash
# Termux side: does the socket exist, and is it the number you asked for?
ls -l $TMPDIR/.X11-unix/
```

`DISPLAY=:0` needs a file called `X0` in that directory; `:1` needs `X1`. A
wrong number and a dead server produce nearly the same error text, which is why
this two-second check regularly saves an hour.

If the client that failed was **inside the container**, there is a third link
in that chain — the socket exists on the Termux side and the container cannot
see it:

```bash
# Container side: the same directory, under the name X clients look for
ls -l /tmp/.X11-unix/
```

Empty or missing there sends you to the `--shared-tmp` entry below.

To stop retyping it, put it where the shell will find it. Outside, in the fish
from course one:

```fish
set -Ux DISPLAY :0
```

Inside the container, which is bash:

```bash
echo 'export DISPLAY=:0' >> ~/.bashrc
```

That `~` is **Volume Up + H**. Note that the file is `/root/.bashrc` *inside
the rootfs* — it has nothing to do with your Termux home, and your fish config
is not involved.

## `command not found`, right after you watched it install

You installed on one side and you are standing on the other. It happens to
everyone, several times, in the first week.

`id -u` settles it: `0` means you are inside the container, a five-digit number
means Termux. The prompt says the same at a glance — `#` inside, `$` or your
fish prompt outside.

Three shapes, one cause each:

1. **Installed inside, running outside.** `/usr/bin` inside the container is a
   path Termux's `PATH` has never heard of.
2. **`pkg` typed inside.** Debian has no idea what `pkg` is; it is a Termux
   wrapper.
3. **The quiet one: `apt install` typed *outside*.** Termux has its own `apt`,
   so that command succeeds perfectly and installs Termux's copy of the
   package. No error, no warning. Half an hour later the container cannot find
   something you watched install.

The habit that makes the third one impossible is **`pkg` outside, `apt`
inside, always** — then a command on the wrong side fails loudly instead of
succeeding quietly. [Living in the Container](/container/living-in-it/) is the
lesson this comes from.

## It has been silent for minutes and you are sure it has hung

Usually it has not. The jobs that go quiet are all the same shape: tens of
thousands of small files, on phone storage, with PRoot stopping the process on
its way past every syscall.

- `proot-distro install` after the download finishes — that second phase is
  extraction, and it is the quietest part of the course.
- `du -sh` on the rootfs — it has to walk every one of those files to add them
  up.
- `apt install` inside the container, where unpacking is the expensive part.
- The **first** XFCE launch, which is writing `~/.config/xfce4` and building
  caches that later runs only read.

How to tell a slow job from a dead one, rather than guessing: open a second
session and watch a number move.

```bash
df -h $PREFIX
```

Run it, wait a minute, run it again. If `Avail` is falling, work is happening.
A warm phone is the other tell, and it is a reliable one.

The exception worth knowing: **two minutes into a first XFCE launch with
nothing at all on screen is a failure, not a slow start.** Waiting longer has
never fixed it. Go read the session's output.

## A black screen where the desktop should be

Black is not one bug, and the causes look identical from the outside.

Work **the chain in the desktop lesson first** — it is ordered so each test
rules out everything above it, which is what makes it fast. This page is the
longer catalogue: it covers that chain and the failures that turn up outside
it. Come back here when the chain clears and the screen is still black.

**Run the cheap test first.** From wherever you were about to start the
desktop — inside the container if that is where the session lives:

```bash
xdpyinfo | head -n 3
xclock
```

The `|` is **Volume Up + L**. That splits the problem in half in four seconds:

- **A clock appears** — the display path is fine. Your problem is XFCE, the
  session bus, or a second desktop. Causes 5, 7 and 8.
- **`Can't open display`** — the display path is broken. Causes 2 to 4.
- **`xdpyinfo` answers but nothing is ever drawn** — cause 6.

Then work the list. Each cause has one test, and none of them depends on the
others passing.

1. **Nothing has drawn on it yet, and black is correct.** An X server with no
   client connected is a black rectangle; that is what you asked for. *Test:*
   `xclock`. If a clock appears, the server was never the problem.
2. **The server is not running.** *Test:* on the Termux side, `pgrep -f
   termux-x11`. Nothing back means it died, was never started, or the session
   that owned it is gone. The Termux:X11 app showing its **PREFERENCES** screen
   means the same thing from the other side: nothing has connected to it.
3. **The container cannot see the socket.** *Test:* inside the container,
   `ls -l /tmp/.X11-unix/`. Empty or missing means you logged in without
   `--shared-tmp` — next entry.
4. **`DISPLAY` is unset or points at the wrong number.** *Test:* `echo
   $DISPLAY`, then compare it with the socket name tests 2 and 3 found — `:0`
   needs `X0`, `:1` needs `X1`.
5. **The session died on startup.** The app stays black while your Termux
   session has already returned you to a prompt. *Test:* read the **last** few
   lines of that session's output, not the first. The top of that wall is XFCE
   looking for services no phone has, and it is noise.
6. **Your device draws wrong.** The tell is a black screen **with a visible
   cursor**. *Test:* stop the server and start it again as `termux-x11 :0
   -legacy-drawing`. If colours are inverted rather than absent, `-force-bgra`
   is the same problem wearing a different hat. These flags exist because some
   phones genuinely render wrong, and there is no list of which ones — see
   [A Display Server on Android](/desktop/x11-server/).
7. **No session bus.** *Test:* `echo $DBUS_SESSION_BUS_ADDRESS` in the shell
   you started the desktop from. The `_` is **Volume Up + U**. Empty means XFCE
   half-starts — see two entries down.
8. **Android suspended the whole thing when you looked away.** Switching to the
   Termux:X11 app puts Termux in the background, where every one of these
   processes actually lives. *Test:* switch back to Termux and see whether the
   session's output starts moving again. Hold the wakelock from Termux's
   notification before you start, and expect it to cost battery.

Change one thing per attempt, in that order, and stop at the first failure.
Changing four things and getting a desktop teaches you nothing about which one
mattered.

## It worked yesterday, and `/tmp/.X11-unix` is empty inside the container

Yesterday you typed the flag.

```bash
proot-distro login debian --shared-tmp
```

`--shared-tmp` bind-mounts Termux's `$TMPDIR` onto the container's `/tmp`,
which is the one place on earth every X client looks for its socket. It is a
**login flag and nothing else** — there is no config file, no toggle, no
"remember this", and you cannot add it to a session that is already open. Exit
and log in again.

A plain `proot-distro login` gives the container its own empty `/tmp`. That is
the whole reason the flag exists — if the directory were shared anyway,
`--shared-tmp` would do nothing. Confirm it rather than take anyone's word for
it, this page included:

```bash
ls -l /tmp/.X11-unix/
```

Ten seconds of `touch /tmp/marker` inside and `ls $TMPDIR/marker` outside will
tell you which kind of login you are in before you build a desktop on top of
it.

## The desktop comes up, then behaves like a haunted house

Settings refuse to stick. `xfconf-query` cannot connect. Thunar or the settings
manager hang or die on launch. Something says *"Failed to connect to session
manager"*. Nothing anywhere says the word "bus".

**There is no session bus.** On a normal Linux desktop the login manager
creates one before your session starts; nothing here is a login manager, so
nothing creates one. XFCE's pieces find each other over that bus, so without it
you get half a desktop and no explanation.

```bash
echo $DBUS_SESSION_BUS_ADDRESS
```

Empty is the diagnosis. Start the session through `dbus-launch` instead of
starting `xfce4-session` or `startxfce4` bare:

```bash
dbus-launch --exit-with-session xfce4-session
```

If `dbus-launch` is itself *command not found*, you are missing the package
that provides it — `apt install -y dbus-x11` inside the container, `pkg install
dbus` out in Termux. They are different packages on different sides, as usual.

One related trap: `xfconf-query` run from a **different** Termux session fails
the same way, because that shell never inherited `DBUS_SESSION_BUS_ADDRESS`.
Run it from a terminal **inside** the desktop.

## Everything is microscopic and the panel buttons are unhittable

Nothing is broken. XFCE assumes about 96 dots per inch and a mouse; your phone
has four times that and a fingertip.

There are two separate dials and they do different things:

- **Termux:X11's own display scale** makes the display itself lower-resolution
  — fewer, larger pixels for everything. It lives in the app's preferences, and
  the exact wording moves between nightly builds, so look rather than trust a
  name.
- **XFCE's DPI** keeps the resolution and makes the interface bigger. Usually
  the one you want: **Settings → Appearance → Fonts → Custom DPI setting**,
  default 96, try 140.

From a terminal **inside the desktop**, where the session bus lives:

```bash
xfconf-query -c xsettings -p /Xft/DPI -s 140
```

If it answers that the property does not exist on that channel, you are
creating a setting rather than changing one, and it will not guess the type:

```bash
xfconf-query -c xsettings -p /Xft/DPI -n -t int -s 140
```

The panel ignores DPI more than applications do. Right-click the panel →
**Panel → Panel Preferences**, and raise **Row size** there.

## `termux-x11` prints a message about the app, or about a signature

**This is the third time the series has hit the same rule, and it is worth
recognising as a rule rather than as three unrelated bugs.** A Termux plugin is
always two halves — a package and an Android app — and the two must come from
the **same source**, because F-Droid, Google Play and GitHub each sign with a
different key. Course two: `termux-api` and Termux:API. Course three:
`termux-x11-nightly` and Termux:X11.

What changes is *who does the checking*, and it changes the symptom completely:

- For **Termux:API**, Android checks, and Android's way of refusing is to drop
  the request without a word. That is why a mismatch there hangs forever.
- For **Termux:X11**, the package checks for itself before it runs anything.
  You get a message and an exit in under a second — app not installed, or a
  signature mismatch.

So the fix is the same as ever and the diagnosis is much easier. Re-download
`termux-x11-universal-debug.apk` from the project's own nightly release tag on
[GitHub](https://github.com/termux/termux-x11) and install that. **It is not on
F-Droid**, and that is not an oversight — this is the one plugin in the series
you sideload.

Two related notes. That tag is rebuilt continuously, so if you `pkg upgrade`
months from now and things stop working, re-download the APK **before** you
debug anything else. And the `sharedUid` variant of the APK is the same rule
reaching one level further out: sharing a UID requires matching signatures, so
it only works alongside a Termux installed from GitHub.

## A file you definitely saved is not there

`--bind` lasts exactly as long as the login that carried it.

```bash
proot-distro login debian --bind ~/code:/root/code
```

Log in tomorrow without that flag and `/root/code` is not your Termux folder
any more. Depending on your version it is either missing, or — worse — an
empty directory left behind inside the rootfs. Nothing warns you. You can `cd`
into it, work in it all evening, and never notice that everything you wrote is
**inside the container**, outside your backups, one `proot-distro remove` from
gone.

The fix is to stop typing the login by hand. In fish:

```fish
alias --save debian 'proot-distro login debian --bind $HOME/code:/root/code'
```

If the work is already stranded inside the rootfs, it is not lost — the
container is an ordinary directory, and you can copy it out from the Termux
side:

```bash
cp -r $PREFIX/var/lib/proot-distro/installed-rootfs/debian/root/code ~/code
```

Then log back in with the bind and carry on. **Source outside, builds inside**
is the habit that keeps this from recurring.

## `systemctl` is missing, or refuses to operate

```text
System has not been booted with systemd as init system (PID 1). Can't operate.
```

Both that and a plain `command not found` mean the same thing: **nothing
started before your shell did.** `proot-distro login` does not boot anything —
it runs a shell in a directory tree. There is no init, no service manager, no
`journalctl`, and no such thing as "starts at boot", because there is no boot.

Packages still install perfectly. Their services just sit there until you run
them. Every guide that ends "…then enable the service" stops working at that
line, and the move that always works is to run the daemon yourself and watch
it. Some Debian packages still ship an `/etc/init.d/` script, so `service
<name> start` is worth one try.

This is a property of the design, not a broken install — [Root Without
Rooting](/container/why-proot/) has the reasoning.

## `glxinfo` still says `llvmpipe` after you set it all up

The GPU lesson's whole point: the failure mode here is not an error message, it
is a setup that looks correct and is still doing every pixel on the CPU.

```bash
glxinfo | grep -i "renderer string"
```

Work down these, most likely first:

1. **`GALLIUM_DRIVER` is not set in the process that is actually rendering.**
   `export` reaches only the shell you typed it in. Test it in one shell, start
   the desktop from another, and the desktop inherits nothing. Put the exports
   in the script that launches the session, above the line that starts it.
2. **The server is not running**, or the container cannot see its socket.
   `ls -l $PREFIX/tmp/.virgl_test` outside and `ls -l /tmp/.virgl_test` inside.
   The leading dot makes it hidden, so a bare `ls` will not show it — name it.
3. **`LIBGL_ALWAYS_SOFTWARE` is set somewhere** and overrides everything above.
   `unset LIBGL_ALWAYS_SOFTWARE`.
4. **`glxinfo: command not found`** means `mesa-utils` is not installed *in the
   container*, which is a different machine from Termux.

`virgl` anywhere in the renderer string is the win condition. And if you want
proof rather than a string, run `glxgears` twice — once normally, once as
`LIBGL_ALWAYS_SOFTWARE=1 glxgears`. **Two identical numbers mean your
"hardware" path is not a hardware path.**

## Things die on their own, minutes after they were working

Not your setup. Android has three separate ways to kill background work and
none of them explains itself.

The symptom tells you which family you are in: something that **fails to
start** is a configuration problem; something that **worked and then
disappeared** is Android.

- **The phantom process killer** (Android 12 and newer) caps how many
  background child processes an app may have and kills the excess silently. A
  container session is a tree of processes, so it is a natural target. The
  workaround needs a computer and `adb`, and its exact form has changed between
  Android versions — search for "phantom process" together with **your**
  Android version rather than pasting a command from a 2022 forum thread.
- **Battery optimisation and vendor process management.** Settings → Apps →
  Termux → Battery → **Unrestricted**, and hold `termux-wake-lock` around long
  jobs. Same fix as course two, same reasons.
- **The low-memory killer.** Debian plus XFCE plus Termux plus the X11 app is a
  lot of resident memory. The tell is unmistakable: the session vanishes and
  Termux prints something about the process being killed, with no error from
  XFCE at all. Nothing configures your way out of that one — fewer applications
  open, and close other Android apps first.

Keeping the screen on with Termux in the foreground avoids most of all three,
which is unsatisfying and true.

## The phone is hot and the battery is falling, and you stopped an hour ago

**Closing the Termux:X11 app does not stop the X server.** Exiting from its
notification closes the *window*; the `termux-x11` process is still running in
Termux, still holding its display, still burning cycles. Two separate things,
two separate ways to stop them:

```bash
# Stop the X server (the process in Termux)
pkill termux-x11
```

```bash
# Close the Android window, leaving the server running
am broadcast -a com.termux.x11.ACTION_STOP -p com.termux.x11
```

While you are there, `termux-wake-unlock` gives the wakelock back. It does not
release itself, and a wakelock you forgot is the single most expensive thing
you can leave running on this course.

## `No space left on device`, or an install that stops partway

The rootfs and your photos are on the same `/data` partition. There is no
separate Termux disk.

```bash
df -h $PREFIX
```

A rootfs that ran out of room mid-extraction leaves you with a large broken
directory and very little room to work in while you clear it up. **Do not try
to repair it.** Take it off and start again — the download cache usually makes
the second attempt much faster:

```bash
proot-distro remove debian
proot-distro install debian
```

Where the space actually is, in the order worth checking:

```bash
# Inside the container: every .deb apt ever downloaded
apt clean
```

```bash
# Termux side: the rootfs tarballs proot-distro kept for reinstalls
proot-distro clear-cache
```

```bash
# Either side: dependencies nothing needs any more. Read the list it proposes.
apt autoremove
```

Plan for **1.5–3 GB** for a base Debian and start with about **4 GB free**.
Android itself misbehaves near a full disk — apps fail to update, the camera
refuses to save — so a container that fills the last of it takes the rest of
the phone down with it.

## `apt update` cannot reach `deb.debian.org`

`Temporary failure resolving` is DNS, and there are two suspects in a fixed
order.

1. **Check the network from Termux first.** Exit the container and confirm the
   phone is actually online. A VPN or a captive-portal Wi-Fi breaks this in
   ways that look exactly like a container bug and are not.
2. **Then suspect the container's `/etc/resolv.conf`.** Setting a nameserver
   inside fixes it:

   ```bash
   echo "nameserver 9.9.9.9" > /etc/resolv.conf
   ```

   Be aware of what that does: it sends the container's lookups to a third
   party rather than to whatever your network hands out. Any DNS server you
   trust will do.

## `Unable to locate package`, on either side

Outside, in Termux, it is nearly always one of two things.

**The repository is not added.** X11 packages — `termux-x11-nightly`, `xfce4`,
`virglrenderer-android` — live in a second repository that is itself a package:

```bash
pkg install x11-repo
pkg update
```

The `pkg update` matters. Adding the repo without refreshing the lists leaves
you with a package manager that still has never heard of the thing.

**The mirror is down or stale.** The graphical repo is mirrored separately from
the main one and it can lag. If `pkg update` errors on the x11 lines, switch
mirrors with `termux-change-repo` from course one, `pkg update` again, and
retry. Nothing is wrong with your device.

Inside the container the equivalents are `apt update` first, and `apt search`
to find what your release actually calls it.

## A build configures fine, compiles fine, and dies on `make install`

```text
Permission denied
```

`configure` defaulted its prefix to `/usr/local`, exactly as it would on a
laptop. On Android there is no `/usr` at all and `/` is not writable by an app,
so the build happily does ten minutes of work and then fails on the very last
command.

```bash
./configure --prefix=$PREFIX
```

There is no reason ever to run this cycle in Termux without it. And if you
would rather your hand-built things stayed out of the package manager's way —
`pkg` has no idea any of them exist, will never upgrade them, and will collide
with them one day — build to a tree of your own instead:

```bash
./configure --prefix=$HOME/.local
```

```fish
fish_add_path ~/.local/bin
```

Then `ls ~/.local/bin` is a complete list of everything you compiled yourself.

## `'foo.h' file not found`, `bad interpreter`, `cannot find -lrt`

Android is Linux with the userland replaced, which is the awkward middle ground
where everything *nearly* works. These are the ones you will actually meet, and
each has a specific cause rather than a general one:

| What you see | What it means | What to do |
| :----------- | :------------ | :--------- |
| `/usr/bin/env: bad interpreter` | There is no `/usr` on Android, so the script's shebang points at nothing | `termux-fix-shebang <file>` rewrites it to `$PREFIX/bin` |
| A script fails writing to `/tmp` | Android has no `/tmp`; Termux uses `$PREFIX/tmp` | Patch the path, or `export TMPDIR=$PREFIX/tmp` and hope the script reads it |
| `cannot find -lrt` | bionic folds the real-time functions into libc; there is no separate `librt` | Delete the flag. It is not a missing package |
| `fatal error: 'foo.h' file not found` | The library is not installed — Termux ships headers **inside** the library package, so there is no `-dev` package you forgot | `pkg install <library>`, and if it does not exist, that is your cue for the container |
| `configure: error: C compiler cannot create executables` | Something is genuinely broken, and the screen is not where it says what | Read `config.log` in the source directory |

Read the **first** error, not the last — everything after it is usually
consequences:

```bash
make 2>&1 | tee ~/build.log
grep -n -i error ~/build.log | head
```

When a project fights you this hard and the tool is for the container anyway,
building **inside** Debian is the correct move rather than a defeat: a normal
FHS, a writable `/usr/local`, a real `/tmp`, glibc, and `-dev` packages. See
[Building Packages of Your Own](/hardware/building/).

## `No such file or directory` about a file that is plainly there

The most misleading message in Linux, and you will meet it twice on this
course: once when you download a prebuilt `linux-arm64` release, and once when
you copy something you compiled inside the container out to `$PREFIX/bin`.

It is not the file that is missing. It is the file's **dynamic loader**. Nearly
every Linux binary expects `/lib/ld-linux-aarch64.so.1`, which is glibc's, and
Android's C library is bionic — that path does not exist on your phone. The
kernel goes looking, does not find it, and reports the miss about the file you
named.

- A **statically linked** binary has no loader to look for and may well just
  run. Go release builds usually are; so are Rust builds for a musl target.
- The same glibc binary will usually run **inside the container**, which has
  both the loader and the glibc it wants. Try it there before writing it off.
- Going the other way is the same wall: a binary built inside Debian will not
  run in Termux, whatever folder it is sitting in.

## The build gets slower the longer it runs, or ends in `Killed`

Both are the phone, and they are two different limits.

**Slower** is thermal throttling. A laptop compiles with a fan; your phone
compiles with a sheet of glass. Under sustained load the clocks drop to keep
the case survivable, so the second half of a long build runs measurably slower
than the first. This is not a fixed penalty you can multiply by.

**`Killed`** is memory. The low-memory killer ended the compiler, or Android
ended Termux.

What actually helps, in rough order of effect:

- **Fewer parallel jobs than you think.** `make -j4` often finishes *sooner*
  than `make -j$(nproc)` on a device that is already warm, and it uses far less
  RAM — which is what stands between you and `Killed`.
- **Hold `termux-wake-lock`**, because a screen that goes off suspends Termux
  and a suspended build looks exactly like a hung one. Release it afterwards.
- **Unplug it and take the case off.** Charging generates heat on top of the
  heat you are already making.
- **Do not build with a desktop session running.** They are competing for the
  same cores and the same memory.
- **`Ctrl-C` (Volume Down + C) does not throw the work away.** `make` stops at
  the next command boundary and the object files stay on disk, so running
  `make` again resumes. It is `make clean` that costs you the afternoon.

Watch a number rather than the screen — battery temperature is not SoC
temperature, but it moves with it:

```bash
termux-battery-status | jq -r '.temperature'
```

Some things are simply not phone-scale. LLVM, a browser engine, a kernel:
hours of sustained heat that end, more often than not, in `Killed` at 80% with
no partial result you can use. Saying so is not defeat.

## Two panels, or "another window manager is already running"

After the desktop lessons you have XFCE installed **twice** — once on the
Termux side, once inside the container — and the command name is identical.
Only the shell you typed it in decides which one runs.

```bash
command -v xfce4-session
```

- Inside the container: a path under `/usr/bin`.
- In native Termux: a path under `/data/data/com.termux/files/usr/bin`.

If both answer and both are running, you have two independent desktops fighting
over one display. **Only run one at a time.** If the container says nothing,
the desktop is not installed where you think it is — your `apt install xfce4`
went to a session you have since exited.

`xfce4-session: Another session manager is already running` is the same story
told by one machine: your previous session never actually died. `pkill
xfce4-session` ends it.

## `Make sure an X server isn't already running`

A previous server is still alive, or it died badly and left its socket behind.

```bash
pkill termux-x11
ls -l $TMPDIR/.X11-unix/
```

If nothing is running but the socket file is still there, close the Termux:X11
app fully from Recents — that clears it — and start again. A hard kill of a
wedged desktop is the usual way to end up here.

## `virgl_test_server_android` returns you straight to the prompt

This is the first real fork in the road on the GPU lesson. A server that starts
and instantly exits has usually been **refused a GL context by the vendor
driver**, which is the "your device does not do this" answer arriving early.

Before accepting it: start the server in **its own Termux session** so you can
read what it printed, make sure Termux is in the foreground when you start it,
make sure the phone is not in a battery saver mode, and try once with the
screen unlocked and Termux visibly on top. Some vendor drivers will not hand a
surfaceless context to a backgrounded process, and there is no flag for that —
it is a decision made below you.

If it still will not hold a context, nothing else on that page will fix it.
Stop the server, drop the exports, and everything falls back to `llvmpipe` on
its own with no residue.

## An environment-variable prefix is a syntax error

```bash
GALLIUM_DRIVER=zink virgl_test_server_android
```

`VAR=value command` is **bash syntax**, and it is a syntax error in fish —
which is the shell course one had you install. Fish complains about an unknown
command rather than about the variables, so the error points nowhere useful.

`env` works in both, and is the version to keep:

```bash
env GALLIUM_DRIVER=zink virgl_test_server_android
```

Inside the container this never comes up, because Debian's shell is bash. It is
only the Termux side that bites.

## A browser inside the container refuses to start

`proot-distro login` gives you a root shell, so the desktop and everything you
launch from it runs as root. Most things do not care. Chromium does — it
refuses to start as root without `--no-sandbox`.

That flag turns off a real security boundary. Make the trade deliberately
rather than by pasting a line off a forum, and remember what [Root Without
Rooting](/container/why-proot/) said: the container is not a sandbox either, so
you are not adding a second layer of protection by keeping it on.

## You did everything on the page and it still does not work

Sometimes that is the honest answer, and this is the only course in the series
where it is common enough to deserve its own entry.

Three things here depend on the specific handset in your hand rather than on
anything you typed: **GPU acceleration** (the vendor driver, the Android
version, and whether Mesa can talk to either), **how Termux:X11 draws** on your
particular display stack, and **which of Android's process killers** your
manufacturer tuned up. Each of those has a device-level answer that no
instruction can supply.

What is worth doing instead of trying harder:

- **Know which layer you are in.** `xclock` splits display from desktop.
  `glxinfo | grep -i "renderer string"` splits real acceleration from a
  plausible-looking setup that is still on the CPU. Two commands, four seconds,
  and they turn "it does not work" into a question with a scope.
- **Take the working parts.** The container works. The desktop works, in
  software. Neither of those depended on the GPU.
- **Ask where the people who wrote it are.** The issue tracker for the specific
  project — [termux/termux-x11](https://github.com/termux/termux-x11),
  [termux/proot-distro](https://github.com/termux/proot-distro),
  [termux/termux-packages](https://github.com/termux/termux-packages) — beats a
  general forum for anything device-shaped, and
  [wiki.termux.com](https://wiki.termux.com) outlives every tutorial, this one
  included.

A confident instruction that fails silently is the worst thing a course like
this can hand you. A two-second test you trust is the antidote, and by now you
have one for every layer.
