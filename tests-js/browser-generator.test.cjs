const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../web/symbol-catalog.js');
const generator = require('../web/browser-generator.js');
const customImporter = require('../web/custom-symbol-importer.js');

const root = path.resolve(__dirname, '..');
const loadExample = (name) => JSON.parse(fs.readFileSync(path.join(root, 'inputs', name), 'utf8'));

function assertBalancedSExpression(source) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      assert.ok(depth >= 0, `parêntese de fechamento extra na posição ${i}`);
    }
  }
  assert.equal(inString, false, 'string não terminada');
  assert.equal(depth, 0, 'parênteses desbalanceados');
}


function parseSExpression(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const ch = source[index];
    if (/\s/.test(ch)) { index += 1; continue; }
    if (ch === '(' || ch === ')') { tokens.push(ch); index += 1; continue; }
    if (ch === '"') {
      const start = index;
      index += 1;
      let escaped = false;
      let closed = false;
      while (index < source.length) {
        const current = source[index++];
        if (escaped) escaped = false;
        else if (current === '\\') escaped = true;
        else if (current === '"') { closed = true; break; }
      }
      assert.ok(closed, `string S-expression não terminada em ${start}`);
      tokens.push({ string: source.slice(start + 1, index - 1) });
      continue;
    }
    const start = index;
    while (index < source.length && !/[\s()]/.test(source[index])) index += 1;
    tokens.push({ atom: source.slice(start, index) });
  }

  let cursor = 0;
  function parseOne() {
    assert.equal(tokens[cursor], '(', `esperado '(' no token ${cursor}`);
    cursor += 1;
    const list = [];
    while (cursor < tokens.length && tokens[cursor] !== ')') {
      if (tokens[cursor] === '(') list.push(parseOne());
      else list.push(tokens[cursor++]);
    }
    assert.equal(tokens[cursor], ')', 'lista S-expression não terminada');
    cursor += 1;
    return list;
  }
  const expressions = [];
  while (cursor < tokens.length) expressions.push(parseOne());
  assert.equal(expressions.length, 1, 'deve haver uma única expressão-raiz');
  return expressions[0];
}

function extractUuidValues(source) {
  return [...source.matchAll(/\(uuid\s+"([0-9a-f-]{36})"\)/gi)].map((match) => match[1].toLowerCase());
}

function sexpTag(node) {
  return Array.isArray(node) && node[0] && node[0].atom ? node[0].atom : null;
}
function sexpChildren(node, name) { return Array.isArray(node) ? node.filter((child) => sexpTag(child) === name) : []; }
function sexpChild(node, name) { return sexpChildren(node, name)[0] || null; }

test('catálogo browser está versionado e descreve pinos e tipos elétricos', () => {
  assert.equal(catalog.schemaVersion, '1.9.0');
  assert.equal(catalog.kicadLibraryVersion, '10.0.5');
  assert.ok(generator.supportedSymbols.includes('Device:D_Small'), 'o catálogo carregado precisa expor o diodo ao gerador');
  assert.ok(generator.supportedSymbols.includes('Transistor_FET:Q_PMOS_GSD'));
  assert.ok(generator.supportedSymbols.includes('Transistor_BJT:Q_PNP_BCE'));
  assert.equal(generator.catalogVersion, catalog.schemaVersion);
  assert.equal(generator.generatorVersion, '0.24.0-alpha');
  assert.ok(generator.supportedSymbols.includes('Amplifier_Operational:LM741'));
  assert.ok(generator.supportedSymbols.includes('Triac_Thyristor:BT169B'));
  assert.ok(generator.supportedSymbols.includes('Device:DIAC'));
  assert.ok(generator.supportedSymbols.includes('KiCadText2Sch:SIDAC_Generic'));
  assert.deepEqual(generator.supportedSymbols, [...generator.supportedSymbols].sort());
  assert.deepEqual(catalog.symbols['Device:R'].pins.map((pin) => pin.number), ['1', '2']);
  assert.deepEqual(catalog.symbols['Device:C'].pins.map((pin) => pin.number), ['1', '2']);
  assert.deepEqual(catalog.symbols['Device:L'].pins.map((pin) => pin.number), ['1', '2']);
  assert.deepEqual(catalog.symbols['Device:D_Small'].pins.map((pin) => [pin.number, pin.name]), [['1', 'K'], ['2', 'A']]);
  assert.equal(catalog.symbols['Device:D_Small'].preferredAxis, 'horizontal');
  assert.deepEqual(catalog.symbols['Transistor_FET:Q_NMOS_GSD'].pins.map((pin) => pin.number), ['1', '2', '3']);
  assert.deepEqual(catalog.symbols['Transistor_BJT:Q_NPN_BCE'].pins.map((pin) => pin.number), ['1', '2', '3']);
  assert.deepEqual(catalog.symbols['Transistor_FET:Q_PMOS_GSD'].pins.map((pin) => pin.number), ['1', '2', '3']);
  assert.deepEqual(catalog.symbols['Transistor_BJT:Q_PNP_BCE'].pins.map((pin) => pin.number), ['1', '2', '3']);
  for (const [libId, symbol] of Object.entries(catalog.symbols)) {
    assert.ok(symbol.pins.every((pin) => pin.electricalType && Array.isArray(pin.at) && pin.at.length === 2));
    const embeddedName = symbol.definition.match(/^\(symbol "([^"]+)"/)?.[1];
    assert.equal(embeddedName, libId);
    assertBalancedSExpression(symbol.definition);
  }
  assert.deepEqual(catalog.symbols['Transistor_FET:Q_NMOS_GSD'].pins.map((pin) => [pin.number, pin.name]), [['1', 'G'], ['2', 'S'], ['3', 'D']]);
  assert.deepEqual(catalog.symbols['Transistor_BJT:Q_NPN_BCE'].pins.map((pin) => [pin.number, pin.name]), [['1', 'B'], ['2', 'C'], ['3', 'E']]);
  assert.deepEqual(catalog.symbols['Transistor_FET:Q_PMOS_GSD'].pins.map((pin) => [pin.number, pin.name]), [['1', 'G'], ['2', 'S'], ['3', 'D']]);
  assert.deepEqual(catalog.symbols['Transistor_BJT:Q_PNP_BCE'].pins.map((pin) => [pin.number, pin.name]), [['1', 'B'], ['2', 'C'], ['3', 'E']]);
});

test('valida estrutura local sem exigir backend', () => {
  const design = loadExample('circuit1.json');
  const result = generator.validateStructure(design);
  assert.equal(result.valid, true);
  assert.equal(result.summary.parts, 3);
  assert.equal(result.summary.connected_nets, 3);
  assert.equal(result.summary.pin_references, 6);
  assert.match(result.message, /ERC.*não foram executados/i);
});

test('gera .kicad_sch browser-native para o divisor RC', () => {
  const result = generator.generate(loadExample('circuit1.json'), { date: '2026-10-19' });
  assert.equal(result.filename, 'circuit1_gen_browser.kicad_sch');
  assert.match(result.content, /^\(kicad_sch/);
  assert.match(result.content, /\(generator "kicad-text2sch-browser"\)/);
  assert.match(result.content, /\(symbol "Device:R"/);
  assert.match(result.content, /\(symbol "Device:C"/);
  assert.match(result.content, /\(property "Reference" "R1"/);
  assert.match(result.content, /\(symbol "power:VS"/);
  assert.match(result.content, /\(symbol "power:GND"/);
  assert.match(result.content, /\(label "N1"/);
  assert.doesNotMatch(result.content, /\(label "GND"/);
  assert.equal(result.summary.routingMode, 'ladder-buses');
  assert.equal(result.summary.components, 3);
  assert.equal(result.summary.labels, 1);
  assert.equal(result.summary.powerSymbols, 2);
  assertBalancedSExpression(result.content);
  const ast = parseSExpression(result.content);
  assert.equal(ast[0].atom, 'kicad_sch');
});

test('gera .kicad_sch browser-native para a topologia RLC multi-ramo', () => {
  const result = generator.generate(loadExample('rlc_layout_test.json'), { date: '2026-10-19' });
  assert.equal(result.summary.components, 8);
  assert.ok(result.summary.symbols.includes('Device:L'));
  assert.equal(result.summary.routingMode, 'pin-labels');
  assert.equal(result.summary.layoutMode, 'a4-topology-pack');
  assert.equal(result.summary.totalSheets, 1);
  assert.ok(result.summary.layoutOrder.includes('L1'));
  assert.ok(result.summary.layoutProfile);
  assert.ok(result.summary.layoutGaps.x > 0 && result.summary.layoutGaps.y > 0);
  assert.ok(result.summary.labels > 0);
  assert.equal(result.summary.powerSymbols, 5);
  assert.match(result.content, /\(symbol "Device:L"/);
  for (const ref of ['R1', 'R2', 'R3', 'C1', 'C2', 'C3', 'L1', 'L2']) {
    assert.match(result.content, new RegExp(`\\(property "Reference" "${ref}"`));
  }
  assertBalancedSExpression(result.content);
  const ast = parseSExpression(result.content);
  assert.equal(ast[0].atom, 'kicad_sch');
});

test('UUIDs de objetos do esquema não se repetem', () => {
  const result = generator.generate(loadExample('rlc_layout_test.json'), { date: '2026-10-19' });
  const values = extractUuidValues(result.content);
  assert.ok(values.length >= 30);
  assert.equal(new Set(values).size, values.length);
});

test('gera diodo D_Small com anodo/catodo e orientação vertical coerente com a rede', () => {
  const design = loadExample('diode_rectifier_test.json');
  const result = generator.generate(design, { date: '2026-10-20' });
  assert.equal(result.summary.components, 2);
  assert.ok(result.summary.symbols.includes('Device:D_Small'));
  assert.match(result.content, /\(symbol "Device:D_Small"/);
  assert.match(result.content, /\(property "Sim.Pins" "1=K 2=A"/);
  assert.match(result.content, /\(symbol\s+\(lib_id "Device:D_Small"\)\s+\(at [^)]* 270\)/, 'o anodo ligado a VS deve ficar acima do catodo ligado a VOUT neste fixture');
  assert.match(result.content, /\(global_label "VOUT" \(shape output\)/);
  assert.match(result.content, /\(symbol "power:VS"/);
  assert.match(result.content, /\(symbol "power:GND"/);
  assertBalancedSExpression(result.content);
  assert.equal(parseSExpression(result.content)[0].atom, 'kicad_sch');
});

test('o conversor Boost cabe numa folha A4 com caixas de componentes dentro da área útil e sem sobreposição', () => {
  const result = generator.generate(loadExample('boost_converter_test.json'), { date: '2026-10-21' });
  assert.equal(result.summary.components, 7);
  assert.equal(result.summary.totalSheets, 1);
  assert.equal(result.summary.layoutMode, 'a4-topology-pack');
  assert.equal(result.summary.routingMode, 'pin-labels');
  const safe = result.summary.layoutSafeBounds;
  const boxes = result.summary.layoutPlacements.map((p) => ({
    ref: p.ref, left: p.x + p.bounds[0], top: p.y + p.bounds[1],
    right: p.x + p.bounds[2], bottom: p.y + p.bounds[3]
  }));
  for (const box of boxes) {
    assert.ok(box.left >= safe.left - 1e-3, `${box.ref} left within A4`);
    assert.ok(box.right <= safe.right + 1e-3, `${box.ref} right within A4`);
    assert.ok(box.top >= safe.top - 1e-3, `${box.ref} top within A4`);
    assert.ok(box.bottom <= safe.bottom + 1e-3, `${box.ref} bottom within A4`);
  }
  for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
    const a = boxes[i], b = boxes[j];
    const overlapX = a.left < b.right && b.left < a.right;
    const overlapY = a.top < b.bottom && b.top < a.bottom;
    assert.ok(!(overlapX && overlapY), `${a.ref} and ${b.ref} estimated envelopes do not overlap`);
  }
  assert.match(result.content, /KiCadText2Sch:Power_VIN/);
  assert.match(result.content, /Transistor_FET:Q_NMOS_GSD/);
  assertBalancedSExpression(result.content);
});

test('layout agrupa componentes pela conectividade e compacta antes de criar folhas adicionais', () => {
  const boost = generator.generate(loadExample('boost_converter_test.json'), { date: '2026-10-21' });
  const order = boost.summary.layoutOrder;
  assert.ok(order.indexOf('L1') < order.indexOf('D1') && order.indexOf('D1') < order.indexOf('Q1'), 'o ramo VIN→SW deve manter L1, D1 e Q1 próximos na ordem de layout');
  assert.equal(boost.summary.layoutProfile, 'comfortable');
  const base = loadExample('multisheet_layout_stress_test.json');
  const design = {
    ...base,
    meta: { ...base.meta, top_name: 'a4_compaction_threshold' },
    parts: base.parts.slice(0, 22),
    connections: base.connections.map((group) => ({ ...group, pins: group.pins.filter((pin) => Number(pin.match(/R(\d+)/)?.[1] || 999) <= 22) })).filter((group) => group.pins.length)
  };
  const compacted = generator.generate(design, { date: '2026-10-21' });
  assert.equal(compacted.summary.totalSheets, 1, 'deve compactar espaçamentos antes de criar uma segunda folha');
  assert.equal(compacted.summary.layoutProfile, 'compact');
  assert.deepEqual(compacted.summary.layoutGaps, { x: 5, y: 6 });
});

test('o layout separa automaticamente circuitos grandes em folhas hierárquicas e exportáveis em ZIP', () => {
  const result = generator.generate(loadExample('multisheet_layout_stress_test.json'), { date: '2026-10-21' });
  assert.ok(result.summary.totalSheets > 1);
  assert.equal(result.summary.autoSplitSheets, true);
  assert.equal(result.files.length, result.summary.totalSheets);
  assert.match(result.filename, /_browser_project\.zip$/);
  assert.match(result.files[0].content, /\(sheet_instances \(path "\/" \(page "1"\)\)\)/);
  assert.match(result.files[0].content, /_sheet_02\.kicad_sch/);
  for (const child of result.files.slice(1)) {
    assert.match(child.filename, /_sheet_\d+\.kicad_sch$/);
    assert.match(child.content, /\(global_label "OUT_/);
    assert.match(child.content, /\(instances \(project/);
    assertBalancedSExpression(child.content);
  }
  const safe = result.summary.layoutSafeBounds;
  const boxes = result.summary.layoutPlacements.map((p) => ({ ref:p.ref,page:p.page,left:p.x+p.bounds[0],top:p.y+p.bounds[1],right:p.x+p.bounds[2],bottom:p.y+p.bounds[3] }));
  for (const box of boxes) {
    assert.ok(box.left >= safe.left - 1e-3 && box.right <= safe.right + 1e-3, `${box.ref} stays within horizontal A4 bounds`);
    assert.ok(box.top >= safe.top - 1e-3 && box.bottom <= safe.bottom + 1e-3, `${box.ref} stays within vertical A4 bounds`);
  }
  for (let i=0;i<boxes.length;i+=1) for (let j=i+1;j<boxes.length;j+=1) {
    const a=boxes[i], b=boxes[j]; if (a.page !== b.page) continue;
    const overlapX=a.left < b.right && b.left < a.right; const overlapY=a.top < b.bottom && b.top < a.bottom;
    assert.ok(!(overlapX && overlapY), `${a.ref} and ${b.ref} do not overlap on page ${a.page}`);
  }
  assertBalancedSExpression(result.files[0].content);
  const disabled = loadExample('multisheet_layout_stress_test.json');
  disabled.meta.auto_split_sheets = false;
  assert.throws(() => generator.generate(disabled), /precisa de pelo menos .* folhas A4/i);
});

test('rejeita símbolos fora do conjunto suportado pelo motor browser alpha', () => {
  const design = loadExample('circuit1.json');
  design.parts[0].name = 'Q_SCR_GAK';
  design.connections = design.connections.map((net) => ({ ...net, pins: net.pins.map((pin) => pin.replace(/^R1\./, 'R1.')) }));
  assert.throws(() => generator.generate(design), /0\.24\.0-alpha.*catálogo 1\.9\.0.*ainda não suporta 'Device:Q_SCR_GAK'/i);
});

test('gera esquema browser-native com MOSFET N de três pinos', () => {
  const design = loadExample('mosfet_low_side_switch.json');
  const result = generator.generate(design, { date: '2026-10-19' });
  assert.equal(result.summary.components, 4);
  assert.equal(result.summary.pinConnections, 9);
  assert.equal(result.summary.routingMode, 'pin-labels');
  assert.equal(result.summary.labels, 6);
  assert.equal(result.summary.powerSymbols, 3);
  assert.match(result.content, /\(symbol "Transistor_FET:Q_NMOS_GSD"/);
  assert.match(result.content, /\(pin "3" \(uuid "/);
  assert.match(result.content, /\(property "Reference" "Q1"/);
  for (const net of ['CTRL', 'GATE', 'LOAD']) assert.match(result.content, new RegExp(`\\(label "${net}"|\\(global_label "${net}"`));
  assert.match(result.content, /\(symbol "power:VS"/);
  assert.match(result.content, /\(symbol "power:GND"/);
  assertBalancedSExpression(result.content);
  assert.equal(parseSExpression(result.content)[0].atom, 'kicad_sch');
});

test('gera esquema browser-native com TBJ NPN de três pinos', () => {
  const design = loadExample('bjt_common_emitter_test.json');
  const result = generator.generate(design, { date: '2026-10-19' });
  assert.equal(result.summary.components, 4);
  assert.equal(result.summary.pinConnections, 9);
  assert.equal(result.summary.routingMode, 'pin-labels');
  assert.match(result.content, /\(symbol "Transistor_BJT:Q_NPN_BCE"/);
  assert.match(result.content, /\(pin "1" \(uuid "/);
  assert.match(result.content, /\(pin "2" \(uuid "/);
  assert.match(result.content, /\(pin "3" \(uuid "/);
  assertBalancedSExpression(result.content);
  assert.equal(parseSExpression(result.content)[0].atom, 'kicad_sch');
});

test('gera esquema browser-native com P-MOSFET e respeita rotação de 180 graus', () => {
  const design = loadExample('p_mosfet_high_side_switch.json');
  const result = generator.generate(design, { date: '2026-10-20' });
  assert.equal(result.summary.components, 2);
  assert.equal(result.summary.pinConnections, 5);
  assert.equal(result.summary.routingMode, 'pin-labels');
  assert.match(result.content, /\(symbol "Transistor_FET:Q_PMOS_GSD"/);
  assert.match(result.content, /\(symbol\s+\(lib_id "Transistor_FET:Q_PMOS_GSD"\)\s+\(at [^)]* 180\)/);
  assert.match(result.content, /\(global_label "CTRL" \(shape input\)/);
  assert.match(result.content, /\(global_label "LOAD" \(shape output\)/);
  assert.match(result.content, /\(symbol\s+\(lib_id "power:VS"\)/);
  assert.match(result.content, /\(symbol\s+\(lib_id "power:GND"\)/);
  assert.equal(result.summary.layoutMode, 'a4-topology-pack');
  assert.ok(result.summary.layoutPlacements.every((placement) => placement.x + placement.bounds[0] >= result.summary.layoutSafeBounds.left - 1e-3));
  const pmosInstance = result.content.match(/\(symbol\s+\(lib_id "Transistor_FET:Q_PMOS_GSD"\)\s+\(at ([0-9.]+) ([0-9.]+) 180\)/);
  const refProperty = result.content.match(/\(property "Reference" "Q1" \(at ([0-9.]+) ([0-9.]+) 0\)/);
  assert.ok(pmosInstance && refProperty, 'a instância e a referência do P-MOSFET devem existir');
  assert.ok(Number(refProperty[1]) < Number(pmosInstance[1]), 'os campos ficam do lado oposto ao gate após rotação');
  assert.ok(Number(refProperty[2]) < Number(pmosInstance[2]), 'a referência deve ficar acima do centro do componente');
  assertBalancedSExpression(result.content);
  assert.equal(parseSExpression(result.content)[0].atom, 'kicad_sch');
});

test('gera esquema browser-native com TBJ PNP e emissor no topo após rotação', () => {
  const design = loadExample('bjt_pnp_high_side_test.json');
  const result = generator.generate(design, { date: '2026-10-20' });
  assert.equal(result.summary.components, 3);
  assert.equal(result.summary.pinConnections, 7);
  assert.match(result.content, /\(symbol "Transistor_BJT:Q_PNP_BCE"/);
  assert.match(result.content, /\(property "Sim\.Device" "PNP"/);
  assert.match(result.content, /\(property "Sim\.Pins" "1=B 2=C 3=E"/);
  assert.match(result.content, /\(symbol\s+\(lib_id "Transistor_BJT:Q_PNP_BCE"\)\s+\(at [^)]* 180\)/);
  assert.match(result.content, /\(global_label "CTRL" \(shape input\)/);
  assert.match(result.content, /\(global_label "LOAD" \(shape output\)/);
  assertBalancedSExpression(result.content);
  assert.equal(parseSExpression(result.content)[0].atom, 'kicad_sch');
});

test('recusa rotação inválida e rotação explícita em símbolos de dois pinos', () => {
  const invalidAngle = loadExample('p_mosfet_high_side_switch.json');
  invalidAngle.parts[0].rotation = 45;
  assert.throws(() => generator.generate(invalidAngle), /rotation deve ser 0, 90, 180 ou 270/i);
  const twoPin = loadExample('diode_rectifier_test.json');
  twoPin.parts[0].rotation = 180;
  assert.throws(() => generator.generate(twoPin), /suportado nesta versão apenas para símbolos com três ou mais pinos/i);
});

test('rejeita referências a pinos inexistentes no catálogo do símbolo ativo', () => {
  const design = loadExample('mosfet_low_side_switch.json');
  design.connections[1].pins.push('Q1.4');
  assert.throws(() => generator.generate(design), /pino 'Q1\.4' não existe no catálogo/i);
});

test('rejeita pino multipino não conectado', () => {
  const design = loadExample('mosfet_low_side_switch.json');
  design.connections = design.connections.map((group) => ({
    ...group,
    pins: group.pins.filter((pin) => pin !== 'Q1.3')
  })).filter((group) => group.pins.length > 0);
  assert.throws(() => generator.generate(design), /pino 'Q1\.3' não está conectado/i);
});

test('rejeita um pino que não foi conectado', () => {
  const design = loadExample('circuit1.json');
  design.connections[2].pins = ['R2.2'];
  assert.throws(() => generator.generate(design), /C1\.2.*não está conectado|não está conectado.*C1\.2/i);
});

test('rejeita conexão com referência inexistente', () => {
  const design = loadExample('circuit1.json');
  design.connections[0].pins = ['R404.1'];
  assert.throws(() => generator.validateStructure(design), /componente inexistente/i);
});

test('escapa strings e títulos com aspas no S-expression', () => {
  const design = loadExample('circuit1.json');
  design.meta.title = 'Filtro "RC" \\ alpha';
  const result = generator.generate(design, { date: '2026-10-19' });
  assert.match(result.content, /Filtro \\\"RC\\\" \\\\ alpha/);
  assertBalancedSExpression(result.content);
});

test('topologia fora da heurística de escada usa labels por pino como fallback', () => {
  const design = {
    meta: { title: 'Dois nós e um ramo', top_name: 'label_fallback' },
    nets: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'GND', type: 'power' }],
    parts: [
      { ref: 'R1', lib: 'Device', name: 'R', value: '1k' },
      { ref: 'R2', lib: 'Device', name: 'R', value: '2k' }
    ],
    connections: [
      { net: 'A', pins: ['R1.1'] },
      { net: 'C', pins: ['R1.2'] },
      { net: 'B', pins: ['R2.1'] },
      { net: 'GND', pins: ['R2.2'] }
    ]
  };
  const result = generator.generate(design, { date: '2026-10-19' });
  assert.equal(result.summary.routingMode, 'local-labels');
  assert.equal(result.summary.labels, 3);
  assert.equal(result.summary.powerSymbols, 1);
  assertBalancedSExpression(result.content);
});


test('gera portas globais input/output e símbolo GND nativo para MOSFET simples', () => {
  const design = loadExample('mosfet_port_symbols.json');
  const result = generator.generate(design, { date: '2026-10-20' });
  assert.equal(result.summary.components, 1);
  assert.equal(result.summary.ports, 2);
  assert.equal(result.summary.powerSymbols, 1);
  assert.match(result.content, /\(global_label "GATE" \(shape input\)/, 'GATE deve ser um global label com forma de entrada');
  assert.match(result.content, /\(global_label "LOAD" \(shape output\)/, 'LOAD deve ser um global label com forma de saída');
  const loadMatch = result.content.match(/\(global_label "LOAD" \(shape output\) \(at ([0-9.]+) ([0-9.]+) 180\)/);
  assert.ok(loadMatch, 'LOAD em pino vertical deve ser uma label de saída horizontal, orientada para o lado do fio');
  const loadX = Number(loadMatch[1]);
  const loadY = Number(loadMatch[2]);
  const horizontalWireTouchesLoad = [...result.content.matchAll(/\(wire \(pts \(xy ([0-9.]+) ([0-9.]+)\) \(xy ([0-9.]+) ([0-9.]+)\)\)/g)]
    .some((match) => Math.abs(Number(match[2]) - loadY) < 1e-3 && Math.abs(Number(match[4]) - loadY) < 1e-3 && (Math.abs(Number(match[1]) - loadX) < 1e-3 || Math.abs(Number(match[3]) - loadX) < 1e-3));
  assert.ok(horizontalWireTouchesLoad, 'LOAD deve ser conectado por um segmento horizontal ao fio de cotovelo');
  assert.match(result.content, /\(global_label "GATE" \(shape input\) \(at [^)]*\) \(fields_autoplaced\)/, 'global labels devem conter fields_autoplaced');
  assert.match(result.content, /\(property "Intersheetrefs" "\$\{INTERSHEET_REFS\}"/, 'global labels devem incluir o metadado nativo Intersheetrefs');
  assert.match(result.content, /\(lib_id "power:GND"\)/, 'a instância deve referenciar power:GND');
  assert.match(result.content, /\(property "Value" "GND"/, 'a instância de alimentação deve preservar o valor GND');
  assert.match(result.content, /\(property "Value" "GND" \(at [0-9.]+ ([0-9.]+) 0\)/, 'a posição do valor GND deve ser explícita');
  assert.doesNotMatch(result.content, /\(label "GND"/, 'GND não deve ser emitido como label de texto');
  assert.doesNotMatch(result.content, /\(text "(GATE|LOAD|GND)"/, 'portas e alimentação não devem virar textos decorativos');
  assertBalancedSExpression(result.content);
  assert.equal(parseSExpression(result.content)[0].atom, 'kicad_sch');
});

test('cria símbolo de alimentação embutido para redes personalizadas sem convertê-las em texto', () => {
  const design = loadExample('mosfet_port_symbols.json');
  design.nets = [{ name: 'GATE', type: 'input' }, { name: 'V+', type: 'power' }, { name: 'V-', type: 'power' }];
  design.connections = [
    { net: 'GATE', pins: ['Q1.1'] },
    { net: 'V-', pins: ['Q1.2'] },
    { net: 'V+', pins: ['Q1.3'] }
  ];
  const result = generator.generate(design);
  assert.match(result.content, /\(symbol "KiCadText2Sch:Power_V_[A-Za-z0-9_]+"/);
  assert.match(result.content, /\(property "Value" "V\+"/);
  assert.match(result.content, /\(property "Value" "V-"/);
  assert.doesNotMatch(result.content, /\(label "V\+"|\(global_label "V\+"/);
  assert.equal(result.summary.powerSymbols, 2);
  assertBalancedSExpression(result.content);
});

test('validação rejeita tipo de rede visual desconhecido', () => {
  const design = loadExample('mosfet_port_symbols.json');
  design.nets[0].type = 'analog_input';
  assert.throws(() => generator.validateStructure(design), /tipo de rede.*não suportado/i);
});


test('símbolo GND deixa margem entre a grafia e a geometria do terra', () => {
  const result = generator.generate(loadExample('mosfet_port_symbols.json'), { date: '2026-10-20' });
  const instance = result.content.match(/\(symbol\s+\(lib_id "power:GND"\)[\s\S]*?\(instances/);
  assert.ok(instance, 'deve existir uma instância nativa de power:GND');
  assert.match(instance[0], /\(property "Value" "GND" \(at [0-9.]+ ([0-9.]+) 0\)/);
  assert.match(instance[0], /\(fields_autoplaced no\)/);
});


test('gera o PID de quatro LM741 com V+/V- e pinos NC explícitos', () => {
  const design = loadExample('pid_controller_lm741.json');
  const result = generator.generate(design, { date: '2026-10-21' });
  assert.equal(result.summary.components, 14);
  assert.equal(result.summary.pinConnections, 40);
  assert.equal(result.summary.noConnectPins, 12);
  assert.equal(result.summary.powerSymbols, 12);
  assert.equal(result.summary.routingMode, 'pin-labels');
  assert.match(result.content, /\(property "Value" "V\+"/);
  assert.match(result.content, /\(property "Value" "V-"/);
  assert.match(result.content, /\(symbol "KiCadText2Sch:Power_V_[A-Za-z0-9_]+"/);
  assert.equal((result.content.match(/\(no_connect \(at/g) || []).length, 8, 'pinos 1 e 5 de cada LM741 recebem marcadores; pino 8 é NC intrínseco e oculto');
  for (const ref of ['U1', 'U2', 'U3', 'U4']) assert.match(result.content, new RegExp(`\\(property \"Reference\" \"${ref}\"`));
  assertBalancedSExpression(result.content);
  assert.equal(parseSExpression(result.content)[0].atom, 'kicad_sch');
});

test('PID user-provided pinout and custom power rails are generated as embedded symbols', () => {
  const design = loadExample('pid_controller_lm741.json');
  const result = generator.generate(design, { date: '2026-10-21' });
  const ast = parseSExpression(result.content);
  const asText = result.content;
  assert.equal(result.summary.components, 14);
  assert.equal(result.summary.pinConnections, 40);
  assert.equal(result.summary.noConnectPins, 12);
  assert.match(asText, /\(symbol "KiCadText2Sch:Power_V_[A-Za-z0-9_]+"/);
  assert.match(asText, /\(property "Value" "V\+"/);
  assert.match(asText, /\(property "Value" "V-"/);
  assert.equal((asText.match(/\(no_connect \(at/g) || []).length, 8);
  assertBalancedSExpression(asText);
  assert.equal(ast[0].atom, 'kicad_sch');
});

test('o catálogo inclui fixtures para LM741, SCR, DIAC e SIDAC', () => {
  const names = ['opamp_pinout_test.json', 'scr_thyristor_test.json', 'diac_trigger_test.json', 'sidac_generic_test.json', 'pid_controller_lm741.json'];
  for (const name of names) {
    const design = loadExample(name);
    assert.doesNotThrow(() => generator.generate(design), `${name} deve gerar no motor web`);
  }
});


test('LM741 has correctly closed body sub-symbols; no nested symbol is treated as a graphic primitive', () => {
  const result = generator.generate(loadExample('pid_controller_lm741.json'), { date: '2026-10-21' });
  const ast = parseSExpression(result.content);
  const libSymbols = sexpChild(ast, 'lib_symbols');
  assert.ok(libSymbols);
  const topSymbols = sexpChildren(libSymbols, 'symbol');
  const lm741 = topSymbols.find((node) => node[1] && node[1].string === 'Amplifier_Operational:LM741');
  assert.ok(lm741, 'definição do LM741 deve estar embutida');
  for (const sub of sexpChildren(lm741, 'symbol')) {
    for (const item of sub.slice(2)) {
      const tagName = sexpTag(item);
      assert.ok(['arc', 'bezier', 'circle', 'pin', 'polyline', 'rectangle', 'text'].includes(tagName),
        `o corpo ${sub[1].string} contém item inválido ${tagName}; sub-símbolos não podem estar aninhados entre si`);
    }
  }
});

const EXTERNAL_SCR_LIBRARY = `(kicad_symbol_lib (version 20250114) (generator "eeschema")
  (symbol "TestSCR"
    (pin_names (offset 0))
    (exclude_from_sim no) (in_bom yes) (on_board yes)
    (property "Reference" "Q" (at 0 5.08 0) (effects (font (size 1.27 1.27))))
    (property "Value" "TestSCR" (at 0 -5.08 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "Package_TO_SOT_THT:TO-220-3_Vertical" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
    (property "Description" "User-provided SCR fixture" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))
    (symbol "TestSCR_0_1"
      (polyline (pts (xy -2.54 2.54) (xy 2.54 2.54) (xy 0 0) (xy -2.54 2.54)) (stroke (width 0.254) (type default)) (fill (type none)))
    )
    (symbol "TestSCR_1_1"
      (pin passive line (at 0 5.08 270) (length 2.54) (name "A" (effects (font (size 1.27 1.27)))) (number "1" (effects (font (size 1.27 1.27)))))
      (pin input line (at -5.08 -2.54 0) (length 2.54) (name "G" (effects (font (size 1.27 1.27)))) (number "2" (effects (font (size 1.27 1.27)))))
      (pin passive line (at 0 -5.08 90) (length 2.54) (name "K" (effects (font (size 1.27 1.27)))) (number "3" (effects (font (size 1.27 1.27)))))
    )
    (embedded_fonts no)
  )
)`;

test('saved PID v20 fixture is syntactically balanced and contains valid sibling LM741 symbol bodies', () => {
  const source = fs.readFileSync(path.join(root, 'tests', 'fixtures', 'pid_controller_lm741_v20.kicad_sch'), 'utf8');
  assertBalancedSExpression(source);
  const ast = parseSExpression(source);
  assert.equal(ast[0].atom, 'kicad_sch');
  const libSymbols = sexpChild(ast, 'lib_symbols');
  const lm741 = sexpChildren(libSymbols, 'symbol').find((node) => node[1] && node[1].string === 'Amplifier_Operational:LM741');
  assert.ok(lm741, 'o fixture deve embutir a definição de LM741');
  const subNames = sexpChildren(lm741, 'symbol').map((node) => node[1].string);
  assert.deepEqual(subNames, ['LM741_0_1', 'LM741_1_1']);
  for (const sub of sexpChildren(lm741, 'symbol')) {
    for (const child of sub.slice(2)) assert.ok(['arc', 'bezier', 'circle', 'pin', 'polyline', 'rectangle', 'text'].includes(sexpTag(child)));
  }
  assert.match(source, /KiCadText2Sch:Power_V_/);
  assert.match(source, /\(no_connect \(at /);
});

test('imports a user-provided .kicad_sym locally and generates a schematic with the embedded custom symbol', () => {
  const imported = customImporter.importLibrary(EXTERNAL_SCR_LIBRARY, 'External');
  assert.deepEqual(imported.importedNames, ['External:TestSCR']);
  assert.deepEqual(imported.symbols['External:TestSCR'].pins.map((pin) => pin.number), ['1', '2', '3']);
  assert.equal(imported.symbols['External:TestSCR'].defaultFootprint, 'Package_TO_SOT_THT:TO-220-3_Vertical');
  const design = {
    meta: { title: 'Custom SCR import test', top_name: 'custom_scr_import_test' },
    nets: [{ name: 'ANODE', type: 'input' }, { name: 'GATE', type: 'input' }, { name: 'CATHODE', type: 'output' }],
    parts: [{ lib: 'External', name: 'TestSCR', ref: 'Q1', value: 'S8025R' }],
    connections: [
      { net: 'ANODE', pins: ['Q1.1'] },
      { net: 'GATE', pins: ['Q1.2'] },
      { net: 'CATHODE', pins: ['Q1.3'] }
    ]
  };
  const result = generator.generate(design, { date: '2026-10-21', customSymbols: imported.symbols });
  assert.equal(result.summary.components, 1);
  assert.match(result.content, /\(symbol "External:TestSCR"/);
  assert.match(result.content, /\(lib_id "External:TestSCR"\)/);
  assert.match(result.content, /\(property "Footprint" "Package_TO_SOT_THT:TO-220-3_Vertical"/);
  assertBalancedSExpression(result.content);
  assert.equal(parseSExpression(result.content)[0].atom, 'kicad_sch');
});

test('importa símbolos multi-unit e resolve extends quando a base está na mesma biblioteca', () => {
  const source = fs.readFileSync(path.join(root, 'tests', 'fixtures', 'multi_unit_opamp.kicad_sym'), 'utf8');
  const imported = customImporter.importLibrary(source, 'External');
  assert.ok(imported.importedNames.includes('External:LM358P'));
  assert.ok(imported.importedNames.includes('External:LM358P_Extended'));
  assert.ok(imported.importedNames.includes('External:BC337'), 'um símbolo de unidade única deve continuar importável na biblioteca que também contém unidades múltiplas');
  assert.equal(customImporter.version, '0.22.0-alpha');
  assert.ok(imported.symbols['External:LM358P'].importNotes.some((note) => /estilo primário/i.test(note)));
  assert.deepEqual(imported.symbols['External:BC337'].units, [1]);
  assert.equal(imported.symbols['External:BC337'].pins.length, 3);
  const symbol = imported.symbols['External:LM358P_Extended'];
  assert.deepEqual(symbol.units, [1, 2, 3]);
  assert.equal(imported.symbols['External:LM358P'].pins.length, 8, 'pinos do estilo gráfico alternativo não devem duplicar o mapa de pinos físico');
  assert.deepEqual(symbol.pins.map((pin) => [pin.number, pin.unit]), [['3',1],['2',1],['1',1],['5',2],['6',2],['7',2],['8',3],['4',3]]);
  assert.doesNotMatch(symbol.definition, /\(extends/);
  const design = {
    meta: { title: 'Imported multi-unit op amp', top_name: 'imported_multi_unit_test' },
    nets: [{ name: 'IN1', type: 'input' }, { name: 'FB1', type: 'passive' }, { name: 'OUT1', type: 'output' }, { name: 'IN2', type: 'input' }, { name: 'FB2', type: 'passive' }, { name: 'OUT2', type: 'output' }, { name: 'V+', type: 'power' }, { name: 'V-', type: 'power' }],
    parts: [{ lib: 'External', name: 'LM358P_Extended', ref: 'U1', value: 'LM358P' }],
    connections: [{ net: 'IN1', pins: ['U1.3'] }, { net: 'FB1', pins: ['U1.2'] }, { net: 'OUT1', pins: ['U1.1'] }, { net: 'IN2', pins: ['U1.5'] }, { net: 'FB2', pins: ['U1.6'] }, { net: 'OUT2', pins: ['U1.7'] }, { net: 'V+', pins: ['U1.8'] }, { net: 'V-', pins: ['U1.4'] }]
  };
  const result = generator.generate(design, { customSymbols: imported.symbols, date: '2026-10-21' });
  assert.equal(result.summary.components, 1);
  assert.equal(result.summary.graphicalUnits, 3);
  assert.equal(result.summary.totalSheets, 1, 'as três unidades do LM358 devem ficar juntas quando cabem numa folha');
  assert.equal(result.summary.layoutPlacements.filter((placement) => placement.ref === 'U1').length, 3);
  assert.equal(new Set(result.summary.layoutPlacements.filter((placement) => placement.ref === 'U1').map((placement) => placement.page)).size, 1);
  assert.equal((result.content.match(/\(lib_id \"External:LM358P_Extended\"\)/g) || []).length, 3);
  assert.match(result.content, /\(unit 1\)/);
  assert.match(result.content, /\(unit 2\)/);
  assert.match(result.content, /\(unit 3\)/);
  assertBalancedSExpression(result.content);
  assert.throws(() => customImporter.importLibrary('(kicad_pcb)', 'External'), /não parece ser uma biblioteca/i);
});
