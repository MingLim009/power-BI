const fmtPct = (v) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
const fmtInt = (v) => new Intl.NumberFormat("pt-BR").format(v);
const C = ["#0b2f4d", "#1a6fb3", "#3d8fc9", "#9ec4e4", "#e67e22", "#5d6d7e"];
const tick = { color: "#0f1c2a", font: { family: "Inter", size: 11, weight: "700" } };

async function boot() {
  const data = await (await fetch("data.json")).json();
  fillFilters(data);
  paintKpis(data.kpis);
  paintRanking(data.ranking);
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
  add("fOficina", data.filtros.oficinas);
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
  gap.textContent = fmtPct(k.gap);
  gap.className = `val ${k.gap < 0 ? "neg" : "pos"}`;
  document.getElementById("kLid").textContent = fmtPct(k.pctLideranca);

  const tPct = document.getElementById("tPct");
  tPct.textContent = k.gap < 0 ? `${fmtPct(k.gap)} vs meta` : `+${fmtPct(k.gap)} vs meta`;
  tPct.className = `trend ${k.gap < 0 ? "neg" : "pos"}`;
  document.getElementById("tGap").textContent = k.gap < 0 ? "Abaixo da meta" : "Acima da meta";
  document.getElementById("tGap").className = `trend ${k.gap < 0 ? "neg" : "pos"}`;

  document.getElementById("sAdm").textContent = fmtInt(k.admissoes);
  document.getElementById("sDes").textContent = fmtInt(k.desligamentos);
  document.getElementById("sPro").textContent = fmtInt(k.promocoes);
  document.getElementById("sMov").textContent = fmtInt(k.movInternas);
  document.getElementById("sSaldo").textContent = fmtInt(k.saldo);
  document.getElementById("sTen").textContent = `${k.tenureYears.toFixed(1).replace(".", ",")} anos`;
  document.getElementById("sBw").textContent = `${fmtPct(k.pctBlue)} / ${fmtPct(k.pctWhite)}`;
  document.getElementById("sOfi").textContent = fmtInt(k.qtdOficinas);
}

function paintRanking(rows) {
  const max = Math.max(...rows.map((r) => r.hcPcd), 1);
  document.getElementById("rankBody").innerHTML = rows
    .map((r) => {
      const gapCls = r.gap < 0 ? "gap-neg" : "gap-pos";
      const name = r.oficina;
      return `<tr>
        <td>${r.rank}</td>
        <td class="name" title="${r.oficina}">${name}</td>
        <td>${fmtInt(r.hc)}</td>
        <td>${fmtInt(r.hcPcd)}</td>
        <td>${fmtPct(r.pct)}</td>
        <td class="${gapCls}">${fmtPct(r.gap)}</td>
        <td><div class="bar"><i style="width:${(r.hcPcd / max) * 100}%"></i></div></td>
      </tr>`;
    })
    .join("");
}

function paintCharts(data) {
  const labels = data.evolucao.map((e) => e.anoMes.slice(5) + "/" + e.anoMes.slice(2, 4));

  // Combo: bars HC PCD + line % PCD
  new Chart(document.getElementById("chartCombo"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "HC PCD",
          data: data.evolucao.map((e) => e.hcPcd),
          backgroundColor: "#9ec4e4",
          borderRadius: 3,
          yAxisID: "y",
          order: 2,
        },
        {
          type: "line",
          label: "% PCD",
          data: data.evolucao.map((e) => +(e.pct * 100).toFixed(2)),
          borderColor: "#0b2f4d",
          backgroundColor: "#0b2f4d",
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2.5,
          yAxisID: "y1",
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { ...tick, boxWidth: 10 } } },
      scales: {
        x: { ticks: { ...tick, maxTicksLimit: 10 }, grid: { display: false } },
        y: { position: "left", ticks: tick, grid: { color: "#e8eef5" }, title: { display: true, text: "HC PCD", color: "#31465c", font: { weight: "700", size: 11 } } },
        y1: { position: "right", ticks: { ...tick, callback: (v) => v + "%" }, grid: { drawOnChartArea: false }, min: 0, title: { display: true, text: "% PCD", color: "#31465c", font: { weight: "700", size: 11 } } },
      },
    },
  });

  // Tipo donut
  const total = data.tipos.reduce((s, t) => s + t.n, 0) || 1;
  document.getElementById("tipoTotal").textContent = fmtInt(total);
  document.getElementById("tipoLeg").innerHTML = data.tipos
    .map(
      (t, i) => `<li><span class="sw" style="background:${C[i % C.length]}"></span><span>${t.tipo}</span><b>${((t.n / total) * 100).toFixed(1).replace(".", ",")}%</b></li>`
    )
    .join("");
  new Chart(document.getElementById("chartTipo"), {
    type: "doughnut",
    data: {
      labels: data.tipos.map((t) => t.tipo),
      datasets: [{ data: data.tipos.map((t) => t.n), backgroundColor: C, borderWidth: 0, cutout: "68%" }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });

  // TURNO — pedido do cliente
  new Chart(document.getElementById("chartTurno"), {
    type: "bar",
    data: {
      labels: data.turnos.map((t) => t.turno),
      datasets: [
        { label: "HC Total", data: data.turnos.map((t) => t.hc), backgroundColor: "#9ec4e4", borderRadius: 4 },
        { label: "HC PCD", data: data.turnos.map((t) => t.hcPcd), backgroundColor: "#0b2f4d", borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { ...tick, boxWidth: 10 } } },
      scales: {
        x: { ticks: tick, grid: { display: false } },
        y: { ticks: tick, grid: { color: "#e8eef5" }, beginAtZero: true },
      },
    },
  });

  // Mov oficinas
  const short = (s) => s;
  new Chart(document.getElementById("chartMov"), {
    type: "bar",
    data: {
      labels: data.movOficina.map((m) => short(m.oficina)),
      datasets: [
        { label: "Admissões", data: data.movOficina.map((m) => m.admissao), backgroundColor: "#1a6fb3", borderRadius: 3 },
        { label: "Desligamentos", data: data.movOficina.map((m) => m.desligamento), backgroundColor: "#e67e22", borderRadius: 3 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { ...tick, boxWidth: 10 } } },
      scales: {
        x: { ticks: { ...tick, maxRotation: 40 }, grid: { display: false } },
        y: { ticks: tick, grid: { color: "#e8eef5" }, beginAtZero: true },
      },
    },
  });

  // Planta % — horizontal
  new Chart(document.getElementById("chartPlanta"), {
    type: "bar",
    data: {
      labels: data.plantas.map((p) => p.planta.replace("Planta ", "")),
      datasets: [{
        label: "% PCD",
        data: data.plantas.map((p) => +(p.pct * 100).toFixed(2)),
        backgroundColor: "#1a6fb3",
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { ...tick, callback: (v) => v + "%" }, grid: { color: "#e8eef5" } },
        y: { ticks: tick, grid: { display: false } },
      },
    },
  });

  // Classificação
  new Chart(document.getElementById("chartClass"), {
    type: "bar",
    data: {
      labels: data.classificacao.map((c) => c.nome),
      datasets: [{ data: data.classificacao.map((c) => c.n), backgroundColor: ["#0b2f4d", "#3d8fc9"], borderRadius: 6, barThickness: 26 }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: tick, grid: { color: "#e8eef5" } },
        y: { ticks: tick, grid: { display: false } },
      },
    },
  });

  // Meta x Realizado
  new Chart(document.getElementById("chartMeta"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Realizado",
          data: data.evolucao.map((e) => +(e.pct * 100).toFixed(2)),
          borderColor: "#0b2f4d",
          backgroundColor: "rgba(11,47,77,0.12)",
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
        y: { ticks: { ...tick, callback: (v) => v + "%" }, grid: { color: "#e8eef5" } },
      },
    },
  });
}

boot().catch((e) => {
  document.body.innerHTML = `<p style="padding:24px;font-family:Inter,sans-serif;font-weight:800">Erro ao carregar data.json<br>${e}</p>`;
});
