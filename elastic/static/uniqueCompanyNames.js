async function fetchUniqueCompanies() {
    try {
        // Pošljemo zahtevo na "/api/imena_podjetij"
        const response = await fetch('/api/imena_podjetij');
        const data = await response.json();

        // Razvrstimo podjetja po abecedi
        const sortedData = sortAlphabetically(data);
        const dropdown = document.getElementById("company_filter");

        // Če je dropdown prazen ali vsebuje samo privzeto opcijo, dodaj nove
        if (dropdown.childElementCount === 1) {
            sortedData.forEach(company => {
                const option = document.createElement("option");
                option.value = company;
                option.textContent = company;
                dropdown.appendChild(option);
            });
        }

    } catch (error) {
        console.error("Napaka pri pridobivanju imen podjetij:", error);
    }
}

function sortAlphabetically(array) {
    return array.sort((a, b) => a.localeCompare(b, 'sl')); // Razvrsti po slovenski abecedi
}
