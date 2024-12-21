async function fetchCompanyTrends() {

    const contentContainer = document.querySelector(".content");
    const visualization = document.getElementById("visualization");

    //showAtomAnimation(contentContainer, visualization, loadingWrapper);

    const loadingText = document.getElementById("loading-text")
    loadingText.style.display = "block";
    loadingText.innerText = "Nalaganje podatkov...";

    // Check if the loadingWrapper already exists
    let loadingWrapper = document.getElementById("loading-wrapper");

    if (!loadingWrapper) {
        loadingWrapper = document.createElement("div");
        loadingWrapper.id = "loading-wrapper";

        // Apply flexbox centering
        loadingWrapper.style.display = "flex";
        loadingWrapper.style.justifyContent = "center";
        loadingWrapper.style.alignItems = "center";
        loadingWrapper.style.background = "linear-gradient(to bottom, rgb(25, 25, 112), rgb(32, 56, 100), rgb(0, 0, 0))"; 

        // Insert the animation (atom) HTML
        loadingWrapper.innerHTML = `
            <div id="atom">
                <div id="nucleus"></div>
                <div class="orbit">
                    <div class="electron"></div>
                </div>
                <div class="orbit">
                    <div class="electron"></div>
                </div>
                <div class="orbit">
                    <div class="electron"></div>
                </div>
            </div>
        `;

        // Hide the SVG (assuming visualization is a variable in your code)
        visualization.style.display = "none"; 

        // Add the loading animation to the container
        contentContainer.appendChild(loadingWrapper);
    }












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
                loadingText.innerText = "Podjetja z vsemi vrednostmi 0 so neizrisana in v legendi obarvana črno.";
                //loadingText.innerText = `Podjetja z vsemi vrednostmi 0: ${companiesWithOnlyZeroValues.join(", ")}`;
            }
        }
        //await sleep(100000); // Pause for 2 seconds
        // Remove the loading animation and restore the SVG
        //if (!loadingWrapper) {
        contentContainer.removeChild(loadingWrapper);
        visualization.style.display = "block";
        //}
    } catch (error) {
        document.getElementById("loading-text").innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podatkov:", error);
    }
    window.fetchCompanyTrends = fetchCompanyTrends;

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
    d3.select("#visualization").select("svg").remove();

    const customColors = [
        "#1f77b4", // modra
        "#f4a300", // gold
        "#32cd32", // lime zelena
        "#ff00ff", // magenta
        "#9B8AC4", // vijolična
        "#8b0000", // temno rdeča
        "#17becf", // svetlo modra
        "#8c564b", // rjava
        "#ff4500", // oranžno rdeča
        "#d62728", // rdeča
        "#9467bd", // vijolična
        "#7f7f7f", // siva
        "#00ff00", // neon zelena
        "#A8D8DC", // svetlo modra
        "#9A709E", // temno roza
        "#e377c2", // roza
        "#ff7f0e", // oranžna
        "#2ca02c", // zelena
        "#ff6347", // tomatna rdeča
        "#C2E3D2", // svetlo modra
        "#00008b", // navy blue
        "#ff6347", // tomatna rdeča
        "#ff1493", // deep pink
        "#bcbd22", // rumena
    ];
    
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
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

    let selectedCompany = null;  // Spremenljivka za sledenje izbrani točki podjetja

    for (const [company, companyData] of groupedData.entries()) {
        if (selectedCompanies.includes(company)) {
            const validPoints = companyData.filter(d => d.value > 0);
    
            if (validPoints.length === 0) {
                companiesWithOnlyZeroValues.push(company);
            } else {
                validCompanies.push(company);
    
                if (validPoints.length > 1) {
                    svg.append("path")
                        .datum(validPoints)
                        .attr("fill", "none")
                        .attr("stroke", customColors[validCompanies.indexOf(company) % customColors.length])
                        .attr("stroke-width", 2.5)
                        .attr("stroke-linejoin", "round")
                        .attr("stroke-linecap", "round")
                        .attr("d", line);
                }
    
                svg.append("g")
                    .selectAll("circle")
                    .data(validPoints)
                    .join("circle")
                    .attr("cx", d => x(d.startDate))
                    .attr("cy", d => y(d.value))
                    .attr("r", 5)
                    .attr("fill", customColors[validCompanies.indexOf(company) % customColors.length])
                    .attr("data-company", company)  // Dodaj atribut za podjetje
                    .on("mouseover", function (event, d) {
                        const formatDate = d3.timeFormat("%b %d, %Y");
    
                        tooltip.style("visibility", "visible")
                            .html(`
                                <strong>Podjetje:</strong> ${d.company}<br>
                                <strong>Začetni datum:</strong> ${formatDate(new Date(d.startDate))}<br>
                                <strong>Koncni datum:</strong> ${formatDate(new Date(d.endDate))}<br>
                                <strong>Vrednost:</strong> ${d.value}
                            `);
                    })
                    .on("mousemove", function (event) {
                        const windowWidth = window.innerWidth;
                        const windowHeight = window.innerHeight;
    
                        let tooltipX = event.pageX + 10;
                        let tooltipY = event.pageY + 10;
    
                        if (tooltipX + tooltip.node().getBoundingClientRect().width > windowWidth) {
                            tooltipX = windowWidth - tooltip.node().getBoundingClientRect().width - 10;
                        }
    
                        if (tooltipY + tooltip.node().getBoundingClientRect().height > windowHeight) {
                            tooltipY = windowHeight - tooltip.node().getBoundingClientRect().height - 10;
                        }
    
                        tooltip.style("top", tooltipY + "px")
                               .style("left", tooltipX + "px");
                    })                    
                    .on("mouseout", function () {
                        tooltip.style("visibility", "hidden");
                    })
                    .on("click", function (event, d) {
                        // Ko klikneš točko, spremeni vse točke tega podjetja
                        if (selectedCompany === company) {
                            selectedCompany = null;  // Deselect, če že izbrano
                            d3.selectAll(`circle[data-company="${company}"]`)
                                .attr("r", 5)  // Obnovi velikost
                                .attr("fill", customColors[validCompanies.indexOf(company) % customColors.length])
                                .attr("shape-rendering", "auto");  // Vrni v začetno obliko
                        } else {
                            selectedCompany = company;
                            d3.selectAll(`circle[data-company="${company}"]`)
                                .attr("r", 10)  // Povečaj velikost
                                .attr("fill", customColors[validCompanies.indexOf(company) % customColors.length])
                                .attr("shape-rendering", "crispEdges");  // Spremeni v kvadrat
                        }
                    })
                    .on("dblclick", function(event, d) {
                        // Skrij vse točke, povezane s tem podjetjem
                        d3.selectAll(`circle[data-company="${d.company}"]`)
                            .transition()
                            .duration(300)  // Hitrost skritja
                            .style("opacity", 0);  // Skrij točke
                    });
            }
        }
    }
    

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 50},${margin.top})`)
        .selectAll("g")
        .data(selectedCompanies)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", d => 
            companiesWithOnlyZeroValues.includes(d) ? "black" : customColors[validCompanies.indexOf(d) % customColors.length]
        );

    legend.append("text")
        .attr("x", 10)
        .attr("y", 5)
        .text(d => d)
        .attr("font-size", "12px")
        .attr("alignment-baseline", "middle");

    return companiesWithOnlyZeroValues;
}
