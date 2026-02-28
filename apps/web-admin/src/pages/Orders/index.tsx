import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../api/client';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending_payment: { label: 'Paiement en attente', class: 'badge-warning' },
  paid: { label: 'Payée', class: 'badge-success' },
  scheduled: { label: 'Planifiée', class: 'badge-info' },
  in_progress: { label: 'En cours', class: 'badge-info' },
  completed: { label: 'Terminée', class: 'badge-success' },
  cancelled: { label: 'Annulée', class: 'badge-error' },
  refunded: { label: 'Remboursée', class: 'badge-error' },
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

const OrdersPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter, page],
    queryFn: () =>
      adminApi.orders.list({
        ...(statusFilter && { status: statusFilter }),
        page,
      }),
  });

  const orders = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-400" />
            Commandes
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{data?.total || 0} commandes</p>
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
                <th>Statut</th>
                <th>Produit</th>
                <th>Installation</th>
                <th>Commission</th>
                <th>Total</th>
                <th>Date planifiée</th>
                <th>Créée le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9}>
                      <div className="h-12 bg-[var(--bg-surface)] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {order.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_CONFIG[order.status]?.class || 'badge-info'}`}
                      >
                        {STATUS_CONFIG[order.status]?.label || order.status}
                      </span>
                    </td>
                    <td className="text-right font-mono">
                      {formatPrice(order.productAmount)}
                    </td>
                    <td className="text-right font-mono">
                      {formatPrice(order.installationAmount)}
                    </td>
                    <td className="text-right font-mono text-indigo-400">
                      {formatPrice(order.platformFee)}
                    </td>
                    <td className="text-right font-mono font-bold">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td>
                      {order.scheduledDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                          {new Date(order.scheduledDate).toLocaleDateString('fr-FR')}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
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
                  <td colSpan={9} className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Aucune commande</p>
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
                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
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

export default OrdersPage;
