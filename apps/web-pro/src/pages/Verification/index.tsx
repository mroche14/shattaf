import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

type TabFilter = 'pending' | 'mine';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-amber-500' },
  accepted: { label: 'Acceptée', color: 'text-blue-500' },
  in_progress: { label: 'En cours', color: 'text-cyan-500' },
  approved: { label: 'Approuvée', color: 'text-emerald-500' },
  rejected: { label: 'Rejetée', color: 'text-red-500' },
};

const VerificationsPage: React.FC = () => {
  const [tab, setTab] = useState<TabFilter>('mine');

  const { data: myVerifications, isLoading: loadingMine } = useQuery({
    queryKey: ['verifications', 'mine'],
    queryFn: () => apiClient.verifications.listMine(),
    enabled: tab === 'mine',
  });

  const { data: pendingVerifications, isLoading: loadingPending } = useQuery({
    queryKey: ['verifications', 'pending'],
    queryFn: () => apiClient.verifications.listPending(),
    enabled: tab === 'pending',
  });

  const isLoading = tab === 'mine' ? loadingMine : loadingPending;
  const verifications = tab === 'mine' ? myVerifications : pendingVerifications;

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
          Vérifications
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'mine' as const, label: 'Mes vérifications' },
          { key: 'pending' as const, label: 'Disponibles' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30'
                : ''
            }`}
            style={tab !== t.key ? { color: 'var(--text-secondary)', background: 'var(--bg-inner)', border: '1px solid var(--border-color)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
        </div>
      ) : !verifications?.length ? (
        <div className="text-center py-16">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            {tab === 'mine' ? 'Aucune vérification assignée' : 'Aucune vérification disponible'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map((v: any) => {
            const statusInfo = statusLabels[v.status] || { label: v.status, color: 'text-gray-500' };

            return (
              <Link
                key={v.id}
                to={`/verifications/${v.id}`}
                className="block card rounded-xl p-4 hover:scale-[1.01] transition-all"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      {v.approved === true ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : v.approved === false ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                        Vérification
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Mission {v.mission_id?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {(v.verification_fee / 100).toFixed(0)} €
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerificationsPage;
