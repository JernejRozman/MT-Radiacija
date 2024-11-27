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
    
# LEON          LEON        LEON        LEON         LEON        LEON       LEON        LEON        LEON        LEON
@app.route('/api/exposure_by_person', methods=['GET'])
def get_exposure_by_person():
    """
    Funkcija izvaja agregacijsko poizvedbo na Elasticsearch za pridobitev
    skupne izpostavljenosti radiaciji za vsako osebo.
    """
    try:
        response = es.search(index="mt-sevanje", body={
            "size": 0,
            "query": {
                "bool": {
                    "must_not": {
                        "term": {
                            "TIP": "ER"
                        }
                    }
                }
            },
            "aggs": {
                "by_person": {
                    "terms": {
                        "field": "OSEBA",
                        "size": 10000
                    },
                    "aggs": {
                        "total_exposure": {
                            "sum": {
                                "field": "REZULTAT_MERITVE"
                            }
                        },
                        "doc_count": {
                            "value_count": {
                                "field": "REZULTAT_MERITVE"
                            }
                        },
                        "workplace": {
                            "terms": {
                                "field": "DELOVNO_MESTO",
                                "size": 1
                            }
                        },
                        "type": {
                            "terms": {
                                "field": "TIP",
                                "size": 1
                            }
                        }
                    }
                }
            }
        })

        # Accessing the 'buckets' which contains the data for each person
        buckets = response['aggregations']['by_person']['buckets']
        
        # Ustvarimo dictionary za združevanje podatkov
        results_dict = {}
        for bucket in buckets:
            person_id = bucket['key']
            total_exposure = bucket['total_exposure']['value']
            doc_count = bucket['doc_count']['value']
            
            # Safely extract workplace and type (these might be missing)
            workplace = bucket.get('workplace', {}).get('buckets', [{}])[0].get('key', 'N/A')  # Default to 'N/A' if not found
            type = bucket.get('type', {}).get('buckets', [{}])[0].get('key', 'N/A')  # Default to 'N/A' if not found

            # Izračun povprečne izpostavljenosti
            average_exposure = total_exposure / doc_count if doc_count > 0 else 0

            # Zapišemo v slovar
            results_dict[person_id] = {
                "total_exposure": total_exposure,
                "average_exposure": average_exposure,
                "measurements_count": doc_count,
                "workplace": workplace,
                "type": type
            }

        # Pretvorimo slovar v seznam za JSON odgovor
        results = [
            {
                "person": person,
                **data  # Dodamo vse vrednosti iz notranjega slovarja
            }
            for person, data in results_dict.items()
        ]

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

























if __name__ == '__main__':
    app.run(port=8080, debug=True)