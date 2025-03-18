// Simple Node.js script to test Firebase authentication
// Run with: node src/firebase/test-auth.js

const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');

// DIRECT FIREBASE CONFIG FOR TESTING
const firebaseConfig = {
  apiKey: "AIzaSyCUE-rUSwsyoqo4vmczI9kdxU5gJJMgU-I",
  authDomain: "time-bank-475ff.firebaseapp.com",
  projectId: "time-bank-475ff",
  storageBucket: "time-bank-475ff.appspot.com",
  messagingSenderId: "433016867446",
  appId: "1:433016867446:web:f595d5b9297fc6f46a6d57",
  measurementId: "G-MN3WRHY46D"
};

async function testFirebase() {
  try {
    console.log('Testing Firebase authentication...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
    
    // Test anonymous auth (usually enabled by default)
    const auth = getAuth(app);
    console.log('Auth initialized successfully');
    
    try {
      console.log('Attempting anonymous sign-in...');
      const result = await signInAnonymously(auth);
      console.log('Sign in successful!', result.user.uid);
      console.log('Your Firebase configuration is working correctly.');
    } catch (authErr) {
      console.error('Authentication error:', authErr.code, authErr.message);
      
      if (authErr.code === 'auth/configuration-not-found') {
        console.log('\nHOW TO FIX:');
        console.log('1. Go to the Firebase Console: https://console.firebase.google.com/');
        console.log(`2. Select your project: ${firebaseConfig.projectId}`);
        console.log('3. Click on "Authentication" in the left sidebar');
        console.log('4. Click on "Sign-in method" tab');
        console.log('5. Enable at least one provider (Email/Password or Anonymous)');
        console.log('6. Save your changes and run this test again');
      }
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

testFirebase(); 