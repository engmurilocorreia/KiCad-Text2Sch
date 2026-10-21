# KiCad-Text2Sch web interface

The GitHub Pages frontend now runs the browser-native JavaScript generator exclusively. It does not call the FastAPI endpoint or upload the circuit JSON to a generation server. The Python/SKiDL converter remains available in this repository for local use.

- **Browser-native:** static frontend, local structural validation and `.kicad_sch` generation for an explicitly limited catalog. Current browser symbols: `Device:R`, `Device:C`, `Device:L`, `Transistor_FET:Q_NMOS_GSD` and `Transistor_BJT:Q_NPN_BCE`.
- **Python/SKiDL:** run locally using the instructions in `README.md`; supports a broader dependency on locally installed symbol libraries and can integrate with KiCad CLI for netlist/ERC checks.

The frontend does not run KiCad CLI, ERC, simulation or electrical analysis. Open generated schematics in KiCad and verify their netlist and ERC before use. See `README_BROWSER_ALPHA_PTBR.md` for exact browser limitations.
