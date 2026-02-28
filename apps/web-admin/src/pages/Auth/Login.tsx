import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { adminApi } from '../../api/client';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await adminApi.auth.login(email, password);
      const userData = response.user as {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: 'customer' | 'plumber' | 'admin';
      };

      if (userData.role !== 'admin') {
        setError('Accès réservé aux administrateurs');
        setIsLoading(false);
        return;
      }

      login(
        {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
        },
        response.accessToken
      );
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors" style={{ background: 'var(--bg-main)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Shattaf Admin</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Connexion au backoffice</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 transition-colors" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  placeholder="admin@shattaf.fr"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold uppercase tracking-wider hover:from-indigo-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
