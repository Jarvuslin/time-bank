'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuthContext } from '@/firebase/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { addService, ServiceCategory, ServiceItem } from '@/firebase/services';
import { FiClock, FiAlertCircle, FiCheck, FiArrowLeft, FiPlus, FiRefreshCw } from 'react-icons/fi';

// Category options with icons
const categoryOptions = [
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'handyman', label: 'Handyman', icon: '🔧' },
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'health', label: 'Health', icon: '🌱' },
  { value: 'cooking', label: 'Cooking', icon: '🍳' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'gardening', label: 'Gardening', icon: '🌿' },
  { value: 'creative', label: 'Creative', icon: '🎨' },
  { value: 'other', label: 'Other', icon: '📦' },
];

interface FormInputs {
  title: string;
  description: string;
  category: ServiceCategory;
  hoursRequired: number;
  location?: string;
}

export default function NewServicePage() {
  const { user, userData, loading } = useAuthContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdServiceTitle, setCreatedServiceTitle] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryMode, setRetryMode] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<FormInputs>({
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      hoursRequired: 1,
      location: '',
    },
  });

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      router.push('/auth/signin?redirect=/services/new');
    }
    
    // Also check for verified email
    if (!loading && user && !user.emailVerified) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  const handleCreateNew = () => {
    setShowSuccessModal(false);
    setSuccess(false);
    reset();
    window.scrollTo(0, 0);
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard?tab=services');
  };

  // Add debug function to help troubleshoot
  const addDebugInfo = useCallback((message: string) => {
    console.log("DEBUG:", message);
    setDebugInfo(prev => prev ? `${prev}\n${message}` : message);
  }, []);

  // Memoize the createService function for retries
  const createService = useCallback(async (serviceData: Omit<ServiceItem, 'id'>) => {
    try {
      addDebugInfo(`Attempting to create service (try #${retryCount + 1})`);
      const result = await addService(serviceData);
      addDebugInfo(`Service created successfully with ID: ${result?.id || 'unknown'}`);
      return result;
    } catch (err: unknown) {
      const error = err as { message?: string; retry?: boolean };
      addDebugInfo(`Error creating service: ${error.message || String(err)}`);
      
      // If it's a timeout error and we haven't retried too many times, throw a special error
      if ((error.message?.includes('timeout') || error.message?.includes('taking longer')) && retryCount < 2) {
        error.retry = true;
      }
      throw err;
    }
  }, [retryCount, addDebugInfo]);

  // Function to handle retries
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setRetryMode(false);
    setError(null);
    
    // Re-submit the form
    const formValues = getValues();
    onSubmit(formValues);
  };

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    // Reset states
    setError(null);
    setSuccess(false);
    setShowSuccessModal(false);
    if (!retryMode) setDebugInfo(null);
    setIsSubmitting(true);
    
    if (!retryMode) {
      addDebugInfo("Form submission started");
    } else {
      addDebugInfo("Retrying form submission");
    }
    
    try {
      // Enhanced validation to prevent auth errors
      if (!user) {
        addDebugInfo("No user found");
        setError('You must be logged in to create a service. Please sign in and try again.');
        router.push('/auth/signin?redirect=/services/new');
        return;
      }
      
      addDebugInfo(`User authenticated: ${user.uid}`);
      
      // Skip userData check if it's not available but user is authenticated
      // This allows creating services even when Firestore connection issues occur
      if (!userData && user) {
        addDebugInfo("No userData available, using fallback");
        
        // Create minimal userData from user object
        const fallbackUserData = {
          displayName: user.displayName || 'Anonymous',
          averageRating: 0
        };
        
        try {
          addDebugInfo("Creating service with fallback data");
          const newService: Omit<ServiceItem, 'id'> = {
            ...data,
            providerId: user.uid,
            providerName: fallbackUserData.displayName,
            providerRating: fallbackUserData.averageRating,
            status: 'available',
          };

          await createService(newService);
          
          setSuccess(true);
          setCreatedServiceTitle(data.title);
          setShowSuccessModal(true);
          // Reset retry count on success
          setRetryCount(0);
          setRetryMode(false);
        } catch (serviceErr: unknown) {
          const error = serviceErr as { retry?: boolean; message?: string };
          if (error.retry) {
            // Show retry UI
            setRetryMode(true);
            setError(`Timeout occurred (attempt ${retryCount + 1}/3). Click "Retry" to try again.`);
          } else {
            addDebugInfo(`Error in fallback flow: ${error.message || 'Unknown error'}`);
            handleServiceCreationError(serviceErr);
          }
        }
        return;
      }
      
      addDebugInfo("Using normal flow with userData");
      // Normal flow with userData available
      const newService: Omit<ServiceItem, 'id'> = {
        ...data,
        providerId: user.uid,
        providerName: userData?.displayName || 'Anonymous',
        providerRating: userData?.averageRating,
        status: 'available',
      };

      try {
        await createService(newService);
        
        setSuccess(true);
        setCreatedServiceTitle(data.title);
        setShowSuccessModal(true);
        // Reset retry count on success
        setRetryCount(0);
        setRetryMode(false);
      } catch (err: unknown) {
        const error = err as { retry?: boolean; message?: string };
        if (error.retry) {
          // Show retry UI
          setRetryMode(true);
          setError(`Timeout occurred (attempt ${retryCount + 1}/3). Click "Retry" to try again.`);
        } else {
          addDebugInfo(`Error in normal flow: ${error.message || 'Unknown error'}`);
          handleServiceCreationError(err);
        }
      }
    } catch (outerErr: any) {
      addDebugInfo(`Unexpected outer error: ${outerErr.message || 'Unknown error'}`);
      setError(`An unexpected error occurred: ${outerErr.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      addDebugInfo("Form submission completed");
    }
  };

  // Helper function to handle service creation errors
  const handleServiceCreationError = (err: unknown) => {
    const error = err as { code?: string; message?: string };
    if (error.code === 'auth/invalid-credential' || error.message?.includes('invalid-credential')) {
      setError('Your login session has expired. Please sign in again.');
      setTimeout(() => {
        router.push('/auth/signin?redirect=/services/new');
      }, 2000);
    } else if (error.message?.includes('Unable to connect') || 
               error.message?.includes('network') || 
               error.message?.includes('offline') ||
               error.message?.includes('ping failed')) {
      
      setError('Connection issue detected. We\'ll try to save your service in offline mode.');
      
      // Store in local storage for later sync
      try {
        const offlineServices = JSON.parse(localStorage.getItem('offlineServices') || '[]');
        const formValues = getValues();
        offlineServices.push({
          form: JSON.stringify({
            ...formValues,
            providerId: user?.uid,
            timestamp: new Date().toISOString()
          })
        });
        localStorage.setItem('offlineServices', JSON.stringify(offlineServices));
        
        setSuccess(true);
        setCreatedServiceTitle(formValues.title);
        setShowSuccessModal(true);
        // Reset retry count
        setRetryCount(0);
        setRetryMode(false);
      } catch (storageErr: unknown) {
        console.error("Storage error:", storageErr);
        setError('Failed to save service. Please try again later.');
      }
    } else if (error.message?.includes('timeout') || error.message?.includes('taking longer')) {
      // Handle timeout errors specifically
      setError('The operation is taking longer than expected. This may be due to a slow connection. ' +
               'You can try again or check your internet connection.');
      // Don't redirect - allow user to retry
    } else {
      setError(error.message || 'Failed to create service. Please try again.');
    }
    console.error('Error creating service:', err);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Offer a New Service</h1>
          <p className="mt-2 text-gray-600">
            Share your skills with the community and earn time credits
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-center">
              <FiAlertCircle className="text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
              
              {/* Show retry button for timeout errors */}
              {retryMode && (
                <button 
                  onClick={handleRetry}
                  disabled={isSubmitting}
                  className="ml-auto flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium rounded"
                >
                  <FiRefreshCw className={`mr-1 ${isSubmitting ? 'animate-spin' : ''}`} />
                  {isSubmitting ? 'Retrying...' : 'Retry Now'}
                </button>
              )}
            </div>
          </div>
        )}

        {success && !showSuccessModal && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex items-center">
              <FiCheck className="text-green-500 mr-2" />
              <p className="text-sm text-green-700">
                Service created successfully!
              </p>
            </div>
          </div>
        )}

        {/* Debug info section - only show in development */}
        {process.env.NODE_ENV !== 'production' && debugInfo && (
          <div className="mb-6 bg-gray-50 border-l-4 border-gray-500 p-4 overflow-auto max-h-40">
            <p className="text-xs font-mono whitespace-pre-wrap text-gray-700">{debugInfo}</p>
          </div>
        )}

        {/* Loading indicator for form submission */}
        {isSubmitting && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              <p className="text-sm text-blue-700">Creating your service...</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Service Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Service Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                {...register('title', { required: 'Title is required' })}
                className={`mt-1 block w-full border ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="e.g., Math Tutoring, Home Repairs, Web Development"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Service Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 20,
                    message: 'Description should be at least 20 characters',
                  },
                })}
                className={`mt-1 block w-full border ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="Provide details about the service you're offering..."
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                {...register('category', { required: 'Category is required' })}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Hours Required */}
            <div>
              <label htmlFor="hoursRequired" className="block text-sm font-medium text-gray-700">
                Hours Required <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiClock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="hoursRequired"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  {...register('hoursRequired', {
                    required: 'Hours required is required',
                    min: {
                      value: 0.5,
                      message: 'Minimum 0.5 hours',
                    },
                    max: {
                      value: 24,
                      message: 'Maximum 24 hours',
                    },
                  })}
                  className={`pl-10 block w-full border ${
                    errors.hoursRequired ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                How many hours will this service take? This is how many time credits the requester will need.
              </p>
              {errors.hoursRequired && (
                <p className="mt-1 text-sm text-red-600">{errors.hoursRequired.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location (Optional)
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Downtown, North Side, Remote"
              />
              <p className="mt-1 text-xs text-gray-500">
                Where will this service be provided? Leave blank if remote or flexible.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Creating Service...' : 'Create Service'}
              </button>
              
              {/* Add a manual form reset button to help with troubleshooting */}
              {process.env.NODE_ENV !== 'production' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitting(false);
                    setSuccess(false);
                    setError(null);
                    setShowSuccessModal(false);
                    addDebugInfo("Form state manually reset");
                  }}
                  className="mt-2 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Reset Form State
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 w-full max-w-md bg-white rounded-xl shadow-lg transition-all">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <FiCheck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Success!</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Your service <span className="font-semibold">&quot;{createdServiceTitle}&quot;</span> has been successfully created!
                </p>
              </div>
              <div className="flex flex-col space-y-3 mt-5 px-4 py-3">
                <button
                  onClick={handleGoToDashboard}
                  className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiArrowLeft className="mr-2" />
                  Go to Dashboard
                </button>
                <button
                  onClick={handleCreateNew}
                  className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiPlus className="mr-2" />
                  Create Another Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 