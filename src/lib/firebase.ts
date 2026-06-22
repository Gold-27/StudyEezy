import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyApiKeyPlaceholderForTesting",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studyeezy-dummy.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studyeezy-dummy",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studyeezy-dummy.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

// Initialize Firebase client instance
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);

const isEmulator = !!process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;

// Initialize Firestore with offline persistence enabled (only in production)
const db = initializeFirestore(app, {
  localCache: isEmulator ? memoryLocalCache() : persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

if (process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(db, host, parseInt(port));
}

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
