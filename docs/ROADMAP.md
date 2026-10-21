# Product roadmap

The project should progress from a reliable JSON-to-schematic compiler toward an AI-assisted electronic-design workflow. Prioritize correctness and debuggability before adding interface features.

## Phase 1 — Stable input and feedback

- [x] Write an initial RFC for a versioned, backend-independent intermediate language (`docs/INTERMEDIATE_LANGUAGE_RFC.md`).
- [x] Add a v2 draft schema and sample; clearly mark both as not yet supported by the generator.

- [x] Define a public JSON Schema.
- [x] Validate duplicate references, malformed pin references, missing part handles, and pins assigned to conflicting nets.
- [x] Provide `--validate-only` without requiring SKiDL.
- [x] Add a test suite discoverable by pytest and a basic GitHub Actions workflow.
- [x] Add versioned schematic fixtures for generated `.kicad_sch` regression tests.
- [ ] Add native KiCad-generated golden netlists and ERC baselines in a pinned KiCad CI environment.
- [ ] Return machine-readable diagnostics (`code`, `path`, `message`) for easy LLM repair loops.

## Phase 2 — Symbol and pin intelligence

- [x] Build a versioned symbol catalog with library nickname/name, unit and pin metadata, electrical type, graphical bounds, upstream version references and licensing metadata.
- [ ] Add footprint filters and alias resolution, with provenance and tests.
- [ ] Add a `--list-symbols` / `--describe-symbol` command or a separate catalog-export utility.
- [x] Detect unknown symbols and pin numbers before schematic serialization.
- [ ] Add machine-readable diagnostic codes and pin electrical-type checks.
- [ ] Do not silently substitute a symbol when a requested one cannot be resolved.

## Phase 3 — Electrical checks and regression testing

- [ ] Generate the schematic, export a netlist, and run KiCad CLI ERC in CI on a known environment.
- [ ] Compare normalized netlists against golden fixtures to prove connectivity did not change after layout/post-processing changes.
- [ ] Track the ERC baseline and fail CI on new errors; warnings need explicit, reviewed policy.
- [ ] Add explicit support for no-connect pins, power flags, multi-unit components, and hierarchical sheets only with matching tests.
- [ ] Keep ERC, simulation, design calculations, and safety assessment as distinct checks.

## Phase 4 — Better schematic quality

- [ ] Implement the v2 semantic layout hints: functional block, relative grouping, preferred orientation, and signal-flow direction.
- [ ] Replace anchor-plus-fixed-offset field placement with a symbol-aware placement strategy that accounts for orientation, glyph bounds, nearby wires, and collisions.
- [ ] Support labels and hierarchy intentionally, not only as a fallback when auto-routing struggles.
- [ ] Add visual regression artefacts (SVG or PDF rendered by KiCad CLI) for example designs.
- [ ] Make post-processing parse-aware or test it against generated files from each supported KiCad/SKiDL version.

## Phase 5 — Hybrid browser/local workflow

- [x] Static frontend with structural validation, examples, formatting, JSON download, and clear messages about electrical verification.
- [x] Browser-native `.kicad_sch` writer for `Device:R`, `Device:C`, and `Device:L`, with no runtime backend requirement.
- [x] Browser catalog entry and test fixture for `Device:D_Small` with K/A pin mapping and orientation-aware two-terminal placement.
- [x] Improve vertical pin-label stubs with orthogonal elbows, so global/local label bodies sit beside the vertical wire rather than growing away from it.
- [x] Experimental multi-pin entries for `Transistor_FET:Q_NMOS_GSD` and `Transistor_BJT:Q_NPN_BCE`, with a grid layout, shaped global labels and native GND/VS symbols; awaiting KiCad 10.0.7 validation.
- [x] Keep Python/SKiDL + optional FastAPI as a separate path for local conversion and KiCad CLI integration.
- [ ] Validate browser-generated fixtures by opening them in KiCad 10.0.7 and running native netlist/ERC.
- [ ] Add golden `.kicad_sch` and normalized netlist fixtures for browser output to CI, using a pinned KiCad runtime.
- [x] Build a versioned symbol catalog with pins, units, electrical types, graphical bounds, upstream version references, and licensing metadata.
- [ ] Open the current MOSFET/BJT outputs in KiCad 10.0.7, compare the embedded definitions with the installed libraries, and verify netlist/ERC before considering the entries stable.
- [x] Add a single-unit LM741, SCR/thyristor, DIAC, and a generic SIDAC graphic with provenance and dedicated JSON examples; continue requiring KiCad CLI validation before declaring symbols stable.
- [x] Replace ladder-only heuristics for generic circuits with topology-aware ordering and estimated A4 envelope packing; try compact spacing profiles before multi-sheet export.
- [ ] Replace estimated envelopes with renderer-grade geometry and collision detection for actual text, wires, labels, and symbol shapes.
- [x] Keep GitHub Pages fully browser-native: the site does not call a generation API.
- [x] Keep local Python/SKiDL as a separate, documented route for broader library access and KiCad CLI verification. The browser-only route cannot invoke the local KiCad CLI.

## Release hygiene

- [x] Add Apache-2.0 for original project code/docs, `NOTICE` and `CITATION.cff`; keep the embedded KiCad symbol catalog under CC BY-SA 4.0 with its upstream notice.
- Declare supported Python, SKiDL, KiCad, and symbol-library versions.
- Keep examples small, reproducible, and covered by automated tests.


## Browser-native roadmap — updated 2026-10-20 / v13

1. Validate v10 typed global labels and native GND/VS symbols in KiCad 10.0.7; inspect netlist and ERC for RC/RLC/MOSFET/BJT fixtures.
2. Add a fixture-driven browser generation check in CI against a pinned KiCad CLI container, if the container can be kept reproducible.
3. Improve multi-pin placement and collision detection, including text labels versus symbols/wires; compare before/after screenshots for stable fixtures.
4. Add active-device catalog entries one family at a time: N/P MOSFET variants and NPN/PNP BJTs now have initial browser entries; next add a common single-unit op-amp, then SCR/thyristor, and only later SIDAC/DIAC. Include unit/pin metadata, upstream provenance/license, per-symbol test fixture, and KiCad CLI test.
5. Add support for no-connect pins, pin electrical-type audit, explicit schematic interface/port types, more native power symbols, and eventually multi-unit symbols and hierarchy.
6. Avoid adding broad device-family aliases until each symbol has the correct pin numbering and definition for the selected KiCad library version.


## v21 priorities / current next steps

- [x] Repair the LM741 embedded S-expression hierarchy and retain the four-amplifier PID as a saved regression fixture.
- [x] Add an experimental local import path for user-supplied `.kicad_sym` files; show the exact imported library ID and numbered pin map.
- [x] Keep uploaded symbol files local to the browser; do not add vendor-site scraping or automatic redistribution of third-party CAD content.
- [ ] Validate the saved PID fixture in KiCad 10.0.7, export its native netlist, and inspect ERC.
- [ ] Test imported single-unit SCR symbols from user-provided libraries, using S8025R only when the exact symbol definition is available and pin numbers are checked against the datasheet.
- [ ] Expand importer support only with targeted tests: inspect feasibility for symbol aliases, `extends`, inherited properties, and KiCad 10 `.kicad_symdir` files before enabling them.
- [ ] Add footprint-library `.pretty` and 3D-model import as a separate workflow, not as an implied capability of schematic-symbol import.
- [ ] Improve parse-aware validation and diagnostic codes for malformed embedded library definitions, not just balanced parentheses.
- [ ] Continue symbol-aware field placement and collision detection after resolving compatibility and connectivity of imported symbols.

## v18 priorities / current next steps

- [x] Browser-native power symbols for arbitrary explicitly typed power rails (for example `V+` and `V-`).
- [x] Four-LM741 PID fixture to regress custom rails and `no_connect`.
- [x] Browser UI language selection (pt-BR/en/pt-PT/es) and persistent light/dark mode.
- [x] Local GitHub repository icon and no remote font dependency.
- [ ] Validate the PID schematic in KiCad 10.0.7, export its netlist, and review ERC.
- [ ] Bring custom power symbols and explicit no-connect handling to feature parity in the Python/SKiDL path, or document tested differences.
- [ ] Improve layout by modelling rotated symbol bounds, text bounding boxes, labels, wires, and collision resolution across multi-stage circuits.
- [ ] Add a diode/MOSFET/BJT/LM741/SCR/DIAC/SIDAC regression gallery and check each fixture using the native KiCad CLI.
- [ ] Add topology-aware block/group metadata before attempting full automatic placement of large schematics.

- [x] Copyable multilingual AI-authoring prompt panel and regression checks.
- [ ] Add file-picker/drag-and-drop import and JSON recovery before planning an in-browser schematic preview.
- [ ] Introduce symbol-catalog search and human-readable per-pin validation diagnostics.
- [ ] Add visual-regression fixtures for label, field, wire, and symbol collisions.


## v21 focus — multi-unit import and layout correctness

- [x] Refresh browser cache-busting tokens and show importer/generator versions in errors and diagnostics.
- [x] Regression-test compatible LM358P-like multi-unit symbols (units 1/2 plus shared power unit 3), alternate style bodies, same-file inheritance, and a BC337-like single-unit symbol in one library.
- [x] Compact component placement based on estimated symbol/field/pin envelopes, then export a hierarchical multi-sheet ZIP when one A4 sheet cannot fit the design.
- [x] Add a selectable synthetic multi-sheet stress test to the web UI.
- [ ] Confirm Boost, multi-unit symbols and multi-sheet hierarchy by opening them in KiCad 10.0.7, exporting netlists and running ERC.
- [ ] Use the actual symbol library file from the user if LM358P/BC337 still fail with importer version 0.22.0-alpha, to diagnose vendor-specific `extends`, aliases, pin duplication or style conventions.
- [ ] Replace geometry estimates with stricter collision checks for field-to-wire and label-to-symbol interactions.
