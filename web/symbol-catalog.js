/*
 * Versioned browser symbol catalog for KiCad-Text2Sch.
 * R/C/L and active transistor definitions adapted from KiCad Symbols library 10.0.5.
 * See THIRD_PARTY_NOTICES.md for provenance and license.
 */
(function attachSymbolCatalog(root, factory) {
  const catalog = factory();
  if (root) root.KiCadText2SchSymbolCatalog = catalog;
  if (typeof module !== "undefined" && module.exports) module.exports = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this, function makeSymbolCatalog() {
  "use strict";
  return {
    schemaVersion: "1.9.0",
    kicadLibraryVersion: "10.0.5",
    license: "CC-BY-SA-4.0",
    sources: {
      device: "https://gitlab.com/kicad/libraries/kicad-symbols/-/tree/10.0.5/Device.kicad_symdir",
      fet: "https://gitlab.com/kicad/libraries/kicad-symbols/-/tree/10.0.5/Transistor_FET.kicad_symdir",
      pmos: "https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Transistor_FET.kicad_symdir/Q_PMOS_GSD.kicad_sym",
      pnp: "https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Transistor_BJT.kicad_symdir/Q_PNP_BCE.kicad_sym",
      bjt: "https://gitlab.com/kicad/libraries/kicad-symbols/-/tree/10.0.5/Transistor_BJT.kicad_symdir",
      power: "https://gitlab.com/kicad/libraries/kicad-symbols/-/tree/10.0.5/power.kicad_symdir",
      diode: "https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Device.kicad_symdir/D_Small.kicad_sym",
      opamp: "https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Amplifier_Operational.kicad_symdir/LM741.kicad_sym",
      thyristor: "https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Triac_Thyristor.kicad_symdir/BT169B.kicad_sym",
      diac: "https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/10.0.5/Device.kicad_symdir/DIAC.kicad_sym",
      sidac: "project-authored generic symbol; see THIRD_PARTY_NOTICES.md"
    },
    symbols: {
    'Device:R': {
      browserSupported: true,
      referencePrefix: 'R',
      description: 'Resistor',
      units: [1],
      pins: [
        { number: "1", name: "", electricalType: "passive", unit: 1, at: [0, 3.81], orientation: 270, length: 1.27 },
        { number: "2", name: "", electricalType: "passive", unit: 1, at: [0, -3.81], orientation: 90, length: 1.27 }
      ],
      // Approximate bounds are informational; routing does not yet use these for collision detection.
      graphicalBounds: [-1.016, -2.54, 1.016, 2.54],
      definition: `(symbol "Device:R"
      (pin_numbers (hide yes))
      (pin_names (offset 0))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "R" (at 2.032 0 90) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
      (property "Value" "R" (at 0 0 90) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at -1.778 0 90) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "Resistor" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "R res resistor" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_fp_filters" "R_*" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "R_0_1"
        (rectangle (start -1.016 -2.54) (end 1.016 2.54) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "R_1_1"
        (pin passive line (at 0 3.81 270) (length 1.27) (name "" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -3.81 90) (length 1.27) (name "" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },
    'Device:C': {
      browserSupported: true,
      referencePrefix: 'C',
      description: 'Unpolarized capacitor',
      units: [1],
      pins: [
        { number: "1", name: "", electricalType: "passive", unit: 1, at: [0, 3.81], orientation: 270, length: 2.794 },
        { number: "2", name: "", electricalType: "passive", unit: 1, at: [0, -3.81], orientation: 90, length: 2.794 }
      ],
      // Approximate bounds are informational; routing does not yet use these for collision detection.
      graphicalBounds: [-2.032, -0.762, 2.032, 0.762],
      definition: `(symbol "Device:C"
      (pin_numbers (hide yes))
      (pin_names (offset 0.254))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "C" (at 0.635 2.54 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "C" (at 0.635 -2.54 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 0.9652 -3.81 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "Unpolarized capacitor" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "cap capacitor" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_fp_filters" "C_*" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "C_0_1"
        (polyline (pts (xy -2.032 0.762) (xy 2.032 0.762)) (stroke (width 0.508) (type default)) (fill (type none)))
        (polyline (pts (xy -2.032 -0.762) (xy 2.032 -0.762)) (stroke (width 0.508) (type default)) (fill (type none)))
      )
      (symbol "C_1_1"
        (pin passive line (at 0 3.81 270) (length 2.794) (name "" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -3.81 90) (length 2.794) (name "" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },
    'Device:L': {
      browserSupported: true,
      referencePrefix: 'L',
      description: 'Inductor',
      units: [1],
      pins: [
        { number: "1", name: "1", electricalType: "passive", unit: 1, at: [0, 3.81], orientation: 270, length: 1.27 },
        { number: "2", name: "2", electricalType: "passive", unit: 1, at: [0, -3.81], orientation: 90, length: 1.27 }
      ],
      // Approximate bounds are informational; routing does not yet use these for collision detection.
      graphicalBounds: [-0.7, -2.54, 0.7, 2.54],
      definition: `(symbol "Device:L"
      (pin_numbers (hide yes))
      (pin_names (offset 1.016) (hide yes))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "L" (at -1.27 0 90) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
      (property "Value" "L" (at 1.905 0 90) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "Inductor" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "inductor choke coil reactor magnetic" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_fp_filters" "Choke_* *Coil* Inductor_* L_*" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "L_0_1"
        (arc (start 0 2.54) (mid 0.6323 1.905) (end 0 1.27) (stroke (width 0) (type default)) (fill (type none)))
        (arc (start 0 1.27) (mid 0.6323 0.635) (end 0 0) (stroke (width 0) (type default)) (fill (type none)))
        (arc (start 0 0) (mid 0.6323 -0.635) (end 0 -1.27) (stroke (width 0) (type default)) (fill (type none)))
        (arc (start 0 -1.27) (mid 0.6323 -1.905) (end 0 -2.54) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "L_1_1"
        (pin passive line (at 0 3.81 270) (length 1.27) (name "1" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -3.81 90) (length 1.27) (name "2" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },
    'Transistor_FET:Q_NMOS_GSD': {
      browserSupported: true,
      referencePrefix: 'Q',
      description: 'N-MOSFET transistor, gate/source/drain (KiCad library symbol)',
      units: [1],
      pins: [
        { number: "1", name: "G", electricalType: "input", unit: 1, at: [-5.08, 0], orientation: 0, length: 2.54, stubDirection: "left" },
        { number: "2", name: "S", electricalType: "passive", unit: 1, at: [2.54, -5.08], orientation: 90, length: 2.54, stubDirection: "down" },
        { number: "3", name: "D", electricalType: "passive", unit: 1, at: [2.54, 5.08], orientation: 270, length: 2.54, stubDirection: "up" }
      ],
      graphicalBounds: [-2.54, -2.794, 4.445, 2.794],
      definition: `(symbol "Transistor_FET:Q_NMOS_GSD"
      (pin_names (offset 0) (hide yes))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "Q" (at 5.08 1.905 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "Q_NMOS_GSD" (at 5.08 0 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 5.08 2.54 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "N-MOSFET transistor, gate/source/drain" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "transistor NMOS N-MOS N-MOSFET" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "Q_NMOS_GSD_0_1"
        (polyline (pts (xy 0.254 1.905) (xy 0.254 -1.905)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 0.254 0) (xy -2.54 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 2.286) (xy 0.762 1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 0.508) (xy 0.762 -0.508)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 -1.27) (xy 0.762 -2.286)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 -1.778) (xy 3.302 -1.778) (xy 3.302 1.778) (xy 0.762 1.778)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 1.016 0) (xy 2.032 0.381) (xy 2.032 -0.381) (xy 1.016 0)) (stroke (width 0) (type default)) (fill (type outline)))
        (circle (center 1.651 0) (radius 2.794) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 2.54 2.54) (xy 2.54 1.778)) (stroke (width 0) (type default)) (fill (type none)))
        (circle (center 2.54 1.778) (radius 0.254) (stroke (width 0) (type default)) (fill (type outline)))
        (circle (center 2.54 -1.778) (radius 0.254) (stroke (width 0) (type default)) (fill (type outline)))
        (polyline (pts (xy 2.54 -2.54) (xy 2.54 0) (xy 0.762 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 2.921 0.381) (xy 3.683 0.381)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 3.302 0.381) (xy 2.921 -0.254) (xy 3.683 -0.254) (xy 3.302 0.381)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "Q_NMOS_GSD_1_1"
        (pin input line (at -5.08 0 0) (length 2.54) (name "G" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 -5.08 90) (length 2.54) (name "S" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 5.08 270) (length 2.54) (name "D" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },
    'Transistor_BJT:Q_NPN_BCE': {
      browserSupported: true,
      referencePrefix: 'Q',
      description: 'NPN transistor, base/collector/emitter (KiCad library symbol)',
      units: [1],
      pins: [
        { number: "1", name: "B", electricalType: "input", unit: 1, at: [-5.08, 0], orientation: 0, length: 2.54, stubDirection: "left" },
        { number: "2", name: "C", electricalType: "passive", unit: 1, at: [2.54, 5.08], orientation: 270, length: 2.54, stubDirection: "up" },
        { number: "3", name: "E", electricalType: "passive", unit: 1, at: [2.54, -5.08], orientation: 90, length: 2.54, stubDirection: "down" }
      ],
      graphicalBounds: [-2.54, -2.8194, 4.0894, 2.8194],
      definition: `(symbol "Transistor_BJT:Q_NPN_BCE"
      (pin_names (offset 0) (hide yes))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "Q" (at 5.08 1.27 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "Q_NPN_BCE" (at 5.08 -1.27 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 5.08 2.54 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "NPN transistor, base/collector/emitter" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Sim.Device" "NPN" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Sim.Pins" "1=B 2=C 3=E" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "BJT" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "Q_NPN_BCE_0_1"
        (polyline (pts (xy -2.54 0) (xy 0.635 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.635 1.905) (xy 0.635 -1.905)) (stroke (width 0.508) (type default)) (fill (type none)))
        (circle (center 1.27 0) (radius 2.8194) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "Q_NPN_BCE_1_1"
        (polyline (pts (xy 0.635 0.635) (xy 2.54 2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.635 -0.635) (xy 2.54 -2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 1.27 -1.778) (xy 1.778 -1.27) (xy 2.286 -2.286) (xy 1.27 -1.778)) (stroke (width 0) (type default)) (fill (type outline)))
        (pin input line (at -5.08 0 0) (length 2.54) (name "B" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 5.08 270) (length 2.54) (name "C" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 -5.08 90) (length 2.54) (name "E" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },
    'Device:D_Small': {
      browserSupported: true,
      referencePrefix: 'D',
      description: 'Diode, small symbol (KiCad library symbol)',
      preferredAxis: 'horizontal',
      units: [1],
      pins: [
        { number: "1", name: "K", electricalType: "passive", unit: 1, at: [-2.54, 0], orientation: 0, length: 1.778, stubDirection: "left" },
        { number: "2", name: "A", electricalType: "passive", unit: 1, at: [2.54, 0], orientation: 180, length: 1.778, stubDirection: "right" }
      ],
      graphicalBounds: [-0.762, -1.016, 0.762, 1.016],
      definition: `(symbol "Device:D_Small"
      (pin_numbers (hide yes))
      (pin_names (offset 0.254) (hide yes))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "D" (at -1.27 2.032 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "D_Small" (at -3.81 -2.032 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 0 0 90) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 90) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "Diode, small symbol" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Sim.Device" "D" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Sim.Pins" "1=K 2=A" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "diode" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_fp_filters" "TO-???* *_Diode_* *SingleDiode* D_*" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "D_Small_0_1"
        (polyline (pts (xy -0.762 0) (xy 0.762 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy -0.762 -1.016) (xy -0.762 1.016)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 -1.016) (xy -0.762 0) (xy 0.762 1.016) (xy 0.762 -1.016)) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "D_Small_1_1"
        (pin passive line (at -2.54 0 0) (length 1.778) (name "K" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 0 180) (length 1.778) (name "A" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },
    'Transistor_FET:Q_PMOS_GSD': {
      browserSupported: true,
      referencePrefix: 'Q',
      description: 'P-MOSFET transistor, gate/source/drain (KiCad library symbol)',
      units: [1],
      pins: [
        { number: "1", name: "G", electricalType: "input", unit: 1, at: [-5.08, 0], orientation: 0, length: 2.54, stubDirection: "left" },
        { number: "2", name: "S", electricalType: "passive", unit: 1, at: [2.54, -5.08], orientation: 90, length: 2.54, stubDirection: "down" },
        { number: "3", name: "D", electricalType: "passive", unit: 1, at: [2.54, 5.08], orientation: 270, length: 2.54, stubDirection: "up" }
      ],
      graphicalBounds: [-2.54, -2.794, 4.445, 2.794],
      definition: `(symbol "Transistor_FET:Q_PMOS_GSD"
      (pin_names (offset 0) (hide yes))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "Q" (at 5.08 1.905 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "Q_PMOS_GSD" (at 5.08 0 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 5.08 2.54 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "P-MOSFET transistor, gate/source/drain" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "transistor PMOS P-MOS P-MOSFET" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "Q_PMOS_GSD_0_1"
        (polyline (pts (xy 0.254 1.905) (xy 0.254 -1.905)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 0.254 0) (xy -2.54 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 2.286) (xy 0.762 1.27)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 1.778) (xy 3.302 1.778) (xy 3.302 -1.778) (xy 0.762 -1.778)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 0.508) (xy 0.762 -0.508)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 -1.27) (xy 0.762 -2.286)) (stroke (width 0.254) (type default)) (fill (type none)))
        (circle (center 1.651 0) (radius 2.794) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy 2.286 0) (xy 1.27 0.381) (xy 1.27 -0.381) (xy 2.286 0)) (stroke (width 0) (type default)) (fill (type outline)))
        (polyline (pts (xy 2.54 2.54) (xy 2.54 1.778)) (stroke (width 0) (type default)) (fill (type none)))
        (circle (center 2.54 1.778) (radius 0.254) (stroke (width 0) (type default)) (fill (type outline)))
        (circle (center 2.54 -1.778) (radius 0.254) (stroke (width 0) (type default)) (fill (type outline)))
        (polyline (pts (xy 2.54 -2.54) (xy 2.54 0) (xy 0.762 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 2.921 -0.381) (xy 3.683 -0.381)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 3.302 -0.381) (xy 2.921 0.254) (xy 3.683 0.254) (xy 3.302 -0.381)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "Q_PMOS_GSD_1_1"
        (pin input line (at -5.08 0 0) (length 2.54) (name "G" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 -5.08 90) (length 2.54) (name "S" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 5.08 270) (length 2.54) (name "D" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },
    'Transistor_BJT:Q_PNP_BCE': {
      browserSupported: true,
      referencePrefix: 'Q',
      description: 'PNP transistor, base/collector/emitter (KiCad library symbol)',
      units: [1],
      pins: [
        { number: "1", name: "B", electricalType: "input", unit: 1, at: [-5.08, 0], orientation: 0, length: 2.54, stubDirection: "left" },
        { number: "2", name: "C", electricalType: "passive", unit: 1, at: [2.54, 5.08], orientation: 270, length: 2.54, stubDirection: "up" },
        { number: "3", name: "E", electricalType: "passive", unit: 1, at: [2.54, -5.08], orientation: 90, length: 2.54, stubDirection: "down" }
      ],
      graphicalBounds: [-2.54, -2.8194, 4.0894, 2.8194],
      definition: `(symbol "Transistor_BJT:Q_PNP_BCE"
      (pin_names (offset 0) (hide yes))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "Q" (at 5.08 1.27 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "Q_PNP_BCE" (at 5.08 -1.27 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 5.08 2.54 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "PNP transistor, base/collector/emitter" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Sim.Device" "PNP" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Sim.Pins" "1=B 2=C 3=E" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "BJT" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "Q_PNP_BCE_0_1"
        (polyline (pts (xy -2.54 0) (xy 0.635 0)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.635 1.905) (xy 0.635 -1.905)) (stroke (width 0.508) (type default)) (fill (type none)))
        (circle (center 1.27 0) (radius 2.8194) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "Q_PNP_BCE_1_1"
        (polyline (pts (xy 0.635 0.635) (xy 2.54 2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.635 -0.635) (xy 2.54 -2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 2.286 -1.778) (xy 1.778 -2.286) (xy 1.27 -1.27) (xy 2.286 -1.778)) (stroke (width 0) (type default)) (fill (type outline)))
        (pin input line (at -5.08 0 0) (length 2.54) (name "B" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 5.08 270) (length 2.54) (name "C" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 2.54 -5.08 90) (length 2.54) (name "E" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },
    'Amplifier_Operational:LM741': {
      browserSupported: true,
      referencePrefix: 'U',
      description: 'Single operational amplifier; LM741, single unit',
      units: [1],
      pins: [
        { number: "1", name: "NULL", electricalType: "input", unit: 1, at: [0, -7.62], orientation: 90, length: 5.08, hideName: true, noConnectMarker: true },
        { number: "2", name: "-", electricalType: "input", unit: 1, at: [-7.62, -2.54], orientation: 0, length: 2.54 },
        { number: "3", name: "+", electricalType: "input", unit: 1, at: [-7.62, 2.54], orientation: 0, length: 2.54 },
        { number: "4", name: "V-", electricalType: "power_in", unit: 1, at: [-2.54, -7.62], orientation: 90, length: 3.81 },
        { number: "5", name: "NULL", electricalType: "input", unit: 1, at: [2.54, -7.62], orientation: 90, length: 6.35, hideName: true, noConnectMarker: true },
        { number: "6", name: "OUT", electricalType: "output", unit: 1, at: [7.62, 0], orientation: 180, length: 2.54 },
        { number: "7", name: "V+", electricalType: "power_in", unit: 1, at: [-2.54, 7.62], orientation: 270, length: 3.81 },
        { number: "8", name: "NC", electricalType: "no_connect", unit: 1, at: [0, 2.54], orientation: 270, length: 2.54, intrinsicNoConnect: true, emitNoConnectMarker: false, hideName: true }
      ],
      graphicalBounds: [-5.08, -5.08, 5.08, 5.08],
      definition: `(symbol "Amplifier_Operational:LM741"
      (pin_numbers (hide yes))
      (pin_names (offset 0.127))
      (exclude_from_sim no) (in_bom yes) (on_board yes) (in_pos_files yes)
      (property "Reference" "U" (at 0 6.35 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "LM741" (at 0 3.81 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "" (at 1.27 1.27 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Datasheet" "https://www.ti.com/lit/ds/symlink/lm741.pdf" (at 3.81 3.81 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Description" "Operational Amplifier, DIP-8/TO-99-8" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "ki_keywords" "single opamp" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (symbol "LM741_0_1"
        (polyline (pts (xy -5.08 5.08) (xy 5.08 0) (xy -5.08 -5.08) (xy -5.08 5.08)) (stroke (width 0.254) (type default)) (fill (type background)))
      )
      (symbol "LM741_1_1"
        (pin input line (at 0 -7.62 90) (length 5.08) (name "NULL" (effects (font (size 0.508 0.508)) (hide yes))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin input line (at -7.62 -2.54 0) (length 2.54) (name "-" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin input line (at -7.62 2.54 0) (length 2.54) (name "+" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at -2.54 -7.62 90) (length 3.81) (name "V-" (effects (font (size 1.27 1.27)))) (number "4" (effects (font (size 1.27 1.27)))))
        (pin input line (at 2.54 -7.62 90) (length 6.35) (name "NULL" (effects (font (size 0.508 0.508)) (hide yes))) (number "5" (effects (font (size 1.27 1.27)))))
        (pin output line (at 7.62 0 180) (length 2.54) (name "" (effects (font (size 1.27 1.27)))) (number "6" (effects (font (size 1.27 1.27)))))
        (pin power_in line (at -2.54 7.62 270) (length 3.81) (name "V+" (effects (font (size 1.27 1.27)))) (number "7" (effects (font (size 1.27 1.27)))))
        (pin no_connect line (at 0 2.54 270) (length 2.54) (hide yes) (name "" (effects (font (size 1.27 1.27)) (hide yes))) (number "8" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },    'Triac_Thyristor:BT169B': {
      browserSupported: true,
      referencePrefix: 'Q',
      description: 'SCR/thyristor BT169B (KiCad library symbol)',
      units: [1],
      pins: [
        { number: "1", name: "A", electricalType: "passive", unit: 1, at: [0, 3.81], orientation: 270, length: 2.54 },
        { number: "2", name: "G", electricalType: "input", unit: 1, at: [-3.81, -2.54], orientation: 0, length: 2.54 },
        { number: "3", name: "K", electricalType: "passive", unit: 1, at: [0, -3.81], orientation: 90, length: 2.54 }
      ],
      graphicalBounds: [-1.27, -2.54, 1.27, 1.27],
      definition: `(symbol "Triac_Thyristor:BT169B"
      (pin_numbers (hide yes)) (pin_names (offset 0) (hide yes))
      (exclude_from_sim no) (in_bom yes) (on_board yes) (in_pos_files yes)
      (property "Reference" "Q" (at 2.54 1.905 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Value" "BT169B" (at 2.54 0 0) (effects (font (size 1.27 1.27)) (justify left)))
      (property "Footprint" "Package_TO_SOT_THT:TO-92_Inline" (at 2.54 -1.905 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Datasheet" "https://media.digikey.com/pdf/Data%20Sheets/NXP%20PDFs/BT169_Series.pdf" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Description" "Silicon controlled rectifier, TO-92" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (symbol "BT169B_0_1"
        (polyline (pts (xy -1.27 1.27) (xy 1.27 1.27) (xy 0 -1.27) (xy -1.27 1.27)) (stroke (width 0.2032) (type default)) (fill (type none)))
        (polyline (pts (xy -1.27 -1.27) (xy 1.27 -1.27)) (stroke (width 0.2032) (type default)) (fill (type none)))
        (polyline (pts (xy -1.27 -2.54) (xy -0.635 -1.27)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0 -2.54) (xy 0 2.54)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "BT169B_1_1"
        (pin passive line (at 0 3.81 270) (length 2.54) (name "A" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin input line (at -3.81 -2.54 0) (length 2.54) (name "G" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 0 -3.81 90) (length 2.54) (name "K" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },    'Device:DIAC': {
      browserSupported: true,
      referencePrefix: 'D',
      description: 'Bidirectional trigger diode (DIAC), KiCad library symbol',
      preferredAxis: 'horizontal',
      units: [1],
      pins: [
        { number: "1", name: "K", electricalType: "passive", unit: 1, at: [-3.81, 0], orientation: 0, length: 2.54 },
        { number: "2", name: "A", electricalType: "passive", unit: 1, at: [3.81, 0], orientation: 180, length: 2.54 }
      ],
      graphicalBounds: [-1.27, -2.54, 1.27, 2.54],
      definition: `(symbol "Device:DIAC"
      (pin_numbers (hide yes)) (pin_names (offset 1.016) (hide yes))
      (exclude_from_sim no) (in_bom yes) (on_board yes) (in_pos_files yes)
      (property "Reference" "D" (at 0 3.81 0) (effects (font (size 1.27 1.27))))
      (property "Value" "DIAC" (at 0 -3.81 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Description" "Diode for alternating current" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (symbol "DIAC_0_1"
        (polyline (pts (xy -1.27 -2.54) (xy -1.27 2.54) (xy 1.27 1.27) (xy -1.27 0)) (stroke (width 0.254) (type default)) (fill (type outline)))
        (polyline (pts (xy 1.27 2.54) (xy 1.27 -2.54) (xy -1.27 -1.27) (xy 1.27 0)) (stroke (width 0.254) (type default)) (fill (type outline)))
      )
      (symbol "DIAC_1_1"
        (pin passive line (at -3.81 0 0) (length 2.54) (name "K" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 3.81 0 180) (length 2.54) (name "A" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },    'KiCadText2Sch:SIDAC_Generic': {
      browserSupported: true,
      referencePrefix: 'D',
      description: 'Project-authored generic SIDAC graphical symbol; not a manufacturer-specific model',
      preferredAxis: 'horizontal',
      units: [1],
      pins: [
        { number: "1", name: "T1", electricalType: "passive", unit: 1, at: [-3.81, 0], orientation: 0, length: 2.54 },
        { number: "2", name: "T2", electricalType: "passive", unit: 1, at: [3.81, 0], orientation: 180, length: 2.54 }
      ],
      graphicalBounds: [-1.27, -2.54, 1.27, 2.54],
      definition: `(symbol "KiCadText2Sch:SIDAC_Generic"
      (pin_numbers (hide yes)) (pin_names (offset 1.016) (hide yes))
      (exclude_from_sim no) (in_bom yes) (on_board yes)
      (property "Reference" "D" (at 0 3.81 0) (effects (font (size 1.27 1.27))))
      (property "Value" "SIDAC" (at 0 -3.81 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Description" "Generic schematic glyph for a two-terminal SIDAC; no SPICE model" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (symbol "SIDAC_Generic_0_1"
        (polyline (pts (xy -1.27 -2.54) (xy -1.27 2.54) (xy 0 0) (xy -1.27 -2.54)) (stroke (width 0.254) (type default)) (fill (type outline)))
        (polyline (pts (xy 1.27 -2.54) (xy 1.27 2.54) (xy 0 0) (xy 1.27 -2.54)) (stroke (width 0.254) (type default)) (fill (type outline)))
        (polyline (pts (xy -1.27 -0.635) (xy 1.27 0.635)) (stroke (width 0.254) (type default)) (fill (type none)))
        (polyline (pts (xy -1.27 0.635) (xy 1.27 -0.635)) (stroke (width 0.254) (type default)) (fill (type none)))
      )
      (symbol "SIDAC_Generic_1_1"
        (pin passive line (at -3.81 0 0) (length 2.54) (name "T1" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
        (pin passive line (at 3.81 0 180) (length 2.54) (name "T2" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },    'power:GND': {
      browserSupported: false,
      internalPowerSymbol: true,
      referencePrefix: '#PWR',
      description: 'Native KiCad global ground power symbol',
      units: [1],
      pins: [{ number: "1", name: "", electricalType: "power_in", unit: 1, at: [0, 0], orientation: 270, length: 0 }],
      graphicalBounds: [-1.27, 0, 1.27, 2.54],
      definition: `(symbol "power:GND"
      (power global)
      (pin_numbers (hide yes))
      (pin_names (offset 0) (hide yes))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "#PWR" (at 0 -6.35 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Value" "GND" (at 0 -3.81 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "Power symbol creates a global label with name GND, ground" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "global power" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "GND_0_1"
        (polyline (pts (xy 0 0) (xy 0 -1.27) (xy 1.27 -1.27) (xy 0 -2.54) (xy -1.27 -1.27) (xy 0 -1.27)) (stroke (width 0) (type default)) (fill (type none)))
      )
      (symbol "GND_1_1"
        (pin power_in line (at 0 0 270) (length 0) (name "" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    },
    'power:VS': {
      browserSupported: false,
      internalPowerSymbol: true,
      referencePrefix: '#PWR',
      description: 'Native KiCad global supply symbol VS',
      units: [1],
      pins: [{ number: "1", name: "", electricalType: "power_in", unit: 1, at: [0, 0], orientation: 90, length: 0 }],
      graphicalBounds: [-0.762, -2.54, 0.762, 0],
      definition: `(symbol "power:VS"
      (power global)
      (pin_numbers (hide yes))
      (pin_names (offset 0) (hide yes))
      (exclude_from_sim no)
      (in_bom yes)
      (on_board yes)
      (in_pos_files yes)
      (duplicate_pin_numbers_are_jumpers no)
      (property "Reference" "#PWR" (at 0 -3.81 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Value" "VS" (at 0 3.556 0) (show_name no) (do_not_autoplace no) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Datasheet" "" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "Description" "Power symbol creates a global label with name VS" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (property "ki_keywords" "global power" (at 0 0 0) (show_name no) (do_not_autoplace no) (hide yes) (effects (font (size 1.27 1.27))))
      (symbol "VS_0_1"
        (polyline (pts (xy 0 0) (xy 0 2.54)) (stroke (width 0) (type default)) (fill (type none)))
        (polyline (pts (xy 0.762 1.27) (xy -0.762 1.27) (xy 0 2.54) (xy 0.762 1.27)) (stroke (width 0) (type default)) (fill (type outline)))
      )
      (symbol "VS_1_1"
        (pin power_in line (at 0 0 90) (length 0) (name "" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`
    }
    }
  };
});