import { db, genId } from '../db.js';
import { updateHeader, showToast, showModal } from '../components.js';

export async function renderTeams(container) {
  updateHeader('Équipes');
  const teams = await db.getAllTeams();
  const allProgress = await db.getAllProgress();

  const sortedTeams = teams.sort((a, b) => {
    const scoreA = allProgress.filter(p => p.teamId === a.id).reduce((s, p) => s + (p.points || 0), 0);
    const scoreB = allProgress.filter(p => p.teamId === b.id).reduce((s, p) => s + (p.points || 0), 0);
    return scoreB - scoreA;
  });

  container.innerHTML = `
    <div class="page">
      <div style="text-align:center;margin-bottom:24px" class="animate-in">
        <div style="font-size:48px;margin-bottom:8px">👥</div>
        <h2 style="font-size:22px;font-weight:700">Équipes</h2>
        <p style="font-size:14px;color:var(--text-secondary);margin-top:4px">Créez ou rejoignez une équipe pour affronter vos amis</p>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:20px" class="animate-in stagger-1">
        <button class="btn btn-primary" style="flex:1" id="btn-create-team">➕ Créer une équipe</button>
        <button class="btn btn-secondary" style="flex:1" id="btn-join-team">🔗 Rejoindre</button>
      </div>

      <div class="section-title animate-in stagger-2">🏆 Classement</div>
      ${sortedTeams.length ? sortedTeams.map((team, i) => {
        const teamScore = allProgress.filter(p => p.teamId === team.id).reduce((s, p) => s + (p.points || 0), 0);
        const members = team.members || [];
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return `
          <div class="rank-row glass-card animate-in stagger-${Math.min(i + 3, 6)}">
            <div class="rank-position ${rankClass}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)}</div>
            <div class="team-avatar" style="background:${team.color || '#173B7A'}">${team.emoji || '👥'}</div>
            <div class="rank-info">
              <h4>${team.name}</h4>
              <p>${members.length} membre${members.length > 1 ? 's' : ''}</p>
            </div>
            <div class="rank-score">${teamScore}</div>
          </div>
        `;
      }).join('') : `
        <div class="empty-state animate-in stagger-3">
          <div class="empty-state-icon">👥</div>
          <h3>Aucune équipe</h3>
          <p>Créez une équipe ou rejoignez-en une pour commencer l'aventure !</p>
        </div>
      `}

      <div class="section-title animate-in" style="margin-top:24px">📋 Mes équipes</div>
      ${teams.length ? teams.map((team, i) => `
        <div class="team-card glass-card animate-in stagger-${Math.min(i + 1, 6)}" data-team="${team.id}">
          <div class="team-card-header">
            <div class="team-avatar" style="background:${team.color || '#173B7A'}">${team.emoji || '👥'}</div>
            <div class="team-card-info">
              <h3>${team.name}</h3>
              <p>Code: ${team.code}</p>
            </div>
          </div>
          <div class="team-members">
            ${(team.members || []).map(m => `
              <div class="team-member-avatar" style="background:${team.color || '#173B7A'}">${m[0]?.toUpperCase() || '?'}</div>
            `).join('')}
          </div>
        </div>
      `).join('') : `
        <div class="glass-card animate-in stagger-1" style="padding:20px;text-align:center;color:var(--text-secondary)">
          <p>Vous n'avez pas encore d'équipe</p>
        </div>
      `}
    </div>
  `;

  document.getElementById('btn-create-team')?.addEventListener('click', showCreateTeamModal);
  document.getElementById('btn-join-team')?.addEventListener('click', showJoinTeamModal);

  container.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('click', () => {
      const teamId = card.dataset.team;
      const team = teams.find(t => t.id === teamId);
      if (team) showTeamDetail(team);
    });
  });
}

function showCreateTeamModal() {
  const colors = ['#173B7A', '#EF5350', '#66BB6A', '#FFA726', '#AB47BC', '#EC407A', '#26C6DA', '#5C6BC0'];
  const emojis = ['👥', '🚀', '⚡', '🔥', '🌟', '🎯', '🏆', '💪', '🎮', '🦁'];

  const content = `
    <div class="input-group">
      <label class="input-label">Nom de l'équipe</label>
      <input class="input" id="team-name-input" placeholder="Les Explorateurs" maxlength="24">
    </div>
    <div class="input-group">
      <label class="input-label">Votre pseudo</label>
      <input class="input" id="team-pseudo-input" placeholder="Votre nom" maxlength="20">
    </div>
    <div class="input-group">
      <label class="input-label">Couleur</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap" id="color-picker">
        ${colors.map((c, i) => `
          <button class="btn btn-sm" style="width:40px;height:40px;border-radius:12px;background:${c};border:3px solid ${i === 0 ? '#fff' : 'transparent'}" data-color="${c}"></button>
        `).join('')}
      </div>
    </div>
    <div class="input-group">
      <label class="input-label">Emblème</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap" id="emoji-picker">
        ${emojis.map((e, i) => `
          <button class="btn btn-sm" style="width:40px;height:40px;border-radius:12px;font-size:20px;background:var(--input-bg);border:3px solid ${i === 0 ? 'var(--accent)' : 'transparent'}" data-emoji="${e}">${e}</button>
        `).join('')}
      </div>
    </div>
  `;

  showModal('Créer une équipe', content, [
    { id: 'cancel', label: 'Annuler', class: 'btn-secondary' },
    { id: 'create', label: 'Créer', class: 'btn-primary' }
  ]);

  let selectedColor = colors[0];
  let selectedEmoji = emojis[0];

  document.querySelectorAll('#color-picker button').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedColor = btn.dataset.color;
      document.querySelectorAll('#color-picker button').forEach(b => b.style.borderColor = b.dataset.color === selectedColor ? '#fff' : 'transparent');
    });
  });

  document.querySelectorAll('#emoji-picker button').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedEmoji = btn.dataset.emoji;
      document.querySelectorAll('#emoji-picker button').forEach(b => b.style.borderColor = b.dataset.emoji === selectedEmoji ? 'var(--accent)' : 'transparent');
    });
  });

  document.querySelector('[data-action="create"]')?.addEventListener('click', async (e) => {
    const name = document.getElementById('team-name-input')?.value?.trim();
    const pseudo = document.getElementById('team-pseudo-input')?.value?.trim();
    if (!name || !pseudo) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const team = {
      id: genId(),
      name,
      code,
      color: selectedColor,
      emoji: selectedEmoji,
      members: [pseudo],
      createdBy: pseudo,
      createdAt: Date.now()
    };
    await db.saveTeam(team);
    await db.setSetting('currentTeam', team.id);
    await db.setSetting('username', pseudo);
    showToast(`Équipe "${name}" créée ! Code: ${code}`, 'success');
    renderTeams(document.getElementById('page-container'));
  });
}

function showJoinTeamModal() {
  const content = `
    <div class="input-group">
      <label class="input-label">Code de l'équipe</label>
      <input class="input" id="join-code-input" placeholder="ABC123" maxlength="6" style="text-transform:uppercase;text-align:center;font-size:24px;letter-spacing:4px">
    </div>
    <div class="input-group">
      <label class="input-label">Votre pseudo</label>
      <input class="input" id="join-pseudo-input" placeholder="Votre nom" maxlength="20">
    </div>
  `;

  showModal('Rejoindre une équipe', content, [
    { id: 'cancel', label: 'Annuler', class: 'btn-secondary' },
    { id: 'join', label: 'Rejoindre', class: 'btn-primary' }
  ]);

  document.querySelector('[data-action="join"]')?.addEventListener('click', async () => {
    const code = document.getElementById('join-code-input')?.value?.trim().toUpperCase();
    const pseudo = document.getElementById('join-pseudo-input')?.value?.trim();
    if (!code || !pseudo) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }
    const teams = await db.getAllTeams();
    const team = teams.find(t => t.code === code);
    if (!team) {
      showToast('Code d\'équipe invalide', 'error');
      return;
    }
    if (team.members.includes(pseudo)) {
      showToast('Ce pseudo est déjà utilisé', 'error');
      return;
    }
    team.members.push(pseudo);
    await db.saveTeam(team);
    await db.setSetting('currentTeam', team.id);
    await db.setSetting('username', pseudo);
    showToast(`Bienvenue dans "${team.name}" !`, 'success');
    renderTeams(document.getElementById('page-container'));
  });
}

function showTeamDetail(team) {
  const content = `
    <div style="text-align:center;margin-bottom:16px">
      <div class="team-avatar" style="background:${team.color || '#173B7A'};width:64px;height:64px;font-size:32px;margin:0 auto 8px">${team.emoji || '👥'}</div>
      <h3 style="font-size:18px;font-weight:700">${team.name}</h3>
      <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">Code: <strong>${team.code}</strong></p>
    </div>
    <div class="section-title" style="font-size:14px">Membres</div>
    ${(team.members || []).map(m => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div class="team-member-avatar" style="margin-left:0;background:${team.color || '#173B7A'}">${m[0]?.toUpperCase()}</div>
        <span style="font-weight:500">${m}</span>
        ${m === team.createdBy ? '<span style="font-size:11px;background:var(--badge-bg);color:var(--accent);padding:2px 8px;border-radius:6px;margin-left:auto">Chef</span>' : ''}
      </div>
    `).join('')}
  `;

  showModal(team.name, content, [
    { id: 'close', label: 'Fermer', class: 'btn-secondary' }
  ]);
}
