# Histórico — v7: interface web MVP (versão anterior)

## Estado

Este documento descreve a arquitetura histórica da v7. A interface atual foi simplificada para geração exclusivamente no navegador, sem chamada ao endpoint FastAPI. A API permanece no repositório como protótipo opcional, mas não é necessária para o GitHub Pages.

## Itens

- `web/index.html`, `web/styles.css`, `web/app.js`: interface responsiva em português.
- `web/config.js`: removido na versão atual, pois o frontend não usa API.
- `web/examples/`: exemplos JSON incluídos na interface.
- `api/app.py`: endpoints `GET /api/v1/health`, `POST /api/v1/validate` e `POST /api/v1/generate` para o motor Python opcional.
- `web/browser-generator.js`: motor browser-native para o subconjunto explicitamente listado no catálogo atual.
- `requirements-web.txt`: dependências opcionais FastAPI/Uvicorn/HTTPX.
- `.github/workflows/pages.yml`: workflow de publicação apenas do frontend estático.
- `tests/test_web_api.py`: testes HTTP para saúde, validação e empacotamento de artefatos.

## Testes feitos durante a preparação

`pytest -q`: 31 passed, 1 skipped. O endpoint de geração foi testado com o subprocesso substituído por um stub; isso testa o tratamento HTTP/ZIP, mas não simula nem certifica a geração real do SKiDL/KiCad. A integração real deve ser testada localmente com KiCad instalado.

## Limitações conhecidas

- Esta descrição é histórica; consulte `README_BROWSER_ALPHA_PTBR.md` para suporte vigente.
- O frontend pode ser publicado estaticamente no GitHub Pages. A geração browser-native não precisa da API. O conversor Python/SKiDL continua disponível para execução local.
- O endpoint de geração retorna um ZIP contendo os artefatos disponíveis; se o ERC ou a auditoria detectarem problemas, os relatórios e o log devem ser examinados.
- A API do protótipo não é usada pela interface pública atual e não deve ser implantada sem proteção específica.
- O layout das referências/valores permanece heurístico. A captura RLC da v6 mostra que `R1` e `R2` ainda podem ter campos sobre a simbologia; esse problema está documentado para uma próxima iteração de layout.
- O ERC do exemplo RLC ainda tinha 10 violações no teste relatado pelo usuário; a v7 não declara esse problema resolvido.

## Próximos marcos

1. Revisar o relatório ERC mais recente, mantendo conectividade auditada como critério obrigatório.
2. Corrigir a divergência dos símbolos incorporados `Device:R`, `Device:C`, `Device:L` em relação às bibliotecas instaladas.
3. Implementar posicionamento de campos calculado a partir da geometria do símbolo e adicionar teste visual de regressão.
4. Expandir exemplos após o baseline passarem por exportação de netlist e auditoria.
5. Publicar o frontend no GitHub Pages e validar arquivos browser-native no KiCad. A API Python continua opcional e só deve ser implantada depois em ambiente isolado e com CORS restrito.
