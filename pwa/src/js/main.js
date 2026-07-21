import { initApp } from './app.js';

document.addEventListener('DOMContentLoaded', async () => {
  const splash = document.getElementById('splash-screen');
  const mainScreen = document.getElementById('main-screen');

  try {
    await initApp();
  } catch (err) {
    console.error('App init error:', err);
  }

  setTimeout(() => {
    splash.classList.add('hidden');
    mainScreen.classList.remove('hidden');
  }, 1800);
});
