import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./ElectricityMixEVAdoption.css";

export default function ElectricityMixEVAdoption() {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 450;
    const margin = { top: 40, right: 40, bottom: 40, left: 140 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = [
      { year: 2015, region: "China", ev_share: 1.0 },
      { year: 2015, region: "Europe", ev_share: 1.2 },
      { year: 2015, region: "US", ev_share: 0.8 },
      { year: 2015, region: "Other", ev_share: 0.4 },

      { year: 2018, region: "China", ev_share: 4.5 },
      { year: 2018, region: "Europe", ev_share: 3.5 },
      { year: 2018, region: "US", ev_share: 1.9 },
      { year: 2018, region: "Other", ev_share: 0.9 },

      { year: 2020, region: "China", ev_share: 6.3 },
      { year: 2020, region: "Europe", ev_share: 9.2 },
      { year: 2020, region: "US", ev_share: 3.1 },
      { year: 2020, region: "Other", ev_share: 1.4 },

      { year: 2022, region: "China", ev_share: 25.0 },
      { year: 2022, region: "Europe", ev_share: 22.0 },
      { year: 2022, region: "US", ev_share: 7.6 },
      { year: 2022, region: "Other", ev_share: 3.3 },

      { year: 2024, region: "China", ev_share: 35.0 },
      { year: 2024, region: "Europe", ev_share: 33.0 },
      { year: 2024, region: "US", ev_share: 11.0 },
      { year: 2024, region: "Other", ev_share: 6.0 }
    ];

    const allYears = [...new Set(data.map(d => d.year))];

    const x = d3.scaleLinear().range([0, innerWidth]);
    const y = d3.scaleBand().range([0, innerHeight]).padding(0.2);

    const color = d3.scaleOrdinal()
      .domain(["China", "Europe", "US", "Other"])
      .range(["#1FBF74", "#3498DB", "#E67E22", "#9B59B6"]);

    const xAxisG = g.append("g")
      .attr("transform", `translate(0,${innerHeight})`);

    const yAxisG = g.append("g");

    const yearLabel = g.append("text")
      .attr("x", innerWidth)
      .attr("y", -10)
      .attr("text-anchor", "end")
      .style("font-size", "20px")
      .style("font-weight", "700")
      .style("fill", "#fff");

    function update(yearIndex) {
      const year = allYears[yearIndex];
      const yearData = data
        .filter(d => d.year === year)
        .sort((a, b) => d3.descending(a.ev_share, b.ev_share));

      x.domain([0, d3.max(yearData, d => d.ev_share) * 1.15]);
      y.domain(yearData.map(d => d.region));

      const bars = g.selectAll(".bar")
        .data(yearData, d => d.region);

      bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.region))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .attr("width", 0)
        .attr("fill", d => color(d.region))
        .merge(bars)
        .transition()
        .duration(900)
        .attr("y", d => y(d.region))
        .attr("width", d => x(d.ev_share));

      bars.exit().remove();

      const labels = g.selectAll(".label")
        .data(yearData, d => d.region);

      labels.enter()
        .append("text")
        .attr("class", "label")
        .attr("x", 8)
        .attr("y", d => y(d.region) + y.bandwidth() / 2 + 5)
        .merge(labels)
        .transition()
        .duration(900)
        .text(d => `${d.region} — ${d.ev_share}%`)
        .style("fill", "#fff");

      labels.exit().remove();

      xAxisG.transition()
        .duration(900)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("fill", "#ddd");

      yAxisG.transition()
        .duration(900)
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "#ddd");

      yearLabel.text(year);
    }

    let idx = 0;
    let intervalId = null;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && intervalId === null) {
        update(idx);
        intervalId = setInterval(() => {
          idx = (idx + 1) % allYears.length;
          update(idx);
        }, 1500);
      }
    }, { threshold: 0.45 });

    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <section id="viz-adoption" ref={wrapperRef}>
      <div className="viz-wrapper">
        <div className="viz-title">
          EV Adoption Over Time (2015–2024)
        </div>
        <svg
          ref={svgRef}
          viewBox="0 0 800 450"
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
    </section>
  );
}
