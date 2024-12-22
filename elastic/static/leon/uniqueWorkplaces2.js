// Slovar popravkov za delovna mesta
const correctionDictionary = {
    "?I\u008a?ENJE" : "CISCENJE",
    "?I\u008a?ENJE, DEKONTAMINACIJA, ODPADKI": "ČIŠČENJE, DEKONTAMINACIJA, ODPADKI",
    "DIAGNOSTI?NA RADIOLOGIJA": "DIAGNOSTIČNA RADIOLOGIJA",
    "DIAGNOSTI\u010cNA RADIOLOGIJA": "DIAGNOSTIČNA RADIOLOGIJA",
    "DR\u008eAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM": "DRŽAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM",
    "DR\u017dAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM": "DRŽAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM",
    "ELEKTRI?NO IN IN\u008aTRUMENTACIJSKO VZDR\u008eEVANJE": "ELEKTRIČNO IN INŠTRUMENTACIJSKO VZDRŽEVANJE",
    "ELEKTRI\u010cNO IN IN\u0160TRUMENTACIJSKO VZDR\u017dEVANJE": "ELEKTRIČNO IN INŠTRUMENTACIJSKO VZDRŽEVANJE",
    "GINEKOLOGIJA S PORODNI\u008aTVOM": "GINEKOLOGIJA S PORODNIŠTVOM",
    "GINEKOLOGIJA S PORODNIŠTVOM": "GINEKOLOGIJA S PORODNIŠTVOM",
    "GRADBENI\u008aTVO": "GRADBENIŠTVO",
    "GRADBENIŠTVO": "GRADBENIŠTVO",
    "INTERVENTNA KARDIOLOGIJA - IN\u008aTRUMENTARKE": "INTERVENTNA KARDIOLOGIJA - INŠTRUMENTARKE",
    "INTERVENTNA KARDIOLOGIJA - INŠTRUMENTARKE": "INTERVENTNA KARDIOLOGIJA - INŠTRUMENTARKE",
    "IZOBRA\u008eEVANJE": "IZOBRAŽEVANJE",
    "IZOBRAŽEVANJE": "IZOBRAŽEVANJE",
    "KARDIOLOGIJA V INTERNI MEDICINI": "KARDIOLOGIJA V INTERNI MEDICINI",
    "KARDIOVASKULARNA KIRURGIJA": "KARDIOVASKULARNA KIRURGIJA",
    "KEMIJA": "KEMIJA",
    "NUJNA MEDICINSKA POMO?": "NUJNA MEDICINSKA POMOČ",
    "NUJNA MEDICINSKA POMOČ": "NUJNA MEDICINSKA POMOČ",
    "NUKLEARNA MEDICINA": "NUKLEARNA MEDICINA",
    "OBDELAVA IN PREDELAVA LESA": "OBDELAVA IN PREDELAVA LESA",
    "PROIZVODNJA IZDELKOV IZ GUME IN PLASTI?NIH MAS": "PROIZVODNJA IZDELKOV IZ GUME IN PLASTIČNIH MAS",
    "PROIZVODNJA IZDELKOV IZ GUME IN PLASTIČNIH MAS": "PROIZVODNJA IZDELKOV IZ GUME IN PLASTIČNIH MAS",
    "PROIZVODNJA DRUGIH NEKOVINSKIH MINERALNIH IZDELKOV": "PROIZVODNJA DRUGIH NEKOVINSKIH MINERALNIH IZDELKOV",
    "PROIZVODNJA ELEKTRI?NE IN OPTI?NE OPREME": "PROIZVODNJA ELEKTRIČNE IN OPTIČNE OPREME",
    "PROIZVODNJA ELEKTRIČNE IN OPTIČNE OPREME": "PROIZVODNJA ELEKTRIČNE IN OPTIČNE OPREME",
    "RADIOLOGIJA - ANGIOGRAFIJA": "RADIOLOGIJA - ANGIOGRAFIJA",
    "RADIOLOGIJA - CT": "RADIOLOGIJA - CT",
    "RADIOLOGIJA - INTERVENTNA": "RADIOLOGIJA - INTERVENTNA",
    "RADIOLOGIJA - MAMOGRAFIJA": "RADIOLOGIJA - MAMOGRAFIJA",
    "RADIOLOGIJA - SKELET": "RADIOLOGIJA - SKELET",
    "RADIOLOGIJA - ULTRAZVOK": "RADIOLOGIJA - ULTRAZVOK",
    "REVMATOLOGIJA V INTERNI MEDICINI": "REVMATOLOGIJA V INTERNI MEDICINI",
    "SERVIS IN VZDR\u008eEVANJE": "SERVIS IN VZDRŽEVANJE",
    "SERVIS IN VZDRŽEVANJE": "SERVIS IN VZDRŽEVANJE",
    "SPLO\u008aNA KIRURGIJA": "SPLOŠNA KIRURGIJA",
    "SPLOŠNA KIRURGIJA": "SPLOŠNA KIRURGIJA",
    "STROJNO VZDR\u008eEVANJE": "STROJNO VZDRŽEVANJE",
    "STROJNO VZDRŽEVANJE": "STROJNO VZDRŽEVANJE",
    "VIJE IN VISOKOOLSKA IZOBRAEVALNA USTANOVA" : "VIŠJE IN VISOKOŠOLSKA IZOBRAŽEVALNA USTANOVA",
    "STOMATOLOKA PROTETIKA" : "STOMATOLOŠKA PROTETIKA",
    "SPLONO ZOBOZDRAVSTVO" : "SPLOŠNO ZOBOZDRAVSTVO",
    "SPLONA PEDIATRIJA" : "SPLOŠNA PEDIATRIJA",
    "SLUBA ZA VARSTVO PRED SEVANJEM" : "SLUŽBA ZA VARSTVO PRED SEVANJEM",
    "PROIZVODNJA POHITVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLAA" : "PROIZVODNJA POHIŠTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLAŽA",
    "POSPEEVALNIKI" : "POSPEŠEVALNIKI",
    "POOBLA?ENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM" : "POOBLAŠČENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM",
    "OSTALE DRAVNE INSTITUCIJE" : "OSTALE DRŽAVNE INSTITUCIJE",
    "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHITVA" : "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHIŠTVA",
    "ILNA KIRURGIJA" : "ŽILNA KIRURGIJA",
    "OTROKA KIRURGIJA" : "OTROŠKA KIRURGIJA",
    "PLASTI?NA KIRURGIJA" : "PLASTIČNA KIRURGIJA",
    "SERVISNE SLUBE IZVEN INDUSTRIJSKE PANOGE" : "SERVISNE SLUŽBE IZVEN INDUSTRIJSKE PANOGE",
    "PROIZVODNJA KEMIKALIJ, KEMI?NIH IZDELOKOV, UMETNIH VLAKEN" : "PROIZVODNJA KEMIKALIJ, KEMIČNIH IZDELOKOV, UMETNIH VLAKEN",
    "PROIZVODNJA IZKLJU?NO FE IN IZDELKOV IN FE" : "PROIZVODNJA IZKLJUčNO FE IN IZDELKOV IN FE",
    "PROIZVODNJA HRANE, PIJA?, KRMIL IN TOBA?NIH IZDELKOV" : "PROIZVODNJA HRANE, PIJAČ, KRMIL IN TOBAČNIH IZDELKOV",
    "OSTALE IZOBRAEVALNE USTANOVE" : "OSTALE IZOBRAŽEVALNE USTANOVE",
    "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTI?NIH MAS" : "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTIČNIH MAS",
    "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALONITVO IN TISKARSTVO" : "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOŽNIŠTVO IN TISKARSTVO"


};

// Funkcija za popravljanje vrednosti s slovarjem popravkov
function correctWorkplaces(data) {
    const correctedData = data.map(item => correctionDictionary[item] || item);

    // Preverimo neuporabljene ključe
    const unusedKeys = checkUnusedKeys(correctionDictionary, data);
    
    /*if (unusedKeys.length > 0) {
        console.log("Neuporabljeni ključi v slovarju:", unusedKeys);
    } else {
        console.log("Vsi ključi so bili uporabljeni.");
    }*/
    const uniqueCorrectedData = [...new Set(correctedData)];


    return uniqueCorrectedData;
}

// Funkcija za preverjanje neuporabljenih ključev v slovarju popravkov
function checkUnusedKeys(correctionDictionary, data) {
    // Ustvari seznam vseh ključev v slovarju
    const allKeys = Object.keys(correctionDictionary);

    // Ustvari seznam vseh uporabljenih ključev (tistih, ki so bili uporabljeni pri popravljanju)
    const usedKeys = data.map(item => correctionDictionary[item]).filter(item => item !== item);  // Seznam popravljeni elementov

    // Izločimo unikatne uporabljene ključe (ki so bili dejansko spremenjeni)
    const uniqueUsedKeys = [...new Set(usedKeys)];

    // Poiščemo ključe, ki niso bili uporabljeni
    const unusedKeys = allKeys.filter(key => !uniqueUsedKeys.includes(key));

    // Vrnemo seznam neuporabljenih ključev
    return unusedKeys;
}

// Funkcija za pridobitev unikatnih delovnih mest
async function fetchUniqueWorkplaces() {
    try {
        const response = await fetch('/api/unique_workplaces'); // Pošlji GET zahtevo na server
        const data = await response.json(); // Preberi JSON odgovor

        // Odstrani podvojene vrednosti
        const uniqueData = [...new Set(data)];

        // Popravi vrednosti s slovarjem popravkov
        const correctedData = correctWorkplaces(uniqueData);

        // Razvrsti delovna mesta po abecedi
        const sortedData = sortAlphabetically(correctedData);

        const dropdown = document.getElementById("workplaceFilter");

        // Preveri, če so že bili podatki naloženi
        if (dropdown.childElementCount === 0) {
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
                console.log(workplace)
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
});
