# Terminals, landings and wire dressing

A landing is where a conductor ends: the tip inside the clamp, the mouth where the insulation stops, the direction it leaves, and a clear point just outside the device where it is free to turn. Everything a builder judges the guide by is here.

## Three ways to say where a terminal is

**1. A layout: fractions of the device's face** (`src/terminals.mjs`). For every device type, `pins: { name: [u, v, z, entry] }`: `u` across from the left edge, `v` down from the top, `z` the clamp's depth as a fraction of the body (1 is the front), and `entry`: `'t'` wire in from above, `'b'` from below, `'f'` from the front, `'l'` from the left. Use this for parts built from catalogue shapes and for a first pass.

**2. Pins in the maker's model** (`src/model_fit.mjs`, `pins`). The clamp's position in the model's own millimetres. Use this whenever a maker's model exists: layout sheet pictures put lugs 4 to 7 mm from where the model has them.

**3. An explicit landing** (`landings` in `model_fit.mjs`, or built in code). Tip, mouth and entry given outright, for openings measured on the model with rays, and for terminal blocks the guide builds itself because the maker's model leaves them out (drive terminal blocks, removable blocks behind a module's door).

For 1 and 2 the guide then probes the model along the entry direction for an opening that reaches the clamp and is walled in around it, and puts the conductor there. If the model has no opening drawn, the wire enters through the face behind the screw and gets a dark entry mark. The audit lists these as `notFound`; they are acceptable for catalogue-shape parts and flat-drawn push-ins, and a prompt to measure for anything with a real lug.

Each layout carries `conf` (`measured`, `documented`, `approx`) and `src`, a sentence saying where the positions come from. Keep it true: it is shown on the part.

## Measuring on a model

`window.guide.soupOf(guide.DEV.TAG)` returns the device's triangles in machine metres. Cast rays (the example's audit and probes use a plain Moller-Trumbore loop) to find: the depth of a recess, the floor under a terminal block, where a housing is open and where it has a wall, the bottom edge of a moulding. This is how the example found that a module's wires must leave through its wire channel (the housing has a floor everywhere else), and that a fuse block sat 12 mm too far from its switch.

## How a wire leaves a device

By default it runs straight out along its entry direction until it is clear of the device's outline, then turns for the nearest duct of the right class (AC power or DC/signal; grounds may use either), runs the duct graph, and comes in to the other end the same way. Things that change this:

- **`via` and `clear` on a landing**: the wire's own way out of the device, as points. Used where wires must leave together in an orderly way: down a module's terminal column in separate places and out through its wire channel; from a drive's control block across to the left edge of the drive, clear of the power terminals and their legend.
- **Direct runs**: two terminals that face each other with nothing between them (a switch's load lugs above a fuse block's line lugs) are wired straight across, not out to a duct and back.
- **Front entries in one column** stand off in steps, like a dressed comb, so each wire passes in front of the ones below it.
- **Corner rounding**: every corner of every run is rounded to a radius that grows with the wire (at least three diameters where the run allows). Duct turns closer than 30 mm are merged. A cord leaving a front jack runs straight for a few diameters before it turns.
- **Off-plate ends** (door, side wall, floor glands): the tail takes over from the duct lane. Do not route to an exit point and back.

Routing decisions belong to the person dressing the panel as much as to the drawing. When a reviewer says wires are "where they shouldn't be", look for runs across the face of a device, over a legend or terminals someone needs to see, or hanging in front of a part.

## Special cases the example had to settle

| Case | What the guide does | Why |
|---|---|---|
| Two or three conductors in one clamp | They lie side by side across the clamp (`sideBySide`), counted before any is built | Drawn on one line they look like one wire |
| Terminals behind a cover | The cover comes off, or stays on as x-ray glass that clicks pass through; the block behind it is built where the manual puts it | A wire ending on a closed cover teaches nothing |
| Jumper between terminals on one device | A loop out of both clamps; a plain U when they are far enough apart, a teardrop when they are closer than the wire can turn; each jumper on a device a step deeper than the last; one marker on a short jumper | Overlapping jumpers and two 14 mm markers on a 60 mm wire are a knot |
| A link the maker supplies (transformer voltage link) | Drawn as the flat metal link between the two screws; listed with "nothing to cut" (`s.link` in `build.mjs`, `buildLink`) | A wire here loops out past the device and back |
| A connection the hardware makes itself (fuses bridging a switch to a trailer fuse block) | The conductors are marked not fitted with the reason; the parts that make the connection are drawn | The drawing's wires have nothing to land on |
| Fuses | Each is a device of its own (`at: 'fuse'`, `addFuse`), drawn in its holder, clickable, findable, listed. A fuse hidden in a carrier shows through a window | Builders order and fit fuses; they need to be parts |
| Site conductors with no entry drawn (incoming feeder, ground) | A short tail at the landing with an open end; listed as by the installer (`s.feeder`, `buildFeeder`) | Routing them through the ducts to an invented gland would be a guess |
| A numbered wire through a pass-through terminal | The number goes on the side of the terminal the drawing puts it on | Two wires with one marker is a real shop error |

## End hardware and cut length

`TERM_SPEC` in `src/guide.js` holds, per part number, the torque, wire range and strip length with the document and page it came from. The end type (ferrule, bare, RJ45, under a screw) follows the terminal and the size. Cut length is the routed length plus, per end, the strip length and a service loop, shown as a sum the builder can check. If a document does not give a value, the card says so; it never shows a made-up number.

Wire colours follow NFPA 79 13.2.4 when the drawings give none, and the guide says that is an assumption.
