import elasticsearch
from elasticsearch import helpers
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

username = 'elastic'
password = 'Burek123'

# Connect to Elasticsearch
es = elasticsearch.Elasticsearch(
    ['https://localhost:9200'],
    basic_auth=(username, password),
    verify_certs=False
)

print(es.info())

# Delete index if exists
if es.indices.exists(index='sample'):
    es.indices.delete(index='sample')

# Create index
es.indices.create(index='sample', body={
    'mappings': {
        'properties': {
            'name': {'type': 'text'},
            'surname': {'type': 'text'},
            'age': {'type': 'integer'},
            'email': {'type': 'keyword'}
        }
    }
})

# Insert some data
data = [
    {'name': 'Janez', 'surname': 'Sneg', 'age': 24, 'email': 'janez@sneg.si'},
    {'name': 'Micka', 'surname': 'Kranjc', 'age': 32, 'email': 'micka@example.si'},
    {'name': 'Lojze', 'middlename': 'Anton', 'surname': 'Dolinar', 'age': 45, 'email': 'N/A'},
]

res = helpers.bulk(es, data, index='sample')
print(res)
