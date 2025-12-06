import * as d3 from "d3";

/* ============================================================
    VISUALIZATION 1 — STREAMGRAPH (React-ready)
============================================================ */
export function drawAdoptionStreamgraph(
  target,
  evData,
  MARGIN,
  WIDTH,
  HEIGHT,
  COLORS
) {
  if (!target) return;

  const container = d3.select(target);
  container.html("");

  if (!evData || evData.length === 0) return;

  const finalData = d3.rollups(
      evData,
      (v) => d3.sum(v, (d) => d.Units_Sold_2024),
      (d) => d.Year
    )
    .map(([year, total]) => ({ year, total }))
    .filter((d) => d.total > 0)
    .sort((a, b) => a.year - b.year);

  const svg = container
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .append("g")
    .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = d3
    .scaleBand()
    .domain(finalData.map((d) => d.year))
    .range([0, innerWidth])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(finalData, (d) => d.total)])
    .nice()
    .range([innerHeight, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("~s")));

  const areaStart = d3.area()
    .x((d) => x(d.year) + x.bandwidth() / 2)
    .y0(innerHeight)
    .y1(innerHeight);

  const areaFinal = d3.area()
    .x((d) => x(d.year) + x.bandwidth() / 2)
    .y0(innerHeight)
    .y1((d) => y(d.total));

  const path = svg.append("path")
    .datum(finalData)
    .attr("fill", COLORS.EV_COLOR)
    .attr("d", areaStart);

  path.transition().duration(1200).attr("d", areaFinal);

  svg.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-family", "Inter, sans-serif")
    .text("EV Adoption Trend");
}



/* ============================================================
    VISUALIZATION 6 — BOX + SWARM PLOT (React-ready)
============================================================ */
export function drawPriceAccessibilityBoxPlot(
  target,
  evData,
  MARGIN,
  WIDTH,
  HEIGHT,
  COLORS
) {
  if (!target) return;

  const container = d3.select(target);
  container.html("");

  if (!evData || evData.length === 0) return;

  const svg = container
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .append("g")
    .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const prices = evData.map((d) => d.Price_USD).sort(d3.ascending);
  const q1 = d3.quantile(prices, 0.25);
  const median = d3.quantile(prices, 0.5);
  const q3 = d3.quantile(prices, 0.75);
  const min = d3.min(prices);
  const max = d3.max(prices);

  const y = d3.scaleLinear().domain([0, max]).range([innerHeight, 0]);

  svg.append("g")
    .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format("$,.0f")));

  const boxCenter = innerWidth * 0.65;
  const boxWidth = 60;

  svg.append("line")
    .attr("x1", boxCenter).attr("x2", boxCenter)
    .attr("y1", y(min)).attr("y2", y(max))
    .attr("stroke", COLORS.DUSTY_PURPLE)
    .attr("stroke-width", 2);

  svg.append("rect")
    .attr("x", boxCenter - boxWidth / 2)
    .attr("y", y(q3))
    .attr("width", boxWidth)
    .attr("height", y(q1) - y(q3))
    .attr("fill", COLORS.DUSTY_PURPLE)
    .attr("opacity", 0.85);

  svg.append("line")
    .attr("x1", boxCenter - boxWidth / 2)
    .attr("x2", boxCenter + boxWidth / 2)
    .attr("y1", y(median))
    .attr("y2", y(median))
    .attr("stroke", COLORS.HIGHLIGHT)
    .attr("stroke-width", 3);

  // Jitter swarm
  const jitter = d3.randomUniform(-140 / 2, 140 / 2);
  const swarmX = innerWidth * 0.3;

  svg.selectAll(".ev-price-dot")
    .data(evData)
    .enter()
    .append("circle")
    .attr("cx", () => swarmX + jitter())
    .attr("cy", (d) => y(d.Price_USD))
    .attr("r", 4)
    .attr("fill", COLORS.EV_COLOR)
    .attr("opacity", 0.6);

  svg.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-family", "Inter, sans-serif")
    .text("EV Price Distribution");
}
