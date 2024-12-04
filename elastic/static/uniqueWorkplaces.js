// Funkcija za pridobitev unikatnih delovnih mest
async function fetchUniqueWorkplaces() {
    try {
        const response = await fetch('/api/unique_workplaces');  // Pošlji GET zahtevo na server
        const data = await response.json();  // Preberi JSON odgovor


        const sortedData = sortAlphabetically(data); // Razvrsti delovna mesta
        const dropdown = document.getElementById("workplaceFilter");

        // Preverite, če so že bili podatki naloženi
        if (dropdown.childElementCount === 0) {  // Če ni nobenih možnosti (samo privzeta)
            // Dodaj privzeto možnost (Vsa delovna mesta)
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Vsa delovna mesta";
            dropdown.appendChild(defaultOption);

            // Dodaj vse unikatne delovne kraje v dropdown
            sortedData.forEach(workplace => {
                const option = document.createElement("option");
                option.value = workplace;
                option.textContent = workplace;
                dropdown.appendChild(option);
            });
        }

    } catch (error) {
        console.error("Napaka pri pridobivanju delovnih mest:", error);
    }
}

function sortAlphabetically(array) {
    return array.sort((a, b) => a.localeCompare(b, 'sl')); // Upoštevaj slovensko abecedo
}


let selectedWorkplaceExposure = "";

// Funkcija za posodobitev trenutne izbire v dropdownu
document.getElementById("workplaceFilter").addEventListener('change', function() {
    selectedWorkplaceExposure = this.value;  // Shranimo izbrano vrednost
    //console.log("Trenutno izbrano delovno mesto:", selectedWorkplaceExposure);
    //fetchExposure()
});