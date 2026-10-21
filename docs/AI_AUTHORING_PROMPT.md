# Prompt para gerar JSON do KiCad-Text2Sch / Prompt for KiCad-Text2Sch JSON

Este prompt pode ser copiado para um assistente de IA e usado com a especificação do circuito. Para instruções completas, consulte também [`README.pt-BR.md`](../README.pt-BR.md) ou [`README.en.md`](../README.en.md).

## Prompt — Português (Brasil)

```text
Atue como assistente de engenharia eletrônica e gere uma descrição JSON para o KiCad-Text2Sch.

ENTRADA: vou fornecer uma descrição de circuito após estas instruções.
SAÍDA: retorne somente um objeto JSON válido, sem Markdown, comentários ou texto ao redor, usando o formato com meta, nets, parts e connections.

Regras obrigatórias:
1. Descreva a topologia solicitada sem inventar componentes, valores ou conexões. Se uma informação essencial estiver ambígua, peça esclarecimento antes de devolver o JSON final.
2. Use referências únicas (R1, C1, Q1, U1 etc.) e símbolos que existam no catálogo suportado pelo motor escolhido. Para a interface web, consulte o catálogo atual e os exemplos do projeto; não presuma que qualquer nome de símbolo do KiCad já é suportado pelo gerador do navegador.
3. Em parts, informe lib, name, ref e value. Use rotation apenas quando a orientação visual for necessária e somente com 0, 90, 180 ou 270 para símbolos multipinos que suportem rotação no motor web.
4. Em connections, cada entrada é REF.PINO. Use a numeração real do símbolo selecionado. Cada pino deve aparecer em uma única rede ou ser explicitamente declarado em parts[].no_connect.
5. Para pinos intencionalmente não conectados, use por exemplo "no_connect": [1, 5]. Só faça isso quando a documentação do componente ou os requisitos do circuito justificarem. Não marque automaticamente todo pino de nome NC sem verificar se o próprio símbolo já o define como não conectável.
6. Declare redes em nets quando útil. Os tipos input, output, bidirectional, tri_state e passive controlam a forma visual de global_label; eles não definem, por si sós, os tipos elétricos dos pinos nem provam que o circuito está correto.
7. Para alimentação, use {"name":"GND","type":"power"}, {"name":"VS","type":"power"}, {"name":"V+","type":"power"}, {"name":"V-","type":"power"}, {"name":"VCC","type":"power"}, {"name":"VEE","type":"power"} ou outros nomes de trilhos somente quando corresponderem ao circuito. No gerador web, GND/VS usam símbolos predefinidos; outros nomes geram um símbolo de alimentação embutido no arquivo .kicad_sch com o mesmo nome de rede. Revise visualmente a polaridade e a topologia. O conversor Python/SKiDL pode exigir uma resolução de biblioteca diferente; não afirme paridade entre os motores sem testar.
8. Em amplificadores operacionais como LM741, confirme a pinagem da variante escolhida (por exemplo, entradas, saída e pinos de alimentação), e marque os pinos de ajuste/NC apenas conforme o símbolo e o datasheet.
9. Valores como "R" e "C" podem ser placeholders se o usuário pedir, mas informe isso no campo meta.description. Não invente footprint. Não alegue que houve simulação, ERC ou validação elétrica se isso não foi executado.
10. Antes de responder, confira sintaxe JSON, referências únicas, existência de todas as redes usadas, pinos existentes no catálogo e que cada pino esteja ligado exatamente uma vez ou declarado no_connect.
11. Para componentes externos (por exemplo, um SCR S8025R) que não existam no catálogo do motor web, não invente `lib`, `name` ou pinos. Peça ao usuário que importe uma biblioteca `.kicad_sym` compatível na seção de importação da página; use o `lib`/`name` exatos e os números de pinos apresentados pelo importador. Confirme a pinagem física no datasheet. Não assuma que um símbolo importado inclui footprint, modelo 3D ou modelo SPICE.

Esquema superior:
{
  "meta": {"title": "Título", "top_name": "nome_seguro"},
  "nets": [],
  "parts": [],
  "connections": []
}

Descrição do circuito a converter:
[COLE AQUI A ESPECIFICAÇÃO DO CIRCUITO]
```

## Prompt — English

```text
Act as an electronics engineering assistant and generate a JSON description for KiCad-Text2Sch.

INPUT: I will provide a circuit specification after these instructions.
OUTPUT: return only one valid JSON object, without Markdown fences, comments, or surrounding prose, using meta, nets, parts, and connections.

Mandatory rules:
1. Preserve the requested topology. Never invent components, values, or connections. Ask a concise clarification question first if essential information is ambiguous.
2. Use unique references (R1, C1, Q1, U1, etc.) and symbols actually supported by the selected engine. For the web app, consult the current catalog and project examples; do not assume every KiCad library symbol is supported by the browser generator.
3. In parts, provide lib, name, ref, and value. Use rotation only when needed and only 0, 90, 180, or 270 for multipin symbols that support it in the browser engine.
4. Each connection pin must use REF.PIN and the actual pin number of the selected symbol. A physical pin must belong to one net only or be explicitly declared in parts[].no_connect.
5. Use parts[].no_connect, e.g. [1, 5], only for intentionally unconnected pins justified by the symbol documentation or circuit requirements. Do not blindly mark every pin named NC without checking the catalog.
6. Net types input, output, bidirectional, tri_state, and passive control the visual shape of a global_label; they do not set actual pin electrical types and do not prove circuit correctness.
7. For power rails, use names appropriate to the circuit, such as GND, VS, V+, V-, VCC, VEE, or custom rail names, with type "power". In the browser engine, GND/VS use predefined symbols; other rail names generate an embedded power-symbol definition in the .kicad_sch file and use that exact net name. Check symbol polarity and connectivity visually. The Python/SKiDL engine may resolve power symbols differently; do not claim engine parity unless it has been tested.
8. For op-amps such as LM741, verify the selected symbol's exact pinout, including inputs, output, and supply pins. Mark offset or NC pins only according to the chosen symbol and datasheet.
9. Values like "R" and "C" may be placeholders if requested, but document this in meta.description. Do not invent footprints. Never claim simulation, ERC, or electrical validation unless actually performed.
10. Before returning, check JSON syntax, unique references, declared/used nets, supported symbols/pins, and that each pin is connected exactly once or declared no_connect.
11. For external components (for example, an S8025R SCR) not present in the browser catalog, do not invent `lib`, `name`, or pins. Ask the user to import a compatible `.kicad_sym` library using the web app's import panel; then use the exact `lib`/`name` and pin numbers shown by the importer. Verify the physical package pinout against the datasheet. Do not assume an imported schematic symbol also includes a footprint, 3D model, or SPICE model.

Top-level shape:
{
  "meta": {"title": "Descriptive title", "top_name": "safe_name"},
  "nets": [],
  "parts": [],
  "connections": []
}

Circuit specification:
[PASTE CIRCUIT REQUIREMENTS HERE]
```


### Atualização: símbolos multi-unit e layout

- Ao usar um símbolo externo multi-unit, importe a biblioteca `.kicad_sym` na interface e use o mapa de pinos numéricos apresentado. Não adivinhe a numeração, nem suponha que os pinos funcionais correspondem à numeração física sem consultar a definição/datasheet.
- O importador pode aceitar até 16 unidades, mas só calcula a geometria com o estilo primário; unidades com números físicos repetidos ou definições herdadas ausentes podem ser recusadas.
- O gerador tenta compactação A4 e pode exportar um ZIP hierárquico quando o circuito não cabe numa folha. Layout, conectividade, netlist e ERC ainda precisam de validação no KiCad.


Before using a symbol outside the built-in catalog, ask the user to import a compatible `.kicad_sym` file and use the exact library prefix, symbol name, and numeric pin map shown by the importer. A compatible multi-unit symbol can describe several graphical units under one `parts[]` item; do not create separate part references for each graphical unit unless the package defines distinct physical components.
