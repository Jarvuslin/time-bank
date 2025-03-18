'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/firebase/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { getServicesByProvider, getRequestsByUser, ServiceItem, ServiceRequest } from '@/firebase/services';
import { FiClock, FiPlus, FiList, FiUser, FiStar, FiMessageSquare, FiCheckCircle, FiXCircle, FiSettings, FiActivity, FiTrash2, FiRefreshCw } from 'react-icons/fi';

// Extended interface to include role and providerName
interface ExtendedServiceRequest extends ServiceRequest {
  role: string;
  providerName?: string;
  serviceTitle?: string;
}

export default function Dashboard() {
  const { user, userData, loading, checkEmailVerified } = useAuthContext();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [myServices, setMyServices] = useState<ServiceItem[]>([]);
  const [myRequests, setMyRequests] = useState<ExtendedServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      router.push('/auth/signin');
    }
    
    // Check email verification
    if (user) {
      // Set user name from user object if available
      if (user.displayName) {
        setUserName(user.displayName);
      }
      
      checkEmailVerified()
        .then(verified => {
          setIsVerified(verified);
          setVerificationChecked(true);
          
          if (!verified) {
            router.push('/auth/signin');
          }
        })
        .catch(error => {
          console.error('Error checking email verification:', error);
          setVerificationChecked(true);
        });
    }
  }, [user, loading, router, checkEmailVerified]);

  useEffect(() => {
    const fetchData = async () => {
      if (user && isVerified) {
        try {
          setIsLoading(true);
          
          // Try to get the user's name from userData if available
          if (userData?.displayName) {
            setUserName(userData.displayName);
          }
          
          const [services, requests] = await Promise.all([
            getServicesByProvider(user.uid),
            getRequestsByUser(user.uid)
          ]);
          
          setMyServices(services);
          setMyRequests(requests as ExtendedServiceRequest[]);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user, isVerified, userData]);

  // Show loading spinner if still loading or verification status is being checked
  if (loading || !verificationChecked || (verificationChecked && !isVerified)) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">
            {!verificationChecked 
              ? 'Verifying your account...' 
              : !isVerified 
                ? 'Redirecting to verification page...' 
                : 'Loading your dashboard...'}
          </p>
        </div>
      </MainLayout>
    );
  }

  // Get first name for more personal greeting
  const firstName = userName ? userName.split(' ')[0] : '';

  return (
    <MainLayout>
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {firstName ? `Welcome, ${firstName}!` : 'Welcome to TimeBank!'}
            </h1>
            <p className="mt-1 text-gray-600">Manage your services and time credits</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="bg-indigo-50 rounded-lg px-4 py-2 flex items-center">
              <FiClock className="mr-2 text-indigo-600" />
              <span className="font-bold text-indigo-600">{userData?.timeCredits || 0}</span>
              <span className="ml-1 text-gray-700">credits</span>
            </div>
            <Link
              href="/services/new"
              className="btn btn-primary flex items-center"
            >
              <FiPlus className="mr-2" />
              Offer Service
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="bg-white rounded-lg shadow-card mb-6 overflow-hidden">
        <nav className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-6 font-medium text-sm flex items-center transition-colors duration-200 ${
              activeTab === 'overview'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiActivity className="mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-6 font-medium text-sm flex items-center transition-colors duration-200 ${
              activeTab === 'services'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiList className="mr-2" />
            My Services
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-6 font-medium text-sm flex items-center transition-colors duration-200 ${
              activeTab === 'requests'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiMessageSquare className="mr-2" />
            Requests
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-6 font-medium text-sm flex items-center transition-colors duration-200 ${
              activeTab === 'profile'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiUser className="mr-2" />
            Profile
          </button>
        </nav>

        {/* Dashboard Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Stats Cards */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-5 shadow-sm">
                      <div className="flex items-center">
                        <div className="bg-white p-3 rounded-full shadow-sm">
                          <FiClock className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-600">Time Credits</h3>
                          <p className="text-3xl font-bold text-indigo-600 mt-1">{userData?.timeCredits || 0}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-600">
                        Use your credits to request services from others.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-5 shadow-sm">
                      <div className="flex items-center">
                        <div className="bg-white p-3 rounded-full shadow-sm">
                          <FiList className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-600">Services Offered</h3>
                          <p className="text-3xl font-bold text-emerald-600 mt-1">{userData?.servicesOffered || 0}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-600">
                        Total number of services you&apos;ve provided to others.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 shadow-sm">
                      <div className="flex items-center">
                        <div className="bg-white p-3 rounded-full shadow-sm">
                          <FiStar className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-600">Average Rating</h3>
                          <p className="text-3xl font-bold text-amber-600 mt-1">
                            {userData?.averageRating ? userData.averageRating.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-600">
                        Your average rating based on reviews from others.
                      </p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h3>
                    
                    {myRequests.length > 0 ? (
                      <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
                        {myRequests.slice(0, 5).map((request) => (
                          <div key={request.id} className="p-4 transition-colors hover:bg-gray-50">
                            <div className="flex items-start">
                              <div className={`p-2 rounded-full mr-4 ${
                                request.status === 'completed' ? 'bg-green-100' : 
                                request.status === 'pending' ? 'bg-amber-100' : 
                                request.status === 'accepted' ? 'bg-blue-100' : 'bg-red-100'
                              }`}>
                                {request.status === 'completed' ? (
                                  <FiCheckCircle className="h-5 w-5 text-green-600" />
                                ) : request.status === 'pending' ? (
                                  <FiClock className="h-5 w-5 text-amber-600" />
                                ) : request.status === 'accepted' ? (
                                  <FiMessageSquare className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <FiXCircle className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {request.role === 'provider' ? 
                                    `${request.requesterName} requested your service` : 
                                    `You requested a service`}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`badge ${
                                    request.status === 'completed' ? 'badge-success' : 
                                    request.status === 'pending' ? 'badge-warning' : 
                                    request.status === 'accepted' ? 'badge-primary' : 'badge-error'
                                  }`}>
                                    {request.status}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(request.createdAt?.toDate()).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <p className="text-gray-500">No recent activity to display.</p>
                        <Link href="/services" className="mt-2 inline-block text-indigo-600 hover:text-indigo-800">
                          Browse services to get started
                        </Link>
                      </div>
                    )}
                    
                    {myRequests.length > 5 && (
                      <div className="mt-4 text-center">
                        <button 
                          onClick={() => setActiveTab('requests')}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                        >
                          View all activity
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* My Services Tab */}
              {activeTab === 'services' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-800">My Services</h3>
                    <Link href="/services/new" className="btn btn-primary flex items-center">
                      <FiPlus className="mr-2" />
                      Add New
                    </Link>
                  </div>

                  {myServices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myServices.map((service) => (
                        <div key={service.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                          <div className="p-5">
                            <div className="flex justify-between">
                              <span className="badge badge-primary">{service.category}</span>
                              <span className="badge badge-success">{service.hoursRequired} hours</span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800 mt-2">{service.title}</h4>
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{service.description}</p>
                            <div className="mt-4 flex justify-between items-center">
                              <div className="text-sm text-gray-500">{new Date(service.createdAt?.toDate()).toLocaleDateString()}</div>
                              <Link href={`/services/${service.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                      <p className="text-gray-500 mb-4">You haven&apos;t offered any services yet.</p>
                      <Link href="/services/new" className="btn btn-primary">
                        Offer Your First Service
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">My Requests</h3>
                    
                    {myRequests.length > 0 ? (
                      <div className="space-y-4">
                        {myRequests.map((request) => (
                          <div key={request.id} className="bg-white rounded-lg shadow-sm p-5">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h4 className="text-lg font-medium text-gray-800">{request.serviceTitle}</h4>
                                  <span className={`ml-3 badge ${
                                    request.status === 'completed' ? 'badge-success' : 
                                    request.status === 'pending' ? 'badge-warning' : 
                                    request.status === 'accepted' ? 'badge-primary' : 'badge-error'
                                  }`}>
                                    {request.status}
                                  </span>
                                </div>
                                
                                <p className="text-gray-600 text-sm mt-2">
                                  {request.role === 'provider' ? 
                                    `Requested by: ${request.requesterName}` : 
                                    `Provider: ${request.providerName || 'Unknown'}`}
                                </p>
                                
                                <p className="text-gray-500 text-xs mt-1">
                                  Requested on: {new Date(request.createdAt?.toDate()).toLocaleDateString()}
                                </p>

                                <p className="text-gray-600 text-sm mt-3">{request.message}</p>
                              </div>
                              
                              <div className="ml-4">
                                {request.status === 'pending' && request.role === 'provider' && (
                                  <div className="space-y-2">
                                    <button className="w-full btn btn-primary text-sm py-1">
                                      Accept
                                    </button>
                                    <button className="w-full btn btn-secondary text-sm py-1">
                                      Decline
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <p className="text-gray-500">You don&apos;t have any requests yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Your Profile</h3>
                    
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-start">
                        <div className="bg-gray-200 rounded-full h-16 w-16 flex items-center justify-center">
                          <FiUser className="h-8 w-8 text-gray-600" />
                        </div>
                        
                        <div className="ml-6">
                          <h4 className="text-xl font-semibold text-gray-800">{userData?.displayName}</h4>
                          <p className="text-gray-600">{userData?.email}</p>
                          
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Time Credits</p>
                              <p className="text-lg font-medium text-gray-800">{userData?.timeCredits || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Services Offered</p>
                              <p className="text-lg font-medium text-gray-800">{userData?.servicesOffered || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Services Received</p>
                              <p className="text-lg font-medium text-gray-800">{userData?.servicesReceived || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Average Rating</p>
                              <p className="text-lg font-medium text-gray-800">
                                {userData?.averageRating ? userData.averageRating.toFixed(1) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-6 flex flex-wrap gap-3">
                            <button className="btn btn-secondary flex items-center">
                              <FiSettings className="mr-2" />
                              Edit Profile
                            </button>
                            
                            <DeleteAccountButton />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function DeleteAccountButton() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const { deleteAccount } = useAuthContext();
  const router = useRouter();
  
  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      router.push('/');
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : 'Failed to delete account';
      setError(errorMessage);
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };
  
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-red-600 mb-4">Delete Account</h3>
          <p className="mb-4">Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.</p>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setShowConfirmation(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                <>
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => setShowConfirmation(true)}
      className="btn btn-error flex items-center"
    >
      <FiTrash2 className="mr-2" />
      Delete Account
    </button>
  );
} 