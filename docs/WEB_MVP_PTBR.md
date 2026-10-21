# Interface web KiCad-Text2Sch — modo browser-native

## Estado atual

O frontend público foi simplificado para usar exclusivamente o motor JavaScript no navegador. Ele não chama o backend FastAPI e não envia o JSON do circuito a uma API. O repositório continua contendo o conversor Python/SKiDL para uso local.

A interface inclui editor JSON, exemplos, formatação, download JSON, validação estrutural local e geração de `.kicad_sch` para os símbolos suportados. O subconjunto browser alpha inclui `Device:R`, `Device:C`, `Device:L`, `Device:D_Small`, `Transistor_FET:Q_NMOS_GSD`, `Transistor_FET:Q_PMOS_GSD`, `Transistor_BJT:Q_NPN_BCE` e `Transistor_BJT:Q_PNP_BCE`; veja [`../README_BROWSER_ALPHA_PTBR.md`](../README_BROWSER_ALPHA_PTBR.md) para os limites.

## Desenvolvimento local — Windows PowerShell

```powershell
python -m http.server 5173 --directory web
```

Abra `http://127.0.0.1:5173`. O servidor HTTP serve arquivos estáticos e exemplos; não executa conversão. A geração ocorre no navegador. Também é possível rodar os testes JavaScript em Node.js:

```powershell
npm run test:browser
```

Para testar o conversor Python localmente, consulte o `README.md` na raiz e use um ambiente virtual independente:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt
pytest -q
```

## Publicação

O workflow `.github/workflows/pages.yml` publica somente o diretório `web/` no GitHub Pages. Não é preciso configurar `apiBaseUrl`, serviço FastAPI ou servidor de conversão. O link da interface aponta ao repositório <https://github.com/engmurilocorreia/KiCad-Text2Sch> para quem quiser executar o conversor Python.

## Verificação elétrica

O browser não executa KiCad CLI. Para cada saída, abra o esquema no KiCad 10.0.7, exporte a netlist, verifique as redes e leia o relatório ERC. A geração de arquivo não é uma certificação da conectividade, do comportamento elétrico, do footprint ou da fabricabilidade.

O diretório `api/` e os arquivos de dependências web anteriores continuam no repositório como código opcional não utilizado pelo frontend atual. Não precisam ser implantados para hospedar o site.
