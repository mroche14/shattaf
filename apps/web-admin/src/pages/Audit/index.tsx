import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Briefcase,
  ClipboardList,
  Receipt,
  FileText,
} from 'lucide-react';
import { adminApi } from '../../api/client';

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  user: <User className="w-4 h-4" />,
  plumber: <User className="w-4 h-4" />,
  customer: <User className="w-4 h-4" />,
  product: <Package className="w-4 h-4" />,
  booking: <ClipboardList className="w-4 h-4" />,
  order: <Package className="w-4 h-4" />,
  job: <Briefcase className="w-4 h-4" />,
  invoice: <Receipt className="w-4 h-4" />,
  quote: <FileText className="w-4 h-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'text-emerald-400 bg-emerald-500/10',
  update: 'text-cyan-400 bg-cyan-500/10',
  delete: 'text-red-400 bg-red-500/10',
  login: 'text-indigo-400 bg-indigo-500/10',
  logout: 'text-gray-400 bg-gray-500/10',
  status_change: 'text-amber-400 bg-amber-500/10',
};

const ENTITY_TYPES = [
  { value: '', label: 'Toutes les entités' },
  { value: 'user', label: 'Utilisateurs' },
  { value: 'plumber', label: 'Plombiers' },
  { value: 'customer', label: 'Clients' },
  { value: 'product', label: 'Produits' },
  { value: 'booking', label: 'Réservations' },
  { value: 'order', label: 'Commandes' },
  { value: 'job', label: 'Missions' },
  { value: 'invoice', label: 'Factures' },
  { value: 'quote', label: 'Devis' },
];

const AuditPage: React.FC = () => {
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', entityTypeFilter, page],
    queryFn: () =>
      adminApi.audit.list({
        ...(entityTypeFilter && { entityType: entityTypeFilter }),
        page,
        limit: 50,
      }),
  });

  const logs = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / 50);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <History className="w-7 h-7 text-indigo-400" />
            Journal d'audit
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Historique complet des actions sur la plateforme
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={entityTypeFilter}
          onChange={(e) => {
            setEntityTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
          style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
        >
          {ENTITY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="stat-card">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      ACTION_COLORS[log.action] || 'text-gray-400 bg-gray-500/10'
                    }`}
                  >
                    {ENTITY_ICONS[log.entityType] || <FileText className="w-4 h-4" />}
                  </div>
                  {index < logs.length - 1 && (
                    <div className="w-px h-full mt-2" style={{ background: 'var(--border-color)' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`badge ${
                            ACTION_COLORS[log.action]
                              ? ACTION_COLORS[log.action].replace('text-', 'badge-').split(' ')[0]
                              : 'badge-info'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="font-medium capitalize">{log.entityType}</span>
                        <span className="font-mono text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          {log.entityId.slice(0, 8)}...
                        </span>
                      </div>

                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <details className="cursor-pointer">
                            <summary className="hover:text-white transition-colors">
                              Voir les changements
                            </summary>
                            <pre className="mt-2 p-2 rounded-lg text-xs overflow-x-auto" style={{ background: 'var(--bg-surface)' }}>
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-sm flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                      <p>
                        {new Date(log.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      <p>
                        {new Date(log.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                      {log.ipAddress && (
                        <p className="font-mono text-xs mt-1">{log.ipAddress}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Aucun événement dans le journal</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
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

export default AuditPage;
