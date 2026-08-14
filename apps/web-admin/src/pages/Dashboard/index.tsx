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
  const navigate = useNavigate();
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

      {/* KPI two-column layout: Activité | Prospects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Activité */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center">
              <Briefcase className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <h2 className="font-display text-lg font-bold">Activité</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <MiniStatCard icon={<Wrench className="w-4 h-4" />} label="Plombiers" value={stats?.totalPlumbers || 0} sub={`${stats?.activePlumbers || 0} actifs`} color="indigo" />
            <MiniStatCard icon={<Users className="w-4 h-4" />} label="Clients" value={stats?.totalCustomers || 0} color="cyan" />
            <MiniStatCard icon={<ClipboardList className="w-4 h-4" />} label="Réservations" value={stats?.totalBookings || 0} sub={`${stats?.pendingBookings || 0} en attente`} color="amber" />
            <MiniStatCard icon={<Package className="w-4 h-4" />} label="Commandes" value={stats?.totalOrders || 0} color="emerald" />
            <MiniStatCard icon={<Briefcase className="w-4 h-4" />} label="Missions auj." value={stats?.todayMissions || 0} color="blue" />
            <MiniStatCard icon={<Briefcase className="w-4 h-4" />} label="Terminées" value={stats?.completedMissions || 0} color="green" />
            <MiniStatCard icon={<TrendingUp className="w-4 h-4" />} label="Revenus" value={formatPrice(stats?.totalRevenue || 0)} color="pink" />
            <MiniStatCard icon={<MapPin className="w-4 h-4" />} label="Départements" value={departmentData.length} sub="couverts" color="orange" />
          </div>
        </div>

        {/* Right: Prospects */}
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
              <UserSearch className="w-4.5 h-4.5 text-orange-400" />
            </div>
            <h2 className="font-display text-lg font-bold">Prospects</h2>
            {prospectStats && (
              <span className="text-sm font-medium ml-1" style={{ color: 'var(--text-tertiary)' }}>
                {prospectStats.total.toLocaleString()} total
              </span>
            )}
          </div>
          {prospectStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <MiniStatCard icon={<Phone className="w-4 h-4" />} label="Avec tél." value={prospectStats.withTelephone.toLocaleString()} sub={`${Math.round((prospectStats.withTelephone / prospectStats.total) * 100)}%`} color="emerald" />
              <MiniStatCard icon={<Mail className="w-4 h-4" />} label="Avec email" value={prospectStats.withEmail.toLocaleString()} sub={`${Math.round((prospectStats.withEmail / prospectStats.total) * 100)}%`} color="blue" />
              <MiniStatCard icon={<UserCheck className="w-4 h-4" />} label="EI" value={(prospectStats.byTypeJuridique?.['EI'] ?? 0).toLocaleString()} sub="solo" color="amber" />
              <MiniStatCard icon={<UserCheck className="w-4 h-4" />} label="SAS" value={(prospectStats.byTypeJuridique?.['SAS'] ?? 0).toLocaleString()} sub="solo" color="teal" />
              <MiniActionCard icon={<Phone className="w-3.5 h-3.5" />} label="Solo + tél." value={prospectStats.breakdown.soloWithPhone} total={prospectStats.total} color="from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30" onClick={() => navigate('/plumbers?tab=prospects&typeJuridique=solo&hasTelephone=true')} />
              <MiniActionCard icon={<Mail className="w-3.5 h-3.5" />} label="Solo + email" value={prospectStats.breakdown.soloWithEmail} total={prospectStats.total} color="from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30" onClick={() => navigate('/plumbers?tab=prospects&typeJuridique=solo&hasEmail=true')} />
              <MiniStatCard icon={<Building className="w-4 h-4" />} label="SARL" value={(prospectStats.byTypeJuridique?.['SARL'] ?? 0).toLocaleString()} color="pink" />
              <MiniStatCard icon={<Building className="w-4 h-4" />} label="Sociétés" value={prospectStats.societeCount.toLocaleString()} color="indigo" />
              <MiniActionCard icon={<Phone className="w-3.5 h-3.5" />} label="Soc. + tél." value={prospectStats.breakdown.societeWithPhone} total={prospectStats.total} color="from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30" onClick={() => navigate('/plumbers?tab=prospects&typeJuridique=SARL&hasTelephone=true')} />
              <MiniActionCard icon={<Mail className="w-3.5 h-3.5" />} label="Soc. + email" value={prospectStats.breakdown.societeWithEmail} total={prospectStats.total} color="from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30" onClick={() => navigate('/plumbers?tab=prospects&typeJuridique=SARL&hasEmail=true')} />
            </div>
          ) : (
            <div className="stat-card flex items-center justify-center h-32" style={{ color: 'var(--text-tertiary)' }}>
              <p className="text-sm">Chargement des prospects...</p>
            </div>
          )}
        </div>
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

/* ── Compact KPI Cards ────────────────────────────────────────── */

const MINI_COLORS: Record<string, { icon: string; bg: string }> = {
  indigo:  { icon: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
  cyan:    { icon: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
  amber:   { icon: 'text-amber-400',   bg: 'bg-amber-500/10' },
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  blue:    { icon: 'text-blue-400',    bg: 'bg-blue-500/10' },
  green:   { icon: 'text-green-400',   bg: 'bg-green-500/10' },
  pink:    { icon: 'text-pink-400',    bg: 'bg-pink-500/10' },
  orange:  { icon: 'text-orange-400',  bg: 'bg-orange-500/10' },
  teal:    { icon: 'text-teal-400',    bg: 'bg-teal-500/10' },
};

const MiniStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => {
  const c = MINI_COLORS[color] || MINI_COLORS.indigo;
  return (
    <div className="stat-card !p-3 relative">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-6 h-6 rounded-md ${c.bg} ${c.icon} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{label}</span>
      </div>
      <p className="text-2xl font-bold leading-tight text-center">{value}</p>
      {sub && <span className="absolute bottom-1.5 right-2.5 text-[11px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>{sub}</span>}
    </div>
  );
};

const MiniActionCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  color: string;
  onClick: () => void;
}> = ({ icon, label, value, total, color, onClick }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className={`stat-card !p-3 border bg-gradient-to-br ${color} hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer relative`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-sm font-bold truncate">{label}</span>
      </div>
      <p className="text-2xl font-bold leading-tight text-center">{value.toLocaleString()}</p>
      <span className="absolute bottom-1.5 right-2.5 text-[11px] font-semibold opacity-70">{pct}%</span>
    </button>
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
  const b = stats.breakdown;

  // Breakdown chart: stacked bar (Solo / Sociétés / Inconnu) × (Tél / Email)
  const unknownCount = stats.byTypeJuridique?.['inconnu'] ?? 0;
  const breakdownData = [
    {
      category: 'Avec téléphone',
      Solo: b.soloWithPhone,
      Sociétés: b.societeWithPhone,
      Inconnu: b.unknownWithPhone,
    },
    {
      category: 'Avec email',
      Solo: b.soloWithEmail,
      Sociétés: b.societeWithEmail,
      Inconnu: b.unknownWithEmail,
    },
    {
      category: 'Total',
      Solo: stats.soloCount,
      Sociétés: stats.societeCount,
      Inconnu: unknownCount,
    },
  ];

  return (
    <>
      <h2 className="font-display text-xl font-bold mt-10 mb-4">Prospects — Détails</h2>

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
                <Bar dataKey="Solo" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
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
