# v12 — Diodo e roteamento ortogonal de labels verticais

## Mudanças

- `LOAD` e outras redes etiquetadas em pinos verticais agora usam um cotovelo ortogonal: um segmento curto ao longo do eixo do pino seguido por um pequeno segmento horizontal até o ponto de ancoragem da label. Isso mantém o texto horizontal e posiciona o rótulo ao lado do condutor, em vez de estender uma tag horizontal diretamente de um fio vertical.
- Labels em pinos superiores ficam à esquerda do segmento vertical; labels em pinos inferiores ficam à direita. Símbolos de alimentação continuam ancorados diretamente ao stub do pino.
- Adicionado `Device:D_Small`, derivado da definição oficial de KiCad Symbols 10.0.5. Metadados: pino 1 = K (catodo), pino 2 = A (anodo), com eixo nativo horizontal; o gerador gira o símbolo para que o terminal conectado à rede de rank superior fique acima.
- Adicionado `diode_rectifier_test.json`, com `D1` em série para `VOUT` e resistor de carga `R1` para GND. É um fixture de geração, não uma especificação de circuito de alimentação qualificado.
- Atualizados o catálogo, a lista de exemplos no browser, os testes, o workflow CI, README, roadmap, `CITATION.cff` e `CHANGELOG.md`.

## Testes

- `npm run test:browser` verifica catálogo/pinagem, roteamento em cotovelo, estruturas S-expression e o fixture de diodo.
- `pytest -q` verifica parser, exemplos e regressões Python.
- A aceitação final do formato requer abrir `diode_rectifier_test` e o fixture MOSFET no KiCad 10.0.7, exportar netlist e inspecionar ERC. Os testes de texto não demonstram renderização ou correção elétrica.

## Limitações

- O motor browser ainda não implementa SCR/thyristor, SIDAC/DIAC, AmpOp, P-MOSFET, PNP, unidades múltiplas, hierarquia ou ERC in-browser.
- `D_Small` é um símbolo genérico e não escolhe footprint nem qualifica a capacidade elétrica de um diodo físico.
