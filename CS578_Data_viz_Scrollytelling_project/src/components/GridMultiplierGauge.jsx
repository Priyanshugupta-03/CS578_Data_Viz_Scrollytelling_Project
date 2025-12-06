import { useEffect } from "react";
import * as d3 from "d3";
import "./GridMultiplierGauge.css";

export default function GridMultiplierGauge() {
  useEffect(() => {
    const WIDTH = 850;
    const HEIGHT = 500;

    const COLORS = {
      BG: "#d1d5db",
      DANGER_END: "#fcd34d",
      ACCENT: "#a78bfa",
      NEEDLE: "#4ade80"
    };

    const RADIUS = 150;
    const INNER_R = 120;
    const ARC_START = -Math.PI / 2;
    const ARC_END = Math.PI / 2;
    const START_FILL_ANGLE = ARC_START + Math.PI * 0.25;
    const TRANSITION_DURATION = 1000;

    function createSvg(selection) {
      selection.html("");
      const svg = selection
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);

      const g = svg
        .append("g")
        .attr("transform", `translate(${WIDTH / 2}, ${HEIGHT / 2 + 50})`);

      return g;
    }

    function drawGauge() {
      const container = d3.select("#vis-4-gauge");
      if (container.empty()) return;

      const g = createSvg(container);

      const arcGenerator = d3.arc()
        .innerRadius(INNER_R)
        .outerRadius(RADIUS);

      // Gradient
      g.append("defs")
        .append("linearGradient")
        .attr("id", "gradient-danger")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .html(`
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="100%" stop-color="${COLORS.DANGER_END}"/>
        `);

      // Background arc
      g.append("path")
        .datum({ startAngle: ARC_START, endAngle: ARC_END })
        .attr("d", arcGenerator)
        .attr("fill", COLORS.BG)
        .attr("opacity", 0.8);

      // Danger zone
      g.append("path")
        .datum({ startAngle: ARC_START, endAngle: START_FILL_ANGLE })
        .attr("d", arcGenerator)
        .attr("fill", "url(#gradient-danger)");

      const cleanArc = g.append("path")
        .attr("fill", COLORS.NEEDLE)
        .attr("opacity", 0.6);

      // Labels
      const zones = [
        { pct: 0, label: "0% (Coal Grid)", angle: ARC_START },
        { pct: 25, label: "25% (High Emissions)", angle: START_FILL_ANGLE },
        { pct: 50, label: "50% (EV Break-Even)", angle: 0 },
        { pct: 75, label: "75% (Strong Savings)", angle: ARC_START + Math.PI * 0.75 },
        { pct: 100, label: "100% (Green Grid)", angle: ARC_END }
      ];

      g.selectAll(".zone-label")
        .data(zones)
        .enter()
        .append("text")
        .attr("class", "gauge-label")
        .attr("transform", d => {
          const x = (RADIUS + 25) * Math.sin(d.angle);
          const y = -(RADIUS + 25) * Math.cos(d.angle);
          return `translate(${x},${y})`;
        })
        .text(d => d.label);

      // Needle
      const needle = g.append("g").attr("class", "needle-cross");
      needle.append("rect").attr("x", -3).attr("y", -INNER_R + 10).attr("width", 6).attr("height", 30).attr("rx", 2);
      needle.append("rect").attr("x", -10).attr("y", -INNER_R + 20).attr("width", 20).attr("height", 6).attr("rx", 2);

      const factorText = g.append("text").attr("class", "gauge-percent").attr("y", -50);
      const descriptionText = g.append("text").attr("class", "gauge-description").attr("y", 10);
      const statusText = d3.select("#gaugeStatus");

      let cleanliness = 0.3;

      function updateGauge(pct) {
        const angle = ARC_START + Math.PI * pct;
        const factor = 1 - pct;

        needle.transition().duration(TRANSITION_DURATION)
          .attr("transform", `rotate(${angle * 180 / Math.PI})`);

        cleanArc
          .datum({ startAngle: START_FILL_ANGLE, endAngle: angle })
          .transition()
          .duration(TRANSITION_DURATION)
          .attr("d", arcGenerator);

        factorText.text(`${Math.round(pct * 100)}%`);
        descriptionText.text(`Current EV Emission Factor: ${factor.toFixed(2)}`);
        statusText.text(`${factor.toFixed(2)} EV Emission Factor`);
      }

      updateGauge(cleanliness);

      d3.select("#simulateGridImprovement").on("click", () => {
        cleanliness = cleanliness === 0.8 ? 0.3 : 0.8;
        updateGauge(cleanliness);
      });
    }

    requestAnimationFrame(drawGauge);
  }, []);

  return (
    <section className="story-section" id="section-4">
      <div className="step-text">
        <h3>Grid Multiplier Effect</h3>
        <p>
          The cleaner the electricity grid, the lower an EV’s operational
          emissions. This gauge shows how grid improvements amplify EV benefits.
        </p>
        <div className="vis-controls">
          <button id="simulateGridImprovement">
            Simulate Grid Improvement
          </button>
          <span id="gaugeStatus" />
        </div>
      </div>
      <div className="vis-container" id="vis-4-gauge"></div>
    </section>
  );
}
