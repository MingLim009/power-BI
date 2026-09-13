# Montagem no Power BI Desktop

Arquivo **100% editável**: cores, títulos, medidas, visuais e layout livres para ajuste.

**3 páginas** (leitura em notebook, sem sobrecarregar uma tela):

1. **Visão Geral** — KPIs, evolução % PCD, Meta × Realizado, destaques  
2. **Distribuição** — 9 áreas, representatividade, tipo, turno, Blue/White  
3. **Movimentação / Permanência** — admissões × desligamentos, promoções, mov. internas, tenure, turnover  

Slicers sincronizados nas 3 páginas (Ano, Mês, Planta, Área, Turno).

## Modelo

1. Abrir Power BI Desktop.
2. Parâmetro `pCaminhoExcel` → `data/PCD_Workforce_Base_Ficticia.xlsx` (fictício só no desenvolvimento).
3. 4 consultas em `powerbi/powerquery/Consultas_M.pq`.
4. `DimCalendario`, `DimArea` (9 oficiais), `DimPlanta` + relacionamentos.
5. Medidas em `powerbi/measures/Medidas_PCD.dax`.
6. Tema `powerbi/theme/PCD_Executive_Blue.json`.

## Troca fictício → real

Ver `docs/GUIA_TROCA_FONTE.md`. Mesmas abas/colunas; só aponta o parâmetro. Modelo, DAX e páginas seguem válidos.

## Entrega

`.pbix` editável + Excel fictício + guia de troca de fonte.
