"""Leitura e validação do JSON de entrada (DSL do KiCad-Text2Sch)."""
import json
from pathlib import Path


def load_design(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))

    for key in ("parts", "connections"):
        if key not in data:
            raise ValueError(f"JSON inválido: chave '{key}' ausente")

    for i, p in enumerate(data["parts"]):
        if "lib" not in p or "name" not in p:
            raise ValueError(f"parts[{i}] precisa de 'lib' e 'name'")
        if not (p.get("ref") or p.get("tag")):
            raise ValueError(f"parts[{i}] precisa de 'ref' ou 'tag' (identificador)")

    for i, c in enumerate(data["connections"]):
        if "net" not in c or not c.get("pins"):
            raise ValueError(f"connections[{i}] precisa de 'net' e 'pins'")
        for spec in c["pins"]:
            if "." not in spec:
                raise ValueError(f"connections[{i}]: pino '{spec}' deve ser 'handle.pino'")
            handle = spec.split(".", 1)[0]
            if not any(handle == (p.get("ref") or p.get("tag")) for p in data["parts"]):
                raise ValueError(f"connections[{i}]: handle '{handle}' não existe em 'parts'")
    return data