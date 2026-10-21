# Roteiro de validação v6 (Windows + KiCad 10)

## 1. Use um ambiente virtual

A saída fornecida anteriormente mostra que o Python veio do Anaconda global e encontrou metadados inválidos de outra biblioteca. Para separar isso do projeto, teste em um ambiente virtual dentro da pasta do repositório:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
python -m pip show skidl
pytest -q
```

Confirme que o `Version` de SKiDL é `3.0.0` ou outra versão compatível `3.x`. Se a versão do Python no computador for diferente, use a instalação desejada com `py -0p` para listar os intérpretes disponíveis.

## 2. Gere e audite o arquivo final

```powershell
python main.py inputs/rlc_layout_test.json --out outputs/rlc_layout_test_v6 --netlist --audit-connectivity --kicad-erc
```

Artefatos esperados:

- `rlc_layout_test.kicad_sch`: esquema editável;
- `rlc_layout_test.net`: netlist exportada pelo KiCad CLI;
- `rlc_layout_test_connectivity.rpt`: divergências entre conexões do JSON e a netlist;
- `rlc_layout_test_connectivity.json`: versão legível por máquina do mesmo resultado;
- `rlc_layout_test_erc.rpt`: relatório ERC do KiCad.

Um `FAIL` da auditoria deve ser investigado mesmo que o ERC pareça melhor. A auditoria verifica se os pinos e as redes coincidem com o JSON; não comprova a correção funcional do circuito.

## 3. Analise R2.2

Se o relatório mostrar `R2.2` ausente da netlist ou em outra rede, envie o `*_connectivity.rpt`. Ele indicará quais pinos deveriam estar em `N3` e quais o KiCad realmente reconheceu. Se a auditoria der PASS mas o ERC continuar reportando esse pino, envie o trecho da netlist referente à rede `N3` e o erro ERC — isso indicará que a checagem de conectividade lógica e o marcador ERC discordam e requerem inspeção da coordenada no `.kicad_sch`.

## 4. Interprete as mensagens de alimentação

O KiCad pode sinalizar `power_pin_not_driven` em redes que usam símbolos de alimentação, porque esses símbolos normalmente têm pinos elétricos `Power Input`, não `Power Output`. Se `VS` e `GND` representam fontes externas reais não desenhadas explicitamente no esquema, `PWR_FLAG` pode ser adequado. Não adicione flags para esconder erros sem confirmar o significado da rede.

## 5. Se o símbolo continuar com `lib_symbol_mismatch`

Registre a versão exata de SKiDL, a versão do KiCad e o caminho que aparece em `KICAD_SYMBOL_DIR`. Depois compare a definição do símbolo incorporada em `.kicad_sch` com a definição `Device.kicad_sym`/diretório de símbolos usado pelo KiCad 10. Não remova os avisos de ERC globalmente.
