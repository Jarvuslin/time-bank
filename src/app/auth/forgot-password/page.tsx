'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FiMail, FiAlertCircle, FiRefreshCw, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import MainLayout from '@/components/layout/MainLayout';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Standard Firebase pattern for password reset
    sendPasswordResetEmail(auth, trimmedEmail)
      .then(() => {
        // Success
        setSuccessMessage('Password reset email sent! Please check your inbox and spam folder.');
        setEmail(''); // Clear the email input
      })
      .catch((error) => {
        // Error handling
        const errorCode = error.code;
        console.error('Firebase error:', errorCode, error.message);
        
        // Custom error messages for different error codes
        switch (errorCode) {
          case 'auth/invalid-email':
            setErrorMessage('Please enter a valid email address.');
            break;
          case 'auth/user-not-found':
            setErrorMessage('No account exists with this email address. Please check your email or sign up for a new account.');
            break;
          case 'auth/network-request-failed':
            setErrorMessage('Network error. Please check your internet connection and try again.');
            break;
          case 'auth/too-many-requests':
            setErrorMessage('Too many attempts. Please try again later.');
            break;
          default:
            setErrorMessage('An error occurred while sending the reset email. Please try again later.');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
          <div className="text-center">
            <FiMail className="mx-auto h-12 w-12 text-indigo-500" />
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Reset your password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the email address associated with your account, and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex items-center">
                <FiCheckCircle className="text-green-500 mr-2" />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                    Sending reset link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-500"
            >
              <FiArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 