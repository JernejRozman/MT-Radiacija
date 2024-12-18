async function fetchCompanyTrends() {
    const loadingText = document.getElementById("loading-text");
    loadingText.style.display = "block";
    loadingText.innerText = "Nalaganje podatkov...";
    try {
        const response = await fetch('http://localhost:8080/api/company_exposure_trends');
        const rawData = await response.json();

        document.getElementById("loading-text").style.display = "none";

        const selectedCompanies = getCompaniesByWorkplace(rawData);

        if(selectedWorkplaceExposure==="vsa delovna mesta" || selectedWorkplaceExposure===""){
            loadingText.style.display = "block";
            loadingText.innerText = "Graf z vsemi delovnimi mesti je nepregleden, v filtru izberite posamezna delovna mesta";
            d3.select("#visualization").html("");
            return;
        }else if (selectedCompanies.length === 0) {
            loadingText.style.display = "block";
            loadingText.innerText = `Meritve podjetij za delovno mesto "${selectedWorkplaceExposure}" so povsod 0`;
            d3.select("#visualization").html("");
            return;
        } else {
            const dateCorrected = parseDateData(rawData);
            const companiesWithOnlyZeroValues = createConnectedScatterplot(dateCorrected, selectedCompanies); // Tukaj uporabimo selectedCompanies
            
            if (companiesWithOnlyZeroValues.length > 0){
                //const loadingText = document.getElementById("loading-text");
                loadingText.style.display = "block";
                loadingText.innerText = "Podjetja z vsemi vrednostmi 0 so v legendi obarvana črno";
                //loadingText.innerText = `Podjetja z vsemi vrednostmi 0: ${companiesWithOnlyZeroValues.join(", ")}`;
            }
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
    rawData.forEach(companyData => {
        // Preverimo, ali vsebuje izbrano delovno mesto
        if (companyData.unique_workplaces.includes(selectedWorkplace)) {
            filteredCompanies.add(companyData.company); // Dodamo podjetje v množico
        }
    });
    return Array.from(filteredCompanies); // Pretvorimo množico v seznam
}
function createConnectedScatterplot(data, selectedCompanies) {
    d3.select("#visualization").html("");

    const margin = { top: 10, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    const svg = d3.select("#visualization")
        .attr("width", 800)
        .attr("height", 600)
        .attr("viewBox", `0 0 ${800} ${600}`);

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.startDate))
        .nice()
        .range([margin.left, width - margin.right]);
    
    const maxCompanyValues = data.filter(d => selectedCompanies.includes(d.company));

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

    const groupedData = d3.group(data, d => d.company);

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

    const companiesWithOnlyZeroValues = [];
    const validCompanies = [];

    for (const [company, companyData] of groupedData.entries()) {
        if (selectedCompanies.includes(company)) {
            if (companyData.every(d => d.value === 0)) {
                companiesWithOnlyZeroValues.push(company);
            } else {
                validCompanies.push(company);

                svg.append("path")
                    .datum(companyData)
                    .attr("fill", "none")
                    .attr("stroke", d3.schemeCategory10[validCompanies.indexOf(company) % 10])
                    .attr("stroke-width", 2.5)
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("d", line);

                svg.append("g")
                    .selectAll("circle")
                    .data(companyData.filter(d => d.value > 0))
                    .join("circle")
                    .attr("cx", d => x(d.startDate))
                    .attr("cy", d => y(d.value))
                    .attr("r", 5)
                    .attr("fill", d3.schemeCategory10[validCompanies.indexOf(company) % 10])
                    .on("mouseover", function (event, d) {
                        const formatDate = d3.timeFormat("%b %d, %Y");  // Mesec kot okrajšava (npr. Jul 06, 2023)

                        tooltip.style("visibility", "visible")
                            .html(`
                                <strong>Podjetje:</strong> ${d.company}<br>
                                <strong>Začetni datum:</strong> ${formatDate(new Date(d.startDate))}<br>
                                <strong>Koncni datum:</strong> ${formatDate(new Date(d.endDate))}<br>
                                <strong>Vrednost:</strong> ${d.value}
                            `);
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
                    .on("mouseout", function () {
                        tooltip.style("visibility", "hidden");
                    });
            }
        }
    }

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
        .attr("fill", d => 
            companiesWithOnlyZeroValues.includes(d) 
                ? "black" 
                : d3.schemeCategory10[selectedCompanies.indexOf(d) % 10]
        );

    legend.append("text")
        .attr("x", 10)
        .attr("y", 5)
        .text(d => d)
        .attr("font-size", "12px")
        .attr("alignment-baseline", "middle");

    return companiesWithOnlyZeroValues;
}
