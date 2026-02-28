import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  MapPin,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../api/client';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: 'En attente', class: 'badge-warning' },
  submitted: { label: 'Soumise', class: 'badge-info' },
  matched: { label: 'Matchée', class: 'badge-info' },
  quoted: { label: 'Devis envoyé', class: 'badge-info' },
  confirmed: { label: 'Confirmée', class: 'badge-success' },
  cancelled: { label: 'Annulée', class: 'badge-error' },
};

const BookingsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', statusFilter, page],
    queryFn: () =>
      adminApi.bookings.list({
        ...(statusFilter && { status: statusFilter }),
        page,
      }),
  });

  const bookings = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-indigo-400" />
            Réservations
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{data?.total || 0} réservations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
          style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Adresse</th>
                <th>Type WC</th>
                <th>Date souhaitée</th>
                <th>Statut</th>
                <th>Créée le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}>
                      <div className="h-12 bg-[var(--bg-surface)] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {booking.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td>
                      {booking.customer ? (
                        <span>
                          {booking.customer.user.firstName}{' '}
                          {booking.customer.user.lastName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm">{booking.addressCity}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {booking.addressPostalCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="capitalize">{booking.toiletType}</span>
                    </td>
                    <td>
                      {booking.preferredDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                          {new Date(booking.preferredDate).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_CONFIG[booking.status]?.class || 'badge-info'}`}
                      >
                        {STATUS_CONFIG[booking.status]?.label || booking.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td>
                      <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <Eye className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Aucune réservation</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
