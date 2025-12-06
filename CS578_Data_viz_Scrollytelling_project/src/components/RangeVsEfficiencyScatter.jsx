import { useEffect } from "react";
import * as d3 from "d3";
import "./RangeVsEfficiencyScatter.css";

export default function RangeVsEfficiencyScatter() {
  useEffect(() => {
    const MARGIN = { top: 40, right: 40, bottom: 60, left: 60 };
    const WIDTH = 850;
    const HEIGHT = 500;

    const tooltip = d3.select(".tooltip");
    let evData = [];

    const colorScale = d3.scaleThreshold()
      .domain([4, 7])
      .range(["#4f86d1", "#74b67f", "#a78bfa"]);

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

    function showTooltip(event, html) {
      tooltip
        .style("opacity", 1)
        .html(html)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    }

    function hideTooltip() {
      tooltip.style("opacity", 0);
    }

    async function loadData() {
      evData = await d3.csv("/data/electric_vehicles_dataset.csv", d => ({
        Manufacturer: d.Manufacturer,
        Model: d.Model,
        Range_km: +d.Range_km,
        Battery_Capacity_kWh: +d.Battery_Capacity_kWh,
        Efficiency: (+d.Range_km / +d.Battery_Capacity_kWh) || 0
      }));

      evData = evData.filter(d => d.Efficiency > 0 && isFinite(d.Efficiency));

      drawScatter();
    }

    function drawScatter() {
      const container = d3.select("#vis-2-scatter");
      if (container.empty()) return;

      const { width, height } = container.node().getBoundingClientRect();
      if (!width || !height) return;

      const svg = createSvg(container);

      const x = d3.scaleLinear()
        .domain([0, d3.max(evData, d => d.Range_km)])
        .nice()
        .range([0, svg.innerWidth]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(evData, d => d.Efficiency)])
        .nice()
        .range([svg.innerHeight, 0]);

      // Gridlines
      svg.g.append("g")
        .attr("class", "grid")
        .attr("stroke", "#475569")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-dasharray", "2,2")
        .call(d3.axisLeft(y).tickSize(-svg.innerWidth).tickFormat(""));

      svg.g.append("g")
        .attr("class", "grid")
        .attr("stroke", "#475569")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-dasharray", "2,2")
        .attr("transform", `translate(0,${svg.innerHeight})`)
        .call(d3.axisBottom(x).tickSize(-svg.innerHeight).tickFormat(""));

      // Axes
      svg.g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${svg.innerHeight})`)
        .call(d3.axisBottom(x));

      svg.g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

      // Labels
      svg.g.append("text")
        .attr("class", "x-label")
        .attr("x", svg.innerWidth / 2)
        .attr("y", svg.innerHeight + 40)
        .attr("text-anchor", "middle")
        .text("Range (km)");

      svg.g.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -svg.innerHeight / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Efficiency (km/kWh)");

      const circles = svg.g
        .selectAll("circle")
        .data(evData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Range_km))
        .attr("cy", d => y(d.Efficiency))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.Efficiency))
        .attr("opacity", 1)
        .on("mouseover", (e, d) =>
          showTooltip(
            e,
            `<b>${d.Manufacturer} ${d.Model}</b><br>
             Range: ${d3.format(",")(d.Range_km)} km<br>
             Eff: ${d.Efficiency.toFixed(2)} km/kWh`
          )
        )
        .on("mouseout", hideTooltip);

      d3.select("#efficiencySlider").on("input", function () {
        const val = +this.value;
        d3.select("#efficiencyValue").text(val);

        circles
          .transition()
          .duration(250)
          .attr("opacity", d => (d.Efficiency >= val ? 1 : 0.2))
          .attr("r", d => (d.Efficiency >= val ? 5 : 2));
      });
    }

    requestAnimationFrame(loadData);
  }, []);

  return (
    <>
      <section className="story-section" id="section-2">
        <div className="step-text">
          <h3>Range vs. Efficiency Scatterplot</h3>
          <p>
            The scatter plot shows how modern battery technology has pushed both
            range and efficiency (km/kWh).
          </p>
          <div className="vis-controls">
            <label>
              Min Efficiency (km/kWh): <span id="efficiencyValue">0</span>
            </label>
            <input
              type="range"
              id="efficiencySlider"
              min="0"
              max="10"
              step="0.5"
              defaultValue="0"
            />
          </div>
        </div>
        <div className="vis-container" id="vis-2-scatter"></div>
      </section>

      <div className="tooltip"></div>
    </>
  );
}
