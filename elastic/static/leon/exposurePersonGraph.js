async function fetchExposure() {
    document.getElementById("loading-text").style.display = "block";
    document.getElementById("loading-text").innerText = "Nalaganje podatkov...";

    const contentContainer = document.querySelector(".content");
    const visualization = document.getElementById("visualization");

    // Create the loading animation container dynamically
    const loadingWrapper = document.createElement("div");
    loadingWrapper.id = "loading-wrapper";
    loadingWrapper.innerHTML = `
      <div class="loop-wrapper">
        <div class="mountain"></div>
        <div class="hill"></div>
        <div class="tree"></div>
        <div class="tree"></div>
        <div class="tree"></div>
        <div class="rock"></div>
        <div class="truck"></div>
        <div class="wheels"></div>
      </div>
    `;
    visualization.style.display = "none"; // Hide the SVG
    contentContainer.appendChild(loadingWrapper); // Add the loading animation

    try {
        const response = await fetch('http://localhost:8080/api/exposure_by_person');
        const data = await response.json();

        document.getElementById("loading-text").style.display = "none";

        createScatterPlot(data); 

        //await sleep(20000); // Pause for 2 seconds
        // Remove the loading animation and restore the SVG
        contentContainer.removeChild(loadingWrapper);
        visualization.style.display = "block";
    } catch (error) {
        document.getElementById("loading-text").innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
                    const opacityValue =    (selectedWorkplaceExposure === "" || 
                                            selectedWorkplaceExposure === "vsa delovna mesta") ||
                                            (d.workplace === selectedWorkplaceExposure) 
                                            ? 1 : 0;
                    //console.log(`Person: ${d.person}, Workplace: ${d.workplace}, Opacity: ${opacityValue}`);
                    return opacityValue;
                });
        })
        .on("mouseover", function(event, d) {
            const path = d3.select(this).select("path").node();
            const computedOpacity = parseFloat(window.getComputedStyle(path).opacity);

            if (computedOpacity === 1 && (selectedWorkplaceExposure === "" || d.workplace === selectedWorkplaceExposure)) {
                console.log(computedOpacity, `${d.person}`);
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
