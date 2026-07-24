import { db } from './db.js';

const STORAGE_KEY = 'explore_theme';

export const theme = {
  current: 'dark',
  listeners: [],

  async init() {
    const saved = await db.getSetting(STORAGE_KEY);
    this.current = saved || this.getSystemTheme();
    this.apply();
    this.watchSystem();
  },

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  apply() {
    document.documentElement.setAttribute('data-theme', this.current);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = this.current === 'dark' ? '#0a0a1a' : '#f2f2f7';
  },

  async set(mode) {
    if (mode === 'auto') {
      this.current = this.getSystemTheme();
    } else {
      this.current = mode;
    }
    this.apply();
    await db.setSetting(STORAGE_KEY, mode);
    this.listeners.forEach(fn => fn(this.current));
  },

  toggle() {
    this.set(this.current === 'dark' ? 'light' : 'dark');
  },

  watchSystem() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
      const saved = await db.getSetting(STORAGE_KEY);
      if (saved === 'auto' || !saved) {
        this.current = this.getSystemTheme();
        this.apply();
        this.listeners.forEach(fn => fn(this.current));
      }
    });
  },

  onChange(fn) {
    this.listeners.push(fn);
  }
};
