# KiCad-Text2Sch v5 — validação pelo KiCad CLI

## Por que mudar a geração de netlist?

Na versão anterior, `--netlist` chamava `skidl.generate_netlist()` sobre o circuito em memória. O exemplo de layout não atribui footprints físicos aos componentes (intencionalmente), e o SKiDL emitia mensagens `No footprint for ...`. Isso misturava a validação da conectividade do esquema com a preparação para uma possível PCB.

Nesta versão, `--netlist` exporta a netlist a partir do `.kicad_sch` final com `kicad-cli sch export netlist`. Assim, a netlist representa a conectividade que o KiCad lê do arquivo entregue ao usuário; footprints não são requisito para o teste de conectividade do esquema.

## Novo comando recomendado

```powershell
python main.py inputs/rlc_layout_test.json --out outputs/rlc_layout_test --netlist --kicad-erc
```

Gera:

- `outputs/rlc_layout_test/rlc_layout_test.kicad_sch`
- `outputs/rlc_layout_test/rlc_layout_test.net`
- `outputs/rlc_layout_test/rlc_layout_test_erc.rpt`

Se `kicad-cli` não estiver no `PATH`, o programa tenta localizar instalações usuais do KiCad. Em uma instalação não padrão, use `--kicad-cli` com o caminho completo.

## Diferença entre ERCs

- `--erc`: executa o ERC do SKiDL sobre o circuito em memória, antes da geração.
- `--kicad-erc`: executa o ERC nativo do KiCad sobre o arquivo `.kicad_sch` final e grava um relatório.

As duas verificações têm objetivos e comportamentos diferentes; uma não substitui a outra.

## Footprints

Não atribua footprints arbitrários só para eliminar mensagens. O encapsulamento deve ser escolhido segundo o componente físico e a intenção de projeto. Para este exemplo, o foco é esquema/conectividade; a escolha de footprints deve ocorrer numa etapa de PCB separada.

## Verificações locais

- `python -m pytest -q`: 19 aprovados, 1 teste de integração ignorado no ambiente de desenvolvimento.
- `python main.py inputs/rlc_layout_test.json --validate-only`: JSON válido, 8 componentes, 6 redes declaradas e 6 grupos de conexão.
- A geração real do `.kicad_sch`, a exportação de netlist pelo KiCad e o ERC devem ser confirmados em uma máquina com KiCad instalado. Não foram simulados como sucesso nos testes unitários.


## Auditoria automática de conectividade

A v6 adiciona `--audit-connectivity`. Depois de exportar a netlist do `.kicad_sch` final, o programa compara a associação `pino → rede` esperada pelo JSON com a reconhecida pelo KiCad. São produzidos um relatório legível (`*_connectivity.rpt`) e um relatório JSON (`*_connectivity.json`). Se algum pino esperado estiver ausente ou ligado a outra rede, a auditoria marca `FAIL` e o comando termina com código 3, mas preserva os arquivos gerados para diagnóstico.

A auditoria exige referências explícitas (`ref`) para todos os componentes; não tenta adivinhar referências que o SKiDL atribua automaticamente. Não confirma funcionamento elétrico, valores, polarização nem segurança.

## Atualização de SKiDL

A dependência passou de `skidl<3` para `skidl>=3.0.0,<4`. SKiDL 3.0.0 foi publicado em 16/10/2026 e declara correções de descoberta de bibliotecas do KiCad 10, incluindo diretórios de símbolos por símbolo e descoberta de `fp-lib-table`. A API pública `generate_schematic()` permanece. Como a geração de esquema foi refatorada para usar `schematizer`, esta migração é uma hipótese técnica fundamentada, mas precisa ser testada no ambiente Windows/KiCad 10 do usuário. Não presumir que os avisos de biblioteca ou o erro de R2.2 foram resolvidos até executar o teste real.

## Interpretando o ERC do exemplo RLC

- `pin_not_connected` para `R2.2`: potencial defeito de conectividade. Comparar com `*_connectivity.rpt` antes de editar o circuito.
- `power_pin_not_driven`: esperado quando redes de alimentação são representadas por símbolos de alimentação (pins do tipo Power Input) mas não há pin do tipo Power Output. Em um circuito real alimentado externamente, um `PWR_FLAG` pode declarar a presença de uma fonte que não está representada como componente no esquema; apenas deve ser adicionado quando isso corresponde à intenção do circuito.
- `lib_symbol_mismatch`: o símbolo incorporado no esquema diverge da definição da biblioteca instalada. Testar primeiro a atualização para SKiDL 3.0.x; se persistir, comparar as definições embarcadas e as da biblioteca instalada. Não desabilitar essa verificação como correção.
- Avisos `fp-lib-table`: não são a mesma coisa que os avisos de incompatibilidade do símbolo. O teste RLC não especifica footprints físicos, e esta etapa não deve inventar footprints só para remover avisos.
