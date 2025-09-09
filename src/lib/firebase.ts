
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// This configuration is now only used as a fallback for local development
// and will be ignored in the App Hosting environment.
const firebaseConfig = {
  "projectId": "decotrack-l9y8l",
  "appId": "1:602878187874:web:95bbedd4e76e455e99f43b",
  "storageBucket": "decotrack-l9y8l.appspot.com",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  "authDomain": "decotrack-l9y8l.firebaseapp.com",
  "messagingSenderId": "602878187874"
};

// Initialize Firebase for SSR and SSG
let app: FirebaseApp;
if (getApps().length === 0) {
  // In the App Hosting environment, FIREBASE_CONFIG will be automatically populated.
  // In other environments, we'll fall back to our local config.
  const config = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : firebaseConfig;
  app = initializeApp(config);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

// Simple function to apply prefix. We will not use environment detection here anymore
// to ensure consistency. The collections will not have a prefix.
const applyDbPrefix = (collectionName: string) => {
    return collectionName;
};

export { app, auth, db, applyDbPrefix };
