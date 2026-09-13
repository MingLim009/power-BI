/* Executive preview — Chart.js */
const fmtPct = (v) => `${(v * 100).toFixed(1)}%`;
const fmtInt = (v) => new Intl.NumberFormat("pt-BR").format(v);

const palette = {
  navy: "#0B3A5B",
  blue: "#1B6CA8",
  sky: "#5DADE2",
  gray: "#85929E",
  good: "#1E8449",
  bad: "#C0392B",
  soft: "#D4E6F1",
};

let charts = {};

async function load() {
  const res = await fetch("data.json");
  const data = await res.json();
  fillFilters(data);
  render(data);
  document.getElementById("btnMoreFilters").addEventListener("click", () => {
    const d = document.getElementById("drawer");
    const open = d.hasAttribute("hidden");
    if (open) d.removeAttribute("hidden");
    else d.setAttribute("hidden", "");
    document.getElementById("btnMoreFilters").setAttribute("aria-expanded", String(open));
  });
}

function fillFilters(data) {
  const planta = document.getElementById("fPlanta");
  const dir = document.getElementById("fDiretoria");
  const ofi = document.getElementById("fOficina");
  const ano = document.getElementById("fAno");
  data.filtros.plantas.forEach((p) => planta.insertAdjacentHTML("beforeend", `<option>${p}</option>`));
  data.filtros.diretorias.forEach((p) => dir.insertAdjacentHTML("beforeend", `<option>${p}</option>`));
  data.filtros.oficinas.forEach((p) => ofi.insertAdjacentHTML("beforeend", `<option>${p}</option>`));
  const years = [...new Set(data.evolucao.map((e) => e.anoMes.slice(0, 4)))];
  years.forEach((y) => ano.insertAdjacentHTML("beforeend", `<option value="${y}">${y}</option>`));

  // Preview note: filters are illustrative; full interactivity is in Power BI model
  [planta, dir, ofi, ano].forEach((el) => {
    el.addEventListener("change", () => {
      document.getElementById("footNote").textContent =
        "Filtros do preview são demonstrativos — no Power BI todos os KPIs recalculam via modelo/DAX.";
    });
  });
}

function render(data) {
  const k = data.kpis;
  document.getElementById("kHc").textContent = fmtInt(k.hcTotal);
  document.getElementById("kPcd").textContent = fmtInt(k.hcPcd);
  document.getElementById("kPct").textContent = fmtPct(k.pctPcd);
  document.getElementById("kMeta").textContent = fmtPct(k.meta);
  const gapEl = document.getElementById("kGap");
  gapEl.textContent = fmtPct(k.gap);
  gapEl.className = k.gap < 0 ? "neg" : "pos";

  document.getElementById("sAdm").textContent = fmtInt(k.admissoes);
  document.getElementById("sDes").textContent = fmtInt(k.desligamentos);
  document.getElementById("sPro").textContent = fmtInt(k.promocoes);
  document.getElementById("sMov").textContent = fmtInt(k.movInternas);
  document.getElementById("sTen").textContent = k.tenureYears.toFixed(1);
  document.getElementById("sBlue").textContent = fmtPct(k.pctBlue);
  document.getElementById("sWhite").textContent = fmtPct(k.pctWhite);
  document.getElementById("sLid").textContent = fmtPct(k.pctLideranca);
  document.getElementById("gaugeText").textContent = fmtPct(k.pctPcd);
  document.getElementById("footNote").textContent = `Meta ${fmtPct(k.meta)} · GAP ${fmtPct(k.gap)}`;

  // Gauge doughnut
  charts.gauge = new Chart(document.getElementById("chartGauge"), {
    type: "doughnut",
    data: {
      datasets: [{
        data: [Math.min(k.pctPcd, k.meta), Math.max(k.meta - k.pctPcd, 0.0001), Math.max(1 - k.meta, 0)],
        backgroundColor: [palette.blue, palette.bad, palette.soft],
        borderWidth: 0,
        cutout: "72%",
      }],
    },
    options: {
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { animateRotate: true, duration: 900 },
    },
  });

  const labelsE = data.evolucao.map((e) => e.anoMes);
  charts.evol = new Chart(document.getElementById("chartEvol"), {
    type: "line",
    data: {
      labels: labelsE,
      datasets: [{
        label: "% PCD",
        data: data.evolucao.map((e) => e.pct * 100),
        borderColor: palette.blue,
        backgroundColor: "rgba(27,108,168,0.18)",
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      }],
    },
    options: chartOpts("%"),
  });

  charts.meta = new Chart(document.getElementById("chartMeta"), {
    type: "line",
    data: {
      labels: labelsE,
      datasets: [
        {
          label: "Realizado",
          data: data.evolucao.map((e) => e.pct * 100),
          borderColor: palette.navy,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: "Meta",
          data: data.evolucao.map((e) => e.meta * 100),
          borderColor: palette.bad,
          borderDash: [6, 4],
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: chartOpts("%"),
  });

  const short = (s) => s.replace("Oficina ", "").replace(" - ", " · ");
  charts.ofi = new Chart(document.getElementById("chartOficina"), {
    type: "bar",
    data: {
      labels: data.oficinas.map((o) => short(o.oficina)),
      datasets: [
        { label: "HC", data: data.oficinas.map((o) => o.hc), backgroundColor: palette.soft, borderRadius: 4 },
        { label: "PCD", data: data.oficinas.map((o) => o.hcPcd), backgroundColor: palette.blue, borderRadius: 4 },
      ],
    },
    options: {
      ...chartOpts(""),
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0, font: { size: 10, weight: "700", family: "DM Sans" }, color: "#0f1720" }, grid: { display: false } },
        y: { grid: { color: "#eef2f6" }, ticks: { font: { size: 11, weight: "700", family: "DM Sans" }, color: "#0f1720" } },
      },
    },
  });

  charts.tipo = new Chart(document.getElementById("chartTipo"), {
    type: "doughnut",
    data: {
      labels: data.tipos.map((t) => t.tipo),
      datasets: [{
        data: data.tipos.map((t) => t.n),
        backgroundColor: [palette.navy, palette.blue, palette.sky, palette.gray, "#7D3C98"],
        borderWidth: 0,
      }],
    },
    options: {
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 12, weight: "700", family: "DM Sans" }, color: "#0f1720" } },
      },
    },
  });

  charts.mov = new Chart(document.getElementById("chartMov"), {
    type: "bar",
    data: {
      labels: data.movOficina.map((m) => short(m.oficina)),
      datasets: [
        { label: "Admissões", data: data.movOficina.map((m) => m.admissao), backgroundColor: palette.good, borderRadius: 4 },
        { label: "Desligamentos", data: data.movOficina.map((m) => m.desligamento), backgroundColor: palette.bad, borderRadius: 4 },
      ],
    },
    options: {
      ...chartOpts(""),
      scales: {
        x: { ticks: { font: { size: 10, weight: "700", family: "DM Sans" }, color: "#0f1720" }, grid: { display: false } },
        y: { grid: { color: "#eef2f6" }, ticks: { font: { size: 11, weight: "700", family: "DM Sans" }, color: "#0f1720" } },
      },
    },
  });
}

function chartOpts(suffix) {
  const tickFont = { size: 11, weight: "700", family: "DM Sans" };
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          boxWidth: 10,
          font: { size: 12, weight: "700", family: "DM Sans" },
          color: "#0f1720",
        },
      },
    },
    scales: {
      x: {
        ticks: { ...tickFont, maxTicksLimit: 10, color: "#0f1720" },
        grid: { display: false },
      },
      y: {
        grid: { color: "#eef2f6" },
        ticks: {
          ...tickFont,
          color: "#0f1720",
          callback: (v) => (suffix === "%" ? `${v}%` : v),
        },
      },
    },
    animation: { duration: 400 },
  };
}

load().catch((err) => {
  document.body.innerHTML = `<p style="padding:24px;font-family:sans-serif">Erro ao carregar data.json. Rode <code>python scripts/export_preview_json.py</code>.<br>${err}</p>`;
});
