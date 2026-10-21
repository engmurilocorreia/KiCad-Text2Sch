# v20 — Correção de S-expressions e importação local de símbolos externos

## 1. Por que o arquivo do PID não abria no KiCad

O erro `Expected arc, bezier, circle, pin, polyline, rectangle, or text. Got "symbol"` significa que o leitor do KiCad encontrou uma definição de sub-símbolo em um nível da árvore S-expression em que esperava apenas primitivas gráficas. No símbolo embutido `Amplifier_Operational:LM741`, faltava fechar `LM741_0_1` antes de começar o corpo `LM741_1_1`. O arquivo podia ter parênteses globalmente balanceados e, ainda assim, possuir uma hierarquia inválida.

O motor de navegador agora fecha os corpos no nível correto, e `tests/fixtures/pid_controller_lm741_v20.kicad_sch` é um fixture de regressão. O teste verifica a estrutura dos corpos do LM741, além do balanceamento dos parênteses. A confirmação final ainda exige abrir o arquivo no KiCad 10.0.7, exportar uma netlist e revisar o ERC.

## 2. Importação local de uma biblioteca de símbolo `.kicad_sym`

O KiCad usa arquivos `.kicad_sym` para bibliotecas de símbolos. Um arquivo pode conter várias definições de símbolo. Consulte o [formato oficial de biblioteca de símbolos do KiCad](https://dev-docs.kicad.org/en/file-formats/sexpr-symbol-lib/).

O KiCad-Text2Sch v20 tem um importador experimental que lê um arquivo escolhido pelo usuário localmente no navegador. Não faz scraping, não consulta APIs de fornecedores e não carrega o arquivo para um servidor.

### Fluxo recomendado para um componente específico, por exemplo S8025R

1. Obtenha o arquivo de símbolo em uma fonte autorizada: página do fabricante, SnapMagic/SnapEDA, Ultra Librarian ou outra biblioteca de terceiros. KiCad mantém uma [lista informativa de bibliotecas de terceiros](https://www.kicad.org/libraries/third_party/), mas não endossa esses fornecedores.
2. Se o fornecedor fornecer um `.zip`, extraia-o localmente. Procure o arquivo `.kicad_sym`. Algumas bibliotecas do KiCad 10 são distribuídas como diretórios `.kicad_symdir` com vários arquivos; o importador v20 não importa o diretório inteiro. Se precisar, use o editor de símbolos do KiCad para salvar/exportar o símbolo escolhido em um `.kicad_sym` simples.
3. Na interface, abra **Importar símbolos externos de KiCad**, selecione o `.kicad_sym`, mantenha ou defina o namespace `External` e clique em **Importar biblioteca**.
4. Leia o status da importação: ele indica os nomes exatos dos símbolos importados e o mapa de pinos no formato `número = nome`.
5. No JSON, use o namespace em `parts[].lib` e o nome exato do símbolo em `parts[].name`. Por exemplo, **somente se** o arquivo realmente contiver um símbolo com o nome `S8025R`:

   ```json
   {
     "lib": "External",
     "name": "S8025R",
     "ref": "Q1",
     "value": "S8025R"
   }
   ```

6. Crie `connections` usando os números mostrados no mapa importado; não deduza a numeração a partir de nomes como A, K e G. Compare a pinagem lógica do símbolo com o datasheet e o desenho do encapsulamento S8025R antes de considerar o circuito correto.
7. Gere o `.kicad_sch`, abra-o no KiCad 10.0.7, confira o símbolo visualmente, exporte a netlist e revise o ERC. Se os dados do componente estiverem incorretos ou incompletos, corrija-os antes de usar o esquema em um projeto real.

### O que o importador atual suporta

- Arquivos `.kicad_sym` compatíveis selecionados pelo usuário.
- Símbolos simples com uma unidade gráfica e metadados de pinos que o parser reconhece.
- Incorporar a definição de símbolo ao `.kicad_sch` gerado, evitando que o esquema dependa de uma biblioteca externa para exibir esse símbolo.
- Mostrar os números e nomes dos pinos para ajudar a compor o JSON.

### Limitações atuais

- Não importa arquivos `.zip` diretamente: extraia-os antes.
- Não importa um diretório `.kicad_symdir` como um pacote.
- Não aceita símbolos multi-unit, símbolos derivados com `extends` nem estilos gráficos alternativos/De Morgan.
- Não instala footprints (`.pretty`/`.kicad_mod`), modelos 3D, modelos SPICE ou tabelas de bibliotecas. A propriedade Footprint pode ser preservada como texto, mas o arquivo de footprint não é transferido nem validado.
- A biblioteca importada fica apenas na memória da página; será necessário importá-la novamente depois de atualizar/recarregar a página.
- Importar o símbolo não comprova a pinagem do encapsulamento, ratings, funcionamento ou segurança do circuito.

## 3. Licença e respeito às fontes

O importador não confere automaticamente se o usuário possui autorização para utilizar ou redistribuir o arquivo selecionado. Verifique a licença do arquivo e os termos vigentes da fonte. SnapMagic/SnapEDA distingue os termos do site daqueles aplicáveis aos arquivos de projeto; consulte seus [Termos de Serviço](https://www.snapeda.com/about/terms/). Ultra Librarian também estabelece termos próprios de uso do conteúdo; consulte suas [informações legais](https://www.ultralibrarian.com/legal).

O projeto não deve republicar símbolos baixados por usuários nem agregá-los automaticamente ao catálogo embutido. A função foi projetada para importação local e uso pelo próprio usuário. Não há scraping nem integração direta com os sistemas desses fornecedores.

## 4. Testes desta versão

- Regressão estrutural do sub-símbolo LM741 que causou erro de abertura no KiCad.
- Importação local de uma biblioteca de teste `.kicad_sym` e geração de um esquema com símbolo customizado embutido.
- Exibição do nome exato do símbolo e mapa numérico dos pinos.
- Rejeição explícita de arquivos malformados e de símbolos multi-unit não suportados.
- Instruções e prompt de IA para evitar que o modelo invente a biblioteca ou a pinagem de componentes externos.
