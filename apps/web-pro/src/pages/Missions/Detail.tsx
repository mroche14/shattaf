import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Navigation, Play } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

const MissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => apiClient.jobs.get(id!),
    enabled: !!id,
  });

  const canStart =
    job?.status === 'scheduled' || job?.status === 'en_route' || job?.status === 'checked_in';

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 animate-pulse">
        <div className="h-8 rounded w-1/2 mb-6" style={{ background: 'var(--bg-inner)' }} />
        <div className="glass rounded-2xl p-6 transition-colors duration-200">
          <div className="h-6 rounded w-3/4 mb-4" style={{ background: 'var(--bg-inner)' }} />
          <div className="h-4 rounded w-1/2" style={{ background: 'var(--bg-inner)' }} />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-xl font-bold mb-4">Mission non trouvée</h1>
        <Link to="/missions" className="text-cyan-400">
          Retour aux missions
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/missions"
          className="p-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold">Détails mission</h1>
          <span className="text-xs font-bold uppercase text-cyan-400">
            {job.status}
          </span>
        </div>
      </div>

      {/* Address */}
      <div className="glass rounded-2xl p-4 mb-4 transition-colors duration-200">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-400" />
          Adresse
        </h2>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-4">
          {/* Address would come from order/booking */}
          Adresse disponible après confirmation
        </p>
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold">
          <Navigation className="w-5 h-5" />
          Ouvrir dans Maps
        </button>
      </div>

      {/* Client contact */}
      <div className="glass rounded-2xl p-4 mb-4 transition-colors duration-200">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Phone className="w-5 h-5 text-cyan-400" />
          Contact client
        </h2>
        <button
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors duration-200"
          style={{ background: 'var(--bg-inner)', color: 'var(--text-main)' }}
        >
          <Phone className="w-5 h-5" />
          Appeler le client
        </button>
      </div>

      {/* Photos from booking */}
      {job.status !== 'completed' && (
        <div className="glass rounded-2xl p-4 mb-6 transition-colors duration-200">
          <h2 className="font-bold mb-3">Photos du client</h2>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="aspect-video rounded-xl flex items-center justify-center text-sm"
              style={{ background: 'var(--bg-inner)', color: 'var(--text-tertiary)' }}
            >
              Face WC
            </div>
            <div
              className="aspect-video rounded-xl flex items-center justify-center text-sm"
              style={{ background: 'var(--bg-inner)', color: 'var(--text-tertiary)' }}
            >
              Côté robinet
            </div>
          </div>
        </div>
      )}

      {/* Start button */}
      {canStart && (
        <button
          onClick={() => navigate(`/missions/${id}/execution`)}
          className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          Démarrer la mission
        </button>
      )}

      {job.status === 'in_progress' && (
        <button
          onClick={() => navigate(`/missions/${id}/execution`)}
          className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"
        >
          Continuer la mission
        </button>
      )}
    </div>
  );
};

export default MissionDetailPage;
