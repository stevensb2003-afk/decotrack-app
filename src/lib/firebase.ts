// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration. This is safe to be public.
const firebaseConfig = {
  "projectId": "decotrack-l9y8l",
  "appId": "1:602878187874:web:95bbedd4e76e455e99f43b",
  "storageBucket": "decotrack-l9y8l.appspot.com",
  "apiKey": process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  "authDomain": "decotrack-l9y8l.firebaseapp.com",
  "messagingSenderId": "602878187874"
};

// Initialize Firebase for SSR and SSG
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Environment detection and database separation
let dbPrefix = '';
if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' || (typeof window !== 'undefined' && window.location.hostname.includes('--'))) {
    dbPrefix = 'dev_';
    console.log("Running in DEV environment. Using 'dev_' prefix for collections.");
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