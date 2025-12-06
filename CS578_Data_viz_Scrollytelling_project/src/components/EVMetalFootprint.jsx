import { useEffect } from "react";
import * as d3 from "d3";
import "./EVMetalFootprint.css";

export default function EVMetalCharts() {
  useEffect(() => {
    const metalData = [
      { metal: "Aluminum", ghg_intensity: 2.345, water_intensity: 7.685, energy_intensity_gj: 74.8 },
      { metal: "Copper", ghg_intensity: 2.21, water_intensity: null, energy_intensity_gj: null },
      { metal: "Nickel", ghg_intensity: 0.0794, water_intensity: 0.4567, energy_intensity_gj: 0.081 },
      { metal: "Steel", ghg_intensity: 1.9, water_intensity: 11.43, energy_intensity_gj: 23.3 },
      { metal: "Iron", ghg_intensity: 0.08, water_intensity: null, energy_intensity_gj: 0.265 }
    ];

    /* =========================
       GROUPED BAR CHART
    ========================= */
    function drawBarChart() {
      const container = d3.select("#barChart");
      container.selectAll("*").remove();

      const width = container.node().clientWidth || 520;
      const height = 420;
      const margin = { top: 26, right: 18, bottom: 60, left: 70 };
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const metrics = [
        { key: "ghg_intensity", label: "GHG (tCO₂e/t)", color: "#60a5fa" },
        { key: "water_intensity", label: "Water (m³/t)", color: "#34d399" },
        { key: "energy_intensity_gj", label: "Energy (GJ/t)", color: "#f97316" }
      ];

      const values = [];
      metalData.forEach(d =>
        metrics.forEach(m => d[m.key] != null && values.push(d[m.key]))
      );

      const x0 = d3.scaleBand()
        .domain(metalData.map(d => d.metal))
        .range([0, innerW])
        .paddingInner(0.25);

      const x1 = d3.scaleBand()
        .domain(metrics.map(m => m.key))
        .range([0, x0.bandwidth()])
        .padding(0.16);

      const y = d3.scaleLinear()
        .domain([0, d3.max(values) * 1.1])
        .nice()
        .range([innerH, 0]);

      g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x0));

      g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

      const defs = svg.append("defs");
      metrics.forEach(m => {
        const grad = defs.append("linearGradient")
          .attr("id", `grad-${m.key}`)
          .attr("x1", "0%").attr("x2", "0%")
          .attr("y1", "0%").attr("y2", "100%");

        grad.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", d3.color(m.color).brighter(0.8));
        grad.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", d3.color(m.color).darker(1.2));
      });

      const groups = g.selectAll(".metal-group")
        .data(metalData)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d.metal)},0)`);

      groups.selectAll("rect")
        .data(d => metrics.map(m => ({ key: m.key, value: d[m.key] })))
        .enter()
        .append("rect")
        .attr("x", d => x1(d.key))
        .attr("y", innerH)
        .attr("width", x1.bandwidth())
        .attr("height", 0)
        .attr("rx", 4)
        .attr("fill", d =>
          d.value == null ? "rgba(55,65,81,0.5)" : `url(#grad-${d.key})`
        )
        .transition()
        .duration(800)
        .attr("y", d => d.value == null ? innerH : y(d.value))
        .attr("height", d =>
          d.value == null ? 0 : innerH - y(d.value)
        );

      /* ---- Legend (RESTORED) ---- */
      const legend = container.append("div")
        .attr("class", "metric-legend");

      metrics.forEach(m => {
        const pill = legend.append("div").attr("class", "metric-pill");
        pill.append("span")
          .attr("class", "metric-dot")
          .style("background", m.color);
        pill.append("span").text(m.label);
      });
    }

    /* =========================
       RADIAL HARM INDEX
    ========================= */
    function drawRadialChart() {
      const container = d3.select("#radialChart");
      container.selectAll("*").remove();

      const width = container.node().clientWidth || 380;
      const height = 320;
      const cx = width / 2;
      const cy = height / 2;
      const innerRadius = 30;
      const outerRadius = Math.min(width, height) / 2 - 24;

      const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

      const metrics = ["ghg_intensity", "water_intensity", "energy_intensity_gj"];
      const max = {};
      metrics.forEach(m => {
        max[m] = d3.max(metalData.map(d => d[m]).filter(v => v != null)) || 1;
      });

      const indexed = metalData.map(d => {
        let sum = 0, count = 0;
        metrics.forEach(m => {
          if (d[m] != null) {
            sum += d[m] / max[m];
            count++;
          }
        });
        return { ...d, idx: count ? sum / count : 0 };
      });

      const angle = d3.scaleBand()
        .domain(indexed.map(d => d.metal))
        .range([0, 2 * Math.PI])
        .padding(0.15);

      const r = d3.scaleLinear()
        .domain([0, d3.max(indexed, d => d.idx)])
        .range([innerRadius, outerRadius]);

      const arc = d3.arc().innerRadius(innerRadius);

      const g = svg.append("g")
        .attr("transform", `translate(${cx},${cy})`);

      g.selectAll("path")
        .data(indexed)
        .enter()
        .append("path")
        .attr("fill", d => d3.interpolateTurbo(d.idx || 0.05))
        .attr("d", d =>
          arc({
            startAngle: angle(d.metal),
            endAngle: angle(d.metal) + angle.bandwidth(),
            outerRadius: r(d.idx)
          })
        );

      /* ---- Radial labels (RESTORED) ---- */
      const labelRadius = outerRadius + 10;
      g.selectAll("text.label")
        .data(indexed)
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

    drawBarChart();
    drawRadialChart();
    window.addEventListener("resize", () => {
      drawBarChart();
      drawRadialChart();
    });
  }, []);

  return (
    <section className="panel panel-charts">
      <div className="chart-block">
        <h3>Impact intensity by metal</h3>
        <p className="panel-intro">
          Greenhouse gas, water, and energy intensity per tonne of metal.
        </p>
        <div id="barChart" />
      </div>

      <div className="chart-block">
        <h3>Overall “harm index” per metal</h3>
        <p className="panel-intro">
          Composite index of GHG, water, and energy impacts (normalized 0–1).
        </p>
        <div id="radialChart" />
      </div>
    </section>
  );
}
