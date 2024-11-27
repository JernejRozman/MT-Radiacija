async function fetchExposure() {
    document.getElementById("loading-text").style.display = "block";
    document.getElementById("loading-text").innerText = "Nalaganje podatkov...";

    try {
        // Pošlji zahtevek na API za povprečne meritve
        const response = await fetch('http://localhost:8080/api/exposure_by_person');
        const data = await response.json();
        document.getElementById("loading-text").style.display = "none";
        
        // Preveri, ali je prišlo do napake
        if (data.error) {
            throw new Error(data.error);
        }

        // Nariši scatter plot z D3.js
        createScatterPlot(data); // Omeji na prve 3 osebe
        console.log(data);
        
    } catch (error) {
        document.getElementById("loading-text").innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}

function createScatterPlot(data) {
    // Dimenzije grafa
    const margin = { top: 10, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Počisti prejšnji graf (če obstaja)
    d3.select("#my_dataviz").select("svg").remove();

    // Pripravi SVG prostor
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Pripravi podatke za graf
    const xData = data.map((d, i) => i + 1); // Številka osebe na X-osi
    const yData = data.map(d => d.average_exposure);

    // Nastavi skale
    const x = d3.scaleLinear()
        .domain([0, d3.max(xData)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(yData)])
        .range([height, 0]);

    // Dodaj osi
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(data.length))
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom - 10)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Številka osebe");

    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Povprečna izpostavljenost");

    // Dodaj pikice
    svg.append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => x(i + 1)) // Številka osebe
        .attr("cy", d => y(d.average_exposure)) // Povprečna izpostavljenost
        .attr("r", 5)
        .style("fill", "#69b3a2")
        .style("opacity", 0.8);
}
