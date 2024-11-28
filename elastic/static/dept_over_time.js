// Globalna spremenljivka za shranjevanje vseh oddelkov
let departments = [];

// Pridobi seznam oddelkov iz API-ja in ga prikaži v dropdown
function fetchDepartments() {
    fetch('/api/get_departments')
        .then(response => response.json())
        .then(data => {
            departments = data.departments; // Shranimo seznam oddelkov
            populateDropdown(departments);
        })
        .catch(error => console.error('Napaka pri pridobivanju oddelkov:', error));
}

// Napolni dropdown z oddelki
function populateDropdown(departmentList) {
    const dropdown = document.getElementById('department-dropdown');
    dropdown.innerHTML = ''; // Počisti prejšnje vrednosti
    departmentList.forEach(department => {
        const option = document.createElement('option');
        option.value = department;
        option.textContent = department;
        dropdown.appendChild(option);
    });
}

// Filtriraj seznam glede na vnos v input
function filterDepartments() {
    const query = document.getElementById('department-input').value.toLowerCase();
    const filtered = departments.filter(dept => dept.toLowerCase().includes(query));
    populateDropdown(filtered);
}

// Ko uporabnik izbere iz dropdowna, prenesi ime v input polje
function selectDepartment() {
    const dropdown = document.getElementById('department-dropdown');
    const input = document.getElementById('department-input');
    input.value = dropdown.value; // Nastavi izbrano vrednost
}

// Pridobi in prikaži podatke za izbrani oddelek
function fetchAndRenderDepartmentChart() {
    const selectedDept = document.getElementById('department-input').value;
    if (!selectedDept) {
        alert('Prosimo, izberite delovno mesto.');
        return;
    }

    fetch(`/api/radiation_changes?department=${encodeURIComponent(selectedDept)}`)
        .then(response => response.json())
        .then(data => {
            if (data.radiation_changes[selectedDept] && data.radiation_changes[selectedDept].length > 0) {
                renderLineChart(data.radiation_changes[selectedDept]);
            } else {
                alert('Za izbrani oddelek ni podatkov.');
            }
        })
        .catch(error => console.error('Napaka pri pridobivanju podatkov:', error));
}

// Funkcija za izris grafa z D3.js
function renderLineChart(data) {
    // Dimenzije grafa
    const width = 928;
    const height = 720;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;

    // Počisti prejšnji graf
    const visualization = document.getElementById('visualization');
    visualization.innerHTML = '';

    // Pripravi SVG
    const svg = d3.select(visualization)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Nastavi skale
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.chunk)).nice()
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.average_radiation)).nice()
        .range([height - marginBottom, marginTop]);

    // Definiraj linijo
    const line = d3.line()
        .curve(d3.curveCatmullRom)
        .x(d => x(d.chunk))
        .y(d => y(d.average_radiation));

    // Dodaj osi
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    // Dodaj linijo
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2.5)
        .attr("d", line);

    // Dodaj točke
    svg.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.chunk))
        .attr("cy", d => y(d.average_radiation))
        .attr("r", 4)
        .attr("fill", "blue");
}

// Ob nalaganju strani pridobi seznam oddelkov
document.addEventListener('DOMContentLoaded', fetchDepartments);
