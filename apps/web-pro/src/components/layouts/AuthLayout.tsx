import React from 'react';
import { Outlet } from 'react-router-dom';
import { Droplets } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-2">
        <Droplets className="w-10 h-10 text-cyan-400" />
        <span className="font-display font-bold text-2xl tracking-tighter">
          RESEAU <span className="text-cyan-400">PLOMB</span>
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-8">Espace plombier partenaire</p>

      {/* Form container */}
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
