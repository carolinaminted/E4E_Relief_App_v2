import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPKjOwyW7wFYTtMeksndcY2jYIXLqk5BU",
  authDomain: "e4e-relief-app.firebaseapp.com",
  projectId: "e4e-relief-app",
  storageBucket: "e4e-relief-app.appspot.com",
  messagingSenderId: "792696379717",
  appId: "1:792696379717:web:33d4ba71ad931dc398462c",
  measurementId: "G-R60LTYQ98D"
};

// Initialize Firebase safely for hot-reloading environments
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };