from flask import Flask, jsonify, request
from flask_cors import CORS
import elasticsearch
import urllib3
from flask import render_template

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

@app.route('/')
def index():
    message =  'Hello, World!'
    return render_template('index.html', message=message)

@app.route('/api/top_five', methods=['GET'])
def get_top_five_data():
    """
    Funkcija izvaja agregacijsko poizvedbo na Elasticsearch in vrača rezultate.
    """
    try:
        # Pošljemo agregacijsko poizvedbo na Elasticsearch
        response = es.search(index="mt-sevanje", body={
            "size": 0,  # Ne vračamo posameznih dokumentov, samo agregacije
            "aggs": {
                "top_five_results": {
                    "terms": {
                        "field": "REZULTAT_MERITVE",
                        "order": { "_key": "desc" },
                        "size": 5
                    }
                }, 
        }

        })

        # Pridobimo rezultate iz odgovora
        top_five = response['aggregations']['top_five_results']['buckets']

        result = {
            "top_five": top_five
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/total_count', methods=['GET']) # DELA
def get_total_count():
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
  
            },  
        }
    )

        # Pridobimo rezultate iz odgovora
        total_count = response['aggregations']['total_count']['value']


        result = {
            "total_count": total_count,

        }

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/top_depts', methods=['GET'])
def get_top_depts_data():
    """
    Funkcija izvaja agregacijsko poizvedbo na Elasticsearch in vrača rezultate.
    """
    try:
        # Pošljemo agregacijsko poizvedbo na Elasticsearch
        response = es.search(index="mt-sevanje", body={
            "size": 0,  # Ne vračamo posameznih dokumentov, samo agregacije
            "aggs": {
                # SUM: REZULTAT_MERITVE MERITVE BY DELOVNO_MESTO
                "sum_by_depts": {
                    "terms": {
                    "field": "DELOVNO_MESTO",  # Group by department
                    "size": 10000,
                    "order": {
                        "total_radiation": "desc"        # // Order by total_radiation descending
                        }                                         # Maximum number of departments to return
                    },
                    "aggs": {
                    "total_radiation": {
                        "sum": {
                            "field": "REZULTAT_MERITVE"   # // Sum the radiation measurement
                        }
                    }
                }
            }       
        }

        })

        radiation_by_dept = response['aggregations']['sum_by_depts']['buckets']



        result = {
            "sum_by_depts": radiation_by_dept
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

                "top_five_results": {
                    "terms": {
                        "field": "REZULTAT_MERITVE",
                        "order": { "_key": "desc" },
                        "size": 5
                    }
                },    
        }

        })

        # Pridobimo rezultate iz odgovora
        total_count = response['aggregations']['total_count']['value']
        top_five = response['aggregations']['top_five_results']['buckets']
        average_radiation = response['aggregations']['average_radiation']['value']
        radiation_by_dept = response['aggregations']['sum_by_depts']['buckets']

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
            "average_radiation": average_radiation,
            "sum_by_depts": radiation_by_dept
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=8080, debug=True)