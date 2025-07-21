import { Player, recordMatch, Tournament } from "@/lib/api";
import { useState } from "react";
import CustomDropdown from "./CustomDropdown";

interface LogMatchProps {
  players: Player[];
  tournaments: Tournament[];
  selectedTournamentId: string;
  onMatchLogged?: () => void;
}

export default function LogMatch({ players, tournaments, selectedTournamentId, onMatchLogged }: LogMatchProps) {
  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];
  
  const [formData, setFormData] = useState({
    player1_id: "",
    player2_id: "",
    team1: "",
    team2: "",
    player1_goals: 0,
    player2_goals: 0,
    tournament_id: selectedTournament?.id || "",
  });

  const teams = [
    "Arsenal",
    "Aston Villa",
    "Bournemouth",
    "Brentford",
    "Brighton",
    "Burnley",
    "Chelsea",
    "Crystal Palace",
    "Everton",
    "Fulham",
    "Liverpool",
    "Luton",
    "Manchester City",
    "Manchester United",
    "Newcastle",
    "Nottingham Forest",
    "Sheffield United",
    "Tottenham",
    "West Ham",
    "Wolves",
    "Real Madrid",
    "Barcelona",
    "Atletico Madrid",
    "Sevilla",
    "Valencia",
    "Bayern Munich",
    "Borussia Dortmund",
    "RB Leipzig",
    "Bayer Leverkusen",
    "PSG",
    "Marseille",
    "Lyon",
    "Monaco",
    "Nice",
    "Juventus",
    "Inter",
    "AC Milan",
    "Napoli",
    "Roma",
    "Lazio",
    "Ajax",
    "PSV Eindhoven",
    "Feyenoord",
    "Porto",
    "Benfica",
    "Sporting CP",
    "Celtic",
    "Rangers",
    "Galatasaray",
    "Fenerbahce",
    "Besiktas",
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    // TODO: Implement match logging logic
    console.log("Logging match:", formData);
    recordMatch(
      formData.player1_id,
      formData.player2_id,
      formData.team1,
      formData.team2,
      formData.player1_goals,
      formData.player2_goals,
      formData.tournament_id
    )
      .then(() => {
        console.log("Match logged successfully");
        // Call the callback to redirect to History tab
        if (onMatchLogged) {
          onMatchLogged();
        }
      })
      .catch((error) => {
        console.error("Error logging match:", error);
      });
  };

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">Log New Match</h2>
      <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
        Record a new FIFA match result for {selectedTournament?.name || 'the tournament'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Player 1</label>
          <select
            className="w-full bg-[#2d3748] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm sm:text-base"
            value={formData.player1_id}
            onChange={(e) => handleInputChange("player1_id", e.target.value)}
          >
            <option value="">Select player 1</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-2 mt-4">Team 1</label>
          <CustomDropdown
            options={teams}
            value={formData.team1}
            onChange={(value) => handleInputChange("team1", value)}
            placeholder="Select team 1"
            searchable={true}
          />

          <label className="block text-sm font-medium mb-2 mt-4">
            Player 1 Score
          </label>
          <input
            type="number"
            value={formData.player1_goals}
            onChange={(e) =>
              handleInputChange("player1_goals", parseInt(e.target.value) || 0)
            }
            className="w-full bg-[#2d3748] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Player 2</label>
          <select
            className="w-full bg-[#2d3748] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm sm:text-base"
            value={formData.player2_id}
            onChange={(e) => handleInputChange("player2_id", e.target.value)}
          >
            <option value="">Select player 2</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-2 mt-4">Team 2</label>
          <CustomDropdown
            options={teams}
            value={formData.team2}
            onChange={(value) => handleInputChange("team2", value)}
            placeholder="Select team 2"
            searchable={true}
          />

          <label className="block text-sm font-medium mb-2 mt-4">
            Player 2 Score
          </label>
          <input
            type="number"
            value={formData.player2_goals}
            onChange={(e) =>
              handleInputChange("player2_goals", parseInt(e.target.value) || 0)
            }
            className="w-full bg-[#2d3748] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors text-sm sm:text-base ${
            !selectedTournament
              ? 'bg-gray-500 cursor-not-allowed text-gray-300'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          onClick={handleSubmit}
          disabled={!selectedTournament}
        >
          Log Match
        </button>
      </div>
    </div>
  );
}
