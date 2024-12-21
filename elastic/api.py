from flask import Flask, jsonify, request
from flask_cors import CORS
import elasticsearch
import urllib3
from flask import render_template
from datetime import datetime


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

            # Izračun povprečne izpostavljenosti
            average_exposure = total_exposure / doc_count if doc_count > 0 else 0

            # Zapišemo v slovar
            results_dict[person_id] = {
                "total_exposure": total_exposure,
                "average_exposure": average_exposure,
                "measurements_count": doc_count,
                "workplace": workplace,
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

corrections = {
    "?I\u008a?ENJE": "ČIŠČENJE",
    "?I\u008a?ENJE, DEKONTAMINACIJA, ODPADKI": "ČIŠČENJE, DEKONTAMINACIJA, ODPADKI",
    "DIAGNOSTI?NA RADIOLOGIJA": "DIAGNOSTIČNA RADIOLOGIJA",
    "ELEKTRI?NO IN IN\u008aTRUMENTACIJSKO VZDR\u008eEVANJE": "ELEKTRIČNO IN INŠTRUMENTACIJSKO VZDRŽEVANJE",
    "GINEKOLOGIJA S PORODNI\u008aTVOM": "GINEKOLOGIJA S PORODNIŠTVOM",
    "GRADBENI\u008aTVO": "GRADBENIŠTVO",
    "INTERVENTNA KARDIOLOGIJA - IN\u008aTRUMENTARKE": "INTERVENTNA KARDIOLOGIJA - INŠTRUMENTARKE",
    "IZOBRA\u008eEVANJE": "IZOBRAŽEVANJE",
    "KARDIOVASKULARNA  KIRURGIJA": "KARDIOVASKULARNA KIRURGIJA",
    "NUJNA MEDICINSKA POMO?": "NUJNA MEDICINSKA POMOČ",
    "OBDELAVA IN PREDELAVA LESAPROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHI\u008aTVA": "OBDELAVA IN PREDELAVA LESA, PROIZVODNJA IZDELKOV IZ LESA, PLUTE, SLAME IN PRAPROTJA, RAZEN POHIŠTVA",
    "PLASTI?NA KIRURGIJA": "PLASTIČNA KIRURGIJA",
    "POSPE\u008aEVALNIKI": "POSPEŠEVALNIKI",
    "PROIZVODNJA  IZDELKOV IZ GUME IN PLASTI?NIH MAS": "PROIZVODNJA IZDELKOV IZ GUME IN PLASTIČNIH MAS",
    "PROIZVODNJA ELEKTRI?NE IN OPTI?NE OPREME": "PROIZVODNJA ELEKTRIČNE IN OPTIČNE OPREME",
    "PROIZVODNJA HRANE, PIJA?, KRMIL IN TOBA?NIH IZDELKOV": "PROIZVODNJA HRANE, PIJAČ, KRMIL IN TOBAČNIH IZDELKOV",
    "PROIZVODNJA IZKLJU?NO FE IN IZDELKOV IN FE": "PROIZVODNJA IZKLJUČNO FE IN IZDELKOV IN FE",
    "PROIZVODNJA KEMIKALIJ, KEMI?NIH IZDELOKOV, UMETNIH VLAKEN": "PROIZVODNJA KEMIKALIJ, KEMIČNIH IZDELOKOV, UMETNIH VLAKEN",
    "PROIZVODNJA POHI\u008aTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLA\u008eA": "PROIZVODNJA POHIŠTVA IN DRUGE PREDELOVALNE DEJAVNOSTI, RECIKLIRANJE",
    "SERVIS IN VZDR\u008eEVANJE": "SERVIS IN VZDRŽEVANJE",
    "SERVISNE SLU\u008dBE IZVEN INDUSTRIJSKE PANOGE": "SERVISNE SLUŽBE IZVEN INDUSTRIJSKE PANOGE",
    "SPL\u008aNA KIRURGIJA": "SPLOŠNA KIRURGIJA",
    "SPL\u008aNA PEDIATRIJA": "SPLOŠNA PEDIATRIJA",
    "SPL\u0160NO ZOBOZDRAVSTVO": "SPLOŠNO ZOBOZDRAVSTVO",
    "STOMATOLO\u008aKA PROTETIKA": "STOMATOLOŠKA PROTETIKA",
    "TELETERAPIJA": "TELETERAPIJA",
    "TERAPIJA IN DIAGNOSTIKA": "TERAPIJA IN DIAGNOSTIKA",
    "TORAKALNA KIRURGIJA": "TORAKALNA KIRURGIJA",
    "TURIZEM": "TURIZEM",
    "UROLOGIJA": "UROLOGIJA",
    "VARSTVO PRED SEVANJEM": "VARSTVO PRED SEVANJEM",
    "VI\u008aJE IN VISOKO\u008aOLSKA IZOBRA\u008eEVALNA USTANOVA": "VIŠJE IN VISOKOŠOLSKA IZOBRAŽEVALNA USTANOVA",
    "VI\u0160JE IN VISOKO\u0160OLSKA IZOBRA\u017dEVALNA USTANOVA": "VIŠJE IN VISOKOŠOLSKA IZOBRAŽEVALNA USTANOVA",
    "ZOBNA RADIOLOGIJA": "ZOBNA RADIOLOGIJA",
    "ČI\u0160\u010cENJE": "ČIŠČENJE",
    "ČI\u0160\u010cENJE, DEKONTAMINACIJA, ODPADKI": "ČIŠČENJE, DEKONTAMINACIJA, ODPADKI"
}

# Funkcija za popravljanje napačnih zapisov
def correct_workplaces(workplaces):
    return [corrections.get(workplace, workplace) for workplace in workplaces]

@app.route('/api/unique_workplaces', methods=['GET'])
def get_unique_workplaces():
    """
    Funkcija izvaja poizvedbo na Elasticsearch, da pridobi unikatna delovna mesta.
    """
    try:
        response = es.search(index="mt-sevanje", body={
            "size": 0,
            "aggs": {
                "unique_workplaces": {
                    "terms": {
                        "field": "DELOVNO_MESTO",
                        "size": 1000  # Omejite na željeno število delovnih mest
                    }
                }
            }
        })

        # Pridobimo unikatna delovna mesta
        unique_workplaces = [bucket['key'] for bucket in response['aggregations']['unique_workplaces']['buckets']]

        # Razvrstimo delovna mesta po abecedi
        unique_workplaces_sorted = sorted(unique_workplaces)

        return jsonify(unique_workplaces_sorted)  # Pošljemo seznam popravljenih delovnih mest
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/company_exposure_trends', methods=['GET'])
def get_company_exposure_trends():
    try:
        response = es.search(index="mt-sevanje", body={
            "size": 0,
            "aggs": {
                "by_company": {
                    "terms": {
                        "field": "PODJETJE",
                        "size": 10000
                    },
                    "aggs": {
                        "measurements": {
                            "top_hits": {
                                "size": 100,
                                "_source": {
                                    "includes": ["DATUM_ZACETKA_MERITVE", "DATUM_KONCA_MERITVE", "REZULTAT_MERITVE", "DELOVNO_MESTO"]
                                },
                                "sort": [{"DATUM_ZACETKA_MERITVE": {"order": "asc"}}]
                            }
                        }
                    }
                }
            }
        })

        results = []
        for bucket in response['aggregations']['by_company']['buckets']:
            company_name = bucket['key']
            measurements = bucket['measurements']['hits']['hits']

            formatted_measurements = []
            workplaces_set = set()  # Množica za unikatna delovna mesta

            for m in measurements:
                source = m['_source']
                start_date = source.get('DATUM_ZACETKA_MERITVE')
                end_date = source.get('DATUM_KONCA_MERITVE')

                # Pretvorba datumov, če so prisotni
                if start_date:
                    try:
                        start_date = datetime.strptime(start_date[:10], "%Y-%m-%d").strftime("%d.%m.%Y")
                    except ValueError:
                        pass

                if end_date:
                    try:
                        end_date = datetime.strptime(end_date[:10], "%Y-%m-%d").strftime("%d.%m.%Y")
                    except ValueError:
                        pass

                workplace = source.get('DELOVNO_MESTO')
                if workplace:
                    workplaces_set.add(workplace)  # Dodamo delovno mesto v množico

                # Dodamo meritve brez polja `workplace`
                formatted_measurements.append({
                    "start_date": start_date,
                    "end_date": end_date,
                    "value": source.get('REZULTAT_MERITVE', 0.0)
                })

            results.append({
                "company": company_name,
                "unique_workplaces": list(workplaces_set),  # Dodamo seznam unikatnih delovnih mest
                "measurements": formatted_measurements      # Meritve brez `workplace`
            })

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/imena_podjetij', methods=['GET'])
# Določna podjetja niso fajn za prikaz zato vzamemo sami tiste, ki imajo vsaj deset meritev radiacije
def get_imena_podjetij():
    """
    Dobimo vsa imena podjetij, ki imajo vsaj 10 vnosov radiacije (radiacija > 0).
    """
    try:
        response = es.search(index="mt-sevanje", body={
            "size": 0,
            "aggs": {
                "imena_podjetij": {
                    "terms": {
                        "field": "PODJETJE",
                        "size": 1000
                    },
                    "aggs": {
                        "valid_radiation_count": {
                            "filter": {
                                "range": {
                                    "REZULTAT_MERITVE": {
                                        "gt": 0  # Preštejemo samo vnose, kjer je radiacija > 0
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        # Filtriramo podjetja, ki imajo vsaj 10 vnosov radiacije
        imena_podjetij = [
            bucket['key'] for bucket in response['aggregations']['imena_podjetij']['buckets']
            if bucket['valid_radiation_count']['doc_count'] >= 10  # Preverimo, če ima podjetje vsaj 10 veljavnih vnosov
        ]

        return jsonify(imena_podjetij)  # Pošljemo seznam podjetij
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/avg_radiacija_podjetij_po_datumih', methods=['GET'])
def avg_radiacija_podjetij_po_datumih():
    """
    Vrne JSON z seznamom podjetij in dvema seznamoma: en za začetne datume in en za povprečne radiacijske vrednosti.
    Datume pretvorimo v berljivo obliko (YYYY-MM-DD).
    """
    try:
        response = es.search(
            index="mt-sevanje",
            body={
                "size": 0,
                "aggs": {
                    "by_company": {
                        "terms": {
                            "field": "PODJETJE",
                            "size": 1000
                        },
                        "aggs": {
                            "by_start_date": {
                                "terms": {
                                    "field": "DATUM_ZACETKA_MERITVE",
                                    "size": 1000,
                                    "order": {
                                        "_key": "asc"
                                    }
                                },
                                "aggs": {
                                    "avg_radiation": {
                                        "avg": {
                                            "field": "REZULTAT_MERITVE"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        )

        results = []
        for company_bucket in response['aggregations']['by_company']['buckets']:
            company_name = company_bucket['key']
            starting_dates = []
            radiation_values = []
            
            for date_bucket in company_bucket['by_start_date']['buckets']:
                avg_val = date_bucket['avg_radiation']['value']
                date_key = date_bucket['key']  # To je epoch_millis
                
                if avg_val is not None:
                    # Pretvorimo timestamp (millis) v datum (YYYY-MM-DD)
                    readable_date = datetime.utcfromtimestamp(date_key / 1000.0).strftime('%Y-%m-%d')
                    starting_dates.append(readable_date)
                    radiation_values.append(avg_val)

            results.append({
                "company": company_name,
                "starting_dates": starting_dates,
                "radiations": radiation_values
            })

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=8080, debug=True)