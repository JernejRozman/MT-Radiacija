// Funkcija za pridobivanje podatkov iz API-ja
async function fetchData() {
    document.getElementById("loading-text").style.display = "block";
    document.getElementById("loading-text").innerText = "Nalaganje podatkov...";

    try {
        // Pošlji zahtevek na API za agregacijo
        const response = await fetch('http://localhost:8080/api/total_count');
        const data = await response.json();
        document.getElementById("loading-text").style.display = "none";

        // Preveri, ali je prišlo do napake
        if (data.error) {
            throw new Error(data.error);
        }

        // Ustvari vizualizacijo kroga s pomočjo D3.js
        createCircleVisualization(data.total_count);
    } catch (error) {
        document.getElementById("loading-text").innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}

// Funkcija za ustvarjanje vizualizacije kroga
function createCircleVisualization(totalCount) {
    // Počisti obstoječo vizualizacijo
    d3.select("#visualization").html("");

    const width = 500;
    const height = 300;
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1000]);
    const radius = Math.min(100, totalCount / 10);

    // Ustvari SVG platno
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Dodaj krog, ki predstavlja skupno število dokumentov
    svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", 0)
        .attr("fill", colorScale(totalCount))
        .transition()
        .duration(1000)
        .attr("r", radius);

    // Dodaj besedilo v sredino kroga
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("font-size", "2rem")
        .attr("fill", "#333")
        .text(totalCount);
}
