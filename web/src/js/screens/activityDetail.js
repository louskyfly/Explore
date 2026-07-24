import { db } from '../db.js';
import { getCurrentProfile } from './profileSelect.js';
import { updateHeader, formatDate, getStatusById, getTagColor, showModal, showToast, STATUSES } from '../components.js';

export async function renderActivityDetail(container, activityId) {
  const profile = getCurrentProfile();
  if (!profile) return;

  const activity = await db.getActivity(activityId);
  if (!activity) {
    updateHeader('Introuvable');
    container.innerHTML = '<div class="page"><div class="empty-state"><p>Activite introuvable</p></div></div>';
    return;
  }

  updateHeader(activity.title);

  const status = getStatusById(activity.status);
  const tagsHtml = (activity.tags || []).map(t => `
    <span class="tag-pill" style="background:${getTagColor(t)}22;color:${getTagColor(t)};border:1px solid ${getTagColor(t)}44;">
      ${escapeHtml(t)}
    </span>
  `).join('');

  container.innerHTML = `
    <div class="page">
      ${activity.image ? `
        <div class="detail-image-container">
          <img src="${activity.image}" alt="${activity.title}" class="detail-image">
        </div>
      ` : ''}
      <div class="detail-content">
        <h1 class="detail-title">${escapeHtml(activity.title)}</h1>
        ${activity.date ? `<p class="detail-date">${formatDate(new Date(activity.date).getTime())}</p>` : ''}

        <div class="detail-section">
          <label class="input-label">Statut</label>
          <div class="status-selector" id="status-selector">
            ${STATUSES.map(s => `
              <button type="button" class="status-selector-btn ${activity.status === s.id ? 'active' : ''}" data-status="${s.id}">
                ${s.icon} ${s.label}
              </button>
            `).join('')}
          </div>
        </div>

        ${tagsHtml ? `
          <div class="detail-section">
            <label class="input-label">Tags</label>
            <div class="detail-tags">${tagsHtml}</div>
          </div>
        ` : ''}

        ${activity.description ? `
          <div class="detail-section">
            <label class="input-label">Description</label>
            <p class="detail-desc">${escapeHtml(activity.description)}</p>
          </div>
        ` : ''}

        ${activity.locationName ? `
          <div class="detail-section">
            <label class="input-label">Lieu</label>
            <p class="detail-location">\uD83D\uDCCD ${escapeHtml(activity.locationName)}</p>
          </div>
        ` : ''}

        ${activity.lat && activity.lng ? `
          <div class="detail-section" id="detail-map-section">
            <div id="detail-map" class="detail-map"></div>
          </div>
        ` : ''}
      </div>

      <div class="detail-actions">
        <button class="btn btn-secondary btn-full" id="btn-edit">Modifier</button>
        <button class="btn btn-danger btn-icon" id="btn-delete" title="Supprimer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
      </div>
      <div class="detail-actions">
        <button class="btn btn-secondary btn-full" id="btn-navigate">Naviguer</button>
        <button class="btn btn-secondary btn-full" id="btn-share">Partager</button>
      </div>
    </div>
  `;

  container.querySelectorAll('#status-selector .status-selector-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      container.querySelectorAll('#status-selector .status-selector-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activity.status = btn.dataset.status;
      activity.updatedAt = Date.now();
      await db.addActivity(activity);
      showToast('Statut mis a jour', 'success');
    });
  });

  if (activity.lat && activity.lng) {
    setTimeout(() => {
      const map = L.map('detail-map', { zoomControl: false }).setView([activity.lat, activity.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      const statusObj = getStatusById(activity.status);
      const marker = L.circleMarker([activity.lat, activity.lng], {
        radius: 8, fillColor: statusObj.color, color: '#fff', weight: 2, fillOpacity: 0.9
      }).addTo(map);
      if (activity.image) marker.bindPopup(`<img src="${activity.image}" style="width:120px;border-radius:8px;">`);
      setTimeout(() => map.invalidateSize(), 100);
    }, 200);
  }

  container.querySelector('#btn-edit').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate-edit', { detail: { id: activityId } }));
  });

  container.querySelector('#btn-delete').addEventListener('click', () => {
    showModal('Supprimer ?', 'Cette action est irreversible.', async () => {
      await db.deleteActivity(activityId);
      showToast('Activite supprimee', 'success');
      window.dispatchEvent(new CustomEvent('navigate-home'));
    });
  });

  container.querySelector('#btn-navigate').addEventListener('click', () => {
    if (activity.lat && activity.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${activity.lat},${activity.lng}`, '_blank');
    } else {
      showToast('Pas de localisation', 'error');
    }
  });

  container.querySelector('#btn-share').addEventListener('click', async () => {
    const shareData = {
      title: activity.title,
      text: `${activity.title}${activity.description ? ' - ' + activity.description : ''}`,
    };
    if (activity.lat && activity.lng) {
      shareData.url = `https://www.google.com/maps?q=${activity.lat},${activity.lng}`;
    }
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Partage annule', 'error');
      }
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
