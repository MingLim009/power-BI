const fmtPct = (v) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
const fmtInt = (v) => new Intl.NumberFormat("pt-BR").format(v);
const fmtSigned = (v) => `${v > 0 ? "+" : ""}${fmtInt(v)}`;
const C = ["#0b3a5b", "#1b6ca8", "#3d8fc9", "#9ec4e4", "#e67e22", "#5d6d7e", "#1e8449", "#7d3c98", "#16a085"];
const tick = { color: "#102033", font: { family: "Inter", size: 11, weight: "700" } };
const grid = "#e8eef5";
const META = 0.05;
const FAIXAS = ["<1 ano", "1–3 anos", "3–5 anos", ">5 anos"];
const REF = new Date("2026-08-31");

let RAW = null;
const charts = {};

const val = (id) => document.getElementById(id).value;

function tenureBand(iso) {
  const years = (REF - new Date(iso)) / (365.25 * 86400000);
  if (years < 1) return "<1 ano";
  if (years < 3) return "1–3 anos";
  if (years < 5) return "3–5 anos";
  return ">5 anos";
}

function filters() {
  return { ano: val("fAno"), mes: val("fMes"), planta: val("fPlanta"), area: val("fArea"), turno: val("fTurno") };
}

function matchOrg(row, f) {
  if (f.planta && row.p !== f.planta) return false;
  if (f.area && row.a !== f.area) return false;
  if (f.turno && row.t !== f.turno) return false;
  return true;
}

function matchYm(ym, f) {
  if (f.ano && ym.slice(0, 4) !== f.ano) return false;
  if (f.mes && ym.slice(5, 7) !== f.mes) return false;
  return true;
}

function toggleFilter(id, value) {
  const el = document.getElementById(id);
  el.value = el.value === value ? "" : value;
  render();
}

function compute() {
  const f = filters();
  const areas = RAW.filtros.areas;
  const turnos = RAW.filtros.turnos;
  const colab = RAW.colab.filter((r) => matchOrg(r, f));
  const mov = RAW.mov.filter((r) => matchOrg(r, f) && matchYm(r.ym, f));
  const hist = RAW.hist.filter((r) => matchOrg(r, f) && matchYm(r.ym, f));

  const hc = colab.length;
  const pcd = colab.filter((r) => r.pcd);
  const hcPcd = pcd.length;
  const pct = hc ? hcPcd / hc : 0;
  const gapPp = pct - META;
  const gapQtd = META * hc - hcPcd;

  const countMov = (k, onlyPcd = true) =>
    mov.filter((r) => r.k === k && (!onlyPcd || r.pcd)).length;

  const admissoes = countMov("Admissão");
  const desligamentos = countMov("Desligamento");
  const promocoes = countMov("Promoção");
  const movInternas = countMov("Movimentação Interna");
  const desGeral = countMov("Desligamento", false);

  const ymKeys = [...new Set(mov.map((r) => r.ym))].sort();
  const lastYm = ymKeys[ymKeys.length - 1];
  const prevYm = ymKeys[ymKeys.length - 2];
  const lastAdm = lastYm ? mov.filter((r) => r.pcd && r.k === "Admissão" && r.ym === lastYm).length : 0;
  const lastDes = lastYm ? mov.filter((r) => r.pcd && r.k === "Desligamento" && r.ym === lastYm).length : 0;
  const prevAdm = prevYm ? mov.filter((r) => r.pcd && r.k === "Admissão" && r.ym === prevYm).length : 0;
  const prevDes = prevYm ? mov.filter((r) => r.pcd && r.k === "Desligamento" && r.ym === prevYm).length : 0;

  const areaRows = areas.map((area) => {
    const a = colab.filter((r) => r.a === area);
    const n = a.length;
    const np = a.filter((r) => r.pcd).length;
    const p = n ? np / n : 0;
    const admA = mov.filter((r) => r.pcd && r.k === "Admissão" && r.a === area).length;
    const desA = mov.filter((r) => r.pcd && r.k === "Desligamento" && r.a === area).length;
    return { area, hc: n, hcPcd: np, pct: p, gap: p - META, admissoes: admA, desligamentos: desA, sharePcd: hcPcd ? np / hcPcd : 0 };
  });

  const tipoMap = {};
  pcd.forEach((r) => {
    if (r.tipo && r.tipo !== "Não se aplica") tipoMap[r.tipo] = (tipoMap[r.tipo] || 0) + 1;
  });
  const tipos = Object.entries(tipoMap)
    .map(([tipo, n]) => ({ tipo, n }))
    .sort((x, y) => y.n - x.n);

  const tenureMap = Object.fromEntries(FAIXAS.map((x) => [x, 0]));
  pcd.forEach((r) => {
    tenureMap[tenureBand(r.adm)] += 1;
  });

  const classif = ["Blue Collar", "White Collar"].map((nome) => {
    const c = colab.filter((r) => r.cls === nome);
    const np = c.filter((r) => r.pcd).length;
    return { nome, hc: c.length, hcPcd: np, pct: c.length ? np / c.length : 0 };
  });

  const liderPcd = pcd.filter((r) => r.lid).length;
  const liderTotal = colab.filter((r) => r.lid).length;
  const turnoverPcd = hcPcd ? desligamentos / hcPcd : 0;
  const turnoverGeral = hc ? desGeral / hc : 0;

  const histByYm = {};
  hist.forEach((r) => {
    if (!histByYm[r.ym]) histByYm[r.ym] = { hc: 0, pcd: 0 };
    histByYm[r.ym].hc += r.hc;
    histByYm[r.ym].pcd += r.pcd;
  });
  const evolucao = Object.keys(histByYm)
    .sort()
    .map((ym) => ({
      anoMes: ym,
      hcTotal: histByYm[ym].hc,
      hcPcd: histByYm[ym].pcd,
      pct: histByYm[ym].hc ? histByYm[ym].pcd / histByYm[ym].hc : 0,
      meta: META,
    }));

  const months = [...new Set(RAW.hist.map((r) => r.ym))].sort().filter((ym) => matchYm(ym, f));
  const movMensal = months.map((ym) => ({
    anoMes: ym,
    admissoes: mov.filter((r) => r.pcd && r.k === "Admissão" && r.ym === ym).length,
    desligamentos: mov.filter((r) => r.pcd && r.k === "Desligamento" && r.ym === ym).length,
  }));

  const worst = [...areaRows].sort((a, b) => a.gap - b.gap)[0];
  const best = [...areaRows].sort((a, b) => b.gap - a.gap)[0];
  const top = [...areaRows].sort((a, b) => b.hcPcd - a.hcPcd)[0];

  return {
    kpis: {
      hcTotal: hc,
      hcPcd,
      pctPcd: pct,
      meta: META,
      gapPp,
      gapQtd,
      admissoes,
      desligamentos,
      promocoes,
      movInternas,
      admissoesMes: lastAdm,
      desligamentosMes: lastDes,
      admissoesVsAnt: lastAdm - prevAdm,
      desligamentosVsAnt: lastDes - prevDes,
      turnoverPcd,
      turnoverGeral,
      pctPcdEmLideranca: liderTotal ? liderPcd / liderTotal : 0,
      liderPcd,
      liderTotal,
    },
    representatividade: [
      { nome: "PCD", n: hcPcd },
      { nome: "Não PCD", n: hc - hcPcd },
    ],
    areas: areaRows,
    turnos: turnos.map((turno) => {
      const s = colab.filter((r) => r.t === turno);
      const np = s.filter((r) => r.pcd).length;
      return { turno, hc: s.length, hcPcd: np, pct: s.length ? np / s.length : 0 };
    }),
    tipos,
    tenure: FAIXAS.map((faixa) => ({ faixa, n: tenureMap[faixa] })),
    classificacao: classif,
    turnover: [
      { nome: "PCD", taxa: turnoverPcd },
      { nome: "Geral", taxa: turnoverGeral },
    ],
    movMensal,
    evolucao,
    insights: [
      gapQtd > 0
        ? `GAP geral: ${(gapPp * 100).toFixed(1)} p.p. — faltam ~${Math.max(0, Math.round(gapQtd))} PCD para a meta de 5%.`
        : `Meta atingida/superada: GAP ${(gapPp * 100).toFixed(1)} p.p.`,
      `Maior gap: ${worst.area} (${(worst.gap * 100).toFixed(1)} p.p.).`,
      `Melhor área: ${best.area} (${(best.pct * 100).toFixed(1)}% PCD).`,
      `Maior concentração PCD: ${top.area} (${top.hcPcd} pessoas).`,
      `Turnover PCD ${(turnoverPcd * 100).toFixed(1)}% vs geral ${(turnoverGeral * 100).toFixed(1)}%.`,
      `Liderança: ${liderPcd} PCD ÷ ${liderTotal} posições de liderança (${liderTotal ? ((liderPcd / liderTotal) * 100).toFixed(1) : "0,0"}%).`,
    ],
  };
}

function paintKpis(k) {
  document.getElementById("kHc").textContent = fmtInt(k.hcTotal);
  document.getElementById("kPcd").textContent = fmtInt(k.hcPcd);
  document.getElementById("kPct").textContent = fmtPct(k.pctPcd);
  document.getElementById("kMeta").textContent = fmtPct(k.meta);
  const gap = document.getElementById("kGap");
  gap.textContent = fmtPct(k.gapPp);
  gap.className = `val ${k.gapPp < 0 ? "neg" : "pos"}`;
  const tGap = document.getElementById("tGap");
  const qtd = Math.abs(Math.round(k.gapQtd));
  tGap.textContent = k.gapQtd > 0 ? `Faltam ~${qtd} PCD` : k.gapQtd < 0 ? `Excedente ~${qtd} PCD` : "Na meta";
  tGap.className = `trend ${k.gapPp < 0 ? "neg" : "pos"}`;
  document.getElementById("kLid").textContent = fmtPct(k.pctPcdEmLideranca);
  document.getElementById("tLid").textContent = `${fmtInt(k.liderPcd)} PCD ÷ ${fmtInt(k.liderTotal)} lideranças`;
  document.getElementById("kAdm").textContent = fmtInt(k.admissoes);
  document.getElementById("kDes").textContent = fmtInt(k.desligamentos);
  document.getElementById("kPro").textContent = fmtInt(k.promocoes);
  document.getElementById("kMov").textContent = fmtInt(k.movInternas);
  document.getElementById("kTurnP").textContent = fmtPct(k.turnoverPcd);
  document.getElementById("kTurnG").textContent = fmtPct(k.turnoverGeral);
  const tAdm = document.getElementById("tAdm");
  tAdm.textContent = `Mês: ${fmtInt(k.admissoesMes)} (${fmtSigned(k.admissoesVsAnt)})`;
  tAdm.className = `trend ${k.admissoesVsAnt >= 0 ? "pos" : "neg"}`;
  const tDes = document.getElementById("tDes");
  tDes.textContent = `Mês: ${fmtInt(k.desligamentosMes)} (${fmtSigned(k.desligamentosVsAnt)})`;
  tDes.className = `trend ${k.desligamentosVsAnt <= 0 ? "pos" : "neg"}`;
  document.getElementById("tTurn").textContent = `Geral ${fmtPct(k.turnoverGeral)}`;
}

function paintTable(rows) {
  document.getElementById("areaBody").innerHTML = rows
    .map((r) => {
      const g = r.gap < 0 ? "gap-neg" : "gap-pos";
      return `<tr>
        <td>${r.area}</td>
        <td>${fmtInt(r.hc)}</td>
        <td>${fmtInt(r.hcPcd)}</td>
        <td>${fmtPct(r.pct)}</td>
        <td class="${g}">${fmtPct(r.gap)}</td>
        <td>${fmtInt(r.admissoes)}</td>
        <td>${fmtInt(r.desligamentos)}</td>
      </tr>`;
    })
    .join("");
}

function upsert(id, cfg) {
  if (charts[id]) {
    charts[id].data = cfg.data;
    charts[id].options = cfg.options;
    charts[id].update();
    return;
  }
  charts[id] = new Chart(document.getElementById(id), cfg);
}

function paintCharts(data) {
  const labelsE = data.evolucao.map((e) => e.anoMes.slice(5) + "/" + e.anoMes.slice(2, 4));
  const clickArea = { onClick: (_, els, ch) => els[0] && toggleFilter("fArea", ch.data.labels[els[0].index]) };
  const clickTurno = { onClick: (_, els, ch) => els[0] && toggleFilter("fTurno", ch.data.labels[els[0].index]) };

  upsert("chartRep", {
    type: "doughnut",
    data: {
      labels: data.representatividade.map((r) => r.nome),
      datasets: [{ data: data.representatividade.map((r) => r.n), backgroundColor: ["#0b3a5b", "#9ec4e4"], borderWidth: 0, cutout: "62%" }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { ...tick, boxWidth: 10 } } } },
  });

  upsert("chartEvol", {
    type: "line",
    data: {
      labels: labelsE,
      datasets: [{
        label: "% PCD",
        data: data.evolucao.map((e) => +(e.pct * 100).toFixed(2)),
        borderColor: "#1b6ca8",
        backgroundColor: "rgba(27,108,168,0.18)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { ...tick, maxTicksLimit: 10 }, grid: { display: false } },
        y: { ticks: { ...tick, callback: (v) => v + "%" }, grid: { color: grid } },
      },
    },
  });

  upsert("chartArea", {
    type: "bar",
    data: {
      labels: data.areas.map((a) => a.area),
      datasets: [
        { label: "HC", data: data.areas.map((a) => a.hc), backgroundColor: "#9ec4e4", borderRadius: 3 },
        { label: "PCD", data: data.areas.map((a) => a.hcPcd), backgroundColor: "#0b3a5b", borderRadius: 3 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { ...tick, boxWidth: 10 } } },
      scales: {
        x: { ticks: { ...tick, maxRotation: 45, autoSkip: false, font: { ...tick.font, size: 10 } }, grid: { display: false } },
        y: { ticks: tick, grid: { color: grid }, beginAtZero: true },
      },
      ...clickArea,
    },
  });

  upsert("chartDist", {
    type: "bar",
    data: {
      labels: data.areas.map((a) => a.area),
      datasets: [{ label: "% do PCD", data: data.areas.map((a) => +(a.sharePcd * 100).toFixed(1)), backgroundColor: "#1b6ca8", borderRadius: 4 }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { ...tick, callback: (v) => v + "%" }, grid: { color: grid } },
        y: { ticks: { ...tick, autoSkip: false, font: { ...tick.font, size: 10 } }, grid: { display: false } },
      },
      ...clickArea,
    },
  });

  const total = data.tipos.reduce((s, t) => s + t.n, 0) || 1;
  document.getElementById("tipoTotal").textContent = fmtInt(total);
  document.getElementById("tipoLeg").innerHTML = data.tipos
    .map((t, i) => `<li><span class="sw" style="background:${C[i % C.length]}"></span><span>${t.tipo}</span><b>${((t.n / total) * 100).toFixed(0)}%</b></li>`)
    .join("");
  upsert("chartTipo", {
    type: "doughnut",
    data: {
      labels: data.tipos.map((t) => t.tipo),
      datasets: [{ data: data.tipos.map((t) => t.n), backgroundColor: C, borderWidth: 0, cutout: "68%" }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  upsert("chartTurno", {
    type: "bar",
    data: {
      labels: data.turnos.map((t) => t.turno),
      datasets: [
        { label: "HC", data: data.turnos.map((t) => t.hc), backgroundColor: "#9ec4e4", borderRadius: 4 },
        { label: "PCD", data: data.turnos.map((t) => t.hcPcd), backgroundColor: "#0b3a5b", borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { ...tick, boxWidth: 10 } } },
      scales: {
        x: { ticks: { ...tick, font: { ...tick.font, size: 10 } }, grid: { display: false } },
        y: { ticks: tick, grid: { color: grid }, beginAtZero: true },
      },
      ...clickTurno,
    },
  });

  upsert("chartTenure", {
    type: "bar",
    data: {
      labels: data.tenure.map((t) => t.faixa),
      datasets: [{ label: "PCD", data: data.tenure.map((t) => t.n), backgroundColor: "#3d8fc9", borderRadius: 4 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: tick, grid: { display: false } },
        y: { ticks: tick, grid: { color: grid }, beginAtZero: true },
      },
    },
  });

  const lm = data.movMensal.slice(-18);
  upsert("chartMovMes", {
    type: "bar",
    data: {
      labels: lm.map((m) => m.anoMes.slice(5) + "/" + m.anoMes.slice(2, 4)),
      datasets: [
        { type: "bar", label: "Admissões PCD", data: lm.map((m) => m.admissoes), backgroundColor: "#1b6ca8", borderRadius: 3, order: 2 },
        { type: "bar", label: "Desligamentos PCD", data: lm.map((m) => m.desligamentos), backgroundColor: "#9ec4e4", borderRadius: 3, order: 2 },
        {
          type: "line",
          label: "Saldo (Adm − Desl)",
          data: lm.map((m) => m.admissoes - m.desligamentos),
          borderColor: "#0b3a5b",
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { ...tick, boxWidth: 10 } } },
      scales: {
        x: { ticks: { ...tick, maxTicksLimit: 12 }, grid: { display: false } },
        y: { ticks: tick, grid: { color: grid }, beginAtZero: true },
      },
    },
  });

  upsert("chartClass", {
    type: "bar",
    data: {
      labels: data.classificacao.map((c) => c.nome),
      datasets: [
        { label: "HC", data: data.classificacao.map((c) => c.hc), backgroundColor: "#9ec4e4", borderRadius: 4 },
        { label: "PCD", data: data.classificacao.map((c) => c.hcPcd), backgroundColor: "#0b3a5b", borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { ...tick, boxWidth: 10 } },
        tooltip: { callbacks: { afterBody: (items) => `% PCD: ${fmtPct(data.classificacao[items[0].dataIndex].pct)}` } },
      },
      scales: {
        x: { ticks: tick, grid: { display: false } },
        y: { ticks: tick, grid: { color: grid }, beginAtZero: true },
      },
    },
  });

  upsert("chartMeta", {
    type: "line",
    data: {
      labels: labelsE,
      datasets: [
        {
          label: "Realizado",
          data: data.evolucao.map((e) => +(e.pct * 100).toFixed(2)),
          borderColor: "#0b3a5b",
          backgroundColor: "rgba(11,58,91,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2.5,
        },
        {
          label: "Meta",
          data: data.evolucao.map((e) => +(e.meta * 100).toFixed(2)),
          borderColor: "#e67e22",
          borderDash: [6, 4],
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { ...tick, boxWidth: 10 } } },
      scales: {
        x: { ticks: { ...tick, maxTicksLimit: 8 }, grid: { display: false } },
        y: { ticks: { ...tick, callback: (v) => v + "%" }, grid: { color: grid } },
      },
    },
  });

  upsert("chartTurnover", {
    type: "bar",
    data: {
      labels: data.turnover.map((t) => t.nome),
      datasets: [{ data: data.turnover.map((t) => +(t.taxa * 100).toFixed(2)), backgroundColor: ["#0b3a5b", "#3d8fc9"], borderRadius: 6, barThickness: 48 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: tick, grid: { display: false } },
        y: { ticks: { ...tick, callback: (v) => v + "%" }, grid: { color: grid }, beginAtZero: true },
      },
    },
  });
}

function render() {
  const view = compute();
  paintKpis(view.kpis);
  paintTable(view.areas);
  document.getElementById("insightList").innerHTML = view.insights.map((t) => `<li>${t}</li>`).join("");
  paintCharts(view);
}

async function boot() {
  RAW = await (await fetch("data.json")).json();
  const add = (id, items) => {
    const el = document.getElementById(id);
    items.forEach((v) => el.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`));
  };
  add("fPlanta", RAW.filtros.plantas);
  add("fArea", RAW.filtros.areas);
  add("fTurno", RAW.filtros.turnos);
  add("fMes", RAW.filtros.meses);
  [...new Set(RAW.hist.map((e) => e.ym.slice(0, 4)))].forEach((y) => {
    document.getElementById("fAno").insertAdjacentHTML("beforeend", `<option value="${y}">${y}</option>`);
  });
  ["fAno", "fMes", "fPlanta", "fArea", "fTurno"].forEach((id) => {
    document.getElementById(id).addEventListener("change", render);
  });
  document.getElementById("btnMore").onclick = () => {
    const box = document.getElementById("moreBox");
    box.hidden = !box.hidden;
  };
  render();
}

boot().catch((e) => {
  document.body.innerHTML = `<p style="padding:24px;font-family:Inter,sans-serif;font-weight:800;color:#0b3a5b">Erro data.json<br>${e}</p>`;
});
