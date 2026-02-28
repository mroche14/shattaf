import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Wrench,
  Search,
  Star,
  ChevronRight,
  Building,
  Mail,
  Users,
  UserPlus,
} from 'lucide-react';
import { adminApi } from '../../api/client';
import ProspectsList from './ProspectsList';

const DEPARTMENT_NAMES: Record<string, string> = {
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: 'En attente', class: 'badge-warning' },
  active: { label: 'Actif', class: 'badge-success' },
  suspended: { label: 'Suspendu', class: 'badge-error' },
  inactive: { label: 'Inactif', class: 'badge-info' },
};

type TabType = 'registered' | 'prospects';

const PlumbersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('registered');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['plumbers', statusFilter, departmentFilter],
    queryFn: () =>
      adminApi.plumbers.list({
        ...(statusFilter && { status: statusFilter }),
        ...(departmentFilter && { department: departmentFilter }),
      }),
    enabled: activeTab === 'registered',
  });

  const filteredPlumbers = data?.items.filter((plumber) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      plumber.user.firstName.toLowerCase().includes(search) ||
      plumber.user.lastName.toLowerCase().includes(search) ||
      plumber.user.email.toLowerCase().includes(search) ||
      plumber.companyName?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Wrench className="w-7 h-7 text-indigo-400" />
            Plombiers
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Gestion des plombiers inscrits et prospects
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-surface)' }}>
        <button
          onClick={() => setActiveTab('registered')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'registered'
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-white/5'
          }`}
          style={activeTab !== 'registered' ? { color: 'var(--text-secondary)' } : undefined}
        >
          <Users className="w-4 h-4" />
          Inscrits
          {data && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
              {data.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('prospects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'prospects'
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-white/5'
          }`}
          style={activeTab !== 'prospects' ? { color: 'var(--text-secondary)' } : undefined}
        >
          <UserPlus className="w-4 h-4" />
          Prospects
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'prospects' ? (
        <ProspectsList />
      ) : (
        <>
          {/* Filters for registered plumbers */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Rechercher un plombier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
              <option value="inactive">Inactif</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              <option value="">Tous les départements</option>
              <option value="971">Guadeloupe (971)</option>
              <option value="972">Martinique (972)</option>
              <option value="973">Guyane (973)</option>
            </select>
          </div>

          {/* Table */}
          <div className="stat-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plombier</th>
                    <th>Entreprise</th>
                    <th>Département</th>
                    <th>Statut</th>
                    <th>Missions</th>
                    <th>Note</th>
                    <th>Stripe</th>
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
                  ) : filteredPlumbers && filteredPlumbers.length > 0 ? (
                    filteredPlumbers.map((plumber) => (
                      <tr key={plumber.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold">
                              {plumber.user.firstName.charAt(0)}
                              {plumber.user.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {plumber.user.firstName} {plumber.user.lastName}
                              </p>
                              <p className="text-sm flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                <Mail className="w-3 h-3" />
                                {plumber.user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          {plumber.companyName ? (
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                              <span>{plumber.companyName}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                          )}
                        </td>
                        <td>
                          {plumber.department ? (
                            <span className="badge badge-info">
                              {DEPARTMENT_NAMES[plumber.department]} ({plumber.department})
                            </span>
                          ) : (
                            <span className="badge bg-gray-500/20" style={{ color: 'var(--text-secondary)' }}>
                              Non défini
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_CONFIG[plumber.status]?.class || 'badge-info'}`}>
                            {STATUS_CONFIG[plumber.status]?.label || plumber.status}
                          </span>
                        </td>
                        <td>
                          <span className="font-medium">{plumber.totalJobsCompleted}</span>
                        </td>
                        <td>
                          {plumber.averageRating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span>{plumber.averageRating.toFixed(1)}</span>
                              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                ({plumber.totalRatings})
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`w-3 h-3 rounded-full inline-block ${
                              plumber.stripeChargesEnabled ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            title={plumber.stripeChargesEnabled ? 'Vérifié' : 'En attente'}
                          />
                        </td>
                        <td>
                          <Link
                            to={`/plumbers/${plumber.id}`}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors inline-flex"
                          >
                            <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Aucun plombier trouvé</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlumbersPage;
