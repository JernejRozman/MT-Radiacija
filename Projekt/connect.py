from elasticsearch import Elasticsearch, helpers
import pandas as pd

# Povezava z lokalno instanco Elasticsearch na localhost:9200
es = Elasticsearch([{'host': 'localhost', 'port': 9200}])

# Preberi CSV datoteko (zamenjaj 'path_to_your_file.csv' s pravo potjo do datoteke)
df = pd.read_csv('path_to_your_file.csv')

# Funkcija za ustvarjanje JSON dokumentov za vsako vrstico CSV datoteke
def generate_data(df):
    for _, row in df.iterrows():
        yield {
            "_index": "my_csv_index",  # Zamenjaj z želenim imenom indeksa
            "_source": row.to_dict(),
        }

# Naloži podatke v Elasticsearch
try:
    response = helpers.bulk(es, generate_data(df))
    print("Podatki so bili uspešno naloženi v Elasticsearch:", response)
except Exception as e:
    print("Prišlo je do napake:", e)
