import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react';
import { useRegister, useLogin } from '../../api/hooks/useAuth';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Téléphone invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      // Auto-login after registration
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });

      navigate('/account');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = registerMutation.isPending || loginMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Inscription</h1>
        <p className="text-gray-400 text-sm">
          Créez votre compte client
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Prénom"
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Nom"
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

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
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="tel"
              placeholder="Téléphone (0690...)"
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              {...register('phone')}
            />
          </div>
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
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

        <div>
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {registerMutation.isError && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
            Erreur lors de l'inscription. Cet email est peut-être déjà utilisé.
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <p className="text-center text-gray-400 text-sm">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-cyan-400 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
