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

const MissionsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['missions', statusFilter, page],
    queryFn: () =>
      adminApi.missions.list({
        ...(statusFilter && { status: statusFilter }),
        page,
      }),
  });

  const missions = data?.items || [];
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
              ) : missions.length > 0 ? (
                missions.map((mission) => (
                  <tr key={mission.id}>
                    <td>
                      <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {mission.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td>
                      {mission.plumber ? (
                        <Link
                          to={`/plumbers/${mission.plumberId}`}
                          className="flex items-center gap-2 hover:text-indigo-400"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {mission.plumber.user.firstName.charAt(0)}
                            {mission.plumber.user.lastName.charAt(0)}
                          </div>
                          <span>
                            {mission.plumber.user.firstName} {mission.plumber.user.lastName}
                          </span>
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_CONFIG[mission.status]?.class || 'badge-info'}`}
                      >
                        {STATUS_CONFIG[mission.status]?.label || mission.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                        {new Date(mission.scheduledDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td>
                      {mission.checkinTime ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          {new Date(mission.checkinTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {mission.startTime ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          {new Date(mission.startTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {mission.completedAt ? (
                        <div className="flex items-center gap-1 text-sm text-emerald-400">
                          <Clock className="w-4 h-4" />
                          {new Date(mission.completedAt).toLocaleTimeString('fr-FR', {
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
                          {mission.photoBeforeUrls.length} avant
                        </span>
                        <span className="text-emerald-400">
                          {mission.photoAfterUrls.length} après
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

export default MissionsPage;
