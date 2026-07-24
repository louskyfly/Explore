export const router = {
  currentTab: 'home',
  history: [],
  listeners: [],

  init() {
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => this.navigate(tab.dataset.tab));
    });
  },

  navigate(tab, params = {}) {
    if (this.currentTab !== tab) {
      this.history.push({ tab: this.currentTab });
    }
    this.currentTab = tab;
    this.updateTabBar();
    this.listeners.forEach(fn => fn(tab, params));
    const pc = document.getElementById('page-container');
    if (pc) pc.scrollTop = 0;
  },

  goBack() {
    if (this.history.length) {
      const prev = this.history.pop();
      this.navigate(prev.tab);
    }
  },

  updateTabBar() {
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === this.currentTab);
    });
  },

  onChange(fn) {
    this.listeners.push(fn);
  }
};
