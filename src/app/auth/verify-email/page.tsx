'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// This is a minimal component that handles verification and redirects immediately
export default function VerifyEmail() {
  const searchParams = useSearchParams();
  
  // Firebase verification links contain oobCode as a parameter
  const oobCode = searchParams?.get('oobCode');
  const mode = searchParams?.get('mode');

  // Process verification on mount - no UI needed
  useEffect(() => {
    const verifyAndRedirect = async () => {
      // If we have a verification code, process it
      if (mode === 'verifyEmail' && oobCode) {
        try {
          // Import Firebase auth
          const { getAuth, applyActionCode } = await import('firebase/auth');
          const auth = getAuth();
          
          // Process the verification code
          await applyActionCode(auth, oobCode);
          
          // Force hard redirect to prevent any issues with client-side navigation
          window.location.href = '/auth/signin';
        } catch (error) {
          console.error('Verification error:', error);
          // Even if verification fails, redirect to sign-in page without showing errors
          window.location.href = '/auth/signin';
        }
      } else {
        // For any other cases, just redirect to sign-in
        window.location.href = '/auth/signin';
      }
    };

    verifyAndRedirect();
  }, [oobCode, mode]);

  // Return an empty fragment - this component should never actually render
  return null;
} 