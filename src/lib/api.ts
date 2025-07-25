import axios, { AxiosError } from 'axios';

// Environment variables for API base URLs
const API_BASE_URL_NGROK = process.env.NEXT_PUBLIC_API_BASE_URL_NGROK;
const API_BASE_URL_LOCAL =
  process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL || 'http://localhost:8000';
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV;

// Dynamic API base URL that works for both local and network access
const getApiBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    console.log('getApiBaseUrl() called with:', {
      ENVIRONMENT,
      API_BASE_URL_NGROK,
      API_BASE_URL_LOCAL,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
    });

    // Check environment variable first
    if (ENVIRONMENT === 'production' && API_BASE_URL_NGROK) {
      // Production environment - use ngrok URL
      let ngrokUrl = API_BASE_URL_NGROK.replace('http://', 'https://');
      ngrokUrl = ngrokUrl.replace(/\/$/, ''); // Remove trailing slash if present
      const result = `${ngrokUrl}/api/v1`;
      console.log('Production with ngrok URL:', {
        original: API_BASE_URL_NGROK,
        result,
      });
      return result;
    }

    // Check if we're in development (localhost)
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      const result = `${API_BASE_URL_LOCAL}/api/v1`;
      console.log('Development (localhost):', result);
      return result;
    }

    // Production - ensure HTTPS for ngrok URLs to avoid mixed content issues
    if (API_BASE_URL_NGROK) {
      // Force HTTPS for ngrok URLs and ensure no trailing slash
      let ngrokUrl = API_BASE_URL_NGROK.replace('http://', 'https://');
      ngrokUrl = ngrokUrl.replace(/\/$/, ''); // Remove trailing slash if present
      const result = `${ngrokUrl}/api/v1`;
      console.log('Production with ngrok URL (fallback):', {
        original: API_BASE_URL_NGROK,
        result,
      });
      return result;
    }

    // Fallback to localhost if no ngrok URL is configured
    console.warn('No ngrok URL configured, falling back to localhost');
    const result = `${API_BASE_URL_LOCAL}/api/v1`;
    console.log('Fallback to localhost:', result);
    return result;
  }
  // Server-side rendering - default to localhost
  const result = `${API_BASE_URL_LOCAL}/api/v1`;
  console.log('Server-side rendering:', result);
  return result;
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('API Configuration:', {
  API_BASE_URL_NGROK,
  API_BASE_URL_LOCAL,
  ENVIRONMENT,
  finalApiBaseUrl: API_BASE_URL,
});

// Debug logging to help troubleshoot API URL issues
if (typeof window !== 'undefined') {
  // Validate that we're using HTTPS in production
  if (
    window.location.protocol === 'https:' &&
    API_BASE_URL.startsWith('http:')
  ) {
    console.error('SECURITY WARNING: Using HTTP API URL in HTTPS environment!');
    console.error('This will cause mixed content errors.');
  }
}

// Helper function to get access token from localStorage
const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('fifa-tracker-token');
  }
  return null;
};

// Helper function to create authenticated axios instance
const createAuthenticatedRequest = () => {
  const token = getAccessToken();

  // Get fresh API base URL to avoid caching issues
  const freshApiBaseUrl = getApiBaseUrl();

  // Force HTTPS for production environments - more aggressive enforcement
  let finalBaseUrl = freshApiBaseUrl;
  if (typeof window !== 'undefined') {
    // Always force HTTPS if we're on HTTPS or in production
    if (
      window.location.protocol === 'https:' ||
      window.location.hostname !== 'localhost'
    ) {
      finalBaseUrl = freshApiBaseUrl.replace('http://', 'https://');

      // Double-check and log if we're still using HTTP
      if (finalBaseUrl.startsWith('http://')) {
        console.error('WARNING: Still using HTTP after HTTPS enforcement!');
        console.error('Original URL:', freshApiBaseUrl);
        console.error('Final URL:', finalBaseUrl);
        console.error('Environment:', ENVIRONMENT);
        console.error('Ngrok URL:', API_BASE_URL_NGROK);
      }
    }
  }

  // Final safety check - if we're in production and still have HTTP, force HTTPS
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    finalBaseUrl.startsWith('http://')
  ) {
    console.error('CRITICAL: Forcing HTTPS conversion for production!');
    finalBaseUrl = finalBaseUrl.replace('http://', 'https://');
  }

  console.log('Creating authenticated request:', {
    hasToken: !!token,
    tokenLength: token?.length,
    baseURL: finalBaseUrl,
    originalBaseUrl: freshApiBaseUrl,
    protocol:
      typeof window !== 'undefined' ? window.location.protocol : 'server',
  });

  const config: {
    baseURL: string;
    headers?: {
      Authorization: string;
      'Content-Type': string;
    };
  } = {
    baseURL: finalBaseUrl,
  };

  if (token) {
    config.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  const axiosInstance = axios.create(config);

  // Add request interceptor to log the actual request URL and add cache-busting
  axiosInstance.interceptors.request.use(
    config => {
      // Log the actual request URL being made
      const fullUrl = (config.baseURL || '') + (config.url || '');
      console.log('Making request to:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        fullUrl: fullUrl,
        headers: config.headers,
      });

      // Add cache-busting headers for production
      if (
        typeof window !== 'undefined' &&
        window.location.protocol === 'https:'
      ) {
        if (config.headers) {
          config.headers['Cache-Control'] =
            'no-cache, no-store, must-revalidate';
          config.headers['Pragma'] = 'no-cache';
          config.headers['Expires'] = '0';
        }
      }

      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle authentication errors
  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 401) {
        // Try to refresh the token
        const newToken = await refreshToken();
        if (!newToken) {
          // Token refresh failed, clear everything and redirect to login
          localStorage.removeItem('fifa-tracker-token');
          localStorage.removeItem('fifa-tracker-user');
          localStorage.removeItem('fifa-tracker-refresh-token');

          // Redirect to login page if we're in a browser environment
          if (typeof window !== 'undefined') {
            window.location.href = '/auth';
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export async function getPlayers(): Promise<Player[]> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get('/players/');
    return response.data.map((player: Player) => ({
      name: player.name,
      id: player.id,
    })); // Updated return statement
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error fetching players:', {
        message: axiosError.message,
        code: axiosError.code,
        config: axiosError.config,
      });
      if (axiosError.code === 'ECONNREFUSED') {
        console.error(
          'Unable to connect to the API server. Please check if the server is running.'
        );
      }
    } else {
      console.error('Unexpected error:', error);
    }
    return [];
  }
}

export async function recordMatch(
  player1_id: string,
  player2_id: string,
  team1: string,
  team2: string,
  player1_goals: number,
  player2_goals: number,
  tournament_id: string,
  half_length: number
): Promise<Match | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();

    const response = await axiosInstance.post('/matches/', {
      player1_id,
      player2_id,
      team1,
      team2,
      player1_goals,
      player2_goals,
      tournament_id,
      half_length,
    });
    return response.data;
  } catch (error) {
    console.error('Error recording match:', error);

    // Check for mixed content error specifically
    if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
      console.error('Network error detected. This might be due to:');
      console.error(
        '1. Mixed content: HTTPS frontend trying to connect to HTTP backend'
      );
      console.error('2. CORS issues');
      console.error('3. Backend server not running');
      console.error('Current API URL:', API_BASE_URL);

      // Check if we're using HTTP in production
      if (
        typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        API_BASE_URL.startsWith('http:')
      ) {
        console.error('MIXED CONTENT ERROR: Frontend is HTTPS but API is HTTP');
        console.error('Solution: Use HTTPS ngrok URL in environment variables');
        console.error('Current ngrok URL:', API_BASE_URL_NGROK);
        console.error('Expected format: https://your-ngrok-url.ngrok-free.app');
      }
    }

    return null;
  }
}

export async function getTable(): Promise<PlayerStats[]> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get('/stats/');
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
          timeout: error.config?.timeout,
        },
      });
    }
    return [];
  }
}

export async function getMatchHistory(): Promise<MatchResult[]> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get('/matches/');
    return response.data;
  } catch (error) {
    console.error('Error fetching match history:', error);
    return [];
  }
}

export async function createPlayer(name: string): Promise<Player | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.post('/players/', { name });
    return response.data;
  } catch (error) {
    console.error('Error creating player:', error);
    return null;
  }
}

export async function getHeadToHead(
  player1_id: string,
  player2_id: string
): Promise<{
  player1_wins: number;
  player2_wins: number;
  draws: number;
  player1_goals: number;
  player2_goals: number;
}> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get(
      `/head-to-head/${player1_id}/${player2_id}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching head-to-head stats:', error);
    return {
      player1_wins: 0,
      player2_wins: 0,
      draws: 0,
      player1_goals: 0,
      player2_goals: 0,
    };
  }
}

export async function deletePlayer(player_id: string): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.delete(`/player/${player_id}/`);
  } catch (error) {
    console.error('Error deleting player:', error);
  }
}

export async function updatePlayer(
  player_id: string,
  newName: string
): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.put(`/player/${player_id}/`, { name: newName });
  } catch (error) {
    console.error('Error updating player:', error);
  }
}

export async function updateMatch(
  match_id: string,
  player1_goals: number,
  player2_goals: number,
  half_length: number
): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.put(`/matches/${match_id}/`, {
      player1_goals,
      player2_goals,
      half_length,
    });
  } catch (error) {
    console.error('Error updating match:', error);
  }
}

export async function deleteMatch(match_id: string): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.delete(`/matches/${match_id}/`);
  } catch (error) {
    console.error('Error deleting match:', error);
  }
}

export async function getPlayerStats(
  player_id: string
): Promise<DetailedPlayerStats | null> {
  try {
    console.log('getPlayerStats called with player_id:', player_id);
    const axiosInstance = createAuthenticatedRequest();
    console.log(
      'getPlayerStats axios instance baseURL:',
      axiosInstance.defaults.baseURL
    );
    const response = await axiosInstance.get(`/players/${player_id}/stats/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    if (axios.isAxiosError(error)) {
      console.error('getPlayerStats Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        },
      });
    }
    return null;
  }
}

export async function getTournaments(): Promise<Tournament[]> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    console.log('Making request to tournaments endpoint...');
    const response = await axiosInstance.get('/tournaments/');
    console.log('Tournaments response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        },
      });
    }
    return [];
  }
}

export async function getTournament(
  tournament_id: string
): Promise<Tournament | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get(`/tournaments/${tournament_id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return null;
  }
}

export async function updateTournament(
  tournament_id: string,
  name?: string,
  description?: string,
  player_ids?: string[],
  completed?: boolean,
  start_date?: string,
  end_date?: string
): Promise<Tournament | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const payload: Record<string, unknown> = {};
    if (name !== undefined) payload.name = name;
    if (description !== undefined) payload.description = description;
    if (player_ids !== undefined) payload.player_ids = player_ids;
    if (completed !== undefined) payload.completed = completed;
    if (start_date !== undefined) payload.start_date = start_date;
    if (end_date !== undefined) payload.end_date = end_date;

    const response = await axiosInstance.put(
      `/tournaments/${tournament_id}/`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Error updating tournament:', error);
    return null;
  }
}

export async function createTournament(
  name: string,
  description: string,
  player_ids: string[]
): Promise<Tournament | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.post('/tournaments/', {
      name,
      description,
      player_ids,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating tournament:', error);
    return null;
  }
}

export async function deleteTournament(tournament_id: string): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.delete(`/tournaments/${tournament_id}`);
  } catch (error) {
    console.error('Error deleting tournament:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 403) {
        throw new Error(
          'You do not have permission to delete this tournament. Only the tournament owner can delete it.'
        );
      } else if (axiosError.response?.status === 404) {
        throw new Error('Tournament not found.');
      } else if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else {
        const errorData = axiosError.response?.data as Record<string, unknown>;
        throw new Error(
          `Failed to delete tournament: ${errorData?.detail || axiosError.message}`
        );
      }
    }
    throw new Error('Failed to delete tournament. Please try again.');
  }
}

export async function addPlayerToTournament(
  tournament_id: string,
  player_id: string
): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.post(`/tournaments/${tournament_id}/players`, {
      player_id,
    });
  } catch (error) {
    console.error('Error adding player to tournament:', error);
  }
}

export async function removePlayerFromTournament(
  tournament_id: string,
  player_id: string
): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.delete(
      `/tournaments/${tournament_id}/players/${player_id}`
    );
  } catch (error) {
    console.error('Error removing player from tournament:', error);
  }
}

export async function getTournamentPlayers(
  tournament_id: string
): Promise<Player[]> {
  try {
    // Guard against empty tournament ID
    if (!tournament_id || tournament_id.trim() === '') {
      console.warn(
        'Attempted to fetch tournament players with empty tournament ID'
      );
      return [];
    }

    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get(
      `/tournaments/${tournament_id}/players`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament players:', error);
    return [];
  }
}

export async function getTournamentMatches(
  tournament_id: string
): Promise<MatchResult[]> {
  try {
    // Guard against empty tournament ID
    if (!tournament_id || tournament_id.trim() === '') {
      console.warn(
        'Attempted to fetch tournament matches with empty tournament ID'
      );
      return [];
    }

    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get(
      `/tournaments/${tournament_id}/matches`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament matches:', error);
    return [];
  }
}

export async function getTournamentStandings(
  tournament_id: string
): Promise<PlayerStats[]> {
  try {
    // Guard against empty tournament ID
    if (!tournament_id || tournament_id.trim() === '') {
      console.warn(
        'Attempted to fetch tournament standings with empty tournament ID'
      );
      return [];
    }

    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get(
      `/tournaments/${tournament_id}/stats`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament standings:', error);
    return [];
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
  username: string
): Promise<User | null> {
  try {
    const payload = { name, email, password, username };

    const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
    return response.data;
  } catch (error) {
    console.error('Error registering:', error);
    return null;
  }
}

export async function login(
  identifier: string,
  password: string
): Promise<User | null> {
  try {
    // The API expects username field, so we'll use the identifier as username
    const payload = { username: identifier, password };

    const response = await axios.post(
      `${API_BASE_URL}/auth/login-json`,
      payload
    );

    // Store the access token if it's included in the response
    if (response.data.access_token) {
      localStorage.setItem('fifa-tracker-token', response.data.access_token);
    }

    // Store refresh token if provided
    if (response.data.refresh_token) {
      localStorage.setItem(
        'fifa-tracker-refresh-token',
        response.data.refresh_token
      );
    }

    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    if (axios.isAxiosError(error)) {
      console.error('Login error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });
    }
    return null;
  }
}

export async function refreshToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem('fifa-tracker-refresh-token');
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    if (response.data.access_token) {
      localStorage.setItem('fifa-tracker-token', response.data.access_token);
      return response.data.access_token;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Clear tokens on refresh failure
    localStorage.removeItem('fifa-tracker-token');
    localStorage.removeItem('fifa-tracker-refresh-token');
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const payload = { username: username };
    const response = await axiosInstance.post(`/auth/check-username`, payload);
    return !response.data.exists;
  } catch (error) {
    console.error('Error checking username availability:', error);
    // If the API call fails, we'll assume the username is taken to be safe
    return false;
  }
}

export async function updateUserProfile(
  id: string,
  name?: string,
  email?: string,
  username?: string
): Promise<User | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const payload: {
      id: string;
      name?: string;
      email?: string;
      username?: string;
    } = { id, name, email, username };
    if (id == '') {
      return null;
    }
    const response = await axiosInstance.put(`/players/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

export async function deleteUserAccount(
  confirmationText: string
): Promise<boolean> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.delete('/auth/me', {
      data: { confirmation_text: confirmationText },
    });
    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    return false;
  }
}

export async function getCurrentUserStats(
  player_id: string
): Promise<UserDetailedStats | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    if (player_id == '') {
      return null;
    }

    // Additional debugging for this specific function
    console.log('getCurrentUserStats called with player_id:', player_id);
    console.log('Axios instance baseURL:', axiosInstance.defaults.baseURL);

    // Add cache-busting parameter to avoid browser caching issues
    const timestamp = Date.now();
    const response = await axiosInstance.get(
      `/players/${player_id}/stats?_t=${timestamp}`
    );

    // The API returns a single UserDetailedStats object, not an array
    return response.data || null;
  } catch (error) {
    console.error('Error fetching current user stats:', error);

    // Additional error logging for debugging
    if (axios.isAxiosError(error)) {
      console.error('getCurrentUserStats Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        },
      });
    }

    return null;
  }
}

export async function getAllUsersStats(): Promise<UserDetailedStats[]> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get('/stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching all users stats:', error);
    return [];
  }
}

export interface Player {
  name: string;
  id: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  access_token?: string;
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
  half_length: number;
}

export interface Tournament {
  id: string;
  name: string;
  player_ids: string[];
  description: string;
  completed: boolean;
  start_date: string;
  end_date: string;
  owner_id?: string;
}

export interface MatchResult {
  id: string;
  player1_name: string;
  player2_name: string;
  player1_goals: number;
  player2_goals: number;
  date: string;
  half_length: number;
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

export interface UserDetailedStats {
  id: string;
  username: string;
  email: string;
  name: string | null;
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
  } | null;
  highest_losses_against: {
    [playerName: string]: number;
  } | null;
  winrate_over_time: {
    date: string;
    winrate: number;
  }[];
  elo_rating: number;
  tournaments_played: number;
  tournament_ids: string[];
}
