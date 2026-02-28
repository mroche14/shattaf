import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ShoppingBag, User, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useLogout } from '../../api/hooks/useAuth';

const AccountPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  const menuItems = [
    { path: '/account/bookings', icon: Calendar, label: 'Mes réservations' },
    { path: '/account/orders', icon: ShoppingBag, label: 'Mes commandes' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* User info */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="glass rounded-2xl overflow-hidden mb-6">
        {menuItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${
              index > 0 ? 'border-t border-white/10' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5 text-cyan-400" />
              <span>{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-300 hover:bg-red-500/20 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Se déconnecter
      </button>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default AccountPage;
