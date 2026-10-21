# v10 — labels tipados, símbolos de alimentação e licença

## Correção do caso MOSFET

A captura da versão anterior mostrava `GATE`, `LOAD` e `GND` como texto visual. Isso é inadequado para as portas de sinal e para o terra. Na v10, o JSON declara a intenção da rede e o motor gera o objeto KiCad apropriado:

```json
{
  "nets": [
    { "name": "GATE", "type": "input" },
    { "name": "LOAD", "type": "output" },
    { "name": "GND", "type": "power" }
  ]
}
```

Para `Transistor_FET:Q_NMOS_GSD`, o exemplo conecta `Q1.1` a `GATE`, `Q1.3` a `LOAD` e `Q1.2` a `GND`. O resultado usa:

- `global_label` com `(shape input)` para `GATE`;
- `global_label` com `(shape output)` para `LOAD`;
- uma instância real de símbolo `power:GND`, não um texto ou label local `GND`.

Tipos visuais aceitos: `input`, `output`, `bidirectional`, `tri_state` e `passive`. São formatos visuais de global labels; não alteram o tipo elétrico dos pinos do componente. Uma global label liga nomes iguais globalmente no esquema; use nomes distintos quando não desejar conectividade.

No motor do navegador, `type: "power"` oferece neste momento apenas `GND` e `VS`, mapeados para símbolos nativos do catálogo incorporado. Outros nomes de alimentação são recusados intencionalmente, em vez de aparecerem como texto sem semântica de alimentação. Para suportar `AGND`, `VCC`, `VDD`, `+12V` etc., adicione a definição nativa correspondente, metadados/pinos, proveniência e testes específicos.

## Licença e crédito

- **Código original, frontend e documentação do projeto:** Apache License 2.0 (`LICENSE`).
- **Créditos de autoria:** `NOTICE` identifica Murilo Guimarães Correia como autor principal; `CITATION.cff` dá uma forma citável e o rodapé do frontend fornece crédito visível nesta distribuição.
- **Catálogo `web/symbol-catalog.js`:** CC BY-SA 4.0, pois o arquivo embute definições adaptadas das bibliotecas oficiais de símbolos do KiCad. Ver `THIRD_PARTY_NOTICES.md`.

A licença upstream das bibliotecas KiCad inclui uma exceção para os projetos eletrônicos e arquivos de esquema gerados: usar os símbolos não obriga, por si só, o usuário a publicar o circuito produzido sob CC BY-SA. A obrigação CC BY-SA continua relevante quando se redistribuem as próprias definições de símbolos adaptadas como coleção/catálogo.

A Apache-2.0 é uma licença open source padrão, permissiva, e exige que avisos aplicáveis sejam mantidos ao redistribuir o material coberto. O `NOTICE` ajuda a preservar a atribuição em redistribuições, mas a licença não exige que todo produto derivado exiba crédito em cada tela. Por isso, o projeto também mantém crédito visível no seu próprio frontend. A Creative Commons recomenda não usar licenças CC como licença principal para software; a CC BY-SA neste repositório é usada para o catálogo de símbolos adaptados, respeitando a licença upstream. Consulte as fontes oficiais antes de alterar o escopo: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.html), [orientação Apache sobre aplicação da licença](https://www.apache.org/legal/apply-license.html), [FAQ da Creative Commons sobre software](https://creativecommons.org/faq/) e [licença das bibliotecas de símbolos KiCad](https://gitlab.com/kicad/libraries/kicad-symbols/-/blob/master/LICENSE.md).

Se a exigência for impor crédito visual obrigatório em todas as redistribuições, isso não é garantido pela Apache-2.0 por si só; uma cláusula personalizada pode deixar de ser uma licença open source padrão. A recomendação é manter a licença padrão e o mecanismo NOTICE/CITATION/rodapé, em vez de inventar uma licença.

## Critério de validação da v10

Execute `npm run test:browser` e `pytest -q`; depois gere `mosfet_port_symbols.json`, `circuit1.json` e `rlc_layout_test.json`. Abra cada arquivo no KiCad 10.0.7 e confira a forma das labels, o ícone de GND, a netlist e o ERC. Testes de S-expression não substituem a abertura no editor KiCad nem o ERC nativo.

## Próximas famílias de símbolos

Adicionar uma família por vez, não em lote:

1. Diodo retificador genérico e variantes de símbolo com mapeamento de pinos verificado.
2. P-MOSFET e PNP, complementando as duas famílias de transistor já presentes.
3. Amplificador operacional genérico de uma unidade; multi-unit/supply-unit fica para uma etapa própria.
4. SCR/thyristor com número, nome e tipo elétrico dos pinos conferidos com o símbolo KiCad escolhido.
5. DIAC e SIDAC depois que o SCR passar em geração, netlist, visual e ERC.

Cada entrada deve incluir a definição de origem licenciada, a versão do KiCad, descrição dos pinos, geometria/rotação, exemplo JSON focal, teste automático e verificação manual no KiCad 10.0.7. SCR e thyristor normalmente são termos para a mesma classe funcional, então não devem virar dois símbolos apenas por diferença de nome; a seleção depende das variantes realmente disponíveis na biblioteca.
