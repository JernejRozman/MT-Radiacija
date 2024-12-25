function RadioloskePlace() {
    // Podatki za bolnišnice
    const RadiologiP = {
        "UKC Maribor": [41, 215545, 5257, 10991],
        "SB Celje": [6, 45417, 7570, 4145],
        "SB Novo mesto": [7, 50825, 7261, 7756],
        "SB Izola": [11, 160000, 6257, 11188],
        "SB Nova Gorica": [10, 68086, 6809, 12858]
    };

    // Barve za kroge
    const barColors = ["#1E0E64", "#2B1B96", "#482FDF", "#5A68F2", "#8CA5F7", "#A9B9F9"];

    // Pridobitev izbrane vrednosti iz <select>
    const select = document.getElementById("radiologi");
    const izbranaVrednost = parseInt(select.value); // Pridobi indeks izbranega stolpca
    const prikaziEuro = izbranaVrednost !== 0; // Dodaj € za vse, razen za prvo možnost

    // Nastavitve SVG platna
    const svgWidth = 1000;
    const svgHeight = 500;
    const svg = d3.select("#visualization")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Čiščenje obstoječih elementov
    svg.selectAll("*").remove();

    // Sortiranje podatkov glede na izbrano vrednost
    const sortedData = Object.entries(RadiologiP).sort((a, b) => b[1][izbranaVrednost] - a[1][izbranaVrednost]);

    // Nastavitve za kroge
    const maxRadius = 130; // Največji polmer kroga
    const minRadius = 40; // Najmanjši polmer kroga
    const radiusScale = d3.scaleLinear()
        .domain([0, sortedData.length - 1])
        .range([maxRadius, minRadius]); // Krogi postopno manjšajo velikost

    // Izračun skupne širine vseh krogov (da bodo poravnani na sredino)
    const totalWidth = sortedData.reduce((acc, _, i) => acc + 2 * radiusScale(i), 0);

    // Začetna X-koordinata za poravnavo na sredino
    let currentX = (svgWidth - totalWidth) / 2;

    // Dodajanje tooltipa
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("padding", "5px 10px")
        .style("background-color", "white")
        .style("color", "black")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Funkcija za prilagoditev besedila v krogu
    function wrapText(textElement, text, radius) {
        const words = text.split(" ");
        const lineHeight = radius * 0.3; // Razmik med vrsticami
        let line = [];
        let yOffset = 0;
        let lines = [];

        // Razdelitev besedila v vrstice, ki se prilegajo širini kroga
        words.forEach((word) => {
            line.push(word);
            const testLine = line.join(" ");
            textElement.text(testLine);

            // Če je vrstica predolga, jo razdeli
            if (textElement.node().getComputedTextLength() > radius * 1.8) {
                line.pop();
                lines.push(line.join(" "));
                line = [word];
            }
        });

        // Dodaj zadnjo vrstico
        if (line.length > 0) {
            lines.push(line.join(" "));
        }

        // Vertikalna centriranost
        const totalHeight = lines.length * lineHeight;
        const startY = (svgHeight / 2) - (totalHeight / 2) + lineHeight / 2;

        // Izrisovanje vrstic
        lines.forEach((line, index) => {
            textElement.append("tspan")
                .attr("x", textElement.attr("x"))
                .attr("y", startY + index * lineHeight)
                .text(line)
                .attr("dy", `${index === 0 ? 0 : lineHeight}`);
        });
    }

    // Risanje krogov
    sortedData.forEach((item, index) => {
        const [name, values] = item;
        const value = values[izbranaVrednost];
        const radius = radiusScale(index);

        // Dodajanje kroga
        const circle = svg.append("circle")
            .attr("cx", currentX + radius)
            .attr("cy", svgHeight / 2)
            .attr("r", radius)
            .attr("fill", barColors[index])
            .on("mouseover", function () {
                tooltip
                    .style("opacity", 1)
                    .style("background-color", barColors[index])
                    .style("color", "white")
                    .html(`${name}: ${value}${prikaziEuro ? " €" : ""}`);
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", `${event.pageY - 40}px`)
                    .style("left", `${event.pageX + 20}px`);
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);
            });

        // Dodajanje imena bolnice v krog
        const textElement = svg.append("text")
            .attr("x", currentX + radius)
            .attr("y", svgHeight / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", `${radius * 0.18}px`)
            .attr("font-weight", "bold");

        wrapText(textElement, name, radius);

        // Posodobi X-koordinato za naslednji krog
        currentX += 2 * radius;
    });
}
