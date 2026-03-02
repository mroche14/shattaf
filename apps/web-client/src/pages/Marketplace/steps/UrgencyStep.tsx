import React from 'react';
import { ArrowLeft, Clock, Zap, Calendar, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { useMarketplaceStore } from '../../../store/marketplace';

const urgencyOptions = [
  { id: 'urgent' as const, label: 'Urgent', description: 'Intervention sous 24-48h', icon: Zap },
  { id: 'normal' as const, label: 'Normal', description: 'Dans la semaine', icon: Clock },
  { id: 'flexible' as const, label: 'Flexible', description: 'Pas de contrainte de délai', icon: Calendar },
];

const UrgencyStep: React.FC = () => {
  const navigate = useNavigate();
  const {
    urgency, setUrgency, setStep,
    category, description, addressStreet, addressCity, addressPostalCode,
    addressLat, addressLng, reset,
  } = useMarketplaceStore();

  const createBooking = useMutation({
    mutationFn: () =>
      apiClient.bookings.create({
        type: 'marketplace',
        category,
        description,
        addressStreet,
        addressCity,
        addressPostalCode,
        addressLat: addressLat ?? undefined,
        addressLng: addressLng ?? undefined,
        additionalNotes: `Urgence: ${urgency}`,
      } as any),
    onSuccess: (booking) => {
      reset();
      navigate(`/account/bookings/${booking.id}`);
    },
  });

  return (
    <div className="space-y-6">
      <button onClick={() => setStep('address')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div>
        <h2 className="text-xl font-bold mb-1">Urgence et confirmation</h2>
        <p className="text-gray-400 text-sm">Quel est votre niveau d'urgence ?</p>
      </div>

      {/* Urgency options */}
      <div className="space-y-3">
        {urgencyOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setUrgency(opt.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
              urgency === opt.id
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <opt.icon className={`w-5 h-5 ${urgency === opt.id ? 'text-cyan-400' : 'text-gray-400'}`} />
            <div className="text-left">
              <p className="font-medium">{opt.label}</p>
              <p className="text-sm text-gray-400">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="glass rounded-xl p-4">
        <h3 className="font-medium mb-2 text-sm">Récapitulatif</h3>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-400">Catégorie</dt>
            <dd>{category}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Adresse</dt>
            <dd className="text-right">{addressStreet}, {addressCity}</dd>
          </div>
        </dl>
      </div>

      {createBooking.isError && (
        <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
          Erreur lors de la création de la demande
        </div>
      )}

      <button
        onClick={() => createBooking.mutate()}
        disabled={createBooking.isPending}
        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 transition-all"
      >
        {createBooking.isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Envoi...
          </span>
        ) : (
          'Envoyer ma demande'
        )}
      </button>
    </div>
  );
};

export default UrgencyStep;
