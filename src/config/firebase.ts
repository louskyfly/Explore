import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCyndPhRG5qmWyYWApVSTcHxNMvCHIVPV0',
  authDomain: 'explore-sync.firebaseapp.com',
  projectId: 'explore-sync',
  storageBucket: 'explore-sync.firebasestorage.app',
  messagingSenderId: '399658164394',
  appId: '1:399658164394:android:c68ea2a1baef548f9430d3',
};

let app: ReturnType<typeof initializeApp>;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

try {
  enableMultiTabIndexedDbPersistence(db).catch(() => {});
} catch {}

export { app, db };
