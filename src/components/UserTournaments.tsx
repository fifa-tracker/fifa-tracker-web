import { useState, useEffect } from "react";
import { getTournaments, getTournament, updateTournament, deleteTournament, getTournamentPlayers, Player, Tournament } from "@/lib/api";

interface TournamentWithPlayers extends Tournament {
  players?: Player[];
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function UserTournaments() {
  const [tournaments, setTournaments] = useState<TournamentWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTournament, setEditingTournament] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    completed: false
  });

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

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsData = await getTournaments();
      
      // Fetch players for each tournament
      const tournamentsWithPlayers = await Promise.all(
        tournamentsData.map(async (tournament) => {
          try {
            const players = await getTournamentPlayers(tournament.id);
            return { ...tournament, players };
          } catch (error) {
            console.error(`Error fetching players for tournament ${tournament.id}:`, error);
            return { ...tournament, players: [] };
          }
        })
      );
      
      setTournaments(tournamentsWithPlayers);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tournament: Tournament) => {
    setEditingTournament(tournament.id);
    setEditForm({
      name: tournament.name,
      description: tournament.description,
      start_date: tournament.start_date ? tournament.start_date.split('T')[0] : "",
      end_date: tournament.end_date ? tournament.end_date.split('T')[0] : "",
      completed: tournament.completed
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTournament) return;

    try {
      const updatedTournament = await updateTournament(
        editingTournament,
        editForm.name,
        editForm.description,
        undefined, // player_ids - not updating for now
        editForm.completed,
        editForm.start_date || undefined,
        editForm.end_date || undefined
      );

      if (updatedTournament) {
        setTournaments(prev => 
          prev.map(t => 
            t.id === editingTournament 
              ? { ...t, ...updatedTournament }
              : t
          )
        );
        setEditingTournament(null);
        showToast("Tournament updated successfully!", 'success');
      } else {
        showToast("Failed to update tournament. Please try again.", 'error');
        setEditingTournament(null);
      }
    } catch (error) {
      console.error("Error updating tournament:", error);
      showToast("Failed to update tournament. Please try again.", 'error');
      setEditingTournament(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTournament(null);
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteTournament(tournamentId);
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      showToast("Tournament deleted successfully!", 'success');
    } catch (error) {
      console.error("Error deleting tournament:", error);
      showToast("Failed to delete tournament. Please try again.", 'error');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1f2e] rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">My Tournaments</h2>
        <p className="text-gray-400 mb-6">Manage your created tournaments</p>

        {tournaments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">You haven't created any tournaments yet.</p>
            <p className="text-sm text-gray-500">Create your first tournament in the Tournament Management section.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="bg-[#2d3748] rounded-lg p-4 border border-gray-600">
                {editingTournament === tournament.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tournament Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-[#1a1f2e] border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-[#1a1f2e] border border-gray-600 rounded-lg px-3 py-2 text-white"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <input
                          type="date"
                          value={editForm.start_date}
                          onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                          className="w-full bg-[#1a1f2e] border border-gray-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <input
                          type="date"
                          value={editForm.end_date}
                          onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                          className="w-full bg-[#1a1f2e] border border-gray-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`completed-${tournament.id}`}
                        checked={editForm.completed}
                        onChange={(e) => setEditForm(prev => ({ ...prev, completed: e.target.checked }))}
                        className="rounded border-gray-600 bg-[#1a1f2e] text-green-500"
                      />
                      <label htmlFor={`completed-${tournament.id}`} className="text-sm font-medium">
                        Tournament Completed
                      </label>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{tournament.name}</h3>
                        <p className="text-gray-400 mt-1">{tournament.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(tournament)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTournament(tournament.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Start Date:</span>
                        <p className="text-white">{formatDate(tournament.start_date)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">End Date:</span>
                        <p className="text-white">{formatDate(tournament.end_date)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <p className={`font-medium ${tournament.completed ? 'text-green-400' : 'text-yellow-400'}`}>
                          {tournament.completed ? 'Completed' : 'Active'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="text-gray-400 text-sm">Players ({tournament.players?.length || 0}):</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tournament.players && tournament.players.length > 0 ? (
                          tournament.players.map((player) => (
                            <span
                              key={player.id}
                              className="bg-[#1a1f2e] text-white px-2 py-1 rounded text-xs"
                            >
                              {player.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No players added</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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