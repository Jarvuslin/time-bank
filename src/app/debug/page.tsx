'use client';

import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, Auth } from 'firebase/auth';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

// DIRECT FIREBASE CONFIG FOR TESTING - DON'T USE THIS APPROACH IN PRODUCTION
const testFirebaseConfig = {
  apiKey: "AIzaSyCUE-rUSwsyoqo4vmczI9kdxU5gJJMgU-I",
  authDomain: "time-bank-475ff.firebaseapp.com",
  projectId: "time-bank-475ff",
  storageBucket: "time-bank-475ff.appspot.com",
  messagingSenderId: "433016867446",
  appId: "1:433016867446:web:f595d5b9297fc6f46a6d57",
  measurementId: "G-MN3WRHY46D"
};

export default function DebugPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<{code: string, message: string} | null>(null);
  const [firebaseAuth, setFirebaseAuth] = useState<Auth | null>(null);
  
  const testFirebase = async () => {
    try {
      setResult('Testing Firebase...');
      setError('');
      setErrorDetails(null);
      
      // Initialize Firebase directly
      const testApp = initializeApp(testFirebaseConfig, 'testApp');
      const testAuth = getAuth(testApp);
      setFirebaseAuth(testAuth);
      
      setResult('Firebase initialized successfully. Testing auth...');
      
      try {
        // Try to sign in (this will fail if user doesn't exist, which is fine)
        await signInWithEmailAndPassword(testAuth, email, password);
        setResult('Sign in successful! Your Firebase configuration is working correctly.');
      } catch (signInErr: any) {
        console.log('Sign in error code:', signInErr.code);
        console.log('Sign in error message:', signInErr.message);
        
        // If error is not "user not found", try to create the user
        if (signInErr.code === 'auth/user-not-found') {
          try {
            await createUserWithEmailAndPassword(testAuth, email, password);
            setResult('Test user created successfully! Your Firebase configuration is working correctly.');
          } catch (signUpErr: any) {
            console.log('Sign up error code:', signUpErr.code);
            console.log('Sign up error message:', signUpErr.message);
            
            if (signUpErr.code === 'auth/email-already-in-use') {
              setResult('Test user already exists but password may be different. Firebase configuration is working.');
            } else {
              throw signUpErr;
            }
          }
        } else if (signInErr.code === 'auth/wrong-password') {
          setResult('Test user exists but password is different. Firebase configuration is working.');
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error('Firebase test error:', err);
      setError(`Error: ${err.message} (${err.code || 'unknown'})`);
      setErrorDetails({
        code: err.code || 'unknown',
        message: err.message || 'Unknown error'
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Firebase Debug Page</h1>
        <p className="text-red-600 font-bold mb-4">WARNING: This page is for debugging only!</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Test Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Test Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button 
          onClick={testFirebase}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Test Firebase Connection
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800">Result:</h3>
            <p className="text-green-700">{result}</p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <p className="text-red-700">{error}</p>
            
            {errorDetails?.code === 'auth/configuration-not-found' && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="font-semibold text-yellow-800">How to Fix:</h4>
                <ol className="list-decimal ml-5 mt-2 space-y-2 text-gray-700">
                  <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Console</a></li>
                  <li>Select your project: <strong>{testFirebaseConfig.projectId}</strong></li>
                  <li>Click on <strong>Authentication</strong> in the left sidebar</li>
                  <li>Click on <strong>Sign-in method</strong> tab</li>
                  <li>Enable <strong>Email/Password</strong> provider</li>
                  <li>Save your changes</li>
                  <li>Return to this page and test again</li>
                </ol>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-semibold text-yellow-800">Firebase Config Being Tested:</h3>
          <pre className="text-sm overflow-auto p-2 bg-gray-100 rounded-md mt-2">
            {JSON.stringify(testFirebaseConfig, null, 2)}
          </pre>
        </div>
      </div>
    </MainLayout>
  );
} 