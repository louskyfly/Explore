import { db } from '../db.js';
import { updateHeader, showModal, showToast } from '../components.js';

export async function renderProfile(container) {
  updateHeader('Profil');
  const username = await db.getSetting('username') || '';
  const teamId = await db.getSetting('currentTeam');
  const team = teamId ? await db.getTeam(teamId) : null;
  const allProgress = await db.getAllProgress();
  const allPhotos = await db.getAllPhotos();
  const allChallenges = await db.getAllChallenges();
  const allAchievements = await db.getAllAchievements();

  const totalPoints = allProgress.reduce((s, p) => s + (p.points || 0), 0) + allChallenges.filter(c => c.completed).reduce((s, c) => s + (c.earnedPoints || 0), 0);
  const completedSteps = allProgress.filter(p => p.completed).length;
  const completedChallenges = allChallenges.filter(c => c.completed).length;

  container.innerHTML = `
    <div class="page">
      <div style="text-align:center;padding:20px 0" class="animate-in">
        <div class="avatar-large" style="width:80px;height:80px;font-size:32px;margin:0 auto 12px">${username ? username[0].toUpperCase() : '?'}</div>
        <h2 style="font-size:22px;font-weight:700">${username || 'Invité'}</h2>
        ${team ? `<p style="font-size:14px;color:var(--text-secondary);margin-top:4px">${team.emoji || '👥'} ${team.name}</p>` : '<p style="font-size:14px;color:var(--text-tertiary);margin-top:4px">Aucune équipe</p>'}
      </div>

      <div class="stats-grid animate-in stagger-1">
        <div class="stat-card glass-card">
          <div class="stat-value">${totalPoints}</div>
          <div class="stat-label">Points</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value">${allPhotos.length}</div>
          <div class="stat-label">Photos</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value">${completedSteps}</div>
          <div class="stat-label">Étapes</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value">${completedChallenges}</div>
          <div class="stat-label">Défis</div>
        </div>
      </div>

      <div class="section-title animate-in stagger-2">Paramètres du profil</div>
      <div class="glass-card animate-in stagger-3" style="padding:16px">
        <div class="input-group" style="margin-bottom:12px">
          <label class="input-label">Pseudo</label>
          <div style="display:flex;gap:8px">
            <input class="input" id="profile-username" value="${username}" placeholder="Votre pseudo" style="flex:1">
            <button class="btn btn-primary btn-sm" id="btn-save-username">✓</button>
          </div>
        </div>
        <div class="input-group" style="margin-bottom:0">
          <label class="input-label">Thème</label>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-theme" data-theme="dark" style="flex:1">🌙 Sombre</button>
            <button class="btn btn-sm btn-theme" data-theme="light" style="flex:1">☀️ Clair</button>
            <button class="btn btn-sm btn-theme" data-theme="auto" style="flex:1">🔄 Auto</button>
          </div>
        </div>
      </div>

      <div class="section-title animate-in stagger-4" style="margin-top:20px">🏆 Succès récents</div>
      ${allAchievements.length ? allAchievements.slice(-5).reverse().map((a, i) => `
        <div class="achievement-card glass-card animate-in stagger-${Math.min(i + 5, 6)}">
          <div class="achievement-icon" style="background:rgba(48,209,88,0.15)">${a.icon || '🏅'}</div>
          <div class="achievement-info">
            <h4>${a.name}</h4>
            <p>${a.description}</p>
          </div>
        </div>
      `).join('') : `
        <div class="glass-card animate-in stagger-5" style="padding:20px;text-align:center;color:var(--text-secondary)">
          <p>Pas encore de succès</p>
        </div>
      `}

      <div style="margin-top:24px" class="animate-in stagger-6">
        <button class="btn btn-danger btn-full" id="btn-reset-data">🗑️ Réinitialiser toutes les données</button>
      </div>
    </div>
  `;

  document.getElementById('btn-save-username')?.addEventListener('click', async () => {
    const name = document.getElementById('profile-username')?.value?.trim();
    if (name) {
      await db.setSetting('username', name);
      showToast('Pseudo mis à jour', 'success');
    }
  });

  document.querySelectorAll('.btn-theme').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.theme;
      await db.setSetting('theme', mode);
      document.documentElement.setAttribute('data-theme', mode === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode);
      showToast(`Thème ${mode === 'dark' ? 'sombre' : mode === 'light' ? 'clair' : 'automatique'} activé`, 'success');
    });
  });

  document.getElementById('btn-reset-data')?.addEventListener('click', () => {
    showModal('Confirmation', '<p style="text-align:center;color:var(--text-secondary)">Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.</p>', [
      { id: 'cancel', label: 'Annuler', class: 'btn-secondary' },
      { id: 'confirm', label: 'Supprimer', class: 'btn-danger', onClick: async () => {
        indexedDB.deleteDatabase('explore_pwa');
        location.reload();
      }}
    ]);
  });
}
