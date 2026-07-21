import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, Pressable,
  Alert, Linking, Share, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivityContext';
import { Activity, getCategoryInfo, getPriorityInfo, getStatusInfo } from '../types/activity';
import { CategoryBadge } from '../components/CategoryBadge';
import { StatusBadge } from '../components/StatusBadge';
import { GlassCard } from '../components/GlassCard';

const { width } = Dimensions.get('window');

export function ActivityDetailScreen() {
  const { theme } = useTheme();
  const { activities, toggleFavorite, removeActivity, archiveActivity, duplicateActivity } = useActivities();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    const a = activities.find(act => act.id === route.params?.id);
    setActivity(a || null);
  }, [activities, route.params?.id]);

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.textSecondary }}>Activité introuvable</Text>
      </View>
    );
  }

  const catInfo = getCategoryInfo(activity.category);
  const priInfo = getPriorityInfo(activity.priority);
  const statusInfo = getStatusInfo(activity.status);
  const mainPhoto = activity.photos.find(p => p.isMain) || activity.photos[0];
  const isDone = activity.status === 'done';

  const handleDelete = () => {
    Alert.alert('Supprimer', `Supprimer "${activity.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => { await removeActivity(activity.id); navigation.goBack(); },
      },
    ]);
  };

  const handleShare = () => {
    Share.share({
      message: `${activity.title}\n${activity.description}\n${activity.placeName ? activity.placeName + ', ' : ''}${activity.city}${activity.country ? ', ' + activity.country : ''}`,
    });
  };

  const handleOpenMaps = () => {
    const lat = activity.latitude || 0;
    const lng = activity.longitude || 0;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView>
        <View style={[styles.hero, { backgroundColor: catInfo.color + '20' }]}>
          {mainPhoto ? (
            <Image source={{ uri: mainPhoto.uri }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: catInfo.color + '15' }]}>
              <MaterialIcons name={catInfo.icon as any} size={80} color={catInfo.color + '60'} />
            </View>
          )}
          <View style={styles.heroOverlay} />
          <View style={styles.heroActions}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.heroBtn, { backgroundColor: theme.overlay }]}
            >
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <View style={styles.heroRight}>
              <Pressable
                onPress={() => toggleFavorite(activity.id)}
                style={[styles.heroBtn, { backgroundColor: theme.overlay }]}
              >
                <MaterialIcons
                  name={activity.isFavorite ? 'favorite' : 'favorite-border'}
                  size={22}
                  color={activity.isFavorite ? '#FF3B30' : '#fff'}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  navigation.navigate('Create', { activityId: activity.id, activity });
                }}
                style={[styles.heroBtn, { backgroundColor: theme.overlay }]}
              >
                <MaterialIcons name="edit" size={22} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {isDone && (
              <View style={[styles.doneBadge, { backgroundColor: theme.success }]}>
                <MaterialIcons name="check" size={18} color="#fff" />
              </View>
            )}
            <Text style={[styles.title, { color: theme.text }, isDone && styles.doneTitle]}>
              {activity.title}
            </Text>
          </View>

          <View style={styles.badgeRow}>
            <CategoryBadge category={activity.category} />
            <StatusBadge status={activity.status} />
            <View style={[styles.priorityBadge, { backgroundColor: priInfo.color + '20' }]}>
              <View style={[styles.priorityDot, { backgroundColor: priInfo.color }]} />
              <Text style={[styles.priorityText, { color: priInfo.color }]}>{priInfo.label}</Text>
            </View>
          </View>

          {activity.description ? (
            <GlassCard onPress={() => {}} disabled style={{ marginTop: 16 }}>
              <Text style={[styles.descText, { color: theme.text }]}>{activity.description}</Text>
            </GlassCard>
          ) : null}

          <View style={[styles.infoSection, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1, borderRadius: 20, marginTop: 16 }]}>
            {[
              activity.placeName && { icon: 'place', label: activity.placeName },
              activity.city && { icon: 'location-city', label: activity.city },
              activity.country && { icon: 'public', label: activity.country },
              activity.latitude && { icon: 'my-location', label: `${activity.latitude.toFixed(4)}, ${activity.longitude!.toFixed(4)}` },
              activity.budget && { icon: 'euro', label: `${activity.budget.toFixed(2)} €` },
              activity.estimatedTime && { icon: 'schedule', label: activity.estimatedTime },
              activity.plannedDate && { icon: 'event', label: activity.plannedDate },
              activity.link && { icon: 'link', label: activity.link },
            ].filter(Boolean).map((item: any, i) => (
              <View key={i} style={[styles.infoRow, { borderBottomColor: theme.separator }]}>
                <MaterialIcons name={item.icon} size={18} color={theme.textSecondary} />
                <Text
                  style={[styles.infoText, { color: activity.link === item.label ? theme.accent : theme.text }]}
                  numberOfLines={1}
                  onPress={activity.link === item.label ? () => Linking.openURL(item.label) : undefined}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {activity.notes ? (
            <GlassCard onPress={() => {}} disabled style={{ marginTop: 16 }}>
              <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>Notes</Text>
              <Text style={[styles.notesText, { color: theme.text }]}>{activity.notes}</Text>
            </GlassCard>
          ) : null}

          {activity.photos.length > 1 ? (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Galerie ({activity.photos.length})</Text>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {activity.photos.map((p, i) => (
                  <Pressable key={i} onPress={() => setGalleryIndex(i)}>
                    <Image
                      source={{ uri: p.uri }}
                      style={[
                        styles.galleryThumb,
                        { borderColor: galleryIndex === i ? theme.accent : 'transparent', borderWidth: 2 },
                      ]}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, { backgroundColor: theme.accent }]} onPress={handleShare}>
              <MaterialIcons name="share" size={20} color="#fff" />
              <Text style={styles.actionText}>Partager</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: theme.success }]} onPress={handleOpenMaps}>
              <MaterialIcons name="map" size={20} color="#fff" />
              <Text style={styles.actionText}>Maps</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.warning }]}
              onPress={() => duplicateActivity(activity.id)}
            >
              <MaterialIcons name="content-copy" size={20} color="#fff" />
              <Text style={styles.actionText}>Dupliquer</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.textSecondary }]}
              onPress={() => archiveActivity(activity.id)}
            >
              <MaterialIcons name="archive" size={20} color="#fff" />
              <Text style={styles.actionText}>Archiver</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: theme.destructive }]} onPress={handleDelete}>
              <MaterialIcons name="delete" size={20} color="#fff" />
              <Text style={styles.actionText}>Supprimer</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.15)' },
  heroActions: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroRight: { flexDirection: 'row', gap: 8 },
  heroBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 12, fontWeight: '600' },
  descText: { fontSize: 16, lineHeight: 24 },
  infoSection: { padding: 16 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  infoText: { fontSize: 15, flex: 1 },
  notesLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  notesText: { fontSize: 15, lineHeight: 22 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  galleryThumb: { width: 120, height: 90, borderRadius: 12, marginRight: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24, paddingBottom: 40 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
  },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  doneTitle: { textDecorationLine: 'line-through', textDecorationColor: '#34C759' },
  doneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});