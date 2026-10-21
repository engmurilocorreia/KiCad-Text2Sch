# -*- coding: utf-8 -*-
"""Teste de integração: compara a conectividade do golden com a gerada.

Para habilitá-lo, adicione o esquema de referência em circuit1/circuit1.kicad_sch,
instale SKiDL + KiCad CLI e execute pytest. O teste unitário comum não depende
nem dessas ferramentas nem desse fixture.
"""
import importlib.util
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
KICAD_CLI = shutil.which("kicad-cli") or r"C:\Program Files\KiCad\10.0\bin\kicad-cli.exe"
GOLDEN = ROOT / "circuit1" / "circuit1.kicad_sch"
INPUT = ROOT / "inputs" / "circuit1.json"

SIMETRICOS = {"R", "L", "C"}  # Componentes de 2 pinos permutáveis.


def _blocos(txt, inicio_re):
    out = []
    for m in re.finditer(inicio_re, txt):
        depth, j = 0, m.start()
        while j < len(txt):
            if txt[j] == "(":
                depth += 1
            elif txt[j] == ")":
                depth -= 1
                if depth == 0:
                    out.append(txt[m.start():j + 1])
                    break
            j += 1
    return out


def parse_netlist(txt):
    parts = {}
    for cb in _blocos(txt, r"\(comp\s"):
        ref = re.search(r'\(ref\s+"?([^")\s]+)"?\)', cb)
        lib = re.search(r'\(libsource\s+\(lib\s+"?([^")\s]+)"?\)\s+\(part\s+"?([^")\s]+)"?\)', cb)
        if ref and lib:
            parts[ref.group(1)] = lib.group(2)
    nets = []
    for nb in _blocos(txt, r"\(net\s"):
        nodes = re.findall(r'\(node\s+\(ref\s+"?([^")\s]+)"?\)\s+\(pin\s+"?([^")\s]+)"?\)', nb)
        norm = frozenset(
            (ref, "*" if parts.get(ref) in SIMETRICOS else pin)
            for ref, pin in nodes
            if not ref.startswith("#")
        )
        if norm:
            nets.append(norm)
    return nets


def exportar(sch: Path, kicad_cli: str) -> str:
    out = sch.with_suffix(".test.net")
    subprocess.run(
        [kicad_cli, "sch", "export", "netlist", "-o", str(out), str(sch)],
        check=True, capture_output=True, text=True,
    )
    return out.read_text(encoding="utf-8")


def test_golden_electrical_equivalence(tmp_path):
    cli_exists = Path(KICAD_CLI).is_file() or shutil.which(KICAD_CLI) is not None
    if not cli_exists:
        pytest.skip("kicad-cli não está instalado")
    if importlib.util.find_spec("skidl") is None:
        pytest.skip("SKiDL não está instalado")
    if not GOLDEN.is_file():
        pytest.skip("fixture golden ausente: circuit1/circuit1.kicad_sch")

    generated_dir = tmp_path / "outputs"
    subprocess.run(
        [sys.executable, str(ROOT / "main.py"), str(INPUT), "--out", str(generated_dir)],
        cwd=ROOT, check=True, capture_output=True, text=True,
    )
    generated = generated_dir / "circuit1_gen.kicad_sch"
    assert generated.is_file(), "o gerador não criou o esquema esperado"

    golden_nets = sorted(parse_netlist(exportar(GOLDEN, KICAD_CLI)), key=sorted)
    generated_nets = sorted(parse_netlist(exportar(generated, KICAD_CLI)), key=sorted)
    assert golden_nets == generated_nets


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
