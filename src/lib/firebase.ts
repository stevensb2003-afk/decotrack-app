// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.startsWith('develop--')) {
        dbPrefix = 'dev_';
        console.log("Running in DEV environment. Using 'dev_' prefix for collections.");
    }
}

const applyDbPrefix = (collectionName: string) => {
    return `${dbPrefix}${collectionName}`;
};

export { app, auth, db, applyDbPrefix };
