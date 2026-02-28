import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const tokenResponse = await apiClient.auth.login(data);
      useAuthStore.setState({ accessToken: tokenResponse.accessToken });
      const user = await apiClient.auth.me();

      if (user.role !== 'plumber') {
        throw new Error('Cette application est réservée aux plombiers');
      }

      return { tokenResponse, user };
    },
    onSuccess: ({ tokenResponse, user }) => {
      setAuth(tokenResponse, user);
      navigate('/');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Connexion</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Accédez à vos missions
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors duration-200"
              style={{ background: 'var(--bg-inner)', borderColor: 'var(--border-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="password"
              placeholder="Mot de passe"
              className="w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors duration-200"
              style={{ background: 'var(--bg-inner)', borderColor: 'var(--border-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {loginMutation.isError && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
            {(loginMutation.error as Error)?.message || 'Identifiants incorrects'}
          </div>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loginMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Pas encore partenaire ?{' '}
        <Link to="/register" className="text-cyan-400 hover:underline">
          Devenir plombier partenaire
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
