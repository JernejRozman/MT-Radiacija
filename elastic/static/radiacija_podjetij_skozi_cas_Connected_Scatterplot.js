// Predpostavljamo, da imate funkcijo radiacijaPodjetjaSkoziCas(companyData) že definirano,
// kot v prejšnjem odgovoru.

async function fetchAndDrawCompanyData(selectedCompany) {
    // Prikažemo sporočilo o nalaganju (po želji)
    document.getElementById("loading-text").style.display = "block";
    document.getElementById("loading-text").innerText = "Nalaganje podatkov...";

    try {
        // Pridobimo podatke
        const response = await fetch('http://localhost:8080/api/avg_radiacija_podjetij_po_datumih');
        const allData = await response.json();
        document.getElementById("loading-text").style.display = "none";

        // allData je oblikovan kot:
        // [
        //   {
        //     "company": "XXX",
        //     "starting_dates": [...],
        //     "radiations": [...]
        //   },
        //   ...
        // ]

        // Filtriramo podatke za izbrano podjetje
        const companyData = allData.find(d => d.company === selectedCompany);

        if (!companyData) {
            console.error("Ni podatkov za izbrano podjetje:", selectedCompany);
            return; // Ne nadaljujemo, če nimamo podatkov
        }

        // Očistimo prejšnjo vizualizacijo
        d3.select("#visualization").html("");

        // Narišemo graf s predhodno definirano funkcijo
        const chart = await radiacijaPodjetjaSkoziCas(companyData);
        document.getElementById("visualization").appendChild(chart);

    } catch (error) {
        document.getElementById("loading-text").innerText = "Napaka pri pridobivanju podatkov";
        console.error("Napaka pri pridobivanju podaptkov:", error);
    }
}

// Primer event listenerja za dropdown, kjer ob spremembi pokličemo funkcijo
document.getElementById('company_filter').addEventListener('change', function() {
    const selectedCompany = this.value;
    if (selectedCompany) {
        fetchAndDrawCompanyData(selectedCompany);
    }
});
