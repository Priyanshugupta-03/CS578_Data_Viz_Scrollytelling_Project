import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./PriceAccessibilityBoxPlot.css";

export default function PriceAccessibilityBoxPlot() {
  const visRef = useRef(null);
  const tooltipRef = useRef(null);
  const [batteryTypes, setBatteryTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const evDataRef = useRef([]);

  const MARGIN = { top: 40, right: 40, bottom: 60, left: 80 };
  const WIDTH = 850;
  const HEIGHT = 500;

  const COLORS = {
    BOX: "#a78bfa",
    JITTER: "#4ac4b4",
    ACCENT: "#facc15"
  };

  useEffect(() => {
    d3.csv("/data/electric_vehicles_dataset.csv", d => ({
      model: d.Model,
      price: +d.Price_USD,
      battery: d.Battery_Type
    })).then(data => {
      const cleaned = data.filter(d => d.price > 0 && isFinite(d.price));
      evDataRef.current = cleaned;

      const types = [...new Set(cleaned.map(d => d.battery).filter(Boolean))];
      setBatteryTypes(types);
    });
  }, []);

  useEffect(() => {
    if (!evDataRef.current.length) return;

    const container = d3.select(visRef.current);
    container.selectAll("*").remove();

    const svg = container
      .append("svg")
      .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
      .attr("width", "100%")
      .attr("height", "100%");

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const data =
      selectedType === "all"
        ? evDataRef.current
        : evDataRef.current.filter(d => d.battery === selectedType);

    const y = d3
      .scaleLinear()
      .domain([0, 160000])
      .range([innerHeight, 0]);

    const yAxis = d3.axisLeft(y).ticks(8).tickFormat(d3.format("$.0s"));

    g.append("g").attr("class", "axis").call(yAxis);

    g.append("text")
      .attr("class", "y-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .text("EV Price (USD)");

    if (!data.length) {
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#f87171")
        .text("No data available.");
      return;
    }

    const prices = data.map(d => d.price).sort(d3.ascending);
    const q1 = d3.quantile(prices, 0.25);
    const median = d3.quantile(prices, 0.5);
    const q3 = d3.quantile(prices, 0.75);
    const min = prices[0];
    const max = prices.at(-1);

    const boxCenter = innerWidth * 0.65;
    const jitterCenter = innerWidth * 0.3;
    const boxWidth = 50;

    g.append("line")
      .attr("class", "whisker-line")
      .attr("x1", boxCenter)
      .attr("x2", boxCenter)
      .attr("y1", y(min))
      .attr("y2", y(max));

    g.append("rect")
      .attr("class", "box")
      .attr("x", boxCenter - boxWidth / 2)
      .attr("width", boxWidth)
      .attr("y", y(q3))
      .attr("height", y(q1) - y(q3));

    g.append("line")
      .attr("class", "median-line")
      .attr("x1", boxCenter - boxWidth / 2)
      .attr("x2", boxCenter + boxWidth / 2)
      .attr("y1", y(median))
      .attr("y2", y(median));

    [min, max].forEach(v => {
      g.append("line")
        .attr("class", "whisker-line")
        .attr("x1", boxCenter - boxWidth / 2)
        .attr("x2", boxCenter + boxWidth / 2)
        .attr("y1", y(v))
        .attr("y2", y(v));
    });

    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", () => jitterCenter + (Math.random() - 0.5) * 200)
      .attr("cy", d => y(d.price))
      .attr("r", 3)
      .attr("fill", COLORS.JITTER)
      .attr("opacity", 0.6)
      .on("mousemove", (event, d) => {
        d3.select(tooltipRef.current)
          .style("opacity", 1)
          .html(`${d.model}<br/><b>${d3.format("$,")(d.price)}</b>`)
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", () =>
        d3.select(tooltipRef.current).style("opacity", 0)
      );

    const sweetSpot = 40000;

    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", y(sweetSpot))
      .attr("y2", y(sweetSpot))
      .attr("stroke", COLORS.ACCENT)
      .attr("stroke-dasharray", "8 4");

    g.append("text")
      .attr("class", "sweet-spot-label")
      .attr("x", 10)
      .attr("y", y(sweetSpot) - 6)
      .text(`Sweet Spot ($40k)`);

  }, [selectedType]);

  return (
    <section className="story-section">
      <div className="step-text">
        <h3>Price Accessibility</h3>
        <p>
          EV prices are no longer exclusively premium. The distribution shows a
          growing affordability sweet spot.
        </p>
        <div className="vis-controls">
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="all">All Batteries</option>
            {batteryTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="vis-container" ref={visRef} />
      <div ref={tooltipRef} className="tooltip" />
    </section>
  );
}
