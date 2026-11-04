# VFD 200 Panel Twin (ABARTA Coca-Cola CIP Double Skid, CPME 1082-01)

A digital twin of panel **VFD 200**, the 480 V drive panel for the two CIP supply pumps, built from `Draft rev18.pdf` (rev A, 18 sheets). It comes with a SCADA simulator that it links to live.

| File | What it is |
|---|---|
| `panel-twin.html` | The 3D twin: one self-contained page. It opens from disk or from the simulator. |
| `scada-sim.mjs` | The SCADA simulator: the simulated field side, a web SCADA screen, an HTTP/SSE API and a Modbus TCP server. Needs only Node 18+. |
| `scada.html` | The SCADA screen the simulator serves: CIP mimic with clickable VM1 valves, power one-line, CB4 channels, drives, panel heat, trend, tags, alarms, instructor faults. |
| `panel-model.mjs` | The one solver both of them run: feeder, drives, motors, pumps, 24 V channels, the CIP process, enclosure heat, alarms and the tag map. |
| `build.mjs` | Pastes `panel-model.mjs` and the Machine Skill kit into `panel-twin.html`, and regenerates the Modbus map below. Run it after you edit the model. |
| `out/panel-vfd200.mp4` | The 28 s film (silent). |
| `../Draft rev18.pdf` | The review set it was built from (one folder up, in Project 2). |

## Run it

From this folder (`Project 2/Claude Digital Twin`):

```bash
node scada-sim.mjs
```

Then open:
- http://127.0.0.1:8091/ for the SCADA screen
- http://127.0.0.1:8091/twin for the 3D twin, linked live (the top-right pill reads "SCADA live")

Both sides write to the same simulated panel. Start, stop or change speed on SCADA and the twin's drives, HMI and LCDs follow. Press **Fail the A/C** in the twin and the SCADA alarms come in.

Opened straight from disk, `panel-twin.html` runs the same solver locally (standalone, thermal time ×120). It can also link to a simulator on another machine: `panel-twin.html?scada=http://host:8091`.

Options: `--port 8091`, `--modbus-port 5021`, `--host 0.0.0.0` (exposes it to the network; there is no authentication, as on a real Modbus device), `--no-modbus`. The ports default to 8091/5021 so this runs beside the Project 1 simulator (8090/5020).

Twin keys: Space pause · E explode · C cut away · X x-ray · S slow · L labels · D doors · B fail the A/C. Hover over any part to see its BOM line and its review note.

Film (the twin plays its own 28 s story in `?film=1` mode):

```bash
node ~/.claude/skills/machine/scripts/record.mjs panel-twin.html out/panel-vfd200.mp4 --root .
```

Add `--music freepd:Classical/Easy_Lemon` for a CC0 music bed. It downloads the track from archive.org, so the film here was recorded silent.

## Design review: what the drawings and the solver show

Most important first. Numbers marked *computed* come from the solver, so they inherit its assumptions (listed further down).

1. **The A/C is undersized for two 15 HP drives.** With both pumps at 60 Hz, about **625 W** is released inside the enclosure *(computed)*: the drives' losses (~246 W each), PWS1, the 24 V devices, T1 and the conductors. The Enviro-Therm is rated **1,000 BTU/h = 293 W** (BOM). The panel air settles at **40.5 °C in a 25 °C room, 44.9 °C at 30 °C, 49.2 °C at 35 °C and 53.6 °C at 40 °C** *(computed)*. It never reaches the 35 °C thermostat setpoint, and in a 40 °C room it is above the PowerFlex 525 IP20 rating of 50 °C. Holding 35 °C inside in a 40 °C room needs about 710 W (≈2,400 BTU/h), so look at a ~3,000 BTU/h unit, or move the drive heat out (flange or through-the-wall heatsinks). Confirm the drive loss against the PowerFlex 525 watts-loss table first; it is assumed here (~2.7 % of rating).
2. **If the A/C fails, the drives trip and nobody is told why.** Without the A/C the panel heads for **59 °C (25 °C room) to 64 °C (30 °C room)**. From a 30 °C room upward, both drives reach their heatsink trip (F8) and the CIP stops *(computed)*. The A/C alarm contacts (X2-1..X2-3) and door switch (X2-4/X2-5) are **not wired** (sheet 6), and there is no enclosure temperature sensor. SCADA would see two F8 faults and nothing else. Wire the A/C alarm and door switch to spare AL1920 digital inputs, and consider a panel temperature transmitter on a spare IO-Link port.
3. **E-STOP safety circuit.** One 800H mushroom with two NC contacts, both fed from CB4 OUT8, goes straight to S1/S2 of both drives (sheet 5). There is no safety relay, no cross-fault or short detection, and the PLC gets no E-STOP feedback (IO1 only drives the lamp). Confirm the performance level the skid's risk assessment needs; a dual-channel safety relay or GuardLogix may be required. A CB4 OUT8 trip removes STO, which fails safe.
4. **FM1 is a sensor only.** The BOM line for the 8721AHA020UA1 says "requires separate 8712 transmitter", but sheet 13 wires FM1 as a powered transmitter (L1/N, 4–20 mA HART, pulse). There is no 8712 transmitter in the BOM.
5. **CE1 supply voltage is unconfirmed.** Sheet 13 already flags "Voltage rating source unknown". "Rosemount 1056" is not a complete model number: the 1056 comes in AC and 24 VDC versions. It is fed from PDB2 (24 V).
6. **The PLC has no digital inputs.** IO1 (1769-OW16) is outputs only. E-STOP state, CB4 channel trips (the 787-1668 signal contact and S1 are unwired), A/C alarm and door switch are all invisible to the PLC and SCADA. CB4 OUT3 is a good example: one shorted sensor cable trips it, and LT1–LT3, FM1, FM2, CE1, CE2, TT1, SC1 and SC2 all go bad at once *(twin: Short on CB4 OUT3)*.
7. **Network.** The machine network uses **128.1.0.0/24**, a public address block (PLC .4, HMI .10, drives .20/.21, CPL .30–.32). NS2 isolates it, but a private range is safer. NS2's plant IP and mask are TBD. NS1 is unmanaged, so the AL1920 DLR capability goes unused.
8. **Sheet 2 (door layout).** The 1524 × 1245 mm outline is labelled "Subplate Dimension" but it is the enclosure (subplate 1 is 1422 × 1118, sheet 3). The right door is drawn as a copy of the left one (hinges on its left edge at the centre post, handle on the right edge). A two-door XEL with a removable centre post normally hinges it on the right; the twin does that, so confirm. The A/C and subplate 2 (VM1) positions are not drawn: the twin puts both on the left side.
9. **BOM gaps.**
   - Only C2WH6 covers are listed, but the 2,454 mm of F3X2WH6 duct needs C3WH6 covers.
   - The GLG isolators are listed as quantity 7 against six devices (SI1–SI6).
   - 1769-ECR has no manufacturer.
   - "Recept-2 / Component1" is a placeholder.
   - Every cable (LUTZE, IFM EVC/EVT, Quabbin PLTC) is listed as 0.00 mm long.
   - There is no field entry hardware for a 4X stainless enclosure: hubs, glands or a gland plate for the feeder, two motor cables, ~25 instrument cables and the VM1 air tubes.
   - The floor stand, E-STOP legend plate and door bonding straps are not listed.
   - GB2 has no position.
10. **Smaller items.**
   - VM1 outputs 29 and 31 are both labelled "TW line feed" (sheet 10).
   - TB2's field sides are all TBD.
   - TB4 is drawn about 450 mm long on sheet 3, but 72 × 1492-J4 (5.1 mm) is about 370 mm plus anchors.
   - The CE2–CE4 locations are assumed.
11. **Checked and fine** *(computed, with the assumptions below)*:
   - Each drive draws about **17.7 A** at 60 Hz, so CB1/CB2 at their **24 A** minimum (sheet 4 note) run at about 37 % of their thermal trip.
   - The feeder carries about **36 A** on a 70 A class J / 4 AWG / 100 A Q1.
   - PWS1 runs at **4.5 A of 20 A**, and every CB4 channel is at or under 53 % of its setting.
   - T1 carries about **510 VA of 750 VA** with the A/C compressor on, leaving about 240 VA for the laptop receptacle.
   - The motor overload P033 is set at the 17.7 A nameplate current.

## What the solver computes

- **Drives, motors, pumps (sheets 4, 5, 14).** Each PowerFlex 525 ramps at 6 Hz/s to its EtherNet/IP speed reference. The motor slip is proportional to torque. The pump follows the affinity laws on its curve (H = 62 r² − 0.0056 Q²), meeting a circuit curve (8 + 0.016 Q²). Shaft power = r³·P_so + (P_bep − P_so)·r²·Q/Q_bep. At 60 Hz each pump gives 50.3 m³/h at 48.4 m for 9.5 kW, and the motor runs at 3,511 rpm and 15.2 A. Motor losses split into iron (35 %) and copper (65 %, ∝ I²); the drive loss is 28 + 9 I + 0.35 I² W; the input current is P_in / (√3 · 480 · 0.72). The drive's motor overload (P033, 150 % for 60 s), its current limit (1.5 × 24 A), its heatsink (0.15 K/W above the panel air, F8 at 100 °C), the 140MT class 10 thermal element and EtherNet/IP comm loss (F81) all integrate.
- **E-STOP (sheet 5).** It removes STO from both drives. The pumps coast against their load (J = 0.12 kg m²), and the run command has to be given again.
- **24 VDC (sheet 7).** PWS1 → CB4 channels at 3, 3, 4, 4, 4, 2, 2, 2 A, each with its loads. A channel trips past its setting; a short is limited to 1.5 × the setting and trips in about 1 s. A channel trip takes down what it feeds: PLC1 (and every drive with it, F81), HMI1, CPL1–3 (their instruments read bad), VM1 (every valve closes), or NS1/NS2.
- **The CIP process (sheets 10–14).** There is no P&ID in the review set, so this is an interpretation of the valve and instrument names. Three 3 m³ tanks (LT1–3, CE2–4) feed a shared suction header through their bottom valves (Y1–Y3) or the TW line feed (Y29/Y31). Pump 1 and pump 2 each feed a supply circuit with a heat exchanger (TEA HEX Y32, TW HEX Y9), FM1/FM2 and TT1/TT3; the returns come back on FM3/FM4 and TT2/TT4 to the tank tops (Y4–Y6) or to drain (Y8, Y25). TEA feeds tank 1 (Y27), TW feeds tanks 2 and 3 (Y28, Y30), and TEA can be dosed into the suction (Y10). Mass, energy and conductivity are balanced on each tank. With no suction the pump runs dry; with no return path it dead-heads and its casing heats; the PLC drops either after 8 s.
- **Enclosure heat.** `C dT/dt = P_in − Q_ac(T) − k A (T − T_room)` with A = 3.88 m² (back to a wall), k = 4.5 W/m²K and C = 120 kJ/K, which gives a time constant of about 1 h 55 min (use the time warp). The A/C cycles on its 35 °C thermostat; its capacity falls with the room temperature and rises with the panel temperature: `Q_ac = 293 (0.3 + 0.02 T − 0.01 (T_room − 35))` W.

**Assumed, not printed in the review set** (PartsLib was unreachable when this was built). They are all in `P` at the top of `panel-model.mjs`:
- the pumps and the circuit;
- drive losses, input power factor and heatsink resistance;
- motor efficiency (91.7 %) and magnetising current;
- the 140MT pole resistance and time constant;
- every 24 V device power;
- A/C current and capacity curve, thermostat setpoint and fan heat;
- T1 losses, wall coefficient and heat capacity;
- tank size, feeds, heat exchanger UA and fluid properties;
- the 30 °C default room.

Replace any of them with datasheet values and run `node build.mjs`.

The 3D layout is from sheets 2 and 3 (subplate ordinates scaled from the drawing). Device bodies are drawn to their catalogue envelopes; wire colours, routes, the conduit hubs and the A/C and subplate 2 positions are drawn for the twin, not specified by the drawings.

## Modbus TCP map (zero-based addresses, any unit id)

Registers are unsigned 16-bit, raw = value × scale. An instrument whose IO-Link master is off reads 65535 (bad). In 1-based "Modicon" notation, input register 0 is 300001, holding register 0 is 400001, and so on. `GET /api/tags` returns the same map as JSON.

<!-- modbus-map:start -->
| Type | Addr | Tag | Scale | Unit | What |
|---|---|---|---|---|---|
| IR (FC4) | 0 | VFD200.Supply.Voltage | 1 | V | 480 V feeder at Q1 (line to line) |
| IR (FC4) | 1 | VFD200.Supply.Current | 10 | A | Line current through FU1 (largest phase) |
| IR (FC4) | 2 | VFD200.DRV1.State | 1 |  | 0 off, 1 ready, 2 running, 3 safe torque off, 4 fault |
| IR (FC4) | 3 | VFD200.DRV1.OutFreq | 10 | Hz | DRV1 output frequency |
| IR (FC4) | 4 | VFD200.DRV1.OutCurrent | 10 | A | DRV1 output (motor) current |
| IR (FC4) | 5 | VFD200.DRV1.OutVoltage | 1 | V | DRV1 output voltage |
| IR (FC4) | 6 | VFD200.DRV1.OutPower | 100 | kW | DRV1 output power |
| IR (FC4) | 7 | VFD200.DRV1.InCurrent | 10 | A | DRV1 input current (through CB1) |
| IR (FC4) | 8 | VFD200.DRV1.Loss | 1 | W | DRV1 heat released in the panel |
| IR (FC4) | 9 | VFD200.DRV1.Heatsink | 10 | °C | DRV1 heatsink (F8 at 100 °C) |
| IR (FC4) | 10 | VFD200.DRV1.MotorOL | 1 | % | DRV1 motor overload accumulator, % of trip |
| IR (FC4) | 11 | VFD200.MTR1.Speed | 1 | rpm | MTR1 shaft speed |
| IR (FC4) | 12 | VFD200.MTR1.Torque | 10 | N·m | MTR1 torque |
| IR (FC4) | 13 | VFD200.CB1.Thermal | 1 | % | CB1 140MT thermal element, % of trip |
| IR (FC4) | 14 | VFD200.P1.Head | 10 | m | Pump 1 head |
| IR (FC4) | 15 | VFD200.P1.ShaftPower | 100 | kW | Pump 1 shaft power |
| IR (FC4) | 16 | VFD200.P1.CasingTemp | 10 | °C | Pump 1 casing water (dead-head) |
| IR (FC4) | 17 | VFD200.DRV2.State | 1 |  | 0 off, 1 ready, 2 running, 3 safe torque off, 4 fault |
| IR (FC4) | 18 | VFD200.DRV2.OutFreq | 10 | Hz | DRV2 output frequency |
| IR (FC4) | 19 | VFD200.DRV2.OutCurrent | 10 | A | DRV2 output (motor) current |
| IR (FC4) | 20 | VFD200.DRV2.OutVoltage | 1 | V | DRV2 output voltage |
| IR (FC4) | 21 | VFD200.DRV2.OutPower | 100 | kW | DRV2 output power |
| IR (FC4) | 22 | VFD200.DRV2.InCurrent | 10 | A | DRV2 input current (through CB2) |
| IR (FC4) | 23 | VFD200.DRV2.Loss | 1 | W | DRV2 heat released in the panel |
| IR (FC4) | 24 | VFD200.DRV2.Heatsink | 10 | °C | DRV2 heatsink (F8 at 100 °C) |
| IR (FC4) | 25 | VFD200.DRV2.MotorOL | 1 | % | DRV2 motor overload accumulator, % of trip |
| IR (FC4) | 26 | VFD200.MTR2.Speed | 1 | rpm | MTR2 shaft speed |
| IR (FC4) | 27 | VFD200.MTR2.Torque | 10 | N·m | MTR2 torque |
| IR (FC4) | 28 | VFD200.CB2.Thermal | 1 | % | CB2 140MT thermal element, % of trip |
| IR (FC4) | 29 | VFD200.P2.Head | 10 | m | Pump 2 head |
| IR (FC4) | 30 | VFD200.P2.ShaftPower | 100 | kW | Pump 2 shaft power |
| IR (FC4) | 31 | VFD200.P2.CasingTemp | 10 | °C | Pump 2 casing water (dead-head) |
| IR (FC4) | 32 | VFD200.FM1.Flow | 10 | m³/h | FM1 supply 1 flow (8721 mag, via SI2/SC2) |
| IR (FC4) | 33 | VFD200.FM2.Flow | 10 | m³/h | FM2 supply 2 flow (SUH401) |
| IR (FC4) | 34 | VFD200.FM3.Flow | 10 | m³/h | FM3 return 1 flow (SUH401) |
| IR (FC4) | 35 | VFD200.FM4.Flow | 10 | m³/h | FM4 return 2 flow (SUH401) |
| IR (FC4) | 36 | VFD200.TT1.Temp | 10 | °C | TT1 supply 1 temperature |
| IR (FC4) | 37 | VFD200.TT2.Temp | 10 | °C | TT2 return 1 temperature |
| IR (FC4) | 38 | VFD200.TT3.Temp | 10 | °C | TT3 supply 2 temperature |
| IR (FC4) | 39 | VFD200.TT4.Temp | 10 | °C | TT4 return 2 temperature |
| IR (FC4) | 40 | VFD200.CE1.Cond | 10 | mS/cm | CE1 supply conductivity (Rosemount 1056, via SI1/SC1) |
| IR (FC4) | 41 | VFD200.LT1.Level | 10 | % | LT1 tank 1 level (PM1708, hydrostatic) |
| IR (FC4) | 42 | VFD200.CE2.Cond | 10 | mS/cm | CE2 tank 1 conductivity (LDL201) (ASSUMED location) |
| IR (FC4) | 43 | VFD200.Tank1.Temp | 10 | °C | Tank 1 temperature (CE2 LDL201 temperature) |
| IR (FC4) | 44 | VFD200.LT2.Level | 10 | % | LT2 tank 2 level (PM1708, hydrostatic) |
| IR (FC4) | 45 | VFD200.CE3.Cond | 10 | mS/cm | CE3 tank 2 conductivity (LDL201) (ASSUMED location) |
| IR (FC4) | 46 | VFD200.Tank2.Temp | 10 | °C | Tank 2 temperature (CE3 LDL201 temperature) |
| IR (FC4) | 47 | VFD200.LT3.Level | 10 | % | LT3 tank 3 level (PM1708, hydrostatic) |
| IR (FC4) | 48 | VFD200.CE4.Cond | 10 | mS/cm | CE4 tank 3 conductivity (LDL201) (ASSUMED location) |
| IR (FC4) | 49 | VFD200.Tank3.Temp | 10 | °C | Tank 3 temperature (CE4 LDL201 temperature) |
| IR (FC4) | 50 | VFD200.PWS1.Current | 100 | A | PWS1 24 V output current |
| IR (FC4) | 51 | VFD200.CB4.Ch1.Current | 100 | A | CB4 OUT1: PWS2 (PLC1 rack) (set 3 A) |
| IR (FC4) | 52 | VFD200.CB4.Ch2.Current | 100 | A | CB4 OUT2: HMI1 (set 3 A) |
| IR (FC4) | 53 | VFD200.CB4.Ch3.Current | 100 | A | CB4 OUT3: CPL1 (set 4 A) |
| IR (FC4) | 54 | VFD200.CB4.Ch4.Current | 100 | A | CB4 OUT4: CPL2 (set 4 A) |
| IR (FC4) | 55 | VFD200.CB4.Ch5.Current | 100 | A | CB4 OUT5: CPL3 (set 4 A) |
| IR (FC4) | 56 | VFD200.CB4.Ch6.Current | 100 | A | CB4 OUT6: VM1 (set 2 A) |
| IR (FC4) | 57 | VFD200.CB4.Ch7.Current | 100 | A | CB4 OUT7: PDB2 (NS1, NS2, CE1, SI1, FM1, SI2, IO1) (set 2 A) |
| IR (FC4) | 58 | VFD200.CB4.Ch8.Current | 100 | A | CB4 OUT8: E-STOP (STO) (set 2 A) |
| IR (FC4) | 59 | VFD200.T1.Load | 1 | VA | T1 load (A/C + receptacle) |
| IR (FC4) | 60 | VFD200.Heat.Internal | 1 | W | Heat released inside the enclosure |
| IR (FC4) | 61 | VFD200.AC.Cooling | 1 | W | A/C heat removed now |
| IR (FC4) | 62 | VFD200.Enc.Temp | 10 | °C | Enclosure air (SIMULATION: no sensor in the design) |
| IR (FC4) | 63 | VFD200.Enc.TempSettle | 10 | °C | Temperature it settles at |
| IR (FC4) | 64 | VFD200.Ambient.Temp | 10 | °C | Room ambient |
| IR (FC4) | 65 | VFD200.Alarm.Word0 | 1 |  | Active alarm bits 0-15 (see README) |
| IR (FC4) | 66 | VFD200.Alarm.Word1 | 1 |  | Active alarm bits 16-31 (see README) |
| IR (FC4) | 67 | VFD200.Heartbeat | 1 |  | Counts every solver step |
| DI (FC2) | 0 | VFD200.Q1.Closed |  |  | Q1 disconnect closed |
| DI (FC2) | 1 | VFD200.CB1.Closed |  |  | CB1 closed |
| DI (FC2) | 2 | VFD200.CB2.Closed |  |  | CB2 closed |
| DI (FC2) | 3 | VFD200.DRV1.Running |  |  | DRV1 running |
| DI (FC2) | 4 | VFD200.DRV2.Running |  |  | DRV2 running |
| DI (FC2) | 5 | VFD200.DRV1.Faulted |  |  | DRV1 faulted |
| DI (FC2) | 6 | VFD200.DRV2.Faulted |  |  | DRV2 faulted |
| DI (FC2) | 7 | VFD200.EStop.Healthy |  |  | E-stop released (STO inputs energised) |
| DI (FC2) | 8 | VFD200.PLC1.Running |  |  | PLC1 powered |
| DI (FC2) | 9 | VFD200.Net.OK |  |  | Machine network up (NS1) |
| DI (FC2) | 10 | VFD200.CPL1.OK |  |  | CPL1 IO-Link master powered |
| DI (FC2) | 11 | VFD200.CPL2.OK |  |  | CPL2 IO-Link master powered |
| DI (FC2) | 12 | VFD200.CPL3.OK |  |  | CPL3 IO-Link master powered |
| DI (FC2) | 13 | VFD200.CB4.Ch1.On |  |  | CB4 OUT1 on |
| DI (FC2) | 14 | VFD200.CB4.Ch2.On |  |  | CB4 OUT2 on |
| DI (FC2) | 15 | VFD200.CB4.Ch3.On |  |  | CB4 OUT3 on |
| DI (FC2) | 16 | VFD200.CB4.Ch4.On |  |  | CB4 OUT4 on |
| DI (FC2) | 17 | VFD200.CB4.Ch5.On |  |  | CB4 OUT5 on |
| DI (FC2) | 18 | VFD200.CB4.Ch6.On |  |  | CB4 OUT6 on |
| DI (FC2) | 19 | VFD200.CB4.Ch7.On |  |  | CB4 OUT7 on |
| DI (FC2) | 20 | VFD200.CB4.Ch8.On |  |  | CB4 OUT8 on |
| DI (FC2) | 21 | VFD200.AC.Compressor |  |  | A/C compressor running |
| DI (FC2) | 22 | VFD200.Alarm.Any |  |  | Any alarm active |
| DI (FC2) | 23 | VFD200.VM1.Y01.Out |  |  | VM1 output 1 energised: Tank 1 bottom |
| DI (FC2) | 24 | VFD200.VM1.Y02.Out |  |  | VM1 output 2 energised: Tank 2 bottom |
| DI (FC2) | 25 | VFD200.VM1.Y03.Out |  |  | VM1 output 3 energised: Tank 3 bottom |
| DI (FC2) | 26 | VFD200.VM1.Y04.Out |  |  | VM1 output 4 energised: Tank 1 top |
| DI (FC2) | 27 | VFD200.VM1.Y05.Out |  |  | VM1 output 5 energised: Tank 2 top |
| DI (FC2) | 28 | VFD200.VM1.Y06.Out |  |  | VM1 output 6 energised: Tank 3 top |
| DI (FC2) | 29 | VFD200.VM1.Y08.Out |  |  | VM1 output 8 energised: CIP tank drain |
| DI (FC2) | 30 | VFD200.VM1.Y09.Out |  |  | VM1 output 9 energised: TW HEX feed |
| DI (FC2) | 31 | VFD200.VM1.Y10.Out |  |  | VM1 output 10 energised: TEA mod feed |
| DI (FC2) | 32 | VFD200.VM1.Y25.Out |  |  | VM1 output 25 energised: System drain |
| DI (FC2) | 33 | VFD200.VM1.Y26.Out |  |  | VM1 output 26 energised: EVO pump feed |
| DI (FC2) | 34 | VFD200.VM1.Y27.Out |  |  | VM1 output 27 energised: TEA feed tank 1 |
| DI (FC2) | 35 | VFD200.VM1.Y28.Out |  |  | VM1 output 28 energised: TW feed tank 2 |
| DI (FC2) | 36 | VFD200.VM1.Y29.Out |  |  | VM1 output 29 energised: TW line feed |
| DI (FC2) | 37 | VFD200.VM1.Y30.Out |  |  | VM1 output 30 energised: TW feed tank 3 |
| DI (FC2) | 38 | VFD200.VM1.Y31.Out |  |  | VM1 output 31 energised: TW line feed (2) |
| DI (FC2) | 39 | VFD200.VM1.Y32.Out |  |  | VM1 output 32 energised: TEA HEX feed |
| HR (FC3/6/16) | 0 | VFD200.DRV1.SpeedRef | 10 | Hz | DRV1 speed reference (P047 EtherNet/IP) |
| HR (FC3/6/16) | 1 | VFD200.DRV2.SpeedRef | 10 | Hz | DRV2 speed reference (P047 EtherNet/IP) |
| HR (FC3/6/16) | 2 | VFD200.CB1.Setting | 10 | A | CB1 thermal dial (24-32 A) |
| HR (FC3/6/16) | 3 | VFD200.CB2.Setting | 10 | A | CB2 thermal dial (24-32 A) |
| HR (FC3/6/16) | 4 | VFD200.RCP1.Load | 1 | W | Laptop on the receptacle (simulation) |
| HR (FC3/6/16) | 5 | VFD200.Supply.VoltageSP | 1 | V | Feeder voltage (simulation) |
| HR (FC3/6/16) | 6 | VFD200.Ambient.TempSP | 10 | °C | Room ambient (simulation) |
| HR (FC3/6/16) | 7 | VFD200.Sim.TimeWarp | 1 | x | Thermal time warp (enclosure and heatsinks only) |
| Coil (FC1/5/15) | 0 | VFD200.DRV1.Run |  |  | DRV1 run command (PLC, P046 EtherNet/IP) |
| Coil (FC1/5/15) | 1 | VFD200.DRV2.Run |  |  | DRV2 run command (PLC, P046 EtherNet/IP) |
| Coil (FC1/5/15) | 2 | VFD200.DRV1.FaultReset |  |  | DRV1 fault reset (pulse) |
| Coil (FC1/5/15) | 3 | VFD200.DRV2.FaultReset |  |  | DRV2 fault reset (pulse) |
| Coil (FC1/5/15) | 4 | VFD200.CB4.Ch1.Reset |  |  | CB4 OUT1 reset (pulse) |
| Coil (FC1/5/15) | 5 | VFD200.CB4.Ch2.Reset |  |  | CB4 OUT2 reset (pulse) |
| Coil (FC1/5/15) | 6 | VFD200.CB4.Ch3.Reset |  |  | CB4 OUT3 reset (pulse) |
| Coil (FC1/5/15) | 7 | VFD200.CB4.Ch4.Reset |  |  | CB4 OUT4 reset (pulse) |
| Coil (FC1/5/15) | 8 | VFD200.CB4.Ch5.Reset |  |  | CB4 OUT5 reset (pulse) |
| Coil (FC1/5/15) | 9 | VFD200.CB4.Ch6.Reset |  |  | CB4 OUT6 reset (pulse) |
| Coil (FC1/5/15) | 10 | VFD200.CB4.Ch7.Reset |  |  | CB4 OUT7 reset (pulse) |
| Coil (FC1/5/15) | 11 | VFD200.CB4.Ch8.Reset |  |  | CB4 OUT8 reset (pulse) |
| Coil (FC1/5/15) | 12 | VFD200.Cmd.AckAll |  |  | Acknowledge all alarms (pulse) |
| Coil (FC1/5/15) | 13 | VFD200.VM1.Y01 |  |  | VM1 output 1: Tank 1 bottom |
| Coil (FC1/5/15) | 14 | VFD200.VM1.Y02 |  |  | VM1 output 2: Tank 2 bottom |
| Coil (FC1/5/15) | 15 | VFD200.VM1.Y03 |  |  | VM1 output 3: Tank 3 bottom |
| Coil (FC1/5/15) | 16 | VFD200.VM1.Y04 |  |  | VM1 output 4: Tank 1 top |
| Coil (FC1/5/15) | 17 | VFD200.VM1.Y05 |  |  | VM1 output 5: Tank 2 top |
| Coil (FC1/5/15) | 18 | VFD200.VM1.Y06 |  |  | VM1 output 6: Tank 3 top |
| Coil (FC1/5/15) | 19 | VFD200.VM1.Y08 |  |  | VM1 output 8: CIP tank drain |
| Coil (FC1/5/15) | 20 | VFD200.VM1.Y09 |  |  | VM1 output 9: TW HEX feed |
| Coil (FC1/5/15) | 21 | VFD200.VM1.Y10 |  |  | VM1 output 10: TEA mod feed |
| Coil (FC1/5/15) | 22 | VFD200.VM1.Y25 |  |  | VM1 output 25: System drain |
| Coil (FC1/5/15) | 23 | VFD200.VM1.Y26 |  |  | VM1 output 26: EVO pump feed |
| Coil (FC1/5/15) | 24 | VFD200.VM1.Y27 |  |  | VM1 output 27: TEA feed tank 1 |
| Coil (FC1/5/15) | 25 | VFD200.VM1.Y28 |  |  | VM1 output 28: TW feed tank 2 |
| Coil (FC1/5/15) | 26 | VFD200.VM1.Y29 |  |  | VM1 output 29: TW line feed |
| Coil (FC1/5/15) | 27 | VFD200.VM1.Y30 |  |  | VM1 output 30: TW feed tank 3 |
| Coil (FC1/5/15) | 28 | VFD200.VM1.Y31 |  |  | VM1 output 31: TW line feed (2) |
| Coil (FC1/5/15) | 29 | VFD200.VM1.Y32 |  |  | VM1 output 32: TEA HEX feed |
| Coil (FC1/5/15) | 30 | VFD200.Field.EStop |  |  | Field: E-STOP pressed |
| Coil (FC1/5/15) | 31 | VFD200.Field.Q1 |  |  | Field: Q1 disconnect closed |
| Coil (FC1/5/15) | 32 | VFD200.Field.CB1Reset |  |  | Field: reset CB1 (pulse) |
| Coil (FC1/5/15) | 33 | VFD200.Field.CB2Reset |  |  | Field: reset CB2 (pulse) |
| Coil (FC1/5/15) | 34 | VFD200.Field.DoorOpen |  |  | Field: a panel door is open |
| Coil (FC1/5/15) | 35 | VFD200.Fault.ACFail |  |  | Fault: enclosure A/C failed |
| Coil (FC1/5/15) | 36 | VFD200.Fault.SupplyLost |  |  | Fault: 480 V feeder lost |
| Coil (FC1/5/15) | 37 | VFD200.Fault.Pump1Seized |  |  | Fault: pump 1 seized |
| Coil (FC1/5/15) | 38 | VFD200.Fault.ShortCB4Ch3 |  |  | Fault: short on CB4 OUT3 (CPL1 sensor supply) |

Alarm words (IR `VFD200.Alarm.Word0` and `Word1`), bit 0 first: 0&nbsp;SUPPLY_LOST, 1&nbsp;CB1_TRIP, 2&nbsp;CB2_TRIP, 3&nbsp;DRV1_FAULT, 4&nbsp;DRV2_FAULT, 5&nbsp;ESTOP, 6&nbsp;P1_DRY, 7&nbsp;P2_DRY, 8&nbsp;P1_DEADHEAD, 9&nbsp;P2_DEADHEAD, 10&nbsp;DRV1_LIMIT, 11&nbsp;DRV2_LIMIT, 12&nbsp;CB4_TRIP, 13&nbsp;PLC_DOWN, 14&nbsp;NET_DOWN, 15&nbsp;PWS1_LIMIT, 16&nbsp;CPL1_DOWN, 17&nbsp;CPL2_DOWN, 18&nbsp;CPL3_DOWN, 19&nbsp;T1_OVERLOAD, 20&nbsp;ENC_HOT, 21&nbsp;ENC_HIHI, 22&nbsp;AC_SHORT, 23&nbsp;AC_FAIL, 24&nbsp;DOOR_OPEN, 25&nbsp;TANK1_LO, 26&nbsp;TANK2_LO, 27&nbsp;TANK3_LO, 28&nbsp;TANK1_HI, 29&nbsp;TANK2_HI, 30&nbsp;TANK3_HI.
<!-- modbus-map:end -->
