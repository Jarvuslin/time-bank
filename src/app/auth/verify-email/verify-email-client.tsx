'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// This is a minimal component that handles verification and redirects immediately
export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  // Process verification on mount - only in client side
  useEffect(() => {
    // Making sure we're running in browser environment
    if (typeof window === 'undefined') return;
    
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
          setStatus('success');
          
          // Force hard redirect to prevent any issues with client-side navigation
          window.location.href = '/auth/signin';
        } catch (error) {
          console.error('Verification error:', error);
          setStatus('error');
          // Even if verification fails, redirect to sign-in page without showing errors
          window.location.href = '/auth/signin';
        }
      } else {
        // For any other cases, just redirect to sign-in
        window.location.href = '/auth/signin';
      }
    };

    verifyAndRedirect();
  }, [searchParams]);

  // Return a minimal loading state - this UI will only briefly show
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p>Verifying your email...</p>
        <div className="mt-4 w-8 h-8 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 