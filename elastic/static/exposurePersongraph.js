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

    // Dodaj krogce
    const showCircleData = d3.select("body").append("div") // showCircleData element
        .attr("class", "showCircleData")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 2px 10px rgba(0, 0, 0, 0.1)");

    // Definiraj funkcijo za interpolacijo barve od rdeče do modre
    const colorScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.measurements_count) / 15, d3.max(data, d => d.measurements_count) / 5]) // Določimo točke prehoda
    .range(["red", "yellow", "green"]); // Barve: rdeča, rumena, modra

    svg.append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d, i) => x(i + 1)) // Številka osebe
        .attr("cy", d => y(d.average_exposure)) // Povprečna izpostavljenost
        .attr("r", 5)
        .style("fill", d => {
            // Preveri, ali je type "R", če ni, nastavi barvo na črno
            if (d.type !== "R") {
                return "black";  // Če ni tip "R", nastavi barvo na črno
            } else {
                return colorScale(d.measurements_count); // Uporabi barvno lestvico glede na število meritev
            }
        })
        .style("opacity", 0.8)
        .on("mouseover", function(event, d) {
            // Ob premiku miške prikaz showCircleData
            showCircleData.transition().duration(200).style("visibility", "visible");

            showCircleData.html(`
                <strong>Koda osebe: </strong>${d.person}<br>
                <strong>Povprečna izpostavljenost: </strong>${d.average_exposure}<br>
                <strong>Število meritev: </strong>${d.measurements_count}<br>
                <strong>Skupna izpostavljenost: </strong>${d.total_exposure}<br>
                <strong>Delovno mesto: </strong>${d.workplace}<br>
            `);
        })
        .on("mousemove", function(event) {
            // Pridobi širino in višino okna brskalnika
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            // Pridobi trenutne koordinate miške
            const mouseX = event.pageX;
            const mouseY = event.pageY;
            // Nastavi širino in višino showCircleData elementa
            const showCircleDataWidth = showCircleData.node().offsetWidth;
            const showCircleDataHeight = showCircleData.node().offsetHeight;
        
            // Računaj pozicijo za prikaz proti sredini zaslona
            let showCircleDataX = mouseX + 10; // Dodajanje nekoliko prostora
            let showCircleDataY = mouseY + 10; // Dodajanje nekoliko prostora
        
            // Preveri, če je showCircleData blizu desnega roba in ga premakni na levo
            if (showCircleDataX + showCircleDataWidth > windowWidth) {
                showCircleDataX = windowWidth - showCircleDataWidth - 10; // Premakni ga 10px od roba
            }
            // Preveri, če je showCircleData blizu spodnjega roba in ga premakni gor
            if (showCircleDataY + showCircleDataHeight > windowHeight) {
                showCircleDataY = windowHeight - showCircleDataHeight - 10; // Premakni ga 10px od roba
            }
            // Premakni showCircleData na novo pozicijo
            showCircleData.style("top", showCircleDataY + "px")
                .style("left", showCircleDataX + "px");
        })
        
        .on("mouseout", function() {
            // Ob odstranitvi miške skrij showCircleData
            showCircleData.transition().duration(200).style("visibility", "hidden");
        });
}
