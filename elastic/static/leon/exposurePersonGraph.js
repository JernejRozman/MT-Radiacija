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


    const visualization = d3.select("#visualization");
    visualization.html("");  // To bo odstranilo prejšnji SVG element

 

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 800 - margin.left - margin.right; // Širina notranjega grafa
    const height = 500 - margin.top - margin.bottom; // Višina notranjega grafa


    const svg = d3.select("#visualization")
        .append("svg")
        .attr("height", "100%")
        .attr("width", "100%")
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
        .style("font-size", "16px")  // Povečaj velikost pisave
        .style("font-weight", "bold")  // Naredi besedilo odebeljeno
        .text("Osebe");

    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "16px")  // Povečaj velikost pisave
        .style("font-weight", "bold")  // Naredi besedilo odebeljeno
        .text("Povprečna izpostavljenost");


    // Interaktivna črta
    let linePosition = Math.max(d3.max(yData) / 2, 19); // Začetna pozicija črte

    const line = svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(linePosition))
        .attr("y2", y(linePosition))
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .style("stroke-dasharray", "5,5")  // Prekinjena črta
        .style("cursor", "ns-resize");

    // Besedilo za prikaz vrednosti Y osi na levi strani črte
    const lineLabel = svg.append("text")
        .attr("x", -10) // Malo levo od črte
        .attr("y", y(linePosition) + 5) // Poravnaj z začetno pozicijo črte
        .attr("text-anchor", "end") // Poravnava desno
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text(linePosition.toFixed(2)); // Začetna vrednost

    // Dodajanje večjega območja za interaktivni premik (večji pravokotnik, ki omogoča premikanje)
    const dragArea = svg.append("rect")
        .attr("x", 0)
        .attr("y", y(Math.max(d3.max(yData) / 2, 20)) - 10)  // Poskrbimo, da je pravokotnik nad črto
        .attr("width", width)
        .attr("height", 20)  // Višina pravokotnika za premikanje črte (večje območje)
        .style("fill", "transparent")
        .style("pointer-events", "all")
        .style("cursor", "ns-resize");

    // Nastavitev območja za premikanje črte (omejitev na višini grafa)
    const drag = d3.drag()
    .on("start", function(event) {
        // Povzdignemo interaktivno skupino nad vse druge elemente
        interactiveGroup.raise();

        // Onemogočimo pointer-events na osi
        svg.selectAll(".axis").style("pointer-events", "none");
    })
    .on("drag", function(event) {
        const newYPosition = y.invert(event.y);  // Pretvori premik miške v vrednost na Y-osi

        // Omejimo premik črte znotraj meja grafa (od 0 do max y vrednosti)
        if (newYPosition >= 2 && newYPosition <= d3.max(yData)) {
            linePosition = newYPosition;

            // Posodobi črto in območje
            line.attr("y1", event.y)
                .attr("y2", event.y);
            dragArea.attr("y", event.y - 10);


            lineLabel
                .attr("y", event.y + 5) // Poravnava z novo pozicijo črte
                .text(linePosition.toFixed(2)); // Posodobi vrednost Y osi
            // Posodobi simbole na podlagi nove pozicije črte
            //updateSymbols();
        }
    })
    .on("end", function() {
        // Ponovno omogočimo pointer-events na osi
        svg.selectAll(".axis").style("pointer-events", "all");
        updateSymbols();
    });

    dragArea.call(drag);

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

    // Funkcija za posodabljanje simbolov glede na črto
    function updateSymbols() {
        // Veži podatke s skupinami ("g.symbols")
        const symbols = svg.selectAll("g.symbols")
            .data(data, d => d.person); // Ključ je enolična lastnost (npr. "person")
    
        // Ustvarjanje novih skupin za simbole
        const symbolsEnter = symbols.enter()
            .append("g")
            .attr("class", "symbols");
    
        // Dodaj nove simbole (path) v nove skupine
        symbolsEnter.append("path");
    
        // Posodobi obstoječe in nove simbole
        symbolsEnter.merge(symbols) // Združi enter in update dele
            .select("path") // Posodobi vse poti
            .attr("d", d => {
                if (d.average_exposure > linePosition) {
                    return d3.symbol().type(d3.symbolCross).size(100)();
                } else if (selectedWorkplaceExposure && d.average_exposure === 0) {
                    return d3.symbol().type(d3.symbolSquare).size(100)();
                } else {
                    return d3.symbol().type(d3.symbolCircle).size(100)();
                }
            })
            .attr("transform", (d, i) => `translate(${x(i + 1)}, ${y(d.average_exposure)})`)
            .style("fill", d => {
                if (d.average_exposure > linePosition) {
                    return "black"; // Obarvaj črno, če je povprečna izpostavljenost večja od meje
                } else {
                    const maxMeasurements = d3.max(data, d => d.measurements_count);
                    const colorScale = d3.scaleLinear()
                        .domain([0, maxMeasurements / 15, maxMeasurements / 5, maxMeasurements])
                        .range(["red", "yellow", "green", "green"]);
                    return colorScale(d.measurements_count); // Ohranimo prejšnjo logiko
                }
            })
            .style("opacity", d => {
                const opacityValue = (selectedWorkplaceExposure === "" || 
                                     selectedWorkplaceExposure === "vsa delovna mesta" ||
                                     d.workplace === selectedWorkplaceExposure)
                                     ? 1 : 0;
                return opacityValue;
            })
            .style("pointer-events", d => {
                return (selectedWorkplaceExposure === "" || d.workplace === selectedWorkplaceExposure) ? "all" : "none";
            })
            .on("mouseover", function(event, d) {
                if (selectedWorkplaceExposure === "" || d.workplace === selectedWorkplaceExposure) {
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
                // Koordinati miške na zaslonu
                const [svgX, svgY] = [event.pageX, event.pageY];
    
                // Velikost okna (širina in višina)
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
    
                // Pozicija tooltipa z rahlim odmikom
                let tooltipX = svgX + 10;
                let tooltipY = svgY + 10;
    
                // Preprečimo preseganje roba zaslona (desni rob)
                if (tooltipX + tooltip.node().getBoundingClientRect().width > windowWidth) {
                    tooltipX = windowWidth - tooltip.node().getBoundingClientRect().width - 10;
                }
    
                // Preprečimo preseganje roba zaslona (spodnji rob)
                if (tooltipY + tooltip.node().getBoundingClientRect().height > windowHeight) {
                    tooltipY = windowHeight - tooltip.node().getBoundingClientRect().height - 10;
                }
    
                // Nastavimo pozicijo tooltipa
                tooltip.style("top", tooltipY + "px")
                       .style("left", tooltipX + "px");
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            })
            .on("dblclick", function(event, d) {
                // Odstranimo točko iz grafa
                d3.select(this).remove(); // Izbriše celotno skupino (in simbol)
            });
    // Inicializiramo simbole
    
    }
    updateSymbols();
}
