async function ReaktorRadiologi() {
    // Zanimivosti o sevanju v Sloveniji
    const zanimivosti = [
        "Nuklearna fisija je proces v jedrskem reaktorju, pri katerem se težka atomska jedra razdelijo in sprostijo energijo ter ionizirajoče sevanje, kot so nevtroni in gama žarki. POZOR: Fisija povzroča veliko tveganje za raka pljuč in ščitnice ter levkemije!"
    ];

    const naslovi = [
        "NUKLEARNA FISIJA"
    ];

    // Barve za kvadrate
    const barColors = ["#c11717"];

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
    loadingText.innerText = `Nuklearna fisija - noro in osupljivo!`;

    // Nastavitve za kvadrate
    const size = 320; // Velikost kvadrata
    const gap = 20; // Razmik med kvadrati
    const cornerRadius = 40; // Začetni polmer okroglega roba

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
                    .style("background-color", "#a70000") // Barva tooltipa
                    .style("color", "white")
                    .html(zanimivost.replace("POZOR:", "<strong>POZOR:</strong>"));

                d3.select(this)
                    .attr("fill", "#bc1414") // Spremeni barvo kvadrata
                    .attr("d", generatePuzzlePath(x, y, size, 0)); // Zmanjšana zaobljenost
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", `${event.pageY - 60}px`)
                    .style("left", `${event.pageX + 20}px`);
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);

                d3.select(this)
                    .attr("fill", barColors[index]) // Povrni prvotno barvo kvadrata
                    .attr("d", generatePuzzlePath(x, y, size, cornerRadius)); // Povrnjena zaobljenost
            });

        // Dodajanje naslova na sredino puzzla
        svg.append("text")
            .attr("x", x + size / 2)
            .attr("y", y + size / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "22px")  // Povečana velikost pisave
            .attr("font-weight", "bold")
            .attr("dy", "0.35em")
            .text(naslovi[index])
            .style("opacity", 0) // Začetna opaciteta besedila (nevidno)
            .transition()
            .duration(500) // Hitro fade-in
            .style("opacity", 1); // Postopno postane vidno

        // Fade-in za kvadrat
        puzzlePiece.transition()
            .duration(500) // Hitro fade-in
            .style("opacity", 1); // Postopno postane vidno
    });
}
