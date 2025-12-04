// ======================
// 1. Data (from MetalliCan)
// ======================

// Derived from intensity_table.csv for Canadian operations.
// Units:
//   ghg_intensity: tCO2eq per tonne of metal or ore/concentrate
//   water_intensity: m3 per tonne of ore/metal
//   energy_intensity_gj: GJ per tonne of product (approx)
//
// Metals chosen as EV-relevant: Aluminum, Copper, Nickel, Steel, Iron.
// (Iron is mostly via steel; you can drop it if you prefer.)

const metalData = [
  { metal: "Aluminum", ghg_intensity: 2.345, water_intensity: 7.685, energy_intensity_gj: 74.8 },
  { metal: "Copper",   ghg_intensity: 2.21,  water_intensity: null,  energy_intensity_gj: null },
  { metal: "Nickel",   ghg_intensity: 0.0794, water_intensity: 0.4567, energy_intensity_gj: 0.081 },
  { metal: "Steel",    ghg_intensity: 1.9,   water_intensity: 11.43,  energy_intensity_gj: 23.3 },
  { metal: "Iron",     ghg_intensity: 0.08,  water_intensity: null,   energy_intensity_gj: 0.265 }
];

// Assumed metal per EV (kg/vehicle). Tweak as needed.
const metalPerEV_kg = {
  Aluminum: 250,
  Copper: 80,
  Nickel: 30,
  Steel: 800,
  Iron: 0 // mostly accounted in steel, so set to 0 to avoid double counting
};

// Utility: format big numbers nicely
function formatNumber(num, decimals = 1) {
  if (num >= 1000) {
    return (num / 1000).toFixed(decimals) + "k";
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

// =======================================
// 2. Scenario slider (EV count -> totals)
// =======================================

function updateScenario(evCount) {
  const label = document.getElementById("evCountLabel");
  label.textContent = formatNumber(evCount, 0) + " EVs";

  let totalCO2_tonnes = 0;
  let totalWater_m3 = 0;

  metalData.forEach(d => {
    const kgPerEV = metalPerEV_kg[d.metal] || 0;
    const totalTonnesMetal = (kgPerEV / 1000) * evCount;

    if (d.ghg_intensity != null) {
      totalCO2_tonnes += d.ghg_intensity * totalTonnesMetal;
    }
    if (d.water_intensity != null) {
      totalWater_m3 += d.water_intensity * totalTonnesMetal;
    }
  });

  const co2Mt = totalCO2_tonnes / 1_000_000;      // tonnes -> Mt
  const waterBillionL = (totalWater_m3 * 1000) / 1_000_000_000; // m3->L

  document.getElementById("co2Value").textContent =
    co2Mt.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  document.getElementById("waterValue").textContent =
    waterBillionL.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function initScenario() {
  const slider = document.getElementById("evCount");
  slider.addEventListener("input", () => {
    const value = Number(slider.value);
    updateScenario(value);
  });
  updateScenario(Number(slider.value));
}

// =========================
// 3. Grouped bar chart
// =========================

function drawBarChart() {
  const container = d3.select("#barChart");
  const width = container.node().clientWidth || 500;
  const height = 420;
  const margin = { top: 26, right: 18, bottom: 60, left: 70 };

  container.selectAll("*").remove();

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const metrics = [
    { key: "ghg_intensity", label: "GHG (tCO₂e/t)", color: "#60a5fa" },
    { key: "water_intensity", label: "Water (m³/t)", color: "#34d399" },
    { key: "energy_intensity_gj", label: "Energy (GJ/t)", color: "#f97316" }
  ];

  // Flatten values for scaling, ignoring nulls
  const values = [];
  metalData.forEach(d => {
    metrics.forEach(m => {
      if (d[m.key] != null) values.push(d[m.key]);
    });
  });

  const x0 = d3
    .scaleBand()
    .domain(metalData.map(d => d.metal))
    .range([0, innerWidth])
    .paddingInner(0.25);

  const x1 = d3
    .scaleBand()
    .domain(metrics.map(m => m.key))
    .range([0, x0.bandwidth()])
    .padding(0.16);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(values) * 1.1])
    .nice()
    .range([innerHeight, 0]);

  const xAxis = d3.axisBottom(x0);
  const yAxis = d3
    .axisLeft(y)
    .ticks(6)
    .tickSizeOuter(0);

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  g.append("g")
    .attr("class", "axis")
    .call(yAxis)
    .append("text")
    .attr("x", -margin.left + 8)
    .attr("y", -16)
    .attr("fill", "#9ca3af")
    .attr("text-anchor", "start")
    .attr("font-size", 11)
    .text("Impact intensity (per tonne)");

  // Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip");

  const barGroups = g
    .selectAll("g.metal-group")
    .data(metalData)
    .enter()
    .append("g")
    .attr("class", "metal-group")
    .attr("transform", d => `translate(${x0(d.metal)},0)`);

  barGroups
    .selectAll("rect")
    .data(d =>
      metrics.map(m => ({
        metal: d.metal,
        metric: m.key,
        label: m.label,
        color: m.color,
        value: d[m.key]
      }))
    )
    .enter()
    .append("rect")
    .attr("x", d => x1(d.metric))
    .attr("y", innerHeight)
    .attr("width", x1.bandwidth())
    .attr("height", 0)
    .attr("rx", 4)
    .attr("fill", d =>
      d.value == null
        ? "rgba(55, 65, 81, 0.5)"
        : `url(#grad-${d.metric})`
    )
    .style("cursor", d => (d.value == null ? "default" : "pointer"))
    .on("mousemove", (event, d) => {
      if (d.value == null) return;
      tooltip
        .style("opacity", 1)
        .style("transform", "translateY(0)")
        .html(
          `<strong>${d.metal}</strong><br>${d.label}: <b>${d.value.toFixed(
            3
          )}</b>`
        )
        .style("left", event.clientX + 16 + "px")
        .style("top", event.clientY + 12 + "px");
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", 0).style("transform", "translateY(4px)");
    })
    .transition()
    .duration(800)
    .delay((_, i) => i * 70)
    .attr("y", d => (d.value == null ? innerHeight : y(d.value)))
    .attr("height", d =>
      d.value == null ? 0 : innerHeight - y(d.value)
    );

  // SVG gradients for nicer bars
  const defs = svg.append("defs");
  metrics.forEach(m => {
    const grad = defs
      .append("linearGradient")
      .attr("id", `grad-${m.key}`)
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");

    grad
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", d3.color(m.color).brighter(0.8));
    grad
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d3.color(m.color).darker(1.2));
  });

  // Legend
  const legend = container
    .append("div")
    .attr("class", "metric-legend");

  metrics.forEach(m => {
    const pill = legend.append("div").attr("class", "metric-pill");
    pill
      .append("span")
      .attr("class", "metric-dot")
      .style("background", m.color);
    pill.append("span").text(m.label);
  });
}

// =========================
// 4. Radial impact index
// =========================

function drawRadialChart() {
  const container = d3.select("#radialChart");
  const width = container.node().clientWidth || 400;
  const height = container.node().clientHeight || 320;
  const margin = 24;

  container.selectAll("*").remove();

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const cx = width / 2;
  const cy = height / 2;
  const innerRadius = 30;
  const outerRadius = Math.min(width, height) / 2 - margin;

  // Normalize GHG, water, energy to 0–1
  const metrics = ["ghg_intensity", "water_intensity", "energy_intensity_gj"];

  const maxByMetric = {};
  metrics.forEach(metric => {
    const vals = metalData
      .map(d => d[metric])
      .filter(v => v != null);
    maxByMetric[metric] = vals.length ? d3.max(vals) : 1;
  });

  const metals = metalData.map(d => d.metal);
  const angle = d3
    .scaleBand()
    .domain(metals)
    .range([0, 2 * Math.PI])
    .padding(0.15);

  // Composite index
  const dataWithIndex = metalData.map(d => {
    let sum = 0;
    let count = 0;
    metrics.forEach(metric => {
      if (d[metric] != null && maxByMetric[metric] > 0) {
        sum += d[metric] / maxByMetric[metric];
        count += 1;
      }
    });
    const index = count ? sum / count : 0;
    return { ...d, impactIndex: index };
  });

  const rScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataWithIndex, d => d.impactIndex) || 1])
    .range([innerRadius, outerRadius]);

  const arc = d3
    .arc()
    .innerRadius(innerRadius)
    .cornerRadius(6)
    .padAngle(angle.padding())
    .padRadius(innerRadius);

  const arcs = svg
    .append("g")
    .attr("transform", `translate(${cx},${cy})`);

  const radialAxis = d3
    .axisLeft(
      d3
        .scaleLinear()
        .domain([0, 1])
        .range([outerRadius, innerRadius])
    )
    .ticks(3);

  const axisG = svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${cx - outerRadius},${cy - outerRadius})`);
  axisG.call(radialAxis);
  axisG.select(".domain").remove();

  const arcsSelection = arcs
    .selectAll("path")
    .data(dataWithIndex)
    .enter()
    .append("path")
    .attr("fill", d =>
      d3.interpolateTurbo(d.impactIndex || 0.05)
    )
    .attr("fill-opacity", 0.9)
    .attr("stroke", "rgba(15,23,42,0.8)")
    .attr("stroke-width", 1.1)
    .attr("d", d =>
      arc({
        startAngle: angle(d.metal),
        endAngle: angle(d.metal) + angle.bandwidth(),
        outerRadius: innerRadius
      })
    );

  arcsSelection
    .transition()
    .duration(900)
    .delay((_, i) => i * 90)
    .attrTween("d", function (d) {
      const iR = d3.interpolate(
        innerRadius,
        rScale(d.impactIndex || 0)
      );
      return function (t) {
        return arc({
          startAngle: angle(d.metal),
          endAngle: angle(d.metal) + angle.bandwidth(),
          outerRadius: iR(t)
        });
      };
    });

  // Tooltip
  const tooltip = d3.select("body").append("div").attr("class", "tooltip");

  arcsSelection
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .style("transform", "translateY(0)")
        .html(`
          <strong>${d.metal}</strong><br>
          Composite index: <b>${(d.impactIndex * 100).toFixed(1)}%</b><br>
          GHG: ${
            d.ghg_intensity != null ? d.ghg_intensity.toFixed(3) + " tCO₂e/t" : "n/a"
          }<br>
          Water: ${
            d.water_intensity != null ? d.water_intensity.toFixed(3) + " m³/t" : "n/a"
          }<br>
          Energy: ${
            d.energy_intensity_gj != null ? d.energy_intensity_gj.toFixed(3) + " GJ/t" : "n/a"
          }
        `)
        .style("left", event.clientX + 16 + "px")
        .style("top", event.clientY + 16 + "px");
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", 0).style("transform", "translateY(4px)");
    });

  // Labels around circle
  const labelRadius = outerRadius + 10;
  const labels = arcs
    .selectAll("text.label")
    .data(dataWithIndex)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .attr("fill", "#e5e7eb")
    .attr("font-size", 11)
    .attr("x", d => {
      const a = angle(d.metal) + angle.bandwidth() / 2 - Math.PI / 2;
      return Math.cos(a) * labelRadius;
    })
    .attr("y", d => {
      const a = angle(d.metal) + angle.bandwidth() / 2 - Math.PI / 2;
      return Math.sin(a) * labelRadius;
    })
    .text(d => d.metal);
}

// =========================
// 5. Init
// =========================

window.addEventListener("DOMContentLoaded", () => {
  initScenario();
  drawBarChart();
  drawRadialChart();

  // Redraw on resize
  window.addEventListener("resize", () => {
    drawBarChart();
    drawRadialChart();
  });
});
