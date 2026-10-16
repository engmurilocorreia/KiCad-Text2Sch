"""Constrói o circuito no SKiDL e exporta o esquemático KiCad (6–10)."""
from pathlib import Path
from src.postprocess import polish_schematic

from skidl import (Part, Net, POWER, generate_netlist, generate_schematic,
                   set_default_tool, KICAD10)


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
    for p in data.get("parts", []):
        kwargs = {}
        if p.get("value"):     kwargs["value"] = p["value"]
        if p.get("footprint"): kwargs["footprint"] = p["footprint"]
        if p.get("tag"):       kwargs["tag"] = p["tag"]
        
        part = Part(p["lib"], p["name"], **kwargs)
        if p.get("ref"):
            part.ref = p["ref"]
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


def export(data, out_dir, netlist=False):
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
        auto_stub_fanout=2,         # só stuba nets com >4 pinos
        auto_stub_max_wire_pins=2   # idem p/ roteamento seletivo
    )

    # Gera o esquemático diretamente na pasta de saída
    generate_schematic(**kwargs)
    
    target = out_dir / f"{top}.kicad_sch"
    if target.exists():
        polish_schematic(target)          # rebrand + badges + campos
        print(f"OK: {target} (polido)")
    else:
        print(f"AVISO: {target} não foi gerado. Verifique os logs do SKiDL.")

    if netlist:
        netlist_path = out_dir / f"{top}.net"
        generate_netlist(file_=str(netlist_path), tool=KICAD10)
        print(f"OK: {netlist_path}")