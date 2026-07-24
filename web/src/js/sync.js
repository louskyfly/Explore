import { db } from './db.js';

const GIST_FILENAME = 'explore_activities.json';

export const sync = {
  async getToken() {
    return db.getSetting('github_token');
  },

  async setToken(token) {
    return db.setSetting('github_token', token);
  },

  async getGistId() {
    return db.getSetting('github_gist_id');
  },

  async setGistId(id) {
    return db.setSetting('github_gist_id', id);
  },

  async push() {
    const token = await this.getToken();
    if (!token) throw new Error('Token GitHub non configure');

    const papa = (await db.getActivitiesByProfile('papa')).map(a => ({ ...a }));
    const maman = (await db.getActivitiesByProfile('maman')).map(a => ({ ...a }));
    const data = { papa, maman, updatedAt: Date.now() };

    let gistId = await this.getGistId();

    if (gistId) {
      const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } }
        })
      });
      if (!resp.ok) throw new Error('Erreur push Gist');
    } else {
      const resp = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'Explore - Sync activities',
          public: false,
          files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } }
        })
      });
      if (!resp.ok) throw new Error('Erreur creation Gist');
      const gist = await resp.json();
      await this.setGistId(gist.id);
    }

    await db.setSetting('last_sync', Date.now());
    return true;
  },

  async pull() {
    const token = await this.getToken();
    if (!token) throw new Error('Token GitHub non configure');

    let gistId = await this.getGistId();

    if (!gistId) {
      const resp = await fetch('https://api.github.com/gists?per_page=100', {
        headers: { 'Authorization': `token ${token}` }
      });
      if (!resp.ok) throw new Error('Erreur lecture gists');
      const gists = await resp.json();
      const existing = gists.find(g => g.files[GIST_FILENAME]);
      if (!existing) return false;
      gistId = existing.id;
      await this.setGistId(gistId);
    }

    const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { 'Authorization': `token ${token}` }
    });
    if (!resp.ok) throw new Error('Erreur lecture Gist');
    const gist = await resp.json();

    if (!gist.files[GIST_FILENAME]) return false;

    const raw = gist.files[GIST_FILENAME].content;
    const data = JSON.parse(raw);

    const allLocal = await db.getAllActivities();
    const localMap = {};
    allLocal.forEach(a => { localMap[a.id] = a; });

    const incoming = [
      ...(data.papa || []),
      ...(data.maman || [])
    ];

    let merged = 0;
    for (const a of incoming) {
      const local = localMap[a.id];
      if (!local || (a.updatedAt || 0) > (local.updatedAt || 0)) {
        await db.addActivity(a);
        merged++;
      }
    }

    await db.setSetting('last_sync', Date.now());
    return merged;
  },

  async deleteRemote() {
    const token = await this.getToken();
    const gistId = await this.getGistId();
    if (!token || !gistId) return;

    try {
      await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${token}` }
      });
    } catch (e) {}
    await db.setSetting('github_gist_id', null);
  },

  async getLastSync() {
    return db.getSetting('last_sync');
  }
};
