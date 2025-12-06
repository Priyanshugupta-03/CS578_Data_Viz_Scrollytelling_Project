import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./EVvsICEEmissionsRadial.css";

export default function EVvsICEEmissionsRadial() {
  const containerRef = useRef(null);

  useEffect(() => {
    const chartData = [
      { vehicle: "EV on Dirty Grid", impactScore: 0.9, color: "#ef4444" },
      { vehicle: "ICE Vehicle", impactScore: 0.7, color: "#f97316" },
    ];

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const width = container.node().clientWidth;
    const height = container.node().clientHeight;

    const margin = 60;
    const paddingLabels = 60;

    const minDim = Math.min(
      width - margin * 2 - paddingLabels * 2,
      height - margin * 2 - paddingLabels * 2
    );

    const outerRadius = minDim / 2;
    const innerRadius = outerRadius * 0.4;

    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const chartGroup = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 + 10})`);

    const yRadial = d3
      .scaleLinear()
      .domain([0, 1])
      .range([innerRadius, outerRadius]);

    const xRadial = d3
      .scaleBand()
      .domain(chartData.map(d => d.vehicle))
      .range([0, Math.PI * 2])
      .align(0.5)
      .paddingInner(0.1)
      .paddingOuter(0.3);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(d => yRadial(d.impactScore))
      .startAngle(d => xRadial(d.vehicle))
      .endAngle(d => xRadial(d.vehicle) + xRadial.bandwidth())
      .cornerRadius(10);

    const gridValues = [0.25, 0.5, 0.75, 1];

    chartGroup.selectAll(".radial-grid")
      .data(gridValues)
      .enter()
      .append("circle")
      .attr("class", "radial-grid")
      .attr("r", d => yRadial(d));

    chartGroup.selectAll(".radial-axis-label")
      .data(gridValues.slice(1))
      .enter()
      .append("text")
      .attr("class", "radial-axis-label")
      .attr("y", d => -yRadial(d))
      .attr("x", 6)
      .text(d => d3.format(".0%")(d));

    chartGroup.selectAll(".radial-bar")
      .data(chartData)
      .enter()
      .append("path")
      .attr("class", "radial-bar")
      .attr("fill", d => d.color)
      .attr("d", d => {
        const startArc = d3.arc()
          .innerRadius(innerRadius)
          .outerRadius(innerRadius)
          .startAngle(xRadial(d.vehicle))
          .endAngle(xRadial(d.vehicle) + xRadial.bandwidth());
        return startArc(d);
      })
      .transition()
      .duration(1400)
      .attr("d", arc);

    const labelAngle = d =>
      xRadial(d.vehicle) + xRadial.bandwidth() / 2;

    chartGroup.selectAll(".radial-label")
      .data(chartData)
      .enter()
      .append("text")
      .attr("class", "radial-label")
      .attr("opacity", 0)
      .attr("transform", d => {
        const a = labelAngle(d) - Math.PI / 2;
        const r = yRadial(d.impactScore) + 16;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        let rotate = (labelAngle(d) * 180) / Math.PI - 90;
        if (labelAngle(d) > Math.PI) rotate += 180;
        return `translate(${x},${y}) rotate(${rotate})`;
      })
      .text(d => `${d.vehicle}`)
      .transition()
      .delay(1000)
      .duration(600)
      .attr("opacity", 1);

    const ev = chartData[0].impactScore;
    const ice = chartData[1].impactScore;
    const diff = (ev - ice) / ice;

    chartGroup.append("text")
      .attr("class", "center-text impact-center-text")
      .attr("y", -10)
      .attr("opacity", 0)
      .text(d3.format("+.0%")(diff))
      .transition()
      .delay(900)
      .attr("opacity", 1);

    chartGroup.append("text")
      .attr("class", "center-text impact-unit-text")
      .attr("y", 30)
      .attr("opacity", 0)
      .text("Higher Emissions than ICE")
      .transition()
      .delay(1100)
      .attr("opacity", 1);

  }, []);

  return (
    <section className="ev-ice-radial">
      <header>
        <h1>The Lifecycle Cost: EV vs ICE</h1>
        <p>Use Phase Emissions Comparison (Dirty Grid Scenario)</p>
      </header>

      <div ref={containerRef} className="chart-container" />

      <footer>
        Data Visualization Project based on EPA, IEA, and Our World in Data concepts.
      </footer>
    </section>
  );
}
