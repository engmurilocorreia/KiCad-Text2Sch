from pathlib import Path
import json
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.connectivity_audit import audit_connectivity, parse_kicad_netlist, write_connectivity_audit
from src.parser import load_design


def sample_design():
    return {
        "meta": {"top_name": "demo"},
        "nets": [{"name": "N1"}, {"name": "GND", "type": "power"}],
        "parts": [
            {"ref": "R1", "tag": "r1", "lib": "Device", "name": "R", "value": "1k"},
            {"ref": "C1", "tag": "c1", "lib": "Device", "name": "C", "value": "100n"},
        ],
        "connections": [
            {"net": "N1", "pins": ["R1.2", "C1.1"]},
            {"net": "GND", "pins": ["R1.1", "C1.2"]},
        ],
    }


def sample_netlist(r2_pin2_net="N3"):
    return f'''(export
      (version "E")
      (components
        (comp (ref "R1") (value "1k"))
        (comp (ref "C1") (value "100n"))
      )
      (nets
        (net (code "1") (name "N1")
          (node (ref "R1") (pin "2"))
          (node (ref "C1") (pin "1"))
        )
        (net (code "2") (name "GND")
          (node (ref "R1") (pin "1"))
          (node (ref "C1") (pin "2"))
          (node (ref "#PWR001") (pin "1"))
        )
      )
    )'''


def test_parse_kicad_netlist_ignores_power_symbol_refs():
    parsed = parse_kicad_netlist(sample_netlist())
    assert {pin.display() for pin in parsed["N1"]} == {"R1.2", "C1.1"}
    assert {pin.display() for pin in parsed["GND"]} == {"R1.1", "C1.2"}


def test_audit_passes_when_component_pin_membership_matches():
    result = audit_connectivity(sample_design(), sample_netlist())
    assert result.ok
    assert not result.errors


def test_audit_reports_component_pin_missing_from_actual_netlist():
    design = sample_design()
    actual = '''(export (nets
      (net (code "1") (name "N1") (node (ref "R1") (pin "2")))
      (net (code "2") (name "GND") (node (ref "R1") (pin "1")) (node (ref "C1") (pin "2")))
    ))'''
    result = audit_connectivity(design, actual)
    assert not result.ok
    assert any("C1.1" in message for message in result.errors)


def test_audit_reports_pin_connected_to_wrong_net():
    design = sample_design()
    actual = '''(export (nets
      (net (code "1") (name "N1") (node (ref "C1") (pin "1")))
      (net (code "2") (name "GND") (node (ref "R1") (pin "1")) (node (ref "C1") (pin "2")))
      (net (code "3") (name "OTHER") (node (ref "R1") (pin "2")))
    ))'''
    result = audit_connectivity(design, actual)
    assert not result.ok
    assert any("R1.2 foi para 'OTHER'" in message for message in result.errors)


def test_audit_requires_explicit_part_references():
    design = sample_design()
    design["parts"][0].pop("ref")
    with pytest.raises(ValueError, match="referências explícitas"):
        audit_connectivity(design, sample_netlist())


def test_write_connectivity_audit_creates_text_and_json_reports(tmp_path):
    netlist = tmp_path / "demo.net"
    report = tmp_path / "demo_connectivity.rpt"
    netlist.write_text(sample_netlist(), encoding="utf-8")
    result = write_connectivity_audit(sample_design(), netlist, report)
    assert result.ok
    assert "Status: PASS" in report.read_text(encoding="utf-8")
    data = json.loads(report.with_suffix(".json").read_text(encoding="utf-8"))
    assert data["ok"] is True


def test_rlc_example_connectivity_audit_expected_pins_are_explicit():
    design = load_design(ROOT / "inputs" / "rlc_layout_test.json")
    result = audit_connectivity(design, '''(export (nets
      (net (code "1") (name "VS") (node (ref "R1") (pin "1")))
      (net (code "2") (name "N1") (node (ref "R1") (pin "2")) (node (ref "C1") (pin "1")) (node (ref "L1") (pin "1")))
      (net (code "3") (name "N2") (node (ref "L1") (pin "2")) (node (ref "R2") (pin "1")))
      (net (code "4") (name "N3") (node (ref "R2") (pin "2")) (node (ref "C2") (pin "1")) (node (ref "L2") (pin "1")))
      (net (code "5") (name "VOUT") (node (ref "L2") (pin "2")) (node (ref "C3") (pin "1")) (node (ref "R3") (pin "1")))
      (net (code "6") (name "GND") (node (ref "C1") (pin "2")) (node (ref "C2") (pin "2")) (node (ref "C3") (pin "2")) (node (ref "R3") (pin "2")))
    ))''')
    assert result.ok
