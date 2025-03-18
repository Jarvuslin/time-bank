'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/firebase/AuthContext';
import { FiMenu, FiX, FiUser, FiClock, FiHome, FiSearch, FiPlus, FiLogIn, FiLogOut } from 'react-icons/fi';

export default function Navbar() {
  const { user, userData, signout } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white text-gray-800 shadow-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group py-4">
              <FiClock className="h-7 w-7 mr-2 text-indigo-600 group-hover:text-indigo-800 transition-colors duration-200" />
              <span className="font-bold text-xl text-indigo-600 group-hover:text-indigo-800 transition-colors duration-200">TimeBank</span>
            </Link>
          </div>

          {/* Desktop navigation links */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            <Link href="/" className="px-4 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center">
              <FiHome className="mr-1.5" />
              <span>Home</span>
            </Link>
            <Link href="/services" className="px-4 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center">
              <FiSearch className="mr-1.5" />
              <span>Find Services</span>
            </Link>
            {user ? (
              <>
                <Link href="/services/new" className="px-4 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center">
                  <FiPlus className="mr-1.5" />
                  <span>Offer Service</span>
                </Link>
                <Link href="/dashboard" className="px-4 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center">
                  <FiUser className="mr-1.5" />
                  <span>Dashboard</span>
                </Link>
                <div className="flex items-center ml-4 border-l pl-4 border-gray-200">
                  <span className="text-xs mr-1 text-gray-500">Credits:</span>
                  <span className="font-bold text-indigo-600">{userData?.timeCredits || 0}</span>
                </div>
                <button
                  onClick={() => signout()}
                  className="ml-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center shadow-sm"
                >
                  <FiLogOut className="mr-1.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="ml-4 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center shadow-sm"
              >
                <FiLogIn className="mr-1.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 focus:outline-none"
            >
              {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-fadeIn">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center"
              onClick={toggleMenu}
            >
              <FiHome className="mr-2" />
              <span>Home</span>
            </Link>
            <Link
              href="/services"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center"
              onClick={toggleMenu}
            >
              <FiSearch className="mr-2" />
              <span>Find Services</span>
            </Link>
            {user ? (
              <>
                <Link
                  href="/services/new"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center"
                  onClick={toggleMenu}
                >
                  <FiPlus className="mr-2" />
                  <span>Offer Service</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center"
                  onClick={toggleMenu}
                >
                  <FiUser className="mr-2" />
                  <span>Dashboard</span>
                </Link>
                <div className="flex items-center px-3 py-2">
                  <span className="text-xs mr-1 text-gray-500">Credits:</span>
                  <span className="font-bold text-indigo-600">{userData?.timeCredits || 0}</span>
                </div>
                <button
                  onClick={() => {
                    signout();
                    toggleMenu();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center mt-2"
                >
                  <FiLogOut className="mr-2" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="block px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center mt-2"
                onClick={toggleMenu}
              >
                <FiLogIn className="mr-2" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 