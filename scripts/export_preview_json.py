"""Export JSON aggregates for the executive HTML preview."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "data" / "PCD_Workforce_Base_Ficticia.xlsx"
OUT = ROOT / "preview" / "data.json"
META = 0.05


def main():
    col = pd.read_excel(XLSX, "COLABORADORES")
    mov = pd.read_excel(XLSX, "MOVIMENTAÇÕES")
    hist = pd.read_excel(XLSX, "HISTÓRICO MENSAL")

    ativos = col[col["Status"] == "Ativo"].copy()
    pcd = ativos[ativos["PCD"] == "Sim"]
    hc, hc_pcd = len(ativos), len(pcd)
    pct = hc_pcd / hc if hc else 0

    by_oficina = (
        ativos.groupby("Oficina")
        .agg(hc=("Matrícula", "count"), hc_pcd=("PCD", lambda s: (s == "Sim").sum()))
        .reset_index()
    )
    by_oficina["pct"] = by_oficina["hc_pcd"] / by_oficina["hc"]
    by_oficina["gap"] = by_oficina["pct"] - META
    by_oficina = by_oficina.sort_values("Oficina")

    tipo = (
        pcd[pcd["Tipo de Deficiência"] != "Não se aplica"]
        .groupby("Tipo de Deficiência")
        .size()
        .reset_index(name="n")
        .sort_values("n", ascending=False)
    )

    classif = pcd.groupby("Classificação").size().reset_index(name="n")
    lider = (pcd["Liderança"] == "Sim").mean() if len(pcd) else 0

    mov_pcd = mov[mov["PCD"] == "Sim"]
    admissoes = int((mov_pcd["Tipo Movimento"] == "Admissão").sum())
    deslig = int((mov_pcd["Tipo Movimento"] == "Desligamento").sum())
    promo = int((mov_pcd["Tipo Movimento"] == "Promoção").sum())
    interna = int((mov_pcd["Tipo Movimento"] == "Movimentação Interna").sum())

    mov_ofi = (
        mov_pcd[mov_pcd["Tipo Movimento"].isin(["Admissão", "Desligamento"])]
        .groupby(["Oficina", "Tipo Movimento"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )
    for c in ["Admissão", "Desligamento"]:
        if c not in mov_ofi.columns:
            mov_ofi[c] = 0

    # tenure years
    today = pd.Timestamp("2026-08-31")
    tenure = ((today - pd.to_datetime(pcd["Data de Admissão"])).dt.days / 365.25).mean()

    hist_m = (
        hist.groupby(["Ano", "Mês", "AnoMês"], as_index=False)[["HC Total", "HC PCD"]]
        .sum()
        .sort_values(["Ano", "Mês"])
    )
    hist_m["pct"] = hist_m["HC PCD"] / hist_m["HC Total"]
    hist_m["meta"] = META

    payload = {
        "kpis": {
            "hcTotal": hc,
            "hcPcd": hc_pcd,
            "pctPcd": round(pct, 4),
            "meta": META,
            "gap": round(pct - META, 4),
            "admissoes": admissoes,
            "desligamentos": deslig,
            "promocoes": promo,
            "movInternas": interna,
            "saldo": admissoes - deslig,
            "tenureYears": round(float(tenure), 2) if pd.notna(tenure) else 0,
            "pctLideranca": round(float(lider), 4),
            "pctBlue": round(float((pcd["Classificação"] == "Blue Collar").mean()), 4) if len(pcd) else 0,
            "pctWhite": round(float((pcd["Classificação"] == "White Collar").mean()), 4) if len(pcd) else 0,
        },
        "oficinas": [
            {
                "oficina": r.Oficina,
                "hc": int(r.hc),
                "hcPcd": int(r.hc_pcd),
                "pct": round(float(r.pct), 4),
                "gap": round(float(r.gap), 4),
            }
            for r in by_oficina.itertuples()
        ],
        "tipos": [
            {"tipo": str(t), "n": int(n)}
            for t, n in zip(tipo["Tipo de Deficiência"], tipo["n"])
        ],
        "classificacao": [
            {"nome": str(n), "n": int(c)}
            for n, c in zip(classif["Classificação"], classif["n"])
        ],
        "movOficina": [
            {
                "oficina": str(r["Oficina"]),
                "admissao": int(r["Admissão"]),
                "desligamento": int(r["Desligamento"]),
            }
            for _, r in mov_ofi.iterrows()
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
        "filtros": {
            "plantas": sorted(ativos["Planta"].unique().tolist()),
            "diretorias": sorted(ativos["Diretoria"].unique().tolist()),
            "oficinas": sorted(ativos["Oficina"].unique().tolist()),
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
