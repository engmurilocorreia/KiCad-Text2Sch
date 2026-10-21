# v13 — Correção do catálogo, transistores P/N e identidade visual

## Por que o diodo aparecia como não suportado?

O catálogo v12 já continha `Device:D_Small`, porém a mensagem recebida pelo usuário listava um conjunto anterior de símbolos. Isso é consistente com o frontend estar executando uma cópia antiga de `symbol-catalog.js` (por cache ou pasta antiga aberta). A v13 muda os URLs de CSS, catálogo, motor e aplicação para `?v=13.0.0`; a mensagem de símbolo desconhecido agora exibe também as versões do motor e do catálogo carregados. O teste de regressão exige que `Device:D_Small` esteja no conjunto `supportedSymbols` que o motor exporta.

Para testar uma cópia nova localmente, extraia o ZIP v13 em uma pasta separada, execute `python -m http.server 5173 --directory web` a partir da raiz do repositório e acesse `http://127.0.0.1:5173`. Se estiver olhando um deploy, faça hard reload (Ctrl+F5) e confirme no diagnóstico que o motor é `0.13.0-alpha` e o catálogo `1.5.0`.

## Símbolos ativos adicionados

- `Transistor_FET:Q_PMOS_GSD`: pino 1 = G, pino 2 = S, pino 3 = D.
- `Transistor_BJT:Q_PNP_BCE`: pino 1 = B, pino 2 = C, pino 3 = E.

As definições gráficas e metadados foram adaptados das bibliotecas oficiais KiCad Symbols 10.0.5. A origem e a licença CC BY-SA 4.0 estão em `THIRD_PARTY_NOTICES.md`.

Exemplos incluídos tanto em `inputs/` (via Python) quanto em `web/examples/` (via navegador):

- `p_mosfet_high_side_switch.json`
- `bjt_pnp_high_side_test.json`

Ambos usam `rotation: 180` para colocar source/emitter acima de drain/collector no layout de teste. A rotação explícita aceita 0/90/180/270 e, nesta versão browser, está restrita a símbolos multipinos. O motor Python traduz o mesmo hint a `symtx` do SKiDL; esse caminho deve ser testado na instalação local que possui SKiDL/KiCad.

## Roteamento e campos após a rotação

O motor browser agora infere a direção do fio-stub a partir das coordenadas transformadas do pino, em vez de reutilizar a orientação local do símbolo antes da rotação. Para 180°, `Reference` e `Value` ficam do lado esquerdo, oposto à entrada que passa para o lado direito. Isso reduz colisões nos dois exemplos high-side, mas não substitui um algoritmo geral de detecção de colisão.

## Marca e nome

O nome público do repositório `KiCad-Text2Sch` permanece para preservar URL, histórico e descoberta. A interface utiliza um ícone e um lockup vetoriais próprios, sem reutilizar o logotipo do KiCad, e informa que o projeto é independente, não afiliado nem endossado pelo projeto KiCad. O nome refere-se à compatibilidade/ao formato de destino.

Arquivos de identidade:

- `web/assets/logo-mark.svg`: ícone para menu/header.
- `web/assets/logo-lockup.svg`: logo horizontal para README e apresentações.
- `web/assets/favicon.svg`: favicon.
- `docs/assets/logo-preview.png`: prévia raster para documentação.

## Testes e limitações

A suíte valida a presença de `Device:D_Small`, a resolução dos novos símbolos, mapeamento dos pinos, serialização S-expression, rotação e exemplos. Ela não substitui abrir os dois arquivos novos no KiCad 10.0.7, exportar netlist e analisar ERC. Os exemplos são fixtures de geração e não projetos de hardware qualificados.
