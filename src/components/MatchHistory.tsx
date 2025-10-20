import { MatchResult } from '@/types';

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
  isTournamentCompleted: _isTournamentCompleted = false,
  onMatchUpdated: _onMatchUpdated,
  onPageChange,
  currentPage = 1,
  totalPages,
  onMatchClick,
}: MatchHistoryProps) {
  // Safety check: ensure matches is always an array
  const safeMatches = Array.isArray(matches) ? matches : [];

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
                      className={`${
                        match.completed
                          ? 'bg-[#1e293b] border border-green-600/40'
                          : 'bg-[#2d3748] border border-red-600/40'
                      } rounded-lg p-3 sm:p-4 ${
                        onMatchClick
                          ? 'cursor-pointer hover:bg-[#374151] transition-colors'
                          : ''
                      }`}
                      onClick={
                        onMatchClick ? () => onMatchClick(match) : undefined
                      }
                    >
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
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                match.completed
                                  ? 'bg-green-600/30 text-green-300 border border-green-600/40'
                                  : 'bg-red-600/30 text-red-200 border border-red-600/40'
                              }`}
                            >
                              {match.completed ? 'Completed' : 'Incomplete'}
                            </span>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                onMatchClick?.(match);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs sm:text-sm transition-colors"
                              title="Log this match"
                            >
                              Log
                            </button>
                          </div>
                        </div>
                      </div>
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
    </div>
  );
}
