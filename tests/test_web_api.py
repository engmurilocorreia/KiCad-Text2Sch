"""Tests the optional FastAPI MVP; skips cleanly when web extras aren't installed."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import zipfile
from io import BytesIO

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")
from fastapi.testclient import TestClient  # noqa: E402

from api import app as api_module  # noqa: E402

client = TestClient(api_module.app)


def sample_design():
    return {
        "meta": {"title": "API test", "top_name": "api test"},
        "nets": [{"name": "N1"}],
        "parts": [
            {"ref": "R1", "tag": "r1", "lib": "Device", "name": "R", "value": "1k"},
            {"ref": "R2", "tag": "r2", "lib": "Device", "name": "R", "value": "2k"},
        ],
        "connections": [{"net": "N1", "pins": ["R1.2", "R2.1"]}],
    }


def test_health_endpoint_reports_service():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_validate_endpoint_accepts_structurally_valid_design():
    response = client.post("/api/v1/validate", json=sample_design())
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["summary"]["parts"] == 2
    assert data["summary"]["pin_references"] == 2


def test_validate_endpoint_rejects_invalid_design():
    response = client.post("/api/v1/validate", json={"parts": [], "connections": [{"net": "N", "pins": ["UNKNOWN.1"]}]})
    assert response.status_code == 422
    assert "inválido" in response.json()["detail"].lower()


def test_validate_endpoint_rejects_malformed_json():
    response = client.post("/api/v1/validate", content=b'{"parts":', headers={"Content-Type": "application/json"})
    assert response.status_code == 400


def test_generate_endpoint_bundles_artifacts_and_log(monkeypatch):
    monkeypatch.setattr(api_module, "resolve_kicad_cli", lambda: (_ for _ in ()).throw(api_module.KiCadCliError("CLI fake unavailable")))

    def fake_run(command, cwd, capture_output, text, encoding, errors, timeout, check):
        output_dir = Path(command[command.index("--out") + 1])
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "api_test.kicad_sch").write_text("(kicad_sch (version 20250114))", encoding="utf-8")
        return subprocess.CompletedProcess(command, 0, stdout="schematic created", stderr="")

    monkeypatch.setattr(api_module.subprocess, "run", fake_run)
    response = client.post("/api/v1/generate", json=sample_design())
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/zip")
    with zipfile.ZipFile(BytesIO(response.content)) as archive:
        names = archive.namelist()
        assert "api_test.kicad_sch" in names
        assert "generation_log.txt" in names
        summary = json.loads(archive.read("generation_summary.json"))
        assert summary["schematic_generated"] is True
        assert summary["kicad_cli_available"] is False
