# The installer's screen

The person using the guide is standing at a bench or in front of an enclosure, often with a tablet at arm's length and something in their hands. They want to know what to do next and to check one landing. They do not want to read.

## What the screen has, and why

| Part | What it is | Why |
|---|---|---|
| Top bar | Build, Wire, Parts, Wire list, Issues as large buttons; tasks and wires done; Find; larger text; help | The five things someone comes to do, always one tap away; progress always in sight |
| Bottom bar | One row of large buttons that never moves: Back / Next step in Build; Back / Done, next wire / Skip in Wire | The next action is always in the same place, reachable with a thumb. Next turns green when the step's tasks are all ticked |
| Build view | A strip of phases with this phase's steps as dots; a numbered step; tasks as large tick rows with a count; "check with engineering first" in amber; parts and documents folded away | Where am I, what do I do, what must I ask first. Reference material is there when wanted and out of the way otherwise |
| Wire view | The marker as large as a label; size, colour, cut length; each end in its own box with the device, terminal, where it is on the device in plain words, end type, torque and strip length; the duct route | One wire at a time, everything needed to make and land it |
| Tool rail on the 3D view | Finished, Doors off, Reset, Closer, Further, Colours, Wide view; look-from buttons under the view | Large targets for the handful of view actions; zoom buttons for touch and gloves; fixed viewpoints because entries are from above and below |
| Selection | Click a wire: the rest turn to glass, both ends are ringed and named. Click a part: its wires stay solid, every terminal is tagged. Buttons: Wire it, Wires, Parts, Step, Trace route | Following one wire through a bundle is the hardest thing to do on a real panel |
| Colour key | What each wire colour means, with counts; pick one to show only those | Colours are an assumption unless the drawings give them; the key says so |
| Memory | Ticks, wires done and the current step are kept in the browser; the guide reopens where it was left | A build takes days |

## Rules that came out of review

- **Targets at least 40 px high**, text in the panel 15 px or more, with a larger-text toggle.
- **The finished-panel view must fit the whole plate** in whatever shape the window is, centred in the space the instructions leave free.
- **The order of buttons matters to people.** The reviewer asked for Trace route last on the selection, then Step, then Parts, with Wire it first. Ask before reordering; keep what they chose.
- **Plain words for positions**: "primary board (left), 2nd screw from the top", not coordinates.
- **Every departure from the drawings appears where the builder meets it** (the step's task, the wire's note) and under Issues, and all of them are listed on `START HERE.txt`.
- **Nothing on screen may be garbled.** Arrows, multiplication signs and ticks are non-ASCII; see `scripts/fix_mojibake.py`.
- **It must stay smooth** on an ordinary laptop: see the performance notes in `models.md`.

## Changing it

The page's HTML and CSS are in `build.mjs`; the panel's contents are built in `src/guide.js` (`const ui`, and the toolbar section after it). After any change, open all the steps and all five views and read the console: there must be no messages. Check a narrow window (phone width) as well as a wide one, with `scripts/shot.mjs --size 390x844`.
