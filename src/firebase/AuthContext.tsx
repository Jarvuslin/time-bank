'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, UserData } from './auth';
import { User, UserCredential } from 'firebase/auth';

// Update UserData interface with emailVerified property
interface AuthContextUserData extends UserData {
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  userData: AuthContextUserData | null;
  setUserData: (data: AuthContextUserData | null) => void;
  signup: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  signin: (email: string, password: string) => Promise<UserCredential>;
  signout: () => Promise<void>;
  getUserData: (userId: string) => Promise<AuthContextUserData | null>;
  sendEmailVerification: (user: User) => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
  updateEmailVerificationStatus: (userId: string, isVerified: boolean) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [userData, setUserData] = React.useState<AuthContextUserData | null>(null);

  React.useEffect(() => {
    if (auth.user) {
      auth.getUserData(auth.user.uid).then(data => {
        if (data) {
          const typedData = data as AuthContextUserData;
          setUserData(typedData);
          
          // Check if the email verification status has changed
          if (auth.user && auth.user.emailVerified && typedData && typedData.emailVerified === false) {
            // Update Firestore with the new email verification status
            auth.updateEmailVerificationStatus(auth.user.uid, true)
              .then(() => {
                console.log("User email verification status updated in Firestore");
              })
              .catch((error: Error) => {
                console.error("Error updating email verification status:", error);
              });
          }
        }
      }).catch((error: Error) => {
        console.error("Error fetching user data:", error);
      });
    } else {
      setUserData(null);
    }
  }, [auth]);

  const value = {
    ...auth,
    userData,
    setUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 