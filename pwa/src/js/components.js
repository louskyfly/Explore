export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function showModal(title, content, actions = []) {
  const container = document.getElementById('modal-container');
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="icon-btn modal-close" aria-label="Fermer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">${content}</div>
      ${actions.length ? `<div style="padding:0 20px 24px;display:flex;gap:8px;">${actions.map(a =>
        `<button class="btn ${a.class || 'btn-primary'}" style="flex:1" data-action="${a.id}">${a.label}</button>`
      ).join('')}</div>` : ''}
    </div>
  `;
  container.appendChild(modal);

  const close = () => {
    modal.querySelector('.modal-backdrop').style.opacity = '0';
    modal.querySelector('.modal-sheet').style.transform = 'translateY(100%)';
    setTimeout(() => modal.remove(), 300);
  };

  modal.querySelector('.modal-backdrop').addEventListener('click', close);
  modal.querySelector('.modal-close').addEventListener('click', close);
  actions.forEach(a => {
    const btn = modal.querySelector(`[data-action="${a.id}"]`);
    if (btn && a.onClick) btn.addEventListener('click', () => { a.onClick(modal); close(); });
  });

  return { modal, close };
}

export function showSidebar(show) {
  const sidebar = document.getElementById('sidebar');
  if (show) {
    sidebar.classList.remove('hidden');
    document.getElementById('sidebar-backdrop').onclick = () => showSidebar(false);
    document.getElementById('btn-close-sidebar').onclick = () => showSidebar(false);
  } else {
    sidebar.classList.add('hidden');
  }
}

export function updateHeader(title) {
  document.getElementById('page-title').textContent = title;
}

export function updateSidebarUser(username, teamName) {
  document.getElementById('sidebar-username').textContent = username || 'Invité';
  document.getElementById('sidebar-team-name').textContent = teamName || 'Aucune équipe';
  document.getElementById('sidebar-avatar').textContent = (username || '?')[0].toUpperCase();
}

export function createProgressBar(percent) {
  return `<div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>`;
}

export function createRingProgress(percent, size = 44) {
  const r = (size - 6) / 2;
  const c = Math.PI * 2 * r;
  const offset = c - (percent / 100) * c;
  return `
    <div class="route-progress-ring" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}">
        <circle class="route-progress-bg" cx="${size/2}" cy="${size/2}" r="${r}"/>
        <circle class="route-progress-fill" cx="${size/2}" cy="${size/2}" r="${r}"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
      </svg>
      <div class="route-progress-text">${percent}%</div>
    </div>
  `;
}

export function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}
