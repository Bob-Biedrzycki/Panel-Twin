# VFD 200 Digital Twin: Completion Description

I've built a digital twin of panel VFD 200 from `Draft rev18.pdf` (the ABARTA Coca-Cola CIP double skid, two PowerFlex 525 drives on 15 HP pumps), wired to a SCADA simulator that runs the same solver. Twin and SCADA screen both drive one simulated panel live, and the Modbus TCP server answered reads and a speed-reference write correctly. The film came out clean (no bad frames).

To run it:

```
node scada-sim.mjs
```

Then open http://127.0.0.1:8091/ for the SCADA screen and http://127.0.0.1:8091/twin for the 3D twin. A simulator is running now from this session, so those links work until you stop it. `panel-twin.html` also opens straight from disk and runs the solver on its own.

## What's in Project 2

* `panel-twin.html`: the 3D panel at real size, laid out from sheets 2 and 3. Doors open, cut-away and explode work, labels show live values, hovering a part shows its BOM line and review note, and the break button is "Fail the A/C".
* `scada.html` and `scada-sim.mjs`: the SCADA screen and server. You get a CIP process screen with clickable valves, power one-line, 24 V breaker channels, drive faceplates, panel heat, trends, alarms and instructor faults, plus Modbus TCP on port 5021.
* `panel-model.mjs`: the one solver both use. It computes pumps, motors, drive losses, breakers, E-stop, the 24 V channels, the process and enclosure heat.
* `README.md`: the design review, how to run it, what the solver assumes, and the full Modbus map (155 tags).
* `out/panel-vfd200.mp4`: the 28 s film, silent, because adding music means downloading a track. The README has the command to add one.

## Main review findings (all eleven are in the README)

1. **The A/C is undersized.** With both pumps at 60 Hz about 625 W of heat is released inside against a 1,000 BTU/h (293 W) A/C. The panel settles at 45 °C in a 30 °C room and 54 °C in a 40 °C room; the drives are rated 50 °C. Holding 35 °C inside a 40 °C room needs about 2,400 BTU/h.
2. **An A/C failure would show up only as drive trips.** Without it the panel heads for 59–64 °C and both drives trip on heatsink temperature. The A/C alarm and door-switch contacts aren't wired and there's no panel temperature sensor, so SCADA would see two drive faults and nothing else.
3. **The E-stop has no safety relay.** It feeds the safe-torque-off inputs of both drives directly, with no fault detection and no feedback to the PLC. Confirm the safety level the skid needs.
4. **FM1 has no transmitter in the BOM.** The 8721 is a sensor only (the BOM line itself says it needs a separate 8712 transmitter), but sheet 13 wires it like a powered transmitter.
5. **The PLC has no digital inputs**, so E-stop state, 24 V channel trips and A/C alarms are invisible to it. The machine network also uses 128.1.0.x, which is a public address block.

Pump curves, device powers, drive losses and the wall heat coefficient are my assumptions, because the parts database was unreachable. They're collected at the top of `panel-model.mjs` for you to replace with datasheet values. The drawings have no P&ID, so the process side is my reading of the valve and instrument names.
