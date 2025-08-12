from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import re
from datetime import datetime

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

        # Helper to compare IDs safely across potential type differences (str/int)
        def ids_equal(a, b):
            try:
                return int(a) == int(b)
            except (ValueError, TypeError):
                return str(a) == str(b)

        if action in ['create', 'update']:
            item = req.get('item')
            if not item:
                return jsonify({'error': 'Missing item data'}), 400
            # Normalize date fields: year (numeric 4-digits) and releaseDate (YYYY-MM-DD)
            def normalize_year_and_release(item_dict):
                # Normalize releaseDate to YYYY-MM-DD when possible
                rd = item_dict.get('releaseDate')
                normalized_release = None
                if rd is not None and str(rd).strip() != '':
                    rd_str = str(rd).strip()
                    # Keep first 10 if already ISO date
                    m_iso = re.match(r'^(\d{4})-(\d{2})-(\d{2})', rd_str)
                    m_slash = re.match(r'^(\d{4})/(\d{1,2})/(\d{1,2})', rd_str)
                    m_year = re.match(r'^(\d{4})', rd_str)
                    m_mixed = re.search(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})', rd_str)
                    try:
                        if m_iso:
                            y, mo, d = m_iso.groups()
                            normalized_release = f"{y}-{mo}-{d}"
                        elif m_slash:
                            y, mo, d = m_slash.groups()
                            normalized_release = f"{y}-{int(mo):02d}-{int(d):02d}"
                        elif m_mixed:
                            y, mo, d = m_mixed.groups()
                            normalized_release = f"{y}-{int(mo):02d}-{int(d):02d}"
                        elif m_year:
                            y = m_year.group(1)
                            normalized_release = f"{y}-01-01"
                        # Validate date if we built one
                        if normalized_release:
                            try:
                                datetime.strptime(normalized_release, '%Y-%m-%d')
                            except ValueError:
                                normalized_release = None
                    except Exception:
                        normalized_release = None

                if normalized_release:
                    item_dict['releaseDate'] = normalized_release

                # Normalize year to 4-digit integer when possible
                try:
                    if 'year' in item_dict and item_dict['year'] is not None:
                        year_str = str(item_dict['year'])
                        if len(year_str) >= 4 and year_str[:4].isdigit():
                            item_dict['year'] = int(year_str[:4])
                    elif normalized_release:
                        # Derive year from releaseDate if year missing
                        item_dict['year'] = int(normalized_release[:4])
                except Exception:
                    # If normalization fails, drop invalid year
                    try:
                        item_dict['year'] = int(str(item_dict.get('year'))[:4])
                    except Exception:
                        item_dict['year'] = None

            normalize_year_and_release(item)
            idx = next((i for i, x in enumerate(arr) if ids_equal(x.get('id'), item.get('id'))), -1)
            if idx > -1:
                arr[idx] = item
            else:
                arr.append(item)

        elif action == 'delete':
            item_id = req.get('id')
            if item_id is None:
                return jsonify({'error': 'Missing id for delete action'}), 400
            arr = [x for x in arr if not ids_equal(x.get('id'), item_id)]
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
