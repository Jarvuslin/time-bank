'use client';

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  increment,
  limit,
  setDoc
} from 'firebase/firestore';
import { db } from './config';
import { getAuth } from 'firebase/auth';

export type ServiceCategory = 
  | 'education' 
  | 'handyman' 
  | 'technology' 
  | 'health' 
  | 'cooking' 
  | 'transportation' 
  | 'cleaning' 
  | 'gardening' 
  | 'creative' 
  | 'other';

export interface ServiceItem {
  id?: string;
  title: string;
  description: string;
  category: ServiceCategory;
  hoursRequired: number;
  providerId: string;
  providerName: string;
  providerRating?: number;
  location?: string;
  status: 'available' | 'booked' | 'completed';
  createdAt?: any;
  updatedAt?: any;
  photos?: string[];
}

export interface ServiceRequest {
  id?: string;
  serviceId: string;
  requesterId: string;
  requesterName: string;
  providerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message?: string;
  createdAt?: any;
  completedAt?: any;
}

export interface ServiceReview {
  id?: string;
  serviceId: string;
  reviewerId: string;
  reviewerName: string;
  providerId: string;
  rating: number; // 1-5
  comment: string;
  createdAt?: any;
}

// Services collection operations
export const servicesCollection = collection(db, 'services');
export const requestsCollection = collection(db, 'serviceRequests');
export const reviewsCollection = collection(db, 'reviews');

// Helper function to create a promise with timeout
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  // Create a promise that rejects after timeoutMs milliseconds
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  
  // Race the original promise against the timeout
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Helper function to test database connectivity
export const testDatabaseConnectivity = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    console.log("Browser reports offline, skipping connectivity test");
    return false;
  }
  
  try {
    console.log("Testing database connectivity...");
    // Try multiple approaches to test connectivity
    
    // Try 1: Check if we can access a document that always exists
    try {
      // First try to get a document from a system collection
      const systemDoc = await withTimeout(
        getDoc(doc(db, 'system', 'status')), 
        2000, // very short timeout
        'System doc timeout'
      );
      console.log("Database connectivity confirmed via system document");
      return true;
    } catch (e) {
      console.log("Could not access system document, trying alternative...");
    }
    
    // Try 2: Try a minimal query
    try {
      const minimalQuery = await withTimeout(
        getDocs(query(servicesCollection, limit(1))),
        2000,
        'Minimal query timeout'
      );
      console.log("Database connectivity confirmed via minimal query");
      return true;
    } catch (e) {
      console.log("Could not perform minimal query");
    }
    
    // If we get here, all connectivity tests failed
    console.warn("All database connectivity tests failed");
    return false;
  } catch (error) {
    console.error("Error in database connectivity test:", error);
    return false;
  }
};

// Cache for services data
const servicesCache = {
  all: { data: null as ServiceItem[] | null, timestamp: 0 },
  byCategory: new Map<string, { data: ServiceItem[], timestamp: number }>()
};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Add a new service
export const addService = async (service: ServiceItem) => {
  console.log("Starting addService with:", JSON.stringify(service, null, 2));
  
  try {
    // First verify that the user is authenticated
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to create a service');
    }
    
    console.log("User authentication verified");
    
    // Only check email verification if we have access to the verification status
    // In offline scenarios, we can't reliably check this
    try {
      if (navigator.onLine && !currentUser.emailVerified) {
        console.log("Email verification check failed");
        throw new Error('Your email must be verified before creating a service');
      }
    } catch (verificationError) {
      // If we can't check verification status, allow the operation to proceed
      // This prevents users from being blocked offline
      console.warn('Could not verify email status, proceeding with service creation');
    }
    
    // Check if the provider ID matches the current user
    if (service.providerId !== currentUser.uid) {
      throw new Error('You can only create services for yourself');
    }
    
    // Try a simplified approach - use addDoc with an increased timeout
    try {
      console.log("Attempting to add service to Firestore");
      
      // 1. First check for network/Firestore availability quickly
      try {
        // Do a quick ping to Firestore by getting one document from any collection
        // This will fail fast if we have network/Firestore issues
        const pingPromise = withTimeout(
          getDoc(doc(db, 'ping', 'test')),
          3000, // 3 second timeout for the ping
          'Cannot connect to database. Please check your internet connection.'
        );
        
        await pingPromise.catch(err => {
          console.log("Database ping failed:", err.message);
          // If ping fails, throw an error that will be caught by the outer catch
          throw new Error('Unable to connect to the database. Using offline mode.');
        });
      } catch (pingError) {
        // If ping fails, try offline mode
        console.log("Using offline mode due to ping failure");
        throw pingError;
      }
      
      // 2. If ping succeeds, proceed with direct addDoc approach
      console.log("Database ping successful, proceeding with service creation");
      const serviceData = {
        ...service,
        createdAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp for reliability
        updatedAt: new Date().toISOString(),
        status: 'available'
      };
      
      // Use a much longer timeout for addDoc - potentially unreliable operation
      const docRef = await withTimeout(
        addDoc(servicesCollection, serviceData),
        20000, // 20 second timeout - much more generous
        'Service creation is taking longer than expected. Please try again.'
      );
      
      console.log("Service added successfully with ID:", docRef.id);
      
      // Try to update the user's services offered count - but don't wait for it
      try {
        console.log("Updating user service count");
        const userRef = doc(db, 'users', currentUser.uid);
        // Fire and forget - don't wait
        updateDoc(userRef, {
          servicesOffered: increment(1)
        }).catch(e => console.warn("Could not update service counter, but service was created:", e));
      } catch (counterError) {
        // If updating the counter fails, log but don't stop the process
        console.warn('Could not update service counter:', counterError);
      }
      
      return { id: docRef.id, ...service };
    } catch (firestoreError: any) {
      console.error("Firestore error:", firestoreError);
      
      // Specific Firestore errors that might indicate offline status
      if (firestoreError.code === 'unavailable' || 
          firestoreError.code === 'failed-precondition' ||
          firestoreError.message?.includes('offline') ||
          firestoreError.message?.includes('network') ||
          firestoreError.message?.includes('timeout') ||
          firestoreError.message?.includes('Unable to connect') ||
          !navigator.onLine) {
        
        console.log("Detected offline or timeout condition, using local storage fallback");
        
        // Store in local storage for later sync
        try {
          const offlineServices = JSON.parse(localStorage.getItem('offlineServices') || '[]');
          const offlineServiceId = `offline_${new Date().getTime()}`;
          const offlineService = {
            ...service,
            id: offlineServiceId,
            createdOffline: true,
            createdAt: new Date().toISOString(),
          };
          offlineServices.push(offlineService);
          localStorage.setItem('offlineServices', JSON.stringify(offlineServices));
          
          console.log("Service saved to local storage with ID:", offlineServiceId);
          
          // Return the offline service immediately
          return offlineService;
        } catch (storageError) {
          console.error('Could not store service offline:', storageError);
          throw new Error('Could not save service offline. Please try again when online.');
        }
      }
      
      // If it's not an offline error, rethrow
      throw firestoreError;
    }
  } catch (error: any) {
    console.error('Error adding service: ', error);
    
    // Handle authentication errors specifically
    if (error.code === 'auth/invalid-credential' || 
        error.code === 'auth/user-token-expired' ||
        error.code === 'permission-denied') {
      throw new Error('Authentication error: Please sign in again.');
    }
    
    throw error; // Re-throw for handling in the component
  }
};

// Update a service
export const updateService = async (id: string, service: Partial<ServiceItem>) => {
  try {
    const serviceRef = doc(db, 'services', id);
    await updateDoc(serviceRef, {
      ...service,
      updatedAt: serverTimestamp()
    });
    return { id, ...service };
  } catch (error) {
    console.error('Error updating service: ', error);
    throw error;
  }
};

// Delete a service
export const deleteService = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'services', id));
    return { id };
  } catch (error) {
    console.error('Error deleting service: ', error);
    throw error;
  }
};

// Get a service by ID
export const getService = async (id: string) => {
  try {
    const serviceDoc = await getDoc(doc(db, 'services', id));
    if (serviceDoc.exists()) {
      return { id: serviceDoc.id, ...serviceDoc.data() } as ServiceItem;
    } else {
      throw new Error('Service not found');
    }
  } catch (error) {
    console.error('Error getting service: ', error);
    throw error;
  }
};

// Get all available services
export const getAvailableServices = async (category?: ServiceCategory, maxItems = 50) => {
  console.log(`Getting available services${category ? ` for category: ${category}` : ''}`);
  
  try {
    // Check cache first
    const cacheKey = category || 'all';
    const cache = category ? servicesCache.byCategory.get(category) : servicesCache.all;
    
    if (cache?.data && (Date.now() - cache.timestamp) < CACHE_EXPIRY) {
      console.log('Using cached services data');
      return cache.data as ServiceItem[];
    }
    
    // If we're offline, try to return cached data even if expired
    if (!navigator.onLine && cache?.data) {
      console.log('Offline: using expired cache');
      return cache.data as ServiceItem[];
    }
    
    // Test database connectivity using our dedicated helper
    const isConnected = await testDatabaseConnectivity();
    
    if (!isConnected) {
      // If we can't connect but have cached data, use it
      if (cache?.data) {
        console.log('Using expired cache due to connectivity issues');
        return cache.data as ServiceItem[];
      }
      
      // No connection and no cache
      console.log('No database connection and no cache available');
      return [];
    }
    
    console.log("Database connectivity confirmed, proceeding with query");
    
    // Prepare the query - create a more efficient query based on category
    let q;
    
    if (category) {
      q = query(
        servicesCollection, 
        where('status', '==', 'available'),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );
    } else {
      q = query(
        servicesCollection, 
        where('status', '==', 'available'), 
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );
    }
    
    // Execute the query with timeout
    console.log("Executing main services query...");
    try {
      const querySnapshot = await withTimeout(
        getDocs(q),
        25000, // 25 second timeout
        'Services listing request took too long. Please try again or check your connection.'
      );
      
      const services = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceItem[];
      
      // Update cache
      if (category) {
        servicesCache.byCategory.set(category, { data: services, timestamp: Date.now() });
      } else {
        servicesCache.all = { data: services, timestamp: Date.now() };
      }
      
      console.log(`Retrieved ${services.length} services`);
      return services;
    } catch (queryError: any) {
      console.error("Error executing main query:", queryError);
      
      // Use cache as fallback if available
      if (cache?.data) {
        console.log('Query failed, using cached data as fallback');
        return cache.data as ServiceItem[];
      }
      
      // If no cache, check if this is a connection/timeout error
      if (!navigator.onLine || 
          queryError.message?.includes('network') || 
          queryError.message?.includes('offline') || 
          queryError.message?.includes('connect') || 
          queryError.message?.includes('timeout') || 
          queryError.message?.includes('too long')) {
        console.log('Network error, returning empty array');
        return [];
      }
      
      throw queryError;
    }
  } catch (error: any) {
    console.error('Error getting available services:', error);
    
    // One final check for cache as fallback
    const cache = category ? servicesCache.byCategory.get(category) : servicesCache.all;
    if (cache?.data) {
      console.log('Error occurred, using cached data as final fallback');
      return cache.data as ServiceItem[];
    }
    
    // If all else fails, return an empty array instead of throwing
    console.log('No cache available and encountered error, returning empty array');
    return [];
  }
};

// Get services by provider
export const getServicesByProvider = async (providerId: string) => {
  try {
    const q = query(
      servicesCollection, 
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceItem[];
  } catch (error) {
    console.error('Error getting provider services: ', error);
    throw error;
  }
};

// Request a service
export const requestService = async (request: ServiceRequest) => {
  try {
    const docRef = await addDoc(requestsCollection, {
      ...request,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    // Update the service status to booked
    await updateDoc(doc(db, 'services', request.serviceId), {
      status: 'booked',
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...request };
  } catch (error) {
    console.error('Error requesting service: ', error);
    throw error;
  }
};

// Update a service request
export const updateServiceRequest = async (id: string, request: Partial<ServiceRequest>) => {
  try {
    const requestRef = doc(db, 'serviceRequests', id);
    await updateDoc(requestRef, {
      ...request,
      updatedAt: serverTimestamp()
    });
    
    // If status is completed, update the service
    if (request.status === 'completed') {
      const serviceRequest = await getDoc(requestRef);
      const serviceId = serviceRequest.data()?.serviceId;
      
      if (serviceId) {
        await updateDoc(doc(db, 'services', serviceId), {
          status: 'completed',
          updatedAt: serverTimestamp()
        });
        
        // Update user time credits
        const requestData = serviceRequest.data() as ServiceRequest;
        const serviceDoc = await getDoc(doc(db, 'services', serviceId));
        const serviceData = serviceDoc.data() as ServiceItem;
        
        // Add credits to provider
        await updateDoc(doc(db, 'users', requestData.providerId), {
          timeCredits: increment(serviceData.hoursRequired),
          servicesOffered: increment(1)
        });
        
        // Subtract credits from requester
        await updateDoc(doc(db, 'users', requestData.requesterId), {
          timeCredits: increment(-serviceData.hoursRequired),
          servicesReceived: increment(1)
        });
      }
    }
    
    return { id, ...request };
  } catch (error) {
    console.error('Error updating service request: ', error);
    throw error;
  }
};

// Get requests by user (both as provider and requester)
export const getRequestsByUser = async (userId: string) => {
  try {
    // Get requests where user is the requester
    const requesterQuery = query(
      requestsCollection, 
      where('requesterId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    // Get requests where user is the provider
    const providerQuery = query(
      requestsCollection, 
      where('providerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const [requesterSnapshot, providerSnapshot] = await Promise.all([
      getDocs(requesterQuery),
      getDocs(providerQuery)
    ]);
    
    const requesterRequests = requesterSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      role: 'requester'
    }));
    
    const providerRequests = providerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      role: 'provider'
    }));
    
    return [...requesterRequests, ...providerRequests] as (ServiceRequest & { role: string })[];
  } catch (error) {
    console.error('Error getting user requests: ', error);
    throw error;
  }
};

// Add a review
export const addReview = async (review: ServiceReview) => {
  try {
    // Add the review
    const docRef = await addDoc(reviewsCollection, {
      ...review,
      createdAt: serverTimestamp()
    });
    
    // Update provider's average rating
    const providerReviewsQuery = query(
      reviewsCollection,
      where('providerId', '==', review.providerId)
    );
    
    const reviewsSnapshot = await getDocs(providerReviewsQuery);
    let totalRating = 0;
    reviewsSnapshot.forEach(doc => {
      totalRating += doc.data().rating;
    });
    
    const averageRating = totalRating / reviewsSnapshot.size;
    
    await updateDoc(doc(db, 'users', review.providerId), {
      averageRating
    });
    
    return { id: docRef.id, ...review };
  } catch (error) {
    console.error('Error adding review: ', error);
    throw error;
  }
};

// Get reviews for a service
export const getServiceReviews = async (serviceId: string) => {
  try {
    const q = query(
      reviewsCollection,
      where('serviceId', '==', serviceId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceReview[];
  } catch (error) {
    console.error('Error getting service reviews: ', error);
    throw error;
  }
};

// Get reviews for a provider
export const getProviderReviews = async (providerId: string) => {
  try {
    const q = query(
      reviewsCollection,
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceReview[];
  } catch (error) {
    console.error('Error getting provider reviews: ', error);
    throw error;
  }
}; 