import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { useOnboardingStore } from '../../../store/onboarding';

const schema = z.object({
  department: z.string().min(2, 'Département requis'),
  city: z.string().min(2, 'Ville requise'),
  radiusKm: z.number().min(5, 'Minimum 5 km').max(100, 'Maximum 100 km'),
});

type FormData = z.infer<typeof schema>;

const departments = [
  { value: '971', label: 'Guadeloupe (971)' },
  { value: '972', label: 'Martinique (972)' },
  { value: '973', label: 'Guyane (973)' },
];

// Approximate center coordinates by department
const deptCenters: Record<string, { lat: number; lng: number }> = {
  '971': { lat: 16.265, lng: -61.551 },
  '972': { lat: 14.636, lng: -61.024 },
  '973': { lat: 4.937, lng: -52.326 },
};

const InterventionZonesStep: React.FC = () => {
  const { setStep, markComplete } = useOnboardingStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const center = deptCenters[data.department] || deptCenters['971'];

      // Add intervention location
      await apiClient.users.updatePlumberProfile({
        serviceAreaLat: center.lat,
        serviceAreaLng: center.lng,
        serviceAreaRadiusKm: data.radiusKm,
      } as any);

      // Add as intervention location point
      await (apiClient as any).request('POST', '/users/me/plumber-profile/intervention-locations', {
        lat: center.lat,
        lng: center.lng,
        address: `${data.city}, ${data.department}`,
        label: 'Base',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber-profile'] });
      markComplete('zones');
      setStep('stripe');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { radiusKm: 15 },
  });

  const inputStyle = { background: 'var(--bg-inner)', borderColor: 'var(--border-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' };
  const inputClass = 'w-full rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Zone d'intervention</h2>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Définissez votre zone géographique pour recevoir des missions à proximité.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
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

        <div>
          <label className="block text-sm font-medium mb-1">Ville de base</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Ex: Pointe-à-Pitre"
              className={`${inputClass} pl-12 pr-4`}
              style={inputStyle}
              {...register('city')}
            />
          </div>
          {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rayon d'intervention (km)</label>
          <input
            type="number"
            min={5}
            max={100}
            className={`${inputClass} px-4`}
            style={inputStyle}
            {...register('radiusKm', { valueAsNumber: true })}
          />
          {errors.radiusKm && <p className="text-red-400 text-sm mt-1">{errors.radiusKm.message}</p>}
        </div>

        <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--bg-inner)', color: 'var(--text-secondary)' }}>
          <p>Vous pourrez ajouter plusieurs zones d'intervention depuis votre profil.</p>
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

export default InterventionZonesStep;
