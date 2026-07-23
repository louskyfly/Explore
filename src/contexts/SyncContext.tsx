import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useProfile } from './ProfileContext';
import { useActivities } from './ActivityContext';
import { Activity, Profile } from '../types/activity';
import { addToQueue, getPendingQueue, clearQueue, processQueue } from '../services/syncQueue';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  pendingCount: number;
  syncNow: () => Promise<void>;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

const SyncContext = createContext<SyncContextType>({
  isOnline: false,
  isSyncing: false,
  lastSync: null,
  pendingCount: 0,
  syncNow: async () => {},
  enabled: false,
  setEnabled: () => {},
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { currentProfile } = useProfile();
  const { activities, refresh, getLocalActivity } = useActivities();
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    getPendingQueue().then(q => setPendingCount(q.length)).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    } catch {
      setIsOnline(true);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!enabled || isSyncing || !currentProfile) return;
    setIsSyncing(true);
    try {
      const { getDb } = await import('../config/firebase');
      const db = await getDb();
      const { collection, doc, setDoc, getDocs, deleteDoc, query, where } = await import('firebase/firestore');

      const COLLECTION = 'activities';

      await processQueue(
        async (a) => {
          const ref = doc(db, COLLECTION, a.id);
          await setDoc(ref, {
            id: a.id, profile: a.profile, title: a.title, description: a.description,
            photos: JSON.stringify(a.photos), category: a.category, placeName: a.placeName,
            city: a.city, country: a.country, latitude: a.latitude ?? null, longitude: a.longitude ?? null,
            priority: a.priority, status: a.status, plannedDate: a.plannedDate ?? null,
            notes: a.notes, link: a.link ?? null, budget: a.budget ?? null, estimatedTime: a.estimatedTime ?? null,
            isFavorite: a.isFavorite, isArchived: a.isArchived, createdAt: a.createdAt, updatedAt: a.updatedAt, order: a.order,
          });
        },
        async (id) => {
          await deleteDoc(doc(db, COLLECTION, id));
        },
        async (id) => getLocalActivity(id),
      );

      const q = query(collection(db, COLLECTION), where('profile', '==', currentProfile));
      const snapshot = await getDocs(q);
      const remoteActivities = snapshot.docs.map((d: any) => {
        const data = d.data();
        return {
          id: data.id, profile: data.profile || 'papa', title: data.title,
          description: data.description || '', photos: JSON.parse(data.photos || '[]'),
          category: data.category || 'autre', placeName: data.placeName || '',
          city: data.city || '', country: data.country || '',
          latitude: data.latitude, longitude: data.longitude,
          priority: data.priority || 'medium', status: data.status || 'todo',
          plannedDate: data.plannedDate, notes: data.notes || '', link: data.link,
          budget: data.budget, estimatedTime: data.estimatedTime,
          isFavorite: !!data.isFavorite, isArchived: !!data.isArchived,
          createdAt: data.createdAt, updatedAt: data.updatedAt, order: data.order || 0,
        };
      });

      const localMap = new Map(activities.map(a => [a.id, a]));
      const remoteMap = new Map(remoteActivities.map(a => [a.id, a]));

      const { insertActivity, updateActivity } = await import('../services/database');

      for (const [id, remote] of remoteMap) {
        const local = localMap.get(id);
        if (!local) {
          await insertActivity(remote);
        } else if (new Date(remote.updatedAt) > new Date(local.updatedAt)) {
          await updateActivity(remote);
        }
      }

      for (const [id, local] of localMap) {
        if (!remoteMap.has(id)) {
          const ref = doc(db, COLLECTION, local.id);
          await setDoc(ref, {
            id: local.id, profile: local.profile, title: local.title,
            description: local.description, photos: JSON.stringify(local.photos),
            category: local.category, placeName: local.placeName, city: local.city,
            country: local.country, latitude: local.latitude ?? null, longitude: local.longitude ?? null,
            priority: local.priority, status: local.status, plannedDate: local.plannedDate ?? null,
            notes: local.notes, link: local.link ?? null, budget: local.budget ?? null,
            estimatedTime: local.estimatedTime ?? null, isFavorite: local.isFavorite,
            isArchived: local.isArchived, createdAt: local.createdAt, updatedAt: local.updatedAt, order: local.order,
          });
        }
      }

      await refresh();
      const queue = await getPendingQueue();
      setPendingCount(queue.length);
      setLastSync(new Date().toISOString());
    } catch (e) {
      console.log('Sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [enabled, isSyncing, currentProfile, refresh, activities, getLocalActivity]);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    if (v) {
      syncNow();
    }
  }, [syncNow]);

  return (
    <SyncContext.Provider value={{
      isOnline, isSyncing, lastSync, pendingCount,
      syncNow, enabled, setEnabled,
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => useContext(SyncContext);
