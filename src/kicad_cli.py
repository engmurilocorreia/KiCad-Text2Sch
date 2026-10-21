"""Helpers for validating/exporting the generated schematic with native KiCad CLI."""
from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path
from typing import Sequence


class KiCadCliError(ValueError):
    """Raised when kicad-cli is unavailable or a CLI operation fails."""


def resolve_kicad_cli(explicit: str | None = None) -> str:
    """Find kicad-cli from an explicit path, PATH, environment, or common installs."""
    if explicit:
        expanded = Path(explicit).expanduser()
        if expanded.is_file():
            return str(expanded.resolve())
        on_path = shutil.which(explicit)
        if on_path:
            return on_path
        raise KiCadCliError(
            f"kicad-cli não encontrado no caminho informado: {explicit}. "
            "Use --kicad-cli com o caminho completo do executável."
        )

    env_value = os.environ.get("KICAD_CLI")
    if env_value:
        env_path = Path(env_value).expanduser()
        if env_path.is_file():
            return str(env_path.resolve())
        on_path = shutil.which(env_value)
        if on_path:
            return on_path

    on_path = shutil.which("kicad-cli") or shutil.which("kicad-cli.exe")
    if on_path:
        return on_path

    candidates: list[Path] = []
    program_files = os.environ.get("PROGRAMFILES", r"C:\Program Files")
    kicad_root = Path(program_files) / "KiCad"
    if kicad_root.is_dir():
        candidates.extend(kicad_root.glob("*/bin/kicad-cli.exe"))
        candidates.extend(kicad_root.glob("bin/kicad-cli.exe"))
    candidates.extend((Path("/usr/bin/kicad-cli"), Path("/usr/local/bin/kicad-cli")))

    found = [p.resolve() for p in candidates if p.is_file()]
    if found:
        # Prefer the numerically newest versioned Windows installation when several exist.
        def version_key(path: Path):
            parts = path.parts
            version = ""
            for i, part in enumerate(parts):
                if part.lower() == "kicad" and i + 1 < len(parts):
                    version = parts[i + 1]
                    break
            try:
                return tuple(int(x) for x in version.split("."))
            except ValueError:
                return (0,)
        found.sort(key=version_key, reverse=True)
        return str(found[0])

    raise KiCadCliError(
        "Não encontrei kicad-cli. Instale o KiCad ou informe o executável com "
        '--kicad-cli "C:\\Program Files\\KiCad\\10.0\\bin\\kicad-cli.exe".'
    )


def _run_kicad(args: Sequence[str], output_path: Path, explicit_cli: str | None = None) -> Path:
    cli = resolve_kicad_cli(explicit_cli)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    command = [cli, *args]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0 or not output_path.is_file():
        details = "\n".join(part.strip() for part in (result.stdout, result.stderr) if part.strip())
        if not details:
            details = f"kicad-cli encerrou com código {result.returncode} e não criou {output_path}."
        raise KiCadCliError(f"Falha ao executar {' '.join(command)}:\n{details}")
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip())
    return output_path


def export_schematic_netlist(
    schematic_path: str | Path,
    output_path: str | Path,
    explicit_cli: str | None = None,
) -> Path:
    """Export a netlist from the final .kicad_sch, without requiring PCB footprints."""
    schematic = Path(schematic_path).resolve()
    target = Path(output_path).resolve()
    if not schematic.is_file():
        raise KiCadCliError(f"Esquemático não encontrado para exportar a netlist: {schematic}")
    return _run_kicad(
        ["sch", "export", "netlist", "--output", str(target), str(schematic)],
        target,
        explicit_cli,
    )


def run_schematic_erc(
    schematic_path: str | Path,
    output_path: str | Path,
    explicit_cli: str | None = None,
    output_format: str = "report",
) -> Path:
    """Run the native KiCad schematic ERC against the final generated file."""
    if output_format not in {"report", "json"}:
        raise KiCadCliError("Formato de relatório ERC inválido; use 'report' ou 'json'.")
    schematic = Path(schematic_path).resolve()
    target = Path(output_path).resolve()
    if not schematic.is_file():
        raise KiCadCliError(f"Esquemático não encontrado para executar ERC: {schematic}")
    return _run_kicad(
        ["sch", "erc", "--format", output_format, "--output", str(target), str(schematic)],
        target,
        explicit_cli,
    )
