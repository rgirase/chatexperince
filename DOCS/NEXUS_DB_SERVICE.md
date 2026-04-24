# Nexus DB Service

The Nexus DB Service is a FastAPI-based backend that replaces browser-based IndexedDB storage for the Aura Chat Experience. It provides centralized storage for chat history, character settings, memories, and high-fidelity images.

## Features

- **Persistent Storage**: Uses SQLite to store all application data.
- **Image Hosting**: Automatically offloads large Base64 images from the database to the filesystem (`nexus/storage/images`), improving performance and reducing DB size.
- **Unified API**: Provides a KV (Key-Value) store interface compatible with the original `db.js` service.
- **Scalability**: Can be hosted on a separate machine (e.g., a local server or cloud) to share chat history across devices.

## Architecture

1. **Backend**: FastAPI (Python) running on port `8001`.
2. **Database**: SQLite (`nexus/aura_data.db`).
3. **Storage**: Local filesystem for images.
4. **Frontend Integration**: `src/services/db.js` has been updated to proxy all calls to the Nexus service.

## Installation & Startup

The service is automatically started by `./start_all.sh`.

If you need to start it manually:
```bash
./nexus/start_nexus.sh
```

## Image Handling

When the frontend calls `db.setItem` with a Base64 image string:
1. `db.js` detects the Base64 data.
2. The image is uploaded to `http://localhost:8001/upload/base64`.
3. The server saves the image to disk and returns a URL.
4. The URL is stored in the database instead of the large Base64 string.

## Migration

By default, the application will start with a fresh database in Nexus. If you wish to migrate your existing IndexedDB data, you would need to export it from your browser and POST it to the Nexus API stores.
