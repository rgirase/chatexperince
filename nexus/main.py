from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import json
import os
import uuid
import base64
from typing import List, Optional
from . import database

app = FastAPI(title="Aura Nexus DB Service")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure storage directories exist
os.makedirs("nexus/storage/images", exist_ok=True)
app.mount("/images", StaticFiles(directory="nexus/storage/images"), name="images")

database.init_db()

@app.get("/db/{store_name}/{key}")
def get_item(store_name: str, key: str, db: Session = Depends(database.get_db)):
    item = db.query(database.KVStore).filter(
        database.KVStore.store_name == store_name,
        database.KVStore.key == key
    ).first()
    if not item:
        return {"value": None}
    return {"value": json.loads(item.value)}

@app.get("/db/{store_name}/all")
def get_all_mapped(store_name: str, db: Session = Depends(database.get_db)):
    items = db.query(database.KVStore).filter(database.KVStore.store_name == store_name).all()
    return {item.key: json.loads(item.value) for item in items}

@app.post("/db/{store_name}/{key}")
def set_item(store_name: str, key: str, data: dict, db: Session = Depends(database.get_db)):
    value_str = json.dumps(data.get("value"))
    
    item = db.query(database.KVStore).filter(
        database.KVStore.store_name == store_name,
        database.KVStore.key == key
    ).first()
    
    if item:
        item.value = value_str
    else:
        item = database.KVStore(store_name=store_name, key=key, value=value_str)
        db.add(item)
    
    db.commit()
    return {"status": "success", "key": key}

@app.get("/db/{store_name}")
def get_all(store_name: str, db: Session = Depends(database.get_db)):
    items = db.query(database.KVStore).filter(database.KVStore.store_name == store_name).all()
    return [{"id": item.key, "value": json.loads(item.value)} for item in items]

@app.delete("/db/{store_name}/{key}")
def delete_item(store_name: str, key: str, db: Session = Depends(database.get_db)):
    item = db.query(database.KVStore).filter(
        database.KVStore.store_name == store_name,
        database.KVStore.key == key
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {"status": "success"}

@app.post("/db/{store_name}/clear")
def clear_store(store_name: str, db: Session = Depends(database.get_db)):
    db.query(database.KVStore).filter(database.KVStore.store_name == store_name).delete()
    db.commit()
    return {"status": "success"}

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1] or ".png"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join("nexus/storage/images", filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())
    
    # Return full URL or relative path
    return {"url": f"/images/{filename}"}

@app.post("/upload/base64")
async def upload_base64(data: dict):
    # data format: {"image": "data:image/png;base64,...", "name": "optional_name"}
    image_data = data.get("image")
    if not image_data:
        raise HTTPException(status_code=400, detail="No image data provided")
    
    try:
        header, encoded = image_data.split(",", 1)
        ext = header.split("/")[1].split(";")[0]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join("nexus/storage/images", filename)
        
        with open(filepath, "wb") as buffer:
            buffer.write(base64.b64decode(encoded))
            
        return {"url": f"/images/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
