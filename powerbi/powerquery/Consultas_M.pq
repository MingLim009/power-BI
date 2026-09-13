// ============================================================
// Power Query (M) — copiar no Editor Avançado de cada consulta
// Ajuste apenas o caminho do Excel (ou use parâmetro pCaminhoExcel).
// ============================================================

// ---------- Parâmetro (criar primeiro: Nova consulta > Parâmetro) ----------
// Nome: pCaminhoExcel
// Tipo: Texto
// Valor atual: C:\Users\...\data\PCD_Workforce_Base_Ficticia.xlsx
// Na troca para a base real: altere só este parâmetro (ou a fonte da consulta).


// ===================== COLABORADORES =====================
let
    Fonte = Excel.Workbook(File.Contents(pCaminhoExcel), true, true),
    Aba = Fonte{[Item="COLABORADORES", Kind="Sheet"]}[Data],
    Cabecalhos = Table.PromoteHeaders(Aba, [PromoteAllScalars=true]),
    Tipos = Table.TransformColumnTypes(
        Cabecalhos,
        {
            {"Status", type text},
            {"Matrícula", type text},
            {"Nome", type text},
            {"Cargo", type text},
            {"Data de Admissão", type date},
            {"Data de Desligamento", type date},
            {"Planta", type text},
            {"Diretoria", type text},
            {"Gerência", type text},
            {"Área", type text},
            {"Oficina", type text},
            {"Turno", type text},
            {"Classificação", type text},
            {"PCD", type text},
            {"Tipo de Deficiência", type text},
            {"Liderança", type text}
        }
    )
in
    Tipos


// ===================== MOVIMENTAÇÕES =====================
let
    Fonte = Excel.Workbook(File.Contents(pCaminhoExcel), true, true),
    Aba = Fonte{[Item="MOVIMENTAÇÕES", Kind="Sheet"]}[Data],
    Cabecalhos = Table.PromoteHeaders(Aba, [PromoteAllScalars=true]),
    Tipos = Table.TransformColumnTypes(
        Cabecalhos,
        {
            {"Matrícula", type text},
            {"Data Movimento", type date},
            {"Tipo Movimento", type text},
            {"PCD", type text},
            {"Planta", type text},
            {"Diretoria", type text},
            {"Gerência", type text},
            {"Área", type text},
            {"Oficina", type text},
            {"Turno", type text},
            {"Classificação", type text},
            {"Área Anterior", type text},
            {"Área Nova", type text},
            {"Oficina Anterior", type text},
            {"Oficina Nova", type text},
            {"Cargo Anterior", type text},
            {"Cargo Novo", type text}
        }
    )
in
    Tipos


// ===================== HISTÓRICO MENSAL =====================
let
    Fonte = Excel.Workbook(File.Contents(pCaminhoExcel), true, true),
    Aba = Fonte{[Item="HISTÓRICO MENSAL", Kind="Sheet"]}[Data],
    Cabecalhos = Table.PromoteHeaders(Aba, [PromoteAllScalars=true]),
    Tipos = Table.TransformColumnTypes(
        Cabecalhos,
        {
            {"Ano", Int64.Type},
            {"Mês", Int64.Type},
            {"AnoMês", type text},
            {"Data Ref", type date},
            {"Planta", type text},
            {"Oficina", type text},
            {"HC Total", Int64.Type},
            {"HC PCD", Int64.Type}
        }
    )
in
    Tipos


// ===================== METAS =====================
let
    Fonte = Excel.Workbook(File.Contents(pCaminhoExcel), true, true),
    Aba = Fonte{[Item="METAS", Kind="Sheet"]}[Data],
    Cabecalhos = Table.PromoteHeaders(Aba, [PromoteAllScalars=true]),
    Tipos = Table.TransformColumnTypes(
        Cabecalhos,
        {
            {"Ano", Int64.Type},
            {"Mês", Int64.Type},
            {"AnoMês", type text},
            {"Data Ref", type date},
            {"Planta", type text},
            {"Oficina", type text},
            {"Meta % PCD", Percentage.Type}
        }
    )
in
    Tipos


// ===================== DimCalendario (gerada no Power BI — NÃO no Excel) =====================
// Opção A — DAX calculated table (recomendado no Model view):
//
// DimCalendario =
// VAR MinD = MINX ( UNION (
//     DISTINCT ( 'MOVIMENTAÇÕES'[Data Movimento] ),
//     DISTINCT ( 'HISTÓRICO MENSAL'[Data Ref] ),
//     DISTINCT ( METAS[Data Ref] )
// ), [Data Movimento] )  -- ajustar: use CALENDAR com datas fixas se preferir
//
// Melhor (simples e estável):
//
// DimCalendario =
// ADDCOLUMNS (
//     CALENDAR ( DATE ( 2024, 1, 1 ), DATE ( 2026, 12, 31 ) ),
//     "Ano", YEAR ( [Date] ),
//     "Mês", MONTH ( [Date] ),
//     "Nome Mês", FORMAT ( [Date], "MMM" ),
//     "AnoMês", FORMAT ( [Date], "YYYY-MM" ),
//     "AnoMês Ordenacao", YEAR ( [Date] ) * 100 + MONTH ( [Date] ),
//     "Trimestre", "T" & FORMAT ( [Date], "Q" )
// )
//
// Marcar DimCalendario[Date] como Date table.
