import { initApp } from './app.js';

document.addEventListener('DOMContentLoaded', async () => {
  const splash = document.getElementById('splash-screen');
  const mainScreen = document.getElementById('main-screen');

  const hideSplash = () => {
    splash.style.transition = 'opacity 0.4s ease';
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.classList.add('hidden');
      mainScreen.classList.remove('hidden');
    }, 400);
  };

  try {
    await initApp();
  } catch (err) {
    console.error('App init error:', err);
  }

  setTimeout(hideSplash, 1600);
});
