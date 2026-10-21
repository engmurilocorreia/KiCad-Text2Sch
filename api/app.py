"""FastAPI MVP que reutiliza o parser e o CLI do KiCad-Text2Sch.

Este backend é apropriado para desenvolvimento local. Antes de expor a geração
publicamente, implante-o em um contêiner isolado e acrescente limitação de taxa,
limites de recursos, autenticação/abuso e monitoramento.
"""
from __future__ import annotations

import io
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "main.py"
MAX_REQUEST_BYTES = int(os.environ.get("TEXT2SCH_MAX_REQUEST_BYTES", "524288"))
GENERATION_TIMEOUT_SECONDS = int(os.environ.get("TEXT2SCH_GENERATION_TIMEOUT", "90"))

from src.parser import DesignValidationError, validate_design  # noqa: E402
from src.kicad_cli import KiCadCliError, resolve_kicad_cli  # noqa: E402

app = FastAPI(
    title="KiCad-Text2Sch API",
    description="Validação estrutural de JSON e geração de esquemas KiCad.",
    version="0.1.0",
)

_default_origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]
_origins = [item.strip() for item in os.environ.get("TEXT2SCH_CORS_ORIGINS", ",".join(_default_origins)).split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def _decode_and_validate(raw: bytes) -> dict[str, Any]:
    if len(raw) > MAX_REQUEST_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"JSON excede o limite de {MAX_REQUEST_BYTES} bytes.",
        )
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="O corpo deve estar codificado em UTF-8.") from exc
    try:
        document = json.loads(text)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"JSON inválido na linha {exc.lineno}, coluna {exc.colno}: {exc.msg}",
        ) from exc
    try:
        return validate_design(document)
    except DesignValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


async def _read_design(request: Request) -> dict[str, Any]:
    raw = await request.body()
    return _decode_and_validate(raw)


def _top_name(design: dict[str, Any]) -> str:
    # validate_design already rejects path separators in meta.top_name.
    name = design.get("meta", {}).get("top_name", "design")
    # Extra defense for cross-platform reserved/special characters and response headers.
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", str(name)).strip("._-")
    return safe[:80] or "design"


def _zip_generated_artifacts(output_dir: Path, top: str, log: str, returncode: int, cli_available: bool) -> bytes:
    memory_file = io.BytesIO()
    files = sorted(p for p in output_dir.rglob("*") if p.is_file())
    summary = {
        "service": "KiCad-Text2Sch API",
        "top_name": top,
        "schematic_generated": (output_dir / f"{top}.kicad_sch").is_file(),
        "process_return_code": returncode,
        "kicad_cli_available": cli_available,
        "note": "Geração do arquivo não comprova correção elétrica, adequação física ou segurança do circuito.",
    }
    with zipfile.ZipFile(memory_file, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
        for path in files:
            # Bundle only generated files under this request's temporary output directory.
            bundle.write(path, arcname=path.relative_to(output_dir).as_posix())
        bundle.writestr("generation_log.txt", log or "(sem saída de log)\n")
        bundle.writestr("generation_summary.json", json.dumps(summary, indent=2, ensure_ascii=False) + "\n")
        bundle.writestr(
            "README_RESULT.txt",
            "Artefatos gerados pelo MVP KiCad-Text2Sch.\n"
            "Confira os relatórios de auditoria e ERC antes de confiar no circuito.\n"
            "A aprovação estrutural do JSON não comprova funcionamento elétrico ou segurança.\n",
        )
    return memory_file.getvalue()


@app.get("/api/v1/health")
def health() -> dict[str, Any]:
    try:
        cli_path = resolve_kicad_cli()
        cli_available = True
    except KiCadCliError:
        cli_path = None
        cli_available = False
    return {
        "ok": True,
        "service": "KiCad-Text2Sch API",
        "version": app.version,
        "kicad_cli_available": cli_available,
        "kicad_cli_path": cli_path,
        "max_request_bytes": MAX_REQUEST_BYTES,
    }


@app.post("/api/v1/validate")
async def validate(request: Request) -> dict[str, Any]:
    design = await _read_design(request)
    nets = {item.get("net") for item in design.get("connections", []) if isinstance(item, dict)}
    referenced_pins = sum(len(item.get("pins", [])) for item in design.get("connections", []) if isinstance(item, dict))
    return {
        "valid": True,
        "stage": "json_structure",
        "summary": {
            "parts": len(design.get("parts", [])),
            "declared_nets": len(design.get("nets", [])),
            "connected_nets": len(nets),
            "connection_groups": len(design.get("connections", [])),
            "pin_references": referenced_pins,
        },
        "message": "JSON estruturalmente válido. A resolução de símbolos/pinos e as verificações elétricas ainda não foram executadas.",
    }


@app.post("/api/v1/generate")
async def generate(request: Request) -> Response:
    design = await _read_design(request)
    top = _top_name(design)
    # Use the exact sanitized name for both the CLI output and the HTTP filename.
    design.setdefault("meta", {})["top_name"] = top

    with tempfile.TemporaryDirectory(prefix="kicad-text2sch-") as temporary:
        work_dir = Path(temporary)
        input_path = work_dir / "design.json"
        output_dir = work_dir / "outputs"
        output_dir.mkdir(parents=True, exist_ok=True)
        input_path.write_text(json.dumps(design, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        command = [sys.executable, str(MAIN), str(input_path), "--out", str(output_dir)]
        cli_path: str | None
        try:
            cli_path = resolve_kicad_cli()
        except KiCadCliError:
            cli_path = None

        # If installed, validate the final KiCad artifact as part of the bundle.
        # Connectivity FAIL is preserved as a report so the user can diagnose it.
        if cli_path:
            command.extend([
                "--netlist", "--audit-connectivity", "--kicad-erc", "--kicad-cli", cli_path,
            ])

        try:
            process = subprocess.run(
                command,
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=GENERATION_TIMEOUT_SECONDS,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise HTTPException(
                status_code=504,
                detail=f"A geração excedeu o limite de {GENERATION_TIMEOUT_SECONDS} segundos.",
            ) from exc
        except OSError as exc:
            raise HTTPException(status_code=500, detail=f"Não foi possível iniciar o conversor: {exc}") from exc

        schematic = output_dir / f"{top}.kicad_sch"
        log = (process.stdout or "") + ("\n[stderr]\n" + process.stderr if process.stderr else "")
        if not schematic.is_file():
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "O conversor não produziu o arquivo .kicad_sch.",
                    "return_code": process.returncode,
                    "log": log[-12000:],
                },
            )

        archive = _zip_generated_artifacts(
            output_dir, top, log, process.returncode, cli_available=bool(cli_path)
        )
        return Response(
            content=archive,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="kicad-text2sch-{top}.zip"'},
        )
