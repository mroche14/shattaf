import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, Building, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Téléphone invalide'),
  companyName: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      // Register as plumber
      await apiClient.auth.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        isPlumber: true,
      });

      // Auto-login
      const tokenResponse = await apiClient.auth.login({
        email: data.email,
        password: data.password,
      });

      useAuthStore.setState({ accessToken: tokenResponse.accessToken });
      const user = await apiClient.auth.me();

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
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const inputStyle = { background: 'var(--bg-inner)', borderColor: 'var(--border-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' };
  const inputClass = "w-full rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors duration-200";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Devenir partenaire</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Créez votre compte plombier
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Prénom"
                className={`${inputClass} pl-12 pr-4`}
                style={inputStyle}
                {...register('firstName')}
              />
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Nom"
              className={`${inputClass} px-4`}
              style={inputStyle}
              {...register('lastName')}
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Entreprise (optionnel)"
              className={`${inputClass} pl-12 pr-4`}
              style={inputStyle}
              {...register('companyName')}
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="email"
              placeholder="Email"
              className={`${inputClass} pl-12 pr-4`}
              style={inputStyle}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="tel"
              placeholder="Téléphone (0690...)"
              className={`${inputClass} pl-12 pr-4`}
              style={inputStyle}
              {...register('phone')}
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="password"
              placeholder="Mot de passe"
              className={`${inputClass} pl-12 pr-4`}
              style={inputStyle}
              {...register('password')}
            />
          </div>
        </div>

        <div>
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            className={`${inputClass} px-4`}
            style={inputStyle}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {registerMutation.isError && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
            Erreur lors de l'inscription
          </div>
        )}

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {registerMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Déjà partenaire ?{' '}
        <Link to="/login" className="text-cyan-400 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
