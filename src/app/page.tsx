'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrophyIcon, CalendarIcon, PlusIcon, SettingsIcon, UserIcon, Bars3Icon } from '@/components/Icons';
import TournamentStandings from '@/components/TournamentStandings';
import MatchHistory from '@/components/MatchHistory';
import LogMatch from '@/components/LogMatch';
import Settings from '@/components/Settings';
import CustomDropdown from '@/components/CustomDropdown';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { getTournaments, PlayerStats, Player, Tournament, MatchResult, getTournamentStandings, getTournamentMatches, getTournamentPlayers } from '@/lib/api';

export default function Home() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tournament');
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [table, setTable] = useState<PlayerStats[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-menu')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const fetchTournamentStandings = async (tournamentId: string) => {
      try {
        const standings = await getTournamentStandings(tournamentId);
        setTable(standings);
      } catch (error) {
        console.error('Error fetching tournament standings:', error);
      }
    };

    const initializeData = async () => {
      const tournaments = await getTournaments();
      setTournaments(tournaments);
      if (tournaments.length > 0) {
        const firstTournamentId = tournaments[0].id;
        setSelectedTournament(firstTournamentId);
        setTournament(tournaments[0]);
        
        // Now fetch players and standings for the selected tournament
        try {
          const players = await getTournamentPlayers(firstTournamentId);
          setPlayers(players);
        } catch (error) {
          console.error('Error fetching tournament players:', error);
        }
        
        await fetchTournamentStandings(firstTournamentId);
      }
    };

    initializeData();
  }, []);

  // Separate useEffect for when selectedTournament changes
  useEffect(() => {
    if (selectedTournament) {
      const fetchTournamentData = async () => {
        try {
          // Fetch players for the selected tournament
          const players = await getTournamentPlayers(selectedTournament);
          setPlayers(players);
        } catch (error) {
          console.error('Error fetching tournament players:', error);
        }

        try {
          // Fetch standings for the selected tournament
          const standings = await getTournamentStandings(selectedTournament);
          setTable(standings);
        } catch (error) {
          console.error('Error fetching tournament standings:', error);
        }

        try {
          // Fetch match history for the selected tournament
          const matches = await getTournamentMatches(selectedTournament);
          setMatches(matches);
        } catch (error) {
          console.error('Error fetching match history:', error);
        }
      };

      fetchTournamentData();
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
        <header className="py-4 sm:py-6 px-4 border-b border-gray-700">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Logo and Title - Left Side */}
            <div className="flex items-center gap-2 sm:gap-3">
              <TrophyIcon className="text-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
              <h1 className="text-xl sm:text-2xl font-bold">FIFA Tracker</h1>
            </div>

            {/* Profile and Menu - Right Side */}
            <div className="flex items-center gap-3">
              {/* Profile Icon */}
              <div className="flex items-center gap-2 p-2 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm text-gray-300">{user?.name}</span>
              </div>

              {/* Burger Menu */}
              <div className="relative profile-menu">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-lg hover:bg-[#1a1f2e] transition-colors"
                >
                  <Bars3Icon className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a1f2e] rounded-lg shadow-lg border border-gray-700 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          router.push('/profile');
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2d3748] hover:text-white transition-colors"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          signOut();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2d3748] hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

      {/* Tournament Info */}
      <div className="max-w-6xl mx-auto px-4 my-4 sm:my-6">
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
              <p className="text-xs sm:text-sm text-gray-400">{tournament?.start_date} - {tournament?.end_date}</p>
            </div>
            <span className={`text-white px-3 py-1 rounded-full text-xs sm:text-sm self-start sm:self-auto ${
              tournament?.completed ? 'bg-green-500' : 'bg-yellow-500'
            }`}>
              {tournament?.completed ? 'Completed' : 'In Progress'}
            </span>
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
            onMatchLogged={() => handleTabClick('history')}
          />
        )}

        {activeTab === 'settings' && (
          <Settings />
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
