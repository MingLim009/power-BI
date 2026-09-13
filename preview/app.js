const fmtPct = (v) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
const fmtInt = (v) => new Intl.NumberFormat("pt-BR").format(v);
const fmtSigned = (v) => `${v > 0 ? "+" : ""}${fmtInt(v)}`;
const C = ["#7ec4ef", "#4aa3e0", "#2f87c8", "#1a6fb3", "#f0a04b", "#9ec4e4", "#5ed48a", "#8e6cff", "#16a085"];
const tick = { color: "#d5e9f6", font: { family: "Inter", size: 11, weight: "700" } };
const grid = "#1d5a86";

async function boot() {
  const data = await (await fetch("data.json")).json();
  fillFilters(data);
  paintKpis(data.kpis);
  paintTable(data.areas);
  paintInsights(data.insights);
  paintCharts(data);
  document.getElementById("btnMore").onclick = () => {
    const box = document.getElementById("moreBox");
    box.hidden = !box.hidden;
  };
}

function fillFilters(data) {
  const add = (id, items) => {
    const el = document.getElementById(id);
    items.forEach((v) => el.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`));
  };
  add("fPlanta", data.filtros.plantas);
  add("fDiretoria", data.filtros.diretorias);
  add("fArea", data.filtros.areas);
  add("fTurno", data.filtros.turnos);
  add("fMes", data.filtros.meses);
  [...new Set(data.evolucao.map((e) => e.anoMes.slice(0, 4)))].forEach((y) => {
    document.getElementById("fAno").insertAdjacentHTML("beforeend", `<option value="${y}">${y}</option>`);
  });
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
  tGap.textContent =
    k.gapQtd > 0 ? `Faltam ~${qtd} PCD` : k.gapQtd < 0 ? `Excedente ~${qtd} PCD` : "Na meta";
  tGap.className = `trend ${k.gapPp < 0 ? "neg" : "pos"}`;

  document.getElementById("kLid").textContent = fmtPct(k.pctLiderancaSobrePcd);
  document.getElementById("tLid").textContent = `${k.liderPcd} de ${k.hcPcd} PCD`;

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

function paintInsights(list) {
  document.getElementById("insightList").innerHTML = list.map((t) => `<li>${t}</li>`).join("");
}

function paintCharts(data) {
  const labelsE = data.evolucao.map((e) => e.anoMes.slice(5) + "/" + e.anoMes.slice(2, 4));

  // Representatividade PCD x Não PCD
  new Chart(document.getElementById("chartRep"), {
    type: "doughnut",
    data: {
      labels: data.representatividade.map((r) => r.nome),
      datasets: [{ data: data.representatividade.map((r) => r.n), backgroundColor: ["#4aa3e0", "#7ec4ef"], borderWidth: 0, cutout: "62%" }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { ...tick, boxWidth: 10 } } },
    },
  });

  // Evolução % PCD
  new Chart(document.getElementById("chartEvol"), {
    type: "line",
    data: {
      labels: labelsE,
      datasets: [{
        label: "% PCD",
        data: data.evolucao.map((e) => +(e.pct * 100).toFixed(2)),
        borderColor: "#7ec4ef",
        backgroundColor: "rgba(126,196,239,0.22)",
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

  // PCD por Área HC x PCD
  new Chart(document.getElementById("chartArea"), {
    type: "bar",
    data: {
      labels: data.areas.map((a) => a.area),
      datasets: [
        { label: "HC", data: data.areas.map((a) => a.hc), backgroundColor: "#7ec4ef", borderRadius: 3 },
        { label: "PCD", data: data.areas.map((a) => a.hcPcd), backgroundColor: "#1a7ec4", borderRadius: 3 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { ...tick, boxWidth: 10 } } },
      scales: {
        x: { ticks: { ...tick, maxRotation: 40, font: { ...tick.font, size: 10 } }, grid: { display: false } },
        y: { ticks: tick, grid: { color: grid }, beginAtZero: true },
      },
    },
  });

  // Distribuição PCD por área (share)
  new Chart(document.getElementById("chartDist"), {
    type: "bar",
    data: {
      labels: data.areas.map((a) => a.area),
      datasets: [{
        label: "% do PCD",
        data: data.areas.map((a) => +(a.sharePcd * 100).toFixed(1)),
        backgroundColor: "#4aa3e0",
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { ...tick, callback: (v) => v + "%" }, grid: { color: grid } },
        y: { ticks: { ...tick, font: { ...tick.font, size: 10 } }, grid: { display: false } },
      },
    },
  });

  // Tipo deficiência
  const total = data.tipos.reduce((s, t) => s + t.n, 0) || 1;
  document.getElementById("tipoTotal").textContent = fmtInt(total);
  document.getElementById("tipoLeg").innerHTML = data.tipos
    .map((t, i) => `<li><span class="sw" style="background:${C[i % C.length]}"></span><span>${t.tipo}</span><b>${((t.n / total) * 100).toFixed(0)}%</b></li>`)
    .join("");
  new Chart(document.getElementById("chartTipo"), {
    type: "doughnut",
    data: {
      labels: data.tipos.map((t) => t.tipo),
      datasets: [{ data: data.tipos.map((t) => t.n), backgroundColor: C, borderWidth: 0, cutout: "68%" }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  // Turno
  new Chart(document.getElementById("chartTurno"), {
    type: "bar",
    data: {
      labels: data.turnos.map((t) => t.turno),
      datasets: [
        { label: "HC", data: data.turnos.map((t) => t.hc), backgroundColor: "#7ec4ef", borderRadius: 4 },
        { label: "PCD", data: data.turnos.map((t) => t.hcPcd), backgroundColor: "#1a7ec4", borderRadius: 4 },
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
    },
  });

  // Tenure
  new Chart(document.getElementById("chartTenure"), {
    type: "bar",
    data: {
      labels: data.tenure.map((t) => t.faixa),
      datasets: [{ label: "PCD", data: data.tenure.map((t) => t.n), backgroundColor: "#4aa3e0", borderRadius: 4 }],
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

  // Mov mensal
  const lm = data.movMensal.slice(-18);
  new Chart(document.getElementById("chartMovMes"), {
    type: "bar",
    data: {
      labels: lm.map((m) => m.anoMes.slice(5) + "/" + m.anoMes.slice(2, 4)),
      datasets: [
        { label: "Admissões", data: lm.map((m) => m.admissoes), backgroundColor: "#5ed48a", borderRadius: 3 },
        { label: "Desligamentos", data: lm.map((m) => m.desligamentos), backgroundColor: "#f0a04b", borderRadius: 3 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { ...tick, boxWidth: 10 } } },
      scales: {
        x: { ticks: { ...tick, maxTicksLimit: 8 }, grid: { display: false } },
        y: { ticks: tick, grid: { color: grid }, beginAtZero: true },
      },
    },
  });

  // Blue x White — HC e PCD grouped
  new Chart(document.getElementById("chartClass"), {
    type: "bar",
    data: {
      labels: data.classificacao.map((c) => c.nome),
      datasets: [
        { label: "HC", data: data.classificacao.map((c) => c.hc), backgroundColor: "#7ec4ef", borderRadius: 4 },
        { label: "PCD", data: data.classificacao.map((c) => c.hcPcd), backgroundColor: "#1a7ec4", borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { ...tick, boxWidth: 10 } },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const i = items[0].dataIndex;
              return `% PCD: ${fmtPct(data.classificacao[i].pct)}`;
            },
          },
        },
      },
      scales: {
        x: { ticks: tick, grid: { display: false } },
        y: { ticks: tick, grid: { color: grid }, beginAtZero: true },
      },
    },
  });

  // Meta x Realizado
  new Chart(document.getElementById("chartMeta"), {
    type: "line",
    data: {
      labels: labelsE,
      datasets: [
        {
          label: "Realizado",
          data: data.evolucao.map((e) => +(e.pct * 100).toFixed(2)),
          borderColor: "#7ec4ef",
          backgroundColor: "rgba(126,196,239,0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2.5,
        },
        {
          label: "Meta",
          data: data.evolucao.map((e) => +(e.meta * 100).toFixed(2)),
          borderColor: "#f0a04b",
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

  // Turnover
  new Chart(document.getElementById("chartTurnover"), {
    type: "bar",
    data: {
      labels: data.turnover.map((t) => t.nome),
      datasets: [{
        label: "Taxa",
        data: data.turnover.map((t) => +(t.taxa * 100).toFixed(2)),
        backgroundColor: ["#4aa3e0", "#7ec4ef"],
        borderRadius: 6,
        barThickness: 48,
      }],
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

boot().catch((e) => {
  document.body.innerHTML = `<p style="padding:24px;font-family:Inter,sans-serif;font-weight:800;color:#e8f3fb;background:#072844">Erro data.json<br>${e}</p>`;
});
