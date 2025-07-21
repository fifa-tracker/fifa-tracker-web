'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrophyIcon, UserIcon, ArrowLeftIcon } from '@/components/Icons';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-menu')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0f1419] text-white">
        {/* Header */}
        <header className="py-4 sm:py-6 px-4 border-b border-gray-700">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Logo and Title - Left Side */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
                <TrophyIcon className="text-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
                <h1 className="text-xl sm:text-2xl font-bold">FIFA Tracker</h1>
              </button>
            </div>

            {/* Profile and Menu - Right Side */}
            <div className="flex items-center gap-3">
              <div className="relative profile-menu">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1f2e] transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm text-gray-300">{user?.name}</span>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1f2e] rounded-lg shadow-lg border border-gray-700 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          signOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2d3748] hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-[#1a1f2e] rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>

            {/* Profile Sections */}
            <div className="space-y-6">
              {/* Account Information */}
              <div className="border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <p className="text-white">{user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <p className="text-white">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold mb-4">Your Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">0</div>
                    <div className="text-sm text-gray-400">Matches Played</div>
                  </div>
                  <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">0</div>
                    <div className="text-sm text-gray-400">Wins</div>
                  </div>
                  <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">0%</div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/profile/edit')}
                    className="w-full md:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => router.push('/profile/delete')}
                    className="w-full md:w-auto px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors ml-0 md:ml-3"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 