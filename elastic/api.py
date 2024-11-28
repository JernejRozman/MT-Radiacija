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
    
@app.route('/api/total_count', methods=['GET']) 
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
    

# TOP N ODDELKOV AKUMULIRANO <- KIND OF STUPID
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

# ZA ODDELKE POVPREČEJE <= BUBBLE VIZUALIZACIJA 
@app.route('/api/avg_dept_bubble', methods=['GET'])
def get_avg_dept_bubble():
    """
    Funkcija izvaja agregacijsko poizvedbo na Elasticsearch in vrača rezultate.
    """
    try:
        # Pošljemo agregacijsko poizvedbo na Elasticsearch
        response = es.search(index="mt-sevanje", body={
            "size": 0,  # Ne vračamo posameznih dokumentov, samo agregacije
            "aggs": {
                "sum_by_depts": {
                    "terms": {
                        "field": "DELOVNO_MESTO",  # Group by department
                        "size": 10000,  # Maximum number of departments to return
                        "order": {
                            "total_radiation": "desc"  # Order by total_radiation descending
                        }
                    },
                    "aggs": {
                        "total_radiation": {
                            "sum": {
                                "field": "REZULTAT_MERITVE"  # Sum the radiation measurement
                            }
                        }
                    }
                }
            }
        })

        # Obdelava rezultatov
        radiation_by_dept = [
            {
                "department": bucket["key"],
                "total_radiation": bucket["total_radiation"]["value"],
                "doc_count": bucket["doc_count"]
            }
            for bucket in response['aggregations']['sum_by_depts']['buckets']
        ]

        result = {
            "sum_by_depts": radiation_by_dept
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ČRTNI DIAGRAM S PREMEMBE POVPREČNE RADIACIJE 
@app.route('/api/radiation_changes', methods=['GET'])
def get_radiation_changes():
    """
    Funkcija izvaja agregacijsko poizvedbo na Elasticsearch in vrača sekvenčne povprečne spremembe za vsako delovno mesto.
    """
    try:
        # Pridobimo seznam vseh unikatnih delovnih mest
        depts_response = es.search(index="mt-sevanje", body={
            "size": 0,
            "aggs": {
                "unique_depts": {
                    "terms": {
                        "field": "DELOVNO_MESTO",  # Poskrbimo za 'keyword' polje
                        "size": 10000
                    }
                }
            }
        })

        # Pripravimo seznam unikatnih delovnih mest
        unique_depts = [
            bucket["key"]
            for bucket in depts_response["aggregations"]["unique_depts"]["buckets"]
        ]

        # Agregacija po sekvenčnih povprečjih za vsako delovno mesto
        results = {}
        for dept in unique_depts:
            response = es.search(index="mt-sevanje", body={
                "query": {
                    "term": {
                        "DELOVNO_MESTO": dept  # Uporabimo 'term' za natančno ujemanje
                    }
                },
                "size": 0,
                "aggs": {
                    "by_chunks": {
                        "histogram": {
                            "field": "_seq_no",  # Uporaba sekvenčne številke
                            "interval": 10
                        },
                        "aggs": {
                            "avg_radiation": {
                                "avg": {
                                    "field": "REZULTAT_MERITVE"  # Preverimo, da polje obstaja in ima numerične vrednosti
                                }
                            }
                        }
                    }
                }
            })

            # Obdelava rezultatov, ignoriramo prazne vrednosti
            chunked_data = [
                {
                    "chunk": bucket["key"],
                    "average_radiation": bucket["avg_radiation"]["value"]
                }
                for bucket in response["aggregations"]["by_chunks"]["buckets"]
                if bucket["avg_radiation"]["value"] is not None  # Izločimo prazne rezultate
            ]
            if chunked_data:  # Shranimo samo, če imamo podatke
                results[dept] = chunked_data

        return jsonify({"radiation_changes": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# IMENA DELOVNIH MEST
@app.route('/api/get_departments', methods=['GET'])
def get_departments():
    """
    Pridobi seznam vseh unikatnih delovnih mest iz Elasticsearcha.
    """
    try:
        response = es.search(index="mt-sevanje", body={
            "size": 0,
            "aggs": {
                "unique_depts": {
                    "terms": {
                        "field": "DELOVNO_MESTO",
                        "size": 10000
                    }
                }
            }
        })
        departments = [
            bucket["key"]
            for bucket in response["aggregations"]["unique_depts"]["buckets"]
        ]
        return jsonify({"departments": departments})

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


@app.route('/api/top_avg_radiation', methods=['GET'])
def get_top_avg_radiation():
    """
    Funkcija izvaja agregacijsko poizvedbo na Elasticsearch in vrača rezultate.
    """
    try:
        # Pošljemo agregacijsko poizvedbo na Elasticsearch
        response = es.search(index="mt-sevanje", body={
            "size": 0,  # Ne vračamo posameznih dokumentov, samo agregacije
            "aggs": {
                "avg_by_company": {
                    "terms": {
                        "field": "COMPANY.keyword",  # Group by company
                        "size": 10,  # Število vrnjenih podjetij
                        "order": {
                            "avg_radiation": "desc"  # Razvrsti po povprečnem sevanju
                        }
                    },
                    "aggs": {
                        "avg_radiation": {
                            "avg": {
                                "field": "REZULTAT_MERITVE"  # Povprečje sevanja
                            }
                        }
                    }
                }
            }
        })

        companies = response['aggregations']['avg_by_company']['buckets']

        result = {
            "avg_by_company": companies
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=8080, debug=True)