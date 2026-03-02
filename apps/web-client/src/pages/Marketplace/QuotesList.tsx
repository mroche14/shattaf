import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Star, Clock, Check, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

const QuotesList: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', 'booking', bookingId],
    queryFn: () => apiClient.quotes.listByBooking(bookingId!),
    enabled: !!bookingId,
  });

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => apiClient.bookings.get(bookingId!),
    enabled: !!bookingId,
  });

  const acceptQuote = useMutation({
    mutationFn: (quoteId: string) => apiClient.quotes.accept(quoteId),
    onSuccess: async (quote) => {
      // Create order from accepted quote
      const order = await apiClient.orders.createFromQuote(quote.id);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      navigate(`/checkout/${order.id}`);
    },
  });

  const rejectQuote = useMutation({
    mutationFn: (quoteId: string) => apiClient.quotes.reject(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', 'booking', bookingId] });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <button
        onClick={() => navigate('/account/bookings')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Mes demandes
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold">Devis reçus</h1>
        {booking && (
          <p className="text-gray-400 text-sm mt-1">
            {booking.category} — {booking.addressCity}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      ) : !quotes?.length ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">En attente de devis</h2>
          <p className="text-gray-400 text-sm">
            Les plombiers à proximité préparent leurs propositions. Vous serez notifié dès qu'un devis arrive.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <div key={quote.id} className="glass rounded-xl p-4 space-y-3">
              {/* Plumber info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Plombier</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span>4.8</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-cyan-400">
                    {((quote.installationPrice ?? 0) / 100).toFixed(0)} €
                  </p>
                  <p className="text-xs text-gray-400">TTC</p>
                </div>
              </div>

              {/* Details */}
              <div className="text-sm space-y-1 border-t border-white/10 pt-3">
                {quote.proposedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date proposée</span>
                    <span>{new Date(quote.proposedDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {quote.proposedTimeSlot && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Créneau</span>
                    <span>{quote.proposedTimeSlot}</span>
                  </div>
                )}
                {quote.estimatedDurationMinutes && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Durée estimée</span>
                    <span>{quote.estimatedDurationMinutes} min</span>
                  </div>
                )}
                {quote.plumberNotes && (
                  <p className="text-gray-300 mt-2 italic">"{quote.plumberNotes}"</p>
                )}
              </div>

              {/* Actions */}
              {quote.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => rejectQuote.mutate(quote.id)}
                    disabled={rejectQuote.isPending}
                    className="flex-1 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Refuser
                  </button>
                  <button
                    onClick={() => acceptQuote.mutate(quote.id)}
                    disabled={acceptQuote.isPending}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:from-cyan-400 hover:to-blue-400"
                  >
                    {acceptQuote.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Accepter
                  </button>
                </div>
              )}

              {quote.status === 'accepted' && (
                <div className="text-center py-2 text-emerald-400 text-sm font-medium">
                  Devis accepté
                </div>
              )}

              {quote.status === 'rejected' && (
                <div className="text-center py-2 text-gray-500 text-sm">
                  Devis refusé
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {acceptQuote.isError && (
        <div className="mt-4 bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
          Erreur lors de l'acceptation du devis
        </div>
      )}
    </div>
  );
};

export default QuotesList;
