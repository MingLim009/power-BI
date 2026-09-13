"""Export full KPI payload for PCD executive preview."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "data" / "PCD_Workforce_Base_Ficticia.xlsx"
OUT = ROOT / "preview" / "data.json"
META = 0.05
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
TURNO_ORDER = ["1º Turno", "2º Turno", "3º Turno", "Administrativo"]
REF = pd.Timestamp("2026-08-31")


def tenure_band(years: float) -> str:
    if years < 1:
        return "<1 ano"
    if years < 3:
        return "1–3 anos"
    if years < 5:
        return "3–5 anos"
    return ">5 anos"


def main():
    col = pd.read_excel(XLSX, "COLABORADORES")
    mov = pd.read_excel(XLSX, "MOVIMENTAÇÕES")
    hist = pd.read_excel(XLSX, "HISTÓRICO MENSAL")

    ativos = col[col["Status"] == "Ativo"].copy()
    pcd = ativos[ativos["PCD"] == "Sim"].copy()
    nao_pcd = ativos[ativos["PCD"] == "Não"].copy()
    hc, hc_pcd = len(ativos), len(pcd)
    pct = hc_pcd / hc if hc else 0
    gap_pp = pct - META
    # Quantidade de PCD que faltam (ou excedem) para bater a meta no HC atual
    meta_headcount = META * hc
    gap_qtd = meta_headcount - hc_pcd  # positivo = falta PCD

    # Tenure PCD
    pcd = pcd.copy()
    pcd["anos"] = (REF - pd.to_datetime(pcd["Data de Admissão"])).dt.days / 365.25
    pcd["faixa"] = pcd["anos"].map(tenure_band)
    tenure = (
        pcd.groupby("faixa", as_index=False)
        .size()
        .rename(columns={"size": "n"})
    )
    order_fx = ["<1 ano", "1–3 anos", "3–5 anos", ">5 anos"]
    tenure["faixa"] = pd.Categorical(tenure["faixa"], categories=order_fx, ordered=True)
    tenure = tenure.sort_values("faixa")

    # Movimentações
    mov_pcd = mov[mov["PCD"] == "Sim"].copy()
    mov_all = mov.copy()
    admissoes = int((mov_pcd["Tipo Movimento"] == "Admissão").sum())
    deslig = int((mov_pcd["Tipo Movimento"] == "Desligamento").sum())
    promo = int((mov_pcd["Tipo Movimento"] == "Promoção").sum())
    interna = int((mov_pcd["Tipo Movimento"] == "Movimentação Interna").sum())
    adm_geral = int((mov_all["Tipo Movimento"] == "Admissão").sum())
    des_geral = int((mov_all["Tipo Movimento"] == "Desligamento").sum())

    # Turnover simples (desligamentos / HC) — proxy no preview
    turnover_pcd = deslig / hc_pcd if hc_pcd else 0
    turnover_geral = des_geral / hc if hc else 0

    # Evolução mensal admissions/deslig PCD (last 12 months of events)
    mov_pcd["Data Movimento"] = pd.to_datetime(mov_pcd["Data Movimento"])
    mov_pcd["AnoMês"] = mov_pcd["Data Movimento"].dt.strftime("%Y-%m")
    ev_adm = (
        mov_pcd[mov_pcd["Tipo Movimento"] == "Admissão"]
        .groupby("AnoMês")
        .size()
        .rename("admissoes")
    )
    ev_des = (
        mov_pcd[mov_pcd["Tipo Movimento"] == "Desligamento"]
        .groupby("AnoMês")
        .size()
        .rename("desligamentos")
    )
    ev = pd.concat([ev_adm, ev_des], axis=1).fillna(0).astype(int)
    meses_full = pd.period_range("2024-01", "2026-08", freq="M").strftime("%Y-%m")
    ev = ev.reindex(meses_full, fill_value=0).reset_index().rename(columns={"index": "AnoMês"})
    # vs período anterior (último vs penúltimo mês com dado, ou totais)
    if len(ev) >= 2:
        adm_vs = int(ev.iloc[-1]["admissoes"] - ev.iloc[-2]["admissoes"])
        des_vs = int(ev.iloc[-1]["desligamentos"] - ev.iloc[-2]["desligamentos"])
        last_adm = int(ev.iloc[-1]["admissoes"])
        last_des = int(ev.iloc[-1]["desligamentos"])
    else:
        adm_vs = des_vs = last_adm = last_des = 0

    # Área summary
    area_rows = []
    for area in AREAS:
        a = ativos[ativos["Área"] == area]
        ap = a[a["PCD"] == "Sim"]
        n, np_ = len(a), len(ap)
        p = np_ / n if n else 0
        adm_a = int(
            ((mov_pcd["Tipo Movimento"] == "Admissão") & (mov_pcd["Área"] == area)).sum()
            if "Área" in mov_pcd.columns
            else ((mov_pcd["Tipo Movimento"] == "Admissão") & (mov_pcd["Oficina"] == area)).sum()
        )
        # Prefer Oficina == area (aligned) for mov
        adm_a = int(
            ((mov_pcd["Tipo Movimento"] == "Admissão") & (mov_pcd["Oficina"] == area)).sum()
        )
        des_a = int(
            ((mov_pcd["Tipo Movimento"] == "Desligamento") & (mov_pcd["Oficina"] == area)).sum()
        )
        area_rows.append(
            {
                "area": area,
                "hc": n,
                "hcPcd": np_,
                "pct": round(p, 4),
                "gap": round(p - META, 4),
                "admissoes": adm_a,
                "desligamentos": des_a,
                "sharePcd": round(np_ / hc_pcd, 4) if hc_pcd else 0,
            }
        )

    # Turno PCD
    turnos = []
    for t in TURNO_ORDER:
        sub = ativos[ativos["Turno"] == t]
        sp = sub[sub["PCD"] == "Sim"]
        n, np_ = len(sub), len(sp)
        turnos.append(
            {
                "turno": t,
                "hc": n,
                "hcPcd": np_,
                "pct": round(np_ / n, 4) if n else 0,
                "sharePcd": round(np_ / hc_pcd, 4) if hc_pcd else 0,
            }
        )

    tipo = (
        pcd.groupby("Tipo de Deficiência")
        .size()
        .reset_index(name="n")
        .sort_values("n", ascending=False)
    )

    # Blue / White — HC, PCD, %
    classif = []
    for nome in ["Blue Collar", "White Collar"]:
        c = ativos[ativos["Classificação"] == nome]
        cp = c[c["PCD"] == "Sim"]
        n, np_ = len(c), len(cp)
        classif.append(
            {
                "nome": nome,
                "hc": n,
                "hcPcd": np_,
                "pct": round(np_ / n, 4) if n else 0,
            }
        )

    lider_pcd = int((pcd["Liderança"] == "Sim").sum())
    lider_total = int((ativos["Liderança"] == "Sim").sum())
    pct_lider_sobre_pcd = lider_pcd / hc_pcd if hc_pcd else 0
    pct_pcd_em_lideranca = lider_pcd / lider_total if lider_total else 0

    hist_m = (
        hist.groupby(["Ano", "Mês", "AnoMês"], as_index=False)[["HC Total", "HC PCD"]]
        .sum()
        .sort_values(["Ano", "Mês"])
    )
    hist_m["pct"] = hist_m["HC PCD"] / hist_m["HC Total"]
    hist_m["meta"] = META

    # Insights automáticos
    worst = min(area_rows, key=lambda r: r["gap"])
    best = max(area_rows, key=lambda r: r["gap"])
    top_conc = max(area_rows, key=lambda r: r["hcPcd"])
    insights = [
        f"GAP geral: {gap_pp*100:.1f} p.p. — faltam ~{max(0, round(gap_qtd))} PCD para a meta de {META*100:.0f}%."
        if gap_qtd > 0
        else f"Meta atingida/superada: GAP {gap_pp*100:.1f} p.p. (excedente ~{abs(round(gap_qtd))} PCD).",
        f"Maior gap: {worst['area']} ({worst['gap']*100:.1f} p.p., {worst['pct']*100:.1f}% PCD).",
        f"Melhor área: {best['area']} ({best['pct']*100:.1f}% PCD, GAP {best['gap']*100:.1f} p.p.).",
        f"Maior concentração PCD: {top_conc['area']} ({top_conc['hcPcd']} pessoas, {top_conc['sharePcd']*100:.0f}% do PCD).",
        f"Turnover PCD {turnover_pcd*100:.1f}% vs geral {turnover_geral*100:.1f}%.",
        f"Liderança: {lider_pcd} PCD em posições de liderança ({pct_lider_sobre_pcd*100:.1f}% dos PCD).",
    ]

    payload = {
        "kpis": {
            "hcTotal": hc,
            "hcPcd": hc_pcd,
            "hcNaoPcd": len(nao_pcd),
            "pctPcd": round(pct, 4),
            "meta": META,
            "gapPp": round(gap_pp, 4),
            "gapQtd": round(gap_qtd, 1),
            "admissoes": admissoes,
            "desligamentos": deslig,
            "promocoes": promo,
            "movInternas": interna,
            "admissoesMes": last_adm,
            "desligamentosMes": last_des,
            "admissoesVsAnt": adm_vs,
            "desligamentosVsAnt": des_vs,
            "turnoverPcd": round(turnover_pcd, 4),
            "turnoverGeral": round(turnover_geral, 4),
            "tenureYears": round(float(pcd["anos"].mean()), 2) if len(pcd) else 0,
            "pctLiderancaSobrePcd": round(pct_lider_sobre_pcd, 4),
            "pctPcdEmLideranca": round(pct_pcd_em_lideranca, 4),
            "liderPcd": lider_pcd,
            "liderTotal": lider_total,
            "qtdAreas": 9,
            "noteHc": "HC Total: no .pbix o valor exato pode ser fixado/ajustado na medida.",
        },
        "representatividade": [
            {"nome": "PCD", "n": hc_pcd},
            {"nome": "Não PCD", "n": len(nao_pcd)},
        ],
        "areas": area_rows,
        "turnos": turnos,
        "tipos": [{"tipo": str(t), "n": int(n)} for t, n in zip(tipo["Tipo de Deficiência"], tipo["n"])],
        "tenure": [{"faixa": str(r.faixa), "n": int(r.n)} for r in tenure.itertuples()],
        "classificacao": classif,
        "turnover": [
            {"nome": "PCD", "taxa": round(turnover_pcd, 4)},
            {"nome": "Geral", "taxa": round(turnover_geral, 4)},
        ],
        "movMensal": [
            {
                "anoMes": str(r["AnoMês"]),
                "admissoes": int(r["admissoes"]),
                "desligamentos": int(r["desligamentos"]),
            }
            for _, r in ev.iterrows()
        ],
        "evolucao": [
            {
                "anoMes": str(row["AnoMês"]),
                "pct": round(float(row["pct"]), 4),
                "meta": META,
                "hcPcd": int(row["HC PCD"]),
                "hcTotal": int(row["HC Total"]),
            }
            for _, row in hist_m.iterrows()
        ],
        "insights": insights,
        "filtros": {
            "plantas": sorted(ativos["Planta"].unique().tolist()),
            "diretorias": sorted(ativos["Diretoria"].unique().tolist()),
            "areas": AREAS,
            "turnos": TURNO_ORDER,
            "meses": [f"{i:02d}" for i in range(1, 13)],
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} | areas={len(area_rows)} | gapQtd={gap_qtd:.1f}")


if __name__ == "__main__":
    main()
