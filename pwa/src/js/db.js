const DB_NAME = 'explore_pwa';
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
      if (!db.objectStoreNames.contains('photos')) {
        const ps = db.createObjectStore('photos', { keyPath: 'id' });
        ps.createIndex('routeId', 'routeId', { unique: false });
        ps.createIndex('stepId', 'stepId', { unique: false });
        ps.createIndex('teamId', 'teamId', { unique: false });
        ps.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('progress')) {
        const pg = db.createObjectStore('progress', { keyPath: 'id' });
        pg.createIndex('city', 'city', { unique: false });
        pg.createIndex('routeId', 'routeId', { unique: false });
      }
      if (!db.objectStoreNames.contains('teams')) {
        db.createObjectStore('teams', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('challenges')) {
        const ch = db.createObjectStore('challenges', { keyPath: 'id' });
        ch.createIndex('stepId', 'stepId', { unique: false });
      }
      if (!db.objectStoreNames.contains('history')) {
        const hs = db.createObjectStore('history', { keyPath: 'id' });
        hs.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('achievements')) {
        db.createObjectStore('achievements', { keyPath: 'id' });
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

  async addPhoto(photo) {
    const store = await tx('photos', 'readwrite');
    return promisify(store.put(photo));
  },

  async getPhoto(id) {
    const store = await tx('photos');
    return promisify(store.get(id));
  },

  async getPhotosByRoute(routeId) {
    const store = await tx('photos');
    const idx = store.index('routeId');
    return promisify(idx.getAll(routeId));
  },

  async getAllPhotos() {
    const store = await tx('photos');
    return promisify(store.getAll());
  },

  async deletePhoto(id) {
    const store = await tx('photos', 'readwrite');
    return promisify(store.delete(id));
  },

  async saveProgress(progress) {
    const store = await tx('progress', 'readwrite');
    return promisify(store.put(progress));
  },

  async getProgress(city) {
    const store = await tx('progress');
    const idx = store.index('city');
    return promisify(idx.getAll(city));
  },

  async getAllProgress() {
    const store = await tx('progress');
    return promisify(store.getAll());
  },

  async saveTeam(team) {
    const store = await tx('teams', 'readwrite');
    return promisify(store.put(team));
  },

  async getTeam(id) {
    const store = await tx('teams');
    return promisify(store.get(id));
  },

  async getAllTeams() {
    const store = await tx('teams');
    return promisify(store.getAll());
  },

  async deleteTeam(id) {
    const store = await tx('teams', 'readwrite');
    return promisify(store.delete(id));
  },

  async saveChallenge(challenge) {
    const store = await tx('challenges', 'readwrite');
    return promisify(store.put(challenge));
  },

  async getChallengesByStep(stepId) {
    const store = await tx('challenges');
    const idx = store.index('stepId');
    return promisify(idx.getAll(stepId));
  },

  async getAllChallenges() {
    const store = await tx('challenges');
    return promisify(store.getAll());
  },

  async addHistory(entry) {
    const store = await tx('history', 'readwrite');
    return promisify(store.put(entry));
  },

  async getHistory() {
    const store = await tx('history');
    const results = await promisify(store.getAll());
    return results.sort((a, b) => b.timestamp - a.timestamp);
  },

  async saveAchievement(achievement) {
    const store = await tx('achievements', 'readwrite');
    return promisify(store.put(achievement));
  },

  async getAchievement(id) {
    const store = await tx('achievements');
    return promisify(store.get(id));
  },

  async getAllAchievements() {
    const store = await tx('achievements');
    return promisify(store.getAll());
  }
};

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
