'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerificationHandler() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const verifyAndRedirect = async () => {
      // Firebase verification links contain oobCode as a parameter
      const oobCode = searchParams?.get('oobCode');
      const mode = searchParams?.get('mode');
      
      // If we have a verification code, process it
      if (mode === 'verifyEmail' && oobCode) {
        try {
          // Import Firebase auth
          const { getAuth, applyActionCode } = await import('firebase/auth');
          const auth = getAuth();
          
          // Process the verification code
          await applyActionCode(auth, oobCode);
          
          // Redirect to signin page
          window.location.href = '/auth/signin';
        } catch (error) {
          console.error('Verification error:', error);
          // Even if verification fails, redirect to sign-in page
          window.location.href = '/auth/signin';
        }
      } else {
        // For any other cases, redirect to sign-in
        window.location.href = '/auth/signin';
      }
    };

    // Make sure we're in browser environment
    if (typeof window !== 'undefined') {
      verifyAndRedirect();
    }
  }, [searchParams]);

  // This component doesn't render anything
  return null;
} 