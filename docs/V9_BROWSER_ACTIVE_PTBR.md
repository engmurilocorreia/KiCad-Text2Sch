# v9 — motor nativo do navegador e componentes ativos

## O que mudou

- A interface web deixa de apresentar o botão de geração por FastAPI. O fluxo principal gera `.kicad_sch` inteiramente no navegador e não envia o JSON a um servidor.
- O cabeçalho e o rodapé oferecem um link para o repositório Python: <https://github.com/engmurilocorreia/KiCad-Text2Sch>.
- O catálogo browser é versionado como `1.2.0` e inclui cinco símbolos: `Device:R`, `Device:C`, `Device:L`, `Transistor_FET:Q_NMOS_GSD` e `Transistor_BJT:Q_NPN_BCE`.
- As definições do MOSFET e do TBJ NPN foram adaptadas das bibliotecas oficiais KiCad Symbols `10.0.5`, com atribuição e licença documentadas em `THIRD_PARTY_NOTICES.md`.
- Dois exemplos foram adicionados: chave de baixa lateral com MOSFET N e estágio básico com TBJ NPN.
- Os testes verificam os identificadores oficiais, metadados de pinos, serialização S-expression, rejeição de pinos inválidos, exemplos e ausência de chamada à API no frontend.
- A versão Python/SKiDL continua separada e disponível para execução local; o frontend público não precisa instalar Python, SKiDL ou FastAPI.

## Estado de validação

Testes no ambiente de desenvolvimento desta versão:

- `npm run test:browser`: 17 testes aprovados.
- `pytest -q`: 31 testes aprovados e 1 ignorado.
- Os quatro exemplos de entrada atuais passaram em `--validate-only`.
- Os quatro arquivos browser-native gerados passaram pela checagem de equilíbrio da S-expression.

**Limitação:** não foi possível executar o KiCad CLI neste ambiente. Os dois esquemas MOSFET/TBJ ainda precisam ser abertos no KiCad 10.0.7 e verificados quanto à renderização, netlist e ERC antes de o suporte ser considerado estável. O layout multipino é uma grade com labels locais e não um autorroteador geral.


## v10 — portas tipadas e símbolos de alimentação nativos

A v10 acrescenta `type` semântico às redes JSON. Valores `input`, `output`, `bidirectional`, `tri_state` e `passive` produzem `global_label` com a forma visual correspondente do KiCad. `type: "power"` suporta, nesta versão, apenas os nomes `GND` e `VS`, gerando instâncias nativas `power:GND` e `power:VS`. Os nomes de alimentação não suportados são rejeitados em vez de degradados silenciosamente para texto.

O exemplo `inputs/mosfet_port_symbols.json` ilustra `GATE` como entrada, `LOAD` como saída e uma instância real de `GND`. As formas input/output são visuais e não alteram os tipos elétricos dos pinos. A saída ainda deve ser aberta no KiCad 10.0.7 e verificada com netlist/ERC antes de esses recursos serem considerados estáveis.

A licença do código original é Apache-2.0, enquanto as definições incorporadas de símbolos KiCad conservam CC BY-SA 4.0, conforme `THIRD_PARTY_NOTICES.md`.
