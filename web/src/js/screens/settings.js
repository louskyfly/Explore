import { db } from '../db.js';
import { getCurrentProfile, logout } from './profileSelect.js';
import { updateHeader, showModal, showToast, timeAgo } from '../components.js';
import { sync } from '../sync.js';
import { theme } from '../theme.js';

export async function renderSettings(container) {
  const profile = getCurrentProfile();
  if (!profile) return;

  updateHeader('Parametres');

  const token = await sync.getToken();
  const lastSync = await sync.getLastSync();

  container.innerHTML = `
    <div class="page">
      <div class="settings-section animate-in">
        <div class="settings-section-title">Profil</div>
        <div class="settings-card glass-card">
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>${profile === 'papa' ? 'Papa' : 'Maman'}</h4>
              <p>Profil actif</p>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Deconnexion</h4>
              <p>Retour a l'ecran de selection</p>
            </div>
            <button class="btn btn-sm btn-danger" id="btn-logout">Quitter</button>
          </div>
        </div>
      </div>

      <div class="settings-section animate-in stagger-1">
        <div class="settings-section-title">Apparence</div>
        <div class="settings-card glass-card">
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Mode sombre</h4>
              <p>${theme.current === 'dark' ? 'Active' : 'Desactive'}</p>
            </div>
            <button class="toggle ${theme.current === 'dark' ? 'on' : ''}" id="toggle-theme"></button>
          </div>
        </div>
      </div>

      <div class="settings-section animate-in stagger-2">
        <div class="settings-section-title">Synchronisation GitHub</div>
        <div class="settings-card glass-card">
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Token GitHub</h4>
              <p>${token ? 'Configure \u2705' : 'Non configure'}</p>
            </div>
          </div>
          <div style="padding:12px 16px;">
            <input class="input" type="password" id="input-token" placeholder="ghp_xxxxxxxxxxxx" value="${token || ''}">
            <button class="btn btn-sm btn-primary btn-full" style="margin-top:8px;" id="btn-save-token">Enregistrer</button>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Push (vers GitHub)</h4>
              <p>Envoyer vos activites</p>
            </div>
            <button class="btn btn-sm btn-primary" id="btn-push" ${!token ? 'disabled' : ''}>Push</button>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Pull (depuis GitHub)</h4>
              <p>Recuperer les activites</p>
            </div>
            <button class="btn btn-sm btn-secondary" id="btn-pull" ${!token ? 'disabled' : ''}>Pull</button>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Derniere synchro</h4>
              <p>${lastSync ? timeAgo(lastSync) : 'Jamais'}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section animate-in stagger-3">
        <div class="settings-section-title">Donnees</div>
        <div class="settings-card glass-card">
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Exporter</h4>
              <p>Telecharger en JSON</p>
            </div>
            <button class="btn btn-sm btn-secondary" id="btn-export">Exporter</button>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Importer</h4>
              <p>Charger depuis un fichier JSON</p>
            </div>
            <button class="btn btn-sm btn-secondary" id="btn-import">Importer</button>
            <input type="file" id="file-import" accept=".json" style="display:none">
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Tout supprimer</h4>
              <p>Supprimer toutes les activites</p>
            </div>
            <button class="btn btn-sm btn-danger" id="btn-reset">Reset</button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-logout').addEventListener('click', () => {
    logout();
  });

  container.querySelector('#toggle-theme').addEventListener('click', async (e) => {
    await theme.toggle();
    renderSettings(container);
  });

  container.querySelector('#btn-save-token').addEventListener('click', async () => {
    const val = container.querySelector('#input-token').value.trim();
    await sync.setToken(val || null);
    showToast(val ? 'Token enregistre' : 'Token supprime', 'success');
    renderSettings(container);
  });

  container.querySelector('#btn-push').addEventListener('click', async () => {
    try {
      showToast('Push en cours...', 'info');
      await sync.push();
      showToast('Push termine !', 'success');
      renderSettings(container);
    } catch (e) {
      showToast('Erreur: ' + e.message, 'error');
    }
  });

  container.querySelector('#btn-pull').addEventListener('click', async () => {
    try {
      showToast('Pull en cours...', 'info');
      const count = await sync.pull();
      showToast(count ? `${count} activite(s) recuperee(s)` : 'Aucune nouveaute', 'success');
      renderSettings(container);
    } catch (e) {
      showToast('Erreur: ' + e.message, 'error');
    }
  });

  container.querySelector('#btn-export').addEventListener('click', async () => {
    const activities = await db.getAllActivities();
    const blob = new Blob([JSON.stringify(activities, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'explore_activities.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exporte !', 'success');
  });

  container.querySelector('#btn-import').addEventListener('click', () => {
    container.querySelector('#file-import').click();
  });

  container.querySelector('#file-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const activities = JSON.parse(text);
      if (!Array.isArray(activities)) throw new Error('Format invalide');
      await db.importActivities(activities);
      showToast(`${activities.length} activite(s) importee(s)`, 'success');
      renderSettings(container);
    } catch (e) {
      showToast('Erreur d\'import: ' + e.message, 'error');
    }
  });

  container.querySelector('#btn-reset').addEventListener('click', () => {
    showModal('Tout supprimer ?', 'Toutes les activites seront supprimees.', [
      { id: 'cancel', label: 'Annuler', class: 'btn-secondary' },
      {
        id: 'delete', label: 'Tout supprimer', class: 'btn-danger',
        onClick: async () => {
          await db.clearActivities();
          showToast('Tout supprime', 'success');
          renderSettings(container);
        }
      }
    ]);
  });
}
