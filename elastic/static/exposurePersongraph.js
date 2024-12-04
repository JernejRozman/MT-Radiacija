async function fetchExposure() {
    document.getElementById("loading-text").style.display = "block";
    document.getElementById("loading-text").innerText = "Nalaganje podatkov...";
    try {
        const response = await fetch('http://localhost:8080/api/exposure_by_person');
        const data = await response.json();

        document.getElementById("loading-text").style.display = "none";

        createScatterPlot(data); 
    } catch (error) {
        document.getElementById("loading-text").innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}
function createScatterPlot(data) {
    d3.select("#visualization").html("");

    const margin = { top: 10, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xData = data.map((d, i) => i + 1); // Številka osebe na X-osi
    const yData = data.map(d => d.average_exposure);

    let nonDisplayedCompanies = [];

    const x = d3.scaleLinear()
        .domain([0, d3.max(xData)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(yData)])
        .range([height, 0]);

    // Dodaj osi
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(0))
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom - 10)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Osebe");

    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Povprečna izpostavljenost");

    // Tooltip za prikaz informacij
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 2px 10px rgba(0, 0, 0, 0.1)");

    svg.append("g")
        .selectAll("path")
        .data(data)
        .enter()
        .append("g")  // Uporabimo <g> element, da vključimo tako simbol kot tudi zaznavni pravokotnik
        .each(function(d, i) {
            const group = d3.select(this);

            // Dodamo večje območje za hover (neviden pravokotnik)
            group.append("rect")
                .attr("x", x(i + 1) - 10)  // Pozicioniramo pravokotnik okoli simbola
                .attr("y", y(d.average_exposure) - 10)
                .attr("width", 20)  // Velikost območja za hover
                .attr("height", 20)
                .style("fill", "transparent")  // Pravokotnik bo neviden
                .style("pointer-events", "all");  // Omogoči zaznavanje hoverja na območju

            // Dodamo simbol (krog, križ ali kvadrat)
            group.append("path")
                .attr("d", d => {
                    if (d.total_exposure > 30) {
                        return d3.symbol().type(d3.symbolCross).size(100)();
                    } else if (selectedWorkplaceExposure && d.average_exposure === 0) {
                        return d3.symbol().type(d3.symbolSquare).size(100)();
                    } else {
                        return d3.symbol().type(d3.symbolCircle).size(100)();
                    }
                })
                .attr("transform", `translate(${x(i + 1)}, ${y(d.average_exposure)})`)
                .style("fill", d => {
                    const maxMeasurements = d3.max(data, d => d.measurements_count);
                    const colorScale = d3.scaleLinear()
                        .domain([0, maxMeasurements / 15, maxMeasurements / 5, maxMeasurements])
                        .range(["red", "yellow", "green", "green"]);
                    return colorScale(d.measurements_count);
                })
                .style("opacity", d => {
                    if (selectedWorkplaceExposure === "" || selectedWorkplaceExposure === "vsa delovna mesta") {
                        return 1;
                    }
                    if (d.workplace === selectedWorkplaceExposure) {
                        return 1;
                    }
                    if (!nonDisplayedCompanies.includes(d.company)) {   // Dodaj podjetje v seznam, če ni izrisano
                        nonDisplayedCompanies.push(d.company);
                    }
                    return 0;
                });
        })
        .on("mouseover", function(event, d) {
            // Preverjanje, če je element dejansko viden
            const currentOpacity = d3.select(this).style("opacity");
            const rectBounds = this.getBoundingClientRect();

            if (parseFloat(currentOpacity) > 0 && rectBounds.width > 0 && rectBounds.height > 0) {  // Preverimo, če je element viden
                tooltip.style("visibility", "visible")
                    .html(`
                        <strong>Koda osebe:</strong> ${d.person}<br>
                        <strong>Povprečna izpostavljenost:</strong> ${d.average_exposure.toFixed(3)} mSv<br>
                        <strong>Število meritev:</strong> ${d.measurements_count}<br>
                        <strong>Skupna izpostavljenost:</strong> ${d.total_exposure.toFixed(3)} mSv<br>
                        <strong>Delovno mesto:</strong> ${d.workplace}<br>
                    `);
            }
        })
        .on("mousemove", function (event) {
            // Dobimo dimenzije okna (širina in višina)
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
        
            // Pozicija tooltipa na podlagi miške
            let tooltipX = event.pageX + 10; // 10 px desno od miške
            let tooltipY = event.pageY + 10; // 10 px spodaj od miške
        
            // Preverimo, če tooltip presega desni rob zaslona, če presega, ga premaknemo nazaj
            if (tooltipX + tooltip.node().getBoundingClientRect().width > windowWidth) {
                tooltipX = windowWidth - tooltip.node().getBoundingClientRect().width - 10;
            }
        
            // Preverimo, če tooltip presega spodnji rob zaslona, če presega, ga premaknemo nazaj
            if (tooltipY + tooltip.node().getBoundingClientRect().height > windowHeight) {
                tooltipY = windowHeight - tooltip.node().getBoundingClientRect().height - 10;
            }
        
            // Nastavimo pozicijo tooltipa
            tooltip.style("top", tooltipY + "px")
                   .style("left", tooltipX + "px");
        })        
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
        });
}
