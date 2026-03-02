import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, ClipboardCheck, Wallet, User, Droplets } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

const ProLayout: React.FC = () => {
  const location = useLocation();

  // Fetch pending missions count for badge
  const { data: allMissions } = useQuery({
    queryKey: ['missions'],
    queryFn: () => apiClient.missions.list(),
    staleTime: 30000,
  });

  const pendingCount = allMissions?.filter(
    (m) => m.status === 'scheduled' || m.status === 'en_route'
  ).length || 0;

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil', badge: 0 },
    { path: '/missions', icon: Briefcase, label: 'Missions', badge: pendingCount },
    { path: '/verifications', icon: ClipboardCheck, label: 'Vérif.', badge: 0 },
    { path: '/earnings', icon: Wallet, label: 'Revenus', badge: 0 },
    { path: '/profile', icon: User, label: 'Profil', badge: 0 },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar - hidden on mobile */}
      <aside
        className="hidden lg:flex flex-col w-64 glass fixed left-0 top-0 bottom-0"
        style={{ borderRight: '1px solid var(--border-color)' }}
      >
        {/* Logo */}
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg" style={{ color: 'var(--text-main)' }}>RESEAU</span>
              <span className="text-cyan-500 font-bold text-lg ml-1">PLOMB</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                        : ''
                    }`}
                    style={!isActive ? {
                      color: 'var(--text-secondary)',
                    } : undefined}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.color = 'var(--text-main)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
            Réseau Plomb v1.0
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col pb-20 lg:pb-0 lg:ml-64">
        {/* Main content */}
        <main className="flex-1 pt-6 lg:pt-10">
          <div className="lg:max-w-4xl lg:mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom navigation - mobile only */}
      <nav
        className="lg:hidden glass fixed bottom-0 left-0 right-0 pb-safe"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                  isActive ? 'text-cyan-500' : ''
                }`}
                style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
              >
                <div className="relative">
                  <item.icon className="w-6 h-6" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ProLayout;
