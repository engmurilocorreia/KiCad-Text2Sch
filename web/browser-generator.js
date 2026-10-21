/*
 * KiCad-Text2Sch browser-native generator (alpha).
 * Creates a flat .kicad_sch file in-browser for the catalog's explicitly supported symbols.
 * R/C/L retain the ladder layout heuristic; typed signal nets use shaped global labels,
 * and supported power nets use native KiCad power-symbol instances.
 * No network access, backend, npm package or runtime download is required.
 */
(function attachBrowserGenerator(root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.KiCadText2SchBrowser = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function makeBrowserGenerator(root) {
  "use strict";

  const CATALOG = root && root.KiCadText2SchSymbolCatalog
    ? root.KiCadText2SchSymbolCatalog
    : (typeof require === "function" ? require("./symbol-catalog.js") : null);
  if (!CATALOG || !CATALOG.symbols) throw new Error("O catálogo local de símbolos do KiCad-Text2Sch não foi carregado.");
  const SUPPORTED = new Set(Object.entries(CATALOG.symbols)
    .filter(([, symbol]) => symbol.browserSupported)
    .map(([libId]) => libId));
  const LIB_SYMBOLS = Object.fromEntries(Object.entries(CATALOG.symbols).map(([libId, symbol]) => [libId, symbol.definition]));
  const PART_LIMIT = 100;
  const GENERATOR_VERSION = "0.24.0-alpha";
  const PORT_SHAPES = new Set(["input", "output", "bidirectional", "tri_state", "passive"]);
  const SUPPORTED_NET_TYPES = new Set(["power", "signal", ...PORT_SHAPES]);
  const NATIVE_POWER_SYMBOLS = Object.freeze({ GND: "power:GND", VS: "power:VS" });
  const POWER_DEFINITION_CACHE = new Map();

  function netDefinitions(design) {
    const defs = new Map();
    for (const net of (Array.isArray(design.nets) ? design.nets : [])) {
      const name = String(net && net.name || "").trim();
      if (name) defs.set(name, net);
    }
    for (const group of design.connections) {
      const name = String(group.net || "").trim();
      if (name && !defs.has(name)) defs.set(name, { name });
    }
    return defs;
  }

  function netPresentation(netName, definitions) {
    const definition = definitions.get(netName) || { name: netName };
    const type = String(definition.type || "").trim().toLowerCase();
    if (!type || type === "signal") return { kind: "local" };
    if (type === "power") {
      if (NATIVE_POWER_SYMBOLS[netName]) {
        return { kind: "power", libId: NATIVE_POWER_SYMBOLS[netName], value: netName, polarity: netName === "GND" ? "ground" : "positive" };
      }
      const generated = makeCustomPowerDefinition(netName);
      return { kind: "power", libId: generated.libId, definition: generated.definition, value: netName, polarity: generated.polarity };
    }
    if (PORT_SHAPES.has(type)) return { kind: "port", shape: type };
    throw new Error(`Tipo de rede '${definition.type}' não suportado para '${netName}'. Use power, signal, input, output, bidirectional, tri_state ou passive.`);
  }

  function q(value) {
    return `"${String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n")}"`;
  }

  function slugPowerName(name) {
    const slug = String(name).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 28) || "POWER";
    let hash = 2166136261;
    for (const ch of String(name)) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    return `${slug}_${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function classifyPowerName(name) {
    const upper = String(name).trim().toUpperCase();
    if (/^(GND|AGND|DGND|PGND|GROUND|EARTH|EARTH_PROTECTIVE|EARTH_CLEAN|0V|0)$/.test(upper)) return "ground";
    if (/^(V-|VEE|VSS|VNEG|V_NEG|-[A-Z0-9.+_-]*V?)$/.test(upper) || /^-\d/.test(upper) || /^-V/.test(upper)) return "negative";
    if (/^(V\+|V\+\+|VCC|VDD|VIN|VBUS|VDC|VPP|VAA|VS|\+[A-Z0-9.+_-]*V?)$/.test(upper) || /^\+\d/.test(upper) || /^\+V/.test(upper)) return "positive";
    return "positive";
  }

  function makeCustomPowerDefinition(netName) {
    const polarity = classifyPowerName(netName);
    const suffix = slugPowerName(netName);
    const libId = `KiCadText2Sch:Power_${suffix}`;
    if (POWER_DEFINITION_CACHE.has(libId)) return { ...POWER_DEFINITION_CACHE.get(libId), polarity };
    let glyph;
    let pinAngle;
    if (polarity === "ground") {
      glyph = `(polyline (pts (xy 0 0) (xy 0 -1.27) (xy 1.27 -1.27) (xy 0 -2.54) (xy -1.27 -1.27) (xy 0 -1.27)) (stroke (width 0) (type default)) (fill (type none)))`;
      pinAngle = 270;
    } else if (polarity === "negative") {
      glyph = `(polyline (pts (xy 0 0) (xy 0 -2.54)) (stroke (width 0) (type default)) (fill (type none)))\n        (polyline (pts (xy -0.762 -1.27) (xy 0.762 -1.27) (xy 0 -2.54) (xy -0.762 -1.27)) (stroke (width 0) (type default)) (fill (type outline)))`;
      pinAngle = 270;
    } else {
      glyph = `(polyline (pts (xy 0 0) (xy 0 2.54)) (stroke (width 0) (type default)) (fill (type none)))\n        (polyline (pts (xy 0.762 1.27) (xy -0.762 1.27) (xy 0 2.54) (xy 0.762 1.27)) (stroke (width 0) (type default)) (fill (type outline)))`;
      pinAngle = 90;
    }
    const sub = `Power_${suffix}`;
    const def = `(symbol ${q(libId)}
      (power global)
      (pin_numbers (hide yes))
      (pin_names (offset 0) (hide yes))
      (exclude_from_sim no) (in_bom yes) (on_board yes) (in_pos_files yes)
      (property "Reference" "#PWR" (at 0 -3.81 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Value" ${q(netName)} (at 0 3.556 0) (effects (font (size 1.27 1.27))))
      (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (property "Description" ${q(`KiCad-Text2Sch generated power rail symbol for ${netName}`)} (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
      (symbol ${q(`${sub}_0_1`)} ${glyph})
      (symbol ${q(`${sub}_1_1`)}
        (pin power_in line (at 0 0 ${pinAngle}) (length 0) (hide yes) (name ${q(netName)} (effects (font (size 1.27 1.27)) (hide yes))) (number "1" (effects (font (size 1.27 1.27)))))
      )
      (embedded_fonts no)
    )`;
    const value = { libId, definition: def, polarity };
    POWER_DEFINITION_CACHE.set(libId, value);
    return value;
  }

  function uuid() {
    if (root.crypto && typeof root.crypto.randomUUID === "function") return root.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (root.crypto && typeof root.crypto.getRandomValues === "function") {
      root.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function sanitizeTopName(value) {
    const safe = String(value || "design").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^[._-]+|[._-]+$/g, "");
    return safe.slice(0, 80) || "design";
  }

  function netOrder(design) {
    const declared = Array.isArray(design.nets) ? design.nets : [];
    const byName = new Map(declared.map((net) => [net.name, net]));
    for (const group of design.connections) {
      if (!byName.has(group.net)) byName.set(group.net, { name: group.net });
    }
    const all = Array.from(byName.values());
    const key = (net) => String(net.name).trim();
    const isGround = (name) => /^(GND|AGND|DGND|PGND|GROUND|EARTH|0V|0)$/i.test(name);
    const isSupply = (net) => net.type === "power" || /^(VS|VCC|VDD|VIN|V\+|V-|\+?\d+(?:\.\d+)?V|[-+]V[A-Z]+)$/i.test(key(net));
    const isOutput = (name) => /^(V?OUT|OUTPUT|S_OUT)(?:[_+\-\w]*)$/i.test(name);
    const numbered = (name) => {
      const m = /^N(\d+)$/i.exec(name);
      return m ? Number(m[1]) : null;
    };
    const source = all.filter((net) => !isGround(key(net)) && isSupply(net));
    const internals = all.filter((net) => !isGround(key(net)) && !isSupply(net) && numbered(key(net)) !== null)
      .sort((a, b) => numbered(key(a)) - numbered(key(b)));
    const outputs = all.filter((net) => !isGround(key(net)) && !isSupply(net) && numbered(key(net)) === null && isOutput(key(net)));
    const other = all.filter((net) => !isGround(key(net)) && !isSupply(net) && numbered(key(net)) === null && !isOutput(key(net)));
    const grounds = all.filter((net) => isGround(key(net)));
    return [...source, ...internals, ...other, ...outputs, ...grounds].map(key);
  }

  function validateStructure(design) {
    if (!design || typeof design !== "object" || Array.isArray(design)) throw new Error("A raiz do JSON deve ser um objeto.");
    if (!Array.isArray(design.parts) || !Array.isArray(design.connections)) {
      throw new Error("O projeto precisa conter as listas 'parts' e 'connections'.");
    }
    if (design.parts.length === 0) throw new Error("A lista 'parts' não pode estar vazia.");
    if (design.parts.length > 1000) throw new Error("O limite da validação local é de 1000 componentes.");

    const declaredNetTypes = new Map();
    for (let i = 0; i < (Array.isArray(design.nets) ? design.nets.length : 0); i += 1) {
      const net = design.nets[i];
      if (!net || typeof net !== "object" || !String(net.name || "").trim()) throw new Error(`nets[${i}].name deve ser uma string não vazia.`);
      const name = String(net.name).trim();
      const type = String(net.type || "").trim().toLowerCase();
      if (type && !SUPPORTED_NET_TYPES.has(type)) throw new Error(`Tipo de rede '${net.type}' não suportado para '${name}'.`);
      if (declaredNetTypes.has(name) && declaredNetTypes.get(name) !== type) throw new Error(`A rede '${name}' foi declarada com tipos conflitantes.`);
      declaredNetTypes.set(name, type);
    }

    const handles = new Map();
    const refs = new Set();
    for (let index = 0; index < design.parts.length; index += 1) {
      const part = design.parts[index];
      if (!part || typeof part !== "object") throw new Error(`parts[${index}] deve ser um objeto.`);
      const ref = String(part.ref || part.tag || "").trim();
      const lib = String(part.lib || "").trim();
      const name = String(part.name || "").trim();
      if (!ref || !lib || !name) throw new Error(`parts[${index}] precisa de 'lib', 'name' e 'ref' ou 'tag'.`);
      if (part.rotation !== undefined && (!Number.isInteger(part.rotation) || ![0, 90, 180, 270].includes(part.rotation))) {
        throw new Error(`parts[${index}].rotation deve ser 0, 90, 180 ou 270 graus.`);
      }
      if (handles.has(ref)) throw new Error(`Identificador/referência duplicado: ${ref}.`);
      refs.add(ref);
      const item = { ref };
      handles.set(ref, item);
      if (part.tag) {
        const tag = String(part.tag).trim();
        if (tag !== ref && handles.has(tag)) throw new Error(`Identificador/tag duplicado: ${tag}.`);
        handles.set(tag, item);
      }
    }

    const pinNet = new Map();
    const seenInGroups = new Set();
    const connectedNets = new Set();
    let pinReferences = 0;
    for (let i = 0; i < design.connections.length; i += 1) {
      const connection = design.connections[i];
      if (!connection || typeof connection !== "object" || !String(connection.net || "").trim()) {
        throw new Error(`connections[${i}].net precisa ser uma string não vazia.`);
      }
      if (!Array.isArray(connection.pins) || connection.pins.length === 0) {
        throw new Error(`connections[${i}].pins deve ser uma lista não vazia.`);
      }
      const netName = String(connection.net).trim();
      connectedNets.add(netName);
      const seenThisGroup = new Set();
      for (const rawSpec of connection.pins) {
        const spec = String(rawSpec || "").trim();
        const dot = spec.lastIndexOf(".");
        if (dot <= 0 || dot === spec.length - 1) throw new Error(`Pino '${spec}' inválido; use o formato REF.PINO.`);
        const handle = spec.slice(0, dot);
        const pin = spec.slice(dot + 1);
        if (!handles.has(handle)) throw new Error(`A conexão '${spec}' referencia um componente inexistente.`);
        if (seenThisGroup.has(spec)) throw new Error(`Pino '${spec}' repetido em connections[${i}].`);
        seenThisGroup.add(spec);
        const previous = pinNet.get(spec);
        if (previous && previous !== netName) throw new Error(`Pino '${spec}' aparece nas redes '${previous}' e '${netName}'.`);
        const duplicateKey = `${netName}\u0000${spec}`;
        if (seenInGroups.has(duplicateKey)) throw new Error(`Pino '${spec}' declarado mais de uma vez na rede '${netName}'.`);
        seenInGroups.add(duplicateKey);
        pinNet.set(spec, netName);
        pinReferences += 1;
        void pin;
      }
    }

    const declared = Array.isArray(design.nets) ? design.nets.length : 0;
    return {
      valid: true,
      summary: {
        parts: design.parts.length,
        declared_nets: declared,
        connected_nets: connectedNets.size,
        connection_groups: design.connections.length,
        pin_references: pinReferences
      },
      message: "Validação estrutural local aprovada. A resolução de símbolos/pinos, o ERC e a equivalência elétrica não foram executados."
    };
  }

  function normalizeDesign(design, options = {}) {
    validateStructure(design);
    if (!design || typeof design !== "object" || Array.isArray(design)) throw new Error("A raiz do JSON deve ser um objeto.");
    if (!Array.isArray(design.parts) || design.parts.length === 0) throw new Error("O JSON precisa conter uma lista 'parts' não vazia.");
    if (design.parts.length > PART_LIMIT) throw new Error(`O motor do navegador limita o MVP a ${PART_LIMIT} componentes.`);
    if (!Array.isArray(design.connections) || design.connections.length === 0) throw new Error("O JSON precisa conter uma lista 'connections' não vazia.");

    const customSymbols = options.customSymbols && typeof options.customSymbols === "object" ? options.customSymbols : {};
    const symbolCatalog = { ...CATALOG.symbols, ...customSymbols };
    const supportedSymbols = new Set(Object.entries(symbolCatalog).filter(([, symbol]) => symbol && symbol.browserSupported).map(([libId]) => libId));
    const parts = [];
    const handles = new Map();
    const refs = new Set();
    for (let index = 0; index < design.parts.length; index += 1) {
      const source = design.parts[index];
      if (!source || typeof source !== "object") throw new Error(`parts[${index}] deve ser um objeto.`);
      const ref = String(source.ref || source.tag || "").trim();
      if (!ref) throw new Error(`parts[${index}] precisa ter 'ref' ou 'tag'.`);
      if (refs.has(ref)) throw new Error(`Referência duplicada: ${ref}.`);
      refs.add(ref);
      const libId = `${String(source.lib || "").trim()}:${String(source.name || "").trim()}`;
      if (!supportedSymbols.has(libId)) {
        const supportedList = Array.from(supportedSymbols).sort().join(", ");
        throw new Error(`O motor no navegador ${GENERATOR_VERSION} (catálogo ${CATALOG.schemaVersion}) ainda não suporta '${libId || "símbolo sem nome"}'. Importe um arquivo .kicad_sym compatível ou use um símbolo listado no catálogo. Símbolos suportados nesta sessão: ${supportedList}.`);
      }
      const symbol = symbolCatalog[libId];
      const pinMeta = symbol.pins.map((pin) => ({ ...pin, number: String(pin.number), unit: Number.isInteger(Number(pin.unit)) ? Number(pin.unit) : 1 }));
      const unitIds = Array.isArray(symbol.units) && symbol.units.length
        ? symbol.units.map(Number).filter((unit) => Number.isInteger(unit) && unit > 0).sort((a, b) => a - b)
        : Array.from(new Set(pinMeta.map((pin) => pin.unit).filter((unit) => unit > 0))).sort((a, b) => a - b);
      if (!unitIds.length) unitIds.push(1);
      const unitBounds = symbol.unitBounds || {};
      if (source.rotation !== undefined && pinMeta.length <= 2) {
        throw new Error(`parts[${index}].rotation é suportado nesta versão apenas para símbolos com três ou mais pinos.`);
      }
      const rawNoConnect = source.no_connect ?? source.noConnect ?? [];
      if (!Array.isArray(rawNoConnect)) throw new Error(`parts[${index}].no_connect deve ser uma lista de números/nome de pinos.`);
      const noConnect = new Set(rawNoConnect.map((pin) => String(pin).trim()));
      for (const pinInfo of pinMeta) if (pinInfo.intrinsicNoConnect) noConnect.add(pinInfo.number);
      for (const pin of noConnect) {
        if (!pinMeta.some((pinInfo) => pinInfo.number === pin)) throw new Error(`Pino no_connect '${ref}.${pin}' não existe no catálogo de '${libId}'.`);
      }
      const part = {
        ref,
        tag: source.tag ? String(source.tag).trim() : null,
        libId,
        symbolName: String(source.name).trim(),
        preferredAxis: symbol.preferredAxis || "vertical",
        graphicalBounds: symbol.graphicalBounds || [-2.54, -2.54, 2.54, 2.54],
        value: String(source.value ?? source.name).trim(),
        footprint: String(source.footprint ?? symbol.defaultFootprint ?? "").trim(),
        symbolDefinition: symbol.definition,
        unitIds,
        unitBounds,
        sourceIndex: index,
        pinMeta,
        noConnect,
        netsByPin: new Map(),
        pinUuids: Object.fromEntries(pinMeta.map((pin) => [pin.number, uuid()])),
        instanceUuid: uuid(),
        instanceUuids: Object.fromEntries(unitIds.map((unit) => [unit, uuid()])),
        unitPositions: Object.create(null),
        x: 0,
        y: 0,
        requestedRotation: source.rotation === undefined ? null : source.rotation,
        rotation: source.rotation === undefined ? 0 : source.rotation
      };
      parts.push(part);
      handles.set(ref, part);
      if (part.tag) {
        if (handles.has(part.tag) && handles.get(part.tag) !== part) throw new Error(`Identificador/tag duplicado: ${part.tag}.`);
        handles.set(part.tag, part);
      }
    }

    for (let i = 0; i < design.connections.length; i += 1) {
      const group = design.connections[i];
      if (!group || typeof group !== "object" || !String(group.net || "").trim()) throw new Error(`connections[${i}] não tem um nome de rede válido.`);
      if (!Array.isArray(group.pins) || group.pins.length === 0) throw new Error(`connections[${i}].pins deve ser uma lista não vazia.`);
      const netName = String(group.net).trim();
      for (const specValue of group.pins) {
        const spec = String(specValue || "").trim();
        const dot = spec.lastIndexOf(".");
        if (dot <= 0 || dot === spec.length - 1) throw new Error(`Pino '${spec}' inválido; use o formato REF.NÚMERO.`);
        const handle = spec.slice(0, dot);
        const pin = spec.slice(dot + 1);
        const part = handles.get(handle);
        if (!part) throw new Error(`A conexão '${spec}' referencia um componente inexistente.`);
        if (!part.pinMeta.some((pinInfo) => pinInfo.number === pin)) {
          const validPins = part.pinMeta.map((pinInfo) => pinInfo.number).join(", ");
          throw new Error(`O pino '${spec}' não existe no catálogo de '${part.libId}'. Pinos válidos: ${validPins}.`);
        }
        if (part.noConnect.has(pin)) throw new Error(`O pino '${spec}' está declarado em no_connect e também em uma rede.`);
        if (part.netsByPin.has(pin)) {
          const previous = part.netsByPin.get(pin);
          if (previous !== netName) throw new Error(`O pino '${spec}' aparece nas redes '${previous}' e '${netName}'.`);
          throw new Error(`O pino '${spec}' foi declarado mais de uma vez na rede '${netName}'.`);
        }
        part.netsByPin.set(pin, netName);
      }
    }

    for (const part of parts) {
      for (const pinInfo of part.pinMeta) {
        const pin = pinInfo.number;
        if (!part.netsByPin.has(pin) && !part.noConnect.has(pin)) throw new Error(`O pino '${part.ref}.${pin}' não está conectado a nenhuma rede nem declarado em no_connect.`);
      }
      if (part.pinMeta.length === 2) {
        const [pinA, pinB] = part.pinMeta.map((pinInfo) => pinInfo.number);
        if (part.netsByPin.get(pinA) === part.netsByPin.get(pinB)) {
          throw new Error(`Os dois pinos de '${part.ref}' estão na mesma rede; esta conexão não é suportada pelo layout alpha.`);
        }
      }
    }
    return {
      parts,
      nets: netOrder({ ...design, connections: design.connections }),
      netDefinitions: netDefinitions(design),
      design
    };
  }

  function applyTwoTerminalLayout(model) {
    const ranks = new Map(model.nets.map((net, i) => [net, i]));
    const groups = new Map();
    for (const part of model.parts) {
      const net1 = part.netsByPin.get("1");
      const net2 = part.netsByPin.get("2");
      const a = ranks.get(net1);
      const b = ranks.get(net2);
      if (a === undefined || b === undefined) throw new Error(`Não foi possível determinar a posição das redes de '${part.ref}'.`);
      const low = Math.min(a, b);
      const high = Math.max(a, b);
      const key = `${low}:${high}`;
      if (!groups.has(key)) groups.set(key, { low, high, parts: [] });
      groups.get(key).parts.push({ part, rank1: a, rank2: b });
      // Symbols with a native horizontal pin axis (e.g. D_Small) rotate by 90°
      // so the terminal associated with the earlier net rank is placed above.
      if (part.preferredAxis === "horizontal") {
        part.rotation = a <= b ? 90 : 270;
      } else {
        part.rotation = a <= b ? 0 : 180; // pin 1 at top when its net is above pin 2
      }
    }

    const orderedGroups = Array.from(groups.values()).sort((a, b) => {
      const da = a.high - a.low;
      const db = b.high - b.low;
      if ((da === 1) !== (db === 1)) return da === 1 ? -1 : 1;
      if (a.low !== b.low) return a.low - b.low;
      return a.high - b.high;
    });
    const groundIndex = model.nets.findIndex((net) => /^(GND|AGND|DGND|PGND|GROUND|EARTH|0V|0)$/i.test(net));
    const allNonAdjacentToGround = orderedGroups.every((group) => group.high - group.low === 1 || (groundIndex >= 0 && group.high === groundIndex));
    const routingMode = allNonAdjacentToGround ? "ladder-buses" : "local-labels";
    const spineX = 92;
    const labelX = 55;
    const yStart = 48;
    const yStep = model.nets.length <= 3 ? 30 : 25;

    // Adjacent-net components form the main vertical ladder. Branches to ground
    // are ordered from shorter to longer so long branch leads remain outside the
    // horizontal bus extents of intermediate nodes.
    let branchParallelBase = 0;
    const adjacentMax = orderedGroups.filter((group) => group.high - group.low === 1)
      .reduce((max, group) => Math.max(max, Math.max(0, group.parts.length - 1)), 0);
    branchParallelBase = spineX + (adjacentMax + 1) * 44 + 8;
    const branchGroups = orderedGroups.filter((group) => group.high - group.low > 1)
      .sort((a, b) => (a.high - a.low) - (b.high - b.low) || a.low - b.low);
    const branchX = new Map();
    let cursorX = branchParallelBase;
    for (const group of branchGroups) {
      branchX.set(`${group.low}:${group.high}`, cursorX);
      cursorX += group.parts.length * 36 + 12;
    }

    for (const group of orderedGroups) {
      const key = `${group.low}:${group.high}`;
      const adjacent = group.high - group.low === 1;
      const baseX = adjacent ? spineX : branchX.get(key);
      group.parts.forEach(({ part }, lane) => {
        part.x = baseX + lane * (adjacent ? 44 : 36);
        part.y = yStart + ((group.low + group.high) / 2) * yStep;
      });
    }
    return { ...model, ranks, yStart, yStep, spineX, labelX, routingMode };
  }

  function rotateLocalPoint(x, y, rotation) {
    const angle = Number(rotation || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: x * cos + y * sin, y: x * sin - y * cos };
  }

  function approxTextWidth(text) {
    return Math.max(2.5, String(text || '').length * 0.82 + 1.6);
  }

  function estimatedUnitEnvelope(part, unit, rotation, model) {
    const bounds = part.unitBounds && part.unitBounds[unit]
      ? part.unitBounds[unit]
      : part.graphicalBounds || [-5.08, -5.08, 5.08, 5.08];
    const points = [];
    const add = (x, y, padding = 0) => {
      if (Number.isFinite(x) && Number.isFinite(y)) points.push([x - padding, y - padding, x + padding, y + padding]);
    };
    const corners = [
      [bounds[0], bounds[1]], [bounds[0], bounds[3]],
      [bounds[2], bounds[1]], [bounds[2], bounds[3]]
    ];
    for (const [x, y] of corners) {
      const rotated = rotateLocalPoint(Number(x), Number(y), rotation);
      add(rotated.x, rotated.y, 0.8);
    }

    // Account for visible fields on the first unit only. These are placed using
    // the same side/spacing rule as makePartBlocks(), so the packing envelope
    // predicts where Reference and Value will actually be rendered.
    const firstUnit = part.unitIds[0] || 1;
    if (unit === firstUnit) {
      const radius = Math.max(...bounds.map((value) => Math.abs(Number(value) || 0)));
      const fieldsOnLeft = part.pinMeta.length > 2 && Number(rotation) === 180;
      const fieldX = part.pinMeta.length > 2 ? (fieldsOnLeft ? -1 : 1) * (radius + 5.08) : 5.08;
      const fieldWidth = Math.max(approxTextWidth(part.ref), approxTextWidth(part.value));
      const fieldGap = part.pinMeta.length > 2 ? 1.905 : 1.27;
      const left = fieldsOnLeft ? fieldX - fieldWidth : fieldX;
      const right = fieldsOnLeft ? fieldX : fieldX + fieldWidth;
      points.push([left, -fieldGap - 1.1, right, -fieldGap + 1.1]);
      points.push([left, fieldGap - 1.1, right, fieldGap + 1.1]);
    }

    const pinsForUnit = part.pinMeta.filter((pin) => pin.unit === unit || (pin.unit === 0 && unit === firstUnit));
    for (const pin of pinsForUnit) {
      const rotated = rotateLocalPoint(Number(pin.at[0]), Number(pin.at[1]), rotation);
      add(rotated.x, rotated.y, 0.3);
      if (part.noConnect.has(String(pin.number))) continue;
      const netName = part.netsByPin.get(String(pin.number));
      if (!netName) continue;
      let dx = 0;
      let dy = 0;
      if (Math.abs(rotated.x) > Math.abs(rotated.y)) dx = rotated.x < 0 ? -1 : 1;
      else dy = rotated.y < 0 ? -1 : 1;
      const stubX = rotated.x + dx * 6.35;
      const stubY = rotated.y + dy * 6.35;
      add(stubX, stubY, 0.25);
      const presentation = netPresentation(netName, model.netDefinitions);
      if (presentation.kind === 'power') {
        const textWidth = approxTextWidth(presentation.value || netName);
        add(stubX, stubY + (presentation.polarity === 'ground' || presentation.polarity === 'negative' ? 4.2 : -4.2), Math.max(2.2, textWidth / 2));
        add(stubX, stubY, 3.8);
      } else {
        const labelWidth = approxTextWidth(netName);
        if (dy !== 0) {
          const horizontalDirection = dy < 0 ? -1 : 1;
          const labelX = stubX + horizontalDirection * 8.89;
          add(stubX, stubY, 0.25);
          add(labelX + horizontalDirection * labelWidth / 2, stubY, labelWidth / 2);
        } else {
          add(stubX + (dx < 0 ? -labelWidth / 2 : labelWidth / 2), stubY, labelWidth / 2);
        }
      }
    }

    const minX = Math.min(...points.map((p) => p[0]));
    const minY = Math.min(...points.map((p) => p[1]));
    const maxX = Math.max(...points.map((p) => p[2]));
    const maxY = Math.max(...points.map((p) => p[3]));
    const padding = 2.2;
    return { minX: minX - padding, minY: minY - padding, maxX: maxX + padding, maxY: maxY + padding,
      width: maxX - minX + 2 * padding, height: maxY - minY + 2 * padding };
  }

  function envelopeFitsA4(model, placements = null) {
    const safe = { left: 15, right: 282, top: 21, bottom: 166 };
    const placed = placements || model.parts.flatMap((part) => part.unitIds.map((unit) => {
      const position = part.unitPositions[unit] || { x: part.x, y: part.y, page: 0, rotation: part.rotation || 0 };
      const envelope = estimatedUnitEnvelope(part, unit, position.rotation, model);
      return { part, unit, position, envelope };
    }));
    for (const item of placed) {
      const { position, envelope } = item;
      if (position.x + envelope.minX < safe.left || position.x + envelope.maxX > safe.right ||
          position.y + envelope.minY < safe.top || position.y + envelope.maxY > safe.bottom) return false;
    }
    return true;
  }

  function orderPartsByConnectivity(model) {
    const sourceOrder = new Map(model.parts.map((part, index) => [part.ref, index]));
    const adjacency = new Map(model.parts.map((part) => [part.ref, new Map()]));
    const refsByNet = new Map();
    for (const part of model.parts) {
      for (const netName of new Set(part.netsByPin.values())) {
        if (!refsByNet.has(netName)) refsByNet.set(netName, new Set());
        refsByNet.get(netName).add(part.ref);
      }
    }
    for (const refsSet of refsByNet.values()) {
      const refs = Array.from(refsSet);
      if (refs.length < 2) continue;
      const weight = 1 / Math.max(1, refs.length - 1);
      for (let i = 0; i < refs.length; i += 1) {
        for (let j = i + 1; j < refs.length; j += 1) {
          const a = adjacency.get(refs[i]);
          const b = adjacency.get(refs[j]);
          a.set(refs[j], (a.get(refs[j]) || 0) + weight);
          b.set(refs[i], (b.get(refs[i]) || 0) + weight);
        }
      }
    }
    const degree = (ref) => Array.from(adjacency.get(ref).values()).reduce((sum, value) => sum + value, 0);
    const ordered = [];
    const visited = new Set();
    // Keep the user's/AI's first part as the starting point, then use a weighted
    // breadth-first traversal so electrically adjacent components remain close.
    // Disconnected subcircuits start with the highest-connectivity remaining part.
    while (visited.size < model.parts.length) {
      let seed = model.parts.find((part) => !visited.has(part.ref));
      if (ordered.length) {
        seed = model.parts.filter((part) => !visited.has(part.ref))
          .sort((a, b) => degree(b.ref) - degree(a.ref) || sourceOrder.get(a.ref) - sourceOrder.get(b.ref))[0];
      }
      if (!seed) break;
      const queue = [seed.ref];
      visited.add(seed.ref);
      while (queue.length) {
        const current = queue.shift();
        const part = model.parts.find((candidate) => candidate.ref === current);
        if (part) ordered.push(part);
        const neighbours = Array.from(adjacency.get(current).entries())
          .filter(([ref]) => !visited.has(ref))
          .sort((a, b) => b[1] - a[1] || sourceOrder.get(a[0]) - sourceOrder.get(b[0]));
        for (const [ref] of neighbours) {
          if (visited.has(ref)) continue;
          visited.add(ref);
          queue.push(ref);
        }
      }
    }
    return ordered;
  }

  function applyGenericLayout(model) {
    // A4 packing is topology-aware and tries progressively tighter gaps before
    // accepting multiple pages. Each visual unit has an envelope covering its
    // graphics, reference/value fields, pin stubs and labels/power-symbol space.
    const safe = { left: 15, right: 282, top: 21, bottom: 166 };
    const contentWidth = safe.right - safe.left;
    const contentHeight = safe.bottom - safe.top;
    const MAX_CHILD_SHEETS = 9;
    const profiles = [
      { name: 'comfortable', gapX: 7, gapY: 8 },
      { name: 'compact', gapX: 5, gapY: 6 },
      { name: 'dense', gapX: 3.5, gapY: 4 },
      { name: 'very-compact', gapX: 2.2, gapY: 2.8 }
    ];
    const orderedParts = orderPartsByConnectivity(model);
    const groupedUnits = [];

    for (const part of orderedParts) {
      const group = [];
      const firstUnit = part.unitIds[0] || 1;
      for (const unit of part.unitIds) {
        let rotation = part.requestedRotation === null ? 0 : part.requestedRotation;
        let envelope = estimatedUnitEnvelope(part, unit, rotation, model);
        if ((envelope.width > contentWidth || envelope.height > contentHeight) && part.requestedRotation === null) {
          const alternatives = [90, 270, 180].map((candidate) => ({
            rotation: candidate,
            envelope: estimatedUnitEnvelope(part, unit, candidate, model)
          })).filter((candidate) => candidate.envelope.width <= contentWidth && candidate.envelope.height <= contentHeight);
          if (alternatives.length) {
            alternatives.sort((a, b) => (a.envelope.width * a.envelope.height) - (b.envelope.width * b.envelope.height));
            rotation = alternatives[0].rotation;
            envelope = alternatives[0].envelope;
          }
        }
        if (envelope.width > contentWidth || envelope.height > contentHeight) {
          throw new Error(`O componente '${part.ref}' (unidade gráfica ${unit}) é maior que a área útil A4. Reduza os campos, use uma definição de símbolo menor ou divida o projeto manualmente.`);
        }
        group.push({ part, unit, envelope, rotation, firstUnit });
      }
      groupedUnits.push(group);
    }

    function blankState(page) {
      return { page, cursorX: safe.left, cursorY: safe.top, rowHeight: 0, positions: [] };
    }
    function cloneState(state) {
      return { page: state.page, cursorX: state.cursorX, cursorY: state.cursorY, rowHeight: state.rowHeight, positions: [...state.positions] };
    }
    function placeOne(state, item, gapX, gapY) {
      let { cursorX, cursorY, rowHeight, page } = state;
      const { envelope } = item;
      if (cursorX > safe.left && cursorX + envelope.width > safe.right) {
        cursorX = safe.left;
        cursorY += rowHeight + gapY;
        rowHeight = 0;
      }
      if (cursorY + envelope.height > safe.bottom) {
        page += 1;
        cursorX = safe.left;
        cursorY = safe.top;
        rowHeight = 0;
      }
      const x = cursorX - envelope.minX;
      const y = cursorY - envelope.minY;
      const position = { item, x, y, page };
      return {
        page,
        cursorX: cursorX + envelope.width + gapX,
        cursorY,
        rowHeight: Math.max(rowHeight, envelope.height),
        positions: [...state.positions, position]
      };
    }
    function simulateProfile(gapX, gapY) {
      let state = blankState(0);
      for (const group of groupedUnits) {
        const before = cloneState(state);
        let trial = cloneState(state);
        for (const item of group) trial = placeOne(trial, item, gapX, gapY);
        const groupPages = new Set(trial.positions.slice(before.positions.length).map((entry) => entry.page));
        if (groupPages.size > 1 && before.positions.length > 0) {
          // Prefer keeping every unit of a multi-unit package together. If the
          // group fits on a fresh page, move it rather than splitting it.
          let fresh = blankState(before.page + 1);
          const freshStart = fresh.positions.length;
          for (const item of group) fresh = placeOne(fresh, item, gapX, gapY);
          const freshPages = new Set(fresh.positions.slice(freshStart).map((entry) => entry.page));
          if (freshPages.size === 1) {
            state = { ...fresh, positions: [...before.positions, ...fresh.positions] };
            continue;
          }
        }
        state = trial;
      }
      const pageCount = state.positions.reduce((max, item) => Math.max(max, item.page + 1), 1);
      return { ...state, pageCount, gapX, gapY };
    }

    const candidates = profiles.map((profile) => ({ ...simulateProfile(profile.gapX, profile.gapY), profile: profile.name }));
    // First choice: a one-sheet solution with the most whitespace. If none fits,
    // minimize page count and only then choose the looser spacing profile.
    const oneSheet = candidates.find((candidate) => candidate.pageCount === 1);
    const layout = oneSheet || candidates
      .filter((candidate) => candidate.pageCount <= MAX_CHILD_SHEETS)
      .sort((a, b) => a.pageCount - b.pageCount || profiles.findIndex((profile) => profile.name === a.profile) - profiles.findIndex((profile) => profile.name === b.profile))[0];
    if (!layout || layout.pageCount > MAX_CHILD_SHEETS) {
      throw new Error(`O layout automático exige mais de ${MAX_CHILD_SHEETS} folhas A4 de circuito. Divida o circuito em blocos menores ou reduza os campos e símbolos.`);
    }
    if (model.design.meta && model.design.meta.auto_split_sheets === false && layout.pageCount > 1) {
      throw new Error(`O layout calculou que o circuito precisa de pelo menos ${layout.pageCount} folhas A4 mesmo após compactação automática. Ative meta.auto_split_sheets=true para exportar um projeto hierárquico ou divida o JSON manualmente.`);
    }

    // Store the chosen per-unit geometry and keep reference designators grouped
    // according to the connectivity-aware order used by the packer.
    for (const entry of layout.positions) {
      const { part, unit, rotation } = entry.item;
      part.unitPositions[unit] = { x: entry.x, y: entry.y, page: entry.page, rotation };
    }
    for (const part of model.parts) {
      const firstUnit = part.unitIds[0] || 1;
      const position = part.unitPositions[firstUnit] || { x: 148.5, y: 95, page: 0, rotation: 0 };
      part.x = position.x;
      part.y = position.y;
      part.rotation = position.rotation;
    }

    const routingMode = layout.pageCount > 1 ? 'pin-labels-multisheet' : 'pin-labels';
    const placements = layout.positions.map(({ item, x, y, page }) => ({
      ref: item.part.ref, unit: item.unit, page,
      x: Number(x.toFixed(3)), y: Number(y.toFixed(3)),
      bounds: [item.envelope.minX, item.envelope.minY, item.envelope.maxX, item.envelope.maxY].map((value) => Number(value.toFixed(3)))
    }));
    return {
      ...model,
      routingMode,
      yStart: 38,
      yStep: 38,
      spineX: null,
      labelX: null,
      pageCount: layout.pageCount,
      visualUnitCount: groupedUnits.reduce((sum, group) => sum + group.length, 0),
      pageCapacity: null,
      layoutMode: 'a4-topology-pack',
      layoutProfile: layout.profile,
      layoutGaps: { x: layout.gapX, y: layout.gapY },
      layoutOrder: orderedParts.map((part) => part.ref),
      layoutSafeBounds: safe,
      layoutPlacements: placements,
      layoutWarnings: layout.profile === 'very-compact' ? ['A compactação mais densa foi necessária para manter o número de folhas reduzido. Confira visualmente as labels e fios.'] : []
    };
  }

  function applyLayout(model) {
    const supportsLadderLayout = model.parts.every((part) =>
      part.unitIds.length === 1 && part.pinMeta.length === 2 &&
      part.pinMeta.some((pin) => pin.number === "1") &&
      part.pinMeta.some((pin) => pin.number === "2")
    ) && model.parts.length <= 8 && model.nets.length <= 6;
    if (supportsLadderLayout) {
      const ladder = applyTwoTerminalLayout(model);
      const busYMin = ladder.yStart;
      const busYMax = ladder.yStart + (ladder.nets.length - 1) * ladder.yStep;
      if (busYMin >= 21 && busYMax <= 166 && envelopeFitsA4(ladder)) return ladder;
    }
    return applyGenericLayout(model);
  }

  function effectivePinUnit(part, pinInfo) {
    return pinInfo.unit > 0 ? pinInfo.unit : (part.unitIds[0] || 1);
  }

  function pointForPin(part, pinNumber) {
    const pinInfo = part.pinMeta.find((pin) => pin.number === String(pinNumber));
    if (!pinInfo) throw new Error(`Metadados do pino '${part.ref}.${pinNumber}' não existem no catálogo.`);
    const unit = effectivePinUnit(part, pinInfo);
    const position = part.unitPositions[unit] || { x: part.x, y: part.y, rotation: part.rotation || 0, page: 0 };
    const localX = Number(pinInfo.at[0]);
    const localY = Number(pinInfo.at[1]);
    const rotation = Number(position.rotation ?? part.rotation ?? 0);
    const angle = rotation * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const pinX = position.x + localX * cos + localY * sin;
    const pinY = position.y + localX * sin - localY * cos;
    return { pinX, pinY, isTop: pinY < position.y, pin: pinInfo, unit, page: position.page || 0, centerX: position.x, centerY: position.y, rotation };
  }


  function fmt(num) {
    return Number(num.toFixed(4)).toString();
  }

  function font(size = 1.27) {
    return `(font (size ${fmt(size)} ${fmt(size)}))`;
  }

  function propertyBlock(name, value, x, y, options = {}) {
    const size = options.size || 1.27;
    const hide = options.hide ? " (hide yes)" : "";
    const justify = options.justify ? ` (justify ${options.justify})` : "";
    const angle = options.angle ?? 0;
    return `(property ${q(name)} ${q(value)} (at ${fmt(x)} ${fmt(y)} ${fmt(angle)}) (effects ${font(size)}${justify}${hide}))`;
  }

  function makeWireSegment(x1, y1, x2, y2) {
    if (Math.abs(x1 - x2) < 1e-4 && Math.abs(y1 - y2) < 1e-4) return "";
    return `(wire (pts (xy ${fmt(x1)} ${fmt(y1)}) (xy ${fmt(x2)} ${fmt(y2)})) (stroke (width 0) (type default)) (uuid ${q(uuid())}))`;
  }

  function makeLabel(netName, x, y, horizontalJustify = "left", presentation = { kind: "local" }) {
    const side = horizontalJustify === "right" ? "right" : "left";
    if (presentation.kind === "port") {
      // Follow KiCad's native global-label serialization, including its hidden
      // inter-sheet-reference property. Shape is visual only; it is not ERC pin typing.
      const angle = side === "right" ? 180 : 0;
      const labelUuid = uuid();
      const intersheetX = x + (side === "right" ? -6.25 : 6.25);
      return `(global_label ${q(netName)} (shape ${presentation.shape}) (at ${fmt(x)} ${fmt(y)} ${angle}) (fields_autoplaced) (effects ${font(1.27)} (justify ${side})) (uuid ${q(labelUuid)}) (property "Intersheetrefs" "${'${INTERSHEET_REFS}'}" (at ${fmt(intersheetX)} ${fmt(y)} 0) (effects ${font(1.27)} (justify ${side}) (hide yes))))`;
    }
    // Local labels remain simple text labels; use KiCad's conventional local-label alignment.
    const justify = side === "right" ? "right bottom" : "left bottom";
    return `(label ${q(netName)} (at ${fmt(x)} ${fmt(y)} 0) (effects ${font(1.27)} (justify ${justify})) (uuid ${q(uuid())}))`;
  }

  function makePowerSymbolBlock(libId, value, polarity, x, y, rootUuid, projectName, sequence, symbolPath = null) {
    const isGround = polarity === "ground";
    const isNegative = polarity === "negative";
    const ref = `#PWR${String(sequence).padStart(3, "0")}`;
    const valueY = y + (isGround ? 5.08 : isNegative ? 3.556 : -3.556);
    const pinUuid = uuid();
    return `(symbol
    (lib_id ${q(libId)})
    (at ${fmt(x)} ${fmt(y)} 0)
    (unit 1)
    (exclude_from_sim no)
    (in_bom no)
    (on_board yes)
    (dnp no)
    (fields_autoplaced no)
    (uuid ${q(uuid())})
    ${propertyBlock("Reference", ref, x, y - 1.27, { hide: true })}
    ${propertyBlock("Value", value, x, valueY)}
    ${propertyBlock("Footprint", "", x, y, { hide: true })}
    ${propertyBlock("Datasheet", "", x, y, { hide: true })}
    ${propertyBlock("Description", "", x, y, { hide: true })}
    (pin "1" (uuid ${q(pinUuid)}))
    (instances (project ${q(projectName)} (path ${q(symbolPath || `/${rootUuid}`)} (reference ${q(ref)}) (unit 1))))
  )`;
  }

  function makeNoConnect(x, y) {
    return `(no_connect (at ${fmt(x)} ${fmt(y)}) (uuid ${q(uuid())}))`;
  }

  function makeJunction(x, y) {
    return `(junction (at ${fmt(x)} ${fmt(y)}) (diameter 1.016) (color 0 0 0 0) (uuid ${q(uuid())}))`;
  }

  function makePartBlocks(part, rootUuid, projectName, symbolPath = null) {
    const firstUnit = part.unitIds[0] || 1;
    const blocks = [];
    for (const unit of part.unitIds) {
      const position = part.unitPositions[unit] || { x: part.x, y: part.y, page: 0, rotation: part.rotation || 0 };
      const unitPath = typeof symbolPath === "function" ? symbolPath(position.page || 0) : (symbolPath || `/${rootUuid}`);
      const x = position.x;
      const y = position.y;
      const rotation = position.rotation ?? part.rotation ?? 0;
      const bounds = part.unitBounds && part.unitBounds[unit] ? part.unitBounds[unit] : part.graphicalBounds || [-5.08, -5.08, 5.08, 5.08];
      const radius = Math.max(...bounds.map((value) => Math.abs(Number(value) || 0)));
      const fieldsOnLeft = part.pinMeta.length > 2 && rotation === 180;
      const fieldX = part.pinMeta.length > 2 ? x + (fieldsOnLeft ? -(radius + 5.08) : radius + 5.08) : x + 5.08;
      const fieldJustify = fieldsOnLeft ? "right" : "left";
      const fieldGap = part.pinMeta.length > 2 ? 1.905 : 1.27;
      const visibleFields = unit === firstUnit;
      const referenceValue = propertyBlock("Reference", part.ref, fieldX, y - fieldGap, { justify: fieldJustify, hide: !visibleFields });
      const valueValue = propertyBlock("Value", part.value, fieldX, y + fieldGap, { justify: fieldJustify, hide: !visibleFields });
      const footprint = propertyBlock("Footprint", part.footprint, x, y, { hide: true });
      const datasheet = propertyBlock("Datasheet", "", x, y, { hide: true });
      const description = propertyBlock("Description", part.description || "", x, y, { hide: true });
      const pinsForThisUnit = part.pinMeta.filter((pin) => pin.unit === unit || (pin.unit === 0 && unit === firstUnit));
      const pinIds = pinsForThisUnit.map((pin) => `(pin ${q(pin.number)} (uuid ${q(part.pinUuids[pin.number])}))`).join("\n    ");
      blocks.push({ page: position.page || 0, content: `(symbol
    (lib_id ${q(part.libId)})
    (at ${fmt(x)} ${fmt(y)} ${rotation})
    (unit ${unit})
    (exclude_from_sim no)
    (in_bom yes)
    (on_board yes)
    (dnp no)
    (fields_autoplaced no)
    (uuid ${q(part.instanceUuids[unit] || part.instanceUuid)})
    ${referenceValue}
    ${valueValue}
    ${footprint}
    ${datasheet}
    ${description}
    ${pinIds}
    (instances (project ${q(projectName)} (path ${q(unitPath)} (reference ${q(part.ref)}) (unit ${unit}))))
  )` });
    }
    return blocks;
  }

  function makeSheetBlock(name, filename, x, y, rootUuid, projectName, pageNumber, sheetUuid) {
    const width = 48;
    const height = 25;
    return `(sheet
    (at ${fmt(x)} ${fmt(y)})
    (size ${fmt(width)} ${fmt(height)})
    (fields_autoplaced yes)
    (stroke (width 0.1524) (type solid))
    (fill (color 0 0 0 0))
    (uuid ${q(sheetUuid)})
    (property "Sheetname" ${q(name)} (at ${fmt(x)} ${fmt(y - 0.7)} 0) (effects ${font(1.27)} (justify left bottom)))
    (property "Sheetfile" ${q(filename)} (at ${fmt(x)} ${fmt(y + height + 0.7)} 0) (effects ${font(1.27)} (justify left top)))
    (instances (project ${q(projectName)} (path ${q(`/${rootUuid}`)} (page ${q(String(pageNumber))}))))
  )`;
  }

  function generate(design, options = {}) {
    const customSymbols = options.customSymbols && typeof options.customSymbols === "object" ? options.customSymbols : {};
    const normalized = normalizeDesign(design, options);
    const model = applyLayout(normalized);
    const rootUuid = uuid();
    const topName = sanitizeTopName(design.meta && design.meta.top_name);
    const projectName = topName;
    const date = options.date || new Date().toISOString().slice(0, 10);
    const title = String((design.meta && design.meta.title) || "KiCad-Text2Sch — browser alpha");
    const componentPageCount = model.pageCount || 1;
    const useHierarchy = componentPageCount > 1;
    const sheetUuids = useHierarchy ? Array.from({ length: componentPageCount }, () => uuid()) : [rootUuid];
    const fileNames = useHierarchy
      ? sheetUuids.map((_, index) => `${topName}_sheet_${String(index + 2).padStart(2, "0")}.kicad_sch`)
      : [`${topName}_browser.kicad_sch`];

    const netPresentations = new Map(model.nets.map((name) => [name, netPresentation(name, model.netDefinitions)]));
    const usedLibs = new Set(model.parts.map((part) => part.libId));
    const generatedPowerDefinitions = new Map();
    for (const presentation of netPresentations.values()) {
      if (presentation.kind === "power") {
        usedLibs.add(presentation.libId);
        if (presentation.definition) generatedPowerDefinitions.set(presentation.libId, presentation.definition);
      }
    }
    const importedDefinitions = Object.fromEntries(Object.entries(customSymbols).map(([libId, symbol]) => [libId, symbol.definition]));
    const allLibrarySymbols = { ...LIB_SYMBOLS, ...importedDefinitions, ...Object.fromEntries(generatedPowerDefinitions) };
    const libSymbols = Array.from(usedLibs).sort().map((libId) => {
      const definition = allLibrarySymbols[libId];
      if (!definition) throw new Error(`A definição incorporada do símbolo '${libId}' não está disponível. Reimporte o arquivo .kicad_sym e tente novamente.`);
      return definition;
    }).join("\n");

    const pageData = Array.from({ length: componentPageCount }, () => ({ wires: [], labels: [], noConnects: [], powers: [], junctions: [], symbols: [], usedLabels: 0, usedPowerSymbols: 0 }));
    let powerSymbolSequence = 0;
    const junctionKeys = new Set();
    const pinCountByNet = new Map();
    const pinsAtSpineByNet = new Map();
    const maxXByNet = new Map(model.nets.map((net) => [net, model.spineX || 0]));

    function pagePresentation(netName) {
      const base = netPresentations.get(netName) || { kind: "local" };
      if (!useHierarchy || base.kind === "power" || base.kind === "port") return base;
      // Global labels connect same-named nets across the generated child sheets.
      const definition = model.netDefinitions.get(netName) || {};
      const type = String(definition.type || "").toLowerCase();
      const shape = PORT_SHAPES.has(type) ? type : "passive";
      return { kind: "port", shape };
    }

    for (const part of model.parts) {
      for (const pinInfo of part.pinMeta) {
        const pin = pinInfo.number;
        const p = pointForPin(part, pin);
        const target = pageData[p.page] || pageData[0];
        if (part.noConnect.has(pin)) {
          if (pinInfo.emitNoConnectMarker !== false) target.noConnects.push(makeNoConnect(p.pinX, p.pinY));
          continue;
        }
        const netName = part.netsByPin.get(pin);
        if (!netName) throw new Error(`Pino '${part.ref}.${pin}' ficou sem rede depois da validação.`);
        pinCountByNet.set(netName, (pinCountByNet.get(netName) || 0) + 1);
        maxXByNet.set(netName, Math.max(maxXByNet.get(netName) || model.spineX || 0, p.pinX));

        if (model.routingMode.startsWith("pin-labels")) {
          const stubLength = 6.35;
          let dx = 0;
          let dy = 0;
          const deltaX = p.pinX - p.centerX;
          const deltaY = p.pinY - p.centerY;
          if (Math.abs(deltaX) > Math.abs(deltaY)) dx = deltaX < 0 ? -1 : 1;
          else dy = deltaY < 0 ? -1 : 1;
          const stubX = p.pinX + dx * stubLength;
          const stubY = p.pinY + dy * stubLength;
          target.wires.push(makeWireSegment(p.pinX, p.pinY, stubX, stubY));
          const presentation = pagePresentation(netName);
          if (presentation.kind === "power") {
            const symbolPath = useHierarchy ? `/${rootUuid}/${sheetUuids[p.page]}` : `/${rootUuid}`;
            target.powers.push(makePowerSymbolBlock(presentation.libId, presentation.value || netName, presentation.polarity || "positive", stubX, stubY, rootUuid, projectName, ++powerSymbolSequence, symbolPath));
            target.usedPowerSymbols += 1;
          } else if (dy !== 0) {
            const horizontalDirection = dy < 0 ? -1 : 1;
            const labelX = stubX + horizontalDirection * 8.89;
            target.wires.push(makeWireSegment(stubX, stubY, labelX, stubY));
            target.labels.push(makeLabel(netName, labelX, stubY, horizontalDirection < 0 ? "right" : "left", presentation));
            target.usedLabels += 1;
          } else {
            target.labels.push(makeLabel(netName, stubX, stubY, dx < 0 ? "right" : "left", presentation));
            target.usedLabels += 1;
          }
          continue;
        }

        const netRank = model.ranks.get(netName);
        const netY = model.yStart + netRank * model.yStep;
        const isSpine = Math.abs(part.x - model.spineX) < 1e-4;
        if (isSpine) pinsAtSpineByNet.set(netName, (pinsAtSpineByNet.get(netName) || 0) + 1);
        if (model.routingMode === "ladder-buses") {
          target.wires.push(makeWireSegment(p.pinX, p.pinY, p.pinX, netY));
          if (!isSpine) {
            const junctionKey = `${p.page}:${part.x}:${netY}`;
            if (!junctionKeys.has(junctionKey)) {
              junctionKeys.add(junctionKey);
              target.junctions.push(makeJunction(part.x, netY));
            }
          }
        } else {
          const labelY = p.centerY + (p.isTop ? -7.62 : 7.62);
          target.wires.push(makeWireSegment(p.pinX, p.pinY, p.pinX, labelY));
          const presentation = pagePresentation(netName);
          if (presentation.kind === "power") {
            const symbolPath = useHierarchy ? `/${rootUuid}/${sheetUuids[p.page]}` : `/${rootUuid}`;
            target.powers.push(makePowerSymbolBlock(presentation.libId, presentation.value || netName, presentation.polarity || "positive", p.pinX, labelY, rootUuid, projectName, ++powerSymbolSequence, symbolPath));
            target.usedPowerSymbols += 1;
          } else {
            target.labels.push(makeLabel(netName, p.pinX, labelY, "left", presentation));
            target.usedLabels += 1;
          }
        }
      }
    }

    if (model.routingMode === "ladder-buses") {
      const target = pageData[0];
      for (const netName of model.nets) {
        const y = model.yStart + model.ranks.get(netName) * model.yStep;
        const maxX = maxXByNet.get(netName) || model.spineX;
        target.wires.push(makeWireSegment(model.labelX, y, maxX, y));
        const presentation = netPresentations.get(netName) || { kind: "local" };
        if (presentation.kind === "power") {
          target.powers.push(makePowerSymbolBlock(presentation.libId, presentation.value || netName, presentation.polarity || "positive", model.labelX, y, rootUuid, projectName, ++powerSymbolSequence));
          target.usedPowerSymbols += 1;
        } else {
          target.labels.push(makeLabel(netName, model.labelX, y, "left", presentation));
          target.usedLabels += 1;
        }
        const spineKey = `${model.spineX}:${y}`;
        if ((pinsAtSpineByNet.get(netName) || 0) >= 2 && !junctionKeys.has(spineKey)) {
          junctionKeys.add(spineKey);
          target.junctions.push(makeJunction(model.spineX, y));
        }
      }
    }

    for (const part of model.parts) {
      const blocks = makePartBlocks(part, rootUuid, projectName, useHierarchy
        ? (pageIndex) => `/${rootUuid}/${sheetUuids[pageIndex]}`
        : `/${rootUuid}`);
      for (const block of blocks) (pageData[block.page] || pageData[0]).symbols.push(block.content);
    }

    function schematicText({ uuidValue, pageNumber, pageIndex = null, sheetUuid = null, root = false }) {
      if (root) {
        const positions = [ [42, 40], [135, 40], [228, 40], [42, 95], [135, 95], [228, 95], [42, 150], [135, 150], [228, 150] ];
        const sheets = fileNames.map((fileName, index) => {
          const pos = positions[index];
          return makeSheetBlock(`Circuit sheet ${index + 1}`, fileName, pos[0], pos[1], rootUuid, projectName, index + 2, sheetUuids[index]);
        }).join("\n");
        return `(kicad_sch
  (version 20250114)
  (generator "kicad-text2sch-browser")
  (generator_version ${q(GENERATOR_VERSION)})
  (uuid ${q(rootUuid)})
  (paper "A4")
  (title_block (title ${q(title)}) (date ${q(date)}) (company "") (rev "") (comment 1 "KiCad-Text2Sch multi-sheet project overview"))
  (lib_symbols)
${sheets}
  (sheet_instances (path "/" (page "1")))
)
`;
      }
      const target = pageData[pageIndex];
      const childPath = useHierarchy ? `/${rootUuid}/${sheetUuid}` : `/${rootUuid}`;
      const displayedTitle = useHierarchy ? `${title} — Circuit sheet ${pageIndex + 1}` : title;
      const sheetInstancePath = useHierarchy ? childPath : "/";
      return `(kicad_sch
  (version 20250114)
  (generator "kicad-text2sch-browser")
  (generator_version ${q(GENERATOR_VERSION)})
  (uuid ${q(sheetUuid)})
  (paper "A4")
  (title_block (title ${q(displayedTitle)}) (date ${q(date)}) (company "") (rev "") (comment 1 ${q(useHierarchy ? `Generated child sheet ${pageIndex + 1} of ${componentPageCount}` : "Generated by KiCad-Text2Sch browser engine (alpha)")}))
  (lib_symbols
${libSymbols.split("\n").map((line) => `    ${line}`).join("\n")}
  )
${target.wires.filter(Boolean).map((line) => `  ${line}`).join("\n")}
${target.labels.map((line) => `  ${line}`).join("\n")}
${target.noConnects.map((line) => `  ${line}`).join("\n")}
${target.junctions.map((line) => `  ${line}`).join("\n")}
${target.powers.map((line) => `  ${line}`).join("\n")}
${target.symbols.map((line) => `  ${line}`).join("\n")}
  (sheet_instances (path ${q(sheetInstancePath)} (page ${q(String(pageNumber))})))
)
`;
    }

    let filename;
    let content;
    let files = null;
    if (useHierarchy) {
      filename = `${topName}_browser_project.zip`;
      const rootFilename = `${topName}_browser.kicad_sch`;
      files = [{ filename: rootFilename, content: schematicText({ uuidValue: rootUuid, pageNumber: 1, root: true }) }];
      for (let pageIndex = 0; pageIndex < componentPageCount; pageIndex += 1) {
        files.push({ filename: fileNames[pageIndex], content: schematicText({ uuidValue: rootUuid, pageNumber: pageIndex + 2, pageIndex, sheetUuid: sheetUuids[pageIndex] }) });
      }
      content = files[0].content;
    } else {
      filename = `${topName}_browser.kicad_sch`;
      content = schematicText({ uuidValue: rootUuid, pageNumber: 1, pageIndex: 0, sheetUuid: rootUuid });
      files = [{ filename, content }];
    }
    const totals = pageData.reduce((sum, page) => ({ labels: sum.labels + page.usedLabels, powerSymbols: sum.powerSymbols + page.usedPowerSymbols }), { labels: 0, powerSymbols: 0 });
    return {
      filename,
      content,
      files: useHierarchy ? files : undefined,
      summary: {
        mode: useHierarchy ? "browser-alpha-multisheet" : "browser-alpha",
        generatorVersion: GENERATOR_VERSION,
        catalogVersion: CATALOG.schemaVersion,
        components: model.parts.length,
        graphicalUnits: model.visualUnitCount || model.parts.length,
        nets: model.nets.length,
        pinConnections: model.parts.reduce((sum, part) => sum + part.netsByPin.size, 0),
        noConnectPins: model.parts.reduce((sum, part) => sum + part.noConnect.size, 0),
        labels: totals.labels,
        powerSymbols: totals.powerSymbols,
        ports: pageData.reduce((sum, page) => sum + page.labels.filter((line) => line.startsWith("(global_label")).length, 0),
        symbols: Array.from(usedLibs).sort(),
        routingMode: model.routingMode,
        layoutMode: model.layoutMode || (model.routingMode === "ladder-buses" ? "ladder-buses" : "a4-shelf-pack"),
        layoutSafeBounds: model.layoutSafeBounds || null,
        layoutPlacements: model.layoutPlacements || [],
        layoutProfile: model.layoutProfile || null,
        layoutGaps: model.layoutGaps || null,
        layoutOrder: model.layoutOrder || [],
        layoutWarnings: model.layoutWarnings || [],
        componentSheets: componentPageCount,
        totalSheets: useHierarchy ? componentPageCount + 1 : 1,
        autoSplitSheets: useHierarchy,
        nativeErc: false,
        note: useHierarchy
          ? `O projeto excedeu a capacidade de uma folha e foi dividido em ${componentPageCount} folhas de circuito mais uma folha raiz. A exportação requer o ZIP completo e as labels globais preservam nomes de redes entre folhas. Abra a folha raiz e confira hierarquia, netlist e ERC no KiCad.`
          : model.routingMode === "ladder-buses"
            ? "Arquivo gerado no navegador com roteamento ortogonal heurístico para topologias R/C/L em escada. Abra no KiCad e confira a topologia, o layout e o ERC; esta geração alpha não executa o KiCad CLI."
            : `Arquivo gerado localmente com compactação A4 sensível à conectividade (perfil ${model.layoutProfile || "padrão"}; espaçamento ${model.layoutGaps ? `${model.layoutGaps.x}/${model.layoutGaps.y} mm` : "padrão"}). A geração não executa netlist nem ERC; confira ambos no KiCad.`
      }
    };
  }

  return { generate, validateStructure, supportedSymbols: Array.from(SUPPORTED).sort(), generatorVersion: GENERATOR_VERSION, catalogVersion: CATALOG.schemaVersion };
});
