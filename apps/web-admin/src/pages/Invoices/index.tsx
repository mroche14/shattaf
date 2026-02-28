import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
} from 'lucide-react';
import { adminApi } from '../../api/client';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  draft: { label: 'Brouillon', class: 'badge-info' },
  issued: { label: 'Émise', class: 'badge-warning' },
  paid: { label: 'Payée', class: 'badge-success' },
  cancelled: { label: 'Annulée', class: 'badge-error' },
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

const InvoicesPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page],
    queryFn: () => adminApi.invoices.list({ page }),
  });

  const invoices = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-400" />
            Factures
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{data?.total || 0} factures</p>
        </div>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Client</th>
                <th>Plombier</th>
                <th>Produit</th>
                <th>Installation</th>
                <th>TVA</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10}>
                      <div className="h-12 bg-[var(--bg-surface)] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="font-mono font-medium">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                    </td>
                    <td>
                      {invoice.customer ? (
                        <span>
                          {invoice.customer.user.firstName}{' '}
                          {invoice.customer.user.lastName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {invoice.plumber ? (
                        <span>
                          {invoice.plumber.user.firstName}{' '}
                          {invoice.plumber.user.lastName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td className="text-right font-mono">
                      {formatPrice(invoice.productAmount)}
                    </td>
                    <td className="text-right font-mono">
                      {formatPrice(invoice.installationAmount)}
                    </td>
                    <td className="text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {formatPrice(invoice.vatAmount)}
                    </td>
                    <td className="text-right font-mono font-bold">
                      {formatPrice(invoice.totalAmount)}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_CONFIG[invoice.status]?.class || 'badge-info'}`}
                      >
                        {STATUS_CONFIG[invoice.status]?.label || invoice.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <Eye className="w-5 h-5 text-[var(--text-secondary)]" />
                        </button>
                        <a
                          href={adminApi.invoices.downloadPdf(invoice.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Download className="w-5 h-5 text-[var(--text-secondary)]" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <Receipt className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-[var(--text-secondary)]">Aucune facture</p>
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

export default InvoicesPage;
