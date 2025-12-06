import { useEffect } from "react";
import * as d3 from "d3";
import "./EVAdoptionStreamgraph.css";

export default function EVAdoptionStreamgraph() {
  useEffect(() => {
    const MARGIN = { top: 40, right: 40, bottom: 60, left: 60 };
    const WIDTH = 850;
    const HEIGHT = 500;

    const COLORS = {
      EV: "#4ade80",
      ACCENT: "#fbbf24",
      HIGHLIGHT: "#facc15",
      ANNOTATION: "#6d28d9",
      TEXT: "#94a3b8"
    };

    const tooltip = d3.select(".tooltip");
    let evData = [];

    async function loadData() {
      evData = await d3.csv("/data/electric_vehicles_dataset.csv", d => ({
        Year: +d.Year,
        Units_Sold: +d.Units_Sold_2024
      }));
      drawStreamgraph();
    }

    function drawStreamgraph() {
      const container = d3.select("#vis-1-stream");

      const data = d3
        .rollups(
          evData.filter(d => d.Year >= 2015),
          v => d3.sum(v, d => d.Units_Sold),
          d => d.Year
        )
        .map(([year, total]) => ({ year, total }))
        .sort((a, b) => a.year - b.year);

      const svg = createSvg(container);

      const x = d3
        .scaleBand()
        .domain(data.map(d => d.year))
        .range([0, svg.innerWidth])
        .padding(0.1);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, d => d.total) * 1.1])
        .nice()
        .range([svg.innerHeight, 0]);

      svg.g
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${svg.innerHeight})`)
        .call(d3.axisBottom(x));

      svg.g
        .append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(7, "s"));

      svg.g
        .append("text")
        .attr("class", "y-label")
        .attr("x", -svg.innerHeight / 2)
        .attr("y", -40)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Total Units Sold (Millions)");

      const area = d3
        .area()
        .x(d => x(d.year) + x.bandwidth() / 2)
        .y0(svg.innerHeight)
        .y1(d => y(d.total))
        .curve(d3.curveMonotoneX);

      svg.g
        .append("path")
        .datum(data)
        .attr("fill", COLORS.EV)
        .attr("opacity", 0.9)
        .attr("d", area);

      svg.g
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", COLORS.ACCENT)
        .attr("stroke-width", 3)
        .attr(
          "d",
          d3
            .line()
            .x(d => x(d.year) + x.bandwidth() / 2)
            .y(d => y(d.total))
            .curve(d3.curveMonotoneX)
        );

      const highlightBar = svg.g
        .append("rect")
        .attr("fill", COLORS.HIGHLIGHT)
        .attr("opacity", 0.5)
        .style("display", "none");

      const annotation = svg.g.append("g").style("display", "none");
      const annotationBox = annotation.append("rect").attr("rx", 6).attr("ry", 6);
      const t1 = annotation.append("text").attr("y", 16).attr("fill", "#fff");
      const t2 = annotation.append("text").attr("y", 36).attr("fill", "#fff");

      function updateHighlight(year) {
        const i = data.findIndex(d => d.year === year);
        if (i < 0) return;

        const d = data[i];
        const prev = data[i - 1];
        const growth = prev ? ((d.total - prev.total) / prev.total) * 100 : 0;

        highlightBar
          .style("display", null)
          .attr("x", x(year))
          .attr("y", y(d.total))
          .attr("width", x.bandwidth())
          .attr("height", svg.innerHeight - y(d.total));

        annotation.style("display", null);

        t1.text(`Growth: +${growth.toFixed(1)}%`);
        t2.text(`Units: ${d3.format(",")(d.total)}`);

        const boxWidth = 150;
        const boxHeight = 50;
        const boxX = x(year) + x.bandwidth() / 2 - boxWidth / 2;
        const boxY = y(d.total) - boxHeight - 10;

        annotationBox
          .attr("x", boxX)
          .attr("y", boxY)
          .attr("width", boxWidth)
          .attr("height", boxHeight)
          .attr("fill", COLORS.ANNOTATION);

        t1.attr("x", boxX + 10).attr("y", boxY + 18);
        t2.attr("x", boxX + 10).attr("y", boxY + 36);
      }

      d3.selectAll("input[name='yearSelect']").on("change", function () {
        updateHighlight(+this.value);
      });

      updateHighlight(2024);
    }

    function createSvg(selection) {
      selection.html("");
      const svg = selection
        .append("svg")
        .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
        .attr("width", "100%")
        .attr("height", "100%");

      const g = svg.append("g").attr(
        "transform",
        `translate(${MARGIN.left},${MARGIN.top})`
      );

      return {
        g,
        innerWidth: WIDTH - MARGIN.left - MARGIN.right,
        innerHeight: HEIGHT - MARGIN.top - MARGIN.bottom
      };
    }

    loadData();
  }, []);

  return (
    <>
      <main className="story-container">
        <section className="story-section" id="section-1">
          <div className="step-text">
            <h3>The Ascent of Electric Vehicles</h3>
            <p>
              The streamgraph below reveals the powerful acceleration of EV
              adoption.
            </p>
            <div className="vis-controls">
              <label><input type="radio" name="yearSelect" value="2018" /> 2018</label>
              <label><input type="radio" name="yearSelect" value="2020" /> 2020</label>
              <label><input type="radio" name="yearSelect" value="2022" /> 2022</label>
              <label><input type="radio" name="yearSelect" value="2024" defaultChecked /> 2024</label>
            </div>
          </div>
          <div className="vis-container" id="vis-1-stream"></div>
        </section>
      </main>

      <div className="tooltip"></div>
    </>
  );
}
