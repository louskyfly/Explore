import { db } from '../db.js';
import { getCurrentProfile } from './profileSelect.js';
import { updateHeader, showModal, showToast, getCategoryById, formatDate } from '../components.js';

export async function renderActivityDetail(container, activityId) {
  const profile = getCurrentProfile();
  if (!profile) return;

  const activity = await db.getActivity(activityId);
  if (!activity) {
    showToast('Activite introuvable', 'error');
    window.dispatchEvent(new CustomEvent('navigate-home'));
    return;
  }

  updateHeader('Detail');

  const cat = getCategoryById(activity.category);
  const isDone = activity.status === 'done';

  container.innerHTML = `
    <div class="page">
      <div class="glass-card animate-in" style="padding:20px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
          <div class="activity-icon ${cat.cssClass}" style="width:52px;height:52px;font-size:26px;border-radius:14px;">${cat.icon}</div>
          <div style="flex:1">
            <h2 style="font-size:20px;font-weight:700;${isDone ? 'text-decoration:line-through;color:var(--text-tertiary)' : ''}">${escapeHtml(activity.title)}</h2>
            <span class="activity-category ${cat.cssClass}">${cat.label}</span>
          </div>
        </div>

        ${activity.description ? `
          <p style="font-size:14px;color:var(--text-secondary);line-height:1.5;margin-bottom:16px;">${escapeHtml(activity.description)}</p>
        ` : ''}

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
          ${activity.date ? `
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-secondary);">
              \uD83D\uDCC5 <span>${formatDate(activity.date)}</span>
            </div>
          ` : ''}
          ${activity.locationName ? `
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-secondary);">
              \uD83D\uDCCD <span>${escapeHtml(activity.locationName)}</span>
            </div>
          ` : ''}
          <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-secondary);">
            \u23F0 <span>Creee ${formatDate(activity.createdAt)}</span>
          </div>
        </div>

        ${activity.lat && activity.lng ? `
          <div id="detail-map" style="height:180px;border-radius:12px;overflow:hidden;margin-bottom:16px;"></div>
        ` : ''}

        <div style="display:flex;gap:10px;">
          <button class="btn ${isDone ? 'btn-secondary' : 'btn-primary'}" style="flex:1" id="btn-toggle-status">
            ${isDone ? 'Reactiver' : 'Terminer'}
          </button>
          <button class="btn btn-secondary" style="flex:1" id="btn-edit">
            Modifier
          </button>
          <button class="btn btn-danger" id="btn-delete" style="padding:12px 16px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  if (activity.lat && activity.lng) {
    setTimeout(() => {
      try {
        const map = L.map('detail-map', { zoomControl: false, attributionControl: false }).setView([activity.lat, activity.lng], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        const marker = L.marker([activity.lat, activity.lng]).addTo(map);
        setTimeout(() => map.invalidateSize(), 100);
      } catch (e) {}
    }, 100);
  }

  container.querySelector('#btn-toggle-status').addEventListener('click', async () => {
    activity.status = isDone ? 'pending' : 'done';
    activity.updatedAt = Date.now();
    await db.addActivity(activity);
    showToast(isDone ? 'Reactivee' : 'Terminee !', 'success');
    renderActivityDetail(container, activityId);
  });

  container.querySelector('#btn-edit').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate-edit', { detail: { id: activityId } }));
  });

  container.querySelector('#btn-delete').addEventListener('click', () => {
    showModal('Supprimer ?', 'Cette action est irreversible.', [
      { id: 'cancel', label: 'Annuler', class: 'btn-secondary' },
      {
        id: 'delete', label: 'Supprimer', class: 'btn-danger',
        onClick: async () => {
          await db.deleteActivity(activityId);
          showToast('Supprimee', 'success');
          window.dispatchEvent(new CustomEvent('navigate-home'));
        }
      }
    ]);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
