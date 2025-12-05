document.addEventListener('DOMContentLoaded', () => {
    const MARGIN = { top: 60, right: 80, bottom: 80, left: 100 }; 
    const WIDTH = 750; 
    const HEIGHT = 650;
    const COLORS = {
        EV_COLOR: '#4DB6AC',
        ICE_COLOR: '#FF99AA',
        HIGHLIGHT: '#FFEB3B',
        DUSTY_PURPLE: '#9575CD', 
        BRIGHT_BLUE: '#03A9F4',
        TEXT_DARK: '#333333',
        SMOG: 'rgba(255, 165, 0, 0.5)',
        CLOUD: 'rgba(255, 255, 255, 0.8)',
        SAVINGS_GREEN: '#66BB6A'
    };
    
    const LIFECYCLE_MULTIPLIER = {
        EV_MFG_BASELINE_G_PER_KM: 50,
        ICE_MFG_BASELINE_G_PER_KM: 10,
    };
    
    const GRID_EMISSION_FACTORS = {
        coal: { factor: 1.0, label: "Coal Heavy (100% ICE CO2)" },
        mixed: { factor: 0.45, label: "Mixed (45% of ICE CO2)" },
        clean: { factor: 0.1, label: "Renewables Dominant (10% of ICE CO2)" } 
    };
    
    let evData = [];
    let vehiclesData = [];
    let emissionData = [];
    let activeVis = null;
    let windmillAnimationId = null;

    const tooltip = d3.select("body").select(".tooltip");

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const visId = entry.target.querySelector('.sticky-visual').id;
                handleScroll(visId);
            }
        });
    }, observerOptions);

    d3.selectAll('.story-section').each(function() {
        observer.observe(this);
    });

    function handleScroll(visId) {
        if (activeVis === visId) return; 
        activeVis = visId;

        if (windmillAnimationId) {
            cancelAnimationFrame(windmillAnimationId);
            windmillAnimationId = null;
        }

        switch (visId) {
            case 'vis-1-stream':
                drawAdoptionStreamgraph();
                break;
            case 'vis-2-scatter':
                drawEfficiencyScatterPlot(); 
                break;
            case 'vis-3-bar':
                drawOperationalCO2BarChart();
                break;
            case 'vis-4-gauge':
                drawGreenGridGauge();
                break;
            case 'vis-5-innovative':
                drawInnovativeCloudPlot();
                break;
            case 'vis-6-box':
                drawPriceAccessibilityBoxPlot();
                break;
        }
    }


    async function loadData() {
        try {
            const rawEVData = await d3.csv("electric_vehicles_dataset.csv");
            evData = rawEVData
                .filter(d => +d.Year >= 2015 && +d.Price_USD > 0 && +d.Range_km > 0 && +d.Battery_Capacity_kWh > 0)
                .map(d => ({
                    Year: +d.Year,
                    Manufacturer: d.Manufacturer,
                    Model: d.Model,
                    Battery_Capacity_kWh: +d.Battery_Capacity_kWh,
                    Range_km: +d.Range_km,
                    Price_USD: +d.Price_USD,
                    Units_Sold_2024: +d.Units_Sold_2024,
                    Efficiency: +d.Range_km / +d.Battery_Capacity_kWh, 
                    Battery_Type: d.Battery_Type
                }));
            
            const rawVehiclesData = await d3.csv("vehicles.csv");
            vehiclesData = rawVehiclesData
                .filter(d => +d.year >= 2015 && +d.co2TailpipeGpm > 0 && d.fuelType1.includes('Gasoline'))
                .map(d => ({
                    Year: +d.year,
                    FuelType: d.fuelType1,
                    CO2_g_per_km: (+d.co2TailpipeGpm / 1.60934) || 0,
                    CO2_g_per_mi: +d.co2TailpipeGpm
                }));
                
            const rawEmissionData = await d3.csv("vehicle_emission_dataset.csv");
            emissionData = rawEmissionData
                .map(d => ({
                    VehicleType: d['Vehicle Type'],
                    FuelType: d['Fuel Type'],
                    CO2: +d['CO2 Emissions'],
                    NOx: +d['NOx Emissions'],
                    PM25: +d['PM2.5 Emissions'],
                    VOC: +d['VOC Emissions'],
                    SO2: +d['SO2 Emissions'],
                }));

        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    function drawAdoptionStreamgraph() {
        const container = d3.select("#vis-1-stream");
        container.html("");

        if (evData.length === 0) return;

        const dataByYear = d3.rollups(evData, 
            v => d3.sum(v, d => d.Units_Sold_2024), 
            d => d.Year
        ).map(([year, total]) => ({ year, total }));
        
        const finalData = dataByYear.filter(d => d.total > 0).sort((a, b) => a.year - b.year);

        const svg = container.append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .attr("class", "vis-svg")
            .append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

        const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
        const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

        const x = d3.scaleBand()
            .domain(finalData.map(d => d.year))
            .range([0, innerWidth])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(finalData, d => d.total)])
            .nice()
            .range([innerHeight, 0]);

        svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("class", "y-axis axis")
            .call(d3.axisLeft(y).ticks(5, "s").tickFormat(d3.format("~s")));
            
        svg.append("text")
            .attr("class", "x-label")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + MARGIN.bottom / 2)
            .attr("text-anchor", "middle")
            .text("Year");

        svg.append("text")
            .attr("class", "y-label")
            .attr("x", -innerHeight / 2)
            .attr("y", -MARGIN.left / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Total Units Sold (Millions)");

        const area = d3.area()
            .x(d => x(d.year) + x.bandwidth() / 2)
            .y0(innerHeight)
            .y1(innerHeight);

        const path = svg.append("path")
            .datum(finalData)
            .attr("class", "stream")
            .attr("fill", COLORS.EV_COLOR)
            .attr("d", area);

        const finalArea = d3.area()
            .x(d => x(d.year) + x.bandwidth() / 2)
            .y0(innerHeight)
            .y1(d => y(d.total));

        path.transition()
            .duration(1500)
            .attr("d", finalArea)
            .on("end", () => {
                const line = d3.line()
                    .x(d => x(d.year) + x.bandwidth() / 2)
                    .y(d => y(d.total));

                svg.append("path")
                    .datum(finalData)
                    .attr("fill", "none")
                    .attr("stroke", COLORS.BRIGHT_BLUE)
                    .attr("stroke-width", 3)
                    .attr("d", line);
                
                const dataWithGrowth = finalData.map((d, i, arr) => {
                    if (i === 0) return { ...d, growth: null };
                    const prevTotal = arr[i - 1].total;
                    const growth = (d.total - prevTotal) / prevTotal * 100;
                    return { ...d, growth };
                }).filter(d => d.growth !== null); 
                
                const interactionBars = svg.selectAll(".interaction-bar")
                    .data(finalData)
                    .enter()
                    .append("rect")
                    .attr("class", "interaction-bar")
                    .attr("x", d => x(d.year))
                    .attr("y", d => y(d.total))
                    .attr("width", x.bandwidth())
                    .attr("height", d => innerHeight - y(d.total))
                    .attr("fill", "transparent"); 

                const dots = svg.selectAll(".stream-dot")
                    .data(finalData)
                    .enter()
                    .append("circle")
                    .attr("class", "stream-dot")
                    .attr("cx", d => x(d.year) + x.bandwidth() / 2)
                    .attr("cy", d => y(d.total))
                    .attr("r", 5)
                    .attr("fill", COLORS.HIGHLIGHT)
                    .attr("opacity", 0.8)
                    .on("mouseover", (event, d) => handleHover(event, d, true))
                    .on("mouseout", (event, d) => handleHover(event, d, false));
                
                const growthGroup = svg.append("g").attr("class", "growth-group");

                function updateGrowthLabels(highlightYear) {
                     growthGroup.selectAll(".growth-label-bg").remove();
                     growthGroup.selectAll(".growth-label").remove();
                     growthGroup.selectAll(".units-label").remove();
                     
                    const selectedData = finalData.find(d => d.year == highlightYear);
                    const growthData = dataWithGrowth.find(g => g.year === highlightYear);

                    if (selectedData) {
                        const growthText = growthData ? `Growth: ${growthData.growth >= 0 ? '+' : ''}${d3.format(".1f")(growthData.growth)}%` : 'New Data Year';
                        
                        growthGroup.append("rect")
                            .attr("class", "growth-label-bg")
                            .attr("x", x(highlightYear) + x.bandwidth() / 2 - 120)
                            .attr("y", y(selectedData.total) - 80)
                            .attr("width", 240)
                            .attr("height", 60)
                            .attr("rx", 5)
                            .attr("ry", 5)
                            .attr("fill", COLORS.DUSTY_PURPLE)
                            .attr("opacity", 0.9);

                        growthGroup.append("text")
                            .attr("class", "growth-label")
                            .attr("x", x(highlightYear) + x.bandwidth() / 2)
                            .attr("y", y(selectedData.total) - 45)
                            .attr("text-anchor", "middle")
                            .style("font-size", "1.2em")
                            .style("fill", "white")
                            .style("font-weight", "bold")
                            .text(growthText);
                        
                        growthGroup.append("text")
                            .attr("class", "units-label")
                            .attr("x", x(highlightYear) + x.bandwidth() / 2)
                            .attr("y", y(selectedData.total) - 25)
                            .attr("text-anchor", "middle")
                            .style("font-size", "1.2em")
                            .style("fill", "white")
                            .text(`Units: ${d3.format(",")(selectedData.total)}`);
                    }
                }
                
                function updateHighlight(selectedYear) {
                    d3.selectAll(".interaction-bar").classed("highlight-bar", false);
                    d3.selectAll(".stream-dot").attr("r", 5).attr("fill", COLORS.HIGHLIGHT);
                    
                    svg.selectAll(".interaction-bar")
                        .filter(d => d.year == selectedYear)
                        .classed("highlight-bar", true);
                    
                    svg.selectAll(".stream-dot")
                        .filter(d => d.year == selectedYear)
                        .attr("r", 8)
                        .attr("fill", COLORS.EV_COLOR)
                        .raise();
                        
                    updateGrowthLabels(selectedYear);
                }
                
                const initialYear = d3.select('input[name="yearSelect"]:checked').property("value");
                updateHighlight(+initialYear);


                d3.selectAll('input[name="yearSelect"]').on("change", function() {
                    updateHighlight(+this.value);
                });

                function handleHover(event, d, isOver) {
                    tooltip.transition().duration(isOver ? 200 : 500).style("opacity", isOver ? .9 : 0);
                    if (isOver) {
                        const growthData = dataWithGrowth.find(g => g.year === d.year);
                        const growthText = growthData ? `<br/>Growth: ${d3.format(".1f")(growthData.growth)}%` : '';
                        tooltip.html(`
                            <strong>${d.year}</strong><br/>
                            Total Units: ${d3.format(",")(d.total)}
                            ${growthText}
                        `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    }
                }
            });

        svg.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "1.8em")
            .style("font-family", "var(--font-whimsical)")
            .text("Chapter 1: The Ascent of Electric Vehicles");
    }

    function drawEfficiencyScatterPlot() {
        const container = d3.select("#vis-2-scatter");
        container.html("");

        if (evData.length === 0) return;
        
        const zoom = d3.zoom().scaleExtent([1, 10]).on("zoom", handleZoom);

        const svg = container.append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .attr("class", "vis-svg")
            .call(zoom);
            
        const chartGroup = svg.append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
            
        const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
        const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

        const x = d3.scaleLinear()
            .domain(d3.extent(evData, d => d.Range_km))
            .nice()
            .range([0, innerWidth]);

        const y = d3.scaleLinear()
            .domain(d3.extent(evData, d => d.Efficiency))
            .nice()
            .range([innerHeight, 0]);
            
        const colorScale = d3.scaleQuantize()
            .domain(d3.extent(evData, d => d.Price_USD))
            .range([COLORS.EV_COLOR, COLORS.BRIGHT_BLUE, COLORS.DUSTY_PURPLE]);

        const xAxisGroup = chartGroup.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x));

        const yAxisGroup = chartGroup.append("g")
            .attr("class", "y-axis axis")
            .call(d3.axisLeft(y));
             
        chartGroup.append("text")
            .attr("class", "x-label")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + MARGIN.bottom / 2)
            .attr("text-anchor", "middle")
            .text("Range (km)");

        chartGroup.append("text")
            .attr("class", "y-label")
            .attr("x", -innerHeight / 2)
            .attr("y", -MARGIN.left / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Efficiency (km/kWh)");

        const scatterGroup = chartGroup.append("g").attr("class", "scatter-group");
        
        const N = evData.length;
        const sumX = d3.sum(evData, d => d.Range_km);
        const sumY = d3.sum(evData, d => d.Efficiency);
        const sumXX = d3.sum(evData, d => d.Range_km * d.Range_km);
        const sumXY = d3.sum(evData, d => d.Range_km * d.Efficiency);

        const m = (N * sumXY - sumX * sumY) / (N * sumXX - sumX * sumX);
        const b = (sumY - m * sumX) / N;

        const xMin = d3.min(evData, d => d.Range_km);
        const xMax = d3.max(evData, d => d.Range_km);

        const trendLineData = [
            { x: xMin, y: m * xMin + b },
            { x: xMax, y: m * xMax + b }
        ];

        const trendLine = d3.line()
            .x(d => x(d.x))
            .y(d => y(d.y));
        
        scatterGroup.append("path")
            .datum(trendLineData)
            .attr("class", "trend-line")
            .attr("fill", "none")
            .attr("stroke", COLORS.ICE_COLOR)
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "5,5")
            .attr("d", trendLine);
        
        const points = scatterGroup.selectAll(".scatter-point")
            .data(evData)
            .enter()
            .append("circle")
            .attr("class", "scatter-point")
            .attr("cx", d => x(d.Range_km))
            .attr("cy", d => y(d.Efficiency))
            .attr("r", 5)
            .attr("fill", d => colorScale(d.Price_USD))
            .attr("opacity", 0.7)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);

        const efficiencySlider = d3.select("#efficiencySlider");
        const efficiencyValueSpan = d3.select("#efficiencyValue");

        efficiencySlider.on("input", function() {
            const minValue = +this.value;
            efficiencyValueSpan.text(minValue);
            filterPoints(minValue);
        });

        function filterPoints(minValue) {
            points.transition().duration(200)
                .attr("opacity", d => d.Efficiency >= minValue ? 0.7 : 0.1)
                .attr("r", d => d.Efficiency >= minValue ? 5 : 2);
        }
        
        filterPoints(+efficiencySlider.property("value"));

        function handleMouseOver(event, d) {
            d3.select(this).attr("r", 8).attr("opacity", 1).raise();
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`
                <strong>${d.Manufacturer} ${d.Model}</strong><br/>
                Range: ${d3.format(".0f")(d.Range_km)} km<br/>
                Efficiency: ${d3.format(".2f")(d.Efficiency)} km/kWh<br/>
                Price: ${d3.format("$,.0f")(d.Price_USD)}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }

        function handleMouseOut() {
            d3.select(this).attr("r", 5).attr("opacity", 0.7);
            tooltip.transition().duration(500).style("opacity", 0);
        }

        function handleZoom({transform}) {
            const newX = transform.rescaleX(x);
            const newY = transform.rescaleY(y);

            xAxisGroup.call(d3.axisBottom(newX));
            yAxisGroup.call(d3.axisLeft(newY));

            scatterGroup.selectAll(".scatter-point")
                .attr("cx", d => newX(d.Range_km))
                .attr("cy", d => newY(d.Efficiency));
                
            const newTrendLine = d3.line()
                .x(d => newX(d.x))
                .y(d => newY(d.y));
                
            scatterGroup.select(".trend-line").attr("d", newTrendLine);
        }

        svg.append("text")
            .attr("x", innerWidth / 2 + MARGIN.left)
            .attr("y", MARGIN.top / 2 - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "1.8em")
            .style("font-family", "var(--font-whimsical)")
            .text("Chapter 2: Range and Efficiency Milestones");
    }

    function drawOperationalCO2BarChart() {
        const container = d3.select("#vis-3-bar");
        container.html("");

        const avgEV_CO2_Operational_Base = 0; 
        const avgICE_CO2 = d3.mean(vehiclesData, d => d.CO2_g_per_km);
        
        function getEV_CO2_Operational_WithGrid(gridKey) {
            const conceptualMaxEV_CO2 = avgICE_CO2; 
            
            return conceptualMaxEV_CO2 * GRID_EMISSION_FACTORS[gridKey].factor;
        }

        const initialGridKey = d3.select("#gridSelect").property("value") || 'coal';
        let currentEV_CO2_Operational = getEV_CO2_Operational_WithGrid(initialGridKey);
        
        let initialData = [
            { type: "EV (Operational)", value: currentEV_CO2_Operational, color: COLORS.EV_COLOR, fill: COLORS.EV_COLOR, line: 'white', isOperational: true, dash: '0', gridKey: initialGridKey },
            { type: "ICE (Operational)", value: avgICE_CO2, color: COLORS.ICE_COLOR, fill: COLORS.ICE_COLOR, line: COLORS.TEXT_DARK, isOperational: true, dash: '0' },
            { type: "EV (Manufacturing)", value: LIFECYCLE_MULTIPLIER.EV_MFG_BASELINE_G_PER_KM, color: COLORS.EV_COLOR, line: COLORS.EV_COLOR, dash: '4 4', isOperational: false },
            { type: "ICE (Manufacturing)", value: LIFECYCLE_MULTIPLIER.ICE_MFG_BASELINE_G_PER_KM, color: COLORS.ICE_COLOR, line: COLORS.ICE_COLOR, dash: '4 4', isOperational: false },
        ];
        
        const maxVal = d3.max([
            avgICE_CO2 + LIFECYCLE_MULTIPLIER.ICE_MFG_BASELINE_G_PER_KM, 
            getEV_CO2_Operational_WithGrid('coal') + LIFECYCLE_MULTIPLIER.EV_MFG_BASELINE_G_PER_KM 
        ]) * 1.1; 

        const svg = container.append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .attr("class", "vis-svg")
            .append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
            
        const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
        const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

        const x = d3.scaleBand()
            .domain(["EV (Operational)", "ICE (Operational)"])
            .range([0, innerWidth * 0.6]) 
            .padding(0.4);

        const y = d3.scaleLinear()
            .domain([0, maxVal])
            .nice()
            .range([innerHeight, 0]);
            
        svg.append("g")
            .attr("class", "y-axis axis")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0f")));
            
        svg.append("text")
            .attr("class", "y-label")
            .attr("x", -innerHeight / 2)
            .attr("y", -MARGIN.left / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Lifecycle CO2 (g/km Equivalent)");

        const visGroup = svg.append("g").attr("class", "bar-vis-group");

        const savingsGroup = svg.append("g")
            .attr("class", "savings-group")
            .attr("transform", `translate(${innerWidth * 0.8}, ${innerHeight / 2})`);


        function updateVisualization(data) {
            const operationalData = data.filter(d => d.isOperational);
            const mfgData = data.filter(d => !d.isOperational);
            
            const bars = visGroup.selectAll(".operational-bar")
                .data(operationalData, d => d.type);

            bars.enter()
                .append("rect")
                .attr("class", "operational-bar")
                .attr("x", d => x(d.type))
                .attr("width", x.bandwidth())
                .attr("fill", d => d.fill)
                .attr("y", innerHeight)
                .attr("height", 0)
                .merge(bars)
                .transition().duration(1000)
                .attr("y", d => y(d.value))
                .attr("height", d => innerHeight - y(d.value));

            visGroup.selectAll(".mfg-line").remove();
            
            visGroup.selectAll(".mfg-line")
                .data(mfgData, d => d.type)
                .enter()
                .append("line")
                .attr("class", "mfg-line")
                .attr("x1", d => x(d.type.split(" ")[0] + " (Operational)") + x.bandwidth() / 2)
                .attr("x2", d => x(d.type.split(" ")[0] + " (Operational)") + x.bandwidth() / 2)
                .attr("y1", d => y(operationalData.find(o => o.type.includes(d.type.split(" ")[0])).value))
                .attr("y2", d => y(operationalData.find(o => o.type.includes(d.type.split(" ")[0])).value))
                .attr("stroke", d => d.line)
                .attr("stroke-dasharray", d => d.dash)
                .attr("stroke-width", 4)
                .transition().duration(1000)
                .attr("y2", d => y(operationalData.find(o => o.type.includes(d.type.split(" ")[0])).value) - (innerHeight - y(mfgData.find(m => m.type.includes(d.type.split(" ")[0])).value))); 
            
            const evOpValue = data.find(d => d.type === "EV (Operational)").value;
            const evMfgValue = LIFECYCLE_MULTIPLIER.EV_MFG_BASELINE_G_PER_KM;
            const iceOpValue = data.find(d => d.type === "ICE (Operational)").value;
            const iceMfgValue = LIFECYCLE_MULTIPLIER.ICE_MFG_BASELINE_G_PER_KM;

            const totalICESavings = iceOpValue + iceMfgValue;
            const totalEVSavings = evOpValue + evMfgValue;
            const absoluteSavings = totalICESavings - totalEVSavings;
            const savingsPercentage = (absoluteSavings / totalICESavings) * 100;
            
            savingsGroup.html("");

            savingsGroup.append("text")
                .attr("class", "savings-label-text")
                .attr("y", -60)
                .attr("text-anchor", "middle")
                .style("font-size", "1.4em")
                .style("fill", COLORS.TEXT_DARK)
                .style("font-weight", "bold")
                .text("Total Lifecycle CO2 Savings:");

            savingsGroup.append("text")
                .attr("class", "savings-value")
                .attr("y", 0)
                .attr("text-anchor", "middle")
                .style("font-size", "3em")
                .style("fill", COLORS.SAVINGS_GREEN)
                .style("opacity", 0)
                .transition().duration(1500).style("opacity", 1)
                .text(`${d3.format(".1f")(absoluteSavings)} g/km`);
                
            savingsGroup.append("text")
                .attr("class", "savings-percent")
                .attr("y", 40)
                .attr("text-anchor", "middle")
                .style("font-size", "1.5em")
                .style("fill", COLORS.DUSTY_PURPLE)
                .style("opacity", 0)
                .transition().duration(2000).style("opacity", 1)
                .text(`(${d3.format(".0f")(savingsPercentage)}% Reduction)`);
        }
        
        updateVisualization(initialData);

        d3.select("#gridSelect").on("change", function() {
            const selectedGridKey = this.value;
            const newEV_CO2_Operational = getEV_CO2_Operational_WithGrid(selectedGridKey);

            const newData = [
                { type: "EV (Operational)", value: newEV_CO2_Operational, color: COLORS.EV_COLOR, fill: COLORS.EV_COLOR, line: 'white', isOperational: true, dash: '0' },
                { type: "ICE (Operational)", value: avgICE_CO2, color: COLORS.ICE_COLOR, fill: COLORS.ICE_COLOR, line: COLORS.TEXT_DARK, isOperational: true, dash: '0' },
                { type: "EV (Manufacturing)", value: LIFECYCLE_MULTIPLIER.EV_MFG_BASELINE_G_PER_KM, color: COLORS.EV_COLOR, line: COLORS.EV_COLOR, dash: '4 4', isOperational: false },
                { type: "ICE (Manufacturing)", value: LIFECYCLE_MULTIPLIER.ICE_MFG_BASELINE_G_PER_KM, color: COLORS.ICE_COLOR, line: COLORS.ICE_COLOR, dash: '4 4', isOperational: false },
            ];
            
            updateVisualization(newData);
        });

        svg.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "1.8em")
            .style("font-family", "var(--font-whimsical)")
            .text("Chapter 3: Tailpipe vs. Full Lifecycle CO2");
    }


    function drawGreenGridGauge() {
        const container = d3.select("#vis-4-gauge");
        container.html("");

        let currentGridCleanliness = 0.30;
        const targetGridCleanliness = 0.75;

        const svg = container.append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .attr("class", "vis-svg")
            .append("g")
            .attr("transform", `translate(${WIDTH / 2},${HEIGHT / 2 + 50})`);

        const radius = Math.min(WIDTH, HEIGHT) * 0.35;
        const arcThickness = 30;
        const PI = Math.PI;

        const scaleAngle = d3.scaleLinear()
            .domain([0, 1])
            .range([-2 * PI / 3, 2 * PI / 3]);

        const arcBackground = d3.arc()
            .innerRadius(radius - arcThickness)
            .outerRadius(radius)
            .startAngle(scaleAngle(0))
            .endAngle(scaleAngle(1));

        svg.append("path")
            .attr("d", arcBackground)
            .attr("fill", "#E0E0E0")
            .attr("class", "gauge-background");
            
        const gradient = svg.append("defs").append("linearGradient")
            .attr("id", "progress-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", COLORS.ICE_COLOR);
            
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", COLORS.EV_COLOR);


        const arcProgress = d3.arc()
            .innerRadius(radius - arcThickness)
            .outerRadius(radius)
            .startAngle(scaleAngle(0)); 
            
        const progressPath = svg.append("path")
            .datum({ endAngle: scaleAngle(currentGridCleanliness) })
            .attr("d", arcProgress)
            .attr("fill", "url(#progress-gradient)")
            .attr("class", "gauge-progress");

        const pointerContainer = svg.append("g")
            .attr("class", "gauge-pointer-container")
            .attr("transform", `rotate(${scaleAngle(currentGridCleanliness) * 180 / PI})`);

        pointerContainer.append("circle")
            .attr("r", 10)
            .attr("fill", COLORS.HIGHLIGHT);
            
        pointerContainer.append("path")
            .attr("d", `M 0 -${radius - arcThickness} L -5 -${radius} L 5 -${radius} Z`)
            .attr("fill", COLORS.HIGHLIGHT);

        const centerText = svg.append("text")
            .attr("class", "gauge-center-text")
            .attr("text-anchor", "middle")
            .attr("y", -10)
            .style("font-size", "3em")
            .style("font-weight", "bold")
            .style("fill", COLORS.TEXT_DARK)
            .text(d3.format(".0%")(currentGridCleanliness));
            
        const statusText = svg.append("text")
            .attr("class", "gauge-status-text")
            .attr("text-anchor", "middle")
            .attr("y", 30)
            .style("font-size", "1.2em")
            .style("fill", COLORS.DUSTY_PURPLE);

        const windmillSize = 30;
        const windmillGroup = svg.append("g")
            .attr("class", "windmill-group")
            .attr("transform", `translate(0, ${radius * 0.5})`);

        windmillGroup.append("line")
            .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", windmillSize * 1.5)
            .attr("stroke", COLORS.TEXT_DARK)
            .attr("stroke-width", 2);
        
        const windmill = windmillGroup.append("g")
            .attr("class", "windmill-blades");

        windmill.append("line").attr("x1", -windmillSize / 2).attr("y1", 0).attr("x2", windmillSize / 2).attr("y2", 0).attr("stroke", COLORS.EV_COLOR).attr("stroke-width", 4);
        windmill.append("line").attr("x1", 0).attr("y1", -windmillSize / 2).attr("x2", 0).attr("y2", windmillSize / 2).attr("stroke", COLORS.EV_COLOR).attr("stroke-width", 4);

        function rotateWindmill(value) {
            if (windmillAnimationId) cancelAnimationFrame(windmillAnimationId);
            const minRotationTime = 1000; 
            const maxRotationTime = 5000;
            let startTime = null;

            function animate(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;

                const speedFactor = 1 - Math.min(1, Math.max(0, value));
                const rotationTime = maxRotationTime * speedFactor + minRotationTime * (1 - speedFactor);
                const rotation = (elapsed % rotationTime) / rotationTime * 360;

                windmill.attr("transform", `rotate(${rotation})`);
                windmillAnimationId = requestAnimationFrame(animate);
            }
            windmillAnimationId = requestAnimationFrame(animate);
        }

        rotateWindmill(currentGridCleanliness);

        const ticks = [0, 0.25, 0.5, 0.75, 1];
        const tickExplanations = [
            "0% (Coal Grid)", 
            "25% (High Emissions)", 
            "50% (EV Break-Even)", 
            "75% (Strong Savings)", 
            "100% (Green Grid)"
        ];
        
        const tickGroup = svg.append("g").attr("class", "gauge-ticks");

        ticks.forEach((value, i) => {
            const angle = scaleAngle(value);
            const rInner = radius - arcThickness - 5;
            const rOuter = radius + 5;
            
            const rotationDeg = angle * 180 / PI;

            tickGroup.append("line")
                .attr("x1", Math.sin(angle) * rInner)
                .attr("y1", -Math.cos(angle) * rInner)
                .attr("x2", Math.sin(angle) * rOuter)
                .attr("y2", -Math.cos(angle) * rOuter)
                .attr("stroke", COLORS.TEXT_DARK)
                .attr("stroke-width", 1);
                
            tickGroup.append("text")
                .attr("x", Math.sin(angle) * (rOuter + 10))
                .attr("y", -Math.cos(angle) * (rOuter + 10))
                .attr("text-anchor", angle < -PI / 4 ? "start" : (angle > PI / 4 ? "end" : "middle"))
                .style("font-size", "0.8em")
                .style("font-weight", "500")
                .text(tickExplanations[i]);
        });


        function updateGauge(value, duration = 1500) {
            value = Math.max(0, Math.min(1, value));
            
            progressPath.transition().duration(duration).ease(d3.easeQuadOut)
                .attrTween("d", function(d) {
                    const interpolate = d3.interpolate(scaleAngle(currentGridCleanliness), scaleAngle(value));
                    return function(t) {
                        d.endAngle = interpolate(t);
                        return arcProgress(d);
                    };
                });

            pointerContainer.transition().duration(duration).ease(d3.easeQuadOut)
                .attrTween("transform", function() {
                    const interpolate = d3.interpolate(currentGridCleanliness, value);
                    return function(t) {
                        const angle = scaleAngle(interpolate(t)) * 180 / PI;
                        return `rotate(${angle})`;
                    };
                });
                
            const interpolator = d3.interpolate(currentGridCleanliness, value); 
            
            pointerContainer.transition().duration(duration).ease(d3.easeQuadOut)
                .tween("text", function() {
                    return function(t) {
                        const interpolatedValue = interpolator(t);
                        centerText.text(d3.format(".0%")(interpolatedValue));
                        
                        const emissionFactor = 1 - interpolatedValue;
                        statusText.text(`Current EV Emission Factor: ${d3.format(".2f")(emissionFactor)} (${d3.format(".0%")(interpolatedValue)} Clean Grid)`);
                        rotateWindmill(interpolatedValue);
                    };
                })
                .on("end", () => {
                    currentGridCleanliness = value;
                    rotateWindmill(currentGridCleanliness);
                });

            currentGridCleanliness = value;
        }

        const simulationButton = d3.select("#simulateGridImprovement");
        simulationButton.on("click", function() {
            const nextValue = currentGridCleanliness > 0.5 ? 0.30 : targetGridCleanliness;
            updateGauge(nextValue, 2500);
        });

        statusText.text(`Current EV Emission Factor: ${d3.format(".2f")(1 - currentGridCleanliness)} (${d3.format(".0%")(currentGridCleanliness)} Clean Grid)`);

        svg.append("text")
            .attr("x", 0)
            .attr("y", -HEIGHT / 2 + MARGIN.top / 2 - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "1.8em")
            .style("font-family", "var(--font-whimsical)")
            .text("Chapter 4: The Clean Grid: The EV Multiplier");
    }

    function drawInnovativeCloudPlot() {
        const PI = Math.PI;
        const container = d3.select("#vis-5-innovative");
        container.html("");

        const iceAvg = {
            CO2: d3.mean(emissionData.filter(d => d.FuelType === 'Gasoline'), d => d.CO2) || 0,
            NOx: d3.mean(emissionData.filter(d => d.FuelType === 'Gasoline'), d => d.NOx) || 0,
            PM25: d3.mean(emissionData.filter(d => d.FuelType === 'Gasoline'), d => d.PM25) || 0,
            VOC: d3.mean(emissionData.filter(d => d.FuelType === 'Gasoline'), d => d.VOC) || 0,
        };

        const svg = container.append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .attr("class", "vis-svg")
            .append("g");
            
        const defs = svg.append("defs");
        const filter = defs.append("filter").attr("id", "goo");
        filter.append("feGaussianBlur")
            .attr("in", "SourceGraphic")
            .attr("stdDeviation", 15)
            .attr("result", "blur");
        filter.append("feColorMatrix")
            .attr("in", "blur")
            .attr("mode", "matrix")
            .attr("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7")
            .attr("result", "goo");
        filter.append("feBlend")
            .attr("in", "SourceGraphic")
            .attr("in2", "goo")
            .attr("operator", "atop");

        const iceCloudGroup = svg.append("g")
            .attr("class", "ice-cloud-group")
            .attr("transform", `translate(${WIDTH * 0.3}, ${HEIGHT / 2})`);

        const pollutantData = [
            { name: "NOx", value: iceAvg.NOx, color: '#f44336', desc: "Nitrogen Oxides: Respiratory irritant, precursor to smog." },
            { name: "PM2.5", value: iceAvg.PM25, color: '#9e9e9e', desc: "Particulate Matter: Tiny solids/liquids that penetrate lungs." },
            { name: "VOC", value: iceAvg.VOC, color: '#ff9800', desc: "Volatile Organic Compounds: Can be toxic, contribute to ground-level ozone." },
            { name: "CO2", value: iceAvg.CO2 / 500, color: '#607d8b', desc: "Carbon Dioxide: Primary greenhouse gas driving climate change." }
        ];

        const scaleValue = d3.scaleLinear()
            .domain([0, d3.max(pollutantData, d => d.value)])
            .range([30, 80]);

        let bubbles = iceCloudGroup.selectAll(".pollutant-bubble")
            .data(pollutantData)
            .enter()
            .append("circle")
            .attr("class", "pollutant-bubble cloud-glyph")
            .attr("cx", (d, i) => Math.cos(i * 2 * PI / 4) * (scaleValue(d.value) * 1.5))
            .attr("cy", (d, i) => Math.sin(i * 2 * PI / 4) * (scaleValue(d.value) * 1.5))
            .attr("r", d => scaleValue(d.value))
            .attr("fill", d => d.color)
            .attr("opacity", 0.7)
            .on("mouseover", handlePollutantOver)
            .on("mouseout", handlePollutantOut);
            
        let evCloudGroup = svg.append("g")
            .attr("class", "ev-cloud-group")
            .attr("transform", `translate(${WIDTH * 0.75}, ${HEIGHT / 2})`);

        evCloudGroup.append("circle")
            .attr("class", "clean-cloud-ev")
            .attr("r", 150)
            .attr("fill", COLORS.CLOUD);

        evCloudGroup.append("text")
            .attr("class", "cloud-center-symbol")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("font-size", "5em")
            .attr("fill", COLORS.HIGHLIGHT)
            .text("⚡");
            
        let isDragging = false;
        let animateCloudFn;
        
        const drag = d3.drag()
            .on("start", function() {
                isDragging = true;
                d3.select(this).style("cursor", "grabbing");
                evCloudGroup.interrupt().style("transform", evCloudGroup.attr("transform")); 
            })
            .on("drag", function(event) {
                const newX = event.x;
                const newY = event.y;
                d3.select(this).attr("transform", `translate(${newX}, ${newY})`);
                
                const currentEvTransform = evCloudGroup.attr("transform").match(/translate\(([^,]+),([^)]+)\)/);
                const evX = parseFloat(currentEvTransform[1]);
                const evY = parseFloat(currentEvTransform[2]);
                
                const diffX = evX - newX;
                const diffY = evY - newY;
                
                const dist = Math.sqrt(diffX * diffX + diffY * diffY);
                const avoidFactor = Math.max(0, 1 - (dist / (WIDTH / 2.5))); 
                
                const evTargetX = evX + (diffX > 0 ? 1 : -1) * avoidFactor * 20; 
                const evTargetY = evY + (diffY > 0 ? 1 : -1) * avoidFactor * 20;
                
                evCloudGroup.transition().duration(50) 
                    .attr("transform", `translate(${evTargetX}, ${evTargetY})`);
            })
            .on("end", function() {
                isDragging = false;
                d3.select(this).style("cursor", "grab");
                animateCloudFn();
            });

        iceCloudGroup.call(drag);
        iceCloudGroup.style("cursor", "grab");

        animateCloudFn = function animateCloud() {
            if (isDragging) return; 
            
            evCloudGroup.transition()
                .duration(4000)
                .ease(d3.easeSinInOut)
                .attr("transform", `translate(${WIDTH * 0.75 + 10}, ${HEIGHT / 2 + 5})`)
                .transition()
                .duration(4000)
                .ease(d3.easeSinInOut)
                .attr("transform", `translate(${WIDTH * 0.75 - 10}, ${HEIGHT / 2 - 5})`)
                .on("end", animateCloud);
        }
        animateCloudFn();

        const pollutantButtons = d3.selectAll(".pollutant-toggle");
        
        pollutantButtons.on("click", function(event) {
            const selectedPollutant = d3.select(this).attr("data-pollutant");
            
            pollutantButtons.classed('active', false);
            tooltip.transition().duration(500).style("opacity", 0);
            
            bubbles.transition().duration(300)
                .attr("fill", d => d.color)
                .attr("r", d => scaleValue(d.value))
                .attr("opacity", 0.7);
                
            if (selectedPollutant) {
                d3.select(this).classed('active', true);
                
                const selectedBubble = bubbles.filter(d => d.name === selectedPollutant);
                selectedBubble.transition().duration(300)
                    .attr("fill", COLORS.HIGHLIGHT)
                    .attr("r", d => scaleValue(d.value) * 1.2)
                    .attr("opacity", 1)
                    .raise();
                    
                const pollutant = pollutantData.find(d => d.name === selectedPollutant);
                if (pollutant) {
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(`
                        <strong>${pollutant.name} - ${d3.format(".2f")(pollutant.value)} Units:</strong><br/>
                        ${pollutant.desc}
                    `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            }
        });

        function handlePollutantOver(event, d) {
            d3.select(this).transition().duration(100).attr("fill", COLORS.HIGHLIGHT).attr("r", scaleValue(d.value) * 1.1).attr("opacity", 1).raise();
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`
                <strong>${d.name}:</strong> ${d3.format(".2f")(d.value)} Units<br/>
                ${d.desc}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }

        function handlePollutantOut() {
            d3.select(this).transition().duration(100).attr("fill", d => d.color).attr("r", d => scaleValue(d.value)).attr("opacity", 0.7);
            tooltip.transition().duration(500).style("opacity", 0);
        }

        svg.append("text")
            .attr("x", WIDTH / 2)
            .attr("y", MARGIN.top / 2 - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "1.8em")
            .style("font-family", "var(--font-whimsical)")
            .text("Chapter 5: Out with the Smog (The Innovative View)");
    }

    function drawPriceAccessibilityBoxPlot() {
        const container = d3.select("#vis-6-box");
        container.html("");
        
        if (evData.length === 0) return;

        let currentFilteredData = evData;
        const tooltip = d3.select(".tooltip");

        function getBoxPlotStats(data) {
            if (data.length === 0) {
                return { prices: [], q1: 0, median: 0, q3: 0, min: 0, max: 0 };
            }
            const prices = data.map(d => d.Price_USD).sort(d3.ascending);
            const q1 = d3.quantile(prices, 0.25);
            const median = d3.quantile(prices, 0.5);
            const q3 = d3.quantile(prices, 0.75);
            const min = d3.min(prices);
            const max = d3.max(prices);
            
            return { prices, q1, median, q3, min, max };
        }

        let { prices, q1, median, q3, min, max } = getBoxPlotStats(currentFilteredData);
        const sweetSpotPrice = 40000; 

        const allBatteryTypes = [...new Set(evData.map(d => d.Battery_Type))].sort();
        const selectElement = d3.select("#batteryTypeSelect");
        if (selectElement.selectAll("option:not([value='all'])").empty()) {
             allBatteryTypes.forEach(type => {
                selectElement.append("option")
                    .attr("value", type)
                    .text(type);
            });
        }
        
        const svg = container.append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .attr("class", "vis-svg");
            
        const chartGroup = svg.append("g")
            .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
            
        const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
        const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

        const xBoxCenter = innerWidth / 2 + 100;
        const xJitterCenter = innerWidth / 2 - 100;
        const boxWidth = 50;
        const jitterWidth = 100;

        const y = d3.scaleLinear()
            .domain([0, max * 1.05])
            .nice()
            .range([innerHeight, 0]);

        chartGroup.append("g")
            .attr("class", "y-axis axis")
            .call(d3.axisLeft(y).ticks(8, "$,f").tickFormat(d3.format("$,.0f")));
            
        chartGroup.append("text")
            .attr("class", "y-label")
            .attr("x", -innerHeight / 2)
            .attr("y", -MARGIN.left / 2)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("EV Price (USD)");

        const boxGroup = chartGroup.append("g").attr("class", "box-group");
        
        const jitterGroup = chartGroup.append("g").attr("class", "jitter-group");
        const sweetSpotGroup = chartGroup.append("g").attr("class", "sweet-spot-group");
        
        sweetSpotGroup.append("line")
            .attr("class", "sweet-spot-line")
            .attr("x1", 0).attr("x2", innerWidth) 
            .attr("y1", y(sweetSpotPrice)).attr("y2", y(sweetSpotPrice))
            .attr("stroke", COLORS.HIGHLIGHT).attr("stroke-width", 3).attr("stroke-dasharray", "5,5");

        sweetSpotGroup.append("text")
            .attr("class", "sweet-spot-label")
            .attr("x", innerWidth + 10) 
            .attr("y", y(sweetSpotPrice))
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "central")
            .style("font-weight", "bold")
            .style("fill", COLORS.HIGHLIGHT)
            .text(`The $${d3.format(",")(sweetSpotPrice)} Sweet Spot`);
            
        const jitter = d3.randomUniform(-jitterWidth / 2, jitterWidth / 2);
        
        sweetSpotGroup.on("mouseover", () => {
            const currentPoints = jitterGroup.selectAll(".price-point");

            currentPoints.transition().duration(300)
                .attr("opacity", d => d.Price_USD <= sweetSpotPrice ? 1 : 0.1)
                .attr("r", d => d.Price_USD <= sweetSpotPrice ? 5 : 2)
                .attr("fill", d => d.Price_USD <= sweetSpotPrice ? COLORS.BRIGHT_BLUE : '#ccc')
                .filter(d => d.Price_USD <= sweetSpotPrice).raise();
        })
        .on("mouseout", () => {
            const currentPoints = jitterGroup.selectAll(".price-point");
            
            currentPoints.transition().duration(300)
                .attr("r", 4)
                .attr("fill", COLORS.EV_COLOR)
                .attr("opacity", 0.5);
        });


        function updateVisualization(data) {
            const { prices, q1, median, q3, min, max } = getBoxPlotStats(data);
            
            boxGroup.selectAll("*").remove();
            boxGroup.append("line").attr("class", "box-whisker-line")
                .attr("x1", xBoxCenter).attr("x2", xBoxCenter)
                .attr("y1", y(min)).attr("y2", y(max));

            boxGroup.append("rect").attr("class", "box-rect")
                .attr("x", xBoxCenter - boxWidth / 2)
                .attr("y", y(q3))
                .attr("width", boxWidth)
                .attr("height", y(q1) - y(q3))
                .attr("fill", COLORS.DUSTY_PURPLE)
                .attr("opacity", 0.8)
                .attr("stroke", COLORS.TEXT_DARK);

            boxGroup.append("line").attr("class", "box-median-line")
                .attr("x1", xBoxCenter - boxWidth / 2).attr("x2", xBoxCenter + boxWidth / 2)
                .attr("y1", y(median)).attr("y2", y(median))
                .attr("stroke", COLORS.HIGHLIGHT).attr("stroke-width", 3);

            boxGroup.append("line").attr("class", "box-cap-line")
                .attr("x1", xBoxCenter - boxWidth / 4).attr("x2", xBoxCenter + boxWidth / 4)
                .attr("y1", y(min)).attr("y2", y(min));
            boxGroup.append("line").attr("class", "box-cap-line")
                .attr("x1", xBoxCenter - boxWidth / 4).attr("x2", xBoxCenter + boxWidth / 4)
                .attr("y1", y(max)).attr("y2", y(max));

            const annotations = [
                { value: max, label: `Max: $${d3.format(",")(max)}` },
                { value: q3, label: `Q3: $${d3.format(",")(q3)}` },
                { value: median, label: `Median: $${d3.format(",")(median)}`, color: COLORS.HIGHLIGHT },
                { value: q1, label: `Q1: $${d3.format(",")(q1)}` },
                { value: min, label: `Min: $${d3.format(",")(min)}` },
            ];
            
            boxGroup.selectAll(".box-annotation")
                .data(annotations)
                .enter().append("text")
                .attr("class", "box-annotation")
                .attr("x", xBoxCenter + boxWidth / 2 + 10)
                .attr("y", d => y(d.value))
                .attr("text-anchor", "start")
                .attr("dominant-baseline", "central")
                .style("font-size", "0.9em")
                .style("font-weight", d => d.color ? "bold" : "normal")
                .style("fill", d => d.color || COLORS.TEXT_DARK)
                .text(d => d.label);

            const points = jitterGroup.selectAll(".price-point")
                .data(data, d => `${d.Model}-${d.Manufacturer}`);
                
            points.exit().transition().duration(500).attr("r", 0).remove();
            
            points.enter().append("circle")
                .attr("class", "price-point")
                .attr("cx", d => xJitterCenter + jitter(d))
                .attr("cy", d => y(d.Price_USD))
                .attr("r", 4)
                .attr("fill", COLORS.EV_COLOR)
                .attr("opacity", 0)
                .on("mouseover", handlePriceOver)
                .on("mouseout", handlePriceOut)
                .merge(points)
                .transition().duration(800)
                .attr("cx", d => xJitterCenter + jitter(d))
                .attr("cy", d => y(d.Price_USD))
                .attr("r", 4)
                .attr("fill", COLORS.EV_COLOR)
                .attr("opacity", 0.5);
                
            function handlePriceOver(event, d) {
                d3.select(this).attr("r", 6).attr("opacity", 1).style("stroke", COLORS.HIGHLIGHT).style("stroke-width", 2).raise();
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`
                    <strong>${d.Manufacturer} ${d.Model}</strong><br/>
                    Price: ${d3.format("$,.0f")(d.Price_USD)}<br/>
                    Battery: ${d.Battery_Type}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }

            function handlePriceOut() {
                d3.select(this).attr("r", 4).attr("opacity", 0.5).style("stroke", "none");
                tooltip.transition().duration(500).style("opacity", 0);
            }
            
            const priceSlider = d3.select("#priceRangeSlider");
            const priceValueSpan = d3.select("#priceRangeValue");
            
            priceSlider.property("max", max).property("value", max); 
            priceValueSpan.text(d3.format("$,.0f")(max));

            priceSlider.on("input", function() {
                const maxPrice = +this.value;
                priceValueSpan.text(d3.format("$,.0f")(maxPrice));
                
                const currentPoints = jitterGroup.selectAll(".price-point");
                
                currentPoints.transition().duration(200)
                    .attr("opacity", d => d.Price_USD <= maxPrice ? 0.8 : 0.1)
                    .attr("r", d => d.Price_USD <= maxPrice ? 5 : 2)
                    .filter(d => d.Price_USD <= maxPrice).raise();
            });
            
        }

        function filterByBatteryType(selectedType) {
            currentFilteredData = evData.filter(d => selectedType === 'all' || d.Battery_Type === selectedType);
            updateVisualization(currentFilteredData);
            d3.select("#priceRangeSlider").dispatch("input");
        }
        
        selectElement.on("change", function() {
            filterByBatteryType(this.value);
            tooltip.transition().duration(500).style("opacity", 0);
        });
        
        updateVisualization(currentFilteredData);

        svg.append("text")
            .attr("x", innerWidth / 2 + MARGIN.left)
            .attr("y", MARGIN.top / 2 - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "1.8em")
            .style("font-family", "var(--font-whimsical)")
            .text("Chapter 6: EVs for Everyone (Price & Accessibility)");
    }
    loadData().then(() => {
        drawAdoptionStreamgraph(); 
    });
});