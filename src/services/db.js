import { DEFAULT_NEXUS_URL } from '../config';

const NEXUS_URL = localStorage.getItem('nexusUrl') || DEFAULT_NEXUS_URL;

// Simple in-memory cache to prevent redundant network requests during session
const dbCache = {};
let currentUserId = localStorage.getItem('aura_current_user_id') || 'default';

/**
 * Returns the effective key with user namespace prefix.
 * Legacy 'default' user has no prefix for backward compatibility.
 */
const getNamespacedKey = (key) => {
    if (!currentUserId || currentUserId === 'default') return key;
    if (key.startsWith(`u_${currentUserId}_`)) return key; // already namespaced
    return `u_${currentUserId}_${key}`;
};

/**
 * Checks if a key belongs to the current user.
 */
const isKeyForCurrentUser = (key) => {
    if (!currentUserId || currentUserId === 'default') {
        return !key.startsWith('u_');
    }
    return key.startsWith(`u_${currentUserId}_`);
};

/**
 * Strips the user namespace prefix from a key.
 */
const stripNamespace = (key) => {
    if (!currentUserId || currentUserId === 'default') return key;
    const prefix = `u_${currentUserId}_`;
    if (key.startsWith(prefix)) return key.slice(prefix.length);
    return key;
};

export const getCurrentUserId = () => currentUserId;
export const setCurrentUserId = (id) => {
    currentUserId = id;
    localStorage.setItem('aura_current_user_id', id);
    // Clear cache to prevent cross-user leak
    Object.keys(dbCache).forEach(k => delete dbCache[k]);
};

/**
 * Profile Management
 */
export const getProfiles = async () => {
    const profiles = await getItem('users', 'profiles');
    return profiles || [{ id: 'default', name: 'Master Profile', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Master' }];
};

export const saveProfiles = async (profiles) => {
    return await setItem('users', 'profiles', profiles);
};

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
    // Special case: The users store itself is NOT namespaced (it holds the profiles)
    const storeIsGlobal = (storeName === 'users' || storeName === 'logins');
    const effectiveKey = storeIsGlobal ? key : getNamespacedKey(key);
    
    const cacheKey = `${storeName}:${effectiveKey}`;
    if (dbCache[cacheKey] !== undefined) {
        return dbCache[cacheKey];
    }

    try {
        const res = await fetch(`${NEXUS_URL}/db/${storeName}/${effectiveKey}`);
        const data = await res.json();
        dbCache[cacheKey] = data.value;
        return data.value;
    } catch (e) {
        console.warn(`[DB] Nexus getItem failed for ${storeName}/${effectiveKey}, returning null`, e);
        return null;
    }
};

/**
 * Fetches all items in a store that belong to the current user.
 * Returns an object {key: value}
 */
export const getAllMapped = async (storeName) => {
    try {
        const res = await fetch(`${NEXUS_URL}/db/${storeName}/all`);
        const data = await res.json();
        
        const filtered = {};
        const isGlobal = (storeName === 'users' || storeName === 'logins');

        Object.keys(data).forEach(key => {
            if (isGlobal || isKeyForCurrentUser(key)) {
                const value = data[key];
                const cleanKey = isGlobal ? key : stripNamespace(key);
                filtered[cleanKey] = value;
                dbCache[`${storeName}:${key}`] = value;
            }
        });
        
        return filtered;
    } catch (e) {
        console.error(`[DB] Nexus getAllMapped failed for ${storeName}`, e);
        return {};
    }
};

export const getAll = async (storeName) => {
    try {
        const res = await fetch(`${NEXUS_URL}/db/${storeName}`);
        const data = await res.json(); // Array of {id, value}
        
        const isGlobal = (storeName === 'users' || storeName === 'logins');
        
        return (data || []).filter(item => isGlobal || isKeyForCurrentUser(item.id))
                           .map(item => ({
                               ...item,
                               id: isGlobal ? item.id : stripNamespace(item.id)
                           }));
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
    const isGlobal = (storeName === 'users' || storeName === 'logins');
    const effectiveKey = isGlobal ? key : getNamespacedKey(key);
    
    const cacheKey = `${storeName}:${effectiveKey}`;
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
            if (isBase64Image(value.url)) {
                processedValue = { ...value, url: await uploadToNexus(value.url) };
            }
        }

        await fetch(`${NEXUS_URL}/db/${storeName}/${effectiveKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: processedValue })
        });
    } catch (e) {
        console.error(`[DB] Nexus setItem failed for ${storeName}/${effectiveKey}`, e);
    }
};

export const removeItem = async (storeName, key) => {
    const isGlobal = (storeName === 'users' || storeName === 'logins');
    const effectiveKey = isGlobal ? key : getNamespacedKey(key);

    try {
        await fetch(`${NEXUS_URL}/db/${storeName}/${effectiveKey}`, {
            method: 'DELETE'
        });
        delete dbCache[`${storeName}:${effectiveKey}`];
    } catch (e) {
        console.error(`[DB] Nexus removeItem failed for ${storeName}/${effectiveKey}`, e);
    }
};

export const clear = async (storeName) => {
    // Dangerous: This will clear the entire store for ALL users if we use the backend's /clear
    // For now, we should only clear items belonging to the current user
    const items = await getAll(storeName);
    for (const item of items) {
        await removeItem(storeName, item.id);
    }
};

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

