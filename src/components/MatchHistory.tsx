import { useState } from "react";
import { MatchResult, updateMatch, deleteMatch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface MatchHistoryProps {
  matches: MatchResult[];
  tournamentId?: string;
  isTournamentCreator?: boolean;
  onMatchUpdated?: () => void;
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

export default function MatchHistory({ matches, tournamentId, isTournamentCreator = false, onMatchUpdated }: MatchHistoryProps) {
  const { user } = useAuth();
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    player1_goals: 0,
    player2_goals: 0
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

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
      player2_goals: match.player2_goals
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMatch) return;

    try {
      await updateMatch(editingMatch, editForm.player1_goals, editForm.player2_goals);
      setEditingMatch(null);
      showToast("Match updated successfully!", 'success');
      if (onMatchUpdated) {
        onMatchUpdated();
      }
    } catch (error) {
      console.error("Error updating match:", error);
      showToast("Failed to update match. Please try again.", 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure you want to delete this match? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteMatch(matchId);
      showToast("Match deleted successfully!", 'success');
      if (onMatchUpdated) {
        onMatchUpdated();
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      showToast("Failed to delete match. Please try again.", 'error');
    }
  };

  const groupedMatches = groupMatchesByDate(matches);
  
  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedMatches).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Match History</h2>
      
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
                    {editingMatch === match.id ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm sm:text-base text-left flex-1">{match.player1_name}</div>
                          <div className="flex items-center space-x-2 mx-4">
                            <input
                              type="number"
                              min="0"
                              value={editForm.player1_goals}
                              onChange={(e) => setEditForm(prev => ({ ...prev, player1_goals: parseInt(e.target.value) || 0 }))}
                              className="w-16 bg-[#1a1f2e] border border-gray-600 rounded-lg px-2 py-1 text-white text-center text-sm"
                            />
                            <span className="text-white font-medium">-</span>
                            <input
                              type="number"
                              min="0"
                              value={editForm.player2_goals}
                              onChange={(e) => setEditForm(prev => ({ ...prev, player2_goals: parseInt(e.target.value) || 0 }))}
                              className="w-16 bg-[#1a1f2e] border border-gray-600 rounded-lg px-2 py-1 text-white text-center text-sm"
                            />
                          </div>
                          <div className="font-medium text-sm sm:text-base text-right flex-1">{match.player2_name}</div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm sm:text-base text-left flex-1">{match.player1_name}</div>
                        <div className="bg-gray-600 px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-center mx-4">{match.player1_goals} - {match.player2_goals}</div>
                        <div className="font-medium text-sm sm:text-base text-right flex-1">{match.player2_name}</div>
                        {isTournamentCreator && (
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditClick(match)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
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