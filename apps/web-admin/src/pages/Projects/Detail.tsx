import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, ClipboardList, ShoppingCart, DollarSign, Loader2, ExternalLink } from 'lucide-react';
import { adminApi } from '../../api/client';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Brouillon' },
  active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Actif' },
  paused: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'En pause' },
  archived: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Archivé' },
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => adminApi.projects.get(id!),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => adminApi.projects.getStats(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Projet non trouvé</h1>
        <Link to="/projects" className="text-indigo-400 hover:underline">Retour aux projets</Link>
      </div>
    );
  }

  const status = statusColors[project.status] || statusColors.draft;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 mb-6 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Projets
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>/{project.slug} &middot; {project.type === 'internal' ? 'Projet interne' : 'Marketplace'}</p>
          {project.description && (
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
          )}
          {project.landingPageUrl && (
            <a
              href={project.landingPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm text-indigo-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {project.landingPageUrl}
            </a>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Package} label="Produits" value={stats?.productCount ?? 0} color="text-blue-400" />
        <KpiCard icon={ClipboardList} label="Demandes" value={stats?.bookingCount ?? 0} color="text-cyan-400" />
        <KpiCard icon={ShoppingCart} label="Commandes" value={stats?.orderCount ?? 0} color="text-emerald-400" />
        <KpiCard
          icon={DollarSign}
          label="Revenus"
          value={stats?.revenue ? `${(stats.revenue / 100).toFixed(0)} €` : '0 €'}
          color="text-amber-400"
        />
      </div>

      {/* Funnel visualization */}
      <div className="rounded-xl p-6 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="font-bold mb-4">Entonnoir de conversion</h2>
        {stats && stats.bookingCount > 0 ? (
          <div className="space-y-3">
            <FunnelBar label="Demandes" count={stats.bookingCount} max={stats.bookingCount} color="bg-cyan-500" />
            <FunnelBar label="Commandes" count={stats.orderCount} max={stats.bookingCount} color="bg-emerald-500" />
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Pas encore de données</p>
        )}
      </div>

      {/* Project details */}
      <div className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="font-bold mb-4">Détails</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt style={{ color: 'var(--text-tertiary)' }}>Département</dt>
            <dd className="font-medium">{project.department || 'Tous'}</dd>
          </div>
          <div>
            <dt style={{ color: 'var(--text-tertiary)' }}>Créé le</dt>
            <dd className="font-medium">
              {new Date(project.createdAt).toLocaleDateString('fr-FR')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
    </div>
  );
}

function FunnelBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const percent = max > 0 ? (count / max) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{count} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-inner)' }}>
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ProjectDetailPage;
