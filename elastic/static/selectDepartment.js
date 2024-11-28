let departments = []; // Tu bomo shranili seznam oddelkov iz baze

// Pridobi seznam oddelkov iz API-ja in ga prikaži v dropdown
function fetchDepartments() {
    fetch('/api/get_departments') // Predpostavljamo, da imaš API endpoint za pridobitev seznamov
        .then(response => response.json())
        .then(data => {
            departments = data.departments; // API mora vrniti seznam oddelkov kot JSON
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

// Pošlji zahtevo za podatke za izbrano delovno mesto
function fetchDepartmentData() {
    const selectedDept = document.getElementById('department-input').value;
    if (!selectedDept) {
        alert('Prosimo, izberite delovno mesto.');
        return;
    }

    fetch(`/api/radiation_changes?department=${encodeURIComponent(selectedDept)}`)
        .then(response => response.json())
        .then(data => {
            console.log('Podatki za izbrano delovno mesto:', data);
            // Tukaj lahko dodaš logiko za prikaz grafov ali drugih vizualizacij
        })
        .catch(error => console.error('Napaka pri pridobivanju podatkov:', error));
}

// Ob nalaganju strani pridobi seznam oddelkov
document.addEventListener('DOMContentLoaded', fetchDepartments);
