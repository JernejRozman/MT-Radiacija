from flask import Flask, jsonify
from elasticsearch import Elasticsearch
# Test
# Create a Flask app
app = Flask(__name__)

# Connect to Elasticsearch
es = Elasticsearch(
    ['https://localhost:9200'],
    basic_auth=('elastic', 'Burek123'),
    verify_certs=False
)

@app.route('/api/data', methods=['GET'])
def get_data():
    # Perform a search query to get data from Elasticsearch
    try:
        response = es.search(
            index='mt-sevanje',
            size=90,  # Get the first 100 rows, adjust as needed
            body={
                'query': {
                    'match_all': {}
                }
            }
        )
        
        # Extracting the actual data
        data = [hit['_source'] for hit in response['hits']['hits']]
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
