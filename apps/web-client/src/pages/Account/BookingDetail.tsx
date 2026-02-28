import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  Circle,
  Loader2,
  Phone,
  User
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { formatDate } from '@shattaf/shared-types';

const statusSteps = [
  { key: 'submitted', label: 'Demande soumise', description: 'Votre demande est en cours de traitement' },
  { key: 'quoted', label: 'Devis reçu', description: 'Un plombier vous a envoyé un devis' },
  { key: 'accepted', label: 'Devis accepté', description: 'Votre installation est planifiée' },
  { key: 'scheduled', label: 'Installation programmée', description: 'Le plombier va intervenir' },
  { key: 'completed', label: 'Terminée', description: 'Installation effectuée avec succès' },
];

const getStepIndex = (status: string): number => {
  if (status === 'draft') return -1;
  const index = statusSteps.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
};

const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => apiClient.bookings.get(id!),
    enabled: !!id,
  });

  const { data: quotes } = useQuery({
    queryKey: ['quotes', 'booking', id],
    queryFn: () => apiClient.quotes.listByBooking(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded w-1/2 mb-6" />
        <div className="glass rounded-2xl p-6">
          <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-4" />
          <div className="h-4 bg-slate-700/50 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Réservation non trouvée</h1>
        <Link to="/account/bookings" className="text-cyan-400 hover:underline">
          Retour aux réservations
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(booking.status);
  const acceptedQuote = quotes?.find(q => q.status === 'accepted');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/account/bookings"
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Suivi de réservation</h1>
          <p className="text-gray-400 text-sm">
            Créée le {formatDate(booking.createdAt)}
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <p className="font-medium">{booking.addressStreet}</p>
            <p className="text-gray-400">
              {booking.addressPostalCode} {booking.addressCity}
            </p>
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Statut de votre demande
        </h2>

        <div className="relative">
          {statusSteps.map((step, index) => {
            const isComplete = index <= currentStep;
            const isCurrent = index === currentStep;
            const isLast = index === statusSteps.length - 1;

            return (
              <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-48px)]
                      ${isComplete ? 'bg-cyan-500' : 'bg-slate-700'}`}
                    style={{ transform: `translateY(${index * 72}px)` }}
                  />
                )}

                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  {isComplete ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center
                      ${isCurrent ? 'bg-cyan-500 animate-pulse' : 'bg-cyan-500/20'}`}>
                      <CheckCircle className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-cyan-400'}`} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <Circle className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 ${isComplete ? '' : 'opacity-50'}`}>
                  <p className={`font-medium ${isCurrent ? 'text-cyan-400' : ''}`}>
                    {step.label}
                  </p>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quote info (if exists) */}
      {acceptedQuote && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Votre plombier
          </h2>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {(acceptedQuote as any).plumber?.user?.firstName?.charAt(0) || 'P'}
            </div>
            <div>
              <p className="font-medium">
                {(acceptedQuote as any).plumber?.user?.firstName} {(acceptedQuote as any).plumber?.user?.lastName}
              </p>
              <p className="text-sm text-gray-400">Plombier certifié</p>
            </div>
          </div>

          {acceptedQuote.proposedDate && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm text-gray-400">Intervention prévue</p>
                <p className="font-medium">{formatDate(acceptedQuote.proposedDate)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quotes list (if pending) */}
      {booking.status === 'quoted' && quotes && quotes.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-bold mb-4">Devis reçus</h2>
          <div className="space-y-3">
            {quotes.filter(q => q.status === 'pending').map((quote) => (
              <div
                key={quote.id}
                className="p-4 rounded-xl bg-slate-700/50 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {(quote as any).plumber?.user?.firstName} {(quote as any).plumber?.user?.lastName}
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {(quote.installationPrice / 100).toFixed(2)}€
                  </span>
                </div>
                {quote.proposedDate && (
                  <p className="text-sm text-gray-400">
                    Proposé le {formatDate(quote.proposedDate)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-4 text-center">
            Acceptez un devis pour confirmer votre installation
          </p>
        </div>
      )}

      {/* Help */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold mb-3">Besoin d'aide ?</h2>
        <p className="text-gray-400 text-sm mb-4">
          Notre équipe est disponible pour répondre à vos questions.
        </p>
        <a
          href="mailto:contact@orizon-aqua.gp"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
        >
          <Phone className="w-5 h-5" />
          Nous contacter
        </a>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default BookingDetailPage;
