const fmtPct = (v) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
const fmtInt = (v) => new Intl.NumberFormat("pt-BR").format(v);
const colors = ["#0a2f4a", "#1a6fb5", "#3b8fd4", "#7eb6e0", "#e67e22", "#5d6d7e"];
const font = { family: "Inter", size: 11, weight: "700" };

let charts = {};

async function main() {
  const data = await (await fetch("data.json")).json();
  fillFilters(data);
  renderKpis(data.kpis);
  renderOficinaTable(data.oficinas);
  renderCharts(data);
  document.getElementById("btnMore").onclick = () => {
    const el = document.getElementById("extra");
    el.hidden = !el.hidden;
  };
}

function fillFilters(data) {
  const fill = (id, arr) => {
    const el = document.getElementById(id);
    arr.forEach((v) => el.insertAdjacentHTML("beforeend", `<option>${v}</option>`));
  };
  fill("fPlanta", data.filtros.plantas);
  fill("fDiretoria", data.filtros.diretorias);
  fill("fOficina", data.filtros.oficinas);
  [...new Set(data.evolucao.map((e) => e.anoMes.slice(0, 4)))].forEach((y) => {
    document.getElementById("fAno").insertAdjacentHTML("beforeend", `<option value="${y}">${y}</option>`);
  });
}

function renderKpis(k) {
  document.getElementById("kHc").textContent = fmtInt(k.hcTotal);
  document.getElementById("kPcd").textContent = fmtInt(k.hcPcd);
  document.getElementById("kPct").textContent = fmtPct(k.pctPcd);
  document.getElementById("kPctSub").textContent = `vs Meta ${fmtPct(k.meta)}`;
  const gap = document.getElementById("kGap");
  gap.textContent = fmtPct(k.gap);
  gap.className = `kpi-value ${k.gap < 0 ? "neg" : "pos"}`;
  document.getElementById("kGapSub").textContent = `Meta ${fmtPct(k.meta)}`;
  document.getElementById("gaugeText").textContent = fmtPct(k.pctPcd);
  document.getElementById("gReal").textContent = fmtPct(k.pctPcd);
  document.getElementById("gMeta").textContent = fmtPct(k.meta);
  document.getElementById("gGap").textContent = fmtPct(k.gap);
  document.getElementById("sPro").textContent = fmtInt(k.promocoes);
  document.getElementById("sMov").textContent = fmtInt(k.movInternas);
  document.getElementById("sLid").textContent = fmtPct(k.pctLideranca);
  document.getElementById("sAdm").textContent = fmtInt(k.admissoes);
  document.getElementById("sDes").textContent = fmtInt(k.desligamentos);
  document.getElementById("sSaldo").textContent = fmtInt(k.saldo);
  document.getElementById("sTen").textContent = k.tenureYears.toFixed(1).replace(".", ",");
}

function renderOficinaTable(rows) {
  const max = Math.max(...rows.map((r) => r.hcPcd), 1);
  const html = `
    <table class="ofi-table">
      <thead><tr><th>Oficina</th><th>HC</th><th>PCD</th><th>%</th><th></th></tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr>
            <td class="name" title="${r.oficina}">${r.oficina.replace("Oficina ", "")}</td>
            <td>${fmtInt(r.hc)}</td>
            <td>${fmtInt(r.hcPcd)}</td>
            <td>${fmtPct(r.pct)}</td>
            <td class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${(r.hcPcd / max) * 100}%"></div></div></td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
  document.getElementById("ofiTable").innerHTML = html;
}

function renderCharts(data) {
  const k = data.kpis;
  const tick = { color: "#102033", font };

  // Gauge
  const real = Math.min(k.pctPcd, k.meta);
  const miss = Math.max(k.meta - k.pctPcd, 0);
  const rest = Math.max(1 - k.meta, 0.0001);
  charts.gauge = new Chart(document.getElementById("chartGauge"), {
    type: "doughnut",
    data: {
      datasets: [{
        data: [real, miss || 0.0001, rest],
        backgroundColor: ["#1a6fb5", "#e67e22", "#d7e6f4"],
        borderWidth: 0,
        cutout: "74%",
      }],
    },
    options: { plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 500 } },
  });

  // Evolution area
  const labels = data.evolucao.map((e) => e.anoMes.slice(5) + "/" + e.anoMes.slice(2, 4));
  charts.evol = new Chart(document.getElementById("chartEvol"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: data.evolucao.map((e) => +(e.pct * 100).toFixed(2)),
        borderColor: "#1a6fb5",
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(26,111,181,0.2)";
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, "rgba(26,111,181,0.35)");
          g.addColorStop(1, "rgba(26,111,181,0.02)");
          return g;
        },
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
        x: { ticks: { ...tick, maxTicksLimit: 8 }, grid: { display: false } },
        y: { ticks: { ...tick, callback: (v) => v + "%" }, grid: { color: "#e8eef5" } },
      },
    },
  });

  // Tipo donut + legend
  const total = data.tipos.reduce((s, t) => s + t.n, 0);
  document.getElementById("tipoTotal").textContent = fmtInt(total);
  document.getElementById("tipoLegend").innerHTML = data.tipos
    .map(
      (t, i) => `
      <li>
        <span class="swatch" style="background:${colors[i % colors.length]}"></span>
        <span>${t.tipo}</span>
        <span>${fmtInt(t.n)}</span>
        <span class="pct">${((t.n / total) * 100).toFixed(1).replace(".", ",")}%</span>
      </li>`
    )
    .join("");
  charts.tipo = new Chart(document.getElementById("chartTipo"), {
    type: "doughnut",
    data: {
      labels: data.tipos.map((t) => t.tipo),
      datasets: [{ data: data.tipos.map((t) => t.n), backgroundColor: colors, borderWidth: 0, cutout: "68%" }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });

  // Mov bars
  const short = (s) => s.replace(/^Oficina\s*/, "").split(" - ")[0];
  charts.mov = new Chart(document.getElementById("chartMov"), {
    type: "bar",
    data: {
      labels: data.movOficina.map((m) => short(m.oficina)),
      datasets: [
        { label: "Admissões", data: data.movOficina.map((m) => m.admissao), backgroundColor: "#1a6fb5", borderRadius: 4 },
        { label: "Desligamentos", data: data.movOficina.map((m) => m.desligamento), backgroundColor: "#7eb6e0", borderRadius: 4 },
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

  // Classificação
  charts.classif = new Chart(document.getElementById("chartClass"), {
    type: "bar",
    data: {
      labels: data.classificacao.map((c) => c.nome),
      datasets: [{
        data: data.classificacao.map((c) => c.n),
        backgroundColor: ["#0a2f4a", "#3b8fd4"],
        borderRadius: 6,
        barThickness: 28,
      }],
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
  charts.meta = new Chart(document.getElementById("chartMeta"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Realizado",
          data: data.evolucao.map((e) => +(e.pct * 100).toFixed(2)),
          borderColor: "#0a2f4a",
          backgroundColor: "rgba(10,47,74,0.12)",
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

main().catch((e) => {
  document.body.innerHTML = `<p style="padding:24px;font-family:Inter,sans-serif;font-weight:700">Falha ao carregar data.json<br>${e}</p>`;
});
