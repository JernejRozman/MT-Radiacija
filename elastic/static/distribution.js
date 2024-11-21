// distribution.js

// Function to fetch distribution data and render the histogram
function fetchDistribution() {
    // Display loading text
    d3.select("#loading-text").text("Nalaganje podatkov...");

    // Fetch data from the API
    fetch('/api/distribution')
        .then(response => response.json())
        .then(data => {
            // Clear any existing visualization
            d3.select("#visualization").selectAll("*").remove();

            // Set dimensions and margins
            const margin = { top: 20, right: 30, bottom: 40, left: 40 },
                width = 800 - margin.left - margin.right,
                height = 600 - margin.top - margin.bottom;

            // Append SVG element
            const svg = d3.select("#visualization")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Set x and y scales
            const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.rezultat)])
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.count)])
                .range([height, 0]);

            // Add x-axis
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            // Add y-axis
            svg.append("g")
                .call(d3.axisLeft(y));

            // Add bars
            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.rezultat))
                .attr("y", d => y(d.count))
                .attr("width", x(1) - x(0) - 1) // Adjust bar width
                .attr("height", d => height - y(d.count))
                .attr("fill", "steelblue");

            // Remove loading text
            d3.select("#loading-text").text("");
        })
        .catch(error => {
            console.error('Napaka pri pridobivanju podatkov:', error);
            d3.select("#loading-text").text("Napaka pri nalaganju podatkov.");
        });
}

// Attach the function to the button click event
document.getElementById('button3').addEventListener('click', fetchDistribution);
