'use client';

import { User, UserDetailedStats } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ProfileTabProps {
  user: User | null;
  userStats: UserDetailedStats | null;
  authLoading: boolean;
  loading: boolean;
}

export default function ProfileTab({
  user,
  userStats,
  authLoading,
  loading,
}: ProfileTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className="border-b border-gray-700 pb-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Name
            </label>
            <p className="text-white">{user?.first_name || user?.username}</p>
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
              {authLoading ? 'Loading user data...' : 'Loading statistics...'}
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
                <div className="text-sm text-gray-400">Matches Played</div>
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
                <div className="text-sm text-gray-400">Goals Scored</div>
              </div>
              <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-red-400">
                  {userStats.total_goals_conceded || 0}
                </div>
                <div className="text-sm text-gray-400">Goals Conceded</div>
              </div>
              <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-blue-400">
                  {(userStats.total_goals_scored || 0) -
                    (userStats.total_goals_conceded || 0)}
                </div>
                <div className="text-sm text-gray-400">Goal Difference</div>
              </div>
            </div>

            {/* Averages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-green-400">
                  {(userStats.average_goals_scored || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">Avg Goals Scored</div>
              </div>
              <div className="bg-[#2d3748] rounded-lg p-4 text-center">
                <div className="text-xl font-bold text-red-400">
                  {(userStats.average_goals_conceded || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">Avg Goals Conceded</div>
              </div>
            </div>

            {/* Tournament Stats */}
            <div className="bg-[#2d3748] rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-yellow-400">
                {userStats.tournaments_played || 0}
              </div>
              <div className="text-sm text-gray-400">Tournaments Played</div>
            </div>

            {/* Head-to-Head Records */}
            {((userStats.highest_wins_against &&
              userStats.highest_wins_against !== null &&
              Object.keys(userStats.highest_wins_against).length > 0) ||
              (userStats.highest_losses_against &&
                userStats.highest_losses_against !== null &&
                Object.keys(userStats.highest_losses_against).length > 0)) && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Head-to-Head Records</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userStats.highest_wins_against &&
                    userStats.highest_wins_against !== null &&
                    Object.keys(userStats.highest_wins_against).length > 0 && (
                      <div className="bg-[#2d3748] rounded-lg p-4">
                        <div className="text-sm font-medium text-green-400 mb-2">
                          Most Wins Against
                        </div>
                        {Object.entries(userStats.highest_wins_against).map(
                          ([player, wins]) => (
                            <div
                              key={player}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-300">{player}</span>
                              <span className="text-green-400 font-medium">
                                {wins || 0} wins
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  {userStats.highest_losses_against &&
                    userStats.highest_losses_against !== null &&
                    Object.keys(userStats.highest_losses_against).length >
                      0 && (
                      <div className="bg-[#2d3748] rounded-lg p-4">
                        <div className="text-sm font-medium text-red-400 mb-2">
                          Most Losses Against
                        </div>
                        {Object.entries(userStats.highest_losses_against).map(
                          ([player, losses]) => (
                            <div
                              key={player}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-300">{player}</span>
                              <span className="text-red-400 font-medium">
                                {losses || 0} losses
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Last 5 Teams */}
            {userStats.last_5_teams && userStats.last_5_teams.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Recent Teams</h4>
                <div className="bg-[#2d3748] rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {userStats.last_5_teams.map((team, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                      >
                        {team}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Last 5 Matches */}
            {userStats.last_5_matches &&
              userStats.last_5_matches.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">Recent Matches</h4>
                  <div className="space-y-3">
                    {userStats.last_5_matches.map((match, index) => {
                      const matchDate = new Date(match.date);
                      const formattedDate = matchDate.toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      );
                      const formattedTime = matchDate.toLocaleTimeString(
                        'en-US',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      );

                      // Determine match result for styling
                      const isWin = match.player1_goals > match.player2_goals;
                      const isDraw =
                        match.player1_goals === match.player2_goals;

                      return (
                        <div
                          key={index}
                          className={`bg-[#2d3748] rounded-lg p-4 border-l-4 ${
                            isWin
                              ? 'border-green-500'
                              : isDraw
                                ? 'border-yellow-500'
                                : 'border-red-500'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-300">
                                  {match.tournament_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formattedDate} at {formattedTime}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-300">
                                    You ({match.team1})
                                  </span>
                                  <span className="text-lg font-bold text-white">
                                    {match.player1_goals} -{' '}
                                    {match.player2_goals}
                                  </span>
                                  <span className="text-sm text-gray-300">
                                    {match.opponent_username} ({match.team2})
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <span
                                    className={`px-2 py-1 rounded-full ${
                                      isWin
                                        ? 'bg-green-500/20 text-green-300'
                                        : isDraw
                                          ? 'bg-yellow-500/20 text-yellow-300'
                                          : 'bg-red-500/20 text-red-300'
                                    }`}
                                  >
                                    {isWin ? 'W' : isDraw ? 'D' : 'L'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
  );
}
