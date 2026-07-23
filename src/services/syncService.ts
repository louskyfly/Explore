import { Activity, Profile } from '../types/activity';

const COLLECTION = 'activities';

function activityToDoc(a: Activity) {
  return {
    id: a.id,
    profile: a.profile,
    title: a.title,
    description: a.description,
    photos: JSON.stringify(a.photos),
    category: a.category,
    placeName: a.placeName,
    city: a.city,
    country: a.country,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    priority: a.priority,
    status: a.status,
    plannedDate: a.plannedDate ?? null,
    notes: a.notes,
    link: a.link ?? null,
    budget: a.budget ?? null,
    estimatedTime: a.estimatedTime ?? null,
    isFavorite: a.isFavorite,
    isArchived: a.isArchived,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    order: a.order,
  };
}

function docToActivity(d: any): Activity {
  return {
    id: d.id,
    profile: d.profile || 'papa',
    title: d.title,
    description: d.description || '',
    photos: JSON.parse(d.photos || '[]'),
    category: d.category || 'autre',
    placeName: d.placeName || '',
    city: d.city || '',
    country: d.country || '',
    latitude: d.latitude,
    longitude: d.longitude,
    priority: d.priority || 'medium',
    status: d.status || 'todo',
    plannedDate: d.plannedDate,
    notes: d.notes || '',
    link: d.link,
    budget: d.budget,
    estimatedTime: d.estimatedTime,
    isFavorite: !!d.isFavorite,
    isArchived: !!d.isArchived,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    order: d.order || 0,
  };
}

export async function pushActivity(activity: Activity): Promise<void> {
  const { getDb } = await import('../config/firebase');
  const { doc, setDoc } = await import('firebase/firestore');
  const database = await getDb();
  const ref = doc(database, COLLECTION, activity.id);
  await setDoc(ref, activityToDoc(activity));
}

export async function pushActivities(activities: Activity[]): Promise<void> {
  const { getDb } = await import('../config/firebase');
  const { doc, writeBatch } = await import('firebase/firestore');
  const database = await getDb();
  const batch = writeBatch(database);
  for (const a of activities) {
    const ref = doc(database, COLLECTION, a.id);
    batch.set(ref, activityToDoc(a));
  }
  await batch.commit();
}

export async function pullActivities(profile: Profile): Promise<Activity[]> {
  const { getDb } = await import('../config/firebase');
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const database = await getDb();
  const q = query(collection(database, COLLECTION), where('profile', '==', profile));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: any) => docToActivity(d.data()));
}

export async function removeActivity(id: string): Promise<void> {
  const { getDb } = await import('../config/firebase');
  const { doc, deleteDoc } = await import('firebase/firestore');
  const database = await getDb();
  const ref = doc(database, COLLECTION, id);
  await deleteDoc(ref);
}

export async function pullAllActivities(): Promise<Activity[]> {
  const { getDb } = await import('../config/firebase');
  const { collection, getDocs } = await import('firebase/firestore');
  const database = await getDb();
  const snapshot = await getDocs(collection(database, COLLECTION));
  return snapshot.docs.map((d: any) => docToActivity(d.data()));
}
