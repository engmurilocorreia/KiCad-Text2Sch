# Changelog

## v0.1.0-alpha.23 — 2026-10-21

- Refresh all browser asset cache keys and expose importer/generator versions in diagnostics to prevent stale deployed JavaScript from masking multi-unit symbol support.
- Support compatible multi-unit `.kicad_sym` definitions (up to 16 graphic units) and same-file `extends`; primary-style pin geometry is used while De Morgan selection remains unsupported.
- Improve skipped-symbol diagnostics so files containing unsupported symbols identify the importer version and provide actionable next steps.
- Replace fixed spacing with topology-aware A4 packing that tries comfortable, compact, dense, and very-compact spacing before splitting the design into a root sheet plus child circuit sheets in a ZIP.
- Add explicit safe-area bounds, estimated field/pin/label envelopes, connectivity-weighted component ordering, and regression fixtures for the Boost converter and large multi-sheet projects.
- Clarify that layout envelopes are estimates and do not guarantee absence of every wire/text collision; native KiCad visual inspection, netlist export, and ERC remain required.
- Add multi-unit importer fixture coverage for a dual op-amp with a shared power unit, inherited symbol, alternate graphic style, and a single-unit transistor in the same library.
- Update the English and Brazilian Portuguese READMEs, importer/layout guide, AI prompt, changelog, citation metadata, and all cache-busting asset URLs.

## v0.1.0-alpha.21 — 2026-10-21

- Introduce topology-aware A4 packing and progressively tighter spacing profiles before choosing multi-sheet output.
- Add hierarchical root/child sheet ZIP export for large designs, plus a synthetic stress test and Boost converter layout fixture.
- Extend the local symbol importer to multi-unit symbols (up to 16 units) and same-file `extends`, using the primary graphical style for pin geometry.
- Add bounds/layout diagnostics and regression tests for sheet boundaries, spacing and topology-driven placement.

## v0.1.0-alpha.20 — external symbols and LM741 S-expression fix

- Fix the embedded LM741 symbol definition: `LM741_0_1` and `LM741_1_1` are valid sibling sub-symbols instead of accidentally nested definitions. Add a saved PID fixture and a grammar-aware regression test; balanced parentheses alone did not catch this invalid hierarchy.
- Add an experimental local `.kicad_sym` importer to the browser. Users can select a symbol-library file from KiCad, SnapMagic/SnapEDA, Ultra Librarian, or a component vendor, where the downloaded file and its terms permit this use.
- Display imported symbol names and numeric pin maps to help construct `parts[].lib`, `parts[].name`, and `connections` correctly.
- Keep imported symbols in browser memory only: no upload, remote fetch, or server dependency. Users re-import after refresh.
- Explicitly reject unsupported multi-unit, inherited (`extends`), alternate-graphic-style, oversized, and malformed symbol definitions with readable diagnostics.
- Document the limitations: this imports compatible schematic-symbol definitions only; it does not install footprints, 3D models, SPICE models, symbol tables, or vendor libraries into KiCad.
- Update the AI authoring prompt to require a successful local import before using an external `lib/name`, and to follow the displayed pin numbers rather than inferring them from terminal names.
- Update bilingual README guidance, third-party-license cautions, citation metadata, and roadmap.

## v18.0.0-alpha — power rails, i18n, and UX

- Add a copyable, localized AI-authoring prompt panel for pt-BR, English, pt-PT, and Spanish.
- Describe `V+`, `V-`, `VCC`, and `VEE` explicitly in the AI prompt and add the four-LM741 PID example to browser regression tests.

- Add browser-native embedded power symbols for custom rails such as `V+`, `V-`, `VCC`, and `VEE`, preserving exact net names.
- Add the four-LM741 PID JSON as a regression fixture, including explicit `no_connect` pins 1/5 and intrinsic NC pin 8.
- Add complete LM741, SCR, DIAC, and generic SIDAC fixture JSON files to `inputs/` and the web examples catalog.
- Add UI translations for pt-BR, English, pt-PT, and Spanish; persist language selection.
- Add persistent light/dark theme toggle and a local GitHub icon in the repository link.
- Keep the page credit as “Desenvolvido por Murilo G. Correia” in pt-BR.
- Remove external Google Fonts import so the browser app does not request a remote font at runtime.
- Update AI authoring guidance and bilingual README documents; clarify browser/Python engine feature differences.
- Improve the multipin layout grid for larger circuits.


## v0.1.0-alpha.13 — 2026-10-20

- Fix stale browser catalog behavior by versioning frontend assets as `v=13.0.0` and showing engine/catalog versions in generation diagnostics.
- Add official-library-derived `Transistor_FET:Q_PMOS_GSD` and `Transistor_BJT:Q_PNP_BCE` catalog entries with pin metadata and dedicated high-side fixtures.
- Add optional `rotation` hints for multipin symbols (0/90/180/270) to the browser engine and translate the same hints to SKiDL `symtx` in the Python generator.
- Correct rotated-pin stub routing and move symbol reference/value fields to the opposite side for 180-degree multipin symbols.
- Add a project logo, wordmark, favicon, GitHub Pages asset references, and an independent-project trademark disclaimer.
- Expand JavaScript/Python tests and CI example validation for diode, P-MOSFET and PNP fixtures.

## v0.1.0-alpha.12 — 2026-10-20

- Fix vertical pin-label presentation by routing a short orthogonal elbow before the label anchor; upper-pin labels sit to the left and lower-pin labels to the right while keeping text horizontal.
- Add the official-derived `Device:D_Small` browser symbol with K/A pin metadata, native horizontal pin-axis metadata, and orientation-aware placement in two-terminal layouts.
- Add the `diode_rectifier_test.json` fixture in the browser and Python examples, plus catalog, serialization, and structural-regression tests.
- Add upstream source attribution for `Device:D_Small`; bump browser asset cache-busting and package citation version.

## Unreleased — v0.1.0-alpha.11

- Align global-label serialization with native KiCad examples (`fields_autoplaced`, hidden `Intersheetrefs`, and left/right text justification).
- Increase GND value-field clearance from the symbol origin to reduce graphical overlap.
- Add cache-busting query parameters for browser assets.
- Update full author name and ORCID in project/citation metadata.
- Add a research-software publication roadmap and validation checklist.

## Previous experimental milestones

See the versioned history in `docs/V6_CHANGES_PTBR.md`, `docs/V7_WEB_MVP_PTBR.md`, `docs/V8_BROWSER_NATIVE_PTBR.md`, `docs/V9_BROWSER_ACTIVE_PTBR.md`, and `docs/V10_NET_PRESENTATION_AND_LICENSE_PTBR.md`.
