// Funkcija za pridobitev unikatnih delovnih mest
async function fetchUniqueWorkplaces() {
    try {
        const response = await fetch('/api/unique_workplaces');  // Pošlji GET zahtevo na server
        const data = await response.json();  // Preberi JSON odgovor

        // Preverite, ali so podatki v obliki seznama
        if (Array.isArray(data)) {
            const dropdown = document.getElementById("workplaceFilter");

            // Preverite, če so že bili podatki naloženi
            if (dropdown.childElementCount === 0) {  // Če ni nobenih možnosti (samo privzeta)
                // Dodaj privzeto možnost (Vsa delovna mesta)
                const defaultOption = document.createElement("option");
                defaultOption.value = "";
                defaultOption.textContent = "Vsa delovna mesta";
                dropdown.appendChild(defaultOption);

                // Dodaj vse unikatne delovne kraje v dropdown
                data.forEach(workplace => {
                    const option = document.createElement("option");
                    option.value = workplace;
                    option.textContent = workplace;
                    dropdown.appendChild(option);
                });
            }
        } else {
            console.error("Prejeti podatki niso v pričakovani obliki.");
        }
    } catch (error) {
        console.error("Napaka pri pridobivanju delovnih mest:", error);
    }
}

// Funkcija za posodobitev trenutne izbire v dropdownu
document.getElementById("workplaceFilter").addEventListener('change', function() {
    selectedWorkplaceExposure = this.value;  // Shranimo izbrano vrednost
    //console.log("Trenutno izbrano delovno mesto:", selectedWorkplaceExposure);
});