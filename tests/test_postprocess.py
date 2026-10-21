from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.postprocess import _strip_empty_labels, polish_schematic


def test_strip_empty_labels_removes_label_and_global_label():
    text = '''(kicad_sch
  (label "" (at 10 10 0) (effects (font (size 1.27 1.27))))
  (global_label "" (shape input) (at 20 20 0) (effects (font (size 1.27 1.27))))
  (label "KEEP_ME" (at 30 30 0) (effects (font (size 1.27 1.27))))
)'''
    result = _strip_empty_labels(text)
    assert '(label ""' not in result
    assert '(global_label ""' not in result
    assert '"KEEP_ME"' in result


def test_polish_schematic_applies_empty_label_cleanup(tmp_path):
    schematic = tmp_path / "minimal.kicad_sch"
    schematic.write_text(
        '(kicad_sch\n  (version 20250114)\n  (label "" (at 10 10 0))\n)\n',
        encoding="utf-8",
    )
    polish_schematic(schematic)
    result = schematic.read_text(encoding="utf-8")
    assert '(label ""' not in result


def test_polish_makes_explicit_field_positions_authoritative(tmp_path):
    schematic = tmp_path / "fields.kicad_sch"
    schematic.write_text('''(kicad_sch
  (version 20230409)
  (uuid "11111111-1111-4111-8111-111111111111")
  (lib_symbols)
  (symbol
    (lib_id "Device:R")
    (at 100 100 0)
    (fields_autoplaced yes)
    (uuid "22222222-2222-4222-8222-222222222222")
    (property "Reference" "R1"
      (at 100 100 90)
      (effects (font (size 1.27 1.27)))
    )
    (property "Value" "10k"
      (at 100 100 90)
      (effects (font (size 1.27 1.27)))
    )
    (instances (project "SKiDL-Generated"
      (path "/11111111-1111-4111-8111-111111111111" (reference "R1") (unit 1))))
  )
)
''', encoding="utf-8")

    polish_schematic(schematic)
    result = schematic.read_text(encoding="utf-8")
    assert "(fields_autoplaced no)" in result
    assert "(fields_autoplaced yes)" not in result
    assert '(at 102.54 98.73 0)' in result
    assert '(at 102.54 101.27 0)' in result


def test_polish_repairs_flat_power_paths_and_deduplicates_coincident_symbols(tmp_path):
    schematic = tmp_path / "power.kicad_sch"
    schematic.write_text('''(kicad_sch
  (version 20230409)
  (uuid "11111111-1111-4111-8111-111111111111")
  (lib_symbols)
  (symbol (lib_id "power:VS") (at 10 20 0)
    (fields_autoplaced yes) (uuid "22222222-2222-4222-8222-222222222222")
    (property "Reference" "#PWR001" (at 10 18 0) (effects (font (size 1.27 1.27)) (hide yes)))
    (property "Value" "VS" (at 10 16 0) (effects (font (size 1.27 1.27))))
    (instances (project "SKiDL-Generated" (path "/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" (reference "#PWR001") (unit 1))))
  )
  (symbol (lib_id "power:VS") (at 10 20 0)
    (fields_autoplaced yes) (uuid "33333333-3333-4333-8333-333333333333")
    (property "Reference" "#PWR002" (at 10 18 0) (effects (font (size 1.27 1.27)) (hide yes)))
    (property "Value" "VS" (at 10 16 0) (effects (font (size 1.27 1.27))))
    (instances (project "SKiDL-Generated" (path "/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" (reference "#PWR002") (unit 1))))
  )
  (symbol (lib_id "power:GND") (at 10 30 0)
    (fields_autoplaced yes) (uuid "44444444-4444-4444-8444-444444444444")
    (property "Reference" "#PWR003" (at 10 31 0) (effects (font (size 1.27 1.27)) (hide yes)))
    (property "Value" "GND" (at 10 33 0) (effects (font (size 1.27 1.27))))
    (instances (project "SKiDL-Generated" (path "/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" (reference "#PWR003") (unit 1))))
  )
)
''', encoding="utf-8")

    polish_schematic(schematic)
    result = schematic.read_text(encoding="utf-8")
    assert result.count('(lib_id "power:VS")') == 1
    assert result.count('(lib_id "power:GND")') == 1
    assert '(path "/11111111-1111-4111-8111-111111111111"' in result
    assert '(path "/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"' not in result
