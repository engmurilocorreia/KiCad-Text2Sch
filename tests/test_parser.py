import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.parser import DesignValidationError, load_design, validate_design


def test_existing_examples_are_structurally_valid():
    assert len(load_design(ROOT / "inputs" / "circuit1.json")["parts"]) == 3
    assert len(load_design(ROOT / "inputs" / "energizer_stage2.json")["parts"]) == 9


def test_root_must_be_object():
    with pytest.raises(DesignValidationError, match="raiz do JSON"):
        validate_design([])


def test_required_top_level_fields_are_reported_together():
    with pytest.raises(DesignValidationError) as exc:
        validate_design({})
    assert "'parts'" in str(exc.value)
    assert "'connections'" in str(exc.value)


def test_duplicate_references_are_rejected():
    design = {
        "parts": [
            {"ref": "R1", "lib": "Device", "name": "R"},
            {"ref": "R1", "lib": "Device", "name": "R"},
        ],
        "connections": [],
    }
    with pytest.raises(DesignValidationError, match="duplicada"):
        validate_design(design)


def test_unknown_component_handle_is_rejected():
    design = {
        "parts": [{"ref": "R1", "lib": "Device", "name": "R"}],
        "connections": [{"net": "N1", "pins": ["C1.1"]}],
    }
    with pytest.raises(DesignValidationError, match="inexistente 'C1'"):
        validate_design(design)


def test_one_pin_cannot_be_assigned_to_two_distinct_nets():
    design = {
        "parts": [{"ref": "R1", "lib": "Device", "name": "R"}],
        "connections": [
            {"net": "N1", "pins": ["R1.1"]},
            {"net": "N2", "pins": ["R1.1"]},
        ],
    }
    with pytest.raises(DesignValidationError, match="aparece nas redes"):
        validate_design(design)


def test_malformed_json_has_line_and_column(tmp_path):
    source = tmp_path / "broken.json"
    source.write_text('{\n  "parts": [\n', encoding="utf-8")
    with pytest.raises(DesignValidationError, match=r"linha 3, coluna"):
        load_design(source)


def test_validate_only_does_not_import_skidl():
    result = subprocess.run(
        [sys.executable, str(ROOT / "main.py"), str(ROOT / "inputs" / "circuit1.json"), "--validate-only"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "JSON válido" in result.stdout


def test_part_rotation_hint_accepts_quadrant_angles():
    design = {
        "parts": [{"ref": "Q1", "lib": "Transistor_FET", "name": "Q_PMOS_GSD", "rotation": 180}],
        "connections": [{"net": "VS", "pins": ["Q1.2"]}],
    }
    assert validate_design(design)["parts"][0]["rotation"] == 180


def test_part_rotation_hint_rejects_unsupported_angle():
    design = {
        "parts": [{"ref": "Q1", "lib": "Transistor_FET", "name": "Q_PMOS_GSD", "rotation": 45}],
        "connections": [{"net": "VS", "pins": ["Q1.2"]}],
    }
    with pytest.raises(DesignValidationError, match=r"parts\[0\]\.rotation deve ser 0, 90, 180 ou 270"):
        validate_design(design)
