'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { getAvailableServices, ServiceItem, ServiceCategory } from '@/firebase/services';
import { FiClock, FiMapPin, FiFilter, FiSearch, FiX, FiUser, FiStar, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

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

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') as ServiceCategory | null;
  
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(initialCategory);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchServices = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(null);
    
    try {
      console.log("Fetching services for category:", selectedCategory || "all");
      const data = await getAvailableServices(selectedCategory || undefined);
      
      // Check if we received data
      if (data.length === 0 && !isRefresh) {
        console.log("No services found, might be using fallback for timeout");
      } else {
        console.log(`Retrieved ${data.length} services`);
      }
      
      setServices(data);
      
      // Apply any existing search filter to the new data
      if (searchTerm.trim() === '') {
        setFilteredServices(data);
      } else {
        const filtered = data.filter(
          (service) =>
            service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredServices(filtered);
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      
      // Custom handling for timeout errors
      if (error.message?.includes('timeout') || error.message?.includes('too long')) {
        setLoadError('The services are taking longer than expected to load. Please try again or check your connection.');
      } else if (error.message?.includes('network') || !navigator.onLine) {
        setLoadError('You appear to be offline. Please check your connection and try again.');
      } else {
        setLoadError(error.message || 'Failed to load services. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(
        (service) =>
          service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [searchTerm, services]);

  const handleCategoryChange = (category: ServiceCategory | null) => {
    setSelectedCategory(category);
    // fetchServices will be triggered by the useEffect dependency on selectedCategory
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    // fetchServices will be triggered by the useEffect dependency on selectedCategory
  };

  const handleRefresh = () => {
    fetchServices(true);
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Find Services</h1>
            <p className="mt-1 text-gray-600">
              Browse available services offered by community members
            </p>
          </div>
          
          {/* Refresh Button */}
          <button 
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-colors"
            aria-label="Refresh services"
            title="Refresh services"
          >
            <FiRefreshCw className={`h-5 w-5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {loadError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex items-center">
            <FiAlertCircle className="text-red-500 mr-2" />
            <p className="text-sm text-red-700">{loadError}</p>
            <button 
              onClick={handleRefresh}
              className="ml-auto flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium rounded"
            >
              <FiRefreshCw className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Try Again'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            If this issue persists, you can try clearing your browser cache or using a different network connection.
          </p>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pl-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search by title or description"
              disabled={isLoading}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 transition-colors"
                disabled={isLoading}
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Button (Mobile) */}
          <div className="md:hidden">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 w-full"
              disabled={isLoading}
            >
              <FiFilter className="mr-2 h-5 w-5 text-gray-500" />
              Filters
              {selectedCategory && <span className="ml-1 text-indigo-600">(1)</span>}
            </button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:flex md:items-center space-x-4">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              <FiFilter className="mr-2 h-5 w-5 text-gray-500" />
              Category
              {selectedCategory && (
                <span className="ml-1 text-indigo-600">
                  : {categoryOptions.find(c => c.value === selectedCategory)?.label}
                </span>
              )}
            </button>

            {(searchTerm || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdown */}
        {isFilterOpen && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 animate-fadeIn">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {categoryOptions.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryChange(
                    selectedCategory === category.value ? null : category.value as ServiceCategory
                  )}
                  className={`flex items-center px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    selectedCategory === category.value
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={isLoading}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Close
              </button>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                  disabled={isLoading}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Services List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-200"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="badge badge-primary mb-2">{categoryOptions.find(c => c.value === service.category)?.label || 'Other'}</span>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{service.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                  </div>
                  <div className="text-2xl ml-3">
                    {categoryOptions.find(c => c.value === service.category)?.icon || '📦'}
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <FiClock className="mr-1.5 h-4 w-4 text-indigo-500" />
                  <span>{service.hoursRequired} hour{service.hoursRequired !== 1 ? 's' : ''}</span>
                </div>
                
                {service.location && (
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <FiMapPin className="mr-1.5 h-4 w-4 text-indigo-500" />
                    <span>{service.location}</span>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <FiUser className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">{service.providerName}</span>
                  </div>
                  
                  {service.providerRating && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-amber-600">{service.providerRating.toFixed(1)}</span>
                      <FiStar className="ml-1 h-4 w-4 text-amber-500" />
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card p-8 text-center">
          <div className="bg-gray-50 inline-flex p-4 rounded-full mb-4">
            <FiSearch className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory
              ? 'Try adjusting your filters or search term'
              : 'There are no available services at the moment'}
          </p>
          {(searchTerm || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="btn btn-primary"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </MainLayout>
  );
} 