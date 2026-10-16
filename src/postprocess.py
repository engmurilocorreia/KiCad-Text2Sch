# -*- coding: utf-8 -*-
"""
src/postprocess.py — polimento cosmético do .kicad_sch gerado pelo SKiDL.
1) Troca o carimbo "Generated with SKiDL" pela nossa marca;
2) Limpa exclude_from_sim=yes (badge cinza + campos acinzentados no KiCad 10);
3) Reposiciona Reference/Value para não sobrepor símbolo/fios.
"""
import re
from pathlib import Path

BRAND = "Generated with KiCad-Text2Sch"


def _instance_blocks(text):
    """Localiza os blocos de instância de símbolo: (symbol (lib_id ...) ...)."""
    blocks, i = [], 0
    while True:
        m = re.compile(r'\(symbol\s+\(lib_id').search(text, i)
        if not m:
            break
        start, depth, j = m.start(), 0, m.start()
        while j < len(text):
            if text[j] == '(':
                depth += 1
            elif text[j] == ')':
                depth -= 1
                if depth == 0:
                    blocks.append((start, j + 1))
                    i = j + 1
                    break
            j += 1
        else:
            break
    return blocks


def _block_meta(block):
    lib = re.search(r'\(lib_id\s+"([^"]+)"', block)
    at = re.search(r'\(at\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\)', block)
    x, y, r = (float(v) for v in at.groups()) if at else (0.0, 0.0, 0)
    return (lib.group(1) if lib else ""), (x, y, r)


def _field_targets(lib_id, x, y, rot):
    """Posições desejadas p/ Reference e Value, segundo o tipo/orientação."""
    if lib_id.startswith("power:GND"):
        return {"Reference": None, "Value": (x, y + 3.81, 0)}   # abaixo do triângulo
    if lib_id.startswith("power:"):
        return {"Reference": None, "Value": (x, y - 3.81, 0)}   # acima da seta
    if rot in (0, 180):                      # peça vertical -> textos à direita
        return {"Reference": (x + 2.54, y - 1.27, 0),
                "Value":     (x + 2.54, y + 1.27, 0)}
    return {"Reference": (x, y - 2.54, 0),   # peça horizontal -> acima/abaixo
            "Value":     (x, y + 2.54, 0)}


def _reposition_fields(block, targets):
    out, current = [], None
    for ln in block.split("\n"):
        s = ln.strip()
        if s.startswith('(property "Reference"'):
            current = "Reference"
        elif s.startswith('(property "Value"'):
            current = "Value"
        elif s.startswith(("(property", "(pin", "(instances", "(uuid")):
            current = None
        if current in targets and targets[current] and s.startswith("(at "):
            px, py, pa = targets[current]
            indent = ln[:len(ln) - len(ln.lstrip())]
            ln = f"{indent}(at {px:.2f} {py:.2f} {pa})"
            current = None
        out.append(ln)
    return "\n".join(out)

def _strip_empty_labels(text):
    """Remove labels/global_labels com texto vazio (artefatos do auto_stub)."""
    for kind in ("label", "global_label"):
        idx = 0
        while True:
            m = re.compile(r'\(' + kind + r'\s+""').search(text, idx)
            if not m:
                break
            start, depth, j = m.start(), 0, m.start()
            while j < len(text):
                if text[j] == '(':
                    depth += 1
                elif text[j] == ')':
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            text = text[:start] + text[j + 1:]
            idx = start
    return text


def polish_schematic(path, brand=BRAND):
    text = Path(path).read_text(encoding="utf-8")

    # 1) Marca no title block
    text = text.replace("Generated with SKiDL.", brand)
    text = text.replace("Generated with SKiDL", brand)

    # 2) Remove o badge cinza de "excluído da simulação"
    text = text.replace("(exclude_from_sim yes)", "(exclude_from_sim no)")

    # 3) Reposiciona campos Reference/Value
    for start, end in reversed(_instance_blocks(text)):
        block = text[start:end]
        lib_id, (x, y, rot) = _block_meta(block)
        text = text[:start] + _reposition_fields(block, _field_targets(lib_id, x, y, int(rot))) + text[end:]

    # 4) Remove labels/global_labels com texto vazio
    _strip_empty_labels(text)

    Path(path).write_text(text, encoding="utf-8")
    return path