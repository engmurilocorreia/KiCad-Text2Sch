# KiCad-Text2Sch

**English** · [Português (Brasil)](README.pt-BR.md)

![KiCad-Text2Sch](docs/assets/logo-preview.png)

**KiCad-Text2Sch** is an experimental open-source tool for turning declarative JSON circuit descriptions into editable KiCad schematic files (`.kicad_sch`). The browser engine runs locally without a generation API; the repository also includes a Python/SKiDL workflow for local use.

**Developed by Murilo G. Correia.** This is an independent project and is not affiliated with or endorsed by the KiCad project. KiCad is a trademark of its respective owner.

## Current features

- Browser-based JSON editor, structural validation, and schematic download.
- Connectivity-aware A4 layout with four spacing profiles and experimental hierarchical multi-sheet ZIP export when a design does not fit on one sheet. Estimated envelopes reduce overflow/overlap but are heuristic; inspect in KiCad.
- UI language selection (Brazilian Portuguese, English, European Portuguese, Spanish) and light/dark themes.
- Experimental browser catalog including R/C/L, diode, MOSFET, BJT, LM741, BT169B SCR, DIAC, and a generic graphical SIDAC symbol.
- Local/global typed labels; predefined GND/VS and embedded power-symbol definitions for other rail names such as `V+` and `V-`.
- Python/SKiDL converter for local use and optional KiCad CLI checks.
- Copyable AI-authoring prompt in the browser UI, aligned with the selected interface language, plus the full guide at [`docs/AI_AUTHORING_PROMPT.md`](docs/AI_AUTHORING_PROMPT.md).
- Power-rail and language notes: [`docs/V18_POWER_RAILS_I18N_PTBR.md`](docs/V18_POWER_RAILS_I18N_PTBR.md).
- Experimental local import of single- and multi-unit external symbols (up to 16 units), with detailed skip diagnostics: [`docs/V21_MULTIUNIT_LAYOUT_PTBR.md`](docs/V21_MULTIUNIT_LAYOUT_PTBR.md).

## Quick start — browser app

From the repository root, run:

```powershell
python -m http.server 5173 --directory web
```

Open `http://127.0.0.1:5173`. Select an example, edit the JSON, validate it, and click **Generate KiCad schematic**. Use the header selector to switch among Brazilian Portuguese, English, European Portuguese, and Spanish; the theme button toggles light/dark mode. The “Work with AI” panel copies a prompt in the selected language. The browser processes the circuit locally; it does not send the design to a generation backend.

## Generate JSON with an AI assistant

1. Open [`docs/AI_AUTHORING_PROMPT.md`](docs/AI_AUTHORING_PROMPT.md) and copy the English or Brazilian Portuguese prompt.
2. Describe the requested topology and requirements: supply rails, functional stages, required components/symbols, known values, and pin connections.
3. Instruct the model not to invent values, models, footprints, or pin numbers. Mark placeholders explicitly.
4. Paste the JSON into the web editor and run validation.
5. Generate the `.kicad_sch`, open it in KiCad, and inspect symbols, pin mapping, labels, connectivity, netlist, and ERC.

### Power-rail JSON example

```json
"nets": [
  { "name": "GND", "type": "power" },
  { "name": "V+", "type": "power" },
  { "name": "V-", "type": "power" },
  { "name": "VIN", "type": "input" },
  { "name": "VOUT", "type": "output" }
]
```

In the browser engine, `GND` and `VS` use predefined symbols. Other power names such as `V+`, `V-`, `VCC`, or `VEE` generate a symbol definition embedded in the `.kicad_sch`, preserving the exact net name. This capability belongs to the browser engine; the Python/SKiDL converter may require a matching power library and must be tested separately. The symbol's graphic does not validate rail polarity or prove the circuit is electrically correct.

## PID example with LM741

[`inputs/pid_controller_lm741.json`](inputs/pid_controller_lm741.json) is a regression fixture with four LM741 amplifiers and `V+`/`V-` rails. Resistor and capacitor values are placeholders, as stated in its description. It is a generator test fixture, not a dimensioned or validated PID controller for physical implementation.

## Import an external KiCad symbol (experimental)

The browser can read a user-provided native `.kicad_sym` symbol-library file. This enables testing symbols that are not yet in the built-in catalog, including a specific SCR such as S8025R, provided the file contains a definition compatible with the current importer.

1. Obtain the library from a legitimate manufacturer or supplier channel and review the file's license/terms. If the download is a ZIP, extract it and select the `.kicad_sym` file.
2. In **Import external KiCad symbols**, select the file, choose a namespace prefix (usually `External`), and click **Import library**.
3. Read the import summary. It lists exact imported symbol names and pin mappings (`number = name`). Use the numbered pins shown there; do not infer numbering from functional terminal names alone.
4. In JSON, set the prefix in `parts[].lib` and the exact symbol name in `parts[].name`, for example:

   ```json
   { "lib": "External", "name": "S8025R", "ref": "Q1", "value": "S8025R" }
   ```

   This fragment works only if the imported file really contains a symbol named `S8025R`. Connections such as `Q1.1`, `Q1.2`, etc. must follow the import summary and the component datasheet.
5. Generate the schematic and inspect orientation, pin mapping, netlist, and ERC in KiCad.

Import is performed inside the browser; the file is not uploaded to a server. The importer supports single- and multi-unit symbols (up to 16 units) and resolves `extends` when the base definition is also present in the same file. Alternate/De Morgan graphic styles remain unsupported. It does not import `.pretty` footprint libraries, 3D models, or SPICE models. Imported symbols stay in page memory; after reloading the site, import the file again.

**This project does not automatically redistribute or bundle files downloaded from suppliers.** The user must check the source file's license and terms before importing it, sharing generated schematics, or redistributing derived symbol definitions. See [`docs/V19_CUSTOM_SYMBOL_IMPORT_PTBR.md`](docs/V19_CUSTOM_SYMBOL_IMPORT_PTBR.md) for details and limitations.

## Python converter

Install Python and the project requirements:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt
```

Validate JSON without running generation:

```powershell
python main.py inputs/circuit1.json --validate-only
```

Generate a schematic:

```powershell
python main.py inputs/circuit1.json --out outputs
```

Symbol coverage, `no_connect` support, and custom power rails may differ between the browser and Python/SKiDL engines. Check generator diagnostics; do not assume parity until the target use case passes both test suites.

## Tests

```powershell
pytest -q
npm run test:browser
```

Unit tests do not replace a real check in KiCad 10.0.7. Exporting the netlist, running native ERC, and visually inspecting the schematic are necessary before using it beyond demonstration.

## Scope and limitations

- The browser catalog is intentionally limited and versioned. A symbol available in an installed KiCad library is not automatically supported by the browser generator.
- Routing and layout are heuristic; larger designs may need manual rearrangement.
- A schematic symbol does not automatically validate values, ratings, footprint pin mapping, SPICE models, or safety requirements.
- `KiCadText2Sch:SIDAC_Generic` is a generic graphical symbol; it is not a manufacturer-specific model and contains no SPICE model.
- ERC checks rules expressed by KiCad libraries and settings; passing ERC does not prove operation, component sizing, safety, or regulatory compliance.

## License and attribution

Original source code and documentation use Apache-2.0; see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE). Adapted KiCad symbol definitions are covered by the specific notices in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), including CC BY-SA 4.0 where applicable. Do not confuse the original project-code license with licenses for third-party materials.
