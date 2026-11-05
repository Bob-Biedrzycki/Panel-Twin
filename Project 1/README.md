# VP-1 Panel Twin (OIT-24VDC)

A digital twin of panel **VP-1, 24 VDC Thin Client / OIT Panel**, built from `schematics-preview.pdf` (rev A, review copy generated 2026-11-04). It comes with a SCADA simulator that it links to live.

| File | What it is |
|---|---|
| `panel-twin.html` | The 3D twin: one self-contained page, opens from disk or from the simulator. |
| `scada-sim.mjs` | The SCADA simulator: the simulated field side plus a web SCADA screen, an HTTP/SSE API and a Modbus TCP server. Needs only Node 18+. |
| `scada.html` | The SCADA screen the simulator serves: one-line, alarms, trend, tags, instructor faults. |
| `panel-model.mjs` | The one solver both of them run: power distribution, CB1, devices, enclosure heat, alarms and the tag map. |
| `build.mjs` | Pastes `panel-model.mjs` and the Machine Skill kit into `panel-twin.html`. Run it after editing the model. |
| `out/panel-vp1.mp4` | The 28 s film. |

## Run it

```bash
node scada-sim.mjs
```

Then open:
- http://127.0.0.1:8090/ for the SCADA screen
- http://127.0.0.1:8090/twin for the 3D twin, linked live ("SCADA live" shows top right)

Writes from either side go to the same simulated panel. Move the backlight on SCADA and the twin follows. Press **Short TB1-6** in the twin and the SCADA alarms come in.

Opened straight from disk, `panel-twin.html` runs the same solver locally (standalone). It can also link to a simulator on another machine: `panel-twin.html?scada=http://host:8090`.

Options: `--port 8090`, `--modbus-port 5020`, `--host 0.0.0.0` (expose to the network; there is no authentication, as on a real Modbus device), `--no-modbus`.

Twin keys: Space pause · E explode · C cut away · X x-ray · S slow · L labels · D door · B short TB1-6. Hover any part for its BOM line and the review note on it.

Film (the twin plays its own 28 s story in `?film=1` mode):

```bash
node ~/.claude/skills/machine/scripts/record.mjs panel-twin.html out/panel-vp1.mp4 --root . --music freepd:Classical/Easy_Lemon
```

## Modbus TCP map (zero-based addresses, any unit id)

Registers are unsigned 16-bit, raw = value × scale. In 1-based "Modicon" notation, input register 0 is 300001, holding register 0 is 400001, and so on.

| Type | Addr | Tag | Scale | Unit |
|---|---|---|---|---|
| IR (FC4) | 0 | VP1.Field.Voltage | 100 | V |
| IR | 1 | VP1.Bus.Voltage (TB1-4..6) | 100 | V |
| IR | 2 | VP1.CB1.Current | 100 | A |
| IR | 3 | VP1.HMI1.Voltage | 100 | V |
| IR | 4 | VP1.TC1.Voltage | 100 | V |
| IR | 5 | VP1.HMI1.Power | 10 | W |
| IR | 6 | VP1.TC1.Power | 10 | W |
| IR | 7 | VP1.Heat.Internal | 10 | W |
| IR | 8 | VP1.Enc.Temp | 10 | °C |
| IR | 9 | VP1.Enc.TempSettle | 10 | °C |
| IR | 10 | VP1.Ambient.Temp | 10 | °C |
| IR | 11 | VP1.CB1.Thermal (% of trip) | 10 | % |
| IR | 12 | VP1.TC1.Mode (0 off, 1 booting, 2 running) | 1 | |
| IR | 13 | VP1.TC1.BootPct | 1 | % |
| IR | 14 | VP1.Alarm.Word | 1 | bits |
| IR | 15 | VP1.Heartbeat | 1 | |
| IR | 16 | VP1.TB1_8.Temp | 10 | °C |
| DI (FC2) | 0..5 | CB1.Closed, HMI1.On, TC1.Running, Bus.OK, Supply.Limiting, Alarm.Any | | |
| HR (FC3/6/16) | 0 | VP1.Field.VoltageSP | 100 | V |
| HR | 1 | VP1.HMI1.Backlight | 1 | % |
| HR | 2 | VP1.TC1.CpuLoad | 1 | % |
| HR | 3 | VP1.Ambient.TempSP | 10 | °C |
| HR | 4 | VP1.Sim.TimeWarp (thermal only) | 1 | × |
| Coil (FC1/5/15) | 0 | Fault: short TB1-6 to 0 V | | |
| Coil | 1 | Fault: loose 0 V at TB1-8 | | |
| Coil | 2 | Fault: field supply lost | | |
| Coil | 3 | Field action: reset CB1 (pulse) | | |
| Coil | 4 | Field action: open CB1 (pulse) | | |
| Coil | 5 | Acknowledge all alarms (pulse) | | |

Alarm word bits (IR 14), bit 0 first: PSU_LOST, CB1_TRIP, SHORT, BUS_UV, BUS_OV, TC1_DOWN, HMI_DOWN, TC1_V, CB1_LOAD, T_HI, T_HIHI, TB1_8_HOT.

## What the solver computes

- **24 VDC distribution (sheet 2).** Field supply → TB1-2 → CB1 → jumpered bus TB1-4..6. HMI1 and TC1 are constant-power loads behind their own wire resistance (`I·V_bus − I²·R = P`), so they draw more current as the voltage sags. Each drops out below 10 V and restarts above 11.5 V.
- **CB1 1489-M1C060.** First-order thermal element (τ = 90 s, trips at 1.13 In: 20 s at 2.55 In, 85 s at 1.45 In). Magnetic trip at 14 In on DC.
- **TC1.** 28 s boot; HMI1 is in power save until the client is on screen.
- **Enclosure heat.** `C·dT/dt = P_in − k·A·(T − T_amb)` with A = 1.21 m² (back on the wall) and k = 4.5 W/m²K. Heat sources: TC1, 55 % of HMI1, CB1 and wire losses.

**Assumed, not from the review set** (PartsLib was unreachable). All in `P` at the top of `panel-model.mjs`: device powers (HMI1 7 + 35 W × backlight, TC1 8.5–22 W), the field supply (10 A unit limiting at 12 A, 0.25 Ω source and cable), wire lengths and gauges (sheet 7: wire not itemised), CB1 internal resistance and DC magnetic factor, the 0–50 °C device ratings, the wall heat coefficient and the masses. Swap in datasheet values and run `node build.mjs`.

Wire colours, routes and the door service loop in the 3D model are drawn for the twin, not specified by the drawings.

## Design review notes (from the drawings and the twin)

1. **CB1 will not trip magnetically on a current-limited supply.** A bolted fault on wire 100 puts the field supply into current limit (12 A assumed): CB1 needs about 35 s to clear it on its thermal element, while the bus sits at about 0.2 V. Confirm the upstream supply's rating and limit mode (constant current or hiccup). If the fault must clear fast, consider a lower CB1 rating or an electronic circuit breaker. Full load here is only about 2.8 A.
2. **TB1-6 is a live spare** on the +24 V jumper group, next to TB1-7 (0 V). Consider removing it from the jumper, fitting an end cover, or marking it.
3. **Heat.** About 45 W inside at full backlight and CPU gives about 8.4 K rise. With 50 °C device ratings the room must stay below about 41 °C, or the panel needs cooling. (k and the device ratings are assumed: confirm.)
4. **Door.** No door bonding strap is drawn. HMI1 is PE'd through its own conductor, but check whether your build standard requires bonding the door itself. The hinge service loop (DisplayPort, USB, 100/0V/PE) has no parts yet: cable, spiral wrap and strain relief.
5. **Not in the BOM:** field entry hardware for the 24 V/0 V/PE conductors (a hub or cord grip that keeps the stainless enclosure's rating), and TC1's network connection (LAN A is unwired, and ThinManager needs it to boot a client).
6. Already flagged on the sheets and still open: subplate 27.00 vs 26.94 in; HMI1 cutout position taken from one photo; device tags unverified (Todd to approve); wire not itemised.
