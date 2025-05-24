// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { browser } from '$app/environment';

// Your web app's Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app = null;
let auth = null;
let db = null;
let analytics = null;

if (browser) {
  try {
    // Log config to debug (remove in production)
    console.log('Firebase config:', {
      ...firebaseConfig,
      apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
      authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING',
      projectId: firebaseConfig.projectId ? 'SET' : 'MISSING'
    });

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    if (firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }

    // Debug log
    console.log('Firebase initialized:', {
      app: app ? 'YES' : 'NO',
      auth: auth ? 'YES' : 'NO',
      db: db ? 'YES' : 'NO'
    });

    // Optional: Connect to Firestore emulator in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firestore emulator');
    }

  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

export { app, auth, db, analytics };