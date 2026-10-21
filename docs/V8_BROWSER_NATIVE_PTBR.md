# v8 — geração nativa no navegador

## Resumo

A v8 formaliza a abordagem híbrida com dois motores:

- **Browser-native (JavaScript):** gera um arquivo `.kicad_sch` diretamente no navegador, sem requisição de geração a um backend.
- **Python/SKiDL:** permanece no repositório para uso local e integração com o KiCad CLI; o frontend atual não usa FastAPI.

A saída dos dois motores usa a mesma entrada JSON v1, mas os algoritmos, o conjunto de símbolos suportados e as garantias ainda diferem. Não se deve esperar byte-a-byte ou visualmente a mesma saída.

## Escopo browser alpha — nota histórica atualizada

Esta nota documenta a primeira iteração da geração nativa no navegador (v8), que suportava somente `Device:R`, `Device:C` e `Device:L`. A versão atual também incorpora definições de `Transistor_FET:Q_NMOS_GSD` e `Transistor_BJT:Q_NPN_BCE` adaptadas das bibliotecas oficiais KiCad Symbols 10.0.5. O suporte permanece experimental até os exemplos passarem por abertura, netlist e ERC no KiCad 10.0.7. Consulte `README_BROWSER_ALPHA_PTBR.md` para o escopo atual.

O navegador não executa o KiCad CLI. Portanto, não pode declarar que executou a netlist nativa, ERC, simulação ou checagens de fabricação. A mensagem de geração deve continuar deixando essas limitações explícitas.

## Como testar

```powershell
npm run test:browser
pytest -q
python -m http.server 5173 --directory web
```

Abra `http://127.0.0.1:5173` e teste os exemplos `circuit1`, `rlc_layout_test`, `mosfet_low_side_switch` e `bjt_common_emitter_test` com o botão **Gerar esquema KiCad**. Abra os arquivos baixados no KiCad 10.0.7. Verifique se o arquivo carrega, se os componentes e suas referências aparecem, se a topologia corresponde ao JSON e quais mensagens aparecem no ERC.

## Critério antes de expandir a cobertura

Não adicionar AmpOp/SCR só por inserir um bloco de símbolo. Cada símbolo novo precisa de:

1. Fonte da biblioteca e versão fixada.
2. Metadados corretos de pinos (número, nome, tipo elétrico e unidade).
3. Transformação correta para rotação/espelhamento e coordenadas dos pinos.
4. Fixture de JSON e esquema esperado.
5. Teste de leitura pelo KiCad CLI, comparação de netlist e política explícita para avisos ERC.

O Python/SKiDL segue como referência para recursos amplos enquanto o motor browser é expandido.
