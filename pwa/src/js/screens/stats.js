import { db } from '../db.js';
import { updateHeader } from '../components.js';
import { cities } from './home.js';

export async function renderStats(container) {
  updateHeader('Statistiques');
  const allProgress = await db.getAllProgress();
  const allPhotos = await db.getAllPhotos();
  const allChallenges = await db.getAllChallenges();
  const teams = await db.getAllTeams();
  const history = await db.getHistory();

  const totalSteps = cities.reduce((s, c) => s + c.routes.reduce((rs, r) => rs + r.steps.length, 0), 0);
  const completedSteps = allProgress.filter(p => p.completed).length;
  const totalPoints = allChallenges.filter(c => c.completed).reduce((s, c) => s + (c.earnedPoints || 0), 0);
  const totalPois = cities.reduce((s, c) => s + c.pois.length, 0);
  const visitedPois = allProgress.filter(p => p.completed).length;

  const categoryStats = {};
  cities.forEach(city => {
    Object.entries(city.categories).forEach(([key, cat]) => {
      if (!categoryStats[key]) categoryStats[key] = { ...cat, count: 0 };
      city.pois.filter(p => p.category === key).forEach(() => {
        const stepsForPois = city.routes.flatMap(r => r.steps).filter(s => {
          const poi = city.pois.find(p => p.id === s.poiId);
          return poi?.category === key;
        });
        stepsForPois.forEach(step => {
          if (allProgress.some(p => p.stepId === step.id && p.completed)) {
            categoryStats[key].count++;
          }
        });
      });
    });
  });

  const cityStats = cities.map(city => {
    const total = city.routes.reduce((s, r) => s + r.steps.length, 0);
    const completed = allProgress.filter(p => {
      const route = city.routes.find(r => r.steps.some(st => st.id === p.stepId));
      return route && p.completed;
    }).length;
    return { ...city, total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
  });

  const maxCatCount = Math.max(1, ...Object.values(categoryStats).map(c => c.count));

  container.innerHTML = `
    <div class="page">
      <div style="text-align:center;margin-bottom:24px" class="animate-in">
        <div style="font-size:48px;margin-bottom:8px">📊</div>
        <h2 style="font-size:22px;font-weight:700">Statistiques</h2>
      </div>

      <div class="stats-grid animate-in stagger-1">
        <div class="stat-card glass-card">
          <div class="stat-value">${completedSteps}/${totalSteps}</div>
          <div class="stat-label">Étapes</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value">${totalPoints}</div>
          <div class="stat-label">Points</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value">${allPhotos.length}</div>
          <div class="stat-label">Photos</div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-value">${allChallenges.filter(c => c.completed).length}</div>
          <div class="stat-label">Défis</div>
        </div>
        <div class="stat-card glass-card wide">
          <div class="stat-value">${totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0}%</div>
          <div class="stat-label">Progression totale</div>
          <div style="margin-top:8px">${createProgressBar(totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0)}</div>
        </div>
      </div>

      <div class="section-title animate-in stagger-2">Par ville</div>
      ${cityStats.map((city, i) => `
        <div class="glass-card animate-in stagger-${i + 3}" style="padding:16px;margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:24px">${city.flag}</span>
              <div>
                <div style="font-weight:700;font-size:16px">${city.name}</div>
                <div style="font-size:12px;color:var(--text-secondary)">${city.completed}/${city.total} étapes</div>
              </div>
            </div>
            <div style="font-size:20px;font-weight:800;color:var(--accent)">${city.percent}%</div>
          </div>
          ${createProgressBar(city.percent)}
        </div>
      `).join('')}

      <div class="section-title animate-in stagger-5">Par catégorie</div>
      <div class="bar-chart animate-in stagger-6">
        ${Object.values(categoryStats).filter(c => c.count > 0).sort((a, b) => b.count - a.count).map(cat => `
          <div class="bar-row">
            <div class="bar-label">${cat.icon} ${cat.label}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(cat.count / maxCatCount) * 100}%;background:${cat.color}">
                <span class="bar-value">${cat.count}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      ${teams.length ? `
        <div class="section-title animate-in">Classement équipes</div>
        ${teams.sort((a, b) => {
          const sa = allProgress.filter(p => p.teamId === a.id).reduce((s, p) => s + (p.points || 0), 0);
          const sb = allProgress.filter(p => p.teamId === b.id).reduce((s, p) => s + (p.points || 0), 0);
          return sb - sa;
        }).map((team, i) => {
          const score = allProgress.filter(p => p.teamId === team.id).reduce((s, p) => s + (p.points || 0), 0);
          return `
            <div class="rank-row glass-card">
              <div class="rank-position ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)}</div>
              <div class="team-avatar" style="background:${team.color}">${team.emoji}</div>
              <div class="rank-info"><h4>${team.name}</h4></div>
              <div class="rank-score">${score}</div>
            </div>
          `;
        }).join('')}
      ` : ''}
    </div>
  `;
}

function createProgressBar(pct) {
  return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
}
