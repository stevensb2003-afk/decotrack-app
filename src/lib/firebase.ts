
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "decotrack-l9y8l",
  "appId": "1:602878187874:web:95bbedd4e76e455e99f43b",
  "storageBucket": "decotrack-l9y8l.appspot.com",
  "apiKey": "AIzaSyDlDmioqDC8-i0aP61SSk4AJAixssy9ax0",
  "authDomain": "decotrack-l9y8l.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "602878187874"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
