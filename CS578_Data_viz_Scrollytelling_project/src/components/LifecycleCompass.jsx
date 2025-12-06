import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./LifecycleCompass.css";

export default function LifecycleCompass() {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 60;

    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", "0 0 500 500")
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const factors = [
      "Manufacturing",
      "Use Phase",
      "End-of-life",
      "Energy Dependency"
    ];

    const angleSlice = (Math.PI * 2) / factors.length;

    const evScores = [8, 3, 5, 9];
    const iceScores = [4, 9, 5, 4];

    const rScale = d3.scaleLinear().domain([0, 10]).range([0, radius]);

    [2, 4, 6, 8, 10].forEach(level => {
      g.append("circle")
        .attr("r", rScale(level))
        .attr("fill", "none")
        .attr("stroke", "#999")
        .attr("opacity", 0.2);
    });

    const axis = g.selectAll(".axis")
      .data(factors)
      .enter()
      .append("g");

    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (_, i) => rScale(10) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (_, i) => rScale(10) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("stroke", "#aaa")
      .attr("opacity", 0.4);

    axis.append("text")
      .attr("x", (_, i) => (rScale(10) + 18) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (_, i) => (rScale(10) + 18) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("text-anchor", "middle")
      .style("fill", "#ddd")
      .style("font-size", "12px")
      .text(d => d);

    function radarPath(scores) {
      const points = scores.map((s, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return [
          rScale(s) * Math.cos(angle),
          rScale(s) * Math.sin(angle)
        ];
      });
      points.push(points[0]);
      return d3.line()(points);
    }

    const evPath = g.append("path")
      .attr("fill", "#1FBF74")
      .attr("stroke", "#1FBF74")
      .attr("stroke-width", 2)
      .attr("fill-opacity", 0.22);

    const icePath = g.append("path")
      .attr("fill", "#C0392B")
      .attr("stroke", "#C0392B")
      .attr("stroke-width", 2)
      .attr("fill-opacity", 0.22);

    evPath.attr("d", radarPath([0, 0, 0, 0]));
    icePath.attr("d", radarPath([0, 0, 0, 0]));

    function animateRadar() {
      evPath.transition().duration(1000).attr("d", radarPath(evScores));
      icePath.transition().duration(1000).attr("d", radarPath(iceScores));

      pulse(evPath, evScores);
      pulse(icePath, iceScores, 300);
    }

    function pulse(path, baseScores, delay = 0) {
      const scale = 1.06;
      const alt = baseScores.map(v => v * scale);

      function loop() {
        path.transition()
          .delay(delay)
          .duration(1000)
          .attr("d", radarPath(alt))
          .transition()
          .duration(1000)
          .attr("d", radarPath(baseScores))
          .on("end", loop);
      }

      loop();
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateRadar();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.45 }
    );

    observer.observe(wrapperRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="viz-compass" ref={wrapperRef}>
      <div className="compass-card">
        <div className="compass-title">
          Lifecycle Compass: EV vs ICE
        </div>

        <svg ref={svgRef} className="compass-chart" />

        <div className="compass-legend">
          <div className="legend-item">
            <span className="legend-color legend-ev" /> EV
          </div>
          <div className="legend-item">
            <span className="legend-color legend-ice" /> ICE
          </div>
        </div>
      </div>
    </section>
  );
}
