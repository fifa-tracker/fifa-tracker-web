import { deleteMatch, updateMatch } from '@/lib/api';
import { MatchResult } from '@/types';
import { useState } from 'react';
import { PencilIcon, TrashIcon } from './Icons';

interface MatchHistoryProps {
  matches: MatchResult[];
  tournamentId?: string;
  isTournamentCreator?: boolean;
  isTournamentCompleted?: boolean;
  onMatchUpdated?: () => void;
  onPageChange?: (newPage: number) => void;
  currentPage?: number;
  totalPages?: number;
  onMatchClick?: (match: MatchResult) => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

// Utility function to format date as "July 18th 2025"
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const formattedDate = date.toLocaleDateString('en-US', options);

  // Add ordinal suffix to day
  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);

  return formattedDate.replace(/\d+$/, day + suffix);
}

// Utility function to get ordinal suffix
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

// Utility function to group matches by date
function groupMatchesByDate(matches: MatchResult[]): {
  [key: string]: MatchResult[];
} {
  const grouped: { [key: string]: MatchResult[] } = {};

  // Safety check: ensure matches is an array
  if (!Array.isArray(matches)) {
    console.warn('groupMatchesByDate: matches is not an array:', matches);
    return grouped;
  }

  matches.forEach(match => {
    const dateKey = new Date(match.date).toDateString(); // Use date string as key
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(match);
  });

  return grouped;
}

export default function MatchHistory({
  matches,
  isTournamentCreator = false,
  isTournamentCompleted = false,
  onMatchUpdated,
  onPageChange,
  currentPage = 1,
  totalPages,
  onMatchClick,
}: MatchHistoryProps) {
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    player1_goals: 0,
    player2_goals: 0,
    half_length: 4,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Safety check: ensure matches is always an array
  const safeMatches = Array.isArray(matches) ? matches : [];

  // Toast notification functions
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleEditClick = (match: MatchResult) => {
    setEditingMatch(match.id);
    setEditForm({
      player1_goals: match.player1_goals,
      player2_goals: match.player2_goals,
      half_length: match.half_length,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMatch) return;

    try {
      await updateMatch(
        editingMatch,
        editForm.player1_goals,
        editForm.player2_goals,
        editForm.half_length
      );
      setEditingMatch(null);
      showToast('Match updated successfully!', 'success');
      if (onMatchUpdated) {
        onMatchUpdated();
      }
    } catch (error) {
      console.error('Error updating match:', error);
      showToast('Failed to update match. Please try again.', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this match? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await deleteMatch(matchId);
      showToast('Match deleted successfully!', 'success');
      if (onMatchUpdated) {
        onMatchUpdated();
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      showToast('Failed to delete match. Please try again.', 'error');
    }
  };

  const groupedMatches = groupMatchesByDate(safeMatches);

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedMatches).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Match History</h2>

      {safeMatches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-lg">No matches found</p>
          <p className="text-gray-500 text-sm mt-2">
            Matches will appear here once they are logged
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(dateKey => {
            const dateMatches = groupedMatches[dateKey];
            const formattedDate = formatDate(dateMatches[0].date);

            return (
              <div key={dateKey} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">
                  {formattedDate}
                </h3>
                <div className="space-y-3">
                  {dateMatches.map((match, index) => (
                    <div
                      key={`${dateKey}-${index}`}
                      className={`bg-[#2d3748] rounded-lg p-3 sm:p-4 ${
                        onMatchClick && editingMatch !== match.id
                          ? 'cursor-pointer hover:bg-[#374151] transition-colors'
                          : ''
                      }`}
                      onClick={
                        onMatchClick && editingMatch !== match.id
                          ? () => onMatchClick(match)
                          : undefined
                      }
                    >
                      {editingMatch === match.id ? (
                        // Edit Form
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm sm:text-base text-left flex-1">
                              {match.player1_name}
                            </div>
                            <div className="flex items-center space-x-2 mx-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditForm(prev => ({
                                    ...prev,
                                    player1_goals: Math.max(
                                      0,
                                      prev.player1_goals - 1
                                    ),
                                  }))
                                }
                                className="w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold hover:bg-[#374151] transition-colors"
                              >
                                -
                              </button>
                              <div className="flex-1 bg-[#1a1f2e] border border-gray-600 rounded-lg px-4 py-3 text-center">
                                <span className="text-white text-2xl font-bold">
                                  {editForm.player1_goals}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditForm(prev => ({
                                    ...prev,
                                    player1_goals: prev.player1_goals + 1,
                                  }))
                                }
                                className="w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold hover:bg-[#374151] transition-colors"
                              >
                                +
                              </button>
                              <span className="text-white font-medium">-</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditForm(prev => ({
                                    ...prev,
                                    player2_goals: Math.max(
                                      0,
                                      prev.player2_goals - 1
                                    ),
                                  }))
                                }
                                className="w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold hover:bg-[#374151] transition-colors"
                              >
                                -
                              </button>
                              <div className="flex-1 bg-[#1a1f2e] border border-gray-600 rounded-lg px-4 py-3 text-center">
                                <span className="text-white text-2xl font-bold">
                                  {editForm.player2_goals}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditForm(prev => ({
                                    ...prev,
                                    player2_goals: prev.player2_goals + 1,
                                  }))
                                }
                                className="w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold hover:bg-[#374151] transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <div className="font-medium text-sm sm:text-base text-right flex-1">
                              {match.player2_name}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-300">
                              Half Length:
                            </label>
                            <input
                              type="number"
                              min="3"
                              max="6"
                              value={editForm.half_length}
                              onChange={e =>
                                setEditForm(prev => ({
                                  ...prev,
                                  half_length: parseInt(e.target.value) || 4,
                                }))
                              }
                              className="w-16 bg-[#1a1f2e] border border-gray-600 rounded-lg px-2 py-1 text-white text-center text-sm"
                            />
                            <span className="text-sm text-gray-400">
                              minutes
                            </span>
                          </div>
                          <div className="flex space-x-1 sm:space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-500 hover:bg-green-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm sm:text-base text-left flex-1">
                              {match.player1_name}
                            </div>
                            <div className="bg-gray-600 px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-center mx-4">
                              {match.player1_goals} - {match.player2_goals}
                            </div>
                            <div className="font-medium text-sm sm:text-base text-right flex-1">
                              {match.player2_name}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center justify-center flex-1">
                              <span className="text-xs text-gray-400">
                                Half Length: {match.half_length} minutes
                              </span>
                            </div>
                            {isTournamentCreator && !isTournamentCompleted && (
                              <div className="flex space-x-1 sm:space-x-2">
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleEditClick(match);
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 sm:p-2 rounded transition-colors"
                                  title="Edit match"
                                >
                                  <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteMatch(match.id);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white p-1.5 sm:p-2 rounded transition-colors"
                                  title="Delete match"
                                >
                                  <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Summary */}
      {totalPages && totalPages > 1 && (
        <div className="text-center text-sm text-gray-400 mt-4">
          Page {currentPage} of {totalPages} • {safeMatches.length} matches on
          this page
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-2 bg-[#2d3748] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#374151] transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pageNum === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#2d3748] text-white hover:bg-[#374151]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-2 bg-[#2d3748] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#374151] transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`${
              toast.type === 'success'
                ? 'bg-green-500 border-green-600'
                : 'bg-red-500 border-red-600'
            } text-white px-4 py-3 rounded-lg shadow-lg border flex items-center justify-between min-w-[300px] animate-in slide-in-from-right duration-300`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-white hover:text-gray-200 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
