'use client';

import React from 'react';
import Link from 'next/link';
import { FiClock, FiHeart, FiGithub, FiMail } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-700 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and tagline */}
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <FiClock className="h-7 w-7 mr-2 text-indigo-600" />
              <span className="text-xl font-bold text-indigo-600">TimeBank</span>
            </div>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Exchange your time and skills with others in your community. A platform for people to help each other and build meaningful connections.
            </p>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} TimeBank. All rights reserved.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                  Browse Services
                </Link>
              </li>
              <li>
                <Link href="/services/new" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                  Offer a Service
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center">
                <FiMail className="h-5 w-5 mr-2 text-indigo-500" />
                <a href="mailto:support@timebank.com" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                  support@timebank.com
                </a>
              </li>
              <li className="flex items-center">
                <FiGithub className="h-5 w-5 mr-2 text-indigo-500" />
                <a 
                  href="https://github.com/timebank-app" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-600 hover:text-indigo-600 transition-colors duration-200"
                >
                  TimeBank on GitHub
                </a>
              </li>
              <li className="mt-6 pt-6 border-t border-gray-200">
                <p className="flex items-center text-gray-600 text-sm">
                  <FiHeart className="h-5 w-5 mr-2 text-pink-500" />
                  Made with love for the community
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
} 