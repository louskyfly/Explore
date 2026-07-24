import { db } from '../db.js';
import { getCurrentProfile } from './profileSelect.js';
import { updateHeader, showToast, CATEGORIES } from '../components.js';

export async function renderLocationPicker(container, params) {
  updateHeader('Choisir un lieu');

  const startLat = params.lat || 48.8566;
  const startLng = params.lng || 2.3522;

  container.innerHTML = `
    <div class="page" style="padding:0;height:100%;position:relative;">
      <div id="picker-map" style="width:100%;height:calc(100% - 60px);"></div>
      <div class="search-bar" style="position:absolute;top:12px;left:12px;right:12px;z-index:50;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="picker-search" placeholder="Rechercher un lieu...">
      </div>
      <div id="picker-search-results" style="position:absolute;top:56px;left:12px;right:12px;z-index:50;display:none;"></div>
      <div style="padding:12px;display:flex;gap:8px;height:60px;align-items:center;">
        <button class="btn btn-secondary" style="flex:1" id="picker-cancel">Annuler</button>
        <button class="btn btn-primary" style="flex:1" id="picker-confirm">Choisir ici</button>
      </div>
    </div>
  `;

  let pickedLat = startLat;
  let pickedLng = startLng;
  let pickedName = '';
  let pickerMap = null;
  let pickedMarker = null;

  setTimeout(() => {
    try {
      pickerMap = L.map('picker-map', { zoomControl: false, attributionControl: false }).setView([startLat, startLng], 14);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(pickerMap);

      pickedMarker = L.marker([startLat, startLng], {
        draggable: true
      }).addTo(pickerMap);

      pickedMarker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        pickedLat = pos.lat;
        pickedLng = pos.lng;
        pickedName = '';
      });

      pickerMap.on('click', (e) => {
        pickedLat = e.latlng.lat;
        pickedLng = e.latlng.lng;
        pickedMarker.setLatLng(e.latlng);
        pickedName = '';
      });

      setTimeout(() => pickerMap.invalidateSize(), 100);
    } catch (e) {}
  }, 100);

  const searchInput = container.querySelector('#picker-search');
  const resultsDiv = container.querySelector('#picker-search-results');
  let searchTimeout = null;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    if (q.length < 3) {
      resultsDiv.style.display = 'none';
      return;
    }
    searchTimeout = setTimeout(async () => {
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=fr`);
        const results = await resp.json();
        if (results.length === 0) {
          resultsDiv.style.display = 'none';
          return;
        }
        resultsDiv.style.display = 'block';
        resultsDiv.className = 'glass-card';
        resultsDiv.style.padding = '8px';
        resultsDiv.innerHTML = results.map(r => `
          <div class="search-result-item" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${escapeAttr(r.display_name)}" style="padding:10px 12px;border-radius:10px;cursor:pointer;font-size:13px;color:var(--text-primary);transition:background 0.15s;">
            \uD83D\uDCCD ${escapeHtml(r.display_name.length > 60 ? r.display_name.substring(0, 60) + '...' : r.display_name)}
          </div>
        `).join('');

        resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lng = parseFloat(item.dataset.lng);
            pickedLat = lat;
            pickedLng = lng;
            pickedName = item.dataset.name;
            pickerMap.setView([lat, lng], 16);
            pickedMarker.setLatLng([lat, lng]);
            resultsDiv.style.display = 'none';
            searchInput.value = '';
          });
          item.addEventListener('mouseenter', () => { item.style.background = 'var(--ripple)'; });
          item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
        });
      } catch (e) {}
    }, 400);
  });

  container.querySelector('#picker-cancel').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('navigate-back'));
  });

  container.querySelector('#picker-confirm').addEventListener('click', () => {
    if (params.onSelect) {
      params.onSelect(pickedLat, pickedLng, pickedName);
    }
    window.dispatchEvent(new CustomEvent('navigate-back'));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}
