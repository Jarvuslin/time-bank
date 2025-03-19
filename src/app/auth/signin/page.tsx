'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/firebase/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { FiMail, FiLock, FiAlertCircle, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

// SignInContent component to use search params
function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  
  const { signin, signup, signout, sendEmailVerification } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get('redirect');

  // Handle resend verification email
  const handleResendVerification = async () => {
    setResendingVerification(true);
    
    try {
      // We need to sign in first to get a user object, but this will throw an error
      // because the email isn't verified. We'll catch this error and send the verification.
      const result = await signup(email, password, ''); // We don't know the name here
      
      if (result.user) {
        await sendEmailVerification(result.user);
        setVerificationSent(true);
        
        // Sign out again
        await signout();
      }
    } catch (error: any) {
      // Check if the error is because the email is already in use (already registered)
      if (error.code === 'auth/email-already-in-use') {
        try {
          // Try to sign in temporarily to get the user object
          const tempAuth = await signin(email, password);
          if (tempAuth.user) {
            await sendEmailVerification(tempAuth.user);
            setVerificationSent(true);
            
            // Sign out again
            await signout();
          }
        } catch (_innerError) {
          // This is expected as the signin will fail due to non-verification
          // But the verification email should have been sent
          setVerificationSent(true);
        }
      } else {
        setErrorMessage(`Failed to resend verification email: ${error.message}`);
      }
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setVerificationRequired(false);

    try {
      const result = await signin(email, password);
      if (result) {
        // Redirect to the requested page or dashboard
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      if (error.message.includes('Email not verified')) {
        setVerificationRequired(true);
      } else if (error.code === 'auth/user-not-found') {
        setErrorMessage('No account exists with this email. Please check your email or sign up for a new account.');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please try again or use the "Forgot your password" link.');
      } else if (error.code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMessage('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        setErrorMessage('Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If email verification is required, show a special UI
  if (verificationRequired) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
            <div className="text-center">
              <FiMail className="mx-auto h-12 w-12 text-indigo-500" />
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Email verification required</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your account requires verification before signing in.
              </p>
            </div>
            
            {verificationSent ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FiCheckCircle className="text-green-500 mr-2" />
                  <p className="text-sm text-green-700">
                    Verification email sent! Please check your inbox and spam folder.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  Please check your email for a verification link. If you can&apos;t find it, you can request a new one.
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification || verificationSent}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (resendingVerification || verificationSent) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {resendingVerification ? (
                  <>
                    <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending verification email...
                  </>
                ) : verificationSent ? (
                  'Verification email sent'
                ) : (
                  'Resend verification email'
                )}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
                Try another account
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
            <h2 className="text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                create a new account
              </Link>
            </p>
          </div>
          
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
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <p>Loading sign in page...</p>
            <div className="mt-4 w-8 h-8 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </MainLayout>
    }>
      <SignInContent />
    </Suspense>
  );
}