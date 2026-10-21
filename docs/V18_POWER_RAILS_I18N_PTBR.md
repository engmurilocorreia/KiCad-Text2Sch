# v18 — trilhos de alimentação, interface e prompt de IA

## Correção para alimentações simétricas

Redes declaradas como `{"name":"V+","type":"power"}` e `{"name":"V-","type":"power"}` são aceites pelo motor web. Para nomes diferentes dos símbolos predefinidos `power:GND` e `power:VS`, o gerador cria uma definição de símbolo de alimentação embutida no próprio `.kicad_sch` e preserva o nome da rede. Essas definições precisam aparecer em `lib_symbols`, e não como texto decorativo. A orientação gráfica usa uma heurística de nomenclatura; confirme sempre a polaridade no KiCad.

O conversor Python/SKiDL permanece separado e pode ter diferenças de cobertura. Esta alteração garante o caminho browser-native, não paridade automática entre os dois motores.

## PID LM741 de regressão

`inputs/pid_controller_lm741.json` reproduz o JSON de teste com quatro LM741, três estágios P/I/D e um somador. Contém 14 componentes, 40 conexões de pinos e `no_connect` explícitos para os pinos 1, 5 e 8 de cada LM741. O pino 8 é intrinsecamente não conectável no símbolo utilizado e não recebe um marcador visível redundante.

Os valores `R` e `C` são placeholders: o exemplo testa o gerador e não é um controlador PID dimensionado ou validado para montagem física.

## Interface web

- Idiomas selecionáveis: Português (Brasil), inglês, português europeu e espanhol.
- Tema claro/escuro persistido localmente.
- Logótipo do GitHub junto ao link do repositório.
- Painel para copiar um prompt de geração JSON no idioma selecionado. O prompt explica trilhos `V+`/`V-`, uso de `no_connect`, catálogo limitado e verificações que continuam a exigir o KiCad.
- O motor browser-native executa no navegador; o JSON do circuito não é enviado para uma API.

## Verificações executadas nesta versão

- `npm run test:browser`: 30 testes aprovados.
- `pytest -q`: 37 aprovados, 1 teste de integração ignorado.
- 13 exemplos browser em `web/examples/` gerados e verificados estruturalmente.
- O ficheiro PID foi gerado e contém definições embutidas para `V+` e `V-`.

Ainda é necessário abrir o esquema PID no KiCad 10.0.7, exportar a netlist e rever o ERC. Os testes de estrutura não demonstram, por si só, validade elétrica ou qualidade de renderização.
