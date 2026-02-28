import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { JobStatus } from '@shattaf/shared-types';

const statusTabs: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'scheduled', label: 'Planifiées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminées' },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Planifiée', color: 'bg-cyan-500/20 text-cyan-300' },
  en_route: { label: 'En route', color: 'bg-amber-500/20 text-amber-300' },
  checked_in: { label: 'Sur place', color: 'bg-amber-500/20 text-amber-300' },
  in_progress: { label: 'En cours', color: 'bg-cyan-500/20 text-cyan-300' },
  pending_signature: { label: 'Signature', color: 'bg-amber-500/20 text-amber-300' },
  completed: { label: 'Terminée', color: 'bg-emerald-500/20 text-emerald-300' },
  cancelled: { label: 'Annulée', color: 'bg-red-500/20 text-red-300' },
};

const MissionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('all');

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', activeTab !== 'all' ? activeTab : undefined],
    queryFn: () => apiClient.jobs.list(activeTab !== 'all' ? activeTab : undefined),
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-display text-2xl font-bold mb-6">Mes missions</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 -mx-4 px-4">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
              activeTab === tab.value
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
            style={activeTab !== tab.value ? { background: 'var(--bg-glass)' } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-4 animate-pulse transition-colors duration-200">
              <div className="h-5 rounded w-24 mb-3" style={{ background: 'var(--bg-inner)' }} />
              <div className="h-4 rounded w-3/4 mb-2" style={{ background: 'var(--bg-inner)' }} />
              <div className="h-4 rounded w-1/2" style={{ background: 'var(--bg-inner)' }} />
            </div>
          ))}
        </div>
      ) : jobs?.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center transition-colors duration-200">
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Aucune mission</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs?.map((job) => {
            const status = statusLabels[job.status] || {
              label: job.status,
              color: 'bg-gray-500/20 text-gray-300',
            };

            return (
              <Link
                key={job.id}
                to={`/missions/${job.id}`}
                className="glass rounded-2xl p-4 block hover:border-cyan-500/30 transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-xs font-bold uppercase mb-2 ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <p className="font-medium mb-2">Installation shattaf</p>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Voir l'adresse
                      </span>
                      {job.checkinTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(job.checkinTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MissionsPage;
