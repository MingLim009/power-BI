"""
Generate synthetic PCD Workforce & Inclusion Excel base (LGPD-safe).
Same schema as the real file — swap later without breaking the model.
"""
from __future__ import annotations

import random
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "PCD_Workforce_Base_Ficticia.xlsx"

SEED = 42
random.seed(SEED)

# --- Dimensions (multinational plant / org structure) ---
PLANTAS = ["Planta Norte", "Planta Sul", "Planta Leste", "Planta Oeste"]
DIRETORIAS = ["Operações", "Industrial", "Qualidade", "Supply Chain", "Administrativo"]
GERENCIAS = [
    "Prod. Contínua",
    "Manutenção",
    "Logística",
    "RH & Gente",
    "Finanças",
    "Engenharia",
    "Comercial",
]
# 9 áreas oficiais (cliente) — usadas em Área e Oficina (mesmo domínio)
AREAS = [
    "Montagem",
    "Qualidade",
    "Pintura",
    "Logística",
    "Funilaria",
    "Supply Chain",
    "Prensa",
    "General Service",
    "Staff e Outras",
]
OFICINAS = AREAS  # análise por área oficial (9)
TURNOS = ["1º Turno", "2º Turno", "3º Turno", "Administrativo"]
CLASSIFICACOES = ["Blue Collar", "White Collar"]
TIPOS_DEF = [
    "Física",
    "Auditiva",
    "Visual",
    "Intelectual",
    "Múltipla",
    "Não se aplica",
]
CARGOS_BC = [
    "Operador I",
    "Operador II",
    "Operador III",
    "Técnico de Manutenção",
    "Inspetor de Qualidade",
    "Separador",
    "Motorista Interno",
]
CARGOS_WC = [
    "Analista Jr",
    "Analista Pl",
    "Analista Sr",
    "Coordenador",
    "Supervisor",
    "Especialista",
    "Assistente Administrativo",
]
CARGOS_LIDER = ["Supervisor", "Coordenador", "Gerente", "Líder de Equipe"]

FIRST = [
    "Ana", "Bruno", "Carla", "Diego", "Elena", "Fábio", "Gisele", "Hugo",
    "Iris", "João", "Karen", "Lucas", "Marina", "Nicolas", "Olívia", "Paulo",
    "Queila", "Rafael", "Sofia", "Thiago", "Ursula", "Victor", "Wendy", "Yuri",
    "Zélia", "André", "Beatriz", "Caio", "Daniela", "Eduardo",
]
LAST = [
    "Almeida", "Barbosa", "Cardoso", "Dias", "Esteves", "Fernandes", "Gomes",
    "Henrique", "Ibrahim", "Jesus", "Klein", "Lima", "Mendes", "Nogueira",
    "Oliveira", "Pereira", "Queiroz", "Rocha", "Santos", "Teixeira", "Uchoa",
    "Vieira", "Wagner", "Xavier", "Yamamoto", "Zanetti",
]

META_PCT = 0.05  # 5% corporate target
N_EMPLOYEES = 1200
START_HIST = date(2024, 1, 1)
END_REF = date(2026, 8, 31)


def fake_name(i: int) -> str:
    return f"{FIRST[i % len(FIRST)]} {LAST[(i * 7) % len(LAST)]}"


def month_starts(start: date, end: date) -> list[date]:
    out = []
    y, m = start.year, start.month
    while date(y, m, 1) <= end:
        out.append(date(y, m, 1))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return out


def build_colaboradores() -> pd.DataFrame:
    rows = []
    for i in range(1, N_EMPLOYEES + 1):
        matricula = f"M{i:05d}"
        planta = random.choice(PLANTAS)
        diretoria = random.choice(DIRETORIAS)
        gerencia = random.choice(GERENCIAS)
        area = random.choice(AREAS)
        oficina = area  # alinhado às 9 áreas oficiais
        # Blue collar heavier in production areas
        if area in {"Montagem", "Pintura", "Funilaria", "Prensa"}:
            classificacao = random.choices(CLASSIFICACOES, weights=[78, 22])[0]
        elif area in {"Staff e Outras", "Supply Chain", "General Service"}:
            classificacao = random.choices(CLASSIFICACOES, weights=[30, 70])[0]
        else:
            classificacao = random.choices(CLASSIFICACOES, weights=[45, 55])[0]

        if classificacao == "Blue Collar":
            cargo = random.choice(CARGOS_BC)
            turno = random.choices(TURNOS, weights=[40, 35, 20, 5])[0]
        else:
            cargo = random.choice(CARGOS_WC)
            turno = random.choices(TURNOS, weights=[5, 5, 5, 85])[0]

        lideranca = "Sim" if cargo in CARGOS_LIDER or random.random() < 0.06 else "Não"
        if lideranca == "Sim" and cargo not in CARGOS_LIDER:
            cargo = random.choice(CARGOS_LIDER)

        # ~4.2% PCD overall with slight plant variation
        plant_boost = {"Planta Norte": 0.01, "Planta Sul": 0.0, "Planta Leste": -0.005, "Planta Oeste": 0.008}
        p_pcd = 0.042 + plant_boost[planta]
        is_pcd = random.random() < p_pcd
        pcd = "Sim" if is_pcd else "Não"
        tipo_def = random.choice(TIPOS_DEF[:-1]) if is_pcd else "Não se aplica"

        # Hire dates spread over years
        days_back = random.randint(30, 365 * 8)
        dt_adm = END_REF - timedelta(days=days_back)

        # ~8% terminated
        ativo = random.random() > 0.08
        if ativo:
            status = "Ativo"
            dt_desl = None
        else:
            status = "Desligado"
            max_days = max(61, (END_REF - dt_adm).days)
            dt_desl = dt_adm + timedelta(days=random.randint(60, max_days))
            if dt_desl > END_REF:
                dt_desl = END_REF - timedelta(days=random.randint(0, 60))

        rows.append(
            {
                "Status": status,
                "Matrícula": matricula,
                "Nome": fake_name(i),
                "Cargo": cargo,
                "Data de Admissão": dt_adm,
                "Data de Desligamento": dt_desl,
                "Planta": planta,
                "Diretoria": diretoria,
                "Gerência": gerencia,
                "Área": area,
                "Oficina": oficina,
                "Turno": turno,
                "Classificação": classificacao,
                "PCD": pcd,
                "Tipo de Deficiência": tipo_def,
                "Liderança": lideranca,
            }
        )
    return pd.DataFrame(rows)


def build_movimentacoes(colab: pd.DataFrame) -> pd.DataFrame:
    rows = []
    # Admission events for everyone
    for _, r in colab.iterrows():
        rows.append(
            {
                "Matrícula": r["Matrícula"],
                "Data Movimento": r["Data de Admissão"],
                "Tipo Movimento": "Admissão",
                "PCD": r["PCD"],
                "Planta": r["Planta"],
                "Diretoria": r["Diretoria"],
                "Gerência": r["Gerência"],
                "Área": r["Área"],
                "Oficina": r["Oficina"],
                "Turno": r["Turno"],
                "Classificação": r["Classificação"],
                "Área Anterior": None,
                "Área Nova": r["Área"],
                "Oficina Anterior": None,
                "Oficina Nova": r["Oficina"],
                "Cargo Anterior": None,
                "Cargo Novo": r["Cargo"],
            }
        )
        if r["Status"] == "Desligado" and pd.notna(r["Data de Desligamento"]):
            rows.append(
                {
                    "Matrícula": r["Matrícula"],
                    "Data Movimento": r["Data de Desligamento"],
                    "Tipo Movimento": "Desligamento",
                    "PCD": r["PCD"],
                    "Planta": r["Planta"],
                    "Diretoria": r["Diretoria"],
                    "Gerência": r["Gerência"],
                    "Área": r["Área"],
                    "Oficina": r["Oficina"],
                    "Turno": r["Turno"],
                    "Classificação": r["Classificação"],
                    "Área Anterior": r["Área"],
                    "Área Nova": None,
                    "Oficina Anterior": r["Oficina"],
                    "Oficina Nova": None,
                    "Cargo Anterior": r["Cargo"],
                    "Cargo Novo": None,
                }
            )

    # Promotions & internal moves for subset of active PCD + some non-PCD
    ativos = colab[colab["Status"] == "Ativo"]
    sample = ativos.sample(n=min(280, len(ativos)), random_state=SEED)
    for _, r in sample.iterrows():
        kind = random.choices(
            ["Promoção", "Movimentação Interna"],
            weights=[35, 65],
        )[0]
        move_day = r["Data de Admissão"] + timedelta(days=random.randint(180, 2000))
        if move_day > END_REF:
            continue
        nova_area = random.choice(AREAS)
        nova_oficina = nova_area
        novo_cargo = (
            random.choice(CARGOS_LIDER + CARGOS_WC)
            if kind == "Promoção"
            else random.choice(CARGOS_BC + CARGOS_WC)
        )
        rows.append(
            {
                "Matrícula": r["Matrícula"],
                "Data Movimento": move_day,
                "Tipo Movimento": kind,
                "PCD": r["PCD"],
                "Planta": r["Planta"],
                "Diretoria": r["Diretoria"],
                "Gerência": r["Gerência"],
                "Área": nova_area,
                "Oficina": nova_oficina,
                "Turno": r["Turno"],
                "Classificação": r["Classificação"],
                "Área Anterior": r["Área"],
                "Área Nova": nova_area,
                "Oficina Anterior": r["Oficina"],
                "Oficina Nova": nova_oficina,
                "Cargo Anterior": r["Cargo"],
                "Cargo Novo": novo_cargo,
            }
        )
    df = pd.DataFrame(rows)
    return df.sort_values(["Data Movimento", "Matrícula"]).reset_index(drop=True)


def build_historico_mensal(colab: pd.DataFrame) -> pd.DataFrame:
    """Point-in-time headcount by plant/oficina each month (synthetic but coherent)."""
    months = month_starts(START_HIST, END_REF)
    rows = []
    # Bias: grow slowly + PCD share drifts toward meta
    for mi, m in enumerate(months):
        growth = 1 + mi * 0.004
        pcd_lift = min(0.012, mi * 0.00045)
        for planta in PLANTAS:
            for oficina in OFICINAS:
                base = random.randint(32, 55)
                hc = int(base * growth * random.uniform(0.92, 1.08))
                rate = 0.035 + pcd_lift + random.uniform(-0.008, 0.01)
                rate = max(0.015, min(0.09, rate))
                hc_pcd = max(0, int(round(hc * rate)))
                rows.append(
                    {
                        "Ano": m.year,
                        "Mês": m.month,
                        "AnoMês": m.strftime("%Y-%m"),
                        "Data Ref": m,
                        "Planta": planta,
                        "Oficina": oficina,
                        "HC Total": hc,
                        "HC PCD": hc_pcd,
                    }
                )
    return pd.DataFrame(rows)


def build_metas(historico: pd.DataFrame) -> pd.DataFrame:
    keys = historico[["Ano", "Mês", "AnoMês", "Data Ref", "Planta", "Oficina"]].drop_duplicates()
    keys = keys.copy()
    keys["Meta % PCD"] = META_PCT
    return keys


def style_header(ws):
    fill = PatternFill("solid", fgColor="1B4F72")
    font = Font(color="FFFFFF", bold=True, name="Calibri", size=11)
    thin = Border(
        left=Side(style="thin", color="D0D7DE"),
        right=Side(style="thin", color="D0D7DE"),
        top=Side(style="thin", color="D0D7DE"),
        bottom=Side(style="thin", color="D0D7DE"),
    )
    for cell in ws[1]:
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions


def write_df(wb: Workbook, title: str, df: pd.DataFrame):
    ws = wb.create_sheet(title)
    # Convert dates for excel
    df2 = df.copy()
    for col in df2.columns:
        if pd.api.types.is_datetime64_any_dtype(df2[col]):
            df2[col] = pd.to_datetime(df2[col]).dt.tz_localize(None)
    for row in dataframe_to_rows(df2, index=False, header=True):
        ws.append(row)
    style_header(ws)
    for i, col in enumerate(df2.columns, 1):
        width = min(28, max(12, len(str(col)) + 2))
        if len(df2):
            maxlen = df2[col].astype(str).head(50).str.len().max()
            sample = int(maxlen) if pd.notna(maxlen) else 10
        else:
            sample = 10
        ws.column_dimensions[get_column_letter(i)].width = min(32, max(width, sample + 2))
    # Date formats
    for col_idx, col in enumerate(df2.columns, 1):
        name = str(col).lower()
        if "data" in name:
            for row in range(2, ws.max_row + 1):
                ws.cell(row=row, column=col_idx).number_format = "DD/MM/YYYY"
        if col == "Meta % PCD":
            for row in range(2, ws.max_row + 1):
                ws.cell(row=row, column=col_idx).number_format = "0.00%"


def main():
    print("Building COLABORADORES...")
    colab = build_colaboradores()
    print("Building MOVIMENTAÇÕES...")
    mov = build_movimentacoes(colab)
    print("Building HISTÓRICO MENSAL...")
    hist = build_historico_mensal(colab)
    print("Building METAS...")
    metas = build_metas(hist)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    # remove default
    wb.remove(wb.active)
    write_df(wb, "COLABORADORES", colab)
    write_df(wb, "MOVIMENTAÇÕES", mov)
    write_df(wb, "HISTÓRICO MENSAL", hist)
    write_df(wb, "METAS", metas)

    # Cover / README sheet
    ws = wb.create_sheet("LEIA-ME", 0)
    ws["A1"] = "PCD Workforce & Inclusion — Base Fictícia (LGPD)"
    ws["A1"].font = Font(bold=True, size=14, color="1B4F72")
    lines = [
        "",
        "Uso: desenvolver e validar o Power BI. Substitua este arquivo pela base real mantendo os NOMES das abas e colunas.",
        "Indicadores (% PCD, GAP, etc.) são calculados no Power BI (DAX), não nesta planilha.",
        "",
        "Abas:",
        "1) COLABORADORES — cadastro e situação atual",
        "2) MOVIMENTAÇÕES — Admissão | Desligamento | Promoção | Movimentação Interna",
        "3) HISTÓRICO MENSAL — HC Total e HC PCD por Ano/Mês/Planta/Área (Oficina = área oficial)",
        "4) METAS — Meta % PCD por período/planta/área",
        "",
        "Áreas oficiais (9): Montagem, Qualidade, Pintura, Logística, Funilaria, Supply Chain, Prensa, General Service, Staff e Outras",
        "",
        "Calendário: criado no Power BI (não entra no Excel).",
        f"Gerado em: {date.today().isoformat()} | Seed={SEED} | Meta padrão={META_PCT:.0%}",
        f"Resumo sintético: {len(colab)} colaboradores | {len(mov)} movimentos | {len(hist)} linhas histórico | {len(metas)} metas",
        f"HC Ativo: {(colab['Status']=='Ativo').sum()} | PCD Ativo: {((colab['Status']=='Ativo') & (colab['PCD']=='Sim')).sum()}",
    ]
    for i, t in enumerate(lines, start=2):
        ws[f"A{i}"] = t
    ws.column_dimensions["A"].width = 110

    wb.save(OUT)
    print(f"Saved: {OUT}")
    ativos = colab[colab["Status"] == "Ativo"]
    pct = (ativos["PCD"] == "Sim").mean()
    print(f"Active HC={len(ativos)} | Active PCD%={pct:.2%}")


if __name__ == "__main__":
    main()
