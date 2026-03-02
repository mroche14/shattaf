import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Droplets, ArrowLeft } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Retour</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <Droplets className="w-10 h-10 text-cyan-400" />
          <span className="font-display font-bold text-2xl tracking-tighter">
            RESEAU <span className="text-cyan-400">PLOMB</span>
          </span>
        </div>

        {/* Form container */}
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
