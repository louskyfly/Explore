import { db } from '../db.js';
import { updateHeader, showModal, showToast, formatDate, timeAgo } from '../components.js';
import { cities } from './home.js';

export async function renderGallery(container) {
  updateHeader('Galerie');
  const photos = await db.getAllPhotos();
  const sorted = photos.sort((a, b) => b.timestamp - a.timestamp);

  container.innerHTML = `
    <div class="page">
      <div style="text-align:center;margin-bottom:20px" class="animate-in">
        <div style="font-size:48px;margin-bottom:8px">🖼️</div>
        <h2 style="font-size:22px;font-weight:700">Galerie</h2>
        <p style="font-size:14px;color:var(--text-secondary);margin-top:4px">${photos.length} photo${photos.length > 1 ? 's' : ''}</p>
      </div>

      ${sorted.length ? `
        <div class="gallery-grid animate-in stagger-1">
          ${sorted.map(photo => {
            const route = cities.flatMap(c => c.routes).find(r => r.id === photo.routeId);
            return `
              <div class="gallery-item" data-photo="${photo.id}">
                <img src="${photo.data}" alt="Photo" loading="lazy">
                <div class="gallery-item-overlay">
                  ${photo.score ? `${photo.score}%` : ''} · ${timeAgo(photo.timestamp)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="gallery-empty animate-in stagger-1">
          <div class="gallery-empty-icon">📷</div>
          <h3>Aucune photo</h3>
          <p style="color:var(--text-secondary);margin-top:8px">Commencez un rallye photo pour remplir votre galerie !</p>
          <button class="btn btn-primary" style="margin-top:16px" onclick="document.querySelector('[data-tab=rally]').click()">
            📸 Commencer un rallye
          </button>
        </div>
      `}
    </div>
  `;

  container.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', async () => {
      const photoId = item.dataset.photo;
      const photo = await db.getPhoto(photoId);
      if (photo) showPhotoDetail(photo);
    });
  });
}

function showPhotoDetail(photo) {
  const content = `
    <div style="margin: -20px -20px 16px">
      <img src="${photo.data}" style="width:100%;display:block" alt="Photo">
    </div>
    <div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px">
      ${photo.score !== undefined ? `
        <div style="text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--accent)">${photo.score}%</div>
          <div style="font-size:11px;color:var(--text-secondary)">Note</div>
        </div>
      ` : ''}
      ${photo.points !== undefined ? `
        <div style="text-align:center">
          <div style="font-size:24px;font-weight:800;color:var(--accent)">+${photo.points}</div>
          <div style="font-size:11px;color:var(--text-secondary)">Points</div>
        </div>
      ` : ''}
      <div style="text-align:center">
        <div style="font-size:14px;font-weight:600">${formatDate(photo.timestamp)}</div>
        <div style="font-size:11px;color:var(--text-secondary)">${timeAgo(photo.timestamp)}</div>
      </div>
    </div>
  `;

  showModal('Photo', content, [
    { id: 'delete', label: '🗑️ Supprimer', class: 'btn-danger' },
    { id: 'close', label: 'Fermer', class: 'btn-secondary' }
  ]);

  document.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
    await db.deletePhoto(photo.id);
    showToast('Photo supprimée', 'info');
    renderGallery(document.getElementById('page-container'));
  });
}
