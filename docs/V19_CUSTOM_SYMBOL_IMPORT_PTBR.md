# v19/v20 — importação local de símbolos externos e correção do parser do LM741

## Correção do erro de abertura do PID

O erro do KiCad — `Expected arc, bezier, circle, pin, polyline, rectangle, or text. Got "symbol"` — indicava que o parser havia encontrado uma definição de sub-símbolo KiCad numa posição em que só eram permitidas primitivas gráficas. A expressão S do arquivo estava com parênteses globalmente balanceados, portanto os testes de balanceamento antigos não detectaram o problema; a hierarquia da expressão, porém, era inválida.

Na definição embutida `Amplifier_Operational:LM741`, o sub-símbolo gráfico `LM741_0_1` não era encerrado antes de começar `LM741_1_1`. A correção fecha cada definição de unidade gráfica no nível adequado e remove o fechamento excedente ao final da definição dos pinos. Há um teste de regressão que faz parse do arquivo e exige que `LM741_0_1`, `LM741_1_1` e `LM741_2_1` sejam sub-símbolos irmãos, além de limitar os filhos gráficos a tipos reconhecidos pelo formato do KiCad.

O fixture `tests/fixtures/pid_controller_lm741_v20.kicad_sch` foi regenerado pelo motor de navegador após a correção. Os testes estruturais não substituem a abertura do fixture no KiCad 10.0.7, a exportação de netlist e o ERC nativo.

## Importador local de `.kicad_sym`

A interface contém um importador inicial para bibliotecas de símbolos nativas do KiCad. A implementação analisa o conteúdo do arquivo selecionado no navegador; não faz download remoto, não chama APIs de fornecedores e não envia o arquivo para um servidor.

Fluxo:

1. Selecione um arquivo `.kicad_sym` local. Um arquivo `.zip` precisa ser extraído antes.
2. Escolha um namespace de importação, como `External`.
3. Importe a biblioteca e leia a lista de símbolos e o mapa numérico dos pinos exibido no resultado.
4. Use no JSON o namespace como `parts[].lib` e o nome exato do símbolo como `parts[].name`.
5. Use os números de pinos efetivamente importados e confirme a pinagem contra o datasheet do fabricante.
6. Gere o esquema e valide no KiCad. A importação estrutural não garante que a orientação, o significado elétrico, o footprint nem as conexões sejam corretos.

Exemplo de componente quando a biblioteca importada realmente contém `S8025R`:

```json
{
  "lib": "External",
  "name": "S8025R",
  "ref": "Q1",
  "value": "S8025R"
}
```

Isso apenas declara o componente. As conexões precisam ser adicionadas de acordo com o mapa de pinos apresentado no importador e com o datasheet. Não assumir que a numeração do símbolo é a mesma da pinagem física do encapsulamento.

### Limites da primeira implementação

- Um símbolo gráfico de unidade única.
- Não aceita símbolos derivados com `extends`, símbolos com unidades gráficas múltiplas, nem corpos gráficos alternativos.
- Não importa bibliotecas de footprints (`.pretty`), modelos 3D, modelos SPICE ou tabelas de bibliotecas do KiCad.
- Se o símbolo tiver uma propriedade `Footprint`, essa cadeia pode ser preservada no campo correspondente; o footprint não é instalado nem verificado.
- Os símbolos personalizados ficam na memória da página e precisam ser importados novamente depois de atualizar/recarregar o site.
- Arquivos grandes são limitados a 5 MiB, com limite de símbolos/pinos para restringir custo de processamento local.

### Sites e licença

KiCad documenta o formato de biblioteca nativo `.kicad_sym` em sua documentação de formato de arquivos ([formato de biblioteca de símbolos](https://dev-docs.kicad.org/en/file-formats/sexpr-symbol-lib/)) e lista fornecedores de bibliotecas de terceiros ([bibliotecas de terceiros](https://www.kicad.org/libraries/third_party/)).

O projeto não baixa nem redistribui automaticamente materiais de SnapMagic/SnapEDA, Ultra Librarian ou fabricantes. Os termos não são iguais entre serviços e podem limitar a distribuição de arquivos CAD ou a incorporação deles em outros softwares. Por exemplo, SnapMagic informa que o uso do site é sujeito a termos próprios e que arquivos CAD individualizados têm termos/licenças de conteúdo separados; Ultra Librarian igualmente publica seus próprios termos. Leia os termos atuais na origem e verifique se a forma de utilização pretendida está permitida antes de importar, compartilhar ou redistribuir um arquivo.

Importar localmente um arquivo fornecido pelo próprio usuário não dá ao KiCad-Text2Sch o direito de incluí-lo no repositório, no catálogo embutido ou em um serviço de hospedagem. Os testes usam uma pequena definição fictícia de SCR criada somente para teste, não uma definição do S8025R obtida de um fornecedor.

## Testes adicionados nesta etapa

- Estrutura gramatical dos sub-símbolos LM741.
- Importação de uma biblioteca `.kicad_sym` simples de uma unidade.
- Geração do símbolo importado embutido em `.kicad_sch`.
- Rejeição clara de arquivos malformados e símbolos multi-unit não suportados.
- Verificação de pinos importados, incluindo número e nome, para orientar o JSON.
