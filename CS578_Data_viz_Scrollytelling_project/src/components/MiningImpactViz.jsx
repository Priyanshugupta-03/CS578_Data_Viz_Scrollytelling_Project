import { useEffect } from "react";
import * as d3 from "d3";
import "./MiningImpactViz.css";

export default function MiningImpactViz() {
  useEffect(() => {
    const metalData = [
      { metal: "Aluminum", ghg_intensity: 2.345, water_intensity: 7.685, energy_intensity_gj: 74.8 },
      { metal: "Copper", ghg_intensity: 2.21, water_intensity: null, energy_intensity_gj: null },
      { metal: "Nickel", ghg_intensity: 0.0794, water_intensity: 0.4567, energy_intensity_gj: 0.081 },
      { metal: "Steel", ghg_intensity: 1.9, water_intensity: 11.43, energy_intensity_gj: 23.3 },
      { metal: "Iron", ghg_intensity: 0.08, water_intensity: null, energy_intensity_gj: 0.265 }
    ];

    const metalPerEV = {
      Aluminum: 250,
      Copper: 80,
      Nickel: 30,
      Steel: 800,
      Iron: 0
    };

    const formatNumber = (num, decimals = 1) =>
      num >= 1000 ? (num / 1000).toFixed(decimals) + "k" : num.toFixed(decimals);

    function updateScenario(evCount) {
      document.getElementById("evCountLabel").textContent =
        Number(evCount).toLocaleString() + " EVs";

      let totalCO2 = 0;
      let totalWater = 0;

      metalData.forEach(d => {
        const tonnes = (metalPerEV[d.metal] / 1000) * evCount;
        if (d.ghg_intensity != null) totalCO2 += d.ghg_intensity * tonnes;
        if (d.water_intensity != null) totalWater += d.water_intensity * tonnes;
      });

      document.getElementById("co2Value").textContent =
        (totalCO2 / 1_000_000).toFixed(2);
      document.getElementById("waterValue").textContent =
        ((totalWater * 1000) / 1_000_000_000).toFixed(2);
    }

    function initScenario() {
      const slider = document.getElementById("evCount");
      updateScenario(slider.value);
      slider.addEventListener("input", e =>
        updateScenario(Number(e.target.value))
      );
    }

    function drawBarChart() {
      const container = d3.select("#barChart");
      container.selectAll("*").remove();

      const width = container.node().clientWidth || 460;
      const height = 380;
      const margin = { top: 30, right: 20, bottom: 60, left: 70 };

      const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const metrics = [
        { key: "ghg_intensity", label: "GHG (tCO₂/t)", color: "#60a5fa" },
        { key: "water_intensity", label: "Water (m³/t)", color: "#34d399" },
        { key: "energy_intensity_gj", label: "Energy (GJ/t)", color: "#f97316" }
      ];

      const values = [];
      metalData.forEach(d => metrics.forEach(m => d[m.key] != null && values.push(d[m.key])));

      const x0 = d3.scaleBand()
        .domain(metalData.map(d => d.metal))
        .range([0, width - margin.left - margin.right])
        .padding(0.25);

      const x1 = d3.scaleBand()
        .domain(metrics.map(m => m.key))
        .range([0, x0.bandwidth()])
        .padding(0.15);

      const y = d3.scaleLinear()
        .domain([0, d3.max(values)])
        .nice()
        .range([height - margin.top - margin.bottom, 0]);

      g.append("g")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(x0));

      g.append("g").call(d3.axisLeft(y).ticks(5));

      g.selectAll(".metal-group")
        .data(metalData)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d.metal)},0)`)
        .selectAll("rect")
        .data(d => metrics.map(m => ({ ...m, value: d[m.key] })))
        .enter()
        .append("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => d.value ? y(d.value) : y(0))
        .attr("width", x1.bandwidth())
        .attr("height", d => d.value ? (height - margin.top - margin.bottom) - y(d.value) : 0)
        .attr("rx", 4)
        .attr("fill", d => d.color);
    }

    function drawRadialChart() {
      const container = d3.select("#radialChart");
      container.selectAll("*").remove();

      const width = 380;
      const height = 330;
      const radius = Math.min(width, height) / 2 - 20;

      const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      const angle = d3.scaleBand()
        .domain(metalData.map(d => d.metal))
        .range([0, Math.PI * 2])
        .padding(0.15);

      const maxIndex = d3.max(metalData, d =>
        (d.ghg_intensity || 0) + (d.water_intensity || 0)
      );

      const r = d3.scaleLinear()
        .domain([0, maxIndex])
        .range([20, radius]);

      svg.selectAll("path")
        .data(metalData)
        .enter()
        .append("path")
        .attr("fill", (_, i) => d3.interpolateTurbo(i / metalData.length))
        .attr("d", d3.arc()
          .innerRadius(20)
          .outerRadius(d => r((d.ghg_intensity || 0) + (d.water_intensity || 0)))
          .startAngle(d => angle(d.metal))
          .endAngle(d => angle(d.metal) + angle.bandwidth())
        );
    }

    initScenario();
    drawBarChart();
    drawRadialChart();
  }, []);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-text">
          <h1>Hidden Footprint of EV Battery Metals</h1>
          <p>
            These visuals use mining intensity data from the MetalliCan dataset
            (Canada) to show how EV metals carry significant environmental burdens.
          </p>
          <p className="disclaimer">
            Numbers are <b>illustrative</b> per tonne and meant for storytelling.
          </p>
        </div>
      </header>

      <main className="layout">
        <section className="panel panel-scenario">
          <h2>Scenario: How big is the EV metal footprint?</h2>

          <div className="slider-row">
            <label htmlFor="evCount">Number of EVs</label>
            <input id="evCount" type="range" min="100000" max="10000000" step="100000" defaultValue="2000000" />
            <div className="slider-value">
              <span id="evCountLabel"></span>
            </div>
          </div>

          <div className="impact-cards">
            <div className="impact-card">
              <h3>Embedded CO₂ from metals</h3>
              <p className="impact-main"><span id="co2Value"></span> Mt CO₂-eq</p>
            </div>
            <div className="impact-card">
              <h3>Embedded water use</h3>
              <p className="impact-main"><span id="waterValue"></span> billion L</p>
            </div>
          </div>
        </section>

        <section className="panel panel-charts">
          <div className="chart-block">
            <h2>Impact intensity by metal</h2>
            <div id="barChart"></div>
          </div>

          <div className="chart-block">
            <h2>Overall “harm index” per metal</h2>
            <div id="radialChart"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
