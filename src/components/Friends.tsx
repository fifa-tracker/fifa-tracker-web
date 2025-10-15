'use client';

import { UserIcon } from '@/components/Icons';
import { useAuth } from '@/contexts/auth';
import {
  getCurrentUserStats,
  getFriends,
  searchUsers,
  sendFriendRequest,
} from '@/lib/api';
import { Friend, UserDetailedStats, UserSearchResult } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Friends() {
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [userStats, setUserStats] = useState<UserDetailedStats | null>(null);
  const [isLoadingUserStats, setIsLoadingUserStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user stats on component mount
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingUserStats(true);
        const stats = await getCurrentUserStats(user.id);
        setUserStats(stats);
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setIsLoadingUserStats(false);
      }
    };

    loadUserStats();
  }, [user?.id]);

  // Load friends on component mount
  useEffect(() => {
    const loadFriends = async () => {
      try {
        setIsLoadingFriends(true);
        const friendsList = await getFriends();
        setFriends(friendsList);
      } catch (error) {
        console.error('Error loading friends:', error);
        setError('Failed to load friends. Please try again.');
      } finally {
        setIsLoadingFriends(false);
      }
    };

    loadFriends();
  }, []);

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchUsers(searchQuery, 20);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        setError('Failed to search users. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      // Update the search results to reflect the change
      setSearchResults(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, friend_request_sent: true } : user
        )
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError('Failed to send friend request. Please try again.');
    }
  };

  const getDisplayName = (user: Friend | UserSearchResult) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.first_name || user.username;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Friends
        </h2>
        <p className="text-muted-foreground text-sm md:text-lg">
          Manage your friends and discover new players
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
        <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-3 md:mb-4">
          Find Friends
        </h3>
        <div className="relative mb-3 md:mb-4">
          <input
            type="text"
            placeholder="Search by username, first name, or last name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-input border border-border rounded-lg md:rounded-xl text-sm md:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchQuery.trim() && (
          <div>
            {isSearching ? (
              <div className="text-center py-6 md:py-8">
                <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary mx-auto mb-2 md:mb-3"></div>
                <p className="text-muted-foreground text-sm md:text-base">
                  Searching...
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">
                  Search Results ({searchResults.length})
                </h4>
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    className="relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-600/20 border border-blue-500/30 backdrop-blur-sm p-3 md:p-4"
                  >
                    {/* Decorative gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 pointer-events-none" />

                    <div className="relative flex items-center justify-between gap-2 md:gap-4">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 md:h-12 md:w-12 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium text-sm truncate">
                            {getDisplayName(user)}
                          </p>
                          <p className="text-blue-300/80 text-xs truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        {user.is_friend ? (
                          <div className="flex flex-col sm:flex-row gap-1 md:gap-2">
                            <button
                              onClick={() =>
                                router.push(`/head-to-head/${user.id}`)
                              }
                              className="px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs rounded-md md:rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 whitespace-nowrap"
                            >
                              H2H
                            </button>
                            <span className="px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full shadow-lg whitespace-nowrap">
                              Friend
                            </span>
                          </div>
                        ) : user.friend_request_sent ? (
                          <span className="px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full shadow-lg whitespace-nowrap">
                            Sent
                          </span>
                        ) : user.friend_request_received ? (
                          <span className="px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs rounded-full shadow-lg whitespace-nowrap">
                            Received
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(user.id)}
                            className="px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs rounded-md md:rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 whitespace-nowrap"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8">
                <p className="text-muted-foreground text-sm md:text-base">
                  No users found matching your search.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Your Profile */}
      <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
        <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-3 md:mb-4">
          Your Profile
        </h3>

        {isLoadingUserStats ? (
          <div className="text-center py-6 md:py-8">
            <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary mx-auto mb-2 md:mb-3"></div>
            <p className="text-muted-foreground text-sm md:text-base">
              Loading your stats...
            </p>
          </div>
        ) : userStats ? (
          <div className="relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-600/20 border border-blue-500/30 backdrop-blur-sm p-4 md:p-6">
            {/* Decorative gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 pointer-events-none" />

            {/* User Header */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-6 mb-4 md:mb-6">
              <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 md:h-16 md:w-16 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-2xl font-bold text-white mb-1 truncate">
                    {user?.first_name || user?.username}
                  </h1>
                  <p className="text-blue-300/80 text-xs md:text-sm font-medium truncate">
                    @{user?.username}
                  </p>
                </div>
              </div>

              {/* ELO Rating Badge */}
              {userStats.elo_rating && (
                <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg md:rounded-xl blur opacity-50" />
                    <div className="relative bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2 shadow-lg">
                      <p className="text-xs md:text-sm font-semibold text-slate-900">
                        ELO Rating
                      </p>
                      <p className="text-lg md:text-2xl font-bold text-slate-900">
                        {userStats.elo_rating}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
              <div className="group relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-cyan-500/50 p-2 md:p-4 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-300" />
                <div className="relative">
                  <p className="text-slate-400 text-xs md:text-sm font-medium mb-1 md:mb-2">
                    Matches
                  </p>
                  <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {userStats.total_matches}
                  </p>
                </div>
              </div>
              <div className="group relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-cyan-500/50 p-2 md:p-4 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-300" />
                <div className="relative">
                  <p className="text-slate-400 text-xs md:text-sm font-medium mb-1 md:mb-2">
                    Wins
                  </p>
                  <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {userStats.wins}
                  </p>
                </div>
              </div>
              <div className="group relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-cyan-500/50 p-2 md:p-4 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-300" />
                <div className="relative">
                  <p className="text-slate-400 text-xs md:text-sm font-medium mb-1 md:mb-2">
                    Win Rate
                  </p>
                  <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {(userStats.win_rate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <button
                onClick={() => router.push('/profile')}
                className="relative h-10 md:h-12 rounded-lg md:rounded-xl font-semibold text-sm md:text-base overflow-hidden group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
              >
                <span className="relative z-10">View Profile</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 md:py-8">
            <p className="text-muted-foreground text-sm md:text-base">
              Unable to load your stats
            </p>
          </div>
        )}
      </div>

      {/* Friends List */}
      <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
        <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-3 md:mb-4">
          Your Friends ({friends.length})
        </h3>

        {isLoadingFriends ? (
          <div className="text-center py-6 md:py-8">
            <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-primary mx-auto mb-2 md:mb-3"></div>
            <p className="text-muted-foreground text-sm md:text-base">
              Loading friends...
            </p>
          </div>
        ) : friends.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {friends.map(friend => (
              <div
                key={friend.id}
                className="relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-blue-600/20 border border-blue-500/30 backdrop-blur-sm p-4 md:p-6"
              >
                {/* Decorative gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 pointer-events-none" />

                {/* Friend Header */}
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-6 mb-4 md:mb-6">
                  <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 md:h-16 md:w-16 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg md:text-2xl font-bold text-white mb-1 truncate">
                        {getDisplayName(friend)}
                      </h1>
                      <p className="text-blue-300/80 text-xs md:text-sm font-medium truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </div>

                  {/* ELO Rating Badge */}
                  {friend.elo_rating && (
                    <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg md:rounded-xl blur opacity-50" />
                        <div className="relative bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2 shadow-lg">
                          <p className="text-xs md:text-sm font-semibold text-slate-900">
                            ELO Rating
                          </p>
                          <p className="text-lg md:text-2xl font-bold text-slate-900">
                            {friend.elo_rating}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                {friend.total_matches !== undefined && (
                  <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                    <div className="group relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-cyan-500/50 p-2 md:p-4 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-300" />
                      <div className="relative">
                        <p className="text-slate-400 text-xs md:text-sm font-medium mb-1 md:mb-2">
                          Matches
                        </p>
                        <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                          {friend.total_matches}
                        </p>
                      </div>
                    </div>
                    <div className="group relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-cyan-500/50 p-2 md:p-4 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-300" />
                      <div className="relative">
                        <p className="text-slate-400 text-xs md:text-sm font-medium mb-1 md:mb-2">
                          Wins
                        </p>
                        <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          {friend.wins || 0}
                        </p>
                      </div>
                    </div>
                    <div className="group relative rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-cyan-500/50 p-2 md:p-4 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-300" />
                      <div className="relative">
                        <p className="text-slate-400 text-xs md:text-sm font-medium mb-1 md:mb-2">
                          Win Rate
                        </p>
                        <p className="text-xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                          {friend.total_matches > 0
                            ? (
                                ((friend.wins || 0) / friend.total_matches) *
                                100
                              ).toFixed(1)
                            : '0.0'}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <button
                    onClick={() => router.push(`/head-to-head/${friend.id}`)}
                    className="relative h-10 md:h-12 rounded-lg md:rounded-xl font-semibold text-sm md:text-base overflow-hidden group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
                  >
                    <span className="relative z-10">Head-to-Head</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${friend.id}`)}
                    className="relative h-10 md:h-12 rounded-lg md:rounded-xl font-semibold text-sm md:text-base border-slate-600 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 hover:bg-slate-800/50 transition-all duration-300 border"
                  >
                    <span className="relative z-10">View Profile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 md:py-8">
            <UserIcon className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-2 md:mb-3" />
            <p className="text-muted-foreground mb-1 md:mb-2 text-sm md:text-base">
              No friends yet
            </p>
            <p className="text-muted-foreground/70 text-xs md:text-sm">
              Use the search above to find and add friends!
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300 text-xs mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
