"""Constrói o circuito no SKiDL e exporta o esquemático KiCad (6–10)."""
from pathlib import Path
from src.postprocess import polish_schematic

from skidl import (Part, Net, POWER, generate_schematic,
                   set_default_tool, KICAD10)
from src.kicad_cli import export_schematic_netlist, run_schematic_erc


def build_circuit(data):
    set_default_tool(KICAD10)
    nets, handles = {}, {}

    # --- Nets declaradas ---
    for n in data.get("nets", []):
        net = Net(n["name"])
        if n.get("type") == "power":
            net.drive = POWER
            net.do_erc = False      # Evita warning de "net de 1 pino" em nets de power
        if n.get("do_erc") is False:
            net.do_erc = False
        nets[n["name"]] = net

    # --- Parts ---
    # JSON angles map to SKiDL's symtx transform sequence (R=90° CCW, L=90° CW).
    rotation_to_symtx = {0: "", 90: "R", 180: "RR", 270: "L"}
    for p in data.get("parts", []):
        kwargs = {}
        if p.get("value"):     kwargs["value"] = p["value"]
        if p.get("footprint"): kwargs["footprint"] = p["footprint"]
        if p.get("tag"):       kwargs["tag"] = p["tag"]
        
        part = Part(p["lib"], p["name"], **kwargs)
        if p.get("ref"):
            part.ref = p["ref"]
        # Shared JSON orientation hint: these transforms rotate symbol and pin geometry together.
        if p.get("rotation") is not None:
            part.symtx = rotation_to_symtx[p["rotation"]]
        handles[p.get("ref") or p["tag"]] = part

    # --- Connections ---
    for c in data.get("connections", []):
        if c["net"] not in nets:            
            nets[c["net"]] = Net(c["net"])
        net = nets[c["net"]]
        pins = []
        for spec in c["pins"]:
            handle, _, pin = spec.partition(".")
            pins.append(handles[handle][pin])
        net += pins
        
    return nets, handles


def export(data, out_dir, netlist=False, kicad_erc=False, kicad_cli=None):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    meta = data.get("meta", {})
    top, title = meta.get("top_name", "design"), meta.get("title", "KiCad-Text2Sch")

    # MELHORIA: O SKiDL suporta nativamente o parâmetro `filepath`.
    # Isso elimina a necessidade do "hack" de monitorar o diretório com glob/shutil.
    kwargs = dict(
        filepath=str(out_dir),
        top_name=top, 
        title=title, 
        tool=KICAD10,
        auto_stub=True, 
        retries=4, 
        flatness=1.0,
        auto_stub_fanout=3,         # redes com mais de 3 pinos podem virar labels antes do roteamento
        auto_stub_max_wire_pins=3   # limite de pinos para roteamento seletivo após posicionamento
    )

    # Gera o esquemático diretamente na pasta de saída
    generate_schematic(**kwargs)
    
    target = out_dir / f"{top}.kicad_sch"
    if target.exists():
        polish_schematic(target)          # rebrand + badges + campos
        print(f"OK: {target} (polido)")
    else:
        message = f"O arquivo esperado não foi gerado: {target}. Verifique os logs do SKiDL."
        if netlist or kicad_erc:
            raise ValueError(message)
        print(f"AVISO: {message}")

    if target.exists() and netlist:
        # Export from the final polished .kicad_sch rather than from SKiDL's
        # intermediate circuit. This checks the actual schematic connectivity
        # and does not require PCB footprints to be assigned to every part.
        netlist_path = out_dir / f"{top}.net"
        export_schematic_netlist(target, netlist_path, explicit_cli=kicad_cli)
        print(f"OK: Netlist KiCad exportada: {netlist_path}")

    if target.exists() and kicad_erc:
        erc_path = out_dir / f"{top}_erc.rpt"
        run_schematic_erc(target, erc_path, explicit_cli=kicad_cli, output_format="report")
        print(f"OK: Relatório ERC do KiCad: {erc_path}")