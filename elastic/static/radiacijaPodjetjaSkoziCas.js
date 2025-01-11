async function radiacijaPodjetjaSkoziCas(companyData, globalMaxRadiation = 0.5) {
    // Priprava podatkov
    const driving = companyData.starting_dates.map((d, i) => ({
        date: new Date(d),
        radiation: companyData.radiations[i]
    }));

    // Sortiraj po datumu
    driving.sort((a, b) => a.date - b.date);

    // Dimenzije za dinamičen okvir
    const container = document.getElementById("visualization"); // Zagotovite, da imate ta element
    const width = container.clientWidth;
    const height = 500;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 60;
    const marginLeft = 40;

    const n = driving.length;

    // X lestvica: od 1 do n (zaporedna številka meritve)
    const x = d3.scaleLinear()
        .domain([1, n])
        .range([marginLeft, width - marginRight]);

    // Y lestvica: Fixed range from 0 to `globalMaxRadiation`
    const y = d3.scaleLinear()
        .domain([0, globalMaxRadiation])
        .range([height - marginBottom, marginTop]);

    // Ustvarimo SVG
    const svg = d3.select("#visualization")
        .append("svg")
        .attr("width", "100%") // Raztegnemo čez širino kontejnerja
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMinYMin meet");

    // Dodamo tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("font-family", "sans-serif")
        .style("font-size", "10px");

    // Definiramo črto
    const line = d3.line()
        .curve(d3.curveCatmullRom)
        .x((d, i) => x(i + 1))
        .y(d => y(d.radiation));

    // Dodamo os X
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(n))
        .call(g => g.select(".domain").remove())
        .selectAll("text")
        .style("font-size", "10px");

    // Dodamo os Y (fixed range)
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "10px");

    // Dodamo črto za povezovanje točk
    svg.append("path")
        .datum(driving)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", line)
        .attr("stroke-dasharray", function () {
            const totalLength = this.getTotalLength();
            return `0,${totalLength}`;
        })
        .transition()
        .duration(5000)
        .ease(d3.easeLinear)
        .attr("stroke-dasharray", function () {
            const totalLength = this.getTotalLength();
            return `${totalLength},${totalLength}`;
        });

    // Dodamo točke
    svg.append("g")
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(driving)
        .join("circle")
        .attr("cx", (d, i) => x(i + 1))
        .attr("cy", d => y(d.radiation))
        .attr("r", 3)
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`<strong>Datum:</strong> ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>
                       <strong>Radiacija:</strong> ${d.radiation.toFixed(2)} mSv`);
        })
        .on("mousemove", event => {
            tooltip.style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });

    // Dodamo vodoravno rdečo črto za threshold
    const threshold = 0.3;
    svg.append("line")
        .attr("x1", marginLeft)
        .attr("y1", y(threshold))
        .attr("x2", width - marginRight)
        .attr("y2", y(threshold))
        .attr("stroke", "red")
        .attr("stroke-dasharray", "4 4")
        .attr("stroke-width", 1.5);

    svg.append("text")
        .attr("x", width - marginRight - 10)
        .attr("y", y(threshold) - 5)
        .attr("text-anchor", "end")
        .attr("font-size", "10px")
        .attr("fill", "red")
        .text(`Threshold: ${threshold} nSv`);

    return svg.node();
}
