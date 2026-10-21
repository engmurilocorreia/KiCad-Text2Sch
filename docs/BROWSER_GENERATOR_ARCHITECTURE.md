# Arquitetura do gerador nativo de navegador

## Objetivo

Gerar um arquivo `.kicad_sch` inteiramente no navegador, sem backend, mantendo o conversor Python/SKiDL como via local mais abrangente e referência para integração com KiCad CLI. Os dois motores consomem o JSON v1; suas saídas não são garantidamente idênticas.

## Componentes

- `web/symbol-catalog.js`: catálogo versionado com identificadores, pinos, tipos elétricos, coordenadas e definições S-expression embutidas.
- `web/browser-generator.js`: validação da compatibilidade com o catálogo, normalização, layout, roteamento e serialização S-expression.
- `web/app.js`: editor JSON, validação local, seleção de exemplos e download do `.kicad_sch`. Não chama API.
- `web/index.html`: link para o repositório Python; não há botão para gerar via API.
- `tests-js/`: testes Node.js para catálogo, geração, validação dos pinos e contrato da interface.

## Símbolos suportados

- `Device:R`, `Device:C`, `Device:L`: dois pinos, com layout em escada para certas topologias e labels locais como fallback.
- `Transistor_FET:Q_NMOS_GSD`: MOSFET canal N genérico, pinos 1/G, 2/S e 3/D.
- `Transistor_FET:Q_PMOS_GSD`: MOSFET canal P genérico, pinos 1/G, 2/S e 3/D.
- `Transistor_BJT:Q_PNP_BCE`: TBJ PNP genérico, pinos 1/B, 2/C e 3/E.
- `Transistor_BJT:Q_NPN_BCE`: TBJ NPN genérico, pinos 1/B, 2/C e 3/E.

As definições ativas incorporadas são adaptações das bibliotecas oficiais `Transistor_FET` e `Transistor_BJT` do KiCad Symbols 10.0.5. O arquivo contém as definições embutidas, mas a compatibilidade precisa ser validada no KiCad 10.0.7. Antes de considerar esses símbolos estáveis, precisam ser abertos no KiCad 10.0.7, conferidos quanto à orientação e numeração dos pinos, e comparados com netlist/ERC.

## Regras de desenho

1. O JSON descreve componentes, referências, valores, redes e associação de cada pino a uma rede.
2. O catálogo determina se um símbolo é suportado e lista seus pinos válidos; pinos inexistentes são rejeitados.
3. Todos os pinos de um símbolo suportado precisam estar associados a uma rede. No-connect ainda não é implementado.
4. Circuitos compostos exclusivamente por símbolos de dois pinos podem usar o layout em escada. Quando há um símbolo multipino, o motor posiciona os componentes em uma grade e usa labels locais nos pinos para representar as redes.
5. O motor não declara que executou ERC, simulação, análise analógica ou verificação de fabricabilidade.
6. Toda nova família de símbolo precisa de mapeamento de pinos explícito, teste de S-expression, fixture JSON e validação manual no KiCad antes de ser divulgada como estável.

## Limitações

- Sem netlist nativa, ERC, simulação ou validação elétrica automatizada no navegador.
- Sem símbolos nativos de alimentação, no-connect, símbolos multi-unit, hierarquia de folhas ou roteamento ortogonal genérico.
- O layout multipino é uma grade simples com labels por pino, não um roteador profissional.
- Os testes de S-expression não provam que o KiCad aceite o arquivo nem que a conectividade seja eletricamente correta.

## Plano de expansão

1. Validar MOSFET e TBJ no KiCad 10.0.7, conferindo a geometria, os pinos, a netlist e o ERC.
2. Armazenar fixtures de esquemas e netlists gerados por uma versão fixa do KiCad.
3. Adicionar o amplificador operacional, incluindo símbolo multi-unit quando necessário.
4. Adicionar SCR, conferindo a ordem dos pinos A/G/K no símbolo escolhido.
5. Aprimorar a geometria e o layout com detecção de colisões de símbolo, fio, label e texto.


## Tipos de rede, portas e símbolos de alimentação (v10)

O formato JSON pode declarar `nets[].type`: `signal`/omitido gera label local; `input`, `output`, `bidirectional`, `tri_state` e `passive` geram `global_label` com shape de interface; `power` requer um símbolo nativo presente no mapa do gerador (atualmente `GND` e `VS`). `type` de porta é uma indicação gráfica, não substitui os tipos elétricos de pinos nem constitui ERC.

Os símbolos nativos de alimentação são incluídos no bloco `lib_symbols` do próprio arquivo e instanciados com referência `#PWRnnn`, UUID de símbolo/pino e caminho de instância da folha raiz. Em topologias R/C/L em escada, um símbolo é colocado no barramento da rede de alimentação; no layout genérico, cada terminal recebe seu stub/símbolo, e símbolos de mesma rede fazem conexão global no KiCad.
