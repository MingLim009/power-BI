# Montagem no Power BI Desktop (3–5 dias → checklist de 90–120 min de montagem visual)

## Dia 1 — Modelo

1. Abrir Power BI Desktop (versão recente).
2. Criar parâmetro `pCaminhoExcel` → caminho de `data/PCD_Workforce_Base_Ficticia.xlsx`.
3. Criar 4 consultas com o M em `powerbi/powerquery/Consultas_M.pq`.
4. Desabilitar “load” desnecessário; garantir nomes de tabelas iguais às abas.
5. Criar `DimCalendario` (DAX) e marcar como tabela de datas.
6. Criar relacionamentos (`docs/MODELO_DADOS.md`).
7. Criar `DimArea` (9 oficiais, fixas) + `DimPlanta`. Slicers/tabela por área = DimArea.
8. Colar medidas de `powerbi/measures/Medidas_PCD.dax` na tabela **Medidas**.
9. Aplicar tema `powerbi/theme/PCD_Executive_Blue.json`.

## Dia 2 — Página executiva

1. Canvas 1920×1080; fundo `#F5F8FB`.
2. Reservar espaço do **logo** (esquerda).
3. Slicers principais + painel de filtros (bookmarks).
4. 5 cards KPI + gauge meta.
5. Gráficos na ordem do `docs/LAYOUT_EXECUTIVO.md`.
6. Formatação condicional no GAP.
7. Testar todos os slicers (interatividade).

## Dia 3 — Polimento & entrega

1. Tooltips executivos curtos.
2. Estados vazios (mostrar 0 / “sem dados”).
3. Validar números vs Excel (pivô).
4. Publicar/salvar `PCD_Workforce_Inclusion.pbix`.
5. Entregar zip: `.pbix` + Excel + `docs/GUIA_TROCA_FONTE.md`.

## Arquivos deste pacote

| Item | Caminho |
|------|---------|
| Base fictícia | `data/PCD_Workforce_Base_Ficticia.xlsx` |
| Medidas DAX | `powerbi/measures/Medidas_PCD.dax` |
| Power Query | `powerbi/powerquery/Consultas_M.pq` |
| Tema | `powerbi/theme/PCD_Executive_Blue.json` |
| Modelo | `docs/MODELO_DADOS.md` |
| Layout | `docs/LAYOUT_EXECUTIVO.md` |
| Troca de fonte | `docs/GUIA_TROCA_FONTE.md` |
| Preview HTML | `preview/index.html` |
| Regenerar dados | `scripts/generate_synthetic_excel.py` |
