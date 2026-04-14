import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { Auth, Persistence } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const hasFirebaseConfig = missingFirebaseKeys.length === 0;

const firebaseApp = hasFirebaseConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

let auth: Auth | null = null;
let db: Firestore | null = null;

const reactNativeAuth = FirebaseAuth as typeof FirebaseAuth & {
  initializeAuth: (app: ReturnType<typeof initializeApp>, deps?: { persistence?: Persistence }) => Auth;
  getReactNativePersistence: (storage: ReturnType<typeof createAsyncStorage>) => Persistence;
};

if (firebaseApp) {
  const persistence = reactNativeAuth.getReactNativePersistence(createAsyncStorage('mindcare-auth'));

  try {
    auth = reactNativeAuth.initializeAuth(firebaseApp, { persistence });
  } catch {
    auth = FirebaseAuth.getAuth(firebaseApp);
  }

  db = getFirestore(firebaseApp);
}

export { auth, db, firebaseApp, hasFirebaseConfig };

export const getFirebaseConfigError = () =>
  hasFirebaseConfig
    ? null
    : `Firebase is not configured. Add these Expo env vars: ${missingFirebaseKeys.join(', ')}`;
