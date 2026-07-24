import { db } from '../db.js';
import { showToast } from '../components.js';

const PROFILES = {
  papa: { name: 'Papa', pin: '0212', color: '#42A5F5', initial: 'P' },
  maman: { name: 'Maman', pin: '1412', color: '#EC407A', initial: 'M' }
};

export function showAuthScreen() {
  const authScreen = document.getElementById('auth-screen');
  authScreen.classList.remove('hidden');
  renderProfileSelect(authScreen);
}

export function hideAuthScreen() {
  document.getElementById('auth-screen').classList.add('hidden');
}

function renderProfileSelect(container) {
  container.innerHTML = `
    <div class="auth-screen">
      <h1 class="auth-title">Explore</h1>
      <p class="auth-subtitle">Choisissez votre profil</p>
      <div class="profile-cards">
        <div class="profile-card" data-profile="papa">
          <div class="profile-avatar" style="background:${PROFILES.papa.color}">P</div>
          <div class="profile-card-name">${PROFILES.papa.name}</div>
        </div>
        <div class="profile-card" data-profile="maman">
          <div class="profile-avatar" style="background:${PROFILES.maman.color}">M</div>
          <div class="profile-card-name">${PROFILES.maman.name}</div>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('click', () => {
      const profileId = card.dataset.profile;
      renderPinEntry(container, profileId);
    });
  });
}

function renderPinEntry(container, profileId) {
  const profile = PROFILES[profileId];
  let pin = '';

  container.innerHTML = `
    <div class="auth-screen">
      <h1 class="auth-title" style="color:${profile.color}">${profile.name}</h1>
      <p class="auth-subtitle">Entrez votre code PIN</p>
      <div class="pin-container">
        <div class="pin-dots">
          <div class="pin-dot"></div>
          <div class="pin-dot"></div>
          <div class="pin-dot"></div>
          <div class="pin-dot"></div>
        </div>
        <div class="pin-pad">
          <button class="pin-key" data-key="1">1</button>
          <button class="pin-key" data-key="2">2</button>
          <button class="pin-key" data-key="3">3</button>
          <button class="pin-key" data-key="4">4</button>
          <button class="pin-key" data-key="5">5</button>
          <button class="pin-key" data-key="6">6</button>
          <button class="pin-key" data-key="7">7</button>
          <button class="pin-key" data-key="8">8</button>
          <button class="pin-key" data-key="9">9</button>
          <button class="pin-key empty"></button>
          <button class="pin-key" data-key="0">0</button>
          <button class="pin-key backspace" data-key="back">\u232B</button>
        </div>
        <button class="btn btn-ghost" style="margin-top:24px" id="btn-back-profiles">Retour</button>
      </div>
    </div>
  `;

  const dots = container.querySelectorAll('.pin-dot');

  function updateDots() {
    dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < pin.length);
      dot.classList.remove('error');
    });
  }

  function checkPin() {
    if (pin === profile.pin) {
      db.setSetting('current_profile', profileId);
      hideAuthScreen();
      window.dispatchEvent(new CustomEvent('profile-login', { detail: { profileId } }));
    } else {
      dots.forEach(d => d.classList.add('error'));
      setTimeout(() => {
        pin = '';
        updateDots();
      }, 500);
      showToast('Code PIN incorrect', 'error');
      if (navigator.vibrate) navigator.vibrate(200);
    }
  }

  container.querySelectorAll('.pin-key').forEach(key => {
    key.addEventListener('click', () => {
      const val = key.dataset.key;
      if (val === 'back') {
        pin = pin.slice(0, -1);
      } else if (val && pin.length < 4) {
        pin += val;
      }
      updateDots();
      if (pin.length === 4) {
        setTimeout(checkPin, 200);
      }
    });
  });

  container.querySelector('#btn-back-profiles').addEventListener('click', () => {
    renderProfileSelect(container);
  });
}

export function logout() {
  db.setSetting('current_profile', null);
  window.dispatchEvent(new CustomEvent('profile-logout'));
}

export function getCurrentProfile() {
  return window.__currentProfile || null;
}

export function setCurrentProfile(id) {
  window.__currentProfile = id;
}

export { PROFILES };
