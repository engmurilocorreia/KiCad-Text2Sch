const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('interface v22 tem assets versionados, idiomas, tema, GitHub mark e crédito abreviado', () => {
  const html = read('web/index.html');
  const app = read('web/app.js');
  const css = read('web/styles.css');
  assert.match(html, /https:\/\/github\.com\/engmurilocorreia\/KiCad-Text2Sch/);
  assert.match(html, /id="browserGenerateBtn"/);
  assert.match(html, /Desenvolvido por Murilo G\. Correia/);
  assert.doesNotMatch(html, /Desenvolvido por Murilo Guimarães Correia/);
  assert.match(html, /assets\/github-mark\.svg\?v=24\.0\.0/);
  assert.match(html, /assets\/logo-mark\.svg\?v=24\.0\.0/);
  assert.match(html, /assets\/favicon\.svg\?v=24\.0\.0/);
  assert.match(html, /id="languageSelect"/);
  for (const lang of ['pt-BR', 'en', 'pt-PT', 'es']) assert.match(html, new RegExp(`option value="${lang}"`));
  assert.match(html, /id="themeToggle"/);
  assert.match(html, /id="copyAiPromptBtn"/);
  assert.match(app, /const AI_PROMPTS = Object\.freeze/);
  assert.match(app, /V\+/);
  assert.match(app, /V\-/);
  for (const key of ["aiPromptEyebrow", "aiPromptTitle", "aiPromptBody", "aiPromptDocs", "copyAiPrompt", "promptCopied", "promptCopyFailed"]) {
    assert.equal((app.match(new RegExp(`${key}:`, "g")) || []).length, 4, `${key} deve ter tradução nos quatro idiomas`);
  }
  assert.match(app, /async function copyAiPrompt/);
  assert.match(app, /navigator\.clipboard\.writeText/);
  for (const key of ["pt-BR", "en", "pt-PT", "es"]) assert.match(app, new RegExp(`\"${key}\":`));
  assert.match(html, /data-i18n="themeLight"/);
  assert.match(html, /not affiliated|não afiliado/i);
  for (const asset of ['symbol-catalog.js', 'custom-symbol-importer.js', 'zip-export.js', 'browser-generator.js', 'app.js', 'styles.css']) assert.match(html, new RegExp(`${asset.replace('.', '\\.')}\\?v=24\\.0\\.0`));
  assert.match(html, /value="pid_controller_lm741"/);
  assert.match(app, /kicad-text2sch-language/);
  assert.match(app, /kicad-text2sch-theme/);
  assert.match(app, /applyLanguage/);
  assert.match(app, /applyTheme/);
  for (const key of ['layoutProfile','layoutGaps']) assert.equal((app.match(new RegExp(`${key}:`, 'g')) || []).length, 4, `${key} deve ter tradução nos quatro idiomas`);
  assert.doesNotMatch(css, /fonts\.googleapis\.com/);
  assert.doesNotMatch(html, /OPEN SOURCE/i);
  assert.doesNotMatch(html, /Gerar com Python \(API\)/i);
  assert.doesNotMatch(html, /id="generateBtn"/);
  assert.doesNotMatch(html, /id="apiState"/);
});

test('aplicação web valida e gera localmente, sem chamadas à API', () => {
  const app = read('web/app.js');
  assert.match(app, /KiCadText2SchBrowser\.validateStructure/);
  assert.match(app, /KiCadText2SchBrowser\.generate/);
  assert.doesNotMatch(app, /apiBaseUrl|callApi|\/api\/v1\/generate|\/api\/v1\/validate|generateBtn/);
});

test('interface apresenta exemplos para diodo, NMOS, PMOS, NPN e PNP', () => {
  const html = read('web/index.html');
  const app = read('web/app.js');
  assert.match(html, /value="mosfet_port_symbols"/);
  assert.match(html, /value="mosfet_low_side_switch"/);
  assert.match(html, /value="bjt_common_emitter_test"/);
  assert.match(html, /value="diode_rectifier_test"/);
  assert.match(html, /value="p_mosfet_high_side_switch"/);
  assert.match(html, /value="bjt_pnp_high_side_test"/);
  assert.match(app, /mosfet_port_symbols: "examples\/mosfet_port_symbols\.json"/);
  assert.match(app, /mosfet_low_side_switch: "examples\/mosfet_low_side_switch\.json"/);
  assert.match(app, /bjt_common_emitter_test: "examples\/bjt_common_emitter_test\.json"/);
  assert.match(app, /diode_rectifier_test: "examples\/diode_rectifier_test\.json"/);
  assert.match(app, /p_mosfet_high_side_switch: "examples\/p_mosfet_high_side_switch\.json"/);
  assert.match(app, /bjt_pnp_high_side_test: "examples\/bjt_pnp_high_side_test\.json"/);
  assert.match(html, /value="p_mosfet_high_side_switch"/);
  assert.match(html, /value="bjt_pnp_high_side_test"/);
  assert.match(html, /value="pid_controller_lm741"/);
  assert.match(app, /pid_controller_lm741: \"examples\/pid_controller_lm741\.json\"/);
});


test('arquivos vetoriais da marca existem e declaram o wordmark correto', () => {
  const mark = read('web/assets/logo-mark.svg');
  const lockup = read('web/assets/logo-lockup.svg');
  const favicon = read('web/assets/favicon.svg');
  assert.match(mark, /<svg[^>]+viewBox="0 0 64 64"/);
  assert.match(lockup, /KiCad-<tspan fill="#079c83">Text2Sch<\/tspan>/);
  assert.match(favicon, /<svg/);
  assert.ok(fs.statSync(path.join(root, 'docs/assets/logo-preview.png')).size > 1000);
});


test('README e gitignore documentam prompt multilíngue e preservam fixtures de esquemas', () => {
  const readmePt = read('README.pt-BR.md');
  const readmeEn = read('README.en.md');
  const gitignore = read('.gitignore');
  const prompt = read('docs/AI_AUTHORING_PROMPT.md');
  assert.match(readmePt, /Português \(Brasil\), English, Português \(Portugal\) e Español/);
  assert.match(readmeEn, /Brazilian Portuguese, English, European Portuguese, and Spanish/);
  assert.match(readmePt, /modo claro e escuro/);
  assert.match(readmeEn, /light\/dark mode/);
  assert.match(prompt, /"name":"V\+"/);
  assert.match(prompt, /"name":"V-"/);
  assert.match(gitignore, /!tests\/fixtures\/\*\.kicad_sch/);
  assert.doesNotMatch(gitignore, /docs\/.*\.md/);
});


test('interface oferece importação local de bibliotecas .kicad_sym sem API', () => {
  const html = read('web/index.html');
  const app = read('web/app.js');
  const importer = read('web/custom-symbol-importer.js');
  assert.match(html, /id="customSymbolFile"[^>]+accept="\.kicad_sym/);
  assert.match(html, /id="customSymbolNamespace"/);
  assert.match(html, /id="importCustomSymbolsBtn"/);
  assert.match(html, /id="customSymbolStatus"/);
  assert.match(app, /KiCadText2SchCustomSymbolImporter\.importLibrary/);
  assert.match(app, /customSymbols: importedSymbols/);
  assert.match(app, /const pinMaps = imported\.importedNames\.map/);
  assert.match(app, /customPinMap/);
  assert.match(importer, /MAX_FILE_BYTES/);
  assert.match(importer, /multi-unit|multi-unit|múltiplas unidades|extends/i);
  assert.doesNotMatch(app, /fetch\([^)]*customSymbolFile|uploadCustomSymbol/i);
  for (const key of ['customLibraryTitle','customLibraryBody','customLibraryNamespaceLabel','customLibraryNamespaceHint','customLibraryFileLabel','importCustomSymbols','customImportEmpty','customImporting','customImportSuccess','customImportPartial','customImportFailed','customImportPrivacy','customImporterVersion','customImportNotes','customImportedSymbols','customPinMap']) {
    assert.equal((app.match(new RegExp(`${key}:`, 'g')) || []).length, 4, `${key} deve estar traduzida nos quatro idiomas`);
  }
});
