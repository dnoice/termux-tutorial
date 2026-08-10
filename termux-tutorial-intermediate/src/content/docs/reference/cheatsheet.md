---
title: Command Cheatsheet
description: Every command from the intermediate course in one scannable reference.
sidebar:
  order: 1
# Utility page, not a step: keep it out of the prev/next chain.
prev: false
next: false
---

Everything this course teaches, in the order it teaches it. Each section links
back to the lesson that explains *why*.

:::note[Two things that apply to nearly every line below]
**`termux-*` commands need the Termux:API app**, installed from the same source
as Termux itself. Without it they hang forever rather than failing — see
[Troubleshooting](/reference/troubleshooting/).

**On a phone keyboard:** Volume Down + a letter is Ctrl + that letter. Volume Up
is a fixed list — `E`=Esc, `T`=Tab, `W`/`A`/`S`/`D`=arrows, `L`=`|`, `H`=`~`,
`U`=`_`, `Q` or `K` toggles the extra-keys row.
:::

## Setting up the bridge

From [Wiring Up Termux:API](/bridge/api-setup/).

| Command | What it does |
| :--- | :--- |
| `pkg install termux-api` | The command-line half. The app is the other half. |
| `termux-battery-status` | The smoke test — first call triggers a permission prompt. |
| `pkg install jq` | Parses the JSON every `termux-*` command prints. |

## Reading the device

From [Reading the Device](/bridge/reading-the-device/).

| Command | Returns |
| :--- | :--- |
| `termux-battery-status` | Percentage, temperature, plug state, health |
| `termux-wifi-connectioninfo` | SSID, signal strength, link speed, IP |
| `termux-telephony-deviceinfo` | Network operator, SIM state, phone type |
| `termux-telephony-cellinfo` | Nearby cell towers |
| `termux-sensor -l` | List every sensor the phone has |
| `termux-sensor -s <name> -n 1` | One reading from one sensor |
| `termux-location` | GPS fix — slow, and needs a clear sky |
| `termux-camera-info` | Resolutions and capabilities per camera |
| `termux-camera-photo -c 0 out.jpg` | Take a photo (`0` is usually the back camera) |
| `termux-microphone-record -f out.wav -l 10` | Record ten seconds |
| `termux-clipboard-get` | Read the Android clipboard |

Reading one field out of the JSON:

```bash
termux-battery-status | jq -r '.percentage'
```

## Talking back to Android

From [Talking Back to Android](/bridge/talking-back/).

| Command | What the user sees |
| :--- | :--- |
| `termux-toast "text"` | A brief message over whatever is on screen |
| `termux-notification -t "Title" -c "Body"` | A real notification in the shade |
| `termux-notification --id <id> …` | Replaces the notification with that id |
| `termux-notification-remove <id>` | Dismisses it from a script |
| `termux-vibrate -d 500` | Vibrate for 500 ms |
| `termux-tts-speak "text"` | Reads it aloud |
| `termux-dialog` | Asks for input and prints the answer as JSON |
| `termux-clipboard-set "text"` | Puts text on the Android clipboard |

## Scripts

From [From Commands to Scripts](/automation/shell-scripts/).

| Line | Meaning |
| :--- | :--- |
| `#!/data/data/com.termux/files/usr/bin/bash` | The shebang. Termux is not at `/bin`. |
| `chmod +x ~/bin/name` | Makes it runnable. Without this: `Permission denied`. |
| `~/bin` on `PATH` | Lets you type `name` instead of `./name` |
| `sh -x ~/bin/name` | Trace every line as it runs — the debugging workhorse |

The extension is not what makes a script run — the shebang is. Drop the `.sh`.

## Scheduling

From [Making It Run Itself](/automation/scheduling/).

| Command | What it does |
| :--- | :--- |
| `pkg install cronie termux-services` | Installs cron and the service supervisor |
| *(restart Termux completely)* | **Required** before `sv` sees a new service |
| `sv-enable crond` | Starts cron now and on every launch |
| `sv status crond` | Confirms it is actually running |
| `crontab -e` | Edit your schedule |
| `crontab -l` | List it |

Field order — minute, hour, day-of-month, month, day-of-week:

```text
*/15 * * * *   every 15 minutes
0 7 * * *      07:00 daily
0 9 * * 1      09:00 on Mondays
```

Cron has almost no environment, so use absolute paths and capture output:

```bash
0 7 * * * $HOME/bin/battery-check >> $HOME/cron.log 2>&1
```

The Android-native alternative, which survives reboots and respects Doze:

```bash
termux-job-scheduler --script $HOME/bin/battery-check --period-ms 900000
```

| Command | What it does |
| :--- | :--- |
| `termux-job-scheduler -p` | List scheduled jobs |
| `termux-job-scheduler --cancel-all` | Cancel every job |
| `termux-wake-lock` / `termux-wake-unlock` | Hold the CPU awake for a long job |

## Serving

From [A Web Server in Your Pocket](/serving/local-server/) and
[Opening a Door to the Internet](/serving/tunnels/).

| Command | What it does |
| :--- | :--- |
| `python -m http.server 8080` | Serves the **current directory** on every interface |
| `python -m http.server 8080 --bind 127.0.0.1` | Serves it to this device only |
| `termux-wifi-connectioninfo \| jq -r '.ip'` | The address other devices use |
| `cloudflared tunnel --url http://localhost:8080` | A public HTTPS URL, no account |
| `npx localtunnel --port 8080` | The alternative, if `cloudflared` will not install |
| **Ctrl-C** (Volume Down + C) | Closes the tunnel **and** the server |

:::caution[The two rules worth memorising]
`http.server` serves the directory you started it in — `cd` somewhere
deliberate first, and `ls -a` to see exactly what you are about to publish.

A tunnel is open to anyone with the URL for as long as it runs. Close it when
you are done; do not leave it up overnight.
:::

## Ports

| Range | Usable in Termux? |
| :--- | :--- |
| 1–1023 | **No** — privileged, and Termux has no root |
| 1024–65535 | Yes. 8080 and 8000 are the conventional choices. |
