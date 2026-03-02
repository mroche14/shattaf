import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, Plus, ExternalLink, Package, ClipboardList, DollarSign, Loader2 } from 'lucide-react';
import { adminApi, type ProjectAdmin } from '../../api/client';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Brouillon' },
  active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Actif' },
  paused: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'En pause' },
  archived: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Archivé' },
};

const typeLabels: Record<string, string> = {
  internal: 'Projet interne',
  marketplace: 'Marketplace',
};

const ProjectsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: () => adminApi.projects.list(statusFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; type: string; description: string }) =>
      adminApi.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      name: form.get('name') as string,
      slug: form.get('slug') as string,
      type: form.get('type') as string,
      description: form.get('description') as string,
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold">Projets</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau projet
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-6">
        {[
          { value: '', label: 'Tous' },
          { value: 'active', label: 'Actifs' },
          { value: 'draft', label: 'Brouillons' },
          { value: 'paused', label: 'En pause' },
          { value: 'archived', label: 'Archivés' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-indigo-500/20 text-indigo-400'
                : ''
            }`}
            style={statusFilter !== f.value ? { color: 'var(--text-secondary)', background: 'var(--bg-inner)' } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}

          {projects?.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
              Aucun projet trouvé
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-lg font-bold mb-4">Nouveau projet</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-xl px-4 py-2.5"
                  style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  placeholder="Ex: Shattaf Douchettes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  name="slug"
                  required
                  className="w-full rounded-xl px-4 py-2.5"
                  style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  placeholder="shattaf"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  name="type"
                  className="w-full rounded-xl px-4 py-2.5"
                  style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                >
                  <option value="internal">Projet interne</option>
                  <option value="marketplace">Marketplace</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-xl px-4 py-2.5 resize-none"
                  style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium"
                  style={{ background: 'var(--bg-inner)', color: 'var(--text-secondary)' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-indigo-500 text-white disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function ProjectCard({ project }: { project: ProjectAdmin }) {
  const status = statusColors[project.status] || statusColors.draft;

  const { data: stats } = useQuery({
    queryKey: ['project-stats', project.id],
    queryFn: () => adminApi.projects.getStats(project.id),
    staleTime: 60000,
  });

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-xl p-5 transition-all hover:ring-2 hover:ring-indigo-500/30"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{project.name}</h3>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>/{project.slug}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
        {project.description || typeLabels[project.type]}
      </p>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <Package className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-bold">{stats?.productCount ?? '-'}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Produits</p>
        </div>
        <div>
          <ClipboardList className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-bold">{stats?.bookingCount ?? '-'}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Demandes</p>
        </div>
        <div>
          <DollarSign className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-bold">{stats?.revenue ? `${(stats.revenue / 100).toFixed(0)}€` : '-'}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Revenus</p>
        </div>
      </div>

      {project.landingPageUrl && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <span className="flex items-center gap-1 text-xs text-indigo-400">
            <ExternalLink className="w-3 h-3" />
            Landing page
          </span>
        </div>
      )}
    </Link>
  );
}

export default ProjectsPage;
