from collections import Counter
from pathlib import Path

from src.parser import load_design

ROOT = Path(__file__).resolve().parents[1]


def test_rlc_layout_test_json_is_structurally_valid():
    design = load_design(ROOT / "inputs" / "rlc_layout_test.json")

    assert len(design["parts"]) == 8
    assert len(design["nets"]) == 6
    assert len(design["connections"]) == 6


def test_rlc_layout_test_connects_each_two_pin_part_once_per_pin():
    design = load_design(ROOT / "inputs" / "rlc_layout_test.json")
    pin_refs = Counter(
        pin
        for connection in design["connections"]
        for pin in connection["pins"]
    )

    expected_pins = {
        f"{part['ref']}.{pin_number}"
        for part in design["parts"]
        for pin_number in ("1", "2")
    }
    assert set(pin_refs) == expected_pins
    assert all(count == 1 for count in pin_refs.values())


def test_diode_rectifier_example_is_structurally_valid_and_pins_are_unique():
    design = load_design(ROOT / "inputs" / "diode_rectifier_test.json")
    assert [part["name"] for part in design["parts"]] == ["D_Small", "R"]
    pins = [pin for connection in design["connections"] for pin in connection["pins"]]
    assert len(pins) == len(set(pins)) == 4
    assert set(pins) == {"D1.1", "D1.2", "R1.1", "R1.2"}


def test_browser_active_transistor_fixtures_have_complete_pin_coverage():
    expected = {
        "p_mosfet_high_side_switch.json": {"Q1.1", "Q1.2", "Q1.3", "R1.1", "R1.2"},
        "bjt_pnp_high_side_test.json": {"Q1.1", "Q1.2", "Q1.3", "R1.1", "R1.2", "R2.1", "R2.2"},
    }
    for filename, expected_pins in expected.items():
        design = load_design(ROOT / "inputs" / filename)
        pin_refs = [pin for connection in design["connections"] for pin in connection["pins"]]
        assert len(pin_refs) == len(set(pin_refs))
        assert set(pin_refs) == expected_pins
        assert all(part.get("rotation") in {None, 0, 90, 180, 270} for part in design["parts"])


def test_pid_controller_fixture_has_complete_pin_coverage_with_explicit_no_connects():
    design = load_design(ROOT / "inputs" / "pid_controller_lm741.json")
    connections = [pin for connection in design["connections"] for pin in connection["pins"]]
    no_connects = [f"{part['ref']}.{pin}" for part in design["parts"] for pin in part.get("no_connect", [])]
    assert len(design["parts"]) == 14
    assert {net["name"] for net in design["nets"] if net["type"] == "power"} == {"GND", "V+", "V-"}
    assert len(connections) == len(set(connections)) == 40
    assert len(no_connects) == len(set(no_connects)) == 12
    assert not set(connections) & set(no_connects)


def test_new_browser_catalog_fixtures_are_structurally_valid():
    for name in ("opamp_pinout_test.json", "scr_thyristor_test.json", "diac_trigger_test.json", "sidac_generic_test.json"):
        design = load_design(ROOT / "inputs" / name)
        assert design["parts"] and design["connections"]
