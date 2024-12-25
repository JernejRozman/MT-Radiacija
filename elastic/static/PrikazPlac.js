// Definirani podatki za plače po poklicih in letih
const salariesData = {
    "Zobozdravniki/zobozdravnice": [1601, 1635, 1692, 1787, 1827, 1800, 1827, 2099],
    "Zobozdravstveni asistenti": [941, 951, 960, 981, 1021, 1016, 1077, 1186],
    "Laboratorijski tehniki/laboratorijske tehnice v biomedicini, biologiji, farmakologiji": [1111, 1126, 1152, 1186, 1244, 1314, 1348, 1449],
    "Laboratorijski tehniki/laboratorijske tehnice v zdravstvu in patologiji": [1021, 1050, 1084, 1108, 1190, 1176, 1177, 1363],
    "Veterinarji/veterinarke": [1628, 1646, 1670, 1705, 1746, 1851, 1918, 1951],
    "Rudarski nadzorniki/rudarske nadzornice": [1573, 1594, 1702, 1749, 1757, 1870, 1885, 1971],
    "Tehniki/tehnice za rudarstvo, metalurgijo": [1297, 1329, 1388, 1427, 1385, 1420, 1508, 1691],
    "Inženirji/inženirke rudarstva, metalurgije": [1636, 1653, 1722, 1747, 1789, 1845, 1964, 2095],
    "Delavci/delavke za preprosta rudarska in kamnolomska dela": [1009, 973, 978, 1037, 1053, 1114, 1115, 1220],
    "Nadzorniki/nadzornice v rudarstvu, predelovalnih dejavnostih in gradbeništvu": [1182, 1190, 1224, 1285, 1329, 1390, 1456, 1581]
};

// Letnice za x-os
const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

// Funkcija, ki jo kličemo ob izbiri poklica
async function ShowSalaries() {
    const selectedJob = document.getElementById("workplace").value;
    console.log("Izbran poklic:", selectedJob);

    if (!selectedJob) return; // Preveri, če je poklic izbran

    // Počisti obstoječo vizualizacijo
    d3.select("#visualization").html("");

    // Določimo podatke za izbran poklic
    const salaries = salariesData[selectedJob];

    // Dimenzije SVG-ja
    const margin = { top: 50, right: 20, bottom: 80, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Nastavitev SVG-ja
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Ustvarjanje x in y skale
    const xScale = d3.scalePoint()
        .domain(years)
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 2200])
        .range([height, 0]);

    // Dodajanje os x
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickValues(years));

    // Dodajanje os y
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Funkcija za risanje grafa
    function Sluzba(job) {
        const salaries = salariesData[job];
        // Izpis besedila "Nalaganje podatkov"
        const loadingText = document.getElementById("loading-text");
        loadingText.style.display = "block";
        loadingText.innerText = job;

        // Risanje črte (line)
        const line = d3.line()
            .x((d, i) => xScale(years[i]))
            .y(d => yScale(d));

        // Dodajanje črte s fade-in animacijo
        svg.append("path")
            .data([salaries])
            .attr("class", "line")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "#007bff")
            .attr("stroke-width", 6)
            .attr("opacity", 0)
            .transition()
            .duration(1500)
            .attr("opacity", 1);

        // Ustvarjanje prelivnega območja (area)
        const area = d3.area()
            .x((d, i) => xScale(years[i]))
            .y0(yScale(0))
            .y1(d => yScale(d));

        // Dodajanje prelivnega območja pod krivuljo z več barvnimi prehodi
        svg.append("path")
            .data([salaries])
            .attr("class", "area")
            .attr("d", area)
            .attr("fill", "url(#multi-color-gradient)") // Nastavi preliv z več barvami
            .attr("opacity", 0)
            .transition()
            .duration(1500)
            .attr("opacity", 1);

        // Definiramo večbarvni gradient prelivnega območja
        svg.append("defs")
            .append("linearGradient")
            .attr("id", "multi-color-gradient")
            .attr("x1", "0%") // Začetek na levi strani
            .attr("x2", "0%") // Ni premikanja v horizontalni smeri
            .attr("y1", "0%") // Začetek pri vrhu
            .attr("y2", "100%") // Konča se pri dnu
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#00c6ff") // Svetla modra na vrhu
            .append("stop")
            .attr("offset", "50%")
            .attr("stop-color", "#007bff") // Srednja modra v sredini
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#1417d4"); // Temna modra na dnu

        // Dodajanje debele črtkane linije
        for (let i = 0; i < salaries.length; i++) {
            svg.append("line")
                .attr("x1", xScale(years[i]))
                .attr("y1", yScale(salaries[i]))
                .attr("x2", xScale(years[i]))
                .attr("y2", yScale(0))
                .attr("stroke", "#1417d4")
                .attr("stroke-dasharray", "8,4") // Debelejše črtkane črte
                .attr("stroke-width", 3) // Povečana debelina črte
                .attr("opacity", 0)
                .transition()
                .duration(1500)
                .attr("opacity", 1);
        }

        // Dodajanje točk (dot) s fade-in animacijo
        const dots = svg.selectAll(".dot")
            .data(salaries)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", (d, i) => xScale(years[i]))
            .attr("cy", d => yScale(d))
            .attr("r", 7)
            .attr("fill", "#1417d4")
            .attr("opacity", 0)
            .transition()
            .duration(1500)
            .attr("opacity", 1);

        // Dodajanje besedila nad točkami
        svg.selectAll(".text")
            .data(salaries)
            .enter()
            .append("text")
            .attr("class", "text")
            .attr("x", (d, i) => xScale(years[i]))
            .attr("y", d => yScale(d) - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#333")
            .text(d => `${d} €`)
            .attr("opacity", 0)
            .transition()
            .duration(1500)
            .attr("opacity", 1);

        // Ustvarimo interaktivni hover efekt za točke
        dots.on("mouseover", function(event, d) {
            const i = d3.select(this).datum();
            d3.select(this)
                .transition()
                .duration(300)
                .attr("r", 12) // Povečaj velikost točke
                .attr("fill", "#ff5733"); // Spremeni barvo točke

            // Povečanje besedila
            svg.selectAll(".text")
                .filter(function(d, i) {
                    return years[i] === years[years.indexOf(i)];
                })
                .transition()
                .duration(300)
                .attr("font-size", "16px") // Povečaj velikost besedila
                .attr("fill", "#ff5733"); // Spremeni barvo besedila

            // Prikazovanje podrobnosti
            svg.append("text")
                .attr("id", "tooltip")
                .attr("x", xScale(years[i]) + 10)
                .attr("y", yScale(d) - 10)
                .attr("text-anchor", "start")
                .attr("font-size", "12px")
                .attr("fill", "#333")
                .text(`Leto: ${years[i]} Plača: ${d} €`);
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .transition()
                .duration(300)
                .attr("r", 7) // Povratna velikost točke
                .attr("fill", "#1417d4"); // Povratna barva točke

            // Povratna barva besedila
            svg.selectAll(".text")
                .transition()
                .duration(300)
                .attr("font-size", "12px") // Povratna velikost besedila
                .attr("fill", "#333"); // Povratna barva besedila

            // Odstranimo podrobnosti
            d3.select("#tooltip").remove();
        });

        // Skrijemo besedilo "Nalaganje podatkov"
        loadingText.style.display = "none";
    }

    // Kličemo funkcijo za izris podatkov za izbrani poklic
    Sluzba(selectedJob);
}
