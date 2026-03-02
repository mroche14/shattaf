import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, Hash, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { useOnboardingStore } from '../../../store/onboarding';

const schema = z.object({
  companyName: z.string().min(2, 'Nom d\'entreprise requis'),
  siren: z.string().length(9, 'Le SIREN doit contenir 9 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
  siret: z.string().length(14, 'Le SIRET doit contenir 14 chiffres').regex(/^\d+$/, 'Chiffres uniquement').optional().or(z.literal('')),
  department: z.string().min(2, 'Département requis'),
});

type FormData = z.infer<typeof schema>;

const departments = [
  { value: '971', label: 'Guadeloupe (971)' },
  { value: '972', label: 'Martinique (972)' },
  { value: '973', label: 'Guyane (973)' },
];

const BusinessInfoStep: React.FC = () => {
  const { setStep, markComplete } = useOnboardingStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient.users.updatePlumberProfile({
        companyName: data.companyName,
        siren: data.siren,
        siret: data.siret || undefined,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber-profile'] });
      markComplete('business');
      setStep('documents');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const inputStyle = { background: 'var(--bg-inner)', borderColor: 'var(--border-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' };
  const inputClass = 'w-full rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Informations entreprise</h2>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Ces informations sont nécessaires pour la facturation et la conformité légale.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de l'entreprise</label>
          <div className="relative">
            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Ex: Martin Plomberie"
              className={`${inputClass} pl-12 pr-4`}
              style={inputStyle}
              {...register('companyName')}
            />
          </div>
          {errors.companyName && <p className="text-red-400 text-sm mt-1">{errors.companyName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SIREN</label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="123456789"
              maxLength={9}
              className={`${inputClass} pl-12 pr-4`}
              style={inputStyle}
              {...register('siren')}
            />
          </div>
          {errors.siren && <p className="text-red-400 text-sm mt-1">{errors.siren.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SIRET (optionnel)</label>
          <input
            type="text"
            placeholder="12345678900001"
            maxLength={14}
            className={`${inputClass} px-4`}
            style={inputStyle}
            {...register('siret')}
          />
          {errors.siret && <p className="text-red-400 text-sm mt-1">{errors.siret.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Département</label>
          <select
            className={`${inputClass} px-4`}
            style={inputStyle}
            {...register('department')}
          >
            <option value="">Sélectionner...</option>
            {departments.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department.message}</p>}
        </div>

        {mutation.isError && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
            Erreur lors de la sauvegarde
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuer'}
        </button>
      </form>
    </div>
  );
};

export default BusinessInfoStep;
