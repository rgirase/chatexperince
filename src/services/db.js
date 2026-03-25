/**
 * A lightweight IndexedDB wrapper for high-capacity storage.
 * Designed to handle 1000+ messages and large Base64 images.
 * Updated: Version 2 adds 'conversations' for chat archiving.
 */

const DB_NAME = 'ChatExperienceDB';
const DB_VERSION = 4; // Added 'wardrobe' store

export const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('chats')) {
                db.createObjectStore('chats', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('memories')) {
                db.createObjectStore('memories', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('conversations')) {
                db.createObjectStore('conversations', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('wardrobe')) {
                db.createObjectStore('wardrobe', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            // Handle version changes from other tabs/instances
            db.onversionchange = () => {
                db.close();
                console.warn("[DB] Database is out of date, please reload the page.");
            };
            resolve(db);
        };
        request.onblocked = () => {
            console.error("[DB] Upgrade blocked! Please close other tabs of this app.");
            reject(new Error("Database upgrade blocked"));
        };
        request.onerror = (event) => reject(event.target.error);
    });
};

export const getItem = async (storeName, key) => {
    try {
        const db = await openDB();
        if (!db.objectStoreNames.contains(storeName)) {
            console.warn(`[DB] Store ${storeName} not found. Returning null.`);
            return null;
        }
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error(`[DB] getItem failed for ${storeName}/${key}`, e);
        return null;
    }
};

export const getAll = async (storeName) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

export const getAllKeys = async (storeName) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

export const setItem = async (storeName, key, value) => {
    try {
        const db = await openDB();
        if (!db.objectStoreNames.contains(storeName)) {
            console.error(`[DB] Cannot setItem: Store ${storeName} not found.`);
            return;
        }
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ id: key, value: value });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error(`[DB] setItem failed for ${storeName}/${key}`, e);
    }
};

export const removeItem = async (storeName, key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const clear = async (storeName) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
