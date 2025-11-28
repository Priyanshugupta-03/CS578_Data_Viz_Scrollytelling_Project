// --- D3 Visualization and Scroll Handler Logic ---

// Global D3 variables
let svg, height, width;
let y, evCar, iceCar, scaleMetricTitle, evDataLabel, iceDataLabel, evPath, icePath, evScaleLine, iceScaleLine;
let col1_base_x, col2_base_x, scale_x; // Base X coordinates
let currentEvX, currentIceX; // Dynamic X coordinates

// Data structure holding normalized car positions (0.0 to 1.0) and the metric title for each step.
// The scale runs from bottom (0.0 - Worst) to top (1.0 - Best/Most Efficient).
// xOffset is 0 for linear movement.
const stepsData = [
    // Step 0: Initial position
    { evPos: 0.1, icePos: 0.1, metric: "Environmental Impact", evValue: "Start", iceValue: "Start", xOffset: 0 },
    
    // Step 1: Manufacturing Emissions (Lower on scale = Worse for environment)
    { evPos: 0.3, icePos: 0.6, metric: "Manufacturing $\\text{CO}_2$ per vehicle", evValue: "12 tons", iceValue: "6 tons", xOffset: 0 },
    
    // Step 2: Operational Efficiency (Higher on scale = Better/More Efficient)
    { evPos: 0.9, icePos: 0.5, metric: "Operational Efficiency (MPG/MPGe)", evValue: "110 MPGe", iceValue: "30 MPG", xOffset: 0 },
    
    // Step 3: Total Lifecycle (Lower on scale = Worse for environment)
    { evPos: 0.6, icePos: 0.4, metric: "Total $\\text{CO}_2$ Emissions per km", evValue: "150 g/km", iceValue: "200 g/km", xOffset: 0 },

    // Step 4: Conclusion (Normalized to the final impact)
    { evPos: 0.7, icePos: 0.3, metric: "Long-Term Environmental Score", evValue: "Good", iceValue: "Poor", xOffset: 0 }
];

const margin = { top: 100, right: 20, bottom: 50, left: 20 };
const pathDataHistory = { ev: [], ice: [] };

/**
 * Initializes the SVG and all fixed D3 elements (scale, labels, etc.).
 */
function initializeVisualization() {
    // 1. Setup dimensions and clear previous SVG
    const graphicContainer = d3.select("#graphic");
    width = graphicContainer.node().clientWidth;
    height = graphicContainer.node().clientHeight;

    graphicContainer.select("svg").remove(); // Clear existing SVG on resize

    svg = graphicContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // 2. Define the vertical Y scale
    y = d3.scaleLinear() 
        .domain([0, 1]) // Data domain (0.0 = worst/bottom, 1.0 = best/top)
        .range([height - margin.bottom, margin.top]); // Pixel range

    // 3. Define the Base X coordinates
    scale_x = width / 2;
    const offset = 100;
    col1_base_x = scale_x - offset; // EV Car Position (Left Base)
    col2_base_x = scale_x + offset; // ICE Car Position (Right Base)

    // Reset path history for resize
    pathDataHistory.ev = [];
    pathDataHistory.ice = [];

    // 4. Create the central vertical scale line
    svg.append("line")
        .attr("class", "scale-line")
        .attr("x1", scale_x)
        .attr("y1", y(0))
        .attr("x2", scale_x)
        .attr("y2", y(1));

    // 5. Create fixed scale labels
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("x", scale_x)
        .attr("y", y(1) - 15)
        .text("Better / More Efficient");

    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("x", scale_x)
        .attr("y", y(0) + 15)
        .text("Worse / Less Efficient");

    // 6. Create Metric Title (Dynamic text element)
    scaleMetricTitle = svg.append("text")
        .attr("class", "metric-title")
        .attr("x", scale_x)
        .attr("y", margin.top / 2)
        .text(stepsData[0].metric);

    // Calculate initial dynamic X positions
    const initialData = stepsData[0];
    currentEvX = col1_base_x + initialData.xOffset;
    currentIceX = col2_base_x + initialData.xOffset;
    
    // Initialize history with step 0 data
    pathDataHistory.ev.push({ x: currentEvX, y: y(initialData.evPos) });
    pathDataHistory.ice.push({ x: currentIceX, y: y(initialData.icePos) });

    // 7. Create Car Icon Paths (The Track)
    const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveLinear);

    evPath = svg.append("path")
        .attr("class", "path-line ev-path")
        .attr("d", lineGenerator(pathDataHistory.ev));

    icePath = svg.append("path")
        .attr("class", "path-line ice-path")
        .attr("d", lineGenerator(pathDataHistory.ice));
        
    // 8. Create Car Icons (The main moving elements)
    // Using Checkered Flag icon (&#xf11e;) 
    const carIconHtml = "&#xf11e;"; 
    
    evCar = svg.append("text")
        .attr("class", "car-icon ev-car")
        .attr("text-anchor", "middle")
        .html(carIconHtml) 
        .attr("transform", `translate(${currentEvX}, ${y(initialData.evPos)})`);

    iceCar = svg.append("text")
        .attr("class", "car-icon ice-car")
        .attr("text-anchor", "middle")
        .html(carIconHtml) 
        .attr("transform", `translate(${currentIceX}, ${y(initialData.icePos)})`);

    // 9. Create Data Labels for current position
    evDataLabel = svg.append("text")
        .attr("class", "data-label-text ev-car")
        .attr("text-anchor", "end")
        .attr("x", currentEvX - 10)
        .attr("y", y(initialData.evPos) - 30)
        .text(initialData.evValue);

    iceDataLabel = svg.append("text")
        .attr("class", "data-label-text ice-car")
        .attr("text-anchor", "start")
        .attr("x", currentIceX + 10)
        .attr("y", y(initialData.evPos) - 30)
        .text(initialData.iceValue);

    // 10. Create small lines connecting car to scale
    evScaleLine = svg.append("line")
        .attr("class", "scale-connector-line")
        .attr("stroke", "rgba(16, 185, 129, 0.4)")
        .attr("stroke-dasharray", "5,5")
        .attr("x1", currentEvX)
        .attr("y1", y(initialData.evPos))
        .attr("x2", scale_x)
        .attr("y2", y(initialData.evPos));

    iceScaleLine = svg.append("line")
        .attr("class", "scale-connector-line")
        .attr("stroke", "rgba(249, 115, 22, 0.4)")
        .attr("stroke-dasharray", "5,5")
        .attr("x1", currentIceX)
        .attr("y1", y(initialData.icePos))
        .attr("x2", scale_x)
        .attr("y2", y(initialData.icePos));
}

/**
 * Updates the visualization based on the currently active step.
 * @param {number} stepIndex - The index of the current step (0 to stepsData.length - 1).
 */
function updateVisualization(stepIndex) {
    const data = stepsData[stepIndex];

    // Calculate new dynamic X positions 
    const newEvX = col1_base_x + data.xOffset;
    const newIceX = col2_base_x + data.xOffset;

    // 1. Update the Metric Title
    scaleMetricTitle.text(data.metric);

    // 2. Animate Car Movement (and Data Label positioning)
    evCar.transition()
        .duration(800)
        .attr("transform", `translate(${newEvX}, ${y(data.evPos)})`);

    iceCar.transition()
        .duration(800)
        .attr("transform", `translate(${newIceX}, ${y(data.icePos)})`);

    // 3. Update Data Labels and Connector Lines (similar to car movement)
    evDataLabel.transition()
        .duration(800)
        .attr("x", newEvX - 10)
        .attr("y", y(data.evPos) - 30)
        .text(data.evValue);

    iceDataLabel.transition()
        .duration(800)
        .attr("x", newIceX + 10)
        .attr("y", y(data.icePos) - 30)
        .text(data.iceValue);

    evScaleLine.transition()
        .duration(800)
        .attr("x1", newEvX)
        .attr("y1", y(data.evPos))
        .attr("y2", y(data.evPos));

    iceScaleLine.transition()
        .duration(800)
        .attr("x1", newIceX)
        .attr("y1", y(data.icePos))
        .attr("y2", y(data.icePos));


    // 4. Update Path History (Draw the track up to the current step)
    
    // Clear the history and rebuild it ONLY up to the current stepIndex.
    pathDataHistory.ev = [];
    pathDataHistory.ice = [];

    for (let i = 0; i <= stepIndex; i++) {
        const step = stepsData[i];
        const stepEvX = col1_base_x + step.xOffset;
        const stepIceX = col2_base_x + step.xOffset;

        pathDataHistory.ev.push({ x: stepEvX, y: y(step.evPos) });
        pathDataHistory.ice.push({ x: stepIceX, y: y(step.icePos) });
    }
    
    // Line generator for the paths
    const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveLinear); // Straight, linear path

    // Render the new path
    evPath.transition()
        .duration(800)
        .attr("d", lineGenerator(pathDataHistory.ev));

    icePath.transition()
        .duration(800)
        .attr("d", lineGenerator(pathDataHistory.ice));
}


/**
 * Sets up the Intersection Observer to handle scrolling logic.
 */
function setupScrollHandler() {
    // Select all step elements
    const sectionsContainer = document.getElementById('sections');
    const steps = d3.selectAll(".step").nodes();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const stepElement = d3.select(entry.target);
            const stepIndex = parseInt(stepElement.attr("data-step"));

            // Check if the element is actively intersecting (near the center of the viewport)
            if (entry.isIntersecting) {
                // Remove 'is-active' from all steps
                d3.selectAll(".step").classed("is-active", false);

                // Add 'is-active' to the current step
                stepElement.classed("is-active", true);

                // Update the visualization
                updateVisualization(stepIndex);
            }
        });
    }, {
        // Detect when the step is roughly in the middle 50% of the viewport (vertical center)
        rootMargin: `0px 0px -50% 0px`, 
        threshold: 0 
    });

    // Attach the observer to each step
    steps.forEach(step => observer.observe(step));

    // Set the initial state (Step 0) on load
    d3.select('.step[data-step="0"]').classed("is-active", true);
    updateVisualization(0);
}

// --- Execution and Story Toggle ---

/**
 * Handles the logic for switching between 'balanced' and 'critical' story modes.
 */
function updateStory(story) {
    const sections = document.getElementById('sections');
    const balancedBtn = document.getElementById('balanced-btn');
    const criticalBtn = document.getElementById('critical-btn');

    // Update button styling
    balancedBtn.className = 'flex-1 py-2 px-4 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ' + 
        (story === 'balanced' ? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400 shadow-md' : 'bg-gray-600 text-gray-200 hover:bg-gray-700 focus:ring-gray-400 border border-gray-500');
    
    criticalBtn.className = 'flex-1 py-2 px-4 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ' + 
        (story === 'critical' ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 focus:ring-offset-2 shadow-md' : 'bg-gray-600 text-gray-200 hover:bg-gray-700 focus:ring-gray-400 border border-gray-500');

    // Toggle visibility of narrative sections
    sections.querySelectorAll('[data-story]').forEach(el => {
        if (el.getAttribute('data-story') === story) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
    
    // Reset scroll and visualization to step 0
    sections.scrollTo({ top: 0, behavior: 'smooth' }); // Smoothly scroll to top
    
    d3.selectAll(".step").classed("is-active", false);
    d3.select(`[data-story="${story}"] .step[data-step="0"]`).classed("is-active", true);
    initializeVisualization(); // Re-initialize the history when changing stories
    updateVisualization(0);
}


// 1. Initialize the visualization and setup the story toggle on load
window.onload = function() {
    initializeVisualization();
    setupScrollHandler();
    
    // Set initial story state and attach listeners
    updateStory('balanced'); // Default story view
    document.getElementById('balanced-btn').addEventListener('click', () => updateStory('balanced'));
    document.getElementById('critical-btn').addEventListener('click', () => updateStory('critical'));
};

// 2. Handle Resize
window.addEventListener('resize', () => {
    // Debounce the resize handler for performance
    if (window.resizeTimer) clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        // Find the currently active step index
        const activeStepElement = d3.select(".step.is-active").node();
        const activeStepIndex = activeStepElement ? parseInt(activeStepElement.dataset.step) : 0;
        
        // Re-initialize and re-render the visualization on resize
        initializeVisualization();

        // Since updateVisualization already rebuilds the path, we just call it.
        updateVisualization(activeStepIndex);

    }, 250); // 250ms debounce time
});