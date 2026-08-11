---
title: Command Cheatsheet
description: Every command from the advanced course in one scannable reference.
sidebar:
  order: 1
# Utility page, not a step: keep it out of the prev/next chain.
prev: false
next: false
---

Everything this course teaches, in the order it teaches it. Each section links
back to the lesson that explains *why* — and, in this course more than the other
two, what it costs.

:::caution[Three things that apply to nearly every line below]
**There is no practice terminal in this course.** Every command on this page runs
on your own device, against your own storage. Nothing here has been rehearsed on
your behalf.

**Several of these spend disk, battery and heat.** Plan for **1.5–3 GB** by the
time Debian is set up the way you want it — a few hundred megabytes unpacked,
gigabytes after `apt` — and PRoot traces every system call, so everything inside
runs slower and warmer. `df -h $PREFIX` before anything that downloads.

**On a phone keyboard:** Volume Down + a letter is Ctrl + that letter. Volume Up
is a fixed list — `E`=Esc, `T`=Tab, `W`/`A`/`S`/`D`=arrows, `L`=`|`, `H`=`~`,
`U`=`_`, `Q` or `K` toggles the extra-keys row. This course types `|`, `~` and
`_` constantly.
:::

## Before you spend the disk

From [Root Without Rooting](/container/why-proot/).

| Command | What it tells you |
| :--- | :--- |
| `df -h ~` | Free space. Read the `Avail` column. |
| `uname -m` | `aarch64` is the 64-bit build and the well-trodden path |

What PRoot cannot do, whatever you type: kernel modules, `mount`, block devices,
systemd, Docker. Those are design consequences, not defects — and `root` inside
the container is a costume the kernel never sees.

## Installing a distribution

From [Installing a Full Distro](/container/first-distro/).

| Command | What it does |
| :--- | :--- |
| `df -h $PREFIX` | Free space on the partition the container will live on |
| `pkg install proot-distro` | The manager. Small — the distributions are the expensive part. |
| `proot-distro list` | What's on offer, and each one's **alias** |
| `termux-wake-lock` | Take it before the install; Android freezes long jobs |
| `proot-distro install debian` | Downloads and extracts the rootfs |
| `du -sh $PREFIX/var/lib/proot-distro/installed-rootfs/debian` | What it actually cost |
| `termux-wake-unlock` | Give it back when the long job ends |

The rootfs lands in
`$PREFIX/var/lib/proot-distro/installed-rootfs/debian` — an ordinary directory
under `$PREFIX`, not under `$HOME`.

Logging in and proving where you are:

| Command | Answer |
| :--- | :--- |
| `proot-distro login debian` | A bash prompt ending in `#` |
| `cat /etc/os-release` | Debian's own name and version |
| `uname -r` | **Android's kernel** — you changed userland, not OS |
| `systemctl status` | `command not found`, or "has not been booted with systemd" |
| `exit` (or **Volume Down + D**) | Back to Termux. Nothing keeps running. |

First moves inside, where it is `apt` and there is no `sudo`:

```bash
apt update
apt upgrade -y
apt install -y htop
```

If `apt update` reports `Temporary failure resolving 'deb.debian.org'`, check the
network from Termux first. If Termux is online and the container still cannot
resolve, point it at a DNS server you trust — this sends the container's lookups
to a third party, which is a reasonable fix rather than a free one:

```bash
echo "nameserver 9.9.9.9" > /etc/resolv.conf
```

Undoing the install:

| Command | What it does |
| :--- | :--- |
| `proot-distro remove debian` | **Deletes the rootfs and everything in it.** No prompt, no undo. |
| `proot-distro clear-cache` | Frees the downloaded tarballs |
| `pkg uninstall proot-distro` | Removes the manager, once no distributions are left |

## Living in the container

From [Living in the Container](/container/living-in-it/).

Your own install's help text outranks this page — `proot-distro --help` and
`proot-distro login --help` are both short, and the options have moved across
releases.

**Which side am I on?**

| Command | Outside (Termux) | Inside (Debian) |
| :--- | :--- | :--- |
| `id -u` | a five-digit app UID | `0` |
| `echo $HOME` | `/data/data/com.termux/files/home` | `/root` |
| the prompt | ends in `$` | ends in `#` |

**Two package managers.** `pkg` outside, `apt` inside, always — Termux has an
`apt` too, so the wrong one succeeds silently.

| | Outside (Termux) | Inside (Debian) |
| :--- | :--- | :--- |
| Install | `pkg install <name>` | `apt install <name>` |
| Refresh lists | `pkg update` | `apt update` |
| Upgrade | `pkg upgrade` | `apt upgrade` |
| What's installed | `pkg list-installed` | `apt list --installed` |
| Binaries land in | `$PREFIX/bin` | `/usr/bin` |
| Reclaim cache | — | `apt clean` |

**Login forms.** Everything after `--` runs inside and returns you straight to
Termux:

```bash
proot-distro login debian -- apt update
```

| Flag | What it does |
| :--- | :--- |
| `--bind ~/code:/root/code` | One directory, two names. Read it as **source:target**. |
| `--termux-home` | Your Termux home becomes the container's home — dotfiles and all |
| `--shared-tmp` | Termux's `$TMPDIR` onto the container's `/tmp`. The desktop lesson needs this. |
| `--isolated` | Switches off the default bind set entirely |
| `--fix-low-ports` | Worth trying for ports below 1024; moving the port always works |

:::danger[A bind lasts exactly as long as that login]
Log in without the flag and `/root/code` is missing, or an empty directory left
inside the rootfs — and nothing warns you that tonight's work is now living one
`proot-distro remove` from oblivion. Save the whole login line instead of typing
it:

```fish
alias --save debian 'proot-distro login debian --bind $HOME/code:/root/code'
```

In bash, the same line without `--save`, in `~/.bashrc`.
:::

**Where things belong:** source outside and bound in, builds inside. A binary
belongs to the system that built it — Termux is bionic, Debian is glibc, and
neither one's binaries run on the other side however tidy the folder looks.

**Backing up what matters** — the source, plus the list, not two gigabytes of
rootfs:

```bash
apt-mark showmanual > /root/code/debian-packages.txt
apt install -y $(cat /root/code/debian-packages.txt)
```

`proot-distro backup` exists and writes gigabytes; read
`proot-distro backup --help` on your own install before trusting any recipe for
it, and put the result in `~/storage/shared/`.

## The display server

From [A Display Server on Android](/desktop/x11-server/).

| Command | What it does |
| :--- | :--- |
| `getprop ro.build.version.sdk` | **26 or higher** is Android 8, the floor for Termux:X11 |
| `pkg install x11-repo` | The graphical repo. X11 packages are not in the main one. |
| `pkg update` | Again, so the new repo's lists land |
| `pkg install termux-x11-nightly` | The package half. `-nightly` is the name, not a channel. |
| `command -v termux-x11 termux-x11-preference` | Two paths back means the install took |
| `termux-change-repo` | If the x11 mirror 404s or has "no installation candidate" |

The app half is `termux-x11-universal-debug.apk` (~13 MB) from the project's
nightly release tag on GitHub. **It is not on F-Droid** — this is the one plugin
in the series you sideload. A mismatch here *reports itself* and exits; it does
not hang the way a Termux:API mismatch does.

Starting, addressing and testing it:

```bash
termux-x11 :0 &
export DISPLAY=:0
ls -l $TMPDIR/.X11-unix/
```

`DISPLAY=:0` resolves to the socket `X0` in `$TMPDIR/.X11-unix/`. Both halves
derive that path from `$TMPDIR`, which is why they agree without being told —
and why anything that cannot see that directory cannot draw.

```bash
pkg install xorg-xclock xorg-xdpyinfo
xdpyinfo | head -n 2
xclock &
pkill xclock
```

`xdpyinfo` proves the connection, `xclock` proves the pixels. **`xterm` is not a
Termux package**; `xorg-xclock`, `xeyes` and `xorg-xdpyinfo` are.

An undecorated, unmovable clock on a black field **is success** — window
management is a separate program you have not installed.

| Symptom | Restart the server as |
| :--- | :--- |
| Black screen with a visible cursor | `termux-x11 :0 -legacy-drawing` |
| Blues and reds swapped | `termux-x11 :0 -force-bgra` |
| Everything microscopic | `termux-x11 :0 -dpi 120` |

Those two flags exist because **some devices simply render wrong**. There is no
list of which phones; you find out by looking.

| Command | What it does |
| :--- | :--- |
| `echo $DISPLAY` | The two-second check that saves an hour |
| `pkill termux-x11` | Stops the server. **Closing the app does not.** |
| `am start --user 0 -n com.termux.x11/com.termux.x11.MainActivity` | Bring the app forward from the shell |
| `am broadcast -a com.termux.x11.ACTION_STOP -p com.termux.x11` | Close the window, leave the server running |
| `termux-x11-preference list` | Every setting the app has, without guessing menu names |
| `termux-x11-preference "showAdditionalKbd"="true"` | Turn on the app's own key row |
| `TERMUX_X11_DEBUG=1 termux-x11 :0 > ~/x11.log 2>&1` | Verbose log. Send it to a file; reading it live is hopeless. |

:::note[Inside the Termux:X11 surface, the phone keys change meaning]
You are no longer in Termux's terminal view, so **the volume-key modifiers do
not reach in there**. What you get instead: **Back** toggles the soft keyboard,
**three-finger swipe down** toggles the app's key row, **two-finger tap** is
right click, three-finger tap is middle click, two-finger swipe scrolls.
:::

## XFCE on the Termux side

From [Bringing Up XFCE](/desktop/xfce/).

```bash
pkg install x11-repo
pkg update
pkg install xfce4
pkg install xfce4-terminal
pkg install thunar mousepad
```

`xfce4-terminal` is not optional — a desktop whose only terminal is the Termux
window *behind* it is a desktop you cannot do anything from. Read the
`After this operation, … additional disk space` line `pkg` prints before
confirming; it is the only honest number available for your snapshot.

Starting it, in **two Termux sessions**, server first:

```bash
# session one
termux-x11 :0 &

# session two
export DISPLAY=:0
dbus-launch --exit-with-session startxfce4
```

`dbus-launch` creates the **session bus** that no login manager is here to
create. `--exit-with-session` kills the bus when the session ends; run
`dbus-launch` bare and you leave a daemon behind (`kill <pid>` tidies it). If it
is `command not found`, `pkg install dbus`.

Without a session bus the desktop half-starts and blames nothing: settings
refuse to stick, `xfconf-query` cannot connect, Thunar hangs or dies. Nothing
ever says "bus".

**Acquire the wakelock** from Termux's notification before you switch to the X11
app, or Android suspends every process this desktop is made of. It costs battery
and heat, honestly and noticeably.

Making it readable — run these from **xfce4-terminal inside the desktop**, which
inherited the bus, not from a separate Termux session:

```bash
xfconf-query -c xsettings -p /Xft/DPI -s 140
xfconf-query -c xsettings -p /Gdk/WindowScalingFactor -s 2
```

If it answers that the property does not exist on channel `xsettings`, you are
creating a setting rather than changing one:

```bash
xfconf-query -c xsettings -p /Xft/DPI -n -t int -s 140
```

Shutting down, in reverse order — session, then server, then wakelock:

| Command | When |
| :--- | :--- |
| Applications → **Log Out** | The clean exit. **Shut Down** and **Restart** ask `logind`, which is not here. |
| **Ctrl-C** (Volume Down + C) in session two | Log Out unreachable |
| `pkill xfce4-session` | Still wedged |
| `pkill -f termux-x11` | Then stop the server |
| `pkg uninstall xfce4` + `apt autoremove` | Getting the disk back. Read the list `autoremove` proposes. |

## The desktop in the container

From [The Desktop in the Container](/desktop/across-the-boundary/).

One idea, three pieces: **the server is native, the clients are in the
container, the socket is the tether.** Every failure is one of those three being
absent.

```bash
proot-distro login debian --shared-tmp
```

`--shared-tmp` bind-mounts Termux's `$TMPDIR` onto the container's `/tmp`, where
every X client on earth looks for its socket. It is **per login** and cannot be
added afterwards — which is the single most common cause of "it worked
yesterday".

Prove the share before building on it. Inside, then in a native session:

```bash
touch /tmp/boundary-test
ls -l $TMPDIR/boundary-test
```

Install the desktop **inside**, after asking what it costs:

```bash
apt update
apt-get -s install xfce4 xfce4-terminal dbus-x11
apt install -y xfce4 xfce4-terminal dbus-x11
apt install -y x11-utils x11-apps
```

`-s` simulates. `dbus-x11` is what provides `dbus-launch`. `x11-utils` and
`x11-apps` give you `xdpyinfo` and `xclock` — a few hundred kilobytes that split
every later problem in half. A debconf dialog mid-install is not a hang; arrows
are **Volume Up + W/A/S/D**, Tab is **Volume Up + T**. Prefix with
`DEBIAN_FRONTEND=noninteractive` if you would rather it never asked.

The full start, in order:

```bash
termux-wake-lock
termux-x11 :0 &
proot-distro login debian --shared-tmp
export DISPLAY=:0
dbus-launch --exit-with-session xfce4-session
```

Make `DISPLAY` survive a logout with `echo 'export DISPLAY=:0' >> ~/.bashrc` —
that file is `/root/.bashrc` *inside* the container, unrelated to your Termux
`~`. `startxfce4` is the one-word shortcut; `dbus-launch --exit-with-session
xfce4-session` is the version that fails legibly.

### The six tests

A black screen is not one bug, it is six. Walk them in chain order and stop at
the first failure.

| # | Where | Command | Reads |
| :-- | :--- | :--- | :--- |
| 1 | Termux | `pgrep -f termux-x11` + `ls -l $TMPDIR/.X11-unix/` | Is the server alive, and did it publish a socket? |
| 2 | Container | `ls -l /tmp/.X11-unix/` | Can the container see that socket? (empty = no `--shared-tmp`) |
| 3 | Container | `echo $DISPLAY` | Set, and matching the number the server got? |
| 4 | Container | `xdpyinfo \| head -n 3` then `xclock` | Boundary, with XFCE removed from the equation |
| 5 | Container | `echo $DBUS_SESSION_BUS_ADDRESS` | Is there a session bus? Empty → `apt install -y dbus-x11` and relaunch |
| 6 | Both | `command -v xfce4-session` | XFCE exists on **both** sides now. Which one are you starting? |

Test 4 is the one worth the habit: clock appears → the boundary is fine and your
problem is XFCE or dbus; `Can't open display` → the boundary is broken and one
of tests 1–3 is lying to you.

Wrapping the start-up in a script, on the **Termux** side — `~/desktop.sh`:

```bash
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
termux-x11 :0 &
sleep 3
proot-distro login debian --shared-tmp -- /bin/bash -lc \
  'export DISPLAY=:0; dbus-launch --exit-with-session xfce4-session'
```

`chmod +x ~/desktop.sh`, then run it. That `sleep 3` is a race and it is honest
about being one — if the script fails where the same commands typed by hand
succeed, raise it before suspecting anything else.

Closing down: Log Out inside XFCE, `exit` the container, **Ctrl-C** the
`termux-x11` job, `termux-wake-unlock`. A wedged session dies to
`pkill -f xfce4-session` without taking the container with it.

:::tip[One free speed-up]
Inside XFCE: **Settings → Window Manager Tweaks → Compositor**, and turn the
compositor off. It buys shadows your phone is rendering in software.
:::

## The GPU

From [Handing Work to the GPU](/hardware/gpu/).

This is the lesson most likely to not work on your phone, and the failure mode is
not an error — it is a setup that looks correct and is still doing every pixel on
the CPU. So the whole section is built around one command, run **inside the
container**:

```bash
apt install mesa-utils
glxinfo | grep -i "renderer string"
```

| Renderer string contains | What it means |
| :--- | :--- |
| `llvmpipe` | **Software.** No GPU in that sentence anywhere. |
| `softpipe` | Software, unoptimised. Same category, slower. |
| `virgl` — usually with a GPU name in brackets | **The bridge is up.** That is the win condition. |
| `zink` | GL over Vulkan on the real GPU |

Match on the substring, not on a whole line; the exact wording moves with Mesa
versions.

**Before you invest an evening**, ask Android what it has, from the Termux side:

```bash
getprop ro.hardware.vulkan
getprop ro.board.platform
```

Adreno (Snapdragon) is the best case by a wide margin. Mali is mixed to poor.
An empty answer means the property is not populated, not that you have no GPU.

**Termux side** — install and run the relay in its own session, so you can see
it fail:

```bash
pkg install x11-repo
pkg update
pkg install virglrenderer-android
virgl_test_server_android
ls -l $PREFIX/tmp/.virgl_test
```

The `-android` suffix is the whole point: it is the build wired to Android's EGL
rather than a desktop DRM device. The socket is a hidden file, so name it
directly — a bare `ls $PREFIX/tmp` will not show it. Stop the server with
**Ctrl-C**; it is a relay, not a daemon with opinions.

**Container side** — check the socket crossed, then switch drivers:

```bash
ls -l /tmp/.virgl_test
export GALLIUM_DRIVER=virpipe
unset LIBGL_ALWAYS_SOFTWARE
glxinfo | grep -i "renderer string"
```

`virpipe` is the socket-based driver; plain `virgl` expects a real virtio-gpu
device you do not have. The socket is only visible inside if you logged in with
`--shared-tmp` — the same flag the desktop lessons use, for the same reason. If
`/tmp/.virgl_test` is missing, log out and log back in with it:

```bash
proot-distro login debian --shared-tmp
```

Proving it with an A/B, since a plausible renderer string is not proof:

```bash
glxgears
LIBGL_ALWAYS_SOFTWARE=1 glxgears
```

Same numbers both ways means your "hardware" path is not a hardware path. Treat
glxgears as a smoke test, not a benchmark — it is usually vsync-capped at a
suspiciously round 60, and the number after the SoC warms up is the one you live
with.

### The Zink path

Nothing changes inside the container — still `GALLIUM_DRIVER=virpipe`. The change
is in how you start the **server**:

```bash
env GALLIUM_DRIVER=zink MESA_GL_VERSION_OVERRIDE=4.3COMPAT \
    MESA_GLES_VERSION_OVERRIDE=3.2 MESA_NO_ERROR=1 \
    virgl_test_server_android
```

The `env` form is deliberate: `VAR=value command` is bash syntax and a **syntax
error in fish**, which is the shell course one left you in, and fish's complaint
points nowhere useful. Inside the container the prefix form is fine — Debian's
shell is bash.

Check what Zink would stand on first, from the Termux side:

```bash
pkg install vulkan-tools
vulkaninfo --summary
```

A real GPU name — **Adreno**, **Turnip**, **Mali** — means a hardware Vulkan
driver. **SwiftShader** or **lavapipe** are *software* Vulkan, and Zink on top of
one of those is reliably slower than plain llvmpipe: a working setup, a
plausible renderer string, and worse performance than doing nothing.

Package names in this corner move around. `pkg search vulkan` and `pkg search
mesa` beat any list written today; `virglrenderer-android` is the one name that
has stayed put.

| Symptom | Most likely cause |
| :--- | :--- |
| Still `llvmpipe`, no errors | `GALLIUM_DRIVER` isn't set in the process doing the rendering |
| `glxinfo: command not found` | `mesa-utils` isn't installed **in the container** |
| Socket errors | Server not running, or `/tmp/.virgl_test` isn't visible inside |
| Server exits at startup | The vendor driver refused a GL context. Device-level answer. |
| Runs a while, then dies | Unstable driver path. Common on Mali. |
| `virgl` in the string but visible garbage | Drop the `MESA_*_VERSION_OVERRIDE` line and retest |
| Fast, then progressively slower | Thermal throttling. Working as designed. |
| Slower than before you started | Software Vulkan under Zink |

`ZINK_DESCRIPTORS=lazy` appears in most older walkthroughs. Newer Mesa made that
behaviour the default; it does nothing now and fixes nothing.

:::danger[`llvmpipe` at the end of all that is not you failing]
It is a vendor graphics driver, written for a phone, declining to do something
nobody paid it to do. No flag fixes that. `pkg uninstall virglrenderer-android`
and everything falls back with no residue — the container and the desktop never
depended on this.
:::

**What the bridge never carries**, however well it works: Vulkan inside the
container, hardware video decode, OpenCL/CUDA/compute, anything wanting DRM/KMS.
It carries OpenGL drawing commands, and that is the entire list.

## Building your own

From [Building Packages of Your Own](/hardware/building/).

Rule out the cheap answers first:

```bash
pkg search fortune
pkg install tur-repo && pkg update
apt search fortune          # inside the container
```

A prebuilt `linux-arm64` release asset is the right CPU and usually the wrong
binary — glibc's loader is not on your phone, and the error is `No such file or
directory` about a file you can plainly see. Statically linked Go and musl-Rust
builds are the exceptions, and the same binary usually *does* run inside the
container.

| Command | What it tells you |
| :--- | :--- |
| `uname -m` | `aarch64` on nearly every modern phone |
| `dpkg --print-architecture` | What Termux itself thinks it is, which decides what `pkg` will hand you |

The toolchain, and the compiler check that settles blame before a real build:

```bash
pkg install build-essential
pkg install clang make cmake pkg-config git
pkg install autoconf automake libtool

printf '#include <stdio.h>\nint main(void) { puts("toolchain ok"); return 0; }\n' > check.c
clang check.c -o check
./check
```

The compiler is **clang**, not gcc — `make CC=clang` fixes Makefiles that
hardcode the other one. There is no `sudo` and you do not need one; you own
`$PREFIX` outright.

The cycle, and the flag that is not optional:

```bash
./configure --prefix=$PREFIX
make
make install
make uninstall     # only while the build tree still exists
```

Without `--prefix`, `configure` defaults to `/usr/local`, and the build succeeds
for however many minutes it takes before dying on the **last** command with
`Permission denied`.

Keeping hand-built things out of the packaged tree, since `pkg` will never know
they exist:

```bash
./configure --prefix=$HOME/.local
fish_add_path ~/.local/bin
```

| What you see | What to do |
| :--- | :--- |
| `Permission denied` on `make install` | Re-run `./configure --prefix=$PREFIX` |
| `/usr/bin/env: bad interpreter` | `termux-fix-shebang <file>` |
| A script fails writing to `/tmp` | `export TMPDIR=$PREFIX/tmp`, or patch the hardcoded path |
| `cannot find -lrt` | Delete the flag. bionic folds it into libc; it is not a missing package. |
| `fatal error: 'foo.h' file not found` | `pkg install <library>` — Termux ships headers **in** the library package, so there is no `-dev` to forget |
| `configure: error: C compiler cannot create executables` | `tail -n 60 config.log` |
| `Killed` mid-compile | Fewer parallel jobs, close apps, no desktop session running |

Reading a failure, which means reading the **first** error and not the last:

```bash
make 2>&1 | tee ~/build.log
grep -n -i error ~/build.log | head
tail -n 60 config.log
```

### The other machine

Inside the container there is a normal FHS, a writable `/usr/local`, a real
`/tmp`, glibc and `-dev` packages — routinely the difference between a
two-minute build and an afternoon:

```bash
proot-distro login debian
apt update
apt install -y build-essential curl pkg-config
./configure
make
make install
```

`apt build-dep <package>` installs every build dependency in one command, when
the rootfs has `deb-src` lines in its `sources.list` — a minimal one often does
not.

The trade: that binary is glibc and FHS, so it runs in the container and nowhere
else; everything under PRoot compiles slower, because a compiler makes millions
of syscalls; and the source and object files land inside a rootfs that already
cost you gigabytes.

### Heat, battery, time

```bash
make -j4                                      # often beats -j$(nproc) on a warm phone
termux-wake-lock                              # a suspended build looks like a hung one
termux-battery-status | jq -r '.temperature'  # a number to watch instead of the screen
termux-wake-unlock
```

**Ctrl-C** (Volume Down + C) stops `make` at the next command boundary and the
object files already produced stay on disk, so `make` again resumes. `make clean`
is what throws that away — do not run it out of habit.

Unplug it and take the case off. A phone compiling on a charger inside a case is
the slowest possible configuration, and the second half of a long build runs
measurably slower than the first because the SoC is throttling.

## Environment variables, all in one place

This course has more of these than the other two combined, and forgetting one is
the most common cause of "it worked when I tested it". They are all per-process:
**a variable has to exist before the process that reads it starts.**

| Variable | Side | Value | Why |
| :--- | :--- | :--- | :--- |
| `DISPLAY` | both | `:0` | Which X server a client connects to. Must match the number you gave `termux-x11`. |
| `TMPDIR` | Termux | `$PREFIX/tmp` | Where the X11 and virgl sockets live. Android has no `/tmp`. |
| `PREFIX` | Termux | `/data/data/com.termux/files/usr` | The container, the sockets and your builds all sit under it |
| `HOME` | both | `…/files/home` outside, `/root` inside | `~` is not a place, it is whatever `$HOME` says |
| `DBUS_SESSION_BUS_ADDRESS` | both | set by `dbus-launch` | Empty means no session bus, which is why settings won't stick |
| `GALLIUM_DRIVER` | container | `virpipe` | Forward GL over the socket instead of rendering on the CPU |
| `GALLIUM_DRIVER` | Termux | `zink` | *Server side only* — render the received stream through Vulkan |
| `LIBGL_ALWAYS_SOFTWARE` | container | `1`, or unset | Forces llvmpipe whatever `GALLIUM_DRIVER` says. `unset` it before testing. |
| `MESA_GL_VERSION_OVERRIDE` | Termux | `4.3COMPAT` | Claims a version. Does **not** add capability — suspect it first when output is garbage. |
| `MESA_GLES_VERSION_OVERRIDE` | Termux | `3.2` | The same, for GLES |
| `MESA_NO_ERROR` | Termux | `1` | Skips GL error checking for a little speed |
| `ZINK_DESCRIPTORS` | Termux | `lazy` | Does nothing on current Mesa. In every old guide anyway. |
| `TERMUX_X11_DEBUG` | Termux | `1` | Verbose server log. Redirect it to a file. |
| `DEBIAN_FRONTEND` | container | `noninteractive` | Stops `apt` opening a blue debconf dialog mid-install |

The ways to set one, which are not interchangeable:

```bash
export DISPLAY=:0                 # bash: this shell and what it starts
env DISPLAY=:0 xclock             # one command only — works in every shell
GALLIUM_DRIVER=virpipe glxinfo    # bash only: a SYNTAX ERROR in fish
```

```fish
set -x DISPLAY :0                 # fish: this session
set -Ux DISPLAY :0                # fish: universal, remembered across sessions
```

To make one stick: `~/.bashrc` inside the container, `set -Ux` in fish outside,
or — best for anything that launches a session — the script that starts it, on
the line above the thing that reads it.

## Sockets and paths worth memorising

| Path | What it is |
| :--- | :--- |
| `$TMPDIR/.X11-unix/X0` | The X socket, from Termux. `DISPLAY=:0` means exactly this file. |
| `/tmp/.X11-unix/X0` | The same file from inside, once `--shared-tmp` is on |
| `$PREFIX/tmp/.virgl_test` | The virgl socket, from Termux. Hidden — name it directly. |
| `/tmp/.virgl_test` | The same file from inside |
| `$PREFIX/var/lib/proot-distro/installed-rootfs/debian` | The entire container. An ordinary directory. |

## Taking it back off

From [Where to Next](/where-next/). All of this was reversible, which was always
the point.

```bash
proot-distro list
du -sh $PREFIX/var/lib/proot-distro/installed-rootfs/
proot-distro remove debian
```

`du` walks tens of thousands of files, so give it a moment — **Volume Down + C**
stops it if you would rather not wait. `remove` does not archive, prompt twice or
keep a copy: anything you want should already be on the Termux side or in
`~/storage/shared/`. A directory you bind-mounted in is fine; it was never inside
the rootfs.

When something breaks in a way this page does not cover, see
[Troubleshooting](/reference/troubleshooting/).
