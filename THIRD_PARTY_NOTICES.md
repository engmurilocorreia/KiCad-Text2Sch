# Third-party notices

## KiCad schematic symbol definitions

The browser-native engine embeds adapted schematic-symbol definitions from the official KiCad Symbols library, release tag `10.0.5`:

- `Device:R`, `Device:C`, `Device:L`: <https://gitlab.com/kicad/libraries/kicad-symbols/-/tree/10.0.5/Device.kicad_symdir>
- `Device:D_Small`: <https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Device.kicad_symdir/D_Small.kicad_sym>
- `Transistor_FET:Q_NMOS_GSD`: <https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Transistor_FET.kicad_symdir/Q_NMOS_GSD.kicad_sym>
- `Transistor_FET:Q_PMOS_GSD`: <https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Transistor_FET.kicad_symdir/Q_PMOS_GSD.kicad_sym>
- `Transistor_BJT:Q_NPN_BCE`: <https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Transistor_BJT.kicad_symdir/Q_NPN_BCE.kicad_sym>
- `Transistor_BJT:Q_PNP_BCE`: <https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Transistor_BJT.kicad_symdir/Q_PNP_BCE.kicad_sym>
- `power:GND`, `power:VS`: <https://gitlab.com/kicad/libraries/kicad-symbols/-/tree/10.0.5/power.kicad_symdir>

- Project: KiCad / KiCad Symbols
- Contributors: KiCad Libraries contributors
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- License text: <https://creativecommons.org/licenses/by-sa/4.0/>

The embedded definitions are adapted from these upstream symbol files and are included to permit self-contained `.kicad_sch` generation without fetching symbol libraries at runtime. The complete `web/symbol-catalog.js` file (symbol definitions and associated catalog metadata) is distributed under the upstream CC BY-SA 4.0 license. This project does not bundle PCB footprints. Upstream symbol metadata and pin geometry are versioned in `web/symbol-catalog.js`; the browser generator still requires validation in KiCad 10.0.7, including netlist and ERC, before any symbol is considered stable.

The official KiCad symbol-library license includes an exception stating that electronic designs and generated files using the library material do not, by that fact alone, have to be distributed under CC BY-SA 4.0. That exception is described in the upstream license text linked above. The exception does not remove the CC BY-SA obligations for redistributing the adapted symbol definitions as a catalog/collection.


## Project license scope

Original generator, frontend, and Python source code plus project documentation are offered under Apache-2.0. The complete `web/symbol-catalog.js` file is excluded from that grant and distributed under CC BY-SA 4.0 because it contains adapted KiCad symbol data. See `LICENSE`, `NOTICE`, and `CITATION.cff`. The Apache license does not relicense third-party symbol definitions.


### GitHub mark in the web interface

`web/assets/github-mark.svg` is included only as a link indicator for the public source repository. It is based on the GitHub mark provided by GitHub's Primer Octicons artwork (MIT license). The GitHub name and mark are trademarks of GitHub, Inc.; their use here identifies a link to the project's repository and does not imply affiliation or endorsement.

### Browser-generated power-rail symbols

For power-net names without a predefined symbol in the browser catalog, the generator creates a small embedded graphical power-symbol definition programmatically. The symbol is stored inside the generated `.kicad_sch` and uses the exact net name supplied by the JSON. It is project-generated artwork rather than a copied named symbol from the KiCad library. Users must still verify polarity and the resulting global-net semantics in KiCad.

### User-imported symbol libraries (experimental browser feature)

The application can parse a compatible `.kicad_sym` file explicitly selected by the user. Those imported symbol definitions are not bundled with the repository, automatically downloaded, or transmitted to a server. The user remains responsible for reviewing the license and terms that apply to the source file before use, modification, or redistribution. This local import feature does not make third-party material part of the project's own catalog or license it under Apache-2.0. See `docs/V19_CUSTOM_SYMBOL_IMPORT_PTBR.md` for scope, limitations, and workflow.
