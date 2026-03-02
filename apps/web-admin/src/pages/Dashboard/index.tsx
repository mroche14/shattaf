import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Wrench,
  ClipboardList,
  Package,
  Briefcase,
  TrendingUp,
  MapPin,
  AlertCircle,
  UserSearch,
  Phone,
  Mail,
  UserCheck,
  Building,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminApi } from '../../api/client';

const DEPARTMENT_COLORS: Record<string, string> = {
  '971': '#6366f1',
  '972': '#06b6d4',
  '973': '#f59e0b',
  '974': '#ec4899',
};

const DEPARTMENT_NAMES: Record<string, string> = {
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
  '974': 'Réunion',
};

const STATUS_COLORS: Record<string, string> = {
  not_contacted: '#6b7280',
  contacted: '#3b82f6',
  interested: '#10b981',
  not_interested: '#ef4444',
  registered: '#6366f1',
};

const STATUS_LABELS: Record<string, string> = {
  not_contacted: 'Non contactés',
  contacted: 'Contactés',
  interested: 'Intéressés',
  not_interested: 'Non intéressés',
  registered: 'Inscrits',
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.dashboard.getStats(),
  });

  const { data: prospectStats } = useQuery({
    queryKey: ['prospect-stats'],
    queryFn: () => adminApi.prospects.getStats(),
  });

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="stat-card h-24" />
          ))}
        </div>
      </div>
    );
  }

  const departmentData = stats?.byDepartment || [];
  const pieData = departmentData.map((d) => ({
    name: DEPARTMENT_NAMES[d.department] || d.department,
    value: d.plumbers,
    color: DEPARTMENT_COLORS[d.department] || '#6b7280',
  }));

  return (
    <div className="p-4 lg:p-8">
      <h1 className="font-display text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Wrench className="w-6 h-6" />}
          label="Plombiers"
          value={stats?.totalPlumbers || 0}
          subLabel={`${stats?.activePlumbers || 0} actifs`}
          color="indigo"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Clients"
          value={stats?.totalCustomers || 0}
          color="cyan"
        />
        <StatCard
          icon={<ClipboardList className="w-6 h-6" />}
          label="Réservations"
          value={stats?.totalBookings || 0}
          subLabel={`${stats?.pendingBookings || 0} en attente`}
          color="amber"
        />
        <StatCard
          icon={<Package className="w-6 h-6" />}
          label="Commandes"
          value={stats?.totalOrders || 0}
          color="emerald"
        />
        <StatCard
          icon={<Briefcase className="w-6 h-6" />}
          label="Missions aujourd'hui"
          value={stats?.todayJobs || 0}
          color="blue"
        />
        <StatCard
          icon={<Briefcase className="w-6 h-6" />}
          label="Missions terminées"
          value={stats?.completedJobs || 0}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Revenus totaux"
          value={formatPrice(stats?.totalRevenue || 0)}
          isPrice
          color="pink"
        />
        <StatCard
          icon={<MapPin className="w-6 h-6" />}
          label="Départements"
          value={departmentData.length}
          subLabel="couverts"
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by department */}
        <div className="stat-card">
          <h2 className="font-bold text-lg mb-4">Revenus par département</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="department"
                  tickFormatter={(v) => DEPARTMENT_NAMES[v] || v}
                  stroke="#94a3b8"
                />
                <YAxis
                  tickFormatter={(v) => `${v / 100}€`}
                  stroke="#94a3b8"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.75rem',
                    color: 'var(--text-main)',
                  }}
                  formatter={(value: number) => [formatPrice(value), 'Revenus']}
                  labelFormatter={(label) => DEPARTMENT_NAMES[label] || label}
                />
                <Bar
                  dataKey="revenue"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plumbers distribution */}
        <div className="stat-card">
          <h2 className="font-bold text-lg mb-4">Répartition des plombiers</h2>
          <div className="h-64 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-panel)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.75rem',
                      color: 'var(--text-main)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center" style={{ color: 'var(--text-tertiary)' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                <p>Aucune donnée disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department details */}
      <div className="stat-card">
        <h2 className="font-bold text-lg mb-4">Détails par département</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Département</th>
                <th>Code</th>
                <th>Plombiers</th>
                <th>Prospects</th>
                <th>Réservations</th>
                <th>Revenus</th>
              </tr>
            </thead>
            <tbody>
              {departmentData.length > 0 ? (
                departmentData.map((dept) => (
                  <tr key={dept.department}>
                    <td className="font-medium">
                      {DEPARTMENT_NAMES[dept.department] || dept.department}
                    </td>
                    <td>
                      <span className="badge badge-info">{dept.department}</span>
                    </td>
                    <td>{dept.plumbers}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {prospectStats?.byDepartement[dept.department]?.toLocaleString() ?? '—'}
                    </td>
                    <td>{dept.bookings}</td>
                    <td className="font-medium text-emerald-400">
                      {formatPrice(dept.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                    Aucune donnée disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prospect Stats */}
      {prospectStats && <ProspectSection stats={prospectStats} />}
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subLabel?: string;
  color: string;
  isPrice?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subLabel, color }) => {
  const colorClasses: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-blue-500/20 text-indigo-400',
    cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-400',
    amber: 'from-amber-500/20 to-orange-500/20 text-amber-400',
    emerald: 'from-emerald-500/20 to-green-500/20 text-emerald-400',
    blue: 'from-blue-500/20 to-indigo-500/20 text-blue-400',
    green: 'from-green-500/20 to-emerald-500/20 text-green-400',
    pink: 'from-pink-500/20 to-rose-500/20 text-pink-400',
    orange: 'from-orange-500/20 to-amber-500/20 text-orange-400',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {subLabel && <span style={{ color: 'var(--text-tertiary)' }}> · {subLabel}</span>}
        </p>
      </div>
    </div>
  );
};

/* ── Prospect Section ─────────────────────────────────────────── */

import type { ProspectStats as ProspectStatsType } from '../../api/client';

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-panel)',
  border: '1px solid var(--border-color)',
  borderRadius: '0.75rem',
  color: 'var(--text-main)',
};

const ProspectSection: React.FC<{ stats: ProspectStatsType }> = ({ stats }) => {
  const navigate = useNavigate();
  const b = stats.breakdown;

  // Breakdown chart: stacked bar (Indépendants / Sociétés / Inconnu) × (Tél / Email)
  const breakdownData = [
    {
      category: 'Avec téléphone',
      Indépendants: b.individuelsWithPhone,
      Sociétés: b.societesWithPhone,
      Inconnu: b.unknownWithPhone,
    },
    {
      category: 'Avec email',
      Indépendants: b.individuelsWithEmail,
      Sociétés: b.societesWithEmail,
      Inconnu: b.unknownWithEmail,
    },
    {
      category: 'Total',
      Indépendants: stats.individuels,
      Sociétés: stats.societes,
      Inconnu: stats.total - stats.individuels - stats.societes,
    },
  ];

  // Actionable segments: clickable cards that navigate to prospects list with pre-applied filters
  const segments = [
    {
      label: 'Indép. avec tél.',
      value: b.individuelsWithPhone,
      pct: stats.total > 0 ? Math.round((b.individuelsWithPhone / stats.total) * 100) : 0,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      filterUrl: '/plumbers?tab=prospects&individuel=true&hasTelephone=true',
      icon: <Phone className="w-4 h-4" />,
    },
    {
      label: 'Indép. avec email',
      value: b.individuelsWithEmail,
      pct: stats.total > 0 ? Math.round((b.individuelsWithEmail / stats.total) * 100) : 0,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
      filterUrl: '/plumbers?tab=prospects&individuel=true&hasEmail=true',
      icon: <Mail className="w-4 h-4" />,
    },
    {
      label: 'Sociétés avec tél.',
      value: b.societesWithPhone,
      pct: stats.total > 0 ? Math.round((b.societesWithPhone / stats.total) * 100) : 0,
      color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
      filterUrl: '/plumbers?tab=prospects&individuel=false&hasTelephone=true',
      icon: <Phone className="w-4 h-4" />,
    },
    {
      label: 'Sociétés avec email',
      value: b.societesWithEmail,
      pct: stats.total > 0 ? Math.round((b.societesWithEmail / stats.total) * 100) : 0,
      color: 'from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30',
      filterUrl: '/plumbers?tab=prospects&individuel=false&hasEmail=true',
      icon: <Mail className="w-4 h-4" />,
    },
  ];

  return (
    <>
      <h2 className="font-display text-xl font-bold mt-10 mb-4">Prospects</h2>

      {/* Top-line stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={<UserSearch className="w-6 h-6" />}
          label="Total prospects"
          value={stats.total.toLocaleString()}
          color="indigo"
        />
        <StatCard
          icon={<Phone className="w-6 h-6" />}
          label="Avec téléphone"
          value={stats.withTelephone.toLocaleString()}
          subLabel={`${Math.round((stats.withTelephone / stats.total) * 100)}%`}
          color="emerald"
        />
        <StatCard
          icon={<Mail className="w-6 h-6" />}
          label="Avec email"
          value={stats.withEmail.toLocaleString()}
          subLabel={`${Math.round((stats.withEmail / stats.total) * 100)}%`}
          color="blue"
        />
        <StatCard
          icon={<UserCheck className="w-6 h-6" />}
          label="Indépendants"
          value={stats.individuels.toLocaleString()}
          color="amber"
        />
        <StatCard
          icon={<Building className="w-6 h-6" />}
          label="Sociétés"
          value={stats.societes.toLocaleString()}
          color="pink"
        />
      </div>

      {/* Actionable segments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {segments.map((seg) => (
          <button
            key={seg.label}
            onClick={() => navigate(seg.filterUrl)}
            className={`stat-card !p-4 border bg-gradient-to-br ${seg.color} hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer text-left`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {seg.icon}
                <span className="text-sm font-medium">{seg.label}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            </div>
            <p className="text-2xl font-bold">{seg.value.toLocaleString()}</p>
            <p className="text-xs opacity-60">{seg.pct}% du total</p>
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Breakdown: stacked bar */}
        <div className="stat-card">
          <h2 className="font-bold text-lg mb-4">Répartition type × contact</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 13 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="Indépendants" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Sociétés" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Inconnu" stackId="a" fill="#6b7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prospects by department */}
        <div className="stat-card">
          <h2 className="font-bold text-lg mb-4">Prospects par département</h2>
          <div className="h-64 flex items-center justify-center">
            {Object.keys(stats.byDepartement).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(stats.byDepartement)
                      .sort(([, a], [, b]) => b - a)
                      .map(([dept, count]) => ({
                        name: DEPARTMENT_NAMES[dept] || dept,
                        value: count,
                        color: DEPARTMENT_COLORS[dept] || '#6b7280',
                      }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {Object.entries(stats.byDepartement)
                      .sort(([, a], [, b]) => b - a)
                      .map(([dept]) => (
                        <Cell key={dept} fill={DEPARTMENT_COLORS[dept] || '#6b7280'} />
                      ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center" style={{ color: 'var(--text-tertiary)' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                <p>Aucune donnée disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="stat-card mb-8">
        <h2 className="font-bold text-lg mb-4">Pipeline de contact</h2>
        {/* Horizontal progress bar */}
        <div className="flex rounded-lg overflow-hidden h-10 mb-3">
          {Object.entries(stats.byStatus).map(([status, count]) => {
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={status}
                className="flex items-center justify-center text-xs font-medium text-white transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: STATUS_COLORS[status] || '#6b7280',
                  minWidth: pct > 0 ? '2rem' : 0,
                }}
                title={`${STATUS_LABELS[status]}: ${count.toLocaleString()}`}
              >
                {pct >= 8 && count.toLocaleString()}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                {STATUS_LABELS[status]}: <strong>{count.toLocaleString()}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
