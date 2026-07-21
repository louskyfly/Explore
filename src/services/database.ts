import * as SQLite from 'expo-sqlite';
import { Activity } from '../types/activity';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('explore.db');
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      photos TEXT DEFAULT '[]',
      category TEXT DEFAULT 'autre',
      placeName TEXT DEFAULT '',
      city TEXT DEFAULT '',
      country TEXT DEFAULT '',
      latitude REAL,
      longitude REAL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      plannedDate TEXT,
      notes TEXT DEFAULT '',
      link TEXT,
      budget REAL,
      estimatedTime TEXT,
      isFavorite INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      "order" INTEGER DEFAULT 0
    );
  `);
  return db;
}

export async function getAllActivities(): Promise<Activity[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM activities WHERE isArchived = 0 ORDER BY "order" ASC, createdAt DESC'
  );
  return rows.map(rowToActivity);
}

export async function getArchivedActivities(): Promise<Activity[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM activities WHERE isArchived = 1 ORDER BY updatedAt DESC'
  );
  return rows.map(rowToActivity);
}

export async function getActivity(id: string): Promise<Activity | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<any>('SELECT * FROM activities WHERE id = ?', id);
  return row ? rowToActivity(row) : null;
}

export async function insertActivity(activity: Activity): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO activities (id, title, description, photos, category, placeName, city, country,
      latitude, longitude, priority, status, plannedDate, notes, link, budget, estimatedTime,
      isFavorite, isArchived, createdAt, updatedAt, "order")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    activity.id, activity.title, activity.description, JSON.stringify(activity.photos),
    activity.category, activity.placeName, activity.city, activity.country,
    activity.latitude ?? null, activity.longitude ?? null, activity.priority, activity.status,
    activity.plannedDate ?? null, activity.notes, activity.link ?? null,
    activity.budget ?? null, activity.estimatedTime ?? null,
    activity.isFavorite ? 1 : 0, activity.isArchived ? 1 : 0,
    activity.createdAt, activity.updatedAt, activity.order
  );
}

export async function updateActivity(activity: Activity): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE activities SET title=?, description=?, photos=?, category=?, placeName=?, city=?, country=?,
      latitude=?, longitude=?, priority=?, status=?, plannedDate=?, notes=?, link=?, budget=?,
      estimatedTime=?, isFavorite=?, isArchived=?, updatedAt=?, "order"=?
    WHERE id=?`,
    activity.title, activity.description, JSON.stringify(activity.photos),
    activity.category, activity.placeName, activity.city, activity.country,
    activity.latitude ?? null, activity.longitude ?? null, activity.priority, activity.status,
    activity.plannedDate ?? null, activity.notes, activity.link ?? null,
    activity.budget ?? null, activity.estimatedTime ?? null,
    activity.isFavorite ? 1 : 0, activity.isArchived ? 1 : 0,
    activity.updatedAt, activity.order, activity.id
  );
}

export async function deleteActivity(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM activities WHERE id = ?', id);
}

function rowToActivity(row: any): Activity {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    photos: JSON.parse(row.photos || '[]'),
    category: row.category || 'autre',
    placeName: row.placeName || '',
    city: row.city || '',
    country: row.country || '',
    latitude: row.latitude,
    longitude: row.longitude,
    priority: row.priority || 'medium',
    status: row.status || 'todo',
    plannedDate: row.plannedDate,
    notes: row.notes || '',
    link: row.link,
    budget: row.budget,
    estimatedTime: row.estimatedTime,
    isFavorite: !!row.isFavorite,
    isArchived: !!row.isArchived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    order: row.order || 0,
  };
}
