import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useLogin } from '../../api/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      navigate('/account');
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Connexion</h1>
        <p className="text-gray-400 text-sm">
          Accédez à votre espace client
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              placeholder="Mot de passe"
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {loginMutation.isError && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
            Email ou mot de passe incorrect
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

      <p className="text-center text-gray-400 text-sm">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-cyan-400 hover:underline">
          S'inscrire
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
