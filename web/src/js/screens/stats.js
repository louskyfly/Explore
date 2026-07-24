import { db } from '../db.js';
import { getCurrentProfile } from './profileSelect.js';
import { updateHeader, CATEGORIES, getCategoryById } from '../components.js';

export async function renderStats(container) {
  const profile = getCurrentProfile();
  if (!profile) return;

  updateHeader('Statistiques');

  const activities = await db.getActivitiesByProfile(profile);
  const total = activities.length;
  const done = activities.filter(a => a.status === 'done').length;
  const pending = total - done;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const byCategory = {};
  CATEGORIES.forEach(c => { byCategory[c.id] = { total: 0, done: 0 }; });
  activities.forEach(a => {
    const cat = a.category || 'other';
    if (byCategory[cat]) {
      byCategory[cat].total++;
      if (a.status === 'done') byCategory[cat].done++;
    }
  });

  const maxCat = Math.max(...Object.values(byCategory).map(v => v.total), 1);

  container.innerHTML = `
    <div class="page">
      <h2 class="section-title animate-in">Resume</h2>
      <div class="stats-grid animate-in stagger-1">
        <div class="stat-card glass-card">
          <div class="stat-value">${total}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value">${pending}</div>
          <div class="stat-label">A faire</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value">${done}</div>
          <div class="stat-label">Terminees</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value">${percent}%</div>
          <div class="stat-label">Progression</div>
        </div>
      </div>

      <div class="glass-card animate-in stagger-2" style="padding:16px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:14px;font-weight:600;">Progression globale</span>
          <span style="font-size:14px;color:var(--text-secondary);">${done}/${total}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${percent}%"></div>
        </div>
      </div>

      <h2 class="section-title animate-in stagger-3">Par categorie</h2>
      <div class="bar-chart animate-in stagger-4">
        ${CATEGORIES.map(c => {
          const data = byCategory[c.id];
          const width = maxCat > 0 ? (data.total / maxCat) * 100 : 0;
          return `
            <div class="bar-row">
              <div class="bar-label">${c.icon} ${c.label}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${width}%">
                  ${data.total > 0 ? `<span class="bar-value">${data.total}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${total > 0 ? `
        <h2 class="section-title animate-in stagger-5">Dernieres activites</h2>
        <div class="animate-in stagger-6">
          ${activities.slice(0, 5).map(a => {
            const cat = getCategoryById(a.category);
            return `
              <div class="activity-card glass-card" style="cursor:pointer" data-id="${a.id}">
                <div class="activity-icon ${cat.cssClass}">${cat.icon}</div>
                <div class="activity-info">
                  <div class="activity-title" style="${a.status === 'done' ? 'text-decoration:line-through;color:var(--text-tertiary)' : ''}">${escapeHtml(a.title)}</div>
                  <div class="activity-meta">
                    <span class="activity-category ${cat.cssClass}">${cat.label}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
  `;

  container.querySelectorAll('.activity-card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate-detail', { detail: { id: card.dataset.id } }));
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
