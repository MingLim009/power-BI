# PCD Workforce & Inclusion Dashboard

Pacote completo para o BI executivo de representatividade PCD (dados **somente fictícios** / LGPD).

## Entregáveis

| Item | Descrição |
|------|-----------|
| `data/PCD_Workforce_Base_Ficticia.xlsx` | 4 abas no contrato de dados acordado |
| `powerbi/measures/Medidas_PCD.dax` | KPIs em DAX (% PCD, GAP, movimentações, etc.) |
| `powerbi/powerquery/Consultas_M.pq` | Power Query + parâmetro de caminho |
| `powerbi/theme/PCD_Executive_Blue.json` | Tema azul corporativo |
| `docs/` | Modelo, layout, troca de fonte, checklist |
| `preview/` | Dashboard executivo HTML (referência visual imediata) |

> **Nota:** O arquivo `.pbix` final é montado no **Power BI Desktop** com este pacote (checklist em `docs/CHECKLIST_MONTAGEM_PBI.md`). Neste ambiente de build não há Power BI Desktop instalado — o modelo, as medidas, a base e o preview já estão prontos para montagem rápida.

## Abas Excel

1. **COLABORADORES** — cadastro/situação atual (inclui **Oficina**)
2. **MOVIMENTAÇÕES** — Admissão / Desligamento / Promoção / Movimentação Interna
3. **HISTÓRICO MENSAL** — HC Total e HC PCD por período/planta/oficina
4. **METAS** — Meta % PCD (padrão 5%)

**Calendário** → só no Power BI (`DimCalendario`).

## KPIs (calculados no Power BI, não no Excel)

HC Total · HC PCD · % PCD · Meta · GAP · Admissões/Desligamentos/Promoções/Mov. internas PCD · Tempo de empresa · % Blue/White Collar · % PCD em liderança

## Preview HTML

```bash
cd preview
python -m http.server 8765
```

Abra `http://localhost:8765` — layout executivo com espaço de **logo**, KPIs e gráficos no padrão do protótipo.

## Regenerar dados sintéticos

```bash
python scripts/generate_synthetic_excel.py
python scripts/export_preview_json.py
```

## Troca fictício → real

Ver `docs/GUIA_TROCA_FONTE.md` (mesmo layout de colunas; só aponta o parâmetro `pCaminhoExcel`).
