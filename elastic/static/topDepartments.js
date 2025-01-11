async function fetchTopDepartments() {
    const loadingText = document.getElementById("loading-text");

    // Display loading message
    loadingText.style.display = "block";
    loadingText.innerText = "Nalaganje podatkov...";

    try {
        // Fetch data from the API
        const response = await fetch(`http://localhost:8080/api/top_depts`);
        const data = await response.json();

        // Get the total number of departments
        const totalDepartments = data.sum_by_depts.length;

        // Set the input field value to the total number of departments (or the current value if it's smaller)
        const nInput = document.getElementById("top-n");
        nInput.max = totalDepartments; // Set the maximum possible value to total departments
        nInput.value = nInput.value > totalDepartments ? totalDepartments : nInput.value; // Ensure the value is within range

        // Get the value of N from the input field (default to the maximum departments if no value)
        const n = parseInt(nInput.value) || totalDepartments; // Default to the total departments if no input

        // Clear the loading message
        loadingText.style.display = "none";

        // Extract the top departments based on the user's input (n)
        const topDepartments = data.sum_by_depts.slice(0, n).map(dept => ({
            department: dept.key,
            total_radiation: dept.total_radiation.value
        }));

        // Render the bar chart
        renderBarChart(topDepartments);

    } catch (error) {
        // Display error message
        loadingText.innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}



function renderBarChart(data) {
    // Clear the existing visualization
    d3.select("#visualization").html("");

    const container = document.getElementById("visualization");
    const width = container.clientWidth; // Get the dynamic width
    const height = 500; // Set the desired height
    const margin = { top: 20, right: 30, bottom: 90, left: 70 };

    // Create scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.department))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total_radiation)]).nice()
        .range([height - margin.bottom, margin.top]);

    // Create SVG
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", "100%") // Ensure SVG spans the container's width
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMinYMin meet"); // Ensure aspect ratio is maintained

    // Add a tooltip for hover
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "#fff")
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("display", "none")
        .style("pointer-events", "none");

    // Draw bars with animations
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.department))
        .attr("y", height - margin.bottom) // Start from bottom
        .attr("width", xScale.bandwidth())
        .attr("height", 0) // Start with height 0
        .attr("fill", () => `#${Math.floor(Math.random() * 16777215).toString(16)}`)
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`<strong>${d.department}</strong><br>Total Radiation: ${d.total_radiation.toFixed(2)}`);
        })
        .on("mousemove", event => {
            tooltip.style("top", `${event.pageY - 40}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        })
        .transition() // Add animation
        .duration(1000) // Duration in milliseconds
        .attr("y", d => yScale(d.total_radiation))
        .attr("height", d => height - margin.bottom - yScale(d.total_radiation));

    // Add X-axis with tilted labels
    const nInput = document.getElementById("top-n");
    const n = parseInt(nInput.value) || 5; // Default to 5 if no value

    // Create the X axis without text labels
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    // Manually add labels if the number of departments is less than 20
    if (n < 20) {
        xAxis.selectAll("text")
            .style("font-size", function(d) {
                // Check if the label is longer than 16 characters
                return d.length > 16 ? "5px" : "10px"; // Reduce font size if label is too long
            })
            .attr("transform", "rotate(-45)") // Rotate the X axis labels
            .style("text-anchor", "end"); // Make the text align to the end
    } else {
        // If nInput is greater than or equal to 20, hide labels on the x-axis
        xAxis.selectAll("text").style("display", "none");
    }

    // Add dynamic labels with animation (values over the bars)
    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.department) + xScale.bandwidth() / 2)
        .attr("y", height - margin.bottom) // Start at bottom
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .style("font-size", "10px")
        .text(d => d.total_radiation.toFixed(2))
        .transition()
        .duration(1000) // Match bar animation
        .attr("y", d => yScale(d.total_radiation) - 5);


}
