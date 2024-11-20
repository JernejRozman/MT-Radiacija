// Funkcija za pridobivanje podatkov za povprečne meritve
async function fetchAverages() {
    document.getElementById("loading-text").style.display = "block";
    document.getElementById("loading-text").innerText = "Nalaganje podatkov...";

    try {
        // Pošlji zahtevek na API za povprečne meritve
        const response = await fetch('http://localhost:8080/api/average_workplace');
        const data = await response.json();
        document.getElementById("loading-text").style.display = "none";

        // Preveri, ali je prišlo do napake
        if (data.error) {
            throw new Error(data.error);
        }

        // Ustvari bar chart z D3.js
        createBarChart(data.averages);
    } catch (error) {
        document.getElementById("loading-text").innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}


function createBarChart(data) {
    // Počisti obstoječo vizualizacijo
    d3.select("#visualization").html("");

    const width = 640;
    const height = 400;
    const marginTop = 20;
    const marginRight = 0;
    const marginBottom = 30;
    const marginLeft = 40;

    // Convert data to an array of objects with 'workplace' and 'average' properties
    const chartData = Object.keys(data).map(workplace => ({
        workplace: workplace,
        average: data[workplace]
    }));

    // Declare the x (horizontal position) scale and the corresponding axis generator.
    const x = d3.scaleBand()
        .domain(chartData.map(d => d.workplace))
        .range([marginLeft, width - marginRight])
        .padding(0.1);

    const xAxis = d3.axisBottom(x).tickSizeOuter(0);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.average)]).nice()
        .range([height - marginBottom, marginTop]);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("style", `max-width: ${width}px; height: auto; font: 10px sans-serif; overflow: visible;`);

    // Create a bar for each workplace.
    const bar = svg.append("g")
        .attr("fill", "steelblue")
        .selectAll("rect")
        .data(chartData)
        .join("rect")
        .style("mix-blend-mode", "multiply") // Darker color when bars overlap during the transition.
        .attr("x", d => x(d.workplace))
        .attr("y", d => y(d.average))
        .attr("height", d => y(0) - y(d.average))
        .attr("width", x.bandwidth());

    // Create the axes.
    const gx = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis);

    const gy = svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).tickFormat((y) => (y).toFixed(4))) // Show 4 decimal places
        .call(g => g.select(".domain").remove());

        gx.selectAll("text")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "end");

    // Append the SVG to the DOM.
    document.getElementById("visualization").appendChild(svg.node());
}
