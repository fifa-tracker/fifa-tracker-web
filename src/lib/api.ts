import axios, { AxiosError } from 'axios';

/**
 * Debug Configuration
 *
 * To enable debug logging, set the environment variable:
 * NEXT_PUBLIC_DEBUG_MODE=true
 *
 * This can be done by:
 * 1. Creating a .env.local file with: NEXT_PUBLIC_DEBUG_MODE=true
 * 2. Setting it in your shell: export NEXT_PUBLIC_DEBUG_MODE=true
 * 3. Adding it to your deployment environment variables
 *
 * When enabled, all console.log, console.warn, and console.error statements
 * will be displayed. When disabled, no debug output will be shown.
 */

// Debug configuration
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || false;

// Debug logging functions
const debugLog = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

const debugWarn = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.warn(...args);
  }
};

const debugError = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.error(...args);
  }
};

// Environment variables for API base URLs
const API_BASE_URL_NGROK = process.env.NEXT_PUBLIC_API_BASE_URL_NGROK;
const API_BASE_URL_LOCAL =
  process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL || 'http://localhost:8000';
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV;

// Dynamic API base URL that works for both local and network access
const getApiBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    debugLog('getApiBaseUrl() called with:', {
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
      debugLog('Production with ngrok URL:', {
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
      debugLog('Development (localhost):', result);
      return result;
    }

    // Production - ensure HTTPS for ngrok URLs to avoid mixed content issues
    if (API_BASE_URL_NGROK) {
      // Force HTTPS for ngrok URLs and ensure no trailing slash
      let ngrokUrl = API_BASE_URL_NGROK.replace('http://', 'https://');
      ngrokUrl = ngrokUrl.replace(/\/$/, ''); // Remove trailing slash if present
      const result = `${ngrokUrl}/api/v1`;
      debugLog('Production with ngrok URL (fallback):', {
        original: API_BASE_URL_NGROK,
        result,
      });
      return result;
    }

    // Fallback to localhost if no ngrok URL is configured
    debugWarn('No ngrok URL configured, falling back to localhost');
    const result = `${API_BASE_URL_LOCAL}/api/v1`;
    debugLog('Fallback to localhost:', result);
    return result;
  }
  // Server-side rendering - default to localhost
  const result = `${API_BASE_URL_LOCAL}/api/v1`;
  debugLog('Server-side rendering:', result);
  return result;
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging
debugLog('API Configuration:', {
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
    debugError('SECURITY WARNING: Using HTTP API URL in HTTPS environment!');
    debugError('This will cause mixed content errors.');
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
        debugError('WARNING: Still using HTTP after HTTPS enforcement!');
        debugError('Original URL:', freshApiBaseUrl);
        debugError('Final URL:', finalBaseUrl);
        debugError('Environment:', ENVIRONMENT);
        debugError('Ngrok URL:', API_BASE_URL_NGROK);
      }
    }
  }

  // Final safety check - if we're in production and still have HTTP, force HTTPS
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    finalBaseUrl.startsWith('http://')
  ) {
    debugError('CRITICAL: Forcing HTTPS conversion for production!');
    finalBaseUrl = finalBaseUrl.replace('http://', 'https://');
  }

  debugLog('Creating authenticated request:', {
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
      debugLog('Making request to:', {
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

export async function getPlayers(): Promise<User[]> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get('/players/');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      debugError('Error fetching players:', {
        message: axiosError.message,
        code: axiosError.code,
        config: axiosError.config,
      });
      if (axiosError.code === 'ECONNREFUSED') {
        debugError(
          'Unable to connect to the API server. Please check if the server is running.'
        );
      }
    } else {
      debugError('Unexpected error:', error);
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
      completed: true,
    });
    return response.data;
  } catch (error) {
    debugError('Error recording match:', error);

    // Check for mixed content error specifically
    if (axios.isAxiosError(error) && error.code === 'ERR_NETWORK') {
      debugError('Network error detected. This might be due to:');
      debugError(
        '1. Mixed content: HTTPS frontend trying to connect to HTTP backend'
      );
      debugError('2. CORS issues');
      debugError('3. Backend server not running');
      debugError('Current API URL:', API_BASE_URL);

      // Check if we're using HTTP in production
      if (
        typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        API_BASE_URL.startsWith('http:')
      ) {
        debugError('MIXED CONTENT ERROR: Frontend is HTTPS but API is HTTP');
        debugError('Solution: Use HTTPS ngrok URL in environment variables');
        debugError('Current ngrok URL:', API_BASE_URL_NGROK);
        debugError('Expected format: https://your-ngrok-url.ngrok-free.app');
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
    debugError('Error fetching table:', error);
    if (axios.isAxiosError(error)) {
      debugError('Axios error details:', {
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
    debugError('Error fetching match history:', error);
    return [];
  }
}

export async function createPlayer(name: string): Promise<Player | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.post('/players/', { name });
    return response.data;
  } catch (error) {
    debugError('Error creating player:', error);
    return null;
  }
}

export async function getHeadToHead(
  player1_id: string,
  player2_id: string
): Promise<{
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
}> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get(
      `/stats/head-to-head/${player1_id}/${player2_id}`
    );
    return response.data;
  } catch (error) {
    debugError('Error fetching head-to-head stats:', error);
    return {
      player1_id: player1_id,
      player2_id: player2_id,
      player1_name: '',
      player2_name: '',
      total_matches: 0,
      player1_wins: 0,
      player2_wins: 0,
      draws: 0,
      player1_goals: 0,
      player2_goals: 0,
      player1_win_rate: 0,
      player2_win_rate: 0,
      player1_avg_goals: 0,
      player2_avg_goals: 0,
    };
  }
}

export async function deletePlayer(player_id: string): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.delete(`/player/${player_id}/`);
  } catch (error) {
    debugError('Error deleting player:', error);
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
    debugError('Error updating player:', error);
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
    debugError('Error updating match:', error);
  }
}

export async function deleteMatch(match_id: string): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.delete(`/matches/${match_id}`);
  } catch (error) {
    debugError('Error deleting match:', error);
  }
}

export async function getPlayerStats(
  player_id: string
): Promise<UserDetailedStats | null> {
  try {
    debugLog('getPlayerStats called with player_id:', player_id);
    const axiosInstance = createAuthenticatedRequest();
    debugLog(
      'getPlayerStats axios instance baseURL:',
      axiosInstance.defaults.baseURL
    );
    const response = await axiosInstance.get(`/players/${player_id}/stats/`);
    return response.data;
  } catch (error) {
    debugError('Error fetching player stats:', error);
    if (axios.isAxiosError(error)) {
      debugError('getPlayerStats Axios error details:', {
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
    debugLog('Making request to tournaments endpoint...');
    const response = await axiosInstance.get('/tournaments/');
    debugLog('Tournaments response:', response.data);
    return response.data;
  } catch (error) {
    debugError('Error fetching tournaments:', error);
    if (axios.isAxiosError(error)) {
      debugError('Axios error details:', {
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
    debugError('Error fetching tournament:', error);
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
    debugError('Error updating tournament:', error);
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
    debugError('Error creating tournament:', error);
    return null;
  }
}

export async function deleteTournament(tournament_id: string): Promise<void> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    await axiosInstance.delete(`/tournaments/${tournament_id}`);
  } catch (error) {
    debugError('Error deleting tournament:', error);
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
    debugError('Error adding player to tournament:', error);
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
    debugError('Error removing player from tournament:', error);
  }
}

export async function getTournamentPlayers(
  tournament_id: string
): Promise<User[]> {
  try {
    // Guard against empty tournament ID
    if (!tournament_id || tournament_id.trim() === '') {
      debugWarn(
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
    debugError('Error fetching tournament players:', error);
    return [];
  }
}

export async function getTournamentMatches(
  tournament_id: string,
  page: number = 1,
  page_size: number = 50
): Promise<PaginatedResponse<MatchResult>> {
  try {
    // Guard against empty tournament ID
    if (!tournament_id || tournament_id.trim() === '') {
      debugWarn(
        'Attempted to fetch tournament matches with empty tournament ID'
      );
      return {
        items: [],
        total: 0,
        page: 1,
        page_size: page_size,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      };
    }

    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get(
      `/tournaments/${tournament_id}/matches`,
      {
        params: {
          page,
          page_size,
        },
      }
    );
    return response.data;
  } catch (error) {
    debugError('Error fetching tournament matches:', error);
    return {
      items: [],
      total: 0,
      page: 1,
      page_size: page_size,
      total_pages: 0,
      has_next: false,
      has_previous: false,
    };
  }
}

export async function getTournamentStandings(
  tournament_id: string
): Promise<PlayerStats[]> {
  try {
    // Guard against empty tournament ID
    if (!tournament_id || tournament_id.trim() === '') {
      debugWarn(
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
    debugError('Error fetching tournament standings:', error);
    return [];
  }
}

export async function register(
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  username: string
): Promise<User | null> {
  try {
    const payload = { first_name, last_name, email, password, username };

    const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
    return response.data;
  } catch (error) {
    debugError('Error registering:', error);
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

    const response = await axios.post(`${API_BASE_URL}/auth/login`, payload);

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
    debugError('Error logging in:', error);
    if (axios.isAxiosError(error)) {
      debugError('Login error details:', {
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
    debugError('Error refreshing token:', error);
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
    debugError('Error fetching current user:', error);
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
    debugError('Error checking username availability:', error);
    // If the API call fails, we'll assume the username is taken to be safe
    return false;
  }
}

export async function updateUserProfile(
  id: string,
  first_name?: string,
  email?: string,
  username?: string
): Promise<User | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const payload: {
      id: string;
      first_name?: string;
      email?: string;
      username?: string;
    } = { id, first_name, email, username };
    if (id == '') {
      return null;
    }
    const response = await axiosInstance.put(`/players/${id}`, payload);
    return response.data;
  } catch (error) {
    debugError('Error updating user profile:', error);
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
    debugError('Error deleting user account:', error);
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
    debugLog('getCurrentUserStats called with player_id:', player_id);
    debugLog('Axios instance baseURL:', axiosInstance.defaults.baseURL);

    // Add cache-busting parameter to avoid browser caching issues
    const timestamp = Date.now();
    const response = await axiosInstance.get(
      `/players/${player_id}/stats?_t=${timestamp}`
    );

    // The API returns a single UserDetailedStats object, not an array
    return response.data || null;
  } catch (error) {
    debugError('Error fetching current user stats:', error);

    // Additional error logging for debugging
    if (axios.isAxiosError(error)) {
      debugError('getCurrentUserStats Axios error details:', {
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
    debugError('Error fetching all users stats:', error);
    return [];
  }
}

// Friend-related functions
export async function sendFriendRequest(
  friend_id: string
): Promise<FriendResponse | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.post('/user/send-friend-request', {
      friend_id,
    });
    return response.data;
  } catch (error) {
    debugError('Error sending friend request:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        throw new Error(
          'Cannot send friend request to yourself or to an existing friend.'
        );
      } else if (axiosError.response?.status === 404) {
        throw new Error('User not found.');
      } else if (axiosError.response?.status === 409) {
        throw new Error('Friend request already sent or received.');
      } else if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else {
        const errorData = axiosError.response?.data as Record<string, unknown>;
        throw new Error(
          `Failed to send friend request: ${errorData?.detail || axiosError.message}`
        );
      }
    }
    throw new Error('Failed to send friend request. Please try again.');
  }
}

export async function getFriendRequests(): Promise<FriendRequestsResponse> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get('/user/friend-requests');
    return response.data;
  } catch (error) {
    debugError('Error fetching friend requests:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
    }
    return { sent_requests: [], received_requests: [] };
  }
}

export async function getFriends(): Promise<Friend[]> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get('/user/friends');
    return response.data;
  } catch (error) {
    debugError('Error fetching friends:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
    }
    return [];
  }
}

export async function getRecentNonFriendOpponents(): Promise<
  NonFriendPlayer[]
> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.get(
      '/user/recent-non-friend-opponents'
    );
    return response.data;
  } catch (error) {
    debugError('Error fetching recent non-friend opponents:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
    }
    return [];
  }
}

export async function acceptFriendRequest(
  friend_id: string
): Promise<FriendResponse | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.post('/user/accept-friend-request', {
      friend_id,
    });
    return response.data;
  } catch (error) {
    debugError('Error accepting friend request:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error('Friend request not found.');
      } else if (axiosError.response?.status === 400) {
        throw new Error('Cannot accept this friend request.');
      } else if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else {
        const errorData = axiosError.response?.data as Record<string, unknown>;
        throw new Error(
          `Failed to accept friend request: ${errorData?.detail || axiosError.message}`
        );
      }
    }
    throw new Error('Failed to accept friend request. Please try again.');
  }
}

export async function rejectFriendRequest(
  friend_id: string
): Promise<FriendResponse | null> {
  try {
    const axiosInstance = createAuthenticatedRequest();
    const response = await axiosInstance.post('/user/reject-friend-request', {
      friend_id,
    });
    return response.data;
  } catch (error) {
    debugError('Error rejecting friend request:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new Error('Friend request not found.');
      } else if (axiosError.response?.status === 400) {
        throw new Error('Cannot reject this friend request.');
      } else if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else {
        const errorData = axiosError.response?.data as Record<string, unknown>;
        throw new Error(
          `Failed to reject friend request: ${errorData?.detail || axiosError.message}`
        );
      }
    }
    throw new Error('Failed to reject friend request. Please try again.');
  }
}

// Pagination interfaces
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface Player {
  name: string;
  id: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  total_matches?: number;
  total_goals_scored?: number;
  total_goals_conceded?: number;
  goal_difference?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  points?: number;
  elo_rating?: number;
  tournaments_played?: number;
  tournament_ids?: string[];
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
  completed: boolean;
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
  id: string;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
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
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
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
  first_name?: string | null;
  last_name?: string | null;
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

// Friend-related interfaces
export interface FriendRequest {
  friend_id: string;
}

export interface FriendResponse {
  message: string;
  success: boolean;
}

export interface NonFriendPlayer {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  friend_request_sent?: boolean;
}

export interface FriendRequestsResponse {
  sent_requests: FriendRequestUser[];
  received_requests: FriendRequestUser[];
}

export interface FriendRequestUser {
  friend_id: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface Friend {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  total_matches?: number;
  wins?: number;
  elo_rating?: number;
}
