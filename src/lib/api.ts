import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

export async function getPlayers(): Promise<Player[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/players`);
    return response.data.map((player: Player) => ({ name: player.name, id: player.id })); // Updated return statement
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error fetching players:', {
        message: axiosError.message,
        code: axiosError.code,
        config: axiosError.config,
      });
      if (axiosError.code === 'ECONNREFUSED') {
        console.error('Unable to connect to the API server. Please check if the server is running.');
      }
    } else {
      console.error('Unexpected error:', error);
    }
    return [];
  }
}

export async function recordMatch(player1_id: string, player2_id: string, team1: string, team2: string, player1_goals: number, player2_goals: number, tournament_id: string): Promise<Match | null> {
  try {
    const response = await axios.post(`${API_BASE_URL}/matches`, {
      player1_id,
      player2_id,
      team1,
      team2,
      player1_goals,
      player2_goals,
      tournament_id
    });
    return response.data;
  } catch (error) {
    console.error('Error recording match:', error);
    return null;
  }
}

export async function getTable(): Promise<PlayerStats[]> {
  try {
    console.log('Attempting to fetch from:', `${API_BASE_URL}/stats`);
    const response = await axios.get(`${API_BASE_URL}/stats`);
    console.log('Successfully fetched stats:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching table:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });
    }
    return [];
  }
}

export async function getMatchHistory(): Promise<MatchResult[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/matches`);
    return response.data;
  } catch (error) {
    console.error('Error fetching match history:', error);
    return [];
  }
}

export async function createPlayer(name: string): Promise<Player | null> {
  try {
    const response = await axios.post(`${API_BASE_URL}/players`, { name });
    return response.data;
  } catch (error) {
    console.error('Error creating player:', error);
    return null;
  }
}

export async function getHeadToHead(player1_id: string, player2_id: string): Promise<{
  player1_wins: number,
  player2_wins: number,
  draws: number,
  player1_goals: number,
  player2_goals: number
}> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/head-to-head/${player1_id}/${player2_id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching head-to-head stats:', error);
    return {
      player1_wins: 0,
      player2_wins: 0,
      draws: 0,
      player1_goals: 0,
      player2_goals: 0
    };
  }
}

export async function deletePlayer(player_id: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/player/${player_id}`);
  } catch (error) {
    console.error('Error deleting player:', error);
  }
}

export async function updatePlayer(player_id: string, newName: string): Promise<void> {
  try {
    await axios.put(`${API_BASE_URL}/player/${player_id}`, { name: newName });
  } catch (error) {
    console.error('Error updating player:', error);
  }
}

export async function updateMatch(match_id: string, player1_goals: number, player2_goals: number): Promise<void> {
  try {
    await axios.put(`${API_BASE_URL}/matches/${match_id}`, { player1_goals, player2_goals });
  } catch (error) {
    console.error('Error updating match:', error);
  }
}

export async function deleteMatch(match_id: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/matches/${match_id}`);
  } catch (error) {
    console.error('Error deleting match:', error);
  }
}

export async function getPlayerStats(player_id: string): Promise<DetailedPlayerStats | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/players/${player_id}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

export async function getTournaments(): Promise<Tournament[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/tournaments`);
    console.log('Tournaments:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
}

export async function createTournament(name: string, description: string, player_ids: string[]): Promise<Tournament | null> {

  try {
    const response = await axios.post(`${API_BASE_URL}/tournaments`, { name, description, player_ids });
    return response.data;
  } catch (error) {
    console.error('Error creating tournament:', error);
    return null;
  }
}

export async function deleteTournament(tournament_id: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/tournaments/${tournament_id}`);
  } catch (error) {
    console.error('Error deleting tournament:', error);
  }
}

export async function addPlayerToTournament(tournament_id: string, player_id: string): Promise<void> {
  try {
    await axios.post(`${API_BASE_URL}/tournaments/${tournament_id}/players`, { player_id });
  } catch (error) {
    console.error('Error adding player to tournament:', error);
  }
}

export async function removePlayerFromTournament(tournament_id: string, player_id: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/tournaments/${tournament_id}/players/${player_id}`);
  } catch (error) {
    console.error('Error removing player from tournament:', error);
  }
}

export async function getTournamentPlayers(tournament_id: string): Promise<Player[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/tournaments/${tournament_id}/players`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament players:', error);
    return [];
  }
}

export async function getTournamentMatches(tournament_id: string): Promise<MatchResult[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/tournaments/${tournament_id}/matches`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament matches:', error);
    return [];
  }
}

export async function getTournamentStandings(tournament_id: string): Promise<PlayerStats[]> {

  try {
    const response = await axios.get(`${API_BASE_URL}/tournaments/${tournament_id}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament standings:', error);
    return [];
  }
}

export interface Player {
  name: string;
  id: string;
}

export interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  player1_goals: number;
  player2_goals: number;
  team1: string;
  team2: string;
  date: string;
}

export interface Tournament {
  id: string;
  name: string;
  player_ids: string[];
  description: string;
}

export interface MatchResult  {
  id: string;
  player1_name: string;
  player2_name: string;
  player1_goals: number;
  player2_goals: number;
  date: string;
}

export interface PlayerStats {
  name: string;
  id: string;
  total_matches: number;
  total_goals_scored: number;
  total_goals_conceded: number;
  goal_difference: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
}

export interface DetailedPlayerStats {
  id: string;
  name: string;
  total_matches: number;
  total_goals_scored: number;
  total_goals_conceded: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  win_rate: number;
  average_goals_scored: number;
  average_goals_conceded: number;
  highest_wins_against: {
    [playerName: string]: number;
  };
  highest_losses_against: {
    [playerName: string]: number;
  };
  winrate_over_time: {
    date: string;
    winrate: number;
  }[];
}

