from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_FILE = 'data.json'


def _default_store():
    return { 'movies': [], 'series': [], 'featured': [] }


def read_store():
    if not os.path.exists(DATA_FILE):
        return _default_store()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not isinstance(data, dict):
                return _default_store()
            data.setdefault('movies', [])
            data.setdefault('series', [])
            data.setdefault('featured', [])
            return data
    except Exception:
        return _default_store()


def write_store(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def ids_equal(a, b):
    return str(a) == str(b)


@app.route('/data', methods=['GET'])
def get_data():
    try:
        return jsonify(read_store())
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500


@app.route('/save_data', methods=['POST'])
def save_data():
    try:
        payload = request.get_json(force=True) or {}
        action = payload.get('action')
        item_type = payload.get('type')
        item = payload.get('item')

        store = read_store()

        # Bulk replace featured
        if action == 'featured_update' and item_type == 'featured':
            if not isinstance(item, list):
                return jsonify({ 'error': 'item must be a list for featured_update' }), 400
            store['featured'] = item
            write_store(store)
            return jsonify({ 'message': 'ok' })

        # CRUD for movies/series
        if item_type in ['movie', 'series'] and action in ['create', 'update', 'delete']:
            target = store['movies'] if item_type == 'movie' else store['series']

            if action == 'create':
                if not isinstance(item, dict):
                    return jsonify({ 'error': 'item must be object' }), 400
                item['type'] = item_type
                item.setdefault('id', int(datetime.now().timestamp() * 1000))
                # --- Specials logic for series ---
                if item_type == 'series' and 'seasons' in item:
                    # Ensure specials are grouped in a season named 'Specials'
                    specials = []
                    normal_seasons = []
                    for season in item['seasons']:
                        if str(season.get('season_number')).lower() == 'specials':
                            # Already a specials season
                            specials.extend(season.get('episodes', []))
                        else:
                            # Split out special episodes from normal ones
                            season_episodes = season.get('episodes', [])
                            normal_eps = []
                            for ep in season_episodes:
                                if ep.get('special'):
                                    specials.append(ep)
                                else:
                                    normal_eps.append(ep)
                            season['episodes'] = normal_eps
                            if len(normal_eps) > 0:
                                normal_seasons.append(season)
                    # Add back normal seasons
                    item['seasons'] = normal_seasons
                    # Add specials season if any specials exist
                    if specials:
                        item['seasons'].append({
                            'season_number': 'Specials',
                            'episodes': specials
                        })
                target.append(item)
                write_store(store)
                return jsonify({ 'message': 'ok', 'id': item['id'] })

            if action == 'update':
                if not isinstance(item, dict) or 'id' not in item:
                    return jsonify({ 'error': 'missing id for update' }), 400
                idx = next((i for i, it in enumerate(target) if ids_equal(it.get('id'), item.get('id'))), -1)
                if idx == -1:
                    return jsonify({ 'error': 'item not found' }), 404
                item['type'] = item_type
                # --- Specials logic for series ---
                if item_type == 'series' and 'seasons' in item:
                    specials = []
                    normal_seasons = []
                    for season in item['seasons']:
                        if str(season.get('season_number')).lower() == 'specials':
                            specials.extend(season.get('episodes', []))
                        else:
                            season_episodes = season.get('episodes', [])
                            normal_eps = []
                            for ep in season_episodes:
                                if ep.get('special'):
                                    specials.append(ep)
                                else:
                                    normal_eps.append(ep)
                            season['episodes'] = normal_eps
                            if len(normal_eps) > 0:
                                normal_seasons.append(season)
                    item['seasons'] = normal_seasons
                    if specials:
                        item['seasons'].append({
                            'season_number': 'Specials',
                            'episodes': specials
                        })
                target[idx] = item
                write_store(store)
                return jsonify({ 'message': 'ok' })

            if action == 'delete':
                delete_id = item if not isinstance(item, dict) else item.get('id')
                if delete_id is None:
                    delete_id = payload.get('id')
                if delete_id is None:
                    return jsonify({ 'error': 'missing id for delete' }), 400
                before = len(target)
                target[:] = [it for it in target if not ids_equal(it.get('id'), delete_id)]
                if len(target) == before:
                    return jsonify({ 'error': 'item not found' }), 404
                # remove related featured
                store['featured'] = [f for f in store.get('featured', []) if not (f.get('type') == item_type and ids_equal(f.get('id'), delete_id))]
                write_store(store)
                return jsonify({ 'message': 'ok' })

        return jsonify({ 'error': 'invalid request' }), 400
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
