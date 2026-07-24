import { db, genId } from '../db.js';
import { getCurrentProfile } from './profileSelect.js';
import { updateHeader, showModal, showToast, getCategoryById, formatDate, timeAgo } from '../components.js';

const STATUS_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'A faire' },
  { id: 'done', label: 'Terminees' }
];

export async function renderHome(container) {
  const profile = getCurrentProfile();
  if (!profile) return;

  updateHeader('Explore');

  const activities = (await db.getActivitiesByProfile(profile))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const total = activities.length;
  const done = activities.filter(a => a.status === 'done').length;
  const pending = total - done;

  container.innerHTML = `
    <div class="page">
      <div class="home-hero animate-in">
        <h2>Bonjour !</h2>
        <p>${total} activit${total !== 1 ? 'es' : 'e'} au total</p>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-value">${pending}</div>
            <div class="hero-stat-label">A faire</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-value">${done}</div>
            <div class="hero-stat-label">Terminees</div>
          </div>
        </div>
      </div>

      <div class="search-bar animate-in stagger-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="search-input" placeholder="Rechercher...">
      </div>

      <div class="filter-chips animate-in stagger-2" id="filter-chips">
        ${STATUS_FILTERS.map(f => `
          <button class="filter-chip ${f.id === 'all' ? 'active' : ''}" data-filter="${f.id}">${f.label}</button>
        `).join('')}
      </div>

      <div id="activities-list"></div>
    </div>

    <button class="fab" id="fab-add" aria-label="Ajouter">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>
  `;

  let currentFilter = 'all';
  let searchQuery = '';

  function renderList() {
    const list = container.querySelector('#activities-list');
    let filtered = activities;

    if (currentFilter !== 'all') {
      filtered = filtered.filter(a => a.status === currentFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${searchQuery ? '\uD83D\uDD0D' : '\uD83D\uDCCB'}</div>
          <h3>${searchQuery ? 'Aucun resultat' : 'Aucune activite'}</h3>
          <p>${searchQuery ? 'Essayez une autre recherche' : 'Appuyez sur + pour creer une activite'}</p>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map((a, i) => {
      const cat = getCategoryById(a.category);
      return `
        <div class="activity-card glass-card animate-in stagger-${Math.min(i + 1, 6)}" data-id="${a.id}">
          <div class="activity-icon ${cat.cssClass}">${cat.icon}</div>
          <div class="activity-info">
            <div class="activity-title">${escapeHtml(a.title)}</div>
            <div class="activity-meta">
              <span class="activity-category ${cat.cssClass}">${cat.label}</span>
              ${a.date ? `<span class="activity-date">${formatDate(a.date)}</span>` : ''}
            </div>
            ${a.locationName ? `<div class="activity-location">\uD83D\uDCCD ${escapeHtml(a.locationName)}</div>` : ''}
          </div>
          <div class="activity-status ${a.status === 'done' ? 'done' : ''}" data-toggle="${a.id}"></div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.activity-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.activity-status')) return;
        window.dispatchEvent(new CustomEvent('navigate-detail', { detail: { id: card.dataset.id } }));
      });
    });

    list.querySelectorAll('.activity-status').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.toggle;
        const activity = activities.find(a => a.id === id);
        if (activity) {
          activity.status = activity.status === 'done' ? 'pending' : 'done';
          activity.updatedAt = Date.now();
          await db.addActivity(activity);
          renderList();
          showToast(activity.status === 'done' ? 'Activite terminee !' : 'Activite reactivee', 'success');
        }
      });
    });
  }

  renderList();

  container.querySelector('#search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderList();
  });

  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderList();
    });
  });

  container.querySelector('#fab-add').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate-create'));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
