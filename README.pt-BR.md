# KiCad-Text2Sch

[English version](README.en.md) · **Português (Brasil)**

![KiCad-Text2Sch](docs/assets/logo-preview.png)

**KiCad-Text2Sch** é uma ferramenta experimental de código aberto para converter descrições declarativas de circuitos em JSON em esquemas KiCad editáveis (`.kicad_sch`). O motor web funciona localmente no navegador, sem API de geração; o repositório também mantém um conversor Python/SKiDL para uso local.

**Desenvolvido por Murilo G. Correia.** Projeto independente, não afiliado nem endossado pelo projeto KiCad. KiCad é uma marca de seu respectivo titular.

## Funcionalidades atuais

- Editor JSON no navegador, validação estrutural e download do esquema.
- Seleção de idioma (Português-BR, English, Português-PT e Español) e tema claro/escuro.
- Layout A4 por compactação geométrica dos envelopes estimados; quando necessário, exportação de um projeto hierárquico com múltiplas folhas (ZIP).
- Geração browser-native para um catálogo experimental de símbolos, incluindo R/C/L, diodo, MOSFET, TBJ, LM741, SCR BT169B, DIAC e um símbolo gráfico genérico de SIDAC.
- Labels locais e globais tipadas; GND/VS predefinidos e símbolos de alimentação embutidos para outros nomes de trilhos, como `V+` e `V-`.
- Fluxo Python/SKiDL para conversão local e verificações opcionais com KiCad CLI.
- Prompt para IA copiável diretamente na interface, com idioma sincronizado com a página, e guia completo em [`docs/AI_AUTHORING_PROMPT.md`](docs/AI_AUTHORING_PROMPT.md).
- Importação local experimental de símbolos KiCad multi-unit (até 16 unidades), com resolução de `extends` quando a base está no mesmo arquivo.
- Layout A4 sensível à conectividade: tenta quatro perfis de espaçamento antes de gerar um projeto hierárquico multi-folha em ZIP. O layout usa envelopes geométricos estimados; confira sempre o resultado no KiCad. Guia: [`docs/V21_MULTIUNIT_LAYOUT_PTBR.md`](docs/V21_MULTIUNIT_LAYOUT_PTBR.md).
- Notas históricas sobre trilhos e idiomas (v18): [`docs/V18_POWER_RAILS_I18N_PTBR.md`](docs/V18_POWER_RAILS_I18N_PTBR.md).

## Início rápido — interface web

Na raiz do repositório, execute:

```powershell
python -m http.server 5173 --directory web
```

Abra `http://127.0.0.1:5173`. Selecione um exemplo, edite o JSON, valide e clique em **Gerar esquema KiCad**. Use o seletor no cabeçalho para trocar entre Português (Brasil), English, Português (Portugal) e Español; o botão de tema alterna entre modo claro e escuro. O painel “Trabalhar com IA” copia um prompt no idioma selecionado. O navegador processa o circuito localmente; o conteúdo JSON não é enviado a um backend de geração.

## Layout A4 e projetos multi-folha

O exemplo **Teste de layout multi-folha (sintético)** exercita a exportação hierárquica. Ele não representa um circuito funcional. Quando o esquema não cabe na área útil A4, o gerador tenta perfis progressivamente compactos e, se necessário, baixa um ZIP com uma folha raiz e folhas de circuito. Extraia todos os arquivos e abra o `.kicad_sch` raiz no KiCad. Os envelopes de layout são estimativas; verifique visualmente o resultado, exporte a netlist e execute o ERC.

## Criar JSON com uma IA

1. Abra [`docs/AI_AUTHORING_PROMPT.md`](docs/AI_AUTHORING_PROMPT.md) e copie o prompt em português ou inglês.
2. Informe a topologia e os requisitos: alimentação, função dos estágios, componente ou símbolo requerido, valores conhecidos e conexões.
3. Peça à IA que não invente valores, modelos, footprints ou pinos; placeholders devem ser declarados explicitamente.
4. Cole o resultado no editor web e execute a validação.
5. Gere o `.kicad_sch`, abra-o no KiCad e confirme símbolos, pinos, labels, conectividade, netlist e ERC.

### Exemplo de declaração de redes

```json
"nets": [
  { "name": "GND", "type": "power" },
  { "name": "V+", "type": "power" },
  { "name": "V-", "type": "power" },
  { "name": "VIN", "type": "input" },
  { "name": "VOUT", "type": "output" }
]
```

No motor do navegador, `GND` e `VS` usam símbolos predefinidos. Outros nomes de alimentação, como `V+`, `V-`, `VCC` ou `VEE`, geram uma definição de símbolo embutida no próprio `.kicad_sch`, e o nome da rede é preservado. Isso é uma funcionalidade do motor web; o conversor Python/SKiDL pode precisar de uma biblioteca de alimentação correspondente e deve ser validado separadamente. A forma gráfica do símbolo não substitui a validação da polaridade nem define, sozinha, o comportamento elétrico do circuito.

## Exemplo PID com LM741

O arquivo [`inputs/pid_controller_lm741.json`](inputs/pid_controller_lm741.json) demonstra quatro amplificadores LM741 e trilhos `V+`/`V-`. Os valores R/C são placeholders, como declarado na descrição. Trata-se de uma fixture para testar o gerador, não de um controlador PID dimensionado ou validado para implementação física.

## Importar um símbolo KiCad externo (experimental)

O navegador aceita um arquivo de biblioteca de símbolos nativo `.kicad_sym` fornecido pelo usuário. Isso permite experimentar símbolos de componentes específicos que ainda não existem no catálogo embutido, incluindo um SCR como o S8025R, desde que o arquivo contenha uma definição compatível com as limitações atuais.

1. Obtenha a biblioteca por um canal legítimo do fabricante ou fornecedor e confira os termos de uso/licença do arquivo. Se o download vier num ZIP, extraia-o e selecione o `.kicad_sym`.
2. Na secção **Importar símbolos externos de KiCad**, selecione o arquivo, escolha um prefixo — normalmente `External` — e clique em **Importar biblioteca**.
3. Leia o resumo de importação. Ele mostra o nome exato dos símbolos e o mapa de pinos (`número = nome`). Use esses números, sem inferi-los apenas pelo nome funcional do terminal.
4. No JSON, use o prefixo em `parts[].lib` e o nome exato do símbolo em `parts[].name`, por exemplo:

   ```json
   { "lib": "External", "name": "S8025R", "ref": "Q1", "value": "S8025R" }
   ```

   Esse fragmento só funciona se o arquivo importado tiver realmente um símbolo chamado `S8025R`. As ligações `Q1.1`, `Q1.2`, etc. devem seguir o mapa mostrado pela importação e o datasheet do componente.
5. Gere o esquema e confira no KiCad a orientação, pinagem, netlist e ERC.

A importação é processada no próprio navegador: o arquivo não é enviado a um servidor. O importador suporta símbolos de uma ou várias unidades (até 16) e resolve símbolos derivados por `extends` quando a definição base também está no mesmo arquivo. A geometria considera o estilo primário; a seleção de estilos alternativos/De Morgan não é suportada. Se uma biblioteca inteira tiver símbolos incompatíveis, os motivos de exclusão aparecem no resultado. Confirme a versão do importador exibida e use `Ctrl+F5` após atualizar o site. Não importa bibliotecas de footprints `.pretty`, modelos 3D ou modelos SPICE. O símbolo importado permanece na memória da página; após recarregar o site, importe-o novamente.

**Não distribuímos nem incorporamos automaticamente arquivos baixados de fornecedores.** O usuário é responsável por verificar os termos e a licença do arquivo original antes de importá-lo, compartilhar o esquema gerado ou redistribuir definições derivadas. Consulte [`docs/V19_CUSTOM_SYMBOL_IMPORT_PTBR.md`](docs/V19_CUSTOM_SYMBOL_IMPORT_PTBR.md) e [`docs/V21_MULTIUNIT_LAYOUT_PTBR.md`](docs/V21_MULTIUNIT_LAYOUT_PTBR.md) para detalhes e limitações.

## Uso do conversor Python

Instale Python e as dependências:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt
```

Validar um JSON sem executar a geração:

```powershell
python main.py inputs/circuit1.json --validate-only
```

Gerar o esquema:

```powershell
python main.py inputs/circuit1.json --out outputs
```

A cobertura de símbolos, os recursos `no_connect` e os trilhos personalizados podem variar entre o motor web e o motor Python/SKiDL. Consulte os erros do gerador; não presuma paridade até que o caso de uso passe pelos testes de ambos.

## Testes

```powershell
pytest -q
npm run test:browser
```

Os testes unitários não substituem a validação real pelo KiCad 10.0.7. A exportação da netlist, o ERC nativo e a inspeção visual são etapas necessárias antes de usar um esquema fora de demonstrações.

## Escopo e limitações

- O catálogo do motor web é intencionalmente limitado e versionado. Um símbolo suportado na biblioteca instalada do KiCad não é necessariamente suportado pelo gerador no navegador.
- O layout e o roteamento são heurísticos; circuitos grandes podem requerer reorganização manual.
- Um símbolo representa graficamente o componente, mas não valida automaticamente valores, ratings, pinagem do encapsulamento, modelo SPICE ou requisitos de segurança.
- O símbolo `KiCadText2Sch:SIDAC_Generic` é genérico; não equivale a um modelo de fabricante nem contém modelo SPICE.
- O ERC verifica regras elétricas definidas pelas bibliotecas e configurações do KiCad; passar no ERC não prova funcionamento, dimensionamento, segurança ou conformidade normativa.

## Licença e atribuições

O código e a documentação originais usam Apache-2.0; veja [`LICENSE`](LICENSE) e [`NOTICE`](NOTICE). Definições de símbolos adaptadas da biblioteca KiCad são cobertas pelos avisos específicos em [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), incluindo CC BY-SA 4.0 onde aplicável. Não confunda a licença do código original com as licenças de materiais de terceiros.
