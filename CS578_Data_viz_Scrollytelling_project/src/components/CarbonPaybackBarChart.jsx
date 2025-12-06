import { useEffect } from "react";
import * as d3 from "d3";
import "./CarbonPaybackBarChart.css";

export default function CarbonPaybackBarChart() {
  useEffect(() => {
    const MARGIN = { top: 40, right: 240, bottom: 60, left: 60 };
    const WIDTH = 1050;
    const HEIGHT = 500;
    const PADDING_RIGHT = 10;

    const COLORS = {
      EV: "#74b67f",
      ICE: "#e85d75",
      MFG: "#94a3b8"
    };

    const GRID_FACTORS = {
      coal: 1.0,
      mixed: 0.45,
      clean: 0.1
    };

    let vehiclesData = {};

    function createSvg(selection) {
      selection.html("");
      const svg = selection
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);

      const g = svg
        .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

      return {
        g,
        innerWidth: WIDTH - MARGIN.left - MARGIN.right,
        innerHeight: HEIGHT - MARGIN.top - MARGIN.bottom
      };
    }

    async function loadData() {
      try {
        const emissionData = await d3.csv(
          "/data/vehicle_emission_dataset.csv",
          d => ({
            FuelType: d["Fuel Type"],
            CO2: +d["CO2 Emissions"]
          })
        );

        const avgICE =
          d3.mean(
            emissionData.filter(d => d.FuelType !== "Electric"),
            d => d.CO2
          ) || 200;

        vehiclesData = { avgICE };
      } catch {
        vehiclesData = { avgICE: 200 };
      }

      drawBarChart();
    }

    function drawBarChart() {
      const container = d3.select("#vis-3-bar");
      if (container.empty()) return;

      const rect = container.node().getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const { g, innerWidth, innerHeight } = createSvg(container);

      const mfgEV = 50;
      const mfgICE = 10;

      const y = d3.scaleLinear().domain([0, 450]).range([innerHeight, 0]);
      const x = d3
        .scaleBand()
        .domain(["EV", "ICE"])
        .range([0, innerWidth])
        .padding(0.4);

      g.append("g")
        .attr("class", "axis grid-line")
        .attr("stroke-dasharray", "2,2")
        .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(""));

      g.append("g").attr("class", "axis").call(d3.axisLeft(y));

      g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x));

      g.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("CO₂ Emissions (g/km)");

      g.append("text")
        .attr("class", "x-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .text("Vehicle Type");

      const savingsGroup = g
        .append("g")
        .attr("transform", `translate(${innerWidth - PADDING_RIGHT},0)`);

      savingsGroup
        .append("text")
        .attr("class", "savings-metric")
        .attr("y", 20)
        .text("Total Lifecycle CO₂ Savings:");

      savingsGroup
        .append("text")
        .attr("class", "savings-metric savings-value")
        .attr("y", 55)
        .attr("dx", -5);

      savingsGroup
        .append("text")
        .attr("class", "savings-metric savings-percent")
        .attr("y", 80)
        .attr("dx", -5);

      const update = grid => {
        const avgICE = vehiclesData.avgICE || 200;

        const data = [
          {
            type: "EV",
            mfg: mfgEV,
            op: avgICE * GRID_FACTORS[grid],
            total: mfgEV + avgICE * GRID_FACTORS[grid]
          },
          {
            type: "ICE",
            mfg: mfgICE,
            op: avgICE,
            total: mfgICE + avgICE
          }
        ];

        const iceTotal = data[1].total;
        const evTotal = data[0].total;
        const savings = iceTotal - evTotal;
        const reduction = (savings / iceTotal) * 100;

        savingsGroup
          .select(".savings-value")
          .transition()
          .duration(700)
          .text(`${Math.round(savings)} G/KM`);

        savingsGroup
          .select(".savings-percent")
          .transition()
          .duration(700)
          .text(`(${Math.round(reduction)}% Reduction)`);

        const groups = g.selectAll(".bar-group").data(data, d => d.type);

        const enter = groups
          .enter()
          .append("g")
          .attr("class", "bar-group")
          .attr("transform", d => `translate(${x(d.type)},0)`);

        enter
          .append("rect")
          .attr("class", "mfg-bar")
          .attr("width", x.bandwidth())
          .attr("y", d => y(d.mfg))
          .attr("height", d => innerHeight - y(d.mfg))
          .attr("fill", COLORS.MFG)
          .attr("opacity", 0.5);

        enter
          .append("rect")
          .attr("class", "op-bar")
          .attr("width", x.bandwidth())
          .attr("y", d => y(d.mfg))
          .attr("height", 0)
          .attr("fill", d => (d.type === "EV" ? COLORS.EV : COLORS.ICE));

        groups
          .select(".op-bar")
          .transition()
          .duration(700)
          .attr("y", d => y(d.total))
          .attr("height", d => y(d.mfg) - y(d.total));
      };

      update("coal");
      d3.select("#gridSelect").on("change", function () {
        update(this.value);
      });
    }

    requestAnimationFrame(loadData);
  }, []);

  return (
    <section className="story-section" id="section-3">
      <div className="step-text">
        <h3>The Carbon Payback</h3>
        <p>
          This chart compares lifecycle CO₂ emissions for EVs and ICE vehicles
          across different grid scenarios.
        </p>
        <div className="vis-controls">
          <label>Grid Scenario:</label>
          <select id="gridSelect">
            <option value="coal">Coal Heavy</option>
            <option value="mixed">Mixed Grid</option>
            <option value="clean">Renewables Dominant</option>
          </select>
        </div>
      </div>

      <div className="vis-container" id="vis-3-bar"></div>
    </section>
  );
}
