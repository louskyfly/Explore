import { db } from '../db.js';
import { updateHeader, timeAgo, formatDate } from '../components.js';

export async function renderHistory(container) {
  updateHeader('Historique');
  const history = await db.getHistory();

  const groupedByDate = {};
  history.forEach(entry => {
    const dateKey = new Date(entry.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(entry);
  });

  const icons = {
    step_completed: '✅',
    challenge_completed: '🏆',
    route_completed: '🎉',
    team_joined: '👥',
    achievement_unlocked: '🏅',
    photo_taken: '📸'
  };

  container.innerHTML = `
    <div class="page">
      <div style="text-align:center;margin-bottom:24px" class="animate-in">
        <div style="font-size:48px;margin-bottom:8px">🕐</div>
        <h2 style="font-size:22px;font-weight:700">Historique</h2>
        <p style="font-size:14px;color:var(--text-secondary);margin-top:4px">${history.length} événement${history.length > 1 ? 's' : ''}</p>
      </div>

      ${Object.keys(groupedByDate).length ? Object.entries(groupedByDate).map(([date, entries], gi) => `
        <div class="section-title animate-in stagger-${Math.min(gi + 1, 6)}">${date}</div>
        ${entries.map((entry, i) => `
          <div class="glass-card animate-in stagger-${Math.min(i + 2, 6)}" style="padding:14px;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start">
            <div style="font-size:24px;flex-shrink:0">${icons[entry.type] || '📌'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:15px">${entry.title}</div>
              ${entry.detail ? `<div style="font-size:13px;color:var(--text-secondary);margin-top:2px">${entry.detail}</div>` : ''}
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px">${timeAgo(entry.timestamp)}</div>
            </div>
          </div>
        `).join('')}
      `).join('') : `
        <div class="empty-state animate-in stagger-1">
          <div class="empty-state-icon">🕐</div>
          <h3>Aucun historique</h3>
          <p style="color:var(--text-secondary);margin-top:8px">Votre activité apparaîtra ici</p>
        </div>
      `}
    </div>
  `;
}
