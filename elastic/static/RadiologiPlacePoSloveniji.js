function RadioloskePlace() {
    // Definirani podatki za radiologe
    const RadiologiP = {
        "UKC Maribor": [41, 215545, 5257, 10991],
        "SB Celje": [6, 45417, 7570, 4145],
        "SB Novo mesto": [7, 50825, 7261, 7756],
        "SB Izola": [11, 160000, 6257, 11188],
        "SB Murska Sobota": [4, 25655, 6414, 9329],
        "SB Nova Gorica": [10, 68086, 6809, 12858]
    };

    // Barve iz slike
    const barColors = ["#1E0E64", "#2B1B96", "#482FDF", "#5A68F2", "#8CA5F7", "#A9B9F9"];

    // Pridobimo izbrano vrednost
    const select = document.getElementById("radiologi");
    const izbranaVrednost = parseInt(select.value);

    // Izpis besedila "Nalaganje podatkov"
    const loadingText = document.getElementById("loading-text");
    loadingText.style.display = "block";
    loadingText.innerText = select.options[select.selectedIndex].text;

    // Pripravimo podatke za vizualizacijo (sortiramo glede na izbrano vrednost)
    const sortedData = Object.entries(RadiologiP)
        .sort((a, b) => b[1][izbranaVrednost] - a[1][izbranaVrednost]); // Sortiranje od največje do najmanjše

    // Dimenzije SVG
    const width = 940;
    const totalHeight = 500;
    const barWidths = width;
    const barHeights = [130, 105, 90, 70, 60, 50]; // Višine od največjega proti najmanjšemu

    // Dinamično izračunane velikosti pisave
    const baseFontSize = 40; // Največja velikost pisave
    const fontScaleFactor = 0.8; // Faktor zmanjšanja pisave

    // Počistimo prejšnjo vizualizacijo
    d3.select("#visualization").selectAll("*").remove();

    // Ustvarimo SVG
    const svg = d3.select("#visualization")
        .attr("width", width)
        .attr("height", totalHeight)
        .style("display", "block");

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("font-size", "1.2rem")
        .style("display", "none")
        .style("pointer-events", "none");

    // Dodamo pravokotnike in besedila
    let yOffset = 0; // Za vertikalni odmik

    sortedData.forEach((d, i) => {
        const vrednost = d[1][izbranaVrednost];

        // Dinamično izračunamo velikost pisave glede na višino pravokotnika
        const fontSize = `${baseFontSize * Math.pow(fontScaleFactor, i)}px`;

        // Preverimo, ali je izbrana vrednost 2, 3 ali 4 (to pomeni, da so vrednosti v evrih)
        let valueText = vrednost.toLocaleString();
        if (izbranaVrednost === 1 || izbranaVrednost === 2 || izbranaVrednost === 3) {
            valueText += " €"; // Dodamo evro znak
        }

        // Dodamo skupino za vsak pravokotnik in besedilo
        const group = svg.append("g")
            .attr("transform", `translate(0, ${yOffset})`);

        // Dodamo pravokotnik
        group.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", barWidths)
            .attr("height", barHeights[i])
            .attr("fill", barColors[i])
            .on("mouseover", function (event) {
                // Nastavimo ozadje tooltipa na barvo trenutnega pravokotnika
                tooltip.style("background", barColors[i]) // Barva tooltipa se ujema z barvo pravokotnika
                    .style("display", "block")
                    .html(`
                        <strong>${d[0]}</strong><br>
                        Vrednost: ${valueText}<br>
                    `);

                // Prilagodimo dimenzije tooltipa glede na vsebino
                const tooltipWidth = tooltip.node().offsetWidth;
                const tooltipHeight = tooltip.node().offsetHeight;

                // Dodamo pravokotnik ozadja z dinamično velikostjo
                tooltip.insert("rect")
                    .attr("x", -5)
                    .attr("y", -5)
                    .attr("width", tooltipWidth + 10)
                    .attr("height", tooltipHeight + 10)
                    .attr("fill", barColors[i]) // Barva ozadja se ujema z barvo pravokotnika
                    .attr("rx", 5)  // Zaokroženi robovi
                    .attr("ry", 5); // Zaokroženi robovi
            })
            .on("mousemove", function (event) {
                tooltip.style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
                tooltip.select("rect").remove(); // Odstranimo pravokotnik ozadja, ko je miška zunaj
            });

        // Dodamo besedilo (ime bolnice)
        group.append("text")
            .attr("x", barWidths / 2)
            .attr("y", barHeights[i] / 2)
            .attr("dy", ".35em")
            .attr("fill", "white")
            .attr("font-size", fontSize) // Dinamična velikost pisave
            .attr("font-weight", "bold")
            .attr("text-anchor", "middle")
            .text(d[0]);

        // Povečamo yOffset za naslednji pravokotnik
        yOffset += barHeights[i];
    });
}
