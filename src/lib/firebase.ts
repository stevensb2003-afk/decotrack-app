
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
  "apiKey": process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  "authDomain": "decotrack-l9y8l.firebaseapp.com",
  "messagingSenderId": "602878187874"
};

// Initialize Firebase for SSR and SSG
let app: FirebaseApp;
if (getApps().length === 0) {
  // In the App Hosting environment, FIREBASE_CONFIG will be automatically populated.
  // In other environments, we'll fall back to our local config.
  app = initializeApp(process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

// Environment detection and database separation
let dbPrefix = '';
// The GAE_ENV variable is a reliable indicator of a Google App Engine environment (which App Hosting uses).
// VERCEL_ENV is used by Vercel for preview deployments.
if (process.env.GAE_ENV === 'standard' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' || (typeof window !== 'undefined' && window.location.hostname.includes('--'))) {
    // Check if the current branch is not main to apply dev prefix
    // This logic assumes you are deploying branches other than 'main' for development/staging
    if (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF !== 'main' && !window.location.hostname.startsWith('decotrack.decoinnovacr')) {
         dbPrefix = 'dev_';
         console.log("Running in DEV environment. Using 'dev_' prefix for collections.");
    }
} else if (process.env.NODE_ENV === 'development') {
    dbPrefix = 'dev_';
    console.log("Running in local DEV environment. Using 'dev_' prefix for collections.");
}


const applyDbPrefix = (collectionName: string) => {
    // Ensure the original collection name is not prefixed if it's already a dev collection.
    // This prevents double-prefixing like 'dev_dev_employees'.
    if (collectionName.startsWith('dev_')) {
        return collectionName;
    }
    return `${dbPrefix}${collectionName}`;
};

export { app, auth, db, applyDbPrefix };
