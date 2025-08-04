from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

DATA_FILE = 'data.json'

def load_data():
    if not os.path.exists(DATA_FILE):
        return {'movies': [], 'series': []}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

@app.route('/save_data', methods=['POST'])
def save_item():
    try:
        req = request.get_json()
        print("Received:", req)

        data = load_data()
        item_type = req.get('type')
        action = req.get('action')

        if item_type not in ['movie', 'series']:
            return jsonify({'error': 'Invalid type'}), 400

        arr = data['movies'] if item_type == 'movie' else data['series']

        if action in ['create', 'update']:
            item = req.get('item')
            if not item:
                return jsonify({'error': 'Missing item data'}), 400
            idx = next((i for i, x in enumerate(arr) if x['id'] == item['id']), -1)
            if idx > -1:
                arr[idx] = item
            else:
                arr.append(item)

        elif action == 'delete':
            item_id = req.get('id')
            arr = [x for x in arr if x['id'] != item_id]
            if item_type == 'movie':
                data['movies'] = arr
            else:
                data['series'] = arr
        else:
            return jsonify({'error': 'Invalid action'}), 400

        save_data(data)
        return jsonify({'message': 'Success'})

    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
