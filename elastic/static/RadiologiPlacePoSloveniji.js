function RadioloskePlace() {
    // Podatki za bolnišnice
    const RadiologiP = {
        "UKC Maribor": [41, 215545, 5257, 18, 3614, 201, 1804],
        "SB Celje": [6, 45417, 7570, 25, 89195, 3568, 18492],
        "SB Novo mesto": [7, 50825, 7261, 24, 82218, 3426, 15306],
        "SB Nova Gorica": [10, 68086, 6809, 10, 57518, 5752, 22345]
    };

    // Barve za kroge - od temnejše modre do svetlejše modre
    const barColors = ["#003366", "#3366CC", "#6699FF", "#99CCFF"];

    // Pridobitev izbrane vrednosti iz <select>
    const select = document.getElementById("radiologi");
    const izbranaVrednost = parseInt(select.value); // Pridobi indeks izbranega stolpca
    const prikaziEuro = izbranaVrednost !== 0 && izbranaVrednost !== 3; // Dodaj € za vse, razen za prvo in tretjo možnost
    const izbranaOpcija = select.options[select.selectedIndex];
    const izbranoBesedilo = izbranaOpcija.textContent;

    const loadingText = document.getElementById("loading-text");
    loadingText.style.display = "block";
    loadingText.innerHTML = `${izbranoBesedilo} <b>(Velikosti krogov in številk so zgolj simbolične!)</b>`;

    // Nastavitve SVG platna
    const svgWidth = 1000;
    const svgHeight = 500;
    const svg = d3.select("#visualization")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Čiščenje obstoječih elementov
    d3.select("#visualization").html("");

    // Sortiranje podatkov glede na izbrano vrednost
    const sortedData = Object.entries(RadiologiP).sort((a, b) => b[1][izbranaVrednost] - a[1][izbranaVrednost]);

    // Nastavitve za kroge (velikost kroga se bo spreminjala)
    const maxRadius = 140; // Največji polmer za prvi krog
    const minRadius = 60;  // Najmanjši polmer za zadnji krog

    // Izračun skupne širine vseh krogov (da bodo poravnani na sredino)
    const totalWidth = sortedData.reduce((acc, _, index) => acc + 2 * (maxRadius - ((maxRadius - minRadius) * (index / (sortedData.length - 1)))), 0);

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

    // Število bolnišnic (krogov)
    const totalHospitals = sortedData.length;

    // Risanje krogov
    sortedData.forEach((item, index) => {
        const [name, values] = item;
        const value = values[izbranaVrednost];

        // Izračun velikosti kroga (od največjega do najmanjšega)
        const radius = maxRadius - ((maxRadius - minRadius) * (index / (totalHospitals - 1)));

        // Dodelitev barve na podlagi odtenka
        const color = barColors[index];

        // Dodajanje kroga
        const circle = svg.append("circle")
            .attr("cx", currentX + radius)
            .attr("cy", svgHeight / 2)
            .attr("r", radius)
            .attr("fill", color)
            .on("mouseover", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", radius * 1.05); // Povečaj krog

                tooltip
                    .style("opacity", 1)
                    .style("background-color", color)
                    .style("color", "white")
                    .html(`${name}: ${value}${prikaziEuro ? " €" : ""}`);
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", `${event.pageY - 40}px`)
                    .style("left", `${event.pageX + 20}px`);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", radius); // Vrni na prvotno velikost

                tooltip.style("opacity", 0);
            });

        // Dodajanje številke nad krogom z dinamično velikostjo pisave
        svg.append("text")
            .attr("x", currentX + radius)
            .attr("y", svgHeight / 2 - radius - 20) // Pozicija nad krogom
            .attr("text-anchor", "middle")
            .attr("fill", color) // Barva številke je enaka barvi kroga
            .attr("font-size", `${radius * 0.4}`) // Dinamična velikost pisave glede na polmer kroga
            .attr("font-weight", "bold")
            .text(index + 1); // Številka, ki označuje vrstni red

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
