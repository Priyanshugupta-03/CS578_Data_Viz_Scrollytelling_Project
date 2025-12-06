import { useEffect, useState } from "react";
import * as d3 from "d3";
import { drawAdoptionStreamgraph } from "../d3/proEvCharts";
import "./RoadSequence.css";

export default function ProEVStreamgraph() {
  const [data, setData] = useState(null);

  useEffect(() => {
    d3.csv("electric_vehicles_dataset.csv").then((raw) => {
      const cleaned = raw
        .filter(
          (d) =>
            +d.Year >= 2015 &&
            +d.Price_USD > 0 &&
            +d.Range_km > 0 &&
            +d.Battery_Capacity_kWh > 0
        )
        .map((d) => ({
          Year: +d.Year,
          Units_Sold_2024: +d.Units_Sold_2024,
        }));

      setData(cleaned);
    });
  }, []);

  useEffect(() => {
    if (!data) return;

    const MARGIN = { top: 60, right: 80, bottom: 80, left: 100 };
    const WIDTH = 750;
    const HEIGHT = 650;
    const COLORS = {
      EV_COLOR: "#4DB6AC",
      BRIGHT_BLUE: "#03A9F4",
      HIGHLIGHT: "#FFEB3B",
      DUSTY_PURPLE: "#9575CD",
    };

    drawAdoptionStreamgraph("#proev-vis-1", data, MARGIN, WIDTH, HEIGHT, COLORS);

  }, [data]);

  return (
    <div className="proev-viz-block">
      <h3 className="proev-title">EV Adoption Over Time</h3>
      <div id="proev-vis-1" className="proev-viz-host"></div>
    </div>
  );
}
