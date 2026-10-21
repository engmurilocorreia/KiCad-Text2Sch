# Motor nativo do navegador — KiCad-Text2Sch (alpha)

O frontend estático agora usa **somente o motor JavaScript do navegador** para gerar esquemas. Ele não envia o JSON ou o circuito a uma API. O conversor Python/SKiDL permanece no repositório para execução local, integração com bibliotecas instaladas e uso do KiCad CLI.

## Testar a interface

Na raiz do repositório:

```powershell
python -m http.server 5173 --directory web
```

Abra `http://127.0.0.1:5173`, escolha um exemplo e clique em **Gerar esquema KiCad**. Não é necessário instalar dependências Python para gerar os símbolos suportados no browser. O servidor HTTP local serve apenas HTML, CSS, JavaScript e exemplos; a conversão acontece no próprio navegador. Não abra o HTML via `file://`, pois o navegador pode bloquear o carregamento dos exemplos.

O link **Conversor Python e código-fonte** da interface abre o repositório: <https://github.com/engmurilocorreia/KiCad-Text2Sch>.

## Símbolos experimentais suportados no browser

- `Device:R`, `Device:C` e `Device:L`: componentes de dois pinos numerados `1` e `2`; topologias R/C/L em escada usam um roteamento ortogonal heurístico.
- `Device:D_Small`: diodo genérico com pino 1 = K (catodo) e pino 2 = A (anodo); o layout gira o símbolo para colocar o terminal associado à rede superior no topo. Inclui um exemplo de teste didático.
- Labels associados a pinos verticais usam dois segmentos ortogonais curtos para manter o texto horizontal e a tag ao lado do fio. Essa regra é heurística e precisa ser avaliada em circuitos mais densos.
- `Transistor_FET:Q_NMOS_GSD`: MOSFET canal N genérico, com pino 1 = G (gate), pino 2 = S (source) e pino 3 = D (drain).
- `Transistor_BJT:Q_NPN_BCE`: TBJ NPN genérico, com pino 1 = B (base), pino 2 = C (collector/coletor) e pino 3 = E (emitter/emissor).
- `Transistor_FET:Q_PMOS_GSD`: P-MOSFET genérico, com pino 1 = G (gate), pino 2 = S (source) e pino 3 = D (drain).
- `Transistor_BJT:Q_PNP_BCE`: TBJ PNP genérico, com pino 1 = B, pino 2 = C e pino 3 = E.
- `power:GND` e `power:VS`: símbolos nativos de alimentação para redes declaradas com `"type": "power"`.
- Redes `type: "input"`, `"output"`, `"bidirectional"`, `"tri_state"` ou `"passive"` são geradas como `global_label` com a forma correspondente. A forma é uma anotação visual e não modifica o tipo elétrico dos pinos.

Os símbolos de componentes e alimentação foram adaptados das definições oficiais do KiCad Symbols 10.0.5, incluindo geometria e metadados dos pinos. Ainda precisam ser validados no KiCad 10.0.7 (abertura, netlist e ERC) antes de serem considerados estáveis. Não selecionar footprint de PCB automaticamente: o encapsulamento depende do componente físico escolhido.

Exemplos novos:

- `inputs/mosfet_low_side_switch.json` — chave de baixa lateral com MOSFET N genérico.
- `inputs/bjt_common_emitter_test.json` — estágio simples com TBJ NPN.
- `inputs/mosfet_port_symbols.json` — teste focal de `GATE` (input), `LOAD` (output) e símbolo nativo `GND`.
- `inputs/diode_rectifier_test.json` — diodo `Device:D_Small` e resistor de carga; verifica pinos K/A e orientação vertical.
- `inputs/p_mosfet_high_side_switch.json` — teste browser-native de P-MOSFET com rotação explícita de 180°.
- `inputs/bjt_pnp_high_side_test.json` — teste browser-native de TBJ PNP e orientação de pinos.

São exemplos para testar a geração e a pinagem, não projetos eletrônicos qualificados para uso real.

## Limitações atuais

- Não suporta ainda amplificadores operacionais, SCR/thyristor, DIAC/SIDAC, outras variantes de MOSFET/BJT, conectores, símbolos de alimentação além de GND/VS, símbolos com várias unidades, hierarquia de folhas ou no-connects.
- A validação estrutural JSON não comprova a existência dos símbolos nem a correção elétrica. A geração verifica o catálogo e exige que todos os pinos declarados pelo símbolo estejam associados a uma rede.
- Para circuitos com componentes de mais de dois pinos, o layout usa uma grade simples. Redes sem tipo usam labels locais; redes `input`/`output` e similares usam labels globais com forma; `power:GND` e `power:VS` produzem símbolos nativos. Labels de mesmo nome representam conectividade; confira-a pela netlist do KiCad.
- O gerador não executa netlist nativa, ERC, simulação, análise de desempenho, verificação de footprint ou capacidade de fabricação no navegador.
- O roteamento de R/C/L e o posicionamento das legendas continuam heurísticos. A saída precisa ser aberta e inspecionada no KiCad.

**Não trate a geração browser alpha como substituta da via Python para recursos que ainda não estão implementados.** Os dois motores consomem o formato JSON v1, mas os conjuntos de símbolos, o layout e as garantias diferem.

## Licença e crédito

O código original do gerador e a documentação são oferecidos sob Apache-2.0. O `NOTICE` identifica Murilo Guimarães Correia como autor principal e `CITATION.cff` facilita a citação. O arquivo completo `web/symbol-catalog.js` é distribuído sob CC BY-SA 4.0 por conter definições adaptadas de símbolos do KiCad; veja `THIRD_PARTY_NOTICES.md`. Apache-2.0 exige manter os avisos aplicáveis em redistribuições do código coberto, mas não obriga cada aplicação derivada a manter crédito visual em sua interface.

## v10 — tipos de rede e alimentação nativa

A v10 diferencia três casos que antes podiam acabar desenhados como texto simples:

- Rede sem `type` ou com `type: "signal"`: label local KiCad.
- Rede `input`, `output`, `bidirectional`, `tri_state` ou `passive`: `global_label` com o formato visual correspondente.
- Rede `type: "power"`: instância nativa apenas para `GND` e `VS` no catálogo atual; um nome de alimentação ainda não suportado é recusado, não convertido silenciosamente em texto.

Exemplo de porta do MOSFET: `inputs/mosfet_port_symbols.json`. O pino de gate usa `GATE` como entrada visual, o drain usa `LOAD` como saída visual e o source usa o símbolo nativo `power:GND`. Os formatos input/output são rótulos globais e **não mudam o tipo elétrico dos pinos**. Os símbolos GND/VS também conectam pelo nome global da rede.

Veja a especificação completa e o escopo de licença em [`docs/V10_NET_PRESENTATION_AND_LICENSE_PTBR.md`](docs/V10_NET_PRESENTATION_AND_LICENSE_PTBR.md).

## Testes

```powershell
npm run test:browser
pytest -q
```

O primeiro comando roda testes JavaScript no Node.js (sem dependências npm de runtime). O segundo executa os testes Python. Os testes de S-expression e catálogo não substituem abrir cada novo `.kicad_sch` no KiCad 10.0.7, exportar netlist e analisar o ERC.

## Próximos passos técnicos

1. Abrir os exemplos MOSFET e TBJ no KiCad 10.0.7; verificar a aparência dos símbolos, numeração de pinos, netlist e ERC.
2. Ajustar as definições dos transistores se a representação incorporada não corresponder à biblioteca instalada.
3. Adicionar fixtures de referência e verificações automáticas de netlist no CI que use uma versão fixa do KiCad.
4. Acrescentar AmpOp e SCR um de cada vez, incluindo metadados de pinos, unidades, símbolo e teste de geração.
5. Melhorar layout e colisões de labels/fios, sem confundir qualidade visual com validade elétrica.

## v13 — Correção de cache, P-MOSFET e PNP

A versão v13 acrescenta URLs com cache-busting (`v=13.0.0`) para impedir que o navegador reutilize o catálogo antigo; a tela de geração também apresenta as versões do motor e catálogo. O catálogo inclui `Transistor_FET:Q_PMOS_GSD` e `Transistor_BJT:Q_PNP_BCE`. Os exemplos usam `rotation: 180` para posicionar os terminais source/emitter acima dos terminais drain/collector em testes high-side. O campo `rotation` aceita 0, 90, 180 ou 270 graus; o motor browser só o permite nesta versão para símbolos multipinos. O motor Python traduz esse hint para a transformação `symtx` do SKiDL. Para símbolos ativos, esse posicionamento é um parâmetro de apresentação; ainda confirme pinagem, netlist e ERC no KiCad.

## v12 — Diodo e labels em pinos verticais

Veja [`docs/V12_DIODE_AND_VERTICAL_LABEL_ROUTING_PTBR.md`](docs/V12_DIODE_AND_VERTICAL_LABEL_ROUTING_PTBR.md) para detalhes do diodo `Device:D_Small` e do roteamento ortogonal usado para labels ligadas a pinos verticais.
