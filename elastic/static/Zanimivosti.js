function ZeloZanimivo() {
    // Zanimivosti o sevanju v Sloveniji
    const zanimivosti = [
        "V Postojnski jami lahko koncentracija radona preseže 10.000 Bq/m³, medtem ko je povprečje na prostem le okoli 10 Bq/m³!",
        "Jedrski reaktor v NEK letno prepreči izpust približno 1,2 milijona ton CO2, kar je enako, kot bi odstranili 600.000 avtomobilov z naših cest!",
        "Zobozdravniki prejmejo manj sevanja v letu dni, kot nekdo, ki opravi samo en rentgen prsnega koša!",
        "Radiologi imajo v Sloveniji pravico do dodatnega 14-dnevnega dopusta, da zmanjšajo učinke izpostavljenosti sevanju!",
        "Ernest Rutherford je leta 1899 pri raziskavah sevanja radija opazil, da se iz radija sprošča plin, ki ga je kasneje poimenoval radon!"
    ];
 
    const naslovi = [
        "Postojnska jama",
        "Jedrski reaktor",
        "Rentgen zob",
        "Radiologi",
        "Radon"
    ];

    // Barve za kvadrate
    const barColors = ["#a99494", "#1aa86c", "#2dd1c0", "#1e46c6", "#9b2020"];

    // Nastavitve SVG platna
    const svgWidth = 1000;
    const svgHeight = 500;
    const svg = d3.select("#visualization")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Čiščenje obstoječih elementov
    d3.select("#visualization").html("");

    const loadingText = document.getElementById("loading-text");
    loadingText.style.display = "block";
    loadingText.innerText = `Zanimivosti o sevanju v Sloveniji`;

    // Nastavitve za kvadrate
    const size = 145; // Velikost kvadrata
    const gap = 20; // Razmik med kvadrati
    const cornerRadius = 20; // Začetni polmer okroglega roba

    // Začetna koordinata X in Y za prvi kvadrat
    let currentX = (svgWidth - (zanimivosti.length * size + (zanimivosti.length - 1) * gap)) / 2;
    let currentY = svgHeight / 2 - size / 2;

    // Dodajanje tooltipa
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("padding", "5px 10px")
        .style("background-color", "white")
        .style("color", "black")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("max-width", "200px")
        .style("text-align", "center");

    // Funkcija za generiranje poti kvadrata z okroglimi robovi
    function generatePuzzlePath(x, y, size, cornerRadius) {
        return `M ${x + cornerRadius},${y} 
                h ${size - 2 * cornerRadius} 
                a ${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},${cornerRadius} 
                v ${size - 2 * cornerRadius} 
                a ${cornerRadius},${cornerRadius} 0 0 1 ${-cornerRadius},${cornerRadius} 
                h ${-(size - 2 * cornerRadius)} 
                a ${cornerRadius},${cornerRadius} 0 0 1 ${-cornerRadius},${-cornerRadius} 
                v ${-(size - 2 * cornerRadius)} 
                a ${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},${-cornerRadius} Z`;
    }

    // Risanje kvadratov in črt
    zanimivosti.forEach((zanimivost, index) => {
        // Izračunaj pozicijo kvadrata
        const x = currentX + index * (size + gap);
        const y = currentY;

        // Dodaj puzzle element (kvadrat z okroglimi robovi)
        const puzzlePiece = svg.append("path")
            .attr("d", generatePuzzlePath(x, y, size, cornerRadius))
            .attr("fill", barColors[index])
            .style("opacity", 0) // Začetna opaciteta (nevidno)
            .style("transition", "all 0.3s ease") // Animacija za transformacije
            .on("mouseover", function () {
                tooltip
                    .style("opacity", 1)
                    .style("background-color", barColors[index])
                    .style("color", "white")
                    .html(zanimivost);

                d3.select(this)
                    .attr("d", generatePuzzlePath(x, y, size, 35)); // Zmanjšana zaobljenost
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", `${event.pageY - 60}px`)
                    .style("left", `${event.pageX + 20}px`);
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);

                d3.select(this)
                    .attr("d", generatePuzzlePath(x, y, size, cornerRadius)); // Povrnjena zaobljenost
            });

        // Dodajanje naslova na sredino puzzla
        svg.append("text")
            .attr("x", x + size / 2)
            .attr("y", y + size / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "14px")  // Povečana velikost pisave
            .attr("font-weight", "bold")
            .attr("dy", "0.35em")
            .text(naslovi[index])
            .style("opacity", 0) // Začetna opaciteta besedila (nevidno)
            .transition()
            .duration(500) // Hitro fade-in
            .style("opacity", 1); // Postopno postane vidno

        // Dodaj črto med kvadrati
        if (index < zanimivosti.length - 1) {
            const nextX = currentX + (index + 1) * (size + gap);

            // Dodaj debelo črto med kvadrati
            svg.append("line")
                .attr("x1", x + size) // Začetna točka
                .attr("y1", y + size / 2) // Na sredini kvadrata
                .attr("x2", nextX) // Končna točka
                .attr("y2", y + size / 2) // Na sredini naslednjega kvadrata
                .attr("stroke", barColors[index]) // Barva črte
                .attr("stroke-width", 9) // Debelina črte
                .style("opacity", 0) // Začetna opaciteta (nevidno)
                .transition()
                .duration(500) // Hitro fade-in
                .style("opacity", 1); // Postopno postane vidno
        }

        // Fade-in za kvadrat
        puzzlePiece.transition()
            .duration(500) // Hitro fade-in
            .style("opacity", 1); // Postopno postane vidno
    });
}
