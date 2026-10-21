# KiCad-Text2Sch

**Choose your language / Escolha o idioma**

- [Português (Brasil)](README.pt-BR.md)
- [English](README.en.md)

![KiCad-Text2Sch](docs/assets/logo-preview.png)

KiCad-Text2Sch is an experimental open-source tool for turning declarative JSON circuit descriptions into editable KiCad schematic files (`.kicad_sch`). The browser engine runs locally without a generation API; a separate Python/SKiDL workflow is also included. The web interface supports pt-BR, English, pt-PT, Spanish, light/dark themes, and a copyable AI-authoring prompt.

**Developed by Murilo G. Correia.** This is an independent project and is not affiliated with or endorsed by the KiCad project. KiCad is a trademark of its respective owner.

## Quick links

- [Web app source and browser engine](web/)
- [AI JSON-authoring prompt (Portuguese and English)](docs/AI_AUTHORING_PROMPT.md)
- [JSON Schema](schema/design.schema.json)
- [Roadmap](docs/ROADMAP.md)
- [Multi-unit symbol import and A4 multi-sheet layout (v21)](docs/V21_MULTIUNIT_LAYOUT_PTBR.md)
- [v20 external symbol import and LM741 S-expression fix](docs/V20_EXTERNAL_SYMBOL_IMPORT_PTBR.md)
- [Historical v18 power rails and UI notes](docs/V18_POWER_RAILS_I18N_PTBR.md)
- [License and third-party notices](LICENSE) · [NOTICE](NOTICE) · [Symbol notices](THIRD_PARTY_NOTICES.md)

> A valid JSON file or generated schematic is not proof that the circuit is electrically correct, safe, or suitable for manufacturing. Always inspect the result in KiCad, export/check the netlist, and review ERC and component ratings.
