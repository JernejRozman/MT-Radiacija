async function fetchAndRenderBubbleChart() {
    const loadingText = document.getElementById("loading-text");
    const visualization = d3.select("#visualization");

    // Display loading message
    loadingText.style.display = "block";
    loadingText.innerText = "Nalaganje podatkov...";

    try {
        // Fetch data from the API
        const response = await fetch("http://localhost:8080/api/avg_dept_bubble");

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Clear the loading message
        loadingText.style.display = "none";

        // Process data for visualization
        const processedData = data.sum_by_depts
            .filter(d => d.doc_count > 0) // Exclude departments with zero counts
            .filter(d => d.department !== "TURIZEM") // Exclude "Turizem"
            .map(d => ({
                id: d.department,
                value: d.total_radiation / d.doc_count, // Average radiation
                totalRadiation: d.total_radiation,
                docCount: d.doc_count,
            }));

        if (processedData.length === 0) {
            throw new Error("No valid data available for visualization.");
        }

        // Render the bubble chart
        renderBubbleChart(processedData);
    } catch (error) {
        // Display error message
        loadingText.style.color = "red";
        loadingText.innerText = `Napaka pri pridobivanju podatkov: ${error.message}`;
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}

function renderBubbleChart(data) {
    // Clear existing visualization
    d3.select("#visualization").html("");

    const width = 800;
    const height = 800;
    const margin = 5;

    // Create pack layout
    const pack = d3.pack()
        .size([width - margin * 2, height - margin * 2])
        .padding(5);

    // Create hierarchy and compute layout
    const root = pack(
        d3.hierarchy({ children: data })
            .sum(d => d.value) // Use average radiation as size
    );

    // Create SVG container
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-margin, -margin, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
        .attr("text-anchor", "middle");

    // Add nodes for each department
    const node = svg.append("g")
        .selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Add circles with random colors
    node.append("circle")
        .attr("r", d => d.r)
        .attr("fill", () => `#${Math.floor(Math.random() * 16777215).toString(16)}`) // Random color
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("fill-opacity", 0.8);

    // Add tooltip on hover
    node.append("title")
        .text(
            d =>
                `${d.data.id}\nPovprečno sevanje: ${d.data.value.toFixed(
                    2
                )}\nSkupno sevanje: ${d.data.totalRadiation.toFixed(
                    2
                )}\nŠtevilo meritev: ${d.data.docCount}`
        );

    // Add labels to bubbles
    node.append("text")
        .attr("dy", "0.3em")
        .attr("font-size", d => Math.min(12, d.r / 3)) // Adjust font size based on radius
        .text(d => d.data.id)
        .style("pointer-events", "none") // Ensure text doesn't block hover events
        .style("fill", "black");
}

// Call the function to fetch and render
fetchAndRenderBubbleChart();
