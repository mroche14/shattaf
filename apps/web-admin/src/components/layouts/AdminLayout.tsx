import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Map,
  GitMerge,
  FileText,
  Package,
  ClipboardList,
  Receipt,
  Briefcase,
  History,
  FolderOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from '@shattaf/ui-kit';
import { useAuthStore } from '../../store/auth';
import { adminApi } from '../../api/client';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Couverture', href: '/coverage', icon: Map },
  { name: 'Matching', href: '/matching', icon: GitMerge, badgeKey: 'unmatched' },
  { name: 'Plombiers', href: '/plumbers', icon: Wrench, badgeKey: 'pendingPlumbers' },
  { name: 'Clients', href: '/customers', icon: Users },
  { name: 'Réservations', href: '/bookings', icon: ClipboardList, badgeKey: 'pendingBookings' },
  { name: 'Commandes', href: '/orders', icon: Package },
  { name: 'Missions', href: '/missions', icon: Briefcase },
  { name: 'Factures', href: '/invoices', icon: Receipt },
  { name: 'Projets', href: '/projects', icon: FolderOpen },
  { name: 'Produits', href: '/products', icon: FileText },
  { name: 'Audit', href: '/audit', icon: History },
];

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // Fetch badge counts
  const { data: unmatchedBookings } = useQuery({
    queryKey: ['unmatchedBookings'],
    queryFn: () => adminApi.matching.getUnmatchedBookings(),
    staleTime: 60000,
  });

  const { data: plumbersData } = useQuery({
    queryKey: ['plumbers', 'pending'],
    queryFn: () => adminApi.plumbers.list({ status: 'pending' }),
    staleTime: 60000,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings', 'submitted'],
    queryFn: () => adminApi.bookings.list({ status: 'submitted' }),
    staleTime: 60000,
  });

  const badges: Record<string, number> = {
    unmatched: unmatchedBookings?.length || 0,
    pendingPlumbers: plumbersData?.total || 0,
    pendingBookings: bookingsData?.total || 0,
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-root)' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          background: 'var(--bg-panel)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className="flex items-center justify-between h-16 px-6"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-main)' }}>Réseau Plomb</h1>
                <span className="text-xs text-indigo-500 font-medium">Admin</span>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    {badgeCount > 0 && (
                      <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--text-main)' }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="h-16 flex items-center px-4 lg:px-8 gap-4"
          style={{
            background: 'var(--bg-panel)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <button
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
