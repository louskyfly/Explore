import { db, genId } from '../db.js';
import { updateHeader, showToast } from '../components.js';
import { cities } from './home.js';

const ACHIEVEMENTS = [
  { id: 'ach_first_step', name: 'Premier Pas', description: 'Complétez votre première étape', icon: '👣', check: async (allProgress) => allProgress.filter(p => p.completed).length >= 1 },
  { id: 'ach_500_points', name: '500 Points', description: 'Accumulez 500 points', icon: '⭐', check: async (_, allChallenges) => allChallenges.filter(c => c.completed).reduce((s, c) => s + (c.earnedPoints || 0), 0) >= 500 },
  { id: 'ach_1000_points', name: '1000 Points', description: 'Accumulez 1000 points', icon: '🌟', check: async (_, allChallenges) => allChallenges.filter(c => c.completed).reduce((s, c) => s + (c.earnedPoints || 0), 0) >= 1000 },
  { id: 'ach_first_photo', name: 'Premier Clic', description: 'Prenez votre première photo de défi', icon: '📸', check: async (_, __, allPhotos) => allPhotos.length >= 1 },
  { id: 'ach_10_photos', name: 'Photographe', description: 'Accumulez 10 photos', icon: '📷', check: async (_, __, allPhotos) => allPhotos.length >= 10 },
  { id: 'ach_perfect_score', name: 'Score Parfait', description: 'Obtenez 100% à un défi photo', icon: '💯', check: async (_, __, allPhotos) => allPhotos.some(p => p.score === 100) },
  { id: 'ach_first_route', name: 'Premier Parcours', description: 'Terminez un parcours complet', icon: '🏁', check: async (allProgress) => {
    for (const city of cities) {
      for (const route of city.routes) {
        const stepsCompleted = route.steps.filter(s => allProgress.some(p => p.stepId === s.id && p.completed)).length;
        if (stepsCompleted === route.steps.length) return true;
      }
    }
    return false;
  }},
  { id: 'ach_bilbao_complete', name: 'Bilbao Explorer', description: 'Explorez tous les lieux de Bilbao', icon: '🏙️', check: async (allProgress) => {
    const bilbaoPois = cities.find(c => c.id === 'bilbao')?.pois || [];
    const bilbaoSteps = cities.find(c => c.id === 'bilbao')?.routes.flatMap(r => r.steps) || [];
    return bilbaoSteps.filter(s => allProgress.some(p => p.stepId === s.id && p.completed)).length >= bilbaoSteps.length;
  }},
  { id: 'ach_zaragoza_complete', name: 'Zaragoza Explorer', description: 'Explorez tous les lieux de Saragosse', icon: '🏰', check: async (allProgress) => {
    const steps = cities.find(c => c.id === 'zaragoza')?.routes.flatMap(r => r.steps) || [];
    return steps.filter(s => allProgress.some(p => p.stepId === s.id && p.completed)).length >= steps.length;
  }},
  { id: 'ach_all_categories', name: 'Curieux', description: 'Découvrez toutes les catégories', icon: '🔍', check: async (allProgress) => {
    const allSteps = cities.flatMap(c => c.routes.flatMap(r => r.steps));
    const completedSteps = allSteps.filter(s => allProgress.some(p => p.stepId === s.id && p.completed));
    const categories = new Set(completedSteps.map(s => s.category));
    return categories.size >= 8;
  }},
  { id: 'ach_team_player', name: 'Esprit d\'équipe', description: 'Rejoignez une équipe', icon: '🤝', check: async () => {
    const teamId = await db.getSetting('currentTeam');
    return !!teamId;
  }},
  { id: 'ach_challenges_5', name: 'Défi Relevé', description: 'Complétez 5 défis photo', icon: '🎯', check: async (_, allChallenges) => allChallenges.filter(c => c.completed).length >= 5 },
  { id: 'ach_challenges_15', name: 'Maître du Défi', description: 'Complétez 15 défis photo', icon: '🏅', check: async (_, allChallenges) => allChallenges.filter(c => c.completed).length >= 15 },
  { id: 'ach_20_photos', name: 'Collectionneur', description: 'Accumulez 20 photos', icon: '🎨', check: async (_, __, allPhotos) => allPhotos.length >= 20 },
  { id: 'ach_high_score', name: 'Score Élevé', description: 'Obtenez un score moyen supérieur à 70%', icon: '📈', check: async (_, __, allPhotos) => {
    if (allPhotos.length === 0) return false;
    const avg = allPhotos.filter(p => p.score !== undefined).reduce((s, p) => s + p.score, 0) / allPhotos.filter(p => p.score !== undefined).length;
    return avg >= 70;
  }}
];

export async function renderAchievements(container) {
  updateHeader('Succès');
  const allProgress = await db.getAllProgress();
  const allChallenges = await db.getAllChallenges();
  const allPhotos = await db.getAllPhotos();
  const existingAchievements = await db.getAllAchievements();

  let unlockedCount = 0;
  const achievementCards = [];

  for (const ach of ACHIEVEMENTS) {
    const isUnlocked = existingAchievements.some(a => a.id === ach.id);
    if (isUnlocked) unlockedCount++;

    achievementCards.push({
      ...ach,
      unlocked: isUnlocked
    });
  }

  container.innerHTML = `
    <div class="page">
      <div style="text-align:center;margin-bottom:24px" class="animate-in">
        <div style="font-size:48px;margin-bottom:8px">🏆</div>
        <h2 style="font-size:22px;font-weight:700">Succès</h2>
        <p style="font-size:14px;color:var(--text-secondary);margin-top:4px">${unlockedCount}/${ACHIEVEMENTS.length} débloqués</p>
        <div style="margin-top:12px">${createProgressBar(Math.round((unlockedCount / ACHIEVEMENTS.length) * 100))}</div>
      </div>

      ${achievementCards.map((ach, i) => `
        <div class="achievement-card glass-card animate-in stagger-${Math.min(i + 1, 6)} ${ach.unlocked ? '' : 'locked'}">
          <div class="achievement-icon ${ach.unlocked ? '' : 'locked'}" style="background:${ach.unlocked ? 'rgba(48,209,88,0.15)' : 'var(--input-bg)'}">${ach.icon}</div>
          <div class="achievement-info">
            <h4>${ach.name}</h4>
            <p>${ach.description}</p>
            ${ach.unlocked ? '<span style="font-size:11px;color:var(--success);font-weight:600">✅ Débloqué</span>' : '<span style="font-size:11px;color:var(--text-tertiary)">🔒 Verrouillé</span>'}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export async function checkAchievements() {
  const allProgress = await db.getAllProgress();
  const allChallenges = await db.getAllChallenges();
  const allPhotos = await db.getAllPhotos();
  const existing = await db.getAllAchievements();
  const existingIds = new Set(existing.map(a => a.id));

  for (const ach of ACHIEVEMENTS) {
    if (existingIds.has(ach.id)) continue;
    try {
      const unlocked = await ach.check(allProgress, allChallenges, allPhotos);
      if (unlocked) {
        const achievement = {
          id: ach.id,
          name: ach.name,
          description: ach.description,
          icon: ach.icon,
          unlockedAt: Date.now()
        };
        await db.saveAchievement(achievement);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🏆 Nouveau succès !', {
            body: `${ach.icon} ${ach.name}: ${ach.description}`,
            icon: '/icons/icon-192.png'
          });
        }

        showToast(`🏆 Succès débloqué: ${ach.name}`, 'success', 4000);
      }
    } catch (e) {}
  }
}

function createProgressBar(pct) {
  return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
}
