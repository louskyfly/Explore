let db: any = null;

export async function getDb(): Promise<any> {
  if (db) return db;
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  const { getFirestore } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: 'AIzaSyCyndPhRG5qmWyYWApVSTcHxNMvCHIVPV0',
    authDomain: 'explore-sync.firebaseapp.com',
    projectId: 'explore-sync',
    storageBucket: 'explore-sync.firebasestorage.app',
    messagingSenderId: '399658164394',
    appId: '1:399658164394:android:c68ea2a1baef548f9430d3',
  };

  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  db = getFirestore(app);
  return db;
}
