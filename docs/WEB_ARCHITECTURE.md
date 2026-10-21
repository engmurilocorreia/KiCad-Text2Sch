# Arquitetura web — decisão atual e alternativas históricas

## Decisão atual

O frontend de `web/` é uma aplicação estática para GitHub Pages. Ele consome o contrato JSON v1 e gera `.kicad_sch` inteiramente no navegador usando TypeScript/JavaScript. Não chama uma API para converter e não envia os dados do circuito para um servidor.

O conversor Python/SKiDL permanece como motor local mais abrangente, disponível pelo repositório. A interface inclui um link para o repositório para usuários que desejam instalar essa via. Ambos os motores compartilham o formato JSON, mas não necessariamente suportam o mesmo conjunto de símbolos e recursos.

## Componentes

- `web/index.html`, `web/styles.css`, `web/app.js`: interface estática, exemplos, validação estrutural e download.
- `web/symbol-catalog.js`: catálogo versionado de símbolos e pinos incorporados.
- `web/browser-generator.js`: validação de suporte, posicionamento heurístico e serialização S-expression.
- `tests-js/`: testes Node.js do catálogo, serializador, exemplos e interface.
- `main.py`, `src/`: conversor Python/SKiDL local.

## Por que ainda existe código FastAPI?

`api/app.py` e `requirements-web.txt` são artefatos da etapa anterior de prototipagem. O frontend atual não os importa ou chama; não é necessário implantá-los para publicar a página. Eles podem ser removidos em uma mudança futura separada, após decidir se algum consumidor ainda necessita da API local.

## Segurança e validade

O browser não executa KiCad CLI, ERC, simulação ou verificação de fabricabilidade. O status de validação estrutural do JSON não deve ser apresentado como prova de correção elétrica. O motor aceita somente os símbolos explicitamente registrados no catálogo e recusa símbolos ou pinos não suportados.

## Expansão

Adicionar cada família de símbolos com metadados de pinos, definição embutida, exemplo e testes; abrir o esquema no KiCad 10.0.7; conferir a netlist e o ERC; só então divulgar o suporte como estável. Para recursos que dependem de biblioteca externa, hierarchy, multi-unit, ERC ou simulation, a versão Python/KiCad CLI continua sendo a alternativa local.
