"""Compare the input JSON connectivity against a KiCad CLI S-expression netlist.

The audit intentionally compares logical pin membership, not physical layout. It
is designed for flat projects where parts have explicit KiCad reference names.
"""
from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class PinConnection:
    ref: str
    pin: str

    def display(self) -> str:
        return f"{self.ref}.{self.pin}"


@dataclass
class AuditResult:
    ok: bool
    expected_nets: int
    actual_nets: int
    errors: list[str]
    warnings: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _extract_balanced(text: str, start: int) -> str | None:
    """Return one balanced S-expression, ignoring parentheses inside strings."""
    if start < 0 or start >= len(text) or text[start] != "(":
        return None
    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return text[start:index + 1]
    return None


def _sexpr_blocks(text: str, pattern: str) -> list[str]:
    blocks: list[str] = []
    for match in re.finditer(pattern, text):
        block = _extract_balanced(text, match.start())
        if block:
            blocks.append(block)
    return blocks


def parse_kicad_netlist(text: str) -> dict[str, frozenset[PinConnection]]:
    """Parse named nets and component pin nodes from KiCad's default S-expression netlist."""
    actual: dict[str, frozenset[PinConnection]] = {}
    # KiCad CLI's default netlist format is kicadsexpr; net blocks begin with a code.
    for block in _sexpr_blocks(text, r"\(net\s+\(code\b"):
        name_match = re.search(r'\(name\s+"((?:\\.|[^"\\])*)"\)', block)
        if not name_match:
            continue
        net_name = bytes(name_match.group(1), "utf-8").decode("unicode_escape")
        nodes: set[PinConnection] = set()
        for node in re.finditer(
            r'\(node\s+\(ref\s+"?([^"\s)]+)"?\)\s+\(pin\s+"?([^"\s)]+)"?\)',
            block,
        ):
            ref, pin = node.groups()
            # Power symbols, flags and graphical symbols are not user components in JSON.
            if ref.startswith("#"):
                continue
            nodes.add(PinConnection(ref=ref, pin=pin))
        actual[net_name] = frozenset(nodes)
    return actual


def expected_connectivity(design: dict[str, Any]) -> dict[str, frozenset[PinConnection]]:
    """Build expected net membership from the JSON's explicit part references."""
    ref_by_handle: dict[str, str] = {}
    missing_refs: list[str] = []
    for index, part in enumerate(design.get("parts", [])):
        ref = part.get("ref")
        tag = part.get("tag")
        handle = ref or tag
        if not handle:
            missing_refs.append(f"parts[{index}] has neither 'ref' nor 'tag'")
            continue
        if not ref:
            # Without an explicit reference, SKiDL assigns one at runtime; this audit
            # deliberately avoids guessing it from the symbol type.
            missing_refs.append(
                f"parts[{index}] ({tag}) has no explicit 'ref'; connectivity audit needs explicit refs"
            )
            continue
        ref_by_handle[handle] = ref

    if missing_refs:
        raise ValueError("Não é possível auditar conectividade sem referências explícitas:\n- " + "\n- ".join(missing_refs))

    expected_sets: dict[str, set[PinConnection]] = {}
    for index, connection in enumerate(design.get("connections", [])):
        net = connection["net"]
        bucket = expected_sets.setdefault(net, set())
        for spec in connection["pins"]:
            handle, separator, pin = spec.partition(".")
            if not separator or handle not in ref_by_handle:
                raise ValueError(f"Referência de pino não resolvida em connections[{index}]: {spec}")
            bucket.add(PinConnection(ref=ref_by_handle[handle], pin=pin))
    return {name: frozenset(pins) for name, pins in expected_sets.items()}


def audit_connectivity(design: dict[str, Any], netlist_text: str) -> AuditResult:
    """Compare expected and actual pin-to-net assignments and report deviations."""
    expected = expected_connectivity(design)
    actual = parse_kicad_netlist(netlist_text)
    errors: list[str] = []
    warnings: list[str] = []

    actual_net_by_pin: dict[PinConnection, str] = {}
    for net_name, pins in actual.items():
        for pin in pins:
            previous = actual_net_by_pin.get(pin)
            if previous and previous != net_name:
                errors.append(
                    f"O pino {pin.display()} aparece em duas redes da netlist: '{previous}' e '{net_name}'."
                )
            else:
                actual_net_by_pin[pin] = net_name

    for net_name, expected_pins in expected.items():
        actual_pins = actual.get(net_name, frozenset())
        missing = sorted((pin.display() for pin in expected_pins if actual_net_by_pin.get(pin) is None))
        wrong_net = sorted(
            f"{pin.display()} foi para '{actual_net_by_pin[pin]}'"
            for pin in expected_pins
            if pin in actual_net_by_pin and actual_net_by_pin[pin] != net_name
        )
        extra = sorted((pin.display() for pin in actual_pins - expected_pins))
        if missing:
            errors.append(f"Rede '{net_name}': pinos esperados ausentes da netlist: {', '.join(missing)}.")
        if wrong_net:
            errors.append(f"Rede '{net_name}': atribuições incorretas: {'; '.join(wrong_net)}.")
        if extra:
            warnings.append(
                f"Rede '{net_name}': pinos de componentes não previstos no JSON: {', '.join(extra)}."
            )
        # Existing node set but unexpected members may mean unintended shorts.
        absent_from_net = sorted(
            pin.display() for pin in expected_pins
            if actual_net_by_pin.get(pin) == net_name and pin not in actual_pins
        )
        if absent_from_net:
            errors.append(f"Rede '{net_name}': inconsistência interna ao ler a netlist: {', '.join(absent_from_net)}.")

    for net_name, actual_pins in actual.items():
        if net_name not in expected and actual_pins:
            warnings.append(
                f"Rede não declarada no JSON '{net_name}' contém: "
                + ", ".join(sorted(pin.display() for pin in actual_pins)) + "."
            )

    # Even if a pin was expected somewhere, detect unexpected component pins that appear
    # in the exported netlist on nets not listed in the JSON.
    expected_all = set().union(*expected.values()) if expected else set()
    for pin, net_name in sorted(actual_net_by_pin.items(), key=lambda item: (item[0].ref, item[0].pin)):
        if pin not in expected_all:
            warnings.append(f"Pino extra na netlist: {pin.display()} está na rede '{net_name}'.")

    return AuditResult(
        ok=not errors,
        expected_nets=len(expected),
        actual_nets=len(actual),
        errors=errors,
        warnings=warnings,
    )


def write_connectivity_audit(
    design: dict[str, Any], netlist_path: str | Path, report_path: str | Path
) -> AuditResult:
    """Write human-readable and machine-readable connectivity audit reports."""
    net_path = Path(netlist_path)
    out_path = Path(report_path)
    if not net_path.is_file():
        raise ValueError(f"Netlist não encontrada para auditoria: {net_path}")
    result = audit_connectivity(design, net_path.read_text(encoding="utf-8"))
    out_path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "KiCad-Text2Sch — Connectivity Audit",
        f"Status: {'PASS' if result.ok else 'FAIL'}",
        f"Expected nets: {result.expected_nets}",
        f"Actual named nets: {result.actual_nets}",
        "",
    ]
    if result.errors:
        lines.append("ERRORS:")
        lines.extend(f"- {message}" for message in result.errors)
        lines.append("")
    if result.warnings:
        lines.append("WARNINGS:")
        lines.extend(f"- {message}" for message in result.warnings)
        lines.append("")
    if not result.errors and not result.warnings:
        lines.append("All component pin-to-net assignments match the JSON.")
    out_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    out_path.with_suffix(".json").write_text(
        json.dumps(result.to_dict(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return result
