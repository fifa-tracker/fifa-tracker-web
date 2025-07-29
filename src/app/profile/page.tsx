'use client';

import { ArrowLeftIcon, TrophyIcon, UserIcon } from '@/components/Icons';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCurrentUserStats, UserDetailedStats } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserDetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchUserStats = async () => {
      // Don't fetch stats if auth is still loading or user is not available
      if (authLoading || !user?.id) {
        return;
      }

      try {
        setLoading(true);
        const stats = await getCurrentUserStats(user.id);
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user, authLoading]);

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
                  <span className="hidden sm:block text-sm text-gray-300">
                    {user?.first_name || user?.username}
                  </span>
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
                <h2 className="text-2xl font-bold">
                  {user?.first_name || user?.username}
                </h2>
                <p className="text-gray-400">{user?.email}</p>
                {user?.username && (
                  <p className="text-gray-500 text-sm">@{user.username}</p>
                )}
              </div>
            </div>

            {/* Profile Sections */}
            <div className="space-y-6">
              {/* Account Information */}
              <div className="border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Name
                    </label>
                    <p className="text-white">
                      {user?.first_name || user?.username}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Username
                    </label>
                    <p className="text-white">@{user?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Email
                    </label>
                    <p className="text-white">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold mb-4">Your Statistics</h3>
                {authLoading || loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">
                      {authLoading
                        ? 'Loading user data...'
                        : 'Loading statistics...'}
                    </p>
                  </div>
                ) : userStats ? (
                  <div className="space-y-6">
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {userStats.total_matches || 0}
                        </div>
                        <div className="text-sm text-gray-400">
                          Matches Played
                        </div>
                      </div>
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {userStats.wins || 0}
                        </div>
                        <div className="text-sm text-gray-400">Wins</div>
                      </div>
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {userStats.win_rate !== null &&
                          userStats.win_rate !== undefined
                            ? (userStats.win_rate * 100).toFixed(1)
                            : userStats.total_matches > 0
                              ? (
                                  ((userStats.wins || 0) /
                                    (userStats.total_matches || 1)) *
                                  100
                                ).toFixed(1)
                              : '0.0'}
                          %
                        </div>
                        <div className="text-sm text-gray-400">Win Rate</div>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-red-400">
                          {userStats.losses || 0}
                        </div>
                        <div className="text-sm text-gray-400">Losses</div>
                      </div>
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-gray-400">
                          {userStats.draws || 0}
                        </div>
                        <div className="text-sm text-gray-400">Draws</div>
                      </div>
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-purple-400">
                          {userStats.points || 0}
                        </div>
                        <div className="text-sm text-gray-400">Points</div>
                      </div>
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-orange-400">
                          {userStats.elo_rating || 1200}
                        </div>
                        <div className="text-sm text-gray-400">Elo Rating</div>
                      </div>
                    </div>

                    {/* Goals Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-green-400">
                          {userStats.total_goals_scored || 0}
                        </div>
                        <div className="text-sm text-gray-400">
                          Goals Scored
                        </div>
                      </div>
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-red-400">
                          {userStats.total_goals_conceded || 0}
                        </div>
                        <div className="text-sm text-gray-400">
                          Goals Conceded
                        </div>
                      </div>
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-blue-400">
                          {(userStats.total_goals_scored || 0) -
                            (userStats.total_goals_conceded || 0)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Goal Difference
                        </div>
                      </div>
                    </div>

                    {/* Averages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-green-400">
                          {(userStats.average_goals_scored || 0).toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Avg Goals Scored
                        </div>
                      </div>
                      <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-red-400">
                          {(userStats.average_goals_conceded || 0).toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Avg Goals Conceded
                        </div>
                      </div>
                    </div>

                    {/* Tournament Stats */}
                    <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                      <div className="text-xl font-bold text-yellow-400">
                        {userStats.tournaments_played || 0}
                      </div>
                      <div className="text-sm text-gray-400">
                        Tournaments Played
                      </div>
                    </div>

                    {/* Head-to-Head Records */}
                    {((userStats.highest_wins_against &&
                      Object.keys(userStats.highest_wins_against).length > 0) ||
                      (userStats.highest_losses_against &&
                        Object.keys(userStats.highest_losses_against).length >
                          0)) && (
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">
                          Head-to-Head Records
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userStats.highest_wins_against &&
                            Object.keys(userStats.highest_wins_against).length >
                              0 && (
                              <div className="bg-[#2d3748] rounded-lg p-4">
                                <div className="text-sm font-medium text-green-400 mb-2">
                                  Most Wins Against
                                </div>
                                {Object.entries(
                                  userStats.highest_wins_against
                                ).map(([player, wins]) => (
                                  <div
                                    key={player}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-gray-300">
                                      {player}
                                    </span>
                                    <span className="text-green-400 font-medium">
                                      {wins || 0} wins
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          {userStats.highest_losses_against &&
                            Object.keys(userStats.highest_losses_against)
                              .length > 0 && (
                              <div className="bg-[#2d3748] rounded-lg p-4">
                                <div className="text-sm font-medium text-red-400 mb-2">
                                  Most Losses Against
                                </div>
                                {Object.entries(
                                  userStats.highest_losses_against
                                ).map(([player, losses]) => (
                                  <div
                                    key={player}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-gray-300">
                                      {player}
                                    </span>
                                    <span className="text-red-400 font-medium">
                                      {losses || 0} losses
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Failed to load statistics</p>
                  </div>
                )}
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
