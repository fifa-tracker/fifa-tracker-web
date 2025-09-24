import { FIFA23AllTeams } from '@/constants/teams';
import { recordMatch, Tournament, User } from '@/lib/api';
import { useState } from 'react';
import CustomDropdown from './CustomDropdown';

interface LogMatchProps {
  players: User[];
  tournaments: Tournament[];
  selectedTournamentId: string;
  onMatchLogged?: () => void;
  prePopulatedMatch?: {
    player1_id: string;
    player2_id: string;
    team1: string;
    team2: string;
    player1_goals: number;
    player2_goals: number;
    half_length: number;
  };
}

export default function LogMatch({
  players,
  tournaments,
  selectedTournamentId,
  onMatchLogged,
  prePopulatedMatch,
}: LogMatchProps) {
  const selectedTournament =
    tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];

  // Check if the tournament is completed
  const isTournamentCompleted = selectedTournament?.completed || false;

  const [formData, setFormData] = useState({
    player1_id: prePopulatedMatch?.player1_id || '',
    player2_id: prePopulatedMatch?.player2_id || '',
    team1: prePopulatedMatch?.team1 || '',
    team2: prePopulatedMatch?.team2 || '',
    player1_goals: prePopulatedMatch?.player1_goals || 0,
    player2_goals: prePopulatedMatch?.player2_goals || 0,
    tournament_id: selectedTournament?.id || '',
    half_length: prePopulatedMatch?.half_length || 3,
  });

  const teams = FIFA23AllTeams.map(team => team.name);

  const handleInputChange = (field: string, value: string | number) => {
    // Don't allow changes if tournament is completed
    if (isTournamentCompleted) return;

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    // Don't allow submission if tournament is completed
    if (isTournamentCompleted) return;

    // Record the match (now automatically marks it as completed)
    recordMatch(
      formData.player1_id,
      formData.player2_id,
      formData.team1,
      formData.team2,
      formData.player1_goals,
      formData.player2_goals,
      formData.tournament_id,
      formData.half_length
    )
      .then(() => {
        // Call the callback to redirect to History tab
        if (onMatchLogged) {
          onMatchLogged();
        }
      })
      .catch(error => {
        console.error('Error logging match:', error);
      });
    setFormData({
      player1_id: prePopulatedMatch?.player1_id || '',
      player2_id: prePopulatedMatch?.player2_id || '',
      team1: prePopulatedMatch?.team1 || '',
      team2: prePopulatedMatch?.team2 || '',
      player1_goals: prePopulatedMatch?.player1_goals || 0,
      player2_goals: prePopulatedMatch?.player2_goals || 0,
      tournament_id: selectedTournament?.id || '',
      half_length: prePopulatedMatch?.half_length || 3,
    });
  };

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Log New Match</h2>
      <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
        Record a new FIFA match result for{' '}
        {selectedTournament?.name || 'the tournament'}
      </p>

      {isTournamentCompleted && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ This tournament is completed. No new matches can be logged.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Player 1</label>
          <select
            className={`w-full bg-[#2d3748] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm sm:text-base ${
              isTournamentCompleted ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            value={formData.player1_id}
            onChange={e => handleInputChange('player1_id', e.target.value)}
            disabled={isTournamentCompleted}
          >
            <option value="">Select player 1</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.first_name || player.username}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-2 mt-4">Team 1</label>
          <CustomDropdown
            options={teams}
            value={formData.team1}
            onChange={value => handleInputChange('team1', value)}
            placeholder="Select team 1"
            searchable={true}
            disabled={isTournamentCompleted}
          />

          <label className="block text-sm font-medium mb-2 mt-4">
            Player 1 Score
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() =>
                handleInputChange(
                  'player1_goals',
                  Math.max(0, formData.player1_goals - 1)
                )
              }
              disabled={isTournamentCompleted}
              className={`w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold transition-colors ${
                isTournamentCompleted
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#374151]'
              }`}
            >
              -
            </button>
            <div className="flex-1 bg-[#2d3748] border border-gray-600 rounded-lg px-4 py-3 text-center">
              <span className="text-white text-2xl font-bold">
                {formData.player1_goals}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                handleInputChange('player1_goals', formData.player1_goals + 1)
              }
              disabled={isTournamentCompleted}
              className={`w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold transition-colors ${
                isTournamentCompleted
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#374151]'
              }`}
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Player 2</label>
          <select
            className={`w-full bg-[#2d3748] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm sm:text-base ${
              isTournamentCompleted ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            value={formData.player2_id}
            onChange={e => handleInputChange('player2_id', e.target.value)}
            disabled={isTournamentCompleted}
          >
            <option value="">Select player 2</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.first_name || player.username}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-2 mt-4">Team 2</label>
          <CustomDropdown
            options={teams}
            value={formData.team2}
            onChange={value => handleInputChange('team2', value)}
            placeholder="Select team 2"
            searchable={true}
            disabled={isTournamentCompleted}
          />

          <label className="block text-sm font-medium mb-2 mt-4">
            Player 2 Score
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() =>
                handleInputChange(
                  'player2_goals',
                  Math.max(0, formData.player2_goals - 1)
                )
              }
              disabled={isTournamentCompleted}
              className={`w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold transition-colors ${
                isTournamentCompleted
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#374151]'
              }`}
            >
              -
            </button>
            <div className="flex-1 bg-[#2d3748] border border-gray-600 rounded-lg px-4 py-3 text-center">
              <span className="text-white text-2xl font-bold">
                {formData.player2_goals}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                handleInputChange('player2_goals', formData.player2_goals + 1)
              }
              disabled={isTournamentCompleted}
              className={`w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold transition-colors ${
                isTournamentCompleted
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#374151]'
              }`}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Half Length (minutes)
        </label>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() =>
              handleInputChange(
                'half_length',
                Math.max(3, formData.half_length - 1)
              )
            }
            disabled={isTournamentCompleted}
            className={`w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold transition-colors ${
              isTournamentCompleted
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[#374151]'
            }`}
          >
            -
          </button>
          <div className="flex-1 bg-[#2d3748] border border-gray-600 rounded-lg px-4 py-3 text-center">
            <span className="text-white text-2xl font-bold">
              {formData.half_length}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              handleInputChange(
                'half_length',
                Math.min(6, formData.half_length + 1)
              )
            }
            disabled={isTournamentCompleted}
            className={`w-12 h-12 bg-[#2d3748] border border-gray-600 rounded-lg flex items-center justify-center text-white text-xl font-bold transition-colors ${
              isTournamentCompleted
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[#374151]'
            }`}
          >
            +
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-1">Range: 3-6 minutes</p>
      </div>

      <div className="mt-6">
        <button
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors text-sm sm:text-base ${
            !selectedTournament || isTournamentCompleted
              ? 'bg-gray-500 cursor-not-allowed text-gray-300'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          onClick={handleSubmit}
          disabled={!selectedTournament || isTournamentCompleted}
        >
          {isTournamentCompleted ? 'Tournament Completed' : 'Log Match'}
        </button>
      </div>
    </div>
  );
}
