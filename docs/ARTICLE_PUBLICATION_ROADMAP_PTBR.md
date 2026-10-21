# Possível publicação científica — KiCad-Text2Sch

## Objetivo

Documentar uma rota realista para dar crédito acadêmico ao software. Esta nota não afirma que o projeto já atende aos critérios de qualquer periódico.

## Rota prioritária: Journal of Open Source Software (JOSS)

O JOSS não cobra APC nem taxa de assinatura. Publica artigos curtos sobre software de pesquisa, mas exige um pacote maduro, documentado, testado, sob licença open source aprovada pela OSI e com aplicação de pesquisa demonstrável. As regras atuais também pedem pelo menos seis meses de desenvolvimento público ativo antes da submissão, além de evidências de impacto/uso; apenas esperar seis meses sem iteração pública não basta.

Antes de submeter:

- manter histórico público real de commits e releases ao longo do tempo;
- criar issues públicas, changelog, CI confiável e guia de contribuição;
- obter testes de usuários externos e registrar feedback/adopção;
- demonstrar instalações limpas e compatibilidade com versões suportadas do KiCad;
- avaliar geração versus netlist, ERC, erros de coordenadas e layout em uma suíte de circuitos de referência;
- documentar todas as contribuições relevantes de terceiros e licenças;
- incluir uma declaração transparente sobre uso de ferramentas generativas de IA na implementação, documentação e preparação do artigo, com revisão humana de todo o conteúdo.

## Uma alternativa de artigo de pesquisa completo

Um artigo experimental pode focar em geração de esquemas assistida por IA a partir de uma representação intermediária JSON. Para ser mais do que um relato de ferramenta, deve comparar métodos/baselines e publicar protocolo, circuitos, versões das ferramentas e métricas reproduzíveis. Possíveis métricas incluem: taxa de geração de arquivos que abrem no KiCad, concordância da netlist com a topologia-alvo, violações ERC por circuito, frequência de labels e pinos incorretos, colisões gráficas, tempo de correção manual e robustez entre famílias de componentes.

## Autoria única

Autoria única é possível quando a pessoa identificada realizou as contribuições intelectuais e técnicas que justificam a autoria e pode responder por elas. Todo código, análise e texto assistidos por IA devem ser revisados pelo autor; observar as regras de divulgação de IA da revista alvo. Colaboradores humanos que fizerem contribuições científicas substanciais devem ser creditados adequadamente, e contribuições puramente técnicas/financeiras são tratadas segundo a política da revista.

## Links a verificar antes da submissão

- JOSS — escopo, APC zero e critérios: https://joss.theoj.org/about
- JOSS — instruções e triagem de submissões: https://openjournals.readthedocs.io/en/latest/submitting.html
- JOSS — critérios de revisão: https://openjournals.readthedocs.io/en/latest/review_criteria.html

As regras editoriais podem mudar. Conferir a documentação oficial imediatamente antes da submissão.
