import elasticsearch
from elasticsearch import helpers
import urllib3
import csv
import difflib
from datetime import datetime

# Izključi opozorila za TLS
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Elasticsearch podatki
username = 'elastic'
password = 'Burek123'

correction_dict = {
    "DIAGNOSTI?NA RADIOLOGIJA": "DIAGNOSTIČNA RADIOLOGIJA",
    "?I�?ENJE": "ČIŠČENJE",
    "?I?ENJE": "ČIŠČENJE",
    "ViJE": "VIŠJE",
    "POOBLA�?ENE ORGANIZACIJE": "POOBLAŠČENE ORGANIZACIJE",
    "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOŽNIŠTVO IN TISKARSTVO": "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOŽNIŠTVO IN TISKARSTVO",
    "POOBLA�?ENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM": "POOBLAŠČENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM",
    "OSTALE DR�AVNE INSTITUCIJE": "OSTALE DRŽAVNE INSTITUCIJE",
    "PROIZVODNJA IZKLJU?NO FE IN IZDELKOV IN FE": "PROIZVODNJA IZKLJUČNO FE IN IZDELKOV IN FE",
    "SPLO�NO ZOBOZDRAVSTVO": "SPLOŠNO ZOBOZDRAVSTVO",
    "SERVISNE SLU�BE IZVEN INDUSTRIJSKE PANOGE": "SERVISNE SLUŽBE IZVEN INDUSTRIJSKE PANOGE",
    "IZOBRA�EVANJE": "IZOBRAŽEVANJE",
    "GRADBENI�TVO": "GRADBENIŠTVO",
    "VI�JE IN VISOKO�OLSKA IZOBRA�EVALNA USTANOVA": "VIŠJE IN VISOKOŠOLSKA IZOBRAŽEVALNA USTANOVA",
    "POSPE�EVALNIKI": "POSPEŠEVALNIKI",
    "OTRO�KA KIRURGIJA": "OTROŠKA KIRURGIJA",
    "SPLO�NA PEDIATRIJA": "SPLOŠNA PEDIATRIJA",
    "SPLO�NA KIRURGIJA": "SPLOŠNA KIRURGIJA",
    "PLASTI?NA KIRURGIJA": "PLASTIČNA KIRURGIJA",
    "?I�?ENJE, DEKONTAMINACIJA, ODPADKI": "ČIŠČENJE, DEKONTAMINACIJA, ODPADKI",
    "DR�AVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM": "DRŽAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM",
    "INTERVENTNA KARDIOLOGIJA - IN�TRUMENTARKE": "INTERVENTNA KARDIOLOGIJA - INŠTRUMENTARKE",
    "ELEKTRI?NO IN IN�TRUMENTACIJSKO VZDR�EVANJE": "ELEKTRIČNO IN INŠTRUMENTACIJSKO VZDRŽEVANJE",
    "GINEKOLOGIJA S PORODNI�TVOM": "GINEKOLOGIJA S PORODNIŠTVOM",
    "OSTALE IZOBRA�EVALNE USTANOVE": "OSTALE IZOBRAŽEVALNE USTANOVE",
    "PROIZVODNJA POHI�TVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLA�A": "PROIZVODNJA POHIŠTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLAŽA",
    "SERVIS IN VZDR�EVANJE": "SERVIS IN VZDRŽEVANJE",
    "SLU�BA ZA VARSTVO PRED SEVANJEM": "SLUŽBA ZA VARSTVO PRED SEVANJEM",
    "STOMATOLO�KA PROTETIKA": "STOMATOLOŠKA PROTETIKA",
    "STROJNO VZDR�EVANJE": "STROJNO VZDRŽEVANJE",
    "NUJNA MEDICINSKA POMO?": "NUJNA MEDICINSKA POMOČ",
    "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTI?NIH MAS": "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTIČNIH MAS",
    "PROIZVODNJA ELEKTRI?NE IN OPTI?NE OPREME": "PROIZVODNJA ELEKTRIČNE IN OPTIČNE OPREME",
    "PROIZVODNJA HRANE, PIJA?, KRMIL IN TOBA?NIH IZDELKOV": "PROIZVODNJA HRANE, PIJAČ, KRMIL IN TOBAČNIH IZDELKOV",
    "PROIZVODNJA KEMIKALIJ, KEMI?NIH IZDELOKOV, UMETNIH VLAKEN": "PROIZVODNJA KEMIKALIJ, KEMIČNIH IZDELOKOV, UMETNIH VLAKEN"
}

# Konfiguracija za uvoz podatkov
data_config = [
    {
        "file": "URSVS poklicna izpostavljenost delavcev.csv",
        "index": "mt-sevanje",
        "opts": {"delimiter": ";"},
        "mapping": {
            "properties": {
                "OSEBA": {"type": "keyword"},
                "PODJETJE": {"type": "keyword"},
                "DATUM_ZACETKA_MERITVE": {"type": "date"},
                "DATUM_KONCA_MERITVE": {"type": "date"},
                "REZULTAT_MERITVE": {"type": "float"},
                "DELOVNO_MESTO": {"type": "keyword"},
                "TIP": {"type": "keyword"},
            }
        },
    },
]

# Povezava na Elasticsearch
es = elasticsearch.Elasticsearch(
    ['https://localhost:9200'],
    basic_auth=(username, password),
    verify_certs=False
)


# Funkcija za popravljanje napačnih znakov v vrsticah
def clean_special_characters(entry):
    for field, value in entry.items():
        if isinstance(value, str):
            # Popravi znake z napačnimi kodiranji
            value = value.replace("�", "Š").replace("", "Š").replace("", "Ž").replace("", "Č").replace("", "Š")
            value = value.replace("", "Š").replace("", "Č").replace("", "Č").replace("", "Ž").replace("?", "Č")
            entry[field] = value
    return entry

# Funkcija za popravljanje nazivov z uporabo slovarja
def correct_job_titles(entry, correction_dict):
    job_title = entry.get("DELOVNO_MESTO", "")
    if job_title in correction_dict:
        entry["DELOVNO_MESTO"] = correction_dict[job_title]
    else:
        closest_match = difflib.get_close_matches(job_title, correction_dict.keys(), n=1, cutoff=0.8)
        if closest_match:
            entry["DELOVNO_MESTO"] = correction_dict[closest_match[0]]
    return entry

# Funkcija za čiščenje podatkov
def clean_data(data, mapping, correction_dict):
    cleaned_data = []
    for entry in data:
        skip_entry = False
        for field, value in entry.items():
            if value is None:
                continue
            
            # Preskoči vrste z TIP = ER
            if field == "TIP" and value == "ER":
                skip_entry = True
                break

            # Če rezultat meritve = 0, preskoči
            if field == "REZULTAT_MERITVE":
                try:
                    numeric_value = float(value.replace(",", "."))
                    if numeric_value == 0:
                        skip_entry = True
                        break
                except ValueError:
                    continue
            
            # Popravi posebne znake
            entry = clean_special_characters(entry)

            # Popravi naziv delovnega mesta
            entry = correct_job_titles(entry, correction_dict)

            # Čiščenje numeričnih polj
            field_type = mapping.get(field, {}).get("type")
            if field_type in ("float", "integer"):
                try:
                    entry[field] = float(value.replace(",", ".")) if field_type == "float" else int(value.replace(",", ""))
                except ValueError:
                    print(f"Napaka pri pretvorbi {field}: {value}")

            # Čiščenje datumskih polj
            elif field_type == "date":
                try:
                    entry[field] = datetime.strptime(value, "%d.%m.%Y")
                except ValueError:
                    print(f"Napaka pri razčlenjevanju datuma za {field}: {value}")
        
        if not skip_entry:
            cleaned_data.append(entry)

    return cleaned_data

# Funkcija za uvoz v Elasticsearch
def bulk_insert(data, index, batch_size=5000):
    for i in range(0, len(data), batch_size):
        print(f">>> Uvažam zapise {i} - {i + batch_size}")
        try:
            helpers.bulk(es, data[i:i + batch_size], index=index)
        except Exception as e:
            print(f"Napaka pri uvozu: {e}")
            print(data[i:i + batch_size])

# Procesiranje datotek
for d in data_config:
    print(f">>> Procesiram {d['file']}")

    # Izbriši obstoječ indeks, če obstaja
    if es.indices.exists(index=d['index']):
        es.indices.delete(index=d['index'])

    # Ustvari nov indeks
    es.indices.create(index=d['index'], body={"mappings": {"properties": d['mapping']['properties']}})

    # Odpri datoteko CSV
    with open(f"elastic/data/{d['file']}", "r", encoding='ISO-8859-1') as f:
        reader = csv.DictReader(f, fieldnames=list(d['mapping']['properties'].keys()), delimiter=';')
        data = [row for row in reader][1:]  # Preskoči glavo datoteke
        print(f">>> Prebrano {len(data)} zapisov")
        cleaned_data = clean_data(data, d['mapping']['properties'], correction_dict)
        bulk_insert(cleaned_data, d['index'])

print(">>> Obdelava končana.")
