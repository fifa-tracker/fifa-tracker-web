import { MatchResult } from "@/lib/api";

interface MatchHistoryProps {
  matches: MatchResult[];
}

// Utility function to format date as "July 18th 2025"
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
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
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Utility function to group matches by date
function groupMatchesByDate(matches: MatchResult[]): { [key: string]: MatchResult[] } {
  const grouped: { [key: string]: MatchResult[] } = {};
  
  matches.forEach(match => {
    const dateKey = new Date(match.date).toDateString(); // Use date string as key
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(match);
  });
  
  return grouped;
}

export default function MatchHistory({ matches }: MatchHistoryProps) {
  const groupedMatches = groupMatchesByDate(matches);
  
  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedMatches).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Match History</h2>
      <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Recent matches in Summer League 2023</p>
      
      <div className="space-y-6">
        {sortedDates.map((dateKey) => {
          const dateMatches = groupedMatches[dateKey];
          const formattedDate = formatDate(dateMatches[0].date);
          
          return (
            <div key={dateKey} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">
                {formattedDate}
              </h3>
              <div className="space-y-3">
                {dateMatches.map((match, index) => (
                  <div key={`${dateKey}-${index}`} className="bg-[#2d3748] rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm sm:text-base text-left flex-1">{match.player1_name}</div>
                      <div className="bg-gray-600 px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-center mx-4">{match.player1_goals} - {match.player2_goals}</div>
                      <div className="font-medium text-sm sm:text-base text-right flex-1">{match.player2_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 