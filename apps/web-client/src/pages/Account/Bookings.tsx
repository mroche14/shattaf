import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useBookings } from '../../api/hooks/useBookings';
import { formatDate } from '@shattaf/shared-types';

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'text-gray-400' },
  submitted: { label: 'En attente', color: 'text-cyan-400' },
  quoted: { label: 'Devis reçu', color: 'text-amber-400' },
  accepted: { label: 'Accepté', color: 'text-emerald-400' },
  expired: { label: 'Expiré', color: 'text-red-400' },
};

const MyBookingsPage: React.FC = () => {
  const { data: bookings, isLoading } = useBookings();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/account"
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Mes réservations</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-4 animate-pulse">
              <div className="h-5 bg-slate-700/50 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-700/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Aucune réservation</h2>
          <p className="text-gray-400 mb-6">
            Vous n'avez pas encore de réservation.
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-primary text-white font-bold"
          >
            Réserver une installation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings?.map((booking) => {
            const status = statusLabels[booking.status] || { label: booking.status, color: 'text-gray-400' };

            return (
              <Link
                key={booking.id}
                to={`/account/bookings/${booking.id}`}
                className="glass rounded-2xl p-4 block hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`text-xs font-bold uppercase ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">
                      {formatDate(booking.createdAt)}
                    </p>
                  </div>
                  {booking.preferredDate && (
                    <div className="text-right text-sm">
                      <p className="text-gray-400">Préférence</p>
                      <p className="font-medium">
                        {formatDate(booking.preferredDate)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {booking.addressStreet}, {booking.addressCity}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default MyBookingsPage;
