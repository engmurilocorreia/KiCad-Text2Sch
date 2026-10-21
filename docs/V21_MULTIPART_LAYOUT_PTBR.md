# v21 — Importação multi-unit e layout A4 por compactação

## Importador de símbolos

- Suporta símbolos de uma ou várias unidades gráficas (até 16 unidades).
- Suporta definições derivadas com `extends` quando o símbolo base está presente na mesma biblioteca `.kicad_sym` importada.
- Mostra o mapa de pinos incluindo o número da unidade para ajudar a interpretar símbolos complexos.
- Continua recusando estilos gráficos alternativos/De Morgan e símbolos que repetem números de pinos de forma ambígua.
- Importação local no navegador; não instala footprints, modelos 3D ou modelos SPICE.

## Layout A4

O layout genérico usa compactação por linhas (shelf packing) com envelopes estimados a partir dos limites do símbolo, campos Reference/Value, stubs dos pinos, labels e símbolos de alimentação. A alocação mantém uma folga entre envelopes e verifica uma área útil A4 landscape reservada para margens e bloco de título.

Se a próxima linha não couber verticalmente, o motor inicia uma folha de circuito adicional. Quando são necessárias múltiplas folhas, a exportação baixa um ZIP que contém o esquema raiz e as folhas-filhas; extraia todos os ficheiros e abra o esquema raiz no KiCad. Labels globais preservam as ligações entre folhas.

A separação hierárquica é experimental: antes de usar um projeto, abra o esquema raiz no KiCad 10, exporte a netlist e execute o ERC. O algoritmo não faz um agrupamento semântico completo de blocos e não substitui a revisão visual de engenharia. `meta.auto_split_sheets: false` faz o gerador falhar com uma mensagem clara em vez de gerar uma exportação multi-folha.

## Novo fixture

`inputs/boost_converter_test.json` é um circuito de sete componentes usado para verificar que o layout compacto cabe em A4. `inputs/multisheet_layout_stress_test.json` é uma fixture sintética que força o caminho de exportação hierárquica. Não é um circuito funcional. `tests/fixtures/multi_unit_opamp.kicad_sym` valida importação de um amplificador dual de três unidades e o caso de herança `extends`.
