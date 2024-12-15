import elasticsearch
from elasticsearch import helpers
import urllib3
import csv
from datetime import datetime
import unicodedata

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

username = 'elastic'
password = 'Burek123'

data = [
    {
        "file": "URSVS poklicna izpostavljenost delavcev.csv",
        "index": "mt-sevanje",
        "opts": { "delimiter": ";" },
        "mapping": {
            "properties": {
                "OSEBA": { "type": "keyword" },
                "PODJETJE": { "type": "keyword" },
                "DATUM_ZACETKA_MERITVE": { "type": "date" },
                "DATUM_KONCA_MERITVE": { "type": "date" },
                "REZULTAT_MERITVE": { "type": "float" },
                "DELOVNO_MESTO": { "type": "keyword" },
                "TIP": { "type": "keyword" },
            }
        }
    },
]

correction_dict = {
    "?I�?ENJE": "ČIŠČENJE",
    "?I�?ENJE, DEKONTAMINACIJA, ODPADKI": "ČIŠČENJE, DEKONTAMINACIJA, ODPADKI",
    "DIAGNOSTI?NA RADIOLOGIJA": "DIAGNOSTIČNA RADIOLOGIJA",
    "DR�AVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM": "DRŽAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM",
    "ELEKTRI?NO IN IN�TRUMENTACIJSKO VZDR�EVANJE": "ELEKTRIČNO IN INŠTRUMENTACIJSKO VZDRŽEVANJE",
    "GINEKOLOGIJA S PORODNI�TVOM": "GINEKOLOGIJA S PORODNIŠTVOM",
    "GRADBENI�TVO": "GRADBENIŠTVO",
    "INTERVENTNA KARDIOLOGIJA - IN�TRUMENTARKE": "INTERVENTNA KARDIOLOGIJA - INŠTRUMENTARKE",
    "IZOBRA�EVANJE": "IZOBRAŽEVANJE",
    "NUJNA MEDICINSKA POMO?": "NUJNA MEDICINSKA POMOČ",
    "OSTALE DR�AVNE INSTITUCIJE": "OSTALE DRŽAVNE INSTITUCIJE",
    "OSTALE IZOBRA�EVALNE USTANOVE": "OSTALE IZOBRAŽEVALNE USTANOVE",
    "OTRO�KA KIRURGIJA": "OTROŠKA KIRURGIJA",
    "PLASTI?NA KIRURGIJA": "PLASTIČNA KIRURGIJA",
    "POSPE�EVALNIKI": "POSPEŠEVALNIKI",
    "POOBLA�?ENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM": "POOBLAŠČENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM",
    "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTI?NIH MAS": "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTIČNIH MAS",
    "PROIZVODNJA ELEKTRI?NE IN OPTI?NE OPREME": "PROIZVODNJA ELEKTRIČNE IN OPTIČNE OPREME",
    "PROIZVODNJA HRANE, PIJA?, KRMIL IN TOBA?NIH IZDELKOV": "PROIZVODNJA HRANE, PIJAČ, KRMIL IN TOBAČNIH IZDELKOV",
    "PROIZVODNJA IZKLJU?NO FE IN IZDELKOV IN FE": "PROIZVODNJA IZKLJUČNO FE IN IZDELKOV IN FE",
    "PROIZVODNJA KEMIKALIJ, KEMI?NIH IZDELOKOV, UMETNIH VLAKEN": "PROIZVODNJA KEMIKALIJ, KEMIČNIH IZDELOKOV, UMETNIH VLAKEN",
    "PROIZVODNJA POHI�TVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLA�A": "PROIZVODNJA POHIŠTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLAŽA",
    "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOŽNIŠTVO IN TISKARSTVO": "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOŽNIŠTVO IN TISKARSTVO",
    "SERVIS IN VZDR�EVANJE": "SERVIS IN VZDRŽEVANJE",
    "SERVISNE SLU�BE IZVEN INDUSTRIJSKE PANOGE": "SERVISNE SLUŽBE IZVEN INDUSTRIJSKE PANOGE",
    "SLU�BA ZA VARSTVO PRED SEVANJEM": "SLUŽBA ZA VARSTVO PRED SEVANJEM",
    "SPLO�NA KIRURGIJA": "SPLOŠNA KIRURGIJA",
    "SPLO�NA PEDIATRIJA": "SPLOŠNA PEDIATRIJA",
    "SPLO�NO ZOBOZDRAVSTVO": "SPLOŠNO ZOBOZDRAVSTVO",
    "STOMATOLO�KA PROTETIKA": "STOMATOLOŠKA PROTETIKA",
    "STROJNO VZDR�EVANJE": "STROJNO VZDRŽEVANJE",
    "VI�JE IN VISOKO�OLSKA IZOBRA�EVALNA USTANOVA": "VIŠJE IN VISOKOŠOLSKA IZOBRAŽEVALNA USTANOVA",

    "KARDIOVASKULARNA  KIRURGIJA" : "KARDIOVASKULARNA KIRURGIJA",
    "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALO�NI�TVO IN TISKARSTVO" : "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOŽNIŠTVO IN TISKARSTVO",
    "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHI�TVA" : "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHIŠTVA",
    "INTERVENTNA KARDIOLOGIJA -ELEKTROFIZIOLOGIJA" : "INTERVENTNA KARDIOLOGIJA - ELEKTROFIZIOLOGIJA"
}

testing_dict = [
    "DELOVANJE REAKTORJA",
    "INTENZIVNA TERAPIJA V ANESTEZIOLOGIJI IN REANIMACIJI",
    "INDUSTRIJSKA RADIOGRAFIJA",
    "VETERINA",
    "OPERATERJI",
    "TRAVMATOLOGIJA",
    "PROMET",
    "OSTALE OBRAMBNE AKTIVNOSTI",
    "INTENZIVNA INTERNA MEDICINA (TERAPIJA)",
    "RADIOLOGIJA - INTERVENTNA",
    "OPERACIJSKA DVORANA",
    "DIAGNOSTIKA",
    "ANESTEZIOLOGIJA Z REANIMACIJO",
    "TERAPIJA IN DIAGNOSTIKA",
    "OSTALA UPORABA V MEDICINI",
    "RADIOLOGIJA - ANGIOGRAFIJA",
    "TELETERAPIJA",
    "NUKLEARNA MEDICINA",
    "NUKLEARNO MEDICINSKI LABORATORIJ",
    "DIAGNOSTIKA",
    "KEMIJA",
    "NUKLEARNO MEDICINSKI LABORATORIJ",
    "INTENZIVNA TERAPIJA DRUGA",
    "DELOVANJE REAKTORJA - OSTALO",
    "RAZISKAVE PRI JEDRSKEM GORIVNEM CIKLUSU",
    "RADIOLOGIJA - CT",
    "KARDIOLOGIJA V PEDIATRIJI",
    "ZOBNA RADIOLOGIJA",
    "ENDOSKOPSKA DIAGNOSTIKA",
    "ABDOMINALNA KIRURGIJA",
    "UROLOGIJA",
    "BRAHITERAPIJA",
    "TORAKALNA KIRURGIJA",
    "KARDIOLOGIJA V INTERNI MEDICINI",
    "VARSTVO PRED SEVANJEM",
    "INTENZIVNA TERAPIJA V PEDIATRIJI",
    "RAZISKOVALNI LABORATORIJ",
    "PROIZVODNJA KOVIN (RAZEN FE) IN PROIZVODNJA IZDELKOV IZ KOVIN (RAZEN FE)",
    "GASTROENTEROLOGIJA V INTERNI MEDICINI",
    "NEVROKIRURGIJA",
    "DENSITOMETRIJA",
    "OSTALA UPORABA V INDUSTRIJI",
    "OSTALO",
    "POLICIJA",
    "ANGIOLOGIJA V INTERNI MEDICINI",
    "PULMOLOGIJA V INTERNI MEDICINI",
    "PROIZVODNJA STROJEV IN NAPRAV",
    "RADIOLOGIJA - MAMOGRAFIJA",
    "ANGIOLOGIJA V INTERNI MEDICINI",
    "INTERVENTNA KARDIOLOGIJA - MERILKE",
    "RADIOLOGIJA - SKELET",
    "FUNKCIONALNA DIAGNOSTIKA",
    "INTERVENTNA KARDIOLOGIJA - HEMODINAMSKI PROCESI",
    "TURIZEM",
    "ORTOPEDIJA",
    "PULMOLOGIJA V PEDIATRIJI",
    "SODNA MEDICINA",
    "DELOVNO MESTO NEZNANO",
    "RUDNIK URANA"
]

def normalize_string(text):
    """Funkcija za normalizacijo besedila, da se odstranijo težave s kodiranjem."""
    return unicodedata.normalize('NFC', text)

def correct_job_titles(entry, correction_dict):
    """
    Funkcija popravi neustrezne vrednosti v polju DELOVNO_MESTO s pomočjo correction_dict.
    """
    job_title = entry.get("DELOVNO_MESTO", "")
    job_title = job_title.strip()

    # Normaliziramo besedilo, da odstranimo težave s kodiranjem
    normalized_job_title = normalize_string(job_title)

    # Preverimo, ali normalizirani naslov obstaja v slovarju
    if normalized_job_title in correction_dict:
        corrected_title = correction_dict[normalized_job_title]
        entry["DELOVNO_MESTO"] = corrected_title
        #print(corrected_title)
    #else:
        #if job_title not in testing_dict:
            #print(f"Ni najdeno v slovarju: '{job_title}'")
    return entry



def clean_data(data, mapping, correction_dict):
    cleaned_data = []
    for entry in data:
        skip_entry = False
        for field, value in entry.items():
            if value is None:
                continue
    
            if field == "TIP" and value == "ER":
                skip_entry = True
                break    
            
            if field == "REZULTAT_MERITVE":
                try:
                    numeric_value = float(value.replace(",", "."))
                    if numeric_value == 0:
                        skip_entry = True
                        break
                except ValueError:
                    print(f"Could not convert {field} value: {value}")
                    continue
            
            if field == "DELOVNO_MESTO":
                correct_job_titles(entry, correction_dict)

            field_type = mapping.get(field, {}).get("type")
            if field_type in ("float", "integer"):
                try:
                    entry[field] = float(value.replace(",", ".")) if field_type == "float" else int(value.replace(",", ""))
                except ValueError:
                    print(f"Error converting {field}: {value}")

            elif field_type == "date":
                try:
                    entry[field] = datetime.strptime(value, "%d.%m.%Y")
                except ValueError:
                    print(f"Error parsing date for {field}: {value}")
        
        if not skip_entry:
            cleaned_data.append(entry)

    return cleaned_data

def bulk_insert(data, index, batch_size=5000):
    for i in range(0, len(data), batch_size):
        print(f">>> Inserting {i} - {i + batch_size} records")
        try:
            helpers.bulk(es, data[i:i + batch_size], index=index)
        except Exception as e:
            print(f">>> Failed to insert {len(data[i:i + batch_size])} records")
            print(data[i:i + batch_size])
            print(e)

es = elasticsearch.Elasticsearch(
    ['https://localhost:9200'],
    basic_auth=(username, password),
    verify_certs=False
)

for d in data:
    print(f">>> Processing {d['file']}")

    if es.indices.exists(index=d['index']):
        es.indices.delete(index=d['index'])

    es.indices.create(index=d['index'], body={
        "mappings": {
            "properties": d['mapping']['properties'],
        }
    })

    with open(f"elastic/data/{d['file']}", "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f, fieldnames=list(d['mapping']['properties'].keys()), delimiter=';')
        data = [row for row in reader]
        data = data[1:]
        print(f">>> Read {len(data)} records")
        clean_data(data, d['mapping']['properties'], correction_dict)
        #bulk_insert(data, d['index'])









def find_unused_keys(correction_dict, data):
    """
    Funkcija preveri, kateri ključi v correction_dict niso bili nikoli uporabljeni.
    """
    used_keys = set()  # Set za shranjevanje ključev, ki so bili uporabljeni

    for entry in data:
        job_title = entry.get("DELOVNO_MESTO", "").strip()
        normalized_job_title = normalize_string(job_title)

        # Preverimo, če naslov delovnega mesta obstaja v correction_dict
        if normalized_job_title in correction_dict:
            used_keys.add(normalized_job_title)

    # Poiščemo ključe, ki niso bili uporabljeni
    unused_keys = set(correction_dict.keys()) - used_keys

    return unused_keys

# Klic funkcije za iskanje neuporabljenih ključev
unused_keys = find_unused_keys(correction_dict, data)

# Izpis rezultatov
if unused_keys:
    print("Ključi, ki niso bili nikoli uporabljeni:")
    for key in unused_keys:
        print(f"'{key}'")
else:
    print("Vsi ključi v correction_dict so bili uporabljeni.")
