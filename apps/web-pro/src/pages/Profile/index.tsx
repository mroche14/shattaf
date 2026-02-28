import React from 'react';
import { User, Building, Shield, LogOut, ChevronRight, Star, Sun, Moon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';

const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();

  const { data: profile } = useQuery({
    queryKey: ['plumberProfile'],
    queryFn: () => apiClient.users.getPlumberProfile(),
  });

  const { data: allJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.jobs.list(),
  });

  const completedJobsCount = allJobs?.filter((j) => j.status === 'completed').length || 0;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-display text-2xl font-bold mb-6">Mon profil</h1>

      {/* User info */}
      <div className="glass rounded-2xl p-6 mb-6 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl">
              {user?.firstName} {user?.lastName}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            {profile && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm">
                  {profile.averageRating?.toFixed(1) || 'N/A'}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  ({profile.totalRatings || 0} avis)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-2xl p-4 transition-colors duration-200">
          <p className="text-2xl font-bold">{completedJobsCount}</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Missions terminées</p>
        </div>
        <div className="glass rounded-2xl p-4 transition-colors duration-200">
          <span
            className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
              profile?.status === 'active'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
            }`}
          >
            {profile?.status === 'active' ? 'Actif' : 'En attente'}
          </span>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Statut</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="glass rounded-2xl overflow-hidden mb-6 transition-colors duration-200">
        <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-cyan-500" />
            <span>Mon entreprise</span>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        <div style={{ borderColor: 'var(--border-color)' }} className="border-t" />

        <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-500" />
            <span>Documents & assurances</span>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Stripe status */}
      <div className="glass rounded-2xl p-4 mb-6 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Paiements Stripe</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {profile?.stripeChargesEnabled
                ? 'Compte vérifié'
                : 'Configuration requise'}
            </p>
          </div>
          <span
            className={`w-3 h-3 rounded-full ${
              profile?.stripeChargesEnabled ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
        </div>
      </div>

      {/* Theme toggle */}
      <div className="glass rounded-2xl p-4 mb-6 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-blue-400" />
            )}
            <div>
              <p className="font-medium">Apparence</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {theme === 'light' ? 'Mode clair' : 'Mode sombre'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
              theme === 'dark' ? 'bg-cyan-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl transition-colors duration-200 bg-red-500/10 text-red-400 hover:bg-red-500/20"
        style={{ border: '1px solid var(--border-color)' }}
      >
        <LogOut className="w-5 h-5" />
        Se déconnecter
      </button>
    </div>
  );
};

export default ProfilePage;
