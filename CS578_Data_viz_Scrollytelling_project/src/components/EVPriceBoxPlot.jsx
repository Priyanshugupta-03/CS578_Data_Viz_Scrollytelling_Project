import { useEffect, useState } from "react";
import * as d3 from "d3";
import { drawPriceAccessibilityBoxPlot } from "../d3/proEvCharts";
import "./RoadSequence.css";

export default function EVPriceBoxPlot() {
  const [data, setData] = useState(null);

  useEffect(() => {
    d3.csv("electric_vehicles_dataset.csv").then((raw) => {
      const cleaned = raw
        .filter((d) => +d.Price_USD > 0)
        .map((d) => ({
          Manufacturer: d.Manufacturer,
          Model: d.Model,
          Price_USD: +d.Price_USD,
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
      HIGHLIGHT: "#FFEB3B",
      DUSTY_PURPLE: "#9575CD",
    };

    drawPriceAccessibilityBoxPlot(
      "#proev-vis-6",
      data,
      MARGIN,
      WIDTH,
      HEIGHT,
      COLORS
    );

  }, [data]);

  return (
    <div className="proev-viz-block">
      <h3 className="proev-title">EV Price Distribution</h3>
      <div id="proev-vis-6" className="proev-viz-host"></div>
    </div>
  );
}
