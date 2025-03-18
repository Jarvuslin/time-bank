'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/firebase/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiCheckCircle, FiRefreshCw, FiInfo } from 'react-icons/fi';

// Add back valid email domains list but keep it private
const validEmailDomains = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'live.com',
  'msn.com',
  'me.com',
  'inbox.com'
];

export default function SignUp() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(60); // 60 seconds cooldown
  const [usePasswordReset, setUsePasswordReset] = useState(false);
  
  const { signup, error: authError, user, signout, sendEmailVerification } = useAuthContext();

  // Monitor auth state changes
  useEffect(() => {
    if (user && !verificationSent) {
      console.log("User authenticated, sending verification email", user.uid);
      
      // Send verification email
      sendEmailVerification(user)
        .then(() => {
          console.log("Verification email sent successfully");
          setVerificationSent(true);
          
          // Sign out the user after sending verification email
          signout()
            .catch((error) => {
              console.error(`Error signing out: ${error.message}`);
            });
        })
        .catch((error) => {
          console.error("Failed to send verification email:", error);
          setErrorMessage(`Failed to send verification email: ${error.message}`);
        });
      
      setSuccessMessage('Account created successfully!');
    }
    
    if (authError) {
      setErrorMessage(authError);
      setIsLoading(false);
    }
  }, [user, authError, signout, sendEmailVerification, verificationSent]);

  // Cooldown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (cooldownActive && cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);
    } else if (cooldownTime === 0) {
      setCooldownActive(false);
      setCooldownTime(60);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownActive, cooldownTime]);

  // Add a timeout for the loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      timeoutId = setTimeout(() => {
        if (isLoading && !user) {
          setErrorMessage('Request is taking longer than expected. Please check your connection or try again.');
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, user]);

  // Validate email domain but without showing validation message directly
  const isValidEmailDomain = (email: string): boolean => {
    if (!email.includes('@')) return false;
    
    const domain = email.split('@')[1].toLowerCase();
    return validEmailDomains.includes(domain);
  };

  // Attempt to send original verification email
  const handleResendVerification = async () => {
    if (cooldownActive) {
      return; // Don't allow resending during cooldown
    }
    
    setResendingVerification(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Check if online
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection and try again.');
      }
      
      // First try: Try to sign in and send a verification email
      if (!usePasswordReset) {
        try {
          const { getAuth, signInWithEmailAndPassword, sendEmailVerification } = await import('firebase/auth');
          const auth = getAuth();
          
          // Try to sign in with existing credentials
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          if (userCredential.user) {
            // Configure the action code settings
            const actionCodeSettings = {
              url: `${window.location.origin}/auth/verify-email`,
              handleCodeInApp: false,
            };
            
            // Send verification email
            await sendEmailVerification(userCredential.user, actionCodeSettings);
            
            // Sign out
            await signout();
            
            setSuccessMessage('Verification email resent! Please check your inbox.');
            setCooldownActive(true);
            return;
          }
        } catch (error: any) {
          // If we hit too many requests, switch to password reset method
          if (error.code === 'auth/too-many-requests') {
            setUsePasswordReset(true);
            console.log("Switching to password reset method due to rate limiting");
          } else {
            throw error;
          }
        }
      }
      
      // Second try: If verification email failed or rate-limited, use password reset
      if (usePasswordReset) {
        const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
        const auth = getAuth();
        
        // Use password reset as an alternative to email verification
        await sendPasswordResetEmail(auth, email);
        
        // Start cooldown
        setCooldownActive(true);
        
        setSuccessMessage('A password reset link has been sent instead. You can use this to verify your account by setting a new password.');
      }
    } catch (error: unknown) {
      console.error("Resend verification error:", error);
      
      // Handle specific Firebase errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many verification attempts. Please wait a few minutes before trying again.');
        setCooldownActive(true);
      } else {
        const errorMessage = error && typeof error === 'object' && 'message' in error 
          ? String(error.message) 
          : 'Unknown error occurred';
        setErrorMessage(`Failed to send email: ${errorMessage}`);
      }
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setVerificationSent(false);
    setUsePasswordReset(false); // Reset this flag on new signup

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    // Validate email domain without showing domain-specific message
    if (!isValidEmailDomain(email)) {
      setErrorMessage('Please use a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting to create account...");
      const userCredential = await signup(email, password, displayName);
      console.log("Account created successfully, credential:", userCredential);
      
      // If signup function doesn't send verification email, add a backup here
      if (userCredential && userCredential.user && !verificationSent) {
        console.log("Backup: Sending verification email...");
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
      }
    } catch (error: unknown) {
      console.error("Signup error:", error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Failed to create account. Please try again.';
      setErrorMessage(errorMessage);
      setIsLoading(false);
    }
  };

  // If verification is sent, show a different UI
  if (verificationSent) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
            <div className="text-center">
              <FiCheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Verify your email</h2>
              <p className="mt-2 text-sm text-gray-600">
                We&apos;ve sent a verification link to <span className="font-medium">{email}</span>
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                Please check your email and click the verification link to activate your account. 
                If you don&apos;t see the email, check your spam folder.
              </p>
            </div>
            
            {usePasswordReset && (
              <div className="mt-4 bg-yellow-50 p-4 rounded-lg flex items-start">
                <FiInfo className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Due to security limits, we&apos;ve sent you a password reset link instead. 
                  You can use this to verify your account by setting a new password.
                </p>
              </div>
            )}
            
            {/* Success or error messages */}
            {successMessage && (
              <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex items-center">
                  <FiCheckCircle className="text-green-500 mr-2" />
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            )}
            
            {errorMessage && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex items-center">
                  <FiAlertCircle className="text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification || cooldownActive}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (resendingVerification || cooldownActive) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {resendingVerification ? (
                  <>
                    <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : cooldownActive ? (
                  `Please wait ${cooldownTime} seconds...`
                ) : (
                  "I didn't receive the email"
                )}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Create your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>
          
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 animate-pulse">
              <div className="flex items-center">
                <FiCheckCircle className="text-green-500 mr-2" />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="display-name" className="sr-only">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="display-name"
                    name="displayName"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Full Name"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
  
              </div>
              
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm Password"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !!successMessage}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (isLoading || !!successMessage) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating account...
                  </>
                ) : successMessage ? 'Account created!' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
} 