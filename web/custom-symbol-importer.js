/*
 * User-provided KiCad symbol-library importer.
 * Parses .kicad_sym files locally. No symbol data is uploaded or persisted by this module.
 * Supports standalone and inherited symbols, including multiple graphical units.
 * Primary graphical styles are imported; alternate De Morgan artwork is preserved in the library definition but not used for geometry.
 */
(function attachImporter(root, factory) {
  const api = factory();
  if (root) root.KiCadText2SchCustomSymbolImporter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function makeImporter() {
  "use strict";
  const IMPORTER_VERSION = "0.22.0-alpha";
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_SYMBOLS = 1500;
  const MAX_PINS = 100;
  const GRAPHICS = new Set(["arc", "bezier", "circle", "pin", "polyline", "rectangle", "text"]);
  const PIN_TYPES = new Set(["input", "output", "bidirectional", "tri_state", "passive", "free", "unspecified", "power_in", "power_out", "open_collector", "open_emitter", "no_connect"]);

  function parseSexp(source) {
    if (typeof source !== "string" || !source.trim()) throw new Error("O arquivo .kicad_sym está vazio.");
    if (new TextEncoder().encode(source).byteLength > MAX_FILE_BYTES) throw new Error("O arquivo .kicad_sym excede o limite local de 5 MiB.");
    let i = 0;
    const n = source.length;
    function skip() {
      while (i < n) {
        if (/\s/.test(source[i])) { i++; continue; }
        if (source[i] === ';') { while (i < n && source[i] !== '\n') i++; continue; }
        break;
      }
    }
    function readString() {
      const start = i++;
      let value = '';
      let closed = false;
      while (i < n) {
        const c = source[i++];
        if (c === '"') { closed = true; break; }
        if (c === '\\') {
          if (i >= n) break;
          const next = source[i++];
          if (next === 'n') value += '\n';
          else if (next === 'r') value += '\r';
          else if (next === 't') value += '\t';
          else value += next;
        } else value += c;
      }
      if (!closed) throw new Error(`String sem fechamento no arquivo .kicad_sym (offset ${start}).`);
      return { type: 'string', value, start, end: i };
    }
    function readNode() {
      skip();
      if (i >= n || source[i] !== '(') throw new Error(`Esperado '(' no arquivo .kicad_sym (offset ${i}).`);
      const start = i++;
      const children = [];
      while (true) {
        skip();
        if (i >= n) throw new Error(`Lista S-expression sem fechamento (offset ${start}).`);
        if (source[i] === ')') { i++; return { type: 'list', children, start, end: i }; }
        if (source[i] === '(') { children.push(readNode()); continue; }
        if (source[i] === '"') { children.push(readString()); continue; }
        const atomStart = i;
        while (i < n && !/[\s();]/.test(source[i])) i++;
        if (atomStart === i) throw new Error(`Token inválido no arquivo .kicad_sym (offset ${i}).`);
        children.push({ type: 'atom', value: source.slice(atomStart, i), start: atomStart, end: i });
      }
    }
    const root = readNode();
    skip();
    if (i !== n) throw new Error(`Conteúdo extra após a expressão raiz (offset ${i}).`);
    return root;
  }

  const tag = (node) => node && node.type === 'list' && node.children[0] && node.children[0].type === 'atom' ? node.children[0].value : null;
  const scalar = (node) => node && (node.type === 'atom' || node.type === 'string') ? node.value : null;
  const childrenNamed = (node, name) => (node && node.type === 'list' ? node.children : []).filter((child) => tag(child) === name);
  const childNamed = (node, name) => childrenNamed(node, name)[0] || null;
  const valueOf = (node, name) => {
    const child = childNamed(node, name);
    return child && child.children.length > 1 ? scalar(child.children[1]) : null;
  };
  function propertyValue(node, propertyName) {
    for (const prop of childrenNamed(node, 'property')) {
      if (scalar(prop.children[1]) === propertyName) return scalar(prop.children[2]);
    }
    return null;
  }
  const valuesOf = (node) => node && node.type === 'list' ? node.children.slice(1).map(scalar) : [];
  function escapeString(value) { return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n'); }
  function addBoundsPoint(points, x, y) { if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]); }
  function gatherBounds(node, points, radii = []) {
    if (!node || node.type !== 'list') return;
    const t = tag(node);
    if (t === 'pin') {
      const at = childNamed(node, 'at');
      const v = valuesOf(at);
      if (v.length >= 2) addBoundsPoint(points, Number(v[0]), Number(v[1]));
      return;
    }
    if (['xy', 'start', 'mid', 'end', 'center'].includes(t)) {
      const v = valuesOf(node);
      if (v.length >= 2) addBoundsPoint(points, Number(v[0]), Number(v[1]));
      return;
    }
    if (t === 'circle') {
      const center = valuesOf(childNamed(node, 'center'));
      const radius = Number(valueOf(node, 'radius'));
      if (center.length >= 2 && Number.isFinite(radius)) {
        addBoundsPoint(points, Number(center[0]) - radius, Number(center[1]) - radius);
        addBoundsPoint(points, Number(center[0]) + radius, Number(center[1]) + radius);
      }
    }
    for (const child of node.children) if (child && child.type === 'list') gatherBounds(child, points, radii);
  }

  function cloneNode(node) {
    if (!node || typeof node !== 'object') return node;
    const copy = { type: node.type, value: node.value, start: node.start, end: node.end };
    if (node.children) copy.children = node.children.map(cloneNode);
    return copy;
  }

  function serializeNode(node) {
    if (!node || typeof node !== 'object') return '';
    if (node.type === 'string') return `"${escapeString(node.value)}"`;
    if (node.type === 'atom') return String(node.value);
    return `(${(node.children || []).map(serializeNode).join(' ')})`;
  }

  function topLevelKey(node) {
    const nodeTag = tag(node);
    if (nodeTag === 'property') return `property:${scalar(node.children[1]) || ''}`;
    if (nodeTag === 'symbol') return `symbol:${scalar(node.children[1]) || ''}`;
    return nodeTag;
  }

  function resolveSymbolNode(symbolNode, symbolsByName, source, visiting = []) {
    const name = scalar(symbolNode.children[1]);
    const extendsNode = childNamed(symbolNode, 'extends');
    if (!extendsNode) return { node: symbolNode, definition: source.slice(symbolNode.start, symbolNode.end) };
    const parentName = scalar(extendsNode.children[1]);
    if (!parentName || !symbolsByName.has(parentName)) {
      throw new Error(`O símbolo '${name}' deriva de '${parentName || '(nome ausente)'}', que não está presente na biblioteca importada. Importe um arquivo que contenha a definição base.`);
    }
    if (visiting.includes(parentName) || parentName === name) {
      throw new Error(`Ciclo de herança detectado ao resolver '${name}' -> '${parentName}'.`);
    }
    const parent = resolveSymbolNode(symbolsByName.get(parentName), symbolsByName, source, [...visiting, name]);
    const merged = cloneNode(parent.node);
    // Preserve the derived symbol's library identity and rename internal unit/style
    // bodies so they form a standalone definition named after the derived symbol.
    merged.children[1] = { type: 'string', value: name };
    for (const body of childrenNamed(merged, 'symbol')) {
      const bodyName = scalar(body.children[1]) || '';
      if (bodyName.startsWith(`${parentName}_`)) body.children[1] = { type: 'string', value: `${name}${bodyName.slice(parentName.length)}` };
    }
    const childNodes = (symbolNode.children || []).slice(2).filter((child) => tag(child) !== 'extends');
    for (const child of childNodes) {
      const key = topLevelKey(child);
      const replaceIndex = merged.children.findIndex((existing, index) => index >= 2 && topLevelKey(existing) === key && key !== 'symbol');
      if (replaceIndex >= 0) merged.children[replaceIndex] = cloneNode(child);
      else if (tag(child) === 'symbol') {
        const childSymbolName = scalar(child.children[1]) || '';
        const unitStyle = /_(\d+_\d+)$/.exec(childSymbolName);
        const matchIndex = unitStyle ? merged.children.findIndex((existing) => tag(existing) === 'symbol' && new RegExp(`_${unitStyle[1].replace('_', '_')}$`).test(scalar(existing.children[1]) || '')) : -1;
        if (matchIndex >= 0) merged.children[matchIndex] = cloneNode(child);
        else merged.children.push(cloneNode(child));
      } else merged.children.push(cloneNode(child));
    }
    return { node: merged, definition: serializeNode(merged) };
  }

  function metadataForSymbol(symbolNode, source, namespace, resolvedDefinition = null) {
    const name = scalar(symbolNode.children[1]);
    if (!name) throw new Error('Símbolo sem nome no arquivo .kicad_sym.');
    const allSubSymbols = childrenNamed(symbolNode, 'symbol');
    // Only primary style _unit_1 bodies are used for pin geometry. Alternate
    // De Morgan bodies can remain in the embedded definition; KiCad defaults
    // to the primary style unless an explicit alternate is selected.
    const subSymbols = allSubSymbols.filter((sub) => {
      const subName = scalar(sub.children[1]) || '';
      const match = /_(\d+)_(\d+)$/.exec(subName);
      return match && Number(match[2]) === 1;
    });
    if (!subSymbols.length) throw new Error(`O símbolo '${name}' não contém corpos gráficos no estilo primário _unit_1.`);
    const pinRows = [];
    const unitSet = new Set();
    const subSymbolMeta = [];
    for (const sub of subSymbols) {
      const subName = scalar(sub.children[1]) || '';
      const match = /_(\d+)_(\d+)$/.exec(subName);
      if (!match) throw new Error(`O corpo '${subName}' do símbolo '${name}' não segue o sufixo esperado _unit_style.`);
      const unit = Number(match[1]);
      const bodyStyle = Number(match[2]);
      if (bodyStyle !== 1) continue;
      if (unit > 0) unitSet.add(unit);
      const localPins = [];
      for (const pinNode of childrenNamed(sub, 'pin')) {
        const electricalType = scalar(pinNode.children[1]);
        const at = valuesOf(childNamed(pinNode, 'at'));
        const length = Number(valueOf(pinNode, 'length'));
        const number = valueOf(pinNode, 'number');
        let pinName = valueOf(pinNode, 'name') || '';
        if (pinName === '~') pinName = '';
        if (!number || at.length < 3 || !PIN_TYPES.has(electricalType)) {
          throw new Error(`O pino de '${name}' possui metadados incompletos ou tipo elétrico não suportado.`);
        }
        const pin = {
          number: String(number), name: pinName, electricalType, unit,
          at: [Number(at[0]), Number(at[1])], orientation: Number(at[2]),
          length: Number.isFinite(length) ? length : 0,
          intrinsicNoConnect: electricalType === 'no_connect',
          hideName: Boolean(childNamed(childNamed(pinNode, 'name'), 'effects') && childNamed(childNamed(childNamed(pinNode, 'name'), 'effects'), 'hide'))
        };
        pinRows.push(pin);
        localPins.push(pin);
        if (pinRows.length > MAX_PINS) throw new Error(`O símbolo '${name}' excede o limite local de ${MAX_PINS} pinos.`);
      }
      const points = [];
      gatherBounds(sub, points);
      for (const pin of localPins) addBoundsPoint(points, pin.at[0], pin.at[1]);
      subSymbolMeta.push({ unit, name: subName, points, pins: localPins });
    }
    if (!unitSet.size) unitSet.add(1);
    const units = Array.from(unitSet).sort((a, b) => a - b);
    if (units.length > 16) throw new Error(`O símbolo '${name}' contém ${units.length} unidades; o limite do importador é 16.`);
    const pinMeta = pinRows;
    if (!pinMeta.length) throw new Error(`O símbolo '${name}' não possui pinos com numeração utilizável.`);
    // JSON references identify physical pins as REF.NUMBER. If one physical pin
    // number is repeated in different graphical units, that mapping is ambiguous.
    const seenPins = new Map();
    for (const pin of pinMeta) {
      if (seenPins.has(pin.number)) {
        const priorUnit = seenPins.get(pin.number);
        throw new Error(`O símbolo '${name}' repete o número de pino '${pin.number}' nas unidades ${priorUnit} e ${pin.unit}; REF.NUMBER não conseguiria distingui-los.`);
      }
      seenPins.set(pin.number, pin.unit);
    }
    // Unit 0 contains graphics common to all units. Include those graphics in
    // every unit's geometry, but only attach unit-0 pins to the first instance.
    const unitBounds = {};
    const allCommon = subSymbolMeta.filter((sub) => sub.unit === 0).flatMap((sub) => sub.points);
    for (const unit of units) {
      const points = [...allCommon, ...subSymbolMeta.filter((sub) => sub.unit === unit).flatMap((sub) => sub.points)];
      for (const pin of pinMeta.filter((row) => row.unit === unit || (row.unit === 0 && unit === units[0]))) addBoundsPoint(points, pin.at[0], pin.at[1]);
      if (!points.length) unitBounds[unit] = [-5.08, -5.08, 5.08, 5.08];
      else {
        const xs = points.map((point) => point[0]);
        const ys = points.map((point) => point[1]);
        unitBounds[unit] = [Math.min(...xs) - 1.27, Math.min(...ys) - 1.27, Math.max(...xs) + 1.27, Math.max(...ys) + 1.27];
      }
    }
    const allPoints = Object.values(unitBounds).flatMap((bounds) => [[bounds[0], bounds[1]], [bounds[2], bounds[3]]]);
    const xs = allPoints.map((point) => point[0]);
    const ys = allPoints.map((point) => point[1]);
    const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    const namespaceSafe = String(namespace || 'External').trim().replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^[_\-.]+|[_\-.]+$/g, '').slice(0, 48) || 'External';
    const libId = `${namespaceSafe}:${name}`;
    const rawDefinition = resolvedDefinition || source.slice(symbolNode.start, symbolNode.end);
    const definition = rawDefinition.replace(/^\(symbol\s+(?:"(?:\\.|[^"\\])*"|[^\s()]+)/, `(symbol "${escapeString(libId)}"`);
    const referencePrefix = (propertyValue(symbolNode, 'Reference') || 'U').slice(0, 3);
    const defaultFootprint = propertyValue(symbolNode, 'Footprint') || '';
    const description = propertyValue(symbolNode, 'Description') || `User-imported KiCad symbol ${name}`;
    const nonCommonPins = pinMeta.filter((pin) => pin.unit > 0);
    const preferredAxis = nonCommonPins.length === 2 && Math.abs(nonCommonPins[0].at[0] - nonCommonPins[1].at[0]) > Math.abs(nonCommonPins[0].at[1] - nonCommonPins[1].at[1]) ? 'horizontal' : 'vertical';
    return {
      browserSupported: true,
      browserSource: 'user-imported-local-file',
      referencePrefix,
      description,
      defaultFootprint,
      units,
      unitBounds,
      pins: pinMeta.map((pin) => ({ ...pin, number: String(pin.number) })),
      graphicalBounds: bounds,
      preferredAxis,
      definition,
      sourceLicense: 'User-provided symbol file; user is responsible for verifying source/license terms.',
      importNotes: (childrenNamed(symbolNode, 'alternate').length || allSubSymbols.some((sub) => { const m = /_(\d+)_(\d+)$/.exec(scalar(sub.children[1]) || ''); return m && Number(m[2]) !== 1; }))
        ? ['O símbolo contém estilos gráficos alternativos; o gerador calcula a geometria usando o estilo primário. A definição original permanece embutida.']
        : []
    };
  }

  function importLibrary(source, namespace = 'External') {
    const root = parseSexp(source);
    if (tag(root) !== 'kicad_symbol_lib') throw new Error('O arquivo selecionado não parece ser uma biblioteca .kicad_sym do KiCad.');
    const symbols = childrenNamed(root, 'symbol');
    if (!symbols.length) throw new Error('Nenhum símbolo foi encontrado no arquivo .kicad_sym.');
    if (symbols.length > MAX_SYMBOLS) throw new Error(`A biblioteca contém ${symbols.length} símbolos; o limite local é ${MAX_SYMBOLS}. Use uma biblioteca menor ou exporte apenas o componente necessário.`);
    const imported = {};
    const skipped = [];
    const symbolsByName = new Map(symbols.map((node) => [scalar(node.children[1]), node]));
    for (const symbolNode of symbols) {
      const name = scalar(symbolNode.children[1]);
      try {
        const resolved = resolveSymbolNode(symbolNode, symbolsByName, source, []);
        const metadata = metadataForSymbol(resolved.node, source, namespace, resolved.definition);
        imported[`${String(namespace || 'External').trim().replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^[_\-.]+|[_\-.]+$/g, '').slice(0, 48) || 'External'}:${name}`] = metadata;
      } catch (error) { skipped.push({ name: name || '(sem nome)', reason: error.message }); }
    }
    if (!Object.keys(imported).length) {
      const reason = skipped.slice(0, 12).map((item) => `${item.name}: ${item.reason}`).join(' | ');
      throw new Error(`Nenhum símbolo compatível foi importado pelo importador ${IMPORTER_VERSION}. ${reason} Confirme se o navegador carregou os assets atuais (Ctrl+F5). O importador aceita unidades gráficas múltiplas e até 16 unidades, mas exige a convenção de nomes _unidade_estilo e números de pinos físicos não ambíguos.`);
    }
    return { symbols: imported, importedNames: Object.keys(imported), skipped, namespace: String(namespace || 'External').trim() };
  }

  return { importLibrary, parseSexp, maxFileBytes: MAX_FILE_BYTES, version: IMPORTER_VERSION };
});
