import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { adminApi } from '../../api/client';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  scheduled: { label: 'Planifiée', class: 'badge-info' },
  en_route: { label: 'En route', class: 'badge-info' },
  checked_in: { label: 'Arrivé', class: 'badge-info' },
  in_progress: { label: 'En cours', class: 'badge-warning' },
  completed: { label: 'Terminée', class: 'badge-success' },
  cancelled: { label: 'Annulée', class: 'badge-error' },
};

const JobsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', statusFilter, page],
    queryFn: () =>
      adminApi.jobs.list({
        ...(statusFilter && { status: statusFilter }),
        page,
      }),
  });

  const jobs = data?.items || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-indigo-400" />
            Missions
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{data?.total || 0} missions</p>
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
                <th>Plombier</th>
                <th>Statut</th>
                <th>Date planifiée</th>
                <th>Check-in</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Photos</th>
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
              ) : jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {job.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td>
                      {job.plumber ? (
                        <Link
                          to={`/plumbers/${job.plumberId}`}
                          className="flex items-center gap-2 hover:text-indigo-400"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {job.plumber.user.firstName.charAt(0)}
                            {job.plumber.user.lastName.charAt(0)}
                          </div>
                          <span>
                            {job.plumber.user.firstName} {job.plumber.user.lastName}
                          </span>
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_CONFIG[job.status]?.class || 'badge-info'}`}
                      >
                        {STATUS_CONFIG[job.status]?.label || job.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                        {new Date(job.scheduledDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td>
                      {job.checkinTime ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          {new Date(job.checkinTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {job.startTime ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          {new Date(job.startTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {job.completedAt ? (
                        <div className="flex items-center gap-1 text-sm text-emerald-400">
                          <Clock className="w-4 h-4" />
                          {new Date(job.completedAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-cyan-400">
                          {job.photoBeforeUrls.length} avant
                        </span>
                        <span className="text-emerald-400">
                          {job.photoAfterUrls.length} après
                        </span>
                      </div>
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
                    <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Aucune mission</p>
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

export default JobsPage;
