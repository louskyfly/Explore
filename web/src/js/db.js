const DB_NAME = 'explore_web';
const DB_VERSION = 1;
let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('activities')) {
        const act = db.createObjectStore('activities', { keyPath: 'id' });
        act.createIndex('profile', 'profile', { unique: false });
        act.createIndex('status', 'status', { unique: false });
        act.createIndex('category', 'category', { unique: false });
        act.createIndex('date', 'date', { unique: false });
      }
    };
    req.onsuccess = e => { dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = e => reject(e.target.error);
  });
}

async function getDB() {
  if (!dbInstance) await openDB();
  return dbInstance;
}

function tx(storeName, mode = 'readonly') {
  return getDB().then(db => db.transaction(storeName, mode).objectStore(storeName));
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const db = {
  async getSetting(key) {
    const store = await tx('settings');
    const result = await promisify(store.get(key));
    return result ? result.value : null;
  },

  async setSetting(key, value) {
    const store = await tx('settings', 'readwrite');
    return promisify(store.put({ key, value }));
  },

  async getSettings() {
    const store = await tx('settings');
    const results = await promisify(store.getAll());
    const settings = {};
    results.forEach(r => { settings[r.key] = r.value; });
    return settings;
  },

  async addActivity(activity) {
    const store = await tx('activities', 'readwrite');
    return promisify(store.put(activity));
  },

  async getActivity(id) {
    const store = await tx('activities');
    return promisify(store.get(id));
  },

  async getAllActivities() {
    const store = await tx('activities');
    return promisify(store.getAll());
  },

  async getActivitiesByProfile(profile) {
    const store = await tx('activities');
    const idx = store.index('profile');
    return promisify(idx.getAll(profile));
  },

  async getActivities(profile) {
    const store = await tx('activities');
    const idx = store.index('profile');
    return promisify(idx.getAll(profile));
  },

  async deleteActivity(id) {
    const store = await tx('activities', 'readwrite');
    return promisify(store.delete(id));
  },

  async clearActivities() {
    const store = await tx('activities', 'readwrite');
    return promisify(store.clear());
  },

  async importActivities(activities) {
    const store = await tx('activities', 'readwrite');
    for (const a of activities) {
      await promisify(store.put(a));
    }
  }
};

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
