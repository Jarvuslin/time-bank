'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { FiClock, FiUsers, FiThumbsUp, FiStar, FiArrowRight } from 'react-icons/fi';
import { auth } from '@/firebase/config'; // Import for debugging

// Sample category data
const categories = [
  { name: 'Education', icon: '🎓', description: 'Tutoring, language learning, and more' },
  { name: 'Technology', icon: '💻', description: 'Tech support, programming, website help' },
  { name: 'Handyman', icon: '🔧', description: 'Repairs, installations, maintenance' },
  { name: 'Creative', icon: '🎨', description: 'Design, music, writing, photography' },
  { name: 'Health', icon: '🌱', description: 'Fitness, nutrition, wellness advice' },
  { name: 'Transportation', icon: '🚗', description: 'Rides, deliveries, errands' },
];

// Sample testimonials
const testimonials = [
  {
    quote: "TimeBank has helped me connect with amazing people in my community. I taught photography and got help with my garden!",
    author: "Sarah M.",
    role: "Photographer",
    rating: 5
  },
  {
    quote: "As a retiree, I have time to share my accounting skills, and in return I've received computer lessons. It's a win-win!",
    author: "Robert T.",
    role: "Retired Accountant",
    rating: 5
  },
  {
    quote: "I helped my neighbor with their website and they cooked me amazing meals for a week. What a great exchange!",
    author: "Michael K.",
    role: "Web Developer",
    rating: 4
  }
];

// Steps for how it works
const steps = [
  {
    title: "Create your profile",
    description: "Sign up and tell the community about your skills and interests.",
    icon: <FiUsers className="w-10 h-10 text-indigo-500" />
  },
  {
    title: "Offer your services",
    description: "Post services you can provide to others in your community.",
    icon: <FiThumbsUp className="w-10 h-10 text-indigo-500" />
  },
  {
    title: "Earn time credits",
    description: "Get credits for every hour you help someone else.",
    icon: <FiClock className="w-10 h-10 text-indigo-500" />
  },
  {
    title: "Spend your credits",
    description: "Use your earned credits to receive help from others.",
    icon: <FiStar className="w-10 h-10 text-indigo-500" />
  }
];

export default function Home() {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [errorInfo, setErrorInfo] = useState('');

  useEffect(() => {
    // Debug to check if Firebase is properly initialized
    try {
      if (auth) {
        setIsFirebaseReady(true);
        console.log("Firebase auth initialized correctly");
      } else {
        setErrorInfo("Firebase auth not initialized");
      }
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? String(err.message) 
        : "Error initializing Firebase";
      setErrorInfo(errorMessage);
      console.error("Firebase init error:", err);
    }
  }, []);

  return (
    <MainLayout>
      {/* Developer Debug Info - Remove in production */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-gray-100 border border-gray-300 p-4 mb-6 rounded-lg">
          <h3 className="font-bold text-gray-700 mb-2">Debug Info:</h3>
          <p>Firebase Auth Status: {isFirebaseReady ? '✅ Ready' : '❌ Not Ready'}</p>
          {errorInfo && <p className="text-red-500">Error: {errorInfo}</p>}
          <p className="text-sm text-gray-500 mt-2">Remove this debug section before deploying to production</p>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4 rounded-3xl shadow-2xl transform transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.4)] hover:-translate-y-1">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Share Your Time, <br />Grow Your Community
            </h1>
            <p className="text-xl mb-8">
              TimeBank connects people who want to share their skills and time with others in their community.
              Give an hour, get an hour back!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/auth/signup" 
                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-gray-50 transition-all duration-300 ease-in-out text-center"
              >
                Get Started
              </Link>
              <Link 
                href="/services" 
                className="bg-transparent border-2 border-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-white hover:text-indigo-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out text-center"
              >
                Browse Services
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md h-80 md:h-96 transform transition-all duration-500 hover:scale-105">
              <Image 
                src="/hero-image.svg" 
                alt="People sharing time and skills" 
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out text-center">
                <div className="flex justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Service Categories</h2>
          <p className="text-xl text-gray-600 text-center mb-16">Discover the many ways to exchange skills and time</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Link
                href={`/services?category=${category.name.toLowerCase()}`}
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-200 transition-all duration-300 ease-in-out"
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <span className="text-indigo-600 font-medium flex items-center">
                  Explore <FiArrowRight className="ml-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-indigo-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out">
                <div className="flex mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <FiStar 
                      key={i} 
                      className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl shadow-2xl transform transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.4)] hover:-translate-y-1">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join Our Community?</h2>
          <p className="text-xl mb-8">
            Start exchanging skills and building connections today. It takes just a minute to sign up!
          </p>
          <Link 
            href="/auth/signup" 
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-gray-50 transition-all duration-300 ease-in-out inline-block"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
