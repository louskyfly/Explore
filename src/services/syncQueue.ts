import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, Profile } from '../types/activity';

const QUEUE_KEY = 'sync_pending_queue';

export interface PendingChange {
  id: string;
  type: 'push' | 'delete';
  activityId: string;
  profile: Profile;
  timestamp: string;
}

export async function getPendingQueue(): Promise<PendingChange[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addToQueue(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<void> {
  try {
    const queue = await getPendingQueue();
    queue.push({
      ...change,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {}
}

export async function removeByIdFromQueue(activityId: string): Promise<void> {
  try {
    const queue = await getPendingQueue();
    const filtered = queue.filter(c => c.activityId !== activityId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch {}
}

export async function processQueue(
  onPush: (activity: Activity) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  getLocalActivity: (id: string) => Promise<Activity | null>,
): Promise<number> {
  const queue = await getPendingQueue();
  if (queue.length === 0) return 0;

  let processed = 0;
  const remaining: PendingChange[] = [];

  for (const change of queue) {
    try {
      if (change.type === 'push') {
        const activity = await getLocalActivity(change.activityId);
        if (activity) {
          await onPush(activity);
          processed++;
        }
      } else if (change.type === 'delete') {
        await onDelete(change.activityId);
        processed++;
      }
    } catch {
      remaining.push(change);
    }
  }

  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch {}
  return processed;
}
