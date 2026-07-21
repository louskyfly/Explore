import { bilbao } from '../data/bilbao.js';
import { zaragoza } from '../data/zaragoza.js';
import { updateHeader } from '../components.js';

const cities = [bilbao, zaragoza];
let map = null;
let markers = [];
let userMarker = null;
let activeCity = 'bilbao';
let activeFilter = 'all';

const allCategories = [
  { key: 'all', label: 'Tout', icon: '📍' },
  { key: 'monuments', label: 'Monuments', icon: '🏛️' },
  { key: 'viewpoints', label: 'Points de vue', icon: '🔭' },
  { key: 'nature', label: 'Nature', icon: '🌿' },
  { key: 'streetart', label: 'Street Art', icon: '🎨' },
  { key: 'architecture', label: 'Architecture', icon: '🏗️' },
  { key: 'unusual', label: 'Insolite', icon: '✨' },
  { key: 'culture', label: 'Culture', icon: '🎭' },
  { key: 'gastronomy', label: 'Gastronomie', icon: '🍷' }
];

export function renderMap(container) {
  updateHeader('Carte');
  container.innerHTML = `
    <div class="map-container" id="map-wrapper">
      <div class="map-city-selector">
        ${cities.map(c => `
          <button class="city-tab ${c.id === activeCity ? 'active' : ''}" data-city="${c.id}">${c.flag} ${c.name}</button>
        `).join('')}
      </div>
      <div id="map-view"></div>
      <div class="map-filters" id="map-filters">
        ${allCategories.map(c => `
          <button class="filter-chip ${activeFilter === c.key ? 'active' : ''}" data-filter="${c.key}">
            ${c.icon} ${c.label}
          </button>
        `).join('')}
      </div>
      <button class="map-locate-btn" id="btn-locate" aria-label="Ma position">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
      </button>
    </div>
  `;

  setTimeout(() => initMap(), 100);

  container.querySelectorAll('.city-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeCity = tab.dataset.city;
      container.querySelectorAll('.city-tab').forEach(t => t.classList.toggle('active', t.dataset.city === activeCity));
      updateMapMarkers();
    });
  });

  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === activeFilter));
      updateMapMarkers();
    });
  });

  document.getElementById('btn-locate')?.addEventListener('click', locateUser);
}

function initMap() {
  const city = cities.find(c => c.id === activeCity);
  if (!city || map) return;

  map = L.map('map-view', {
    center: city.center,
    zoom: city.zoom,
    zoomControl: false,
    attributionControl: true
  });

  L.control.zoom({ position: 'topright' }).addTo(map);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }).addTo(map);

  updateMapMarkers();
  locateUser();
}

function updateMapMarkers() {
  if (!map) return;
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const city = cities.find(c => c.id === activeCity);
  if (!city) return;

  map.setView(city.center, city.zoom, { animate: true });

  const pois = activeFilter === 'all'
    ? city.pois
    : city.pois.filter(p => p.category === activeFilter);

  pois.forEach(poi => {
    const cat = city.categories[poi.category];
    const icon = L.divIcon({
      className: '',
      html: `<div class="custom-marker" style="background:${cat?.color || '#173B7A'}"><span>${poi.emoji || cat?.icon || '📍'}</span></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    const marker = L.marker([poi.lat, poi.lng], { icon }).addTo(map);
    marker.bindPopup(`
      <div style="min-width:180px">
        <div style="font-size:24px;margin-bottom:4px">${poi.emoji || cat?.icon}</div>
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">${poi.name}</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;margin-bottom:6px">${poi.description}</div>
        <div style="font-size:11px;background:${cat?.color || '#173B7A'}20;color:${cat?.color || '#173B7A'};padding:2px 8px;border-radius:6px;display:inline-block;font-weight:600">${cat?.label || poi.category}</div>
      </div>
    `);
    marker.poiData = poi;
    markers.push(marker);
  });

  if (pois.length) {
    const bounds = L.latLngBounds(pois.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [60, 60] });
  }
}

function locateUser() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      if (userMarker) map.removeLayer(userMarker);
      const icon = L.divIcon({
        className: '',
        html: '<div class="user-location-marker"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      userMarker = L.marker([latitude, longitude], { icon }).addTo(map);
      userMarker.bindPopup('<b>📍 Vous êtes ici</b>');
      if (map) map.setView([latitude, longitude], map.getZoom(), { animate: true });
    },
    () => {},
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

export function selectCity(cityId) {
  activeCity = cityId;
  if (map) updateMapMarkers();
}

window.addEventListener('selectCity', e => selectCity(e.detail));
