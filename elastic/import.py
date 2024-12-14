import elasticsearch
from elasticsearch import helpers
import urllib3
import csv
from datetime import datetime


# Če se stringi skor ujemajo
import difflib



urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

username = 'elastic'
password = 'Burek123'

data = [
    # {
    #     "file": "URSVS poklicna izpostavljenost delavcev.csv",
    #     "index": "mt-sevanje",
    #     "opts": { "delimiter": "," },
    #     "mapping": {
    #         "properties": {
    #             "OSEBA": { "type": "keyword" },
    #             "PODJETJE": { "type": "keyword" },
    #             "DATUM_ZACETKA_MERITVE": { "type": "date" },
    #             "DATUM_KONCA_MERITVE": { "type": "date" },
    #             "REZULTAT_MERITVE": { "type": "float" },
    #             "DELOVNO_MESTO": { "type": "keyword" },
    #             "TIP": { "type": "keyword" },
    #         }
    #     }
    # },
    {
        "file": "URSVS poklicna izpostavljenost delavcev.csv",
        "index": "mt-sevanje",
        "opts": { "delimiter": ";" },
        # Zavod,Zavod:RIZDDZ,Poročilo za obdobje,2. KP1 Vsi prihodki,"3. KP1 stroški blaga, materiala in storitev",4. KP1 povprečno število zaposlenih iz ur,6. KP2 povprečno število zaposlenih iz ur,7. KP2 število ambulantnih pacientov (obravnav),8. KP2 število hospitalnih pacientov,9. KP2 povprečna ležalna doba,11. KP3 skupna ležalna doba v dnevih,12. KP3 število pacientov,14. KP4 število odpustov pacientov (vključno s smrtnimi primeri),15. KP4 število postelj,17. KP5 število ur delovanja opreme v obdobju poročanja (skupaj),19. KP5 število kosov opreme,21. KP6 seštevek dni čakanja vseh pacientov (šteje že prvi dan vpisa pacienta),22. KP6 število pacientov,24. KP7 kratkoročne obveznosti do dobaviteljev,25. KP7 kratkoročne obveznosti do uporabnikov EKN,26. KP7 celotni letni prihodek,28. KP8 celotni prihodki,29. KP8 celotni odhodki
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

es = elasticsearch.Elasticsearch(
    ['https://localhost:9200'],
    basic_auth=(username, password),
    verify_certs=False
)


import difflib

def correct_job_titles_fuzzy(entry, correction_dict):
    job_title = entry.get("DELOVNO_MESTO", "")
    
    # Poišči najbližje ujemanje iz slovarja popravkov
    closest_match = difflib.get_close_matches(job_title, correction_dict.keys(), n=1, cutoff=0.8)
    
    # Če najdemo dovolj dobro ujemanje, ga popravimo
    if closest_match:
        corrected_title = correction_dict[closest_match[0]]
        print(f"Popravljam: '{job_title}' -> '{corrected_title}'")
        entry["DELOVNO_MESTO"] = corrected_title

    return entry
def apply_corrections_fuzzy(data, correction_dict):
    for entry in data:
        correct_job_titles_fuzzy(entry, correction_dict)
    return data


def bulk_insert(data, index, batch_size=5000):
    for i in range(0, len(data), batch_size):
        # oddaj komentar nazaj za print TODO
        print(f">>> Inserting {i} - {i + batch_size} records")
        try:
            helpers.bulk(es, data[i:i + batch_size], index=index)
        except Exception as e:
            print(f">>> Failed to insert {len(data[i:i + batch_size])} records")
            print(data[i:i + batch_size])
            print(e)

from datetime import datetime

def clean_data(data, mapping, correction_dict):
    cleaned_data = []
    for entry in data:
        skip_entry = False
        for field, value in entry.items():
            if value is None:
                continue
            
            # Preskoči vrstico, če je TIP enak 'ER'
            # 
            # Prej so bile 3 vrstice z TIP = ER
            # Za vsak slučaj če bo dodana možnost dodajanja dodatnih datoke
            # Bo tale vrstica to uredila.
            if field == "TIP" and value == "ER":
                skip_entry = True
                break    
            
            # Skip if measurement result is 0
            if field == "REZULTAT_MERITVE":
                try:
                    # Replace comma with a dot for numeric conversion
                    numeric_value = float(value.replace(",", "."))
                    if numeric_value == 0:
                        skip_entry = True
                        break
                except ValueError:
                    print(f"Could not convert {field} value: {value}")
                    continue
            
            # Exact and fuzzy matching for job titles
            if field == "DELOVNO_MESTO":
                if value in correction_dict:
                    entry[field] = correction_dict[value]
                else:
                    closest_match = difflib.get_close_matches(value, correction_dict.keys(), n=1, cutoff=0.8)
                    if closest_match:
                        entry[field] = correction_dict[closest_match[0]]

            # Cleaning numeric fields
            field_type = mapping.get(field, {}).get("type")
            if field_type in ("float", "integer"):
                try:
                    entry[field] = float(value.replace(",", ".")) if field_type == "float" else int(value.replace(",", ""))
                except ValueError:
                    print(f"Error converting {field}: {value}")

            # Cleaning date fields
            elif field_type == "date":
                try:
                    entry[field] = datetime.strptime(value, "%d.%m.%Y")
                except ValueError:
                    print(f"Error parsing date for {field}: {value}")
        
        if not skip_entry:
            cleaned_data.append(entry)

    return cleaned_data


for d in data:
    print(f">>> Processing {d['file']}")

    # Delete index if exists
    if es.indices.exists(index=d['index']):
        es.indices.delete(index=d['index'])

    # Create index
    es.indices.create(index=d['index'], body={
        "mappings": {
            "properties": d['mapping']['properties'],
        }
    })

    # Open csv file
    with open(f"elastic/data/{d['file']}", "r", encoding='ISO-8859-1') as f:
        reader = csv.DictReader(f, fieldnames=list(d['mapping']['properties'].keys()), delimiter=';')
        data = [row for row in reader]
        data = data[1:]
        print(f">>> Read {len(data)} records")
        clean_data(data, d['mapping']['properties'],correction_dict)
        bulk_insert(data, d['index'])



# def clean_data(data, mapping):
#     for i, d in enumerate(data):
#         for key, value in d.items():
#             try:
#                 if mapping[key]['type'] == 'integer':
#                     if value == "":
#                         d[key] = None
#                     else:
#                         d[key] = int(value.replace(",", ""))
#                 elif mapping[key]['type'] == 'float':
#                     if value == "":
#                         d[key] = None
#                     else:
#                         d[key] = float(value.replace(",", ""))
#             except Exception as e:
#                 print(f">>> Failed to clean ({i}) {key}={value}")
#                 print(e)
#     return data

