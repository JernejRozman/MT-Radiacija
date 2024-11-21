// Funkcija za pridobivanje podatkov za Top 5 meritve
async function fetchTopFive() {
    document.getElementById("loading-text").style.display = "block";
    document.getElementById("loading-text").innerText = "Nalaganje podatkov...";

    try {
        // Pošlji zahtevek na API za agregacijo
        const response = await fetch('http://localhost:8080/api/top_five');
        const data = await response.json();
        document.getElementById("loading-text").style.display = "none";

        // Preveri, ali je prišlo do napake
        if (data.error) {
            throw new Error(data.error);
        }

        // Ustvari bar chart z D3.js
        createBarChart(data.top_five);
    } catch (error) {
        document.getElementById("loading-text").innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}

// Funkcija za ustvarjanje bar charta
function createBarChart(data) {
    // Počisti obstoječo vizualizacijo
    d3.select("#visualization").html("");

    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    // Ustvari SVG platno
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Nastavi lestvici za x in y os
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.key))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.doc_count)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Ustvari x os
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Ustvari y os
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    // Ustvari stolpce
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.key))
        .attr("y", d => yScale(d.doc_count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - margin.bottom - yScale(d.doc_count))
        .attr("fill", "#69b3a2");

    // Dodaj besedilo z vrednostmi na vrh stolpcev
    svg.selectAll(".text")
        .data(data)
        .enter()
        .append("text")
        .attr("x", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.doc_count) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text(d => d.doc_count);
}