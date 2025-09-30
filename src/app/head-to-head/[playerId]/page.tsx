'use client';

import { ArrowLeftIcon, TrophyIcon } from '@/components/Icons';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getHeadToHead } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HeadToHeadStats {
  player1_id: string;
  player2_id: string;
  player1_name: string;
  player2_name: string;
  total_matches: number;
  player1_wins: number;
  player2_wins: number;
  draws: number;
  player1_goals: number;
  player2_goals: number;
  player1_win_rate: number;
  player2_win_rate: number;
  player1_avg_goals: number;
  player2_avg_goals: number;
}

export default function HeadToHeadPage({
  params,
}: {
  params: { playerId: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeadToHead = async () => {
      if (!user?.id || !params.playerId) {
        return;
      }

      try {
        setLoading(true);
        const data = await getHeadToHead(user.id, params.playerId);
        setStats(data);
      } catch (error) {
        console.error('Error fetching head-to-head stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeadToHead();
  }, [user?.id, params.playerId]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0f1419] text-white">
        {/* Header */}
        <header className="py-4 sm:py-6 px-4 border-b border-gray-700">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
                <TrophyIcon className="text-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
                <h1 className="text-xl sm:text-2xl font-bold">
                  Head-to-Head Stats
                </h1>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading stats...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Players Header */}
              <div className="bg-[#1a1f2e] rounded-lg p-6">
                <div className="grid grid-cols-3 items-center gap-4">
                  {/* Player 1 */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-xl">
                        {stats.player1_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {stats.player1_name}
                    </h2>
                  </div>

                  {/* VS */}
                  <div className="text-center">
                    <span className="text-3xl font-bold text-gray-400">VS</span>
                  </div>

                  {/* Player 2 */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-xl">
                        {stats.player2_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {stats.player2_name}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Total Matches */}
              <div className="bg-[#1a1f2e] rounded-lg p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">Total Matches</p>
                <p className="text-4xl font-bold text-yellow-400">
                  {stats.total_matches}
                </p>
              </div>

              {/* Win Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Player 1 Wins */}
                <div className="bg-[#1a1f2e] rounded-lg p-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">
                    {stats.player1_name.split(' ')[0]} Wins
                  </p>
                  <p className="text-3xl font-bold text-green-400 mb-2">
                    {stats.player1_wins}
                  </p>
                  <p className="text-lg text-gray-300">
                    {stats.player1_win_rate.toFixed(1)}%
                  </p>
                </div>

                {/* Draws */}
                <div className="bg-[#1a1f2e] rounded-lg p-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">Draws</p>
                  <p className="text-3xl font-bold text-gray-400">
                    {stats.draws}
                  </p>
                </div>

                {/* Player 2 Wins */}
                <div className="bg-[#1a1f2e] rounded-lg p-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">
                    {stats.player2_name.split(' ')[0]} Wins
                  </p>
                  <p className="text-3xl font-bold text-green-400 mb-2">
                    {stats.player2_wins}
                  </p>
                  <p className="text-lg text-gray-300">
                    {stats.player2_win_rate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Goal Statistics */}
              <div className="bg-[#1a1f2e] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-center">
                  Goal Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Player 1 Goals */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2 text-center">
                      {stats.player1_name}
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Goals</span>
                        <span className="text-xl font-bold text-blue-400">
                          {stats.player1_goals}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Avg per Match</span>
                        <span className="text-xl font-bold text-blue-400">
                          {stats.player1_avg_goals.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Player 2 Goals */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2 text-center">
                      {stats.player2_name}
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Goals</span>
                        <span className="text-xl font-bold text-purple-400">
                          {stats.player2_goals}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Avg per Match</span>
                        <span className="text-xl font-bold text-purple-400">
                          {stats.player2_avg_goals.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Win Comparison */}
              {stats.total_matches > 0 && (
                <div className="bg-[#1a1f2e] rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-center">
                    Win Distribution
                  </h3>
                  <div className="flex items-center gap-2 h-8 rounded-lg overflow-hidden">
                    <div
                      className="bg-green-500 h-full flex items-center justify-center text-white text-sm font-bold"
                      style={{
                        width: `${(stats.player1_wins / stats.total_matches) * 100}%`,
                      }}
                    >
                      {stats.player1_wins > 0 && stats.player1_wins}
                    </div>
                    <div
                      className="bg-gray-500 h-full flex items-center justify-center text-white text-sm font-bold"
                      style={{
                        width: `${(stats.draws / stats.total_matches) * 100}%`,
                      }}
                    >
                      {stats.draws > 0 && stats.draws}
                    </div>
                    <div
                      className="bg-purple-500 h-full flex items-center justify-center text-white text-sm font-bold"
                      style={{
                        width: `${(stats.player2_wins / stats.total_matches) * 100}%`,
                      }}
                    >
                      {stats.player2_wins > 0 && stats.player2_wins}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 text-sm">
                    <span className="text-green-400">
                      {stats.player1_name.split(' ')[0]}
                    </span>
                    <span className="text-gray-400">Draws</span>
                    <span className="text-purple-400">
                      {stats.player2_name.split(' ')[0]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                No head-to-head data available
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
