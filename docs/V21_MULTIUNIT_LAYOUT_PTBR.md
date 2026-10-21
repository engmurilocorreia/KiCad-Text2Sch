# Importação multi-unit e layout A4 — v21

## Bibliotecas `.kicad_sym`

O importador é local ao navegador e aceita símbolos simples ou multi-unit com até 16 unidades gráficas. Símbolos derivados (`extends`) são resolvidos quando a definição base está no mesmo arquivo. A geometria e o mapa de pinos usam o estilo gráfico primário; estilos alternativos/De Morgan podem permanecer embutidos, mas não são selecionáveis pelo JSON.

Uma biblioteca pode conter centenas de símbolos incompatíveis com a aplicação. O importador tenta importar todos os símbolos compatíveis e reporta os que foram ignorados. Se nenhum símbolo for importado, leia as razões por símbolo e confira a versão do importador apresentada na interface. Após atualizar o site, faça `Ctrl+F5` para recarregar os scripts versionados.

Limites: arquivo `.kicad_sym` de até 5 MiB, 1.500 símbolos por biblioteca, até 16 unidades e 100 pinos por símbolo. Números de pinos físicos repetidos em unidades diferentes são recusados, pois o formato atual `REF.PIN` não distingue duas representações gráficas ambíguas do mesmo número. Footprints, modelos 3D e modelos SPICE não são importados.

## Compactação A4

O gerador ordena componentes pela conectividade e tenta quatro perfis de espaçamento (`comfortable`, `compact`, `dense`, `very-compact`). O empacotador trabalha com envelopes estimados dos corpos dos símbolos, campos Reference/Value, stubs de pinos, labels e símbolos de alimentação. Primeiro tenta uma única folha A4 dentro da área útil reservada; só cria páginas adicionais depois de tentar compactar.

Se o circuito não couber em uma folha, o motor produz um ZIP com uma folha raiz e folhas-filhas hierárquicas. Extraia todos os arquivos do ZIP e abra o `.kicad_sch` raiz no KiCad. As labels globais mantêm a correspondência dos nomes de rede entre folhas. A propriedade `meta.auto_split_sheets: false` faz o gerador retornar erro em vez de gerar múltiplas folhas. O motor está limitado a 9 folhas de circuito.

## Limitações de layout

As caixas dos componentes são aproximações, não uma análise completa da geometria do editor do KiCad. Elas ajudam a evitar componentes fora da área útil e sobreposição entre envelopes estimados, mas ainda podem existir colisões entre fios, texto, labels ou detalhes de estilos gráficos alternativos. A separação de folhas é baseada em capacidade de layout e ordem de conectividade, não em compreensão semântica perfeita dos blocos. Sempre inspecione o esquema no KiCad, exporte a netlist e execute ERC antes de confiar no projeto.

## Fixtures

- `inputs/boost_converter_test.json`: sete componentes, usados para verificar que um Boost compacto cabe numa folha A4.
- `inputs/multisheet_layout_stress_test.json`: fixture sintética de 60 resistores para exercitar exportação multi-folha; não é um circuito funcional.
- `tests/fixtures/multi_unit_opamp.kicad_sym`: fixture local com nomes de amostra `LM358P`, `LM358P_Extended` e `BC337`, três unidades (incluindo alimentação comum), estilo alternativo, herança e símbolo de transistor de unidade única.
