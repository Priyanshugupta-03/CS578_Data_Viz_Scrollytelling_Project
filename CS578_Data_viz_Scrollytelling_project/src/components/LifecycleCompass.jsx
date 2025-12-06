import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./visualStyles.css";

export default function LifecycleCompass() {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const svg = d3.select(wrapper.querySelector("svg"));
    svg.selectAll("*").remove();

    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 60;

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const factors = [
      "Manufacturing",
      "Use Phase",
      "End-of-life",
      "Energy Dependency",
    ];
    const angleSlice = (Math.PI * 2) / factors.length;

    const evScores = [8, 3, 5, 9];
    const iceScores = [4, 9, 5, 4];

    const rScale = d3.scaleLinear().domain([0, 10]).range([0, radius]);

    // grid rings
    [2, 4, 6, 8, 10].forEach((level) => {
      g.append("circle")
        .attr("r", rScale(level))
        .attr("fill", "none")
        .attr("stroke", "#999")
        .attr("opacity", 0.2);
    });

    // axes + labels
    const axis = g.selectAll(".axis").data(factors).enter().append("g");

    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (_, i) => rScale(10) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (_, i) => rScale(10) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("stroke", "#aaa")
      .attr("opacity", 0.4);

    axis
      .append("text")
      .attr(
        "x",
        (_, i) => (rScale(10) + 16) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y",
        (_, i) => (rScale(10) + 16) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      .attr("text-anchor", "middle")
      .style("fill", "#ddd")
      .style("font-size", "12px")
      .text((d) => d);

    function radarPath(scores) {
      const points = scores.map((s, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return [rScale(s) * Math.cos(angle), rScale(s) * Math.sin(angle)];
      });
      points.push(points[0]);
      return d3.line()(points);
    }

    const evPath = g
      .append("path")
      .attr("fill", "#1FBF74")
      .attr("stroke", "#1FBF74")
      .attr("stroke-width", 2)
      .attr("fill-opacity", 0.2);

    const icePath = g
      .append("path")
      .attr("fill", "#C0392B")
      .attr("stroke", "#C0392B")
      .attr("stroke-width", 2)
      .attr("fill-opacity", 0.2);

    const zero = [0, 0, 0, 0];
    evPath.attr("d", radarPath(zero));
    icePath.attr("d", radarPath(zero));

    function pulse(path, baseScores, scaleFactor) {
      const alt = baseScores.map((v) => v * scaleFactor);

      function loop() {
        path
          .transition()
          .duration(1000)
          .attr("d", radarPath(alt))
          .transition()
          .duration(1000)
          .attr("d", radarPath(baseScores))
          .on("end", loop);
      }
      loop();
    }

    function animateRadar() {
      evPath
        .transition()
        .duration(1000)
        .attr("d", radarPath(evScores));
      icePath
        .transition()
        .duration(1000)
        .attr("d", radarPath(iceScores));

      setTimeout(() => pulse(evPath, evScores, 1.05), 1500);
      setTimeout(() => pulse(icePath, iceScores, 1.05), 1800);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateRadar();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(wrapper);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div id="viz-compass" ref={wrapperRef}>
      <div className="compass-card">
        <div className="compass-title">Lifecycle Compass: EV vs ICE</div>
        <svg
          id="compass-chart"
          viewBox="0 0 500 500"
          preserveAspectRatio="xMidYMid meet"
        ></svg>
      </div>
    </div>
  );
}
