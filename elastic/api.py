from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import elasticsearch
import urllib3
import csv
from collections import defaultdict

import os

# Onemogočimo opozorila za SSL certifikat
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Elasticsearch prijava
username = 'elastic'
password = 'Burek123'

# Povezava na Elasticsearch
es = elasticsearch.Elasticsearch(
    ['https://localhost:9200'],
    basic_auth=(username, password),
    verify_certs=False
)

app = Flask(__name__)
CORS(app)

# Osnovna pot za zagon aplikacije
@app.route('/')
def index():
    message =  'Hello, World!'
    return render_template('index.html', message=message)

# Pot za pridobivanje agregiranih podatkov iz Elasticsearch
@app.route('/api/aggregations', methods=['GET'])
def get_aggregated_data():
    """
    Funkcija izvaja agregacijsko poizvedbo na Elasticsearch in vrača rezultate.
    """
    try:
        # Pošljemo agregacijsko poizvedbo na Elasticsearch
        response = es.search(index="mt-sevanje", body={
            "size": 0,  # Ne vračamo posameznih dokumentov, samo agregacije
            "aggs": {
                "total_count": {
                    "value_count": {
                        "field": "REZULTAT_MERITVE"
                    }
                },
                "top_five_results": {
                    "terms": {
                        "field": "REZULTAT_MERITVE",
                        "order": { "_key": "desc" },
                        "size": 5
                    }
                },
                "average_radiation": {
                    "avg": {
                        "field": "REZULTAT_MERITVE"
                    }
                }
            }
        })

        # Pridobimo rezultate iz odgovora
        total_count = response['aggregations']['total_count']['value']
        top_five = response['aggregations']['top_five_results']['buckets']
        average_radiation = response['aggregations']['average_radiation']['value']

        # Pripravimo podatke za odgovor
        top_five_data = [
            {
                "rezultat": bucket['key'],
                "count": bucket['doc_count']
            }
            for bucket in top_five
        ]

        result = {
            "total_count": total_count,
            "top_five": top_five_data,
            "average_radiation": average_radiation
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# LEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEONLEON

# Pot za pridobivanje povprečnih meritev za vsako delovno mesto
@app.route('/api/average_workplace', methods=['GET'])
def get_average_workplace():
    try:
        # Dodaš nekaj printov za diagnosticiranje
        print("Začel sem izvajati GET /api/average_workplace")
        
        csv_file = 'elastic/data/podatki.csv'  # Preveri, da pot do CSV-ja ustreza
        print(f"Datoteka: {csv_file}")

        averages = calculate_average_for_workplaces(csv_file)

        return jsonify({'averages': averages})

    except Exception as e:
        print(f"Napaka: {str(e)}")
        current_path = os.getcwd()
        print("Current path:", current_path)
        return jsonify({"error": str(e)}), 500


    
# Funkcija za obdelavo CSV in izračun povprečij
import csv
from collections import defaultdict

def calculate_average_for_workplaces(csv_file):
    # Uporabimo defaultdict, da enostavno zbiramo rezultate za vsako delovno mesto
    workplace_data = defaultdict(list)
    
    # Preberi CSV datoteko
    with open(csv_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=';')
        for row in reader:
            
            measurement_type = row['TIP']
            if measurement_type == "ER":
                continue
            # Izločimo relevantne podatke
            workplace = row['DELOVNO_MESTO']
            workplace = workplace.replace("?", "C")
            workplace = workplace.replace("\ufffd", "Z")
            workplace = workplace.replace("\u017e", "S")
            
            
            
            # Pretvorimo rezultat v float, pri čemer zamenjamo ',' s '.'
            result_str = row['REZULTAT_MERITVE'].replace(',', '.')
            
            try:
                result = float(result_str)
            except ValueError:
                print(f"Napaka pri pretvorbi {result_str} v float.")
                continue  # Preskoči to vrstico, če se pretvorba ne uspe

            # Zbiramo rezultate za vsako delovno mesto
            if result != 0:
                workplace_data[workplace].append(round(result, 6)) 

    # Izračunaj povprečja za vsako delovno mesto
    averages = {}
    for workplace, results in workplace_data.items():
        averages[workplace] = round(sum(results) / len(results), 4)

    return averages


# Zaženi aplikacijo na portu 8080
if __name__ == '__main__':
    app.run(port=8080, debug=True)
