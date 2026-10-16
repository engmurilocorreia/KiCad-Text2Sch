# -*- coding: utf-8 -*-
"""Golden test: equivalência elétrica NORMALIZADA (golden vs gerado)."""
import re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KICAD_CLI = shutil.which("kicad-cli") or r"C:\Program Files\KiCad\10.0\bin\kicad-cli.exe"
GOLDEN = ROOT / "circuit1" / "circuit1.kicad_sch"
GERADO = ROOT / "outputs" / "circuit1_gen.kicad_sch"

SIMETRICOS = {"R", "L", "C"}   # parts de 2 pinos permutáveis (CP/D/ICs não!)


def _blocos(txt, inicio_re):
    out = []
    for m in re.finditer(inicio_re, txt):
        depth, j = 0, m.start()
        while j < len(txt):
            if txt[j] == '(':
                depth += 1
            elif txt[j] == ')':
                depth -= 1
                if depth == 0:
                    out.append(txt[m.start():j + 1])
                    break
            j += 1
    return out


def parse_netlist(txt):
    parts = {}
    for cb in _blocos(txt, r'\(comp\s'):
        ref = re.search(r'\(ref\s+"?([^")\s]+)"?\)', cb)
        lib = re.search(r'\(libsource\s+\(lib\s+"?([^")\s]+)"?\)\s+\(part\s+"?([^")\s]+)"?\)', cb)
        if ref and lib:
            parts[ref.group(1)] = lib.group(2)
    nets = []
    for nb in _blocos(txt, r'\(net\s'):
        nodes = re.findall(r'\(node\s+\(ref\s+"?([^")\s]+)"?\)\s+\(pin\s+"?([^")\s]+)"?\)', nb)
        norm = frozenset(
            (ref, '*' if parts.get(ref) in SIMETRICOS else pin)
            for ref, pin in nodes
            if not ref.startswith('#')          # ignora símbolos de potência
        )
        if norm:                                 # ignora nets órfãs (label flutuante)
            nets.append(norm)
    return nets


def exportar(sch: Path) -> str:
    out = sch.with_suffix(".test.net")
    subprocess.run([KICAD_CLI, "sch", "export", "netlist", "-o", str(out), str(sch)],
                   check=True, capture_output=True)
    return out.read_text(encoding="utf-8")


def main():
    ng = sorted(parse_netlist(exportar(GOLDEN)), key=sorted)
    nf = sorted(parse_netlist(exportar(GERADO)), key=sorted)
    if ng == nf:
        print("GOLDEN TEST: PASS ✔ (equivalência elétrica normalizada)")
        sys.exit(0)
    print("GOLDEN TEST: FAIL ✘")
    for n in ng:
        if n not in nf:
            print("  só no golden:", sorted(n))
    for n in nf:
        if n not in ng:
            print("  só no gerado:", sorted(n))
    sys.exit(1)


if __name__ == "__main__":
    main()