'use client';

import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification as firebaseSendEmailVerification,
  deleteUser,
  User,
  UserCredential,
  ActionCodeSettings
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from './config';

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
  skills?: string[];
  location?: string;
  createdAt?: any;
  timeCredits?: number;
  servicesOffered?: number;
  servicesReceived?: number;
  averageRating?: number;
  emailVerified?: boolean;
}

// Cache user data in memory to reduce database calls
const userDataCache = new Map<string, {data: UserData, timestamp: number}>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (
    email: string, 
    password: string, 
    displayName: string
  ): Promise<UserCredential> => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: serverTimestamp(),
          timeCredits: 10, // Start with 10 time credits
          servicesOffered: 0,
          servicesReceived: 0,
          averageRating: 0,
          emailVerified: false
        });
      }
      
      return userCredential;
    } catch (err: any) {
      setError(err.message);
      console.error("Signup error:", err.message);
      throw err; // Re-throw the error so it can be caught by the component
    }
  };

  const signin = async (
    email: string, 
    password: string
  ): Promise<UserCredential> => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (userCredential.user && !userCredential.user.emailVerified) {
        // Sign the user out if email is not verified
        await signOut(auth);
        throw new Error('Email not verified. Please check your email for verification link.');
      }
      
      return userCredential;
    } catch (err: any) {
      // Preserve the original Firebase error code
      const errorWithCode = {
        message: err.message,
        code: err.code
      };
      
      setError(err.message);
      console.error("Signin error:", err.message, err.code);
      
      // Pass both the message and code so the UI can handle specific cases
      throw errorWithCode;
    }
  };

  const signout = async (): Promise<void> => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
      console.error("Signout error:", err.message);
      throw err; // Re-throw the error so it can be caught by the component
    }
  };

  const sendEmailVerification = async (user: User): Promise<void> => {
    try {
      setError(null);
      
      // Configure the verification email link
      const actionCodeSettings: ActionCodeSettings = {
        // URL you want to redirect back to after verification.
        // This should be the full URL to your verification page
        url: `${window.location.origin}/auth/verify-email`,
        // This must be false for Firebase to handle verification and then redirect to our URL
        handleCodeInApp: false,
      };
      
      await firebaseSendEmailVerification(user, actionCodeSettings);
    } catch (err: any) {
      setError(err.message);
      console.error("Send email verification error:", err.message);
      throw err;
    }
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    try {
      if (!auth.currentUser) {
        return false;
      }
      
      // Reload user to get latest properties
      await auth.currentUser.reload();
      return auth.currentUser.emailVerified;
    } catch (err: any) {
      setError(err.message);
      console.error("Check email verified error:", err.message);
      return false;
    }
  };

  const getUserData = async (userId: string): Promise<UserData | null> => {
    try {
      // Check cache first
      const cachedData = userDataCache.get(userId);
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRY) {
        // Use cached data if it exists and is not expired
        return cachedData.data;
      }
      
      // If we have a user object for authentication and it matches the requested ID,
      // prepare a fallback object to use if Firestore fails
      let fallbackUserData: UserData | null = null;
      if (auth.currentUser && auth.currentUser.uid === userId) {
        fallbackUserData = {
          uid: userId,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName,
          photoURL: auth.currentUser.photoURL,
          emailVerified: auth.currentUser.emailVerified,
          // Default values for new users
          timeCredits: 10,
          servicesOffered: 0,
          servicesReceived: 0,
          averageRating: 0
        };
      }
      
      try {
        // Attempt to get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          
          // Update cache
          userDataCache.set(userId, {
            data: userData, 
            timestamp: Date.now()
          });
          
          return userData;
        } else if (fallbackUserData) {
          // If document doesn't exist but we have authentication data, create a default document
          try {
            await setDoc(doc(db, 'users', userId), {
              ...fallbackUserData,
              createdAt: serverTimestamp()
            });
            
            // Update cache
            userDataCache.set(userId, {
              data: fallbackUserData, 
              timestamp: Date.now()
            });
            
            return fallbackUserData;
          } catch (createErr) {
            console.warn("Failed to create user document, using fallback data:", createErr);
            return fallbackUserData;
          }
        }
        
        return null;
      } catch (firestoreErr: any) {
        // Handle Firestore errors - likely network-related
        console.warn("Firestore error, using fallback auth data:", firestoreErr);
        
        // If we have fallback data from auth, use it
        if (fallbackUserData) {
          return fallbackUserData;
        }
        
        // If we reach here, both Firestore and fallback failed
        throw firestoreErr;
      }
    } catch (err: any) {
      // This catches errors from both Firestore and our fallback mechanism
      const errorMessage = err.message || 'Error retrieving user data';
      let finalError = errorMessage;
      
      if (errorMessage.includes('client is offline') || 
          errorMessage.includes('network') ||
          errorMessage.includes('failed to get document')) {
        finalError = 'Unable to connect to the database. Please check your internet connection and try again.';
      }
        
      setError(finalError);
      console.error("Get user data error:", finalError);
      
      // Even if we reported an error, try to return fallback auth data if available
      if (auth.currentUser && auth.currentUser.uid === userId) {
        return {
          uid: userId,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName, 
          photoURL: auth.currentUser.photoURL,
          emailVerified: auth.currentUser.emailVerified,
          // Default values when offline
          timeCredits: 10,
          servicesOffered: 0, 
          servicesReceived: 0,
          averageRating: 0
        } as UserData;
      }
      
      return null;
    }
  };

  // Update Firestore when email is verified
  const updateEmailVerificationStatus = async (userId: string, isVerified: boolean): Promise<void> => {
    try {
      await setDoc(doc(db, 'users', userId), { emailVerified: isVerified }, { merge: true });
    } catch (err: any) {
      console.error("Update email verification status error:", err.message);
      throw err;
    }
  };

  // Delete current user account
  const deleteAccount = async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in');
      }
      
      const userId = auth.currentUser.uid;
      
      // Delete the user's document from Firestore first
      await deleteDoc(doc(db, 'users', userId));
      
      // Delete any service documents created by this user
      // Note: In a production app, you'd want to query for all services by this user
      // and delete them individually, but this is simplified for testing
      
      // Finally, delete the user's authentication account
      await deleteUser(auth.currentUser);
      
      console.log('Account successfully deleted');
    } catch (err: any) {
      setError(err.message);
      console.error("Delete account error:", err.message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signup,
    signin,
    signout,
    getUserData,
    sendEmailVerification,
    checkEmailVerified,
    updateEmailVerificationStatus,
    deleteAccount
  };
} 