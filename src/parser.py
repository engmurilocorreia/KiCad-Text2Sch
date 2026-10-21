"""Leitura e validação da DSL JSON do KiCad-Text2Sch.

A validação estrutural não depende do SKiDL nem de uma instalação do KiCad,
por isso pode ser usada por editores, CI e futuras interfaces web.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class DesignValidationError(ValueError):
    """Erro de validação do formato de projeto JSON."""


def _non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_design(data: Any) -> dict[str, Any]:
    """Valida a estrutura e as referências internas de um projeto.

    Retorna o próprio objeto quando válido e levanta DesignValidationError com
    mensagens acionáveis quando encontra problemas. A existência real de uma
    biblioteca/símbolo ou de um pino é verificada mais adiante pelo SKiDL.
    """
    errors: list[str] = []

    if not isinstance(data, dict):
        raise DesignValidationError("A raiz do JSON deve ser um objeto.")

    for key in ("parts", "connections"):
        if key not in data:
            errors.append(f"campo obrigatório ausente: '{key}'")

    parts = data.get("parts", [])
    connections = data.get("connections", [])
    nets = data.get("nets", [])
    meta = data.get("meta", {})

    if not isinstance(parts, list):
        errors.append("'parts' deve ser uma lista.")
        parts = []
    if not isinstance(connections, list):
        errors.append("'connections' deve ser uma lista.")
        connections = []
    if not isinstance(nets, list):
        errors.append("'nets' deve ser uma lista quando fornecida.")
        nets = []
    if not isinstance(meta, dict):
        errors.append("'meta' deve ser um objeto quando fornecido.")
        meta = {}

    title = meta.get("title")
    if title is not None and not _non_empty_string(title):
        errors.append("'meta.title' deve ser uma string não vazia quando fornecido.")

    top_name = meta.get("top_name")
    if top_name is not None:
        if not _non_empty_string(top_name):
            errors.append("'meta.top_name' deve ser uma string não vazia.")
        elif top_name in {".", ".."} or "/" in top_name or "\\" in top_name:
            errors.append("'meta.top_name' deve ser um nome de arquivo, sem diretórios.")

    handles: dict[str, int] = {}
    refs: dict[str, int] = {}
    valid_parts: list[dict[str, Any]] = []

    for i, part in enumerate(parts):
        where = f"parts[{i}]"
        if not isinstance(part, dict):
            errors.append(f"{where} deve ser um objeto.")
            continue
        valid_parts.append(part)

        for key in ("lib", "name"):
            if not _non_empty_string(part.get(key)):
                errors.append(f"{where} precisa de '{key}' como string não vazia.")

        for key in ("ref", "tag", "value", "footprint"):
            value = part.get(key)
            if value is not None and not isinstance(value, str):
                errors.append(f"{where}.{key} deve ser uma string quando fornecido.")
        rotation = part.get("rotation")
        if rotation is not None and (type(rotation) is not int or rotation not in {0, 90, 180, 270}):
            errors.append(f"{where}.rotation deve ser 0, 90, 180 ou 270 graus quando fornecido.")
        for key in ("ref", "tag"):
            if key in part and not _non_empty_string(part[key]):
                errors.append(f"{where}.{key} deve ser uma string não vazia quando fornecido.")

        ref = part.get("ref")
        tag = part.get("tag")
        if not _non_empty_string(ref) and not _non_empty_string(tag):
            errors.append(f"{where} precisa de 'ref' ou 'tag' como identificador.")
            continue

        # Mantém a semântica do gerador atual: ref tem prioridade sobre tag.
        handle = ref if _non_empty_string(ref) else tag
        if handle in handles:
            errors.append(
                f"identificador '{handle}' duplicado em parts[{handles[handle]}] e {where}."
            )
        else:
            handles[handle] = i

        if _non_empty_string(ref):
            if ref in refs:
                errors.append(f"referência KiCad '{ref}' duplicada em parts[{refs[ref]}] e {where}.")
            else:
                refs[ref] = i

    net_names: set[str] = set()
    for i, net in enumerate(nets):
        where = f"nets[{i}]"
        if not isinstance(net, dict):
            errors.append(f"{where} deve ser um objeto.")
            continue
        name = net.get("name")
        if not _non_empty_string(name):
            errors.append(f"{where} precisa de 'name' como string não vazia.")
            continue
        if name in net_names:
            errors.append(f"nome de rede '{name}' duplicado em 'nets'.")
        net_names.add(name)
        if "do_erc" in net and not isinstance(net["do_erc"], bool):
            errors.append(f"{where}.do_erc deve ser booleano.")
        if "type" in net and not isinstance(net["type"], str):
            errors.append(f"{where}.type deve ser uma string quando fornecido.")

    # Um pino físico só pode pertencer a uma rede independente no JSON.
    pin_nets: dict[tuple[str, str], str] = {}
    for i, connection in enumerate(connections):
        where = f"connections[{i}]"
        if not isinstance(connection, dict):
            errors.append(f"{where} deve ser um objeto.")
            continue
        net_name = connection.get("net")
        pins = connection.get("pins")
        if not _non_empty_string(net_name):
            errors.append(f"{where}.net precisa ser uma string não vazia.")
        if not isinstance(pins, list) or not pins:
            errors.append(f"{where}.pins deve ser uma lista não vazia.")
            continue

        seen_in_connection: set[str] = set()
        for j, spec in enumerate(pins):
            pin_where = f"{where}.pins[{j}]"
            if not _non_empty_string(spec) or "." not in spec:
                errors.append(f"{pin_where} deve usar o formato 'identificador.pino'.")
                continue
            handle, pin = spec.split(".", 1)
            if not handle or not pin:
                errors.append(f"{pin_where} deve usar o formato 'identificador.pino'.")
                continue
            if handle not in handles:
                errors.append(f"{pin_where} referencia identificador inexistente '{handle}'.")
                continue
            if spec in seen_in_connection:
                errors.append(f"pino '{spec}' repetido em {where}.")
            seen_in_connection.add(spec)

            pin_key = (handle, pin)
            previous_net = pin_nets.get(pin_key)
            if previous_net is not None and previous_net != net_name:
                errors.append(
                    f"pino '{spec}' aparece nas redes '{previous_net}' e '{net_name}'."
                )
            else:
                pin_nets[pin_key] = net_name

    if errors:
        formatted = "\n".join(f"  - {message}" for message in errors)
        raise DesignValidationError(f"Projeto JSON inválido ({len(errors)} problema(s)):\n{formatted}")

    return data


def load_design(path: str | Path) -> dict[str, Any]:
    """Carrega e valida um arquivo JSON de projeto."""
    source = Path(path)
    try:
        raw = source.read_text(encoding="utf-8")
    except OSError as exc:
        raise DesignValidationError(f"Não foi possível ler '{source}': {exc}") from exc

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise DesignValidationError(
            f"JSON inválido em '{source}', linha {exc.lineno}, coluna {exc.colno}: {exc.msg}"
        ) from exc

    return validate_design(data)
