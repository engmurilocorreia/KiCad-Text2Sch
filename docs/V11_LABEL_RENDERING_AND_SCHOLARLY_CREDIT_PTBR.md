# v11 — Labels visuais e crédito acadêmico

## Correções de serialização

- Global labels input/output agora incluem `(fields_autoplaced)` e a propriedade oculta `Intersheetrefs`, seguindo a estrutura encontrada em esquemas nativos do KiCad.
- O alinhamento de global labels utiliza `left`/`right` sem adicionar `bottom`, reduzindo diferenças em relação aos exemplos nativos.
- O texto do símbolo GND foi afastado para 5,08 mm do pino de referência, para reduzir o risco de sobreposição com a geometria do símbolo.
- A URL de scripts e estilos tem query de versão `v=11` para evitar a reutilização de assets antigos em cache.
- O crédito do projeto e o `CITATION.cff` usam o nome completo **Murilo Guimarães Correia**. O ORCID informado em materiais acadêmicos prévios foi incluído: `https://orcid.org/0009-0000-0567-546X`.

## Validação necessária

Os testes automatizados conferem a estrutura S-expression, metadados dos global labels e posição de campo GND. Ainda é obrigatório abrir o `.kicad_sch` no KiCad 10.0.7 e verificar visualmente os símbolos, exportar a netlist e analisar o ERC. Testes sintáticos não garantem renderização correta nem correção elétrica.
