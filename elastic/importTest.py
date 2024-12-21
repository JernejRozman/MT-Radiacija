import elasticsearch
from elasticsearch import helpers
import urllib3
import csv
from datetime import datetime
import unicodedata
import re

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

username = 'elastic'
password = 'Burek123'

data = [
    {
        "file": "testMTUTF8.csv",
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
    "?I\uFFFD?ENJE" : "CISCENJE",
    "CISCENJE, DEKONTAMINACIJA, ODPADKI" : "CISCENJE, DEKONTAMINACIJA, ODPADKI",
    "DIAGNOSTI?NA RADIOLOGIJA" : "DIAGNOSTICNA RADIOLOGIJA",
    "DR AVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM" : "DRZAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM",
    "ELEKTRI?NO IN IN TRUMENTACIJSKO VZDR EVANJE" : "ELEKTRICNO IN INSTRUMENTACIJSKO VZDRZEVALNE",
    "GINEKOLOGIJA S PORODNI TVOM" : "GINEKOLOGIJA S PORODNIŠTVOM",
    "GRADBENI TVO" : "GRADBENISTVO",
    "INTERVENTNA KARDIOLOGIJA - IN TRUMENTARKE" : "INTERVENTNA KARDIOLOGIJA - INŠTRUMENTARKE",
    "IZOBRA EVANJE" : "IZOBRAŽEVANJE",
    "NUJNA MEDICINSKA POMO?" : "NUJNA MEDICINSKA POMOČ",
    "OSTALE DR AVNE INSTITUCIJE" : "OSTALE DRŽAVNE INSTITUCIJE",
    "OSTALE IZOBRA EVALNE USTANOVE" : "OSTALE IZOBRAŽEVALNE USTANOVE",
    "OTRO KA KIRURGIJA" : "OTROŠKA KIRURGIJA",
    "PLASTI?NA KIRURGIJA" : "PLASTICNA KIRURGIJA",
    "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTI?NIH MAS" : "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTICNIH MAS",
    "PROIZVODNJA ELEKTRI?NE IN OPTI?NE OPREME" : "PROIZVODNJA ELEKTRICNE IN OPTICNE OPREME",
    "PROIZVODNJA HRANE, PIJA?, KRMIL IN TOBA?NIH IZDELKOV" : "PROIZVODNJA HRANE, PIJAC, KRMIL IN TOBACNIH IZDELKOV",
    "PROIZVODNJA IZKLJU?NO FE IN IZDELKOV IN FE" : "PROIZVODNJA IZKLJUCNO FE IN IZDELKOV IN FE",
    "PROIZVODNJA KEMIKALIJ, KEMI?NIH IZDELOKOV, UMETNIH VLAKEN" : "PROIZVODNJA KEMIKALIJ, KEMICNIH IZDELOKOV, UMETNIH VLAKEN",
    "PROIZVODNJA POHI TVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLA A" : "PROIZVODNJA POHIŠTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLAZA",
    "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOŽNIŠTVO IN TISKARSTVO" : "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOŽNIŠTVO IN TISKARSTVO",
    "SERVIS IN VZDR EVANJE" : "SERVIS IN VZDRZEVANJE",
    "SERVISNE SLU BE IZVEN INDUSTRIJSKE PANOGE" : "SERVISNE SLUZBE IZVEN INDUSTRIJSKE PANOGE",
    "SLU BA ZA VARSTVO PRED SEVANJEM" : "SLUZBA ZA VARSTVO PRED SEVANJEM",
    "SPLO NA KIRURGIJA" : "SPLOSNA KIRURGIJA",
    "SPLO NA PEDIATRIJA" : "SPLOSNA PEDIATRIJA",
    "SPLO NO ZOBOZDRAVSTVO" : "SPLOSNO ZOBOZDRAVSTVO",
    "STOMATOLO KA PROTETIKA" : "STOMATOLOSKA PROTETIKA",
    "STROJNO VZDR EVANJE" : "STROJNO VZDRZEVANJE",
    "VI JE IN VISOKO OLSKA IZOBRA EVALNA USTANOVA" : "VISJE IN VISOKOSOLSKA IZOBRAZEVALNA USTANOVA",
    "KARDIOVASKULARNA  KIRURGIJA" : "KARDIOVASKULARNA KIRURGIJA",
    "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALO NI TVO IN TISKARSTVO" : "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOŽNIŠTVO IN TISKARSTVO",
    "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHI TVA" : "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHISTVA",
    "INTERVENTNA KARDIOLOGIJA -ELEKTROFIZIOLOGIJA" : "INTERVENTNA KARDIOLOGIJA - ELEKTROFIZIOLOGIJA",
    "IZOBRAEVANJE" : "IZOBRAZEVANJE",
    "POOBLA ?ENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM" : "POOBLASCENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM",
    "POSPE EVALNIKI" : "POSPESEVALNIKI"
}

testing_dict = [
    "VARSTVO PRED SEVANJEM",
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
    "RUDNIK URANA",

    "DIAGNOSTICNA RADIOLOGIJA",
    "IZOBRAŽEVANJE",
    "VISJE IN VISOKOSOLSKA IZOBRAZEVALNA USTANOVA",
    "NUJNA MEDICINSKA POMOČ",
    "GRADBENISTVO",
    "SPLOSNO ZOBOZDRAVSTVO",
    "SERVISNE SLUZBE IZVEN INDUSTRIJSKE PANOGE",
    "POOBLASCENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM",
    "GINEKOLOGIJA S PORODNIŠTVOM",
    "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTICNIH MAS",
    "KARDIOVASKULARNA KIRURGIJA",
    "SPLOSNA PEDIATRIJA",
    "PROIZVODNJA IZKLJUCNO FE IN IZDELKOV IN FE",
    "OTROŠKA KIRURGIJA",
    "OSTALE DRŽAVNE INSTITUCIJE",
    "SERVIS IN VZDRZEVANJE",
    "KARDIOVASKULARNA KIRURGIJA",
    "SPLOSNA KIRURGIJA",
    "SLUZBA ZA VARSTVO PRED SEVANJEM",
    "POSPESEVALNIKI",
    "PROIZVODNJA ELEKTRICNE IN OPTICNE OPREME",
    "PLASTICNA KIRURGIJA",
    "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHISTVA",
    "SLUZBA ZA VARSTVO PRED SEVANJEM",
    "OSTALE IZOBRAŽEVALNE USTANOVE",
    "DRZAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM",
    "ELEKTRICNO IN INSTRUMENTACIJSKO VZDRZEVALNE",
    "ELEKTRICNO IN INSTRUMENTACIJSKO VZDRZEVALNE",
    "STROJNO VZDRZEVANJE",
    "INTERVENTNA KARDIOLOGIJA - ELEKTROFIZIOLOGIJA"
]

def convert_to_ascii_each_char(text):
    # Convert each character to its ASCII value and join them into a string
    ascii_representation = ' '.join(str(ord(char)) for char in text)
    return ascii_representation

def normalize_string(text):
    """Funkcija za normalizacijo besedila, da se odstranijo težave s kodiranjem."""
    return unicodedata.normalize('NFC', text)

def correct_job_titles(entry, correction_dict):
    """
    Funkcija popravi neustrezne vrednosti v polju DELOVNO_MESTO s pomočjo correction_dict.
    Z uporabo regularnih izrazov preveri in popravi napake.
    """
    job_title = entry.get("DELOVNO_MESTO", "")
    job_title = job_title.strip()

    # Normaliziramo besedilo, da odstranimo težave s kodiranjem
    normalized_job_title = normalize_string(job_title)

    # Preverimo, ali normalizirani naslov vsebuje katerikoli od napačnih znakov v correction_dict
    for wrong, correct in correction_dict.items():
        # Uporaba re.sub za zamenjavo napačnih vrednosti v besedilu
        normalized_job_title = re.sub(re.escape(wrong), correct, normalized_job_title)

    entry["DELOVNO_MESTO"] = normalized_job_title
    if normalized_job_title not in correction_dict and normalized_job_title not in testing_dict:
        print(convert_to_ascii_each_char(normalized_job_title)) 
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
        bulk_insert(data, d['index'])









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
