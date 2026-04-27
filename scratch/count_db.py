import sqlite3
conn = sqlite3.connect('nexus/aura_data.db')
cursor = conn.cursor()
cursor.execute("SELECT store_name, COUNT(*) FROM kv_store GROUP BY store_name;")
for row in cursor.fetchall():
    print(f"{row[0]}: {row[1]}")
conn.close()
