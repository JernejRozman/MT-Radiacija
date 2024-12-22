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
    "\ufffdILNA KIRURGIJA" : "ZILNA KIRURGIJA",
    "?I\ufffd?ENJE": "CISCENJE",
    "?I\u008a?ENJE, DEKONTAMINACIJA, ODPADKI": "CISCENJE, DEKONTAMINACIJA, ODPADKI",
    "DIAGNOSTI?NA RADIOLOGIJA": "DIAGNOSTICNA RADIOLOGIJA",
    "ELEKTRI?NO IN IN\u008aTRUMENTACIJSKO VZDR\u008eEVANJE": "ELEKTRICNO IN INSTRUMENTACIJSKO VZDRZEVANJE",
    "GINEKOLOGIJA S PORODNI\u008aTVOM": "GINEKOLOGIJA S PORODNISTVOM",
    "GRADBENI\u008aTVO": "GRADBENISTVO",
    "INTERVENTNA KARDIOLOGIJA - IN\u008aTRUMENTARKE": "INTERVENTNA KARDIOLOGIJA - INSTRUMENTARKE",
    "IZOBRA\u008eEVANJE": "IZOBRAZEVANJE",
    "KARDIOVASKULARNA  KIRURGIJA": "KARDIOVASKULARNA KIRURGIJA",
    "NUJNA MEDICINSKA POMO?": "NUJNA MEDICINSKA POMOC",
    "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHI\u008aTVA": "OBDELAVA IN PREDELAVA LESA, PROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHISTVA",
    "PLASTI?NA KIRURGIJA": "PLASTICNA KIRURGIJA",
    "POSPE\u008aEVALNIKI": "POSPESEVALNIKI",
    "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTI?NIH MAS": "PROIZVODNJA IZDELKOV IZ GUME IN PLASTICNIH MAS",
    "PROIZVODNJA ELEKTRI?NE IN OPTI?NE OPREME": "PROIZVODNJA ELEKTRICNE IN OPTICNE OPREME",
    "PROIZVODNJA HRANE, PIJA?, KRMIL IN TOBA?NIH IZDELKOV": "PROIZVODNJA HRANE, PIJAC, KRMIL IN TOBACNIH IZDELKOV",
    "PROIZVODNJA IZKLJU?NO FE IN IZDELKOV IN FE": "PROIZVODNJA IZKLJUCNO FE IN IZDELKOV IN FE",
    "PROIZVODNJA KEMIKALIJ, KEMI?NIH IZDELOKOV, UMETNIH VLAKEN": "PROIZVODNJA KEMIKALIJ, KEMICNIH IZDELOKOV, UMETNIH VLAKEN",
    "PROIZVODNJA POHI\u008aTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLA\u008eA": "PROIZVODNJA POHISTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLIRANJE",
    "SERVIS IN VZDR\u008eEVANJE": "SERVIS IN VZDRZEVANJE",
    "SERVISNE SLU\u008dBE IZVEN INDUSTRIJSKE PANOGE": "SERVISNE SLUZBE IZVEN INDUSTRIJSKE PANOGE",
    "SPL\u008aNA KIRURGIJA": "SPLOSNA KIRURGIJA",
    "SPL\u008aNA PEDIATRIJA": "SPLOSNA PEDIATRIJA",
    "SPL\u0160NO ZOBOZDRAVSTVO": "SPLOSNO ZOBOZDRAVSTVO",
    "STOMATOLO\u008aKA PROTETIKA": "STOMATOLOSKA PROTETIKA",
    "TELETERAPIJA": "TELETERAPIJA",
    "TERAPIJA IN DIAGNOSTIKA": "TERAPIJA IN DIAGNOSTIKA",
    "TORAKALNA KIRURGIJA": "TORAKALNA KIRURGIJA",
    "TURIZEM": "TURIZEM",
    "UROLOGIJA": "UROLOGIJA",
    "VARSTVO PRED SEVANJEM": "VARSTVO PRED SEVANJEM",
    "VI\u008aJE IN VISOKO\u008aOLSKA IZOBRA\u008eEVALNA USTANOVA": "VISJE IN VISOKOSOLSKA IZOBRAZEVALNA USTANOVA",
    "VI\u0160JE IN VISOKO\u0160OLSKA IZOBRA\u017dEVALNA USTANOVA": "VISJE IN VISOKOSOLSKA IZOBRAZEVALNA USTANOVA",
    "ZOBNA RADIOLOGIJA": "ZOBNA RADIOLOGIJA",
    "CI\u0160\u010cENJE": "CISCENJE",
    "CI\u0160\u010cENJE, DEKONTAMINACIJA, ODPADKI": "CISCENJE, DEKONTAMINACIJA, ODPADKI",
    "DR\ufffdAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM" : "DRZAVNE INSTITUCIJE ZA VARSTVO PRED SEVANJEM",
    "ELEKTRI?NO IN IN\ufffdTRUMENTACIJSKO VZDR\ufffdEVANJE": "ELEKTRICNO IN INSTRUMENTACIJSKO VZDRZEVANJE",
    "GRADBENI\ufffdTVO": "GRADBENISTVO",
    "IZOBRA\ufffdEVANJE": "IZOBRAZEVANJE",
    "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHI\ufffdTVA": 
    "OBDELAVA IN PREDELAVA LESA, PROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHISTVA",
    "OSTALE IZOBRA\ufffdEVALNE USTANOVE": "OSTALE IZOBRAZEVALNE USTANOVE",
    "OTRO\ufffdKA KIRURGIJA": "OTROSKA KIRURGIJA",
    "POOBLA\ufffd?ENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM": "POOBLASCENE ORGANIZACIJE ZA VARSTVO PRED SEVANJEM",
    "POSPE\ufffdEVALNIKI": "POSPESEVALNIKI",
    "PROIZVODNJA POHI\ufffdTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLA\ufffdA": 
    "PROIZVODNJA POHISTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLIRANJE",
    "SERVIS IN VZDR\ufffdEVANJE": "SERVIS IN VZDRZEVANJE",
    "SERVISNE SLU\ufffdBE IZVEN INDUSTRIJSKE PANOGE": "SERVISNE SLUZBE IZVEN INDUSTRIJSKE PANOGE",
    "SLU\ufffdBA ZA VARSTVO PRED SEVANJEM": "SLUZBA ZA VARSTVO PRED SEVANJEM",
    "SODNA MEDICINA": "SODNA MEDICINA",
    "SPLO\ufffdNA KIRURGIJA": "SPLOSNA KIRURGIJA",
    "SPLO\ufffdNA PEDIATRIJA": "SPLOSNA PEDIATRIJA",
    "SPLO\ufffdNO ZOBOZDRAVSTVO": "SPLOSNO ZOBOZDRAVSTVO",
    "STOMATOLO\ufffdKA PROTETIKA": "STOMATOLOSKA PROTETIKA",
    "STROJNO VZDR\ufffdEVANJE": "STROJNO VZDRZEVANJE",
    "VI\ufffdJE IN VISOKO\ufffdOLSKA IZOBRA\ufffdEVALNA USTANOVA": "VISJE IN VISOKOSOLSKA IZOBRAZEVALNA USTANOVA",
    "GINEKOLOGIJA S PORODNI\ufffdTVOM" : "GINEKOLOGIJA S PORODNISTVOM",
    "INTERVENTNA KARDIOLOGIJA - IN\ufffdTRUMENTARKE" : "INTERVENTNA KARDIOLOGIJA - INSTRUMENTARKE",
    "OSTALE DR\ufffdAVNE INSTITUCIJE" : "OSTALE DRZAVNE INSTITUCIJE",
    "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALO\ufffdNI\ufffdTVO IN TISKARSTVO" :
    "PROIZVODNJA VLAKNIN, PAPIRJA IN KARTONA TER IZDELKOV IZ PAPIRJA IN KARTONA, ZALOZNISTVO IN TISKARSTVO" ,



}

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
    #if normalized_job_title not in correction_dict and normalized_job_title not in testing_dict:
     #   print(convert_to_ascii_each_char(normalized_job_title)) 
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
            
            #if field == "REZULTAT_MERITVE":
                #try:
                    #numeric_value = float(value.replace(",", "."))
                    #if numeric_value == 0:
                        #skip_entry = True
                        #break
                #except ValueError:
                    #print(f"Could not convert {field} value: {value}")
                    #continue
            
            #print(field)
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
        #print(data[0])
