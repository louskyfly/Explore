import { db, genId } from '../db.js';
import { getCurrentProfile } from './profileSelect.js';
import { updateHeader, showToast, CATEGORIES } from '../components.js';

export async function renderCreateActivity(container, editingId) {
  const profile = getCurrentProfile();
  if (!profile) return;

  updateHeader(editingId ? 'Modifier' : 'Nouvelle activite');

  let activity = null;
  if (editingId) {
    activity = await db.getActivity(editingId);
    if (!activity) {
      showToast('Activite introuvable', 'error');
      return;
    }
  }

  container.innerHTML = `
    <div class="page">
      <form id="activity-form">
        <div class="input-group">
          <label class="input-label">Titre *</label>
          <input class="input" type="text" id="act-title" placeholder="Ex: Reunion medecin" value="${activity ? escapeAttr(activity.title) : ''}" required>
        </div>

        <div class="input-group">
          <label class="input-label">Description</label>
          <textarea class="input" id="act-desc" placeholder="Details optionnels...">${activity ? escapeHtml(activity.description || '') : ''}</textarea>
        </div>

        <div class="input-group">
          <label class="input-label">Categorie</label>
          <select class="input" id="act-category">
            ${CATEGORIES.map(c => `
              <option value="${c.id}" ${activity && activity.category === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>
            `).join('')}
          </select>
        </div>

        <div class="input-group">
          <label class="input-label">Date</label>
          <input class="input" type="date" id="act-date" value="${activity ? (activity.date || '') : new Date().toISOString().split('T')[0]}">
        </div>

        <div class="input-group">
          <label class="input-label">Lieu</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input class="input" type="text" id="act-location-name" placeholder="Nom du lieu" value="${activity ? escapeAttr(activity.locationName || '') : ''}" style="flex:1">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-pick-location">Carte</button>
          </div>
          <input type="hidden" id="act-lat" value="${activity ? (activity.lat || '') : ''}">
          <input type="hidden" id="act-lng" value="${activity ? (activity.lng || '') : ''}">
        </div>

        <div style="display:flex;gap:12px;margin-top:8px">
          <button type="submit" class="btn btn-primary btn-full">
            ${editingId ? 'Enregistrer' : 'Creer'}
          </button>
        </div>

        ${editingId ? `
          <button type="button" class="btn btn-danger btn-full" style="margin-top:12px" id="btn-delete">
            Supprimer
          </button>
        ` : ''}
      </form>
    </div>
  `;

  container.querySelector('#activity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = container.querySelector('#act-title').value.trim();
    if (!title) return showToast('Titre requis', 'error');

    const now = Date.now();
    const data = {
      id: editingId || genId(),
      profile,
      title,
      description: container.querySelector('#act-desc').value.trim(),
      category: container.querySelector('#act-category').value,
      date: container.querySelector('#act-date').value,
      locationName: container.querySelector('#act-location-name').value.trim() || null,
      lat: parseFloat(container.querySelector('#act-lat').value) || null,
      lng: parseFloat(container.querySelector('#act-lng').value) || null,
      status: activity ? activity.status : 'pending',
      createdAt: activity ? activity.createdAt : now,
      updatedAt: now
    };

    await db.addActivity(data);
    showToast(editingId ? 'Modifie !' : 'Cree !', 'success');
    window.dispatchEvent(new CustomEvent('navigate-home'));
  });

  if (editingId) {
    container.querySelector('#btn-delete').addEventListener('click', async () => {
      showModal('Supprimer ?', 'Cette action est irreversible.', [
        { id: 'cancel', label: 'Annuler', class: 'btn-secondary' },
        {
          id: 'delete', label: 'Supprimer', class: 'btn-danger',
          onClick: async () => {
            await db.deleteActivity(editingId);
            showToast('Supprimee', 'success');
            window.dispatchEvent(new CustomEvent('navigate-home'));
          }
        }
      ]);
    });
  }

  container.querySelector('#btn-pick-location').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate-picker', {
      detail: {
        lat: parseFloat(container.querySelector('#act-lat').value) || null,
        lng: parseFloat(container.querySelector('#act-lng').value) || null,
        onSelect: (lat, lng, name) => {
          container.querySelector('#act-lat').value = lat;
          container.querySelector('#act-lng').value = lng;
          container.querySelector('#act-location-name').value = name || '';
        }
      }
    }));
  });
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
