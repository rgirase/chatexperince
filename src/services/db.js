/**
 * A lightweight IndexedDB wrapper for high-capacity storage.
 * Designed to handle 1000+ messages and large Base64 images.
 * Updated: Version 2 adds 'conversations' for chat archiving.
 */

const DB_NAME = 'ChatExperienceDB';
const DB_VERSION = 8; // Version 8 adds 'persona_events' for autonomous character moments

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
            if (!db.objectStoreNames.contains('logins')) {
                db.createObjectStore('logins', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('unlocked_gallery')) {
                db.createObjectStore('unlocked_gallery', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('rewards')) {
                db.createObjectStore('rewards', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('journals')) {
                db.createObjectStore('journals', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('lore')) {
                db.createObjectStore('lore', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('global_vault')) {
                db.createObjectStore('global_vault', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('persona_events')) {
                db.createObjectStore('persona_events', { keyPath: 'id' });
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

/**
 * Clones all session-related data from one ID to another for a specific persona.
 */
export const cloneSession = async (personaId, sourceSid, targetSid) => {
    const sourceSuffix = `_${personaId}_${sourceSid}`;
    const targetSuffix = `_${personaId}_${targetSid}`;

    const mappings = [
        { store: 'chats', keys: ['chat'] },
        { store: 'memories', keys: ['memory', 'traits', 'encounters'] },
        { store: 'settings', keys: ['score', 'intensity', 'scene', 'invited', 'active_image', 'location', 'relation', 'avatar_manual', 'mood', 'inventory', 'narrative', 'recap'] }
    ];

    for (const mapping of mappings) {
        for (const keyPrefix of mapping.keys) {
            const sourceKey = `${keyPrefix}${sourceSuffix}`;
            const targetKey = `${keyPrefix}${targetSuffix}`;
            const data = await getItem(mapping.store, sourceKey);
            if (data !== null) {
                await setItem(mapping.store, targetKey, data);
            }
        }
    }
};
