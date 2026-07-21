import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Keyboard } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivityContext';
import { getCategoryInfo, Category } from '../types/activity';

function buildMapHtml(activities: Array<{ title: string; latitude: number; longitude: number; category: Category; city?: string }>) {
  const markers = activities.map((a) => {
    const catInfo = getCategoryInfo(a.category);
    const label = (a.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const city = (a.city || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `L.marker([${a.latitude}, ${a.longitude}]).addTo(map).bindPopup('<b>${label}</b><br>${city}<br><small style="color:${catInfo.color}">${catInfo.label}</small>');`;
  }).join('\n      ');

  const center = activities.length > 0
    ? `[${activities[0].latitude}, ${activities[0].longitude}]`
    : '[46.6, 2.3]';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin:0; padding:0; }
    #map { width:100vw; height:100vh; }
    .leaflet-popup-content-wrapper { border-radius:12px !important; }
    .search-marker { background:rgba(0,122,255,0.9); border:2px solid white; border-radius:50%; width:20px; height:20px; box-shadow:0 2px 8px rgba(0,0,0,0.4); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView(${center}, 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    ${markers}
    ${activities.length > 1 ? `map.fitBounds([${activities.map(a => `[${a.latitude},${a.longitude}]`).join(',')}], {padding:[60,60]});` : ''}

    var searchMarker = null;
    window.goToLocation = function(lat, lng) {
      map.setView([lat, lng], 14);
      if (searchMarker) map.removeLayer(searchMarker);
      searchMarker = L.circleMarker([lat, lng], {radius: 10, color: '#007AFF', fillColor: '#007AFF', fillOpacity: 0.9, weight: 3}).addTo(map);
    };
  </script>
</body>
</html>`;
}

type SearchResult = { display_name: string; lat: string; lon: string };

export function MapScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { activities } = useActivities();
  const webViewRef = useRef<any>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const activitiesWithCoords = activities.filter(
    (a) => a.latitude != null && a.longitude != null
  ).map((a) => ({
    title: a.title,
    latitude: a.latitude!,
    longitude: a.longitude!,
    category: a.category,
    city: a.city,
  }));

  const html = buildMapHtml(activitiesWithCoords);

  const searchLocation = async (query: string) => {
    if (query.length < 2) { setResults([]); setShowResults(false); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=fr`,
        { headers: { 'User-Agent': 'ExploreApp/1.0' } }
      );
      const data = await res.json();
      setResults(data);
      setShowResults(data.length > 0);
    } catch {}
  };

  const selectResult = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    webViewRef.current?.injectJavaScript(`goToLocation(${lat}, ${lng});`);
    setSearch(item.display_name.split(',')[0]);
    setShowResults(false);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.glassBlur, borderBottomColor: theme.separator }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Carte</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
        <MaterialIcons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Rechercher un lieu..."
          placeholderTextColor={theme.textTertiary}
          value={search}
          onChangeText={(t) => { setSearch(t); searchLocation(t); }}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => { setSearch(''); setResults([]); setShowResults(false); }}>
            <MaterialIcons name="close" size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      {showResults && results.length > 0 && (
        <View style={[styles.resultsList, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={[styles.resultItem, { borderBottomColor: theme.separator }]} onPress={() => selectResult(item)}>
                <MaterialIcons name="place" size={16} color={theme.accent} />
                <Text style={[styles.resultText, { color: theme.text }]} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {activitiesWithCoords.length > 0 ? (
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.map}
          originWhitelist={['*']}
          scrollEnabled={false}
        />
      ) : (
        <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
          <MaterialIcons name="place" size={64} color={theme.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune localisation</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            Ajoutez une position GPS à vos activités pour les voir sur la carte
          </Text>
        </View>
      )}

      {activitiesWithCoords.length > 0 && (
        <View style={[styles.countBar, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
          <MaterialIcons name="place" size={16} color={theme.accent} />
          <Text style={[styles.countText, { color: theme.textSecondary }]}>
            {activitiesWithCoords.length} activité{activitiesWithCoords.length > 1 ? 's' : ''} sur la carte
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    zIndex: 20,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  resultsList: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    borderRadius: 14,
    maxHeight: 220,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: { flex: 1, fontSize: 14, lineHeight: 18 },
  map: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  countBar: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  countText: { fontSize: 13, fontWeight: '600' },
});
