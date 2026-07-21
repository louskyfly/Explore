import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivityContext';
import { CATEGORIES, getCategoryInfo } from '../types/activity';

const { width } = Dimensions.get('window');

export function StatsScreen() {
  const { theme } = useTheme();
  const { activities } = useActivities();
  const navigation = useNavigation<any>();

  const stats = useMemo(() => {
    const total = activities.length;
    const done = activities.filter(a => a.status === 'done').length;
    const remaining = total - done;
    const totalBudget = activities.reduce((s, a) => s + (a.budget || 0), 0);

    const byCategory: Record<string, number> = {};
    activities.forEach(a => { byCategory[a.category] = (byCategory[a.category] || 0) + 1; });

    const byCity: Record<string, number> = {};
    activities.forEach(a => {
      if (a.city) byCity[a.city] = (byCity[a.city] || 0) + 1;
    });

    return { total, done, remaining, totalBudget, byCategory, byCity };
  }, [activities]);

  const maxCat = Math.max(...Object.values(stats.byCategory), 1);
  const maxCity = Math.max(...Object.values(stats.byCity), 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.separator }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.accent} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Statistiques</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryRow}>
          {[
            { label: 'Total', value: stats.total, icon: 'explore', color: theme.accent },
            { label: 'Terminées', value: stats.done, icon: 'check-circle', color: theme.success },
            { label: 'Restantes', value: stats.remaining, icon: 'pending', color: theme.warning },
          ].map((s, i) => (
            <View key={i} style={[styles.summaryCard, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
              <MaterialIcons name={s.icon as any} size={28} color={s.color} />
              <Text style={[styles.summaryValue, { color: theme.text }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.budgetCard, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
          <MaterialIcons name="euro" size={24} color={theme.accent} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>Budget total estimé</Text>
            <Text style={[styles.budgetValue, { color: theme.text }]}>{stats.totalBudget.toFixed(2)} €</Text>
          </View>
        </View>

        {stats.total > 0 && (
          <View style={[styles.progressCard, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Progression</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.success,
                    width: `${(stats.done / stats.total) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {stats.done}/{stats.total} ({Math.round((stats.done / stats.total) * 100)}%)
            </Text>
          </View>
        )}

        {Object.keys(stats.byCategory).length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Par catégorie</Text>
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => {
                const info = getCategoryInfo(cat as any);
                return (
                  <View key={cat} style={styles.barRow}>
                    <View style={styles.barLabel}>
                      <MaterialIcons name={info.icon as any} size={16} color={info.color} />
                      <Text style={[styles.barLabelText, { color: theme.text }]}>{info.label}</Text>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: info.color + '20' }]}>
                      <View
                        style={[
                          styles.barFill,
                          { backgroundColor: info.color, width: `${(count / maxCat) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barCount, { color: theme.textSecondary }]}>{count}</Text>
                  </View>
                );
              })}
          </View>
        )}

        {Object.keys(stats.byCity).length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Par ville</Text>
            {Object.entries(stats.byCity)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([city, count]) => (
                <View key={city} style={styles.barRow}>
                  <View style={styles.barLabel}>
                    <MaterialIcons name="location-city" size={16} color={theme.accent} />
                    <Text style={[styles.barLabelText, { color: theme.text }]} numberOfLines={1}>{city}</Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: theme.accent + '20' }]}>
                    <View
                      style={[
                        styles.barFill,
                        { backgroundColor: theme.accent, width: `${(count / maxCity) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barCount, { color: theme.textSecondary }]}>{count}</Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
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
  content: { padding: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryValue: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  summaryLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  budgetLabel: { fontSize: 13, fontWeight: '600' },
  budgetValue: { fontSize: 22, fontWeight: '800' },
  progressCard: { padding: 16, borderRadius: 16, marginTop: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  chartCard: { padding: 16, borderRadius: 16, marginTop: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  barLabel: { flexDirection: 'row', alignItems: 'center', width: 120, gap: 6 },
  barLabelText: { fontSize: 13, fontWeight: '600' },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barCount: { fontSize: 13, fontWeight: '700', width: 30, textAlign: 'right' },
});
