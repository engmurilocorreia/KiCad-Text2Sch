# KiCad-Text2Sch Intermediate Design Language — RFC draft

**Status:** proposal for discussion; not yet consumed by `src/generator.py`.

## 1. Why an intermediate language?

JSON is not the product by itself. It is the stable, documented contract between a human/LLM and the schematic compiler. It should describe electrical intent first, then optional presentation intent. It should not force an LLM to invent KiCad UUIDs, raw S-expression syntax, wire coordinates, or field coordinates.

A valid document passes through separate stages:

1. Parse and validate the document's structure.
2. Resolve each library symbol and its actual pins against a pinned KiCad symbol catalog.
3. Build a normalized electrical graph (components, pins, nets, no-connects).
4. Check graph consistency and report machine-readable diagnostics.
5. Produce a layout plan from semantic hints, not from arbitrary text offsets.
6. Compile to `.kicad_sch` and a normalized netlist.
7. Check output with KiCad CLI/ERC and compare connectivity to the normalized graph.

Passing one stage must not be presented as proof that later stages passed. In particular, JSON validation is not ERC, and ERC is not proof of functional correctness or safety.

## 2. Design principles

- **Versioned:** every new document declares `schema_version`; breaking changes increment the major version.
- **Stable IDs:** every component has an `id` used by connections. KiCad references such as `R1` are presentation/designator fields and may eventually be annotated separately.
- **Electrical intent first:** define nets and pin membership. Physical wire routes are compiler output unless explicitly needed.
- **Library-grounded:** a symbol and its pins must resolve against a known catalog. Never silently replace an unknown symbol or pin.
- **Semantic layout hints:** group components into functional blocks, specify signal flow and preferred orientations. The generator owns final placement and collision avoidance.
- **Reproducible:** pin supported KiCad/SKiDL/library versions and retain example fixtures with expected normalized netlists.
- **LLM-repairable:** validation errors should eventually use stable machine-readable fields: `code`, `path`, `message`, and optional `hint`.
- **Backward-compatible migration:** the existing `parts` + `lib`/`name` + string pin notation remains accepted during the 1.x period. The v2 draft is a proposal, not a runtime feature.

## 3. Proposed document shape (v2 draft)

### Document metadata

`schema_version` is explicit. `meta` includes a title and output name.

### Components

A component has a stable `id`, a KiCad reference designator `ref`, an explicit library symbol `{ "library": "Device", "name": "R" }`, a value, and optional footprint/extra fields. Connections refer to the stable `id`, never to an array index.

### Nets

A net has a unique `name` and a semantic `kind`: `signal`, `power`, or `ground`. `display` may request a power symbol or a label, but this is presentation metadata and must not change connectivity. The compiler must validate any requested power symbol against the catalog.

### Connections and no-connects

Pins are objects (`{"part": "r_in", "pin": "1"}`), not dotted strings. The verbose form costs a few tokens but is easier to validate, transform, and diagnose. A physical pin cannot belong to two distinct nets. Deliberately unused pins should be declared under `no_connect`, not silently omitted.

### Layout intent

The document may request a preferred signal flow, grid, clearance, functional groups, and field-placement policy. It should not have to specify exact X/Y coordinates for every object. Exact coordinates, when supported later, will be an explicit advanced/locked mode rather than the default AI workflow.

The layout engine must not place reference/value text using only the symbol anchor and rotation. It needs symbol geometry, field extents, orientation transforms, wire clearance, and collision checks. The current `_field_targets()` offset logic is only a prototype and is not a sufficient professional-layout algorithm.

## 4. Example (proposal only)

```json
{
  "schema_version": "2.0-draft",
  "meta": {
    "title": "RC low-pass stage",
    "top_name": "rc_lowpass"
  },
  "nets": [
    {"name": "VIN", "kind": "power", "display": {"power_symbol": "VS"}},
    {"name": "VOUT", "kind": "signal", "display": {"label": "VOUT"}},
    {"name": "GND", "kind": "ground", "display": {"power_symbol": "GND"}}
  ],
  "parts": [
    {"id": "r_in", "ref": "R1", "symbol": {"library": "Device", "name": "R"}, "value": "10k", "footprint": "Resistor_SMD:R_0805_2012Metric", "layout": {"group": "filter", "orientation": 90}},
    {"id": "c_out", "ref": "C1", "symbol": {"library": "Device", "name": "C"}, "value": "100n", "footprint": "Capacitor_SMD:C_0805_2012Metric", "layout": {"group": "filter", "orientation": 0}}
  ],
  "connections": [
    {"net": "VIN", "pins": [{"part": "r_in", "pin": "1"}]},
    {"net": "VOUT", "pins": [{"part": "r_in", "pin": "2"}, {"part": "c_out", "pin": "1"}]},
    {"net": "GND", "pins": [{"part": "c_out", "pin": "2"}]}
  ],
  "no_connect": [],
  "layout": {
    "mode": "auto",
    "signal_flow": "left_to_right",
    "grid_mm": 2.54,
    "minimum_clearance_mm": 2.54,
    "field_policy": "outside_symbol",
    "groups": [
      {"id": "filter", "label": "RC filter", "members": ["r_in", "c_out"]}
    ]
  }
}
```

`kind`, `display`, `id`, object-shaped pins and layout fields in this example are not implemented in the current generator. This sample communicates the intended future model; do not feed it into the current production CLI until the v2 parser and backend have been implemented.

## 5. Migration from the existing format

Current v1 input uses `parts[].lib`, `parts[].name`, and `connections[].pins` strings such as `R1.1`. A migration utility should:

1. assign each old component a stable `id` from `tag` if present, otherwise from `ref`;
2. map `lib` + `name` to `symbol.library` + `symbol.name`;
3. parse each dotted pin string into `{part, pin}`;
4. map `nets[].type == "power"` to an explicit `kind` and preserve any declared ERC policy;
5. produce a report for anything not representable without assumptions.

Do not infer functional correctness, pin electrical types, or power-symbol semantics from names alone. Those must be resolved against the symbol catalog or requested explicitly.

## 6. Acceptance criteria before declaring v2 supported

- Valid and invalid examples with automated tests for all fields and cross-references.
- Symbol-catalog resolution of every symbol and pin.
- Explicit handling of multi-unit symbols, no-connect pins, power symbols, labels and hidden power pins where applicable.
- Golden `.kicad_sch` files and normalized netlists for repeatable examples.
- KiCad CLI parsing/ERC in a pinned CI environment.
- A visual fixture for each schematic example, inspected for field, symbol, label and wire collisions.
- A migration command that produces equivalent netlist connectivity from v1 to v2.
- Documentation that separates structural validity, electrical-rule checks, simulation, and design/safety review.
