import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./visualStyles.css";

export default function ConEVChart() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const svg = d3.select(container.querySelector("svg"));
    const label = container.querySelector(".chart-label");

    const width = 800;
    const height = 450;
    const margin = { top: 40, right: 40, bottom: 50, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const distances = d3.range(0, 200001, 5000);

    const scenarios = [
      { name: "Clean grid", evSlope: 0.00007, iceSlope: 0.00018 },
      { name: "Average grid", evSlope: 0.0001, iceSlope: 0.00018 },
      { name: "Coal-heavy grid", evSlope: 0.00014, iceSlope: 0.00018 },
    ];

    let currentIndex = 0;

    const data = {};
    scenarios.forEach((s) => {
      data[s.name] = distances.map((d) => ({
        distance: d,
        ev: 20 + s.evSlope * d,
        ice: 5 + s.iceSlope * d,
      }));
    });

    const x = d3.scaleLinear().domain([0, 200000]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, 50]).range([innerHeight, 0]);

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => d / 1000 + "k"));

    xAxis
      .selectAll("text")
      .style("fill", "#ddd")
      .style("font-size", "12px");

    const yAxis = g.append("g").call(d3.axisLeft(y));

    yAxis
      .selectAll("text")
      .style("fill", "#ddd")
      .style("font-size", "12px");

    g.selectAll(".domain, .tick line").attr("stroke", "#555");

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#ddd")
      .style("font-size", "12px")
      .text("Distance driven (km)");

    g.append("text")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "#ddd")
      .style("font-size", "12px")
      .text("Cumulative emissions (t CO₂)");

    const lineEV = d3
      .line()
      .x((d) => x(d.distance))
      .y((d) => y(d.ev));

    const lineICE = d3
      .line()
      .x((d) => x(d.distance))
      .y((d) => y(d.ice));

    const evPath = g
      .append("path")
      .attr("stroke", "#4ade80")
      .attr("stroke-width", 3)
      .attr("fill", "none");

    const icePath = g
      .append("path")
      .attr("stroke", "#f87171")
      .attr("stroke-width", 3)
      .attr("fill", "none");

    const breakCircle = g
      .append("circle")
      .attr("r", 5)
      .attr("fill", "white")
      .style("display", "none");

    const breakText = g
      .append("text")
      .attr("fill", "#eee")
      .attr("font-size", 12)
      .attr("text-anchor", "middle")
      .style("display", "none");

    function update(index) {
      const scenario = scenarios[index];
      const d = data[scenario.name];

      evPath
        .datum(d)
        .transition()
        .duration(800)
        .attr("d", lineEV);

      icePath
        .datum(d)
        .transition()
        .duration(800)
        .attr("d", lineICE);

      const be = d.find((p) => p.ev < p.ice);
      if (be) {
        breakCircle
          .style("display", null)
          .transition()
          .duration(600)
          .attr("cx", x(be.distance))
          .attr("cy", y(be.ev));

        breakText
          .style("display", null)
          .transition()
          .duration(600)
          .attr("x", x(be.distance))
          .attr("y", y(be.ev) - 10)
          .text(`${(be.distance / 1000).toFixed(0)}k km`);
      } else {
        breakCircle.style("display", "none");
        breakText.style("display", "none");
      }

      if (label) {
        label.textContent = scenario.name;
      }
    }

    update(0);

    let scrollCooldown = false;
    const onWheel = (e) => {
      if (scrollCooldown) return;
      scrollCooldown = true;
      setTimeout(() => {
        scrollCooldown = false;
      }, 600);

      if (e.deltaY > 20) {
        currentIndex = Math.min(currentIndex + 1, scenarios.length - 1);
      } else if (e.deltaY < -20) {
        currentIndex = Math.max(currentIndex - 1, 0);
      }
      update(currentIndex);
    };

    container.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      container.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div className="chart-block" ref={containerRef}>
      <div className="chart-label">Clean grid</div>
      <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
  );
}
