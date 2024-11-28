// JavaScript del
async function fetchAvgResultByJob() {
    const loadingText = document.getElementById("loading-text");
    const visualization = d3.select("#visualization");

    // Prikažemo sporočilo o nalaganju
    loadingText.style.display = "block";
    loadingText.innerText = "Nalaganje podatkov...";

    try {
        // Pridobimo podatke iz API-ja
        const response = await fetch(`http://localhost:8080/api/avg_result_by_job`);
        const data = await response.json();

        // Skrijemo sporočilo o nalaganju
        loadingText.style.display = "none";

        // Uredimo podatke po padajočem vrstnem redu povprečnega rezultata
        data.sort((a, b) => b.povprecni_rezultat - a.povprecni_rezultat);

        // Renderiramo stolpični diagram
        renderBarChart(data);

    } catch (error) {
        // Prikažemo sporočilo o napaki
        loadingText.innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}

function renderBarChart(data) {
    // Počisti obstoječo vizualizacijo
    d3.select("#visualization").html("");

    const width = 800;
    const height = 500;
    const margin = { top: 50, right: 30, bottom: 150, left: 70 };

    // Ustvari skale
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.delovno_mesto))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.povprecni_rezultat)]).nice()
        .range([height - margin.bottom, margin.top]);

    // Ustvari SVG element
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Skupina za stolpce
    const barsGroup = svg.append("g")
        .attr("class", "bars");

    // Os X
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .attr("class", "x-axis")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "12px");

    // Os Y
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "12px");

    // Dodaj stolpce
    barsGroup.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.delovno_mesto))
        .attr("width", xScale.bandwidth())
        .attr("y", d => yScale(d.povprecni_rezultat))
        .attr("height", d => height - margin.bottom - yScale(d.povprecni_rezultat))
        .attr("fill", "#69b3a2")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "#ff7f0e"); // Sprememba barve ob hover
        })
        .on("mouseout", function(event, d) {
            d3.select(this).attr("fill", "#69b3a2"); // Vrnitev na originalno barvo
        });

    // Dodaj vrednosti nad stolpci
    barsGroup.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.delovno_mesto) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.povprecni_rezultat) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .style("font-size", "12px")
        .text(d => d.povprecni_rezultat.toFixed(2));
}

// Ob nalaganju strani pokličemo funkcijo
fetchAvgResultByJob();
