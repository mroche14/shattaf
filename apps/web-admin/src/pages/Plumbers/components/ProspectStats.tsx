import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Building,
  UserCheck,
} from 'lucide-react';
import { adminApi } from '../../../api/client';

const DEPARTMENT_NAMES: Record<string, string> = {
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
  '974': 'Réunion',
};

const STATUS_LABELS: Record<string, string> = {
  not_contacted: 'Non contactés',
  contacted: 'Contactés',
  interested: 'Intéressés',
  not_interested: 'Non intéressés',
  registered: 'Inscrits',
};

const ProspectStats: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['prospect-stats'],
    queryFn: () => adminApi.prospects.getStats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="stat-card p-4">
            <div className="h-16 bg-[var(--bg-surface)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4 mb-6">
      {/* Main stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total prospects</p>
            </div>
          </div>
        </div>

        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.withTelephone.toLocaleString()}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Avec téléphone</p>
            </div>
          </div>
        </div>

        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.withEmail.toLocaleString()}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Avec email</p>
            </div>
          </div>
        </div>

        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.individuels.toLocaleString()}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Indépendants</p>
            </div>
          </div>
        </div>

        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Building className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.societes.toLocaleString()}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sociétés</p>
            </div>
          </div>
        </div>

        <div className="stat-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.keys(stats.byDepartement).length}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Départements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(stats.byStatus).map(([status, count]) => (
          <span
            key={status}
            className={`px-3 py-1 rounded-full text-sm ${
              status === 'not_contacted'
                ? 'bg-gray-500/20 text-gray-300'
                : status === 'contacted'
                ? 'bg-blue-500/20 text-blue-300'
                : status === 'interested'
                ? 'bg-emerald-500/20 text-emerald-300'
                : status === 'not_interested'
                ? 'bg-red-500/20 text-red-300'
                : 'bg-indigo-500/20 text-indigo-300'
            }`}
          >
            {STATUS_LABELS[status] || status}: {count.toLocaleString()}
          </span>
        ))}
      </div>

      {/* Department breakdown */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(stats.byDepartement)
          .sort(([, a], [, b]) => b - a)
          .map(([dept, count]) => (
            <span
              key={dept}
              className="px-3 py-1 rounded-full text-sm"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            >
              {DEPARTMENT_NAMES[dept] || dept} ({dept}): {count.toLocaleString()}
            </span>
          ))}
      </div>
    </div>
  );
};

export default ProspectStats;
