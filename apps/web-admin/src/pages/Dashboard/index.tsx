import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Wrench,
  ClipboardList,
  Package,
  Briefcase,
  TrendingUp,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminApi } from '../../api/client';

const DEPARTMENT_COLORS = {
  '971': '#6366f1',
  '972': '#06b6d4',
  '973': '#f59e0b',
};

const DEPARTMENT_NAMES = {
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
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
    name: DEPARTMENT_NAMES[d.department as keyof typeof DEPARTMENT_NAMES] || d.department,
    value: d.plumbers,
    color: DEPARTMENT_COLORS[d.department as keyof typeof DEPARTMENT_COLORS] || '#6b7280',
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
                  tickFormatter={(v) => DEPARTMENT_NAMES[v as keyof typeof DEPARTMENT_NAMES] || v}
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
                  labelFormatter={(label) => DEPARTMENT_NAMES[label as keyof typeof DEPARTMENT_NAMES] || label}
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
                <th>Réservations</th>
                <th>Revenus</th>
              </tr>
            </thead>
            <tbody>
              {departmentData.length > 0 ? (
                departmentData.map((dept) => (
                  <tr key={dept.department}>
                    <td className="font-medium">
                      {DEPARTMENT_NAMES[dept.department as keyof typeof DEPARTMENT_NAMES] || dept.department}
                    </td>
                    <td>
                      <span className="badge badge-info">{dept.department}</span>
                    </td>
                    <td>{dept.plumbers}</td>
                    <td>{dept.bookings}</td>
                    <td className="font-medium text-emerald-400">
                      {formatPrice(dept.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                    Aucune donnée disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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

export default DashboardPage;
