'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCUE-rUSwsyoqo4vmczI9kdxU5gJJMgU-I",
  authDomain: "time-bank-475ff.firebaseapp.com",
  projectId: "time-bank-475ff",
  storageBucket: "time-bank-475ff.appspot.com", // Changed to standard appspot.com format
  messagingSenderId: "433016867446",
  appId: "1:433016867446:web:f595d5b9297fc6f46a6d57",
  measurementId: "G-MN3WRHY46D",
};

// Create our Firebase instances with better error handling
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: ReturnType<typeof getStorage>;

try {
  // Initialize Firebase
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Log successful initialization
  console.log("Firebase services initialized successfully");
  
  // Add connection state listeners for better offline detection
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('App is online, reconnecting to Firebase services');
    });
    
    window.addEventListener('offline', () => {
      console.log('App is offline, Firebase operations may be limited');
    });
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  
  // Create fallback instances to prevent app from crashing
  // Even if initialization fails, the app will have these objects
  // to work with (though they won't function properly)
  app = getApps().length ? getApp() : initializeApp({ projectId: 'fallback-app' });
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

console.log("Firebase config initialized with:", 
  JSON.stringify({
    apiKey: firebaseConfig.apiKey?.substring(0, 5) + "...", // Only show part of the key for security
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  })
);

export { app, auth, db, storage }; 