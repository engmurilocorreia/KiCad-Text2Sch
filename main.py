"""CLI do KiCad-Text2Sch: python main.py inputs/circuit1.json -o outputs --erc"""
import argparse, os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Bibliotecas do KiCad 10 (Windows). Sobrevia com KICAD_SYMBOL_DIR se necessário.
DEFAULT_SYM = r"C:\Program Files\KiCad\10.0\share\kicad\symbols"
for suf in ("", "6", "7", "8", "9", "10"):     # silencia os warnings de env ausente
    os.environ.setdefault(f"KICAD{suf}_SYMBOL_DIR", DEFAULT_SYM)

sys.path.insert(0, str(ROOT))
from src.parser import load_design
from src.generator import build_circuit, export


def main():
    ap = argparse.ArgumentParser(description="Gera esquemáticos KiCad a partir de JSON")
    ap.add_argument("design", help="JSON de entrada (inputs/*.json)")
    ap.add_argument("-o", "--out", default="outputs")
    ap.add_argument("--netlist", action="store_true", help="gera também o .net")
    ap.add_argument("--erc", action="store_true", help="roda ERC antes de exportar")
    args = ap.parse_args()

    data = load_design(args.design)
    build_circuit(data)
    if args.erc:
        from skidl import ERC
        ERC()
    export(data, out_dir=args.out, netlist=args.netlist)
    print(f"OK: esquemático gerado em {args.out}/")


if __name__ == "__main__":
    main()