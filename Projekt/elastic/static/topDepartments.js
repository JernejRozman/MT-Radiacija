async function fetchTopDepartments() {
    const loadingText = document.getElementById("loading-text");
    const visualization = d3.select("#visualization");

    // Display loading message
    loadingText.style.display = "block";
    loadingText.innerText = "Nalaganje podatkov...";

    // Get the value of N from the input field
    const nInput = document.getElementById("top-n");
    const n = nInput ? parseInt(nInput.value) || 5 : 5; // Default to 5 if no input

    try {
        // Fetch data from the API
        const response = await fetch(`http://localhost:8080/api/top_depts`);
        const data = await response.json();

        // Clear the loading message
        loadingText.style.display = "none";

        // Extract top departments
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

    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 100, left: 70 };

    // Create scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.department))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total_radiation)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Create SVG
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Draw bars with random colors
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.department))
        .attr("y", d => yScale(d.total_radiation))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - margin.bottom - yScale(d.total_radiation))
        
        .attr("fill", () => `#${Math.floor(Math.random() * 16777215).toString(16)}`);
       // .attr("fill", d => nameToColor(d.department));

    // Add x-axis with tilted labels
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "7px"); // Smaller font for readability

    // Add y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll("text")
        .style("font-size", "12px");

    // Add labels above bars
    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.department) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.total_radiation) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .style("font-size", "12px")
        .text(d => d.total_radiation.toFixed(2));
}
