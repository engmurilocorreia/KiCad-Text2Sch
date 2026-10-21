"""CLI do KiCad-Text2Sch.

Exemplos:
  python main.py inputs/circuit1.json --validate-only
  python main.py inputs/circuit1.json -o outputs --netlist --kicad-erc
"""
import argparse
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def _configure_symbol_dir(symbol_dir: str | None) -> None:
    """Configura as variáveis conhecidas pelo SKiDL sem impor caminhos de SO."""
    candidates = []
    if symbol_dir:
        candidates.append(Path(symbol_dir).expanduser())
    elif os.environ.get("KICAD_SYMBOL_DIR"):
        candidates.append(Path(os.environ["KICAD_SYMBOL_DIR"]).expanduser())
    else:
        candidates.extend(
            Path(p) for p in (
                r"C:\Program Files\KiCad\10.0\share\kicad\symbols",
                "/usr/share/kicad/symbols",
                "/usr/local/share/kicad/symbols",
            )
        )

    found = next((p.resolve() for p in candidates if p.is_dir()), None)
    if found is None:
        if symbol_dir:
            raise ValueError(f"Diretório de símbolos do KiCad não encontrado: {symbol_dir}")
        return  # Deixa o SKiDL usar as configurações/avisos do ambiente atual.

    for suffix in ("", "6", "7", "8", "9", "10"):
        os.environ.setdefault(f"KICAD{suffix}_SYMBOL_DIR", str(found))


def main() -> int:
    ap = argparse.ArgumentParser(description="Gera esquemáticos KiCad a partir de JSON")
    ap.add_argument("design", help="Arquivo JSON de entrada (ex.: inputs/circuit1.json)")
    ap.add_argument("-o", "--out", default="outputs", help="Diretório para os artefatos gerados")
    ap.add_argument(
        "--netlist", action="store_true",
        help="exporta a netlist do .kicad_sch final com kicad-cli (não exige footprints)",
    )
    ap.add_argument(
        "--audit-connectivity", action="store_true",
        help="compara os pinos/redes do JSON com a netlist exportada do .kicad_sch final",
    )
    ap.add_argument(
        "--erc", action="store_true",
        help="executa a verificação ERC do SKiDL no circuito em memória antes de exportar",
    )
    ap.add_argument(
        "--kicad-erc", action="store_true",
        help="executa o ERC nativo do KiCad no .kicad_sch final e salva um relatório",
    )
    ap.add_argument(
        "--kicad-cli", help="caminho de kicad-cli (opcional; tenta detectar a instalação)",
    )
    ap.add_argument(
        "--validate-only", action="store_true",
        help="valida a estrutura JSON sem exigir SKiDL ou bibliotecas do KiCad",
    )
    ap.add_argument(
        "--symbol-dir", help="diretório da biblioteca de símbolos do KiCad (opcional)",
    )
    args = ap.parse_args()

    # Importação local intencional: validar o JSON não deve exigir o SKiDL instalado.
    from src.parser import DesignValidationError, load_design

    try:
        data = load_design(args.design)
        print(
            f"JSON válido: {len(data['parts'])} componente(s), "
            f"{len(data.get('nets', []))} rede(s) declarada(s), "
            f"{len(data['connections'])} conexão(ões)."
        )
        if args.validate_only:
            return 0

        _configure_symbol_dir(args.symbol_dir)
        from src.generator import build_circuit, export

        build_circuit(data)
        if args.erc:
            from skidl import ERC
            ERC()
        export(
            data,
            out_dir=args.out,
            netlist=args.netlist or args.audit_connectivity,
            kicad_erc=args.kicad_erc,
            kicad_cli=args.kicad_cli,
        )
        if args.audit_connectivity:
            from src.connectivity_audit import write_connectivity_audit
            from src.kicad_cli import KiCadCliError
            top_name = data.get("meta", {}).get("top_name", "design")
            output_dir = Path(args.out)
            netlist_path = output_dir / f"{top_name}.net"
            report_path = output_dir / f"{top_name}_connectivity.rpt"
            audit = write_connectivity_audit(data, netlist_path, report_path)
            print(f"{'OK' if audit.ok else 'ERRO'}: Auditoria de conectividade: {report_path}")
            for issue in audit.errors:
                print(f"  ERRO: {issue}")
            for issue in audit.warnings:
                print(f"  AVISO: {issue}")
            if not audit.ok:
                return 3
        return 0
    except (DesignValidationError, ValueError) as exc:
        ap.exit(2, f"Erro: {exc}\n")
    except ModuleNotFoundError as exc:
        if exc.name == "skidl":
            ap.exit(2, "Erro: SKiDL não instalado. Execute 'pip install -r requirements.txt'.\n")
        raise
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
