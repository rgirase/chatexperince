import { DEFAULT_NEXUS_URL } from '../config';

const NEXUS_URL = localStorage.getItem('nexusUrl') || DEFAULT_NEXUS_URL;

// Simple in-memory cache to prevent redundant network requests during session
const dbCache = {};

/**
 * A lightweight DB wrapper that proxies to the Nexus DB Service (FastAPI).
 */

const isBase64Image = (str) => {
    return typeof str === 'string' && str.startsWith('data:image/') && str.length > 1000;
};

const uploadToNexus = async (base64Data) => {
    try {
        const res = await fetch(`${NEXUS_URL}/upload/base64`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data })
        });
        const data = await res.json();
        return `${NEXUS_URL}${data.url}`;
    } catch (e) {
        console.error("[DB] Image upload to Nexus failed", e);
        return base64Data;
    }
};

export const openDB = async () => {
    return true;
};

export const getItem = async (storeName, key) => {
    const cacheKey = `${storeName}:${key}`;
    if (dbCache[cacheKey] !== undefined) {
        return dbCache[cacheKey];
    }

    try {
        const res = await fetch(`${NEXUS_URL}/db/${storeName}/${key}`);
        const data = await res.json();
        dbCache[cacheKey] = data.value;
        return data.value;
    } catch (e) {
        console.warn(`[DB] Nexus getItem failed for ${storeName}/${key}, returning null`, e);
        return null;
    }
};

/**
 * Fetches all items in a store as an object {key: value}
 */
export const getAllMapped = async (storeName) => {
    try {
        const res = await fetch(`${NEXUS_URL}/db/${storeName}/all`);
        const data = await res.json();
        
        // Populate cache
        Object.keys(data).forEach(key => {
            dbCache[`${storeName}:${key}`] = data[key];
        });
        
        return data || {};
    } catch (e) {
        console.error(`[DB] Nexus getAllMapped failed for ${storeName}`, e);
        return {};
    }
};

export const getAll = async (storeName) => {
    try {
        const res = await fetch(`${NEXUS_URL}/db/${storeName}`);
        const data = await res.json();
        return data || [];
    } catch (e) {
        console.error(`[DB] Nexus getAll failed for ${storeName}`, e);
        return [];
    }
};

export const getAllKeys = async (storeName) => {
    try {
        const items = await getAll(storeName);
        return items.map(i => i.id);
    } catch (e) {
        return [];
    }
};

export const setItem = async (storeName, key, value) => {
    const cacheKey = `${storeName}:${key}`;
    dbCache[cacheKey] = value; // Optimistic update

    try {
        let processedValue = value;
        
        if (isBase64Image(value)) {
            processedValue = await uploadToNexus(value);
        } else if (Array.isArray(value)) {
            processedValue = await Promise.all(value.map(async (item) => {
                if (item && typeof item === 'object') {
                    const newItem = { ...item };
                    if (isBase64Image(newItem.url)) {
                        newItem.url = await uploadToNexus(newItem.url);
                    }
                    if (Array.isArray(newItem.panels)) {
                        newItem.panels = await Promise.all(newItem.panels.map(async p => {
                            if (isBase64Image(p.url)) return { ...p, url: await uploadToNexus(p.url) };
                            return p;
                        }));
                    }
                    return newItem;
                }
                return item;
            }));
        } else if (value && typeof value === 'object') {
            // Handle single object overrides (like persona_img in settings)
            if (isBase64Image(value.url)) {
                processedValue = { ...value, url: await uploadToNexus(value.url) };
            }
        }

        await fetch(`${NEXUS_URL}/db/${storeName}/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: processedValue })
        });
    } catch (e) {
        console.error(`[DB] Nexus setItem failed for ${storeName}/${key}`, e);
    }
};

export const removeItem = async (storeName, key) => {
    try {
        await fetch(`${NEXUS_URL}/db/${storeName}/${key}`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.error(`[DB] Nexus removeItem failed for ${storeName}/${key}`, e);
    }
};

export const clear = async (storeName) => {
    try {
        await fetch(`${NEXUS_URL}/db/${storeName}/clear`, {
            method: 'POST'
        });
    } catch (e) {
        console.error(`[DB] Nexus clear failed for ${storeName}`, e);
    }
};

/**
 * Clones all session-related data from one ID to another for a specific persona.
 * Modified for Nexus to do it server-side or via multiple requests.
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

