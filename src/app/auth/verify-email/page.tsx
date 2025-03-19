'use client';

import { Suspense } from 'react';
import VerificationHandler from './verification-handler';

function VerifyEmailContent() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <VerificationHandler />
        <p>Verifying your email...</p>
        <p className="text-sm text-gray-600 mt-2">If you are not redirected, please click <a href="/auth/signin" className="text-blue-600 hover:underline">here</a> to go to sign in page</p>
        <div className="mt-4 w-8 h-8 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading verification page...</p>
          <div className="mt-4 w-8 h-8 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
} 