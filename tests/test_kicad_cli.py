from pathlib import Path
from types import SimpleNamespace

import pytest

from src import kicad_cli


def _fake_cli_run_factory(monkeypatch, returncode=0, stdout="", stderr=""):
    seen = {}

    def fake_run(command, capture_output, text, check):
        seen["command"] = command
        output_path = Path(command[command.index("--output") + 1])
        if returncode == 0:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text("test output", encoding="utf-8")
        return SimpleNamespace(returncode=returncode, stdout=stdout, stderr=stderr)

    monkeypatch.setattr(kicad_cli, "resolve_kicad_cli", lambda explicit=None: "kicad-cli-test")
    monkeypatch.setattr(kicad_cli.subprocess, "run", fake_run)
    return seen


def test_exports_netlist_from_final_schematic_without_footprints(tmp_path, monkeypatch):
    schematic = tmp_path / "demo.kicad_sch"
    schematic.write_text("(kicad_sch)", encoding="utf-8")
    target = tmp_path / "demo.net"
    seen = _fake_cli_run_factory(monkeypatch)

    result = kicad_cli.export_schematic_netlist(schematic, target)

    assert result == target.resolve()
    assert target.read_text(encoding="utf-8") == "test output"
    assert seen["command"][:4] == ["kicad-cli-test", "sch", "export", "netlist"]
    assert str(schematic.resolve()) in seen["command"]


def test_runs_native_erc_and_writes_report(tmp_path, monkeypatch):
    schematic = tmp_path / "demo.kicad_sch"
    schematic.write_text("(kicad_sch)", encoding="utf-8")
    target = tmp_path / "demo_erc.rpt"
    seen = _fake_cli_run_factory(monkeypatch)

    result = kicad_cli.run_schematic_erc(schematic, target)

    assert result == target.resolve()
    assert "erc" in seen["command"]
    assert "report" in seen["command"]
    assert target.exists()


def test_missing_schematic_produces_clear_error(tmp_path):
    with pytest.raises(kicad_cli.KiCadCliError, match="Esquemático não encontrado"):
        kicad_cli.export_schematic_netlist(tmp_path / "missing.kicad_sch", tmp_path / "out.net")


def test_cli_nonzero_return_code_is_reported(tmp_path, monkeypatch):
    schematic = tmp_path / "demo.kicad_sch"
    schematic.write_text("(kicad_sch)", encoding="utf-8")
    seen = _fake_cli_run_factory(monkeypatch, returncode=5, stderr="ERC failed")

    with pytest.raises(kicad_cli.KiCadCliError, match="ERC failed"):
        kicad_cli.run_schematic_erc(schematic, tmp_path / "demo.rpt")


def test_invalid_erc_format_is_rejected(tmp_path):
    with pytest.raises(kicad_cli.KiCadCliError, match="Formato de relatório ERC inválido"):
        kicad_cli.run_schematic_erc(tmp_path / "demo.kicad_sch", tmp_path / "demo.rpt", output_format="yaml")
