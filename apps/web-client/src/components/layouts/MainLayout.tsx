import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Droplets, Home, ShoppingBag, Wrench, User, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/products', icon: ShoppingBag, label: 'Produits' },
    { path: '/marketplace', icon: Wrench, label: 'Services' },
    { path: isAuthenticated ? '/account' : '/login', icon: User, label: 'Compte' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Droplets className="w-7 h-7 text-cyan-400" />
            <span className="font-display font-bold text-lg tracking-tighter">
              RESEAU <span className="text-cyan-400">PLOMB</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-cyan-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl btn-primary text-white text-sm font-bold"
              >
                Connexion
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden glass border-t border-white/10">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    location.pathname === item.path
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden glass fixed bottom-0 left-0 right-0 safe-area-bottom border-t border-white/10">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                location.pathname === item.path
                  ? 'text-cyan-400'
                  : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
