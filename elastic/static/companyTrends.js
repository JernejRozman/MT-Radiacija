async function fetchCompanyTrends() {

    // Prikaži besedilo nalaganja
    const loadingText = document.getElementById("loading-text");
    loadingText.style.display = "block";
    loadingText.innerText = "Nalaganje podatkov...";
    //console.log("ahm")
    try {
        const response = await fetch('http://localhost:8080/api/company_exposure_trends');
        const rawData = await response.json();

        // Skrij besedilo nalaganja, ko so podatki naloženi
        document.getElementById("loading-text").style.display = "none";
        
        // Pridobi izbrana podjetja
        const selectedCompanies = getCompaniesByWorkplace(rawData);

        // Preveri, ali je seznam selectedCompanies prazen
        if(selectedWorkplaceExposure="vsa delovna mesta"){
            loadingText.style.display = "block";
            loadingText.innerText = "Graf z vsemi delovnimi mesti je nepregleden, izberite posamezna delovna mesta";
            // Pobriši vsebino elementa, kjer je graf
            d3.select("#visualization").html("");
        }else if (selectedCompanies.length === 0) {
            // Spremeni besedilo na sporočilo, da uporabnik izbere podjetje
            loadingText.style.display = "block";
            loadingText.innerText = "Meritve podjetij tega delovnega mesta so povsod 0";

            // Pobriši vsebino elementa, kjer je graf
            d3.select("#visualization").html("");
        } else {
            // Če so izbrana podjetja, odstrani obvestilo in nariši graf
            const existingNotification = document.getElementById("notification");
            if (existingNotification) {
                existingNotification.remove();
            }

            const dateCorrected = parseDateData(rawData);
            createConnectedScatterplot(dateCorrected, selectedCompanies); // Tukaj uporabimo selectedCompanies
        }

    } catch (error) {
        document.getElementById("loading-text").innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
}




function parseDateData(rawData) {
    return rawData.flatMap(companyData =>
        companyData.measurements.map(measurement => ({
            company: companyData.company, // Doda ime podjetja
            startDate: d3.timeParse("%d.%m.%Y")(measurement.start_date), // Pretvori v Date
            endDate: d3.timeParse("%d.%m.%Y")(measurement.end_date), // Pretvori v Date
            value: +measurement.value // Pretvori v število
        }))
    );
}


function getCompaniesByWorkplace(rawData) {
    const filteredCompanies = new Set() // Uporaba množice za unikatna podjetja
    const selectedWorkplace = selectedWorkplaceExposure // Izbrano delovno mesto
    //console.log(selectedWorkplaceExposure)
    // Pregledamo vsako podjetje v podatkih
    rawData.forEach(companyData => {
        // Preverimo, ali vsebuje izbrano delovno mesto
        if (companyData.unique_workplaces.includes(selectedWorkplace)) {
            filteredCompanies.add(companyData.company); // Dodamo podjetje v množico (unikatnost je samodejna)
        }
    });
    //console.log(selectedWorkplaceExposure)
    return Array.from(filteredCompanies); // Pretvorimo množico v seznam
}

// Funkcija za posodobitev trenutne izbire v dropdownu
document.getElementById("workplaceFilter").addEventListener('change', function() {
    selectedWorkplaceExposure = this.value;
    //console.log("Trenutno izbrano delovno mesto:", selectedWorkplaceExposure);

});




function createConnectedScatterplot(data, selectedCompanies) {
    const margin = { top: 10, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    //d3.select("#visualization").select("svg").remove();
    d3.select("#visualization").html("");
    
    const svg = d3.select("#visualization")
        .attr("width", 800)
        .attr("height", 600)
        .attr("viewBox", `0 0 ${800} ${600}`);

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.startDate))
        .nice()
        .range([margin.left, width - margin.right]);
    
    const maxCompanyValues = data.filter(d => selectedCompanies.includes(d.company));  // Filtriraj podatke za izbrana podjetja

    const y = d3.scaleLinear()
        .domain([0, d3.max(maxCompanyValues, d => d.value)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .curve(d3.curveCatmullRom)
        .x(d => x(d.startDate))
        .y(d => y(d.value));

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("y2", -height)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", width - 4)
            .attr("y", -4)
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .attr("fill", "currentColor")
            .text("Datum"));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width)
            .attr("stroke-opacity", 0.1))
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 4)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Vrednost"));

    const filteredData = data.filter(d => 
        selectedCompanies.includes(d.company) &&
        data.some(entry => entry.company === d.company && entry.value > 0)
    );

    const color = d3.scaleOrdinal()
        .domain(selectedCompanies)
        .range(d3.schemeCategory10);

    const groupedData = d3.group(filteredData, d => d.company);

    // Ustvari tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("border", "1px solid black")
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("font-size", "12px")
        .style("color", "black");

    for (const [company, validValues] of groupedData.entries()) {
        if (validValues.length > 0) {
            svg.append("path")
                .datum(validValues)
                .attr("fill", "none")
                .attr("stroke", color(company))
                .attr("stroke-width", 2.5)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("d", line);

            svg.append("g")
                .attr("fill", color(company))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .selectAll("circle, rect")  // Določimo obe obliki
                .data(validValues)
                .join(enter => enter
                    .filter(d => d.value === 0)  // Če je vrednost 0, uporabimo kvadrat
                    .append("rect")
                    .attr("x", d => x(d.startDate) - 5)  // Pozicija za kvadrat
                    .attr("y", d => y(d.value) - 5)      // Pozicija za kvadrat
                    .attr("width", 10)                   // Velikost kvadrata
                    .attr("height", 10)                  // Velikost kvadrata
                    .attr("fill", color(company))
                    .on("mouseover", function (event, d) {
                        tooltip.style("visibility", "visible")
                            .html(`
                                <strong>Podjetje:</strong> ${d.company}<br>
                                <strong>Začetni datum:</strong> ${d.startDate}<br>
                                <strong>Konec datuma:</strong> ${d.endDate}<br>
                                <strong>Vrednost:</strong> ${d.value}<br>
                            `);
                    })
                    .on("mousemove", function (event) {
                        tooltip.style("top", (event.pageY + 10) + "px")
                            .style("left", (event.pageX + 10) + "px");
                    })
                    .on("mouseout", function () {
                        tooltip.style("visibility", "hidden");
                    })
                    .merge(enter
                        .filter(d => d.value !== 0)  // Če vrednost ni 0, uporabimo krog
                        .append("circle")
                        .attr("cx", d => x(d.startDate))  // Pozicija za krog
                        .attr("cy", d => y(d.value))      // Pozicija za krog
                        .attr("r", 5)                     // Polmer kroga
                        .attr("fill", color(company))
                        .on("mouseover", function (event, d) {
                            tooltip.style("visibility", "visible")
                                .html(`
                                    <strong>Podjetje:</strong> ${d.company}<br>
                                    <strong>Začetni datum:</strong> ${d.startDate}<br>
                                    <strong>Konec datuma:</strong> ${d.endDate}<br>
                                    <strong>Vrednost:</strong> ${d.value} mSv<br>
                                `);
                        })
                        .on("mousemove", function (event) {
                            tooltip.style("top", (event.pageY + 10) + "px")
                                .style("left", (event.pageX + 10) + "px");
                        })
                        .on("mouseout", function () {
                            tooltip.style("visibility", "hidden");
                        })
                    )
                );
        }
    }

    svg.call(d3.zoom().on("zoom", function(event) {
        svg.attr("transform", event.transform);
    }));

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 150},${margin.top})`)
        .selectAll("g")
        .data(selectedCompanies)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", d => color(d));

    legend.append("text")
        .attr("x", 10)
        .attr("y", 5)
        .text(d => d)
        .attr("font-size", "12px")
        .attr("alignment-baseline", "middle");
}

