'use client';

import { useState, useEffect } from 'react';
import { TrophyIcon, CalendarIcon, PlusIcon, SettingsIcon } from '@/components/Icons';
import TournamentStandings from '@/components/TournamentStandings';
import MatchHistory from '@/components/MatchHistory';
import LogMatch from '@/components/LogMatch';
import Settings from '@/components/Settings';
import CustomDropdown from '@/components/CustomDropdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { getTournaments, getTable, PlayerStats, Player, getPlayers, Tournament, getMatchHistory, MatchResult, getTournamentStandings, getTournamentMatches } from '@/lib/api';

export default function Home() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('tournament');
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [table, setTable] = useState<PlayerStats[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const tournaments = await getTournaments();
        setTournaments(tournaments);
        if (tournaments.length > 0) {
          setSelectedTournament(tournaments[0].id);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      }
    };



    const fetchPlayers = async () => {
      try {
        const players = await getPlayers();
        setPlayers(players);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    const fetchTournamentStandings = async (tournamentId: string) => {
      try {
        const standings = await getTournamentStandings(tournamentId);
        console.log('Tournament standings:', standings);
        setTable(standings);
      } catch (error) {
        console.error('Error fetching tournament standings:', error);
      }
    };

    const initializeData = async () => {
      await fetchPlayers();
      
      const tournaments = await getTournaments();
      setTournaments(tournaments);
      if (tournaments.length > 0) {
        const firstTournamentId = tournaments[0].id;
        setSelectedTournament(firstTournamentId);
        await fetchTournamentStandings(firstTournamentId);
      }
    };

    initializeData();
  }, []);

  // Separate useEffect for when selectedTournament changes
  useEffect(() => {
    if (selectedTournament) {
      const fetchTournamentStandings = async () => {
        try {
          const standings = await getTournamentStandings(selectedTournament);
          console.log('Tournament standings:', standings);
          setTable(standings);
        } catch (error) {
          console.error('Error fetching tournament standings:', error);
        }
      };

      const fetchMatchHistory = async () => {
        try {
          const matches = await getTournamentMatches(selectedTournament);
          setMatches(matches);
        } catch (error) {
          console.error('Error fetching match history:', error);
        }
      };

      fetchTournamentStandings();
      fetchMatchHistory();
    }
  }, [selectedTournament]);

  const tabs = [
    { id: 'tournament', label: 'Tournament', icon: TrophyIcon },
    { id: 'history', label: 'History', icon: CalendarIcon },
    { id: 'log-match', label: 'Log Match', icon: PlusIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleTabClick = async (tabId: string) => {
    setActiveTab(tabId);
    
    if (tabId === 'tournament' && selectedTournament) {
      try {
        const standings = await getTournamentStandings(selectedTournament);
        console.log('Tournament standings:', standings);
        setTable(standings);
      } catch (error) {
        console.error('Error fetching tournament standings:', error);
      }
    }
    
    if (tabId === 'history' && selectedTournament) {
      try {
        const matches = await getTournamentMatches(selectedTournament);
        setMatches(matches);
      } catch (error) {
        console.error('Error fetching match history:', error);
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0f1419] text-white">
        {/* Header */}
        <header className="text-center py-4 sm:py-8 px-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <TrophyIcon className="text-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
            <h1 className="text-2xl sm:text-3xl font-bold">FIFA Tracker</h1>
          </div>
          <p className="text-gray-300 text-sm sm:text-base px-2">Track your FIFA matches and tournaments with friends.</p>
          
          {/* User Info and Sign Out */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="text-gray-400 text-sm">Welcome, {user?.name}</span>
            <button
              onClick={signOut}
              className="text-red-400 hover:text-red-300 text-sm underline"
            >
              Sign Out
            </button>
          </div>
        </header>

      {/* Tournament Info */}
      <div className="max-w-6xl mx-auto px-4 mb-4 sm:mb-6">
        <div className="bg-[#1a1f2e] rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2 mb-1">
                <span className="text-gray-300 text-sm sm:text-base">Tournament:</span>
                <div className="w-full sm:w-auto">
                  <CustomDropdown
                    options={tournaments.map((tournament) => ({
                      value: tournament.id,
                      label: tournament.name
                    }))}
                    value={selectedTournament}
                    onChange={setSelectedTournament}
                    className="w-full sm:w-auto"
                  />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">2023-06-01 - 2023-08-31</p>
            </div>
            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm self-start sm:self-auto">Completed</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 mb-4 sm:mb-6">
        <div className="flex bg-[#1a1f2e] rounded-lg p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-1 ${
                  activeTab === tab.id
                    ? 'bg-[#2d3748] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#2d3748]'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        {activeTab === 'tournament' && (
          <TournamentStandings standings={table} />
        )}

        {activeTab === 'history' && (
          <MatchHistory 
            matches={matches} 
          />
        )}

        {activeTab === 'log-match' && (
          <LogMatch 
            players={players} 
            tournaments={tournaments}
            selectedTournamentId={selectedTournament}
          />
        )}

        {activeTab === 'settings' && (
          <Settings currentPlayers={['Alex', 'Jordan', 'Sam', 'Casey', 'Riley']} />
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
