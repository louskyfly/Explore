import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, Keyboard } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';

function buildPickerHtml(lat: number, lng: number) {
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
    .marker-label {
      background: rgba(0,122,255,0.9);
      color: white;
      border-radius: 8px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: bold;
      white-space: nowrap;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    var marker = null;
    var label = null;

    function updateMarker(lat, lng) {
      if (marker) map.removeLayer(marker);
      if (label) map.removeLayer(label);
      marker = L.marker([lat, lng]).addTo(map);
      label = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'marker-label',
          html: lat.toFixed(5) + ', ' + lng.toFixed(5),
          iconAnchor: [50, 15],
        })
      }).addTo(map);
      window.ReactNativeWebView.postMessage(JSON.stringify({lat: lat, lng: lng}));
    }

    map.on('click', function(e) {
      updateMarker(e.latlng.lat, e.latlng.lng);
    });

    map.on('moveend', function() {
      if (!marker) {
        var c = map.getCenter();
        updateMarker(c.lat, c.lng);
      }
    });

    window.goToLocation = function(lat, lng) {
      map.setView([lat, lng], 14);
      updateMarker(lat, lng);
    };
  </script>
</body>
</html>`;
}

type SearchResult = { display_name: string; lat: string; lon: string };

export function LocationPickerScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const callback = route.params?.onSelect as ((data: { latitude: number; longitude: number; city: string; country: string }) => void) | undefined;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const webViewRef = useRef<any>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.lat && data.lng) {
        setCoords({ latitude: data.lat, longitude: data.lng });
        try {
          const reverse = await Location.reverseGeocodeAsync({
            latitude: data.lat,
            longitude: data.lng,
          });
          if (reverse.length > 0) {
            setCity(reverse[0].city || reverse[0].name || '');
            setCountry(reverse[0].country || '');
          }
        } catch {}
      }
    } catch {}
  };

  const handleConfirm = () => {
    if (!coords) return;
    if (callback) {
      callback({ ...coords, city, country });
    }
    navigation.goBack();
  };

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

  const html = buildPickerHtml(46.6, 2.3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.glassBlur, borderBottomColor: theme.separator }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Choisir un lieu</Text>
        <Pressable
          onPress={handleConfirm}
          disabled={!coords}
          style={[styles.confirmBtn, { opacity: coords ? 1 : 0.4 }]}
        >
          <Text style={[styles.confirmText, { color: theme.accent }]}>Valider</Text>
        </Pressable>
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

      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.map}
        originWhitelist={['*']}
        scrollEnabled={false}
        onMessage={handleMessage}
      />

      {coords && (
        <View style={[styles.infoBar, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
          <MaterialIcons name="place" size={20} color={theme.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.coordText, { color: theme.text }]}>
              {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </Text>
            {city ? (
              <Text style={[styles.locationText, { color: theme.textSecondary }]}>
                {city}{country ? `, ${country}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {!coords && (
        <View style={[styles.hintBar, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
          <MaterialIcons name="touch-app" size={18} color={theme.textSecondary} />
          <Text style={[styles.hintText, { color: theme.textSecondary }]}>
            Recherchez ou appuyez sur la carte
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
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  confirmBtn: { paddingHorizontal: 12 },
  confirmText: { fontSize: 16, fontWeight: '700' },
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
  infoBar: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  coordText: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  locationText: { fontSize: 13, marginTop: 2 },
  hintBar: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 18,
    gap: 8,
  },
  hintText: { fontSize: 14, fontWeight: '600' },
});
