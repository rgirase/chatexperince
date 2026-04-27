import sqlite3
import json
import requests
import base64
import os
import uuid

DB_PATH = 'nexus/aura_data.db'
NEXUS_URL = 'http://localhost:8001'

def upload_to_nexus(b64_data):
    try:
        res = requests.post(f"{NEXUS_URL}/upload/base64", json={"image": b64_data})
        if res.status_code == 200:
            return f"{NEXUS_URL}{res.json()['url']}"
    except Exception as e:
        print(f"Upload failed: {e}")
    return b64_data

def process_value(val):
    if isinstance(val, str):
        if val.startswith('data:image/') and len(val) > 1000:
            print("  Uploading base64 string...")
            return upload_to_nexus(val)
    elif isinstance(val, list):
        return [process_value(i) for i in val]
    elif isinstance(val, dict):
        new_val = {}
        for k, v in val.items():
            new_val[k] = process_value(v)
        return new_val
    return val

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, store_name, key, value FROM kv_store WHERE value LIKE '%data:image/%';")
    rows = cursor.fetchall()
    print(f"Found {len(rows)} rows with potential base64 data.")
    
    for row_id, store, key, value_json in rows:
        print(f"Processing {store}/{key}...")
        try:
            value = json.loads(value_json)
            new_value = process_value(value)
            
            if new_value != value:
                new_json = json.dumps(new_value)
                cursor.execute("UPDATE kv_store SET value = ? WHERE id = ?", (new_json, row_id))
                print(f"  Updated {store}/{key}")
            else:
                print(f"  No changes for {store}/{key}")
        except Exception as e:
            print(f"  Error processing row: {e}")
            
    conn.commit()
    conn.close()
    print("Cleanup complete.")

if __name__ == "__main__":
    main()
