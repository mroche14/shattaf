import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, ArrowRight, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { formatDate } from '@shattaf/shared-types';

const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const { data: todayMissions } = useQuery({
    queryKey: ['missions', 'today'],
    queryFn: () => apiClient.missions.listToday(),
  });

  const { data: allMissions } = useQuery({
    queryKey: ['missions'],
    queryFn: () => apiClient.missions.list(),
  });

  const pendingMissions = allMissions?.filter(
    (m) => m.status === 'scheduled' || m.status === 'en_route'
  ).length || 0;

  const completedMissions = allMissions?.filter((m) => m.status === 'completed').length || 0;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-1">
          Bonjour, {user?.firstName} !
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass rounded-2xl p-4 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-2xl font-bold">{pendingMissions}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">En attente</p>
        </div>

        <div className="glass rounded-2xl p-4 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold">{completedMissions}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Terminées</p>
        </div>
      </div>

      {/* Today's jobs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Missions du jour</h2>
          <Link
            to="/missions"
            className="text-cyan-400 text-sm flex items-center gap-1"
          >
            Tout voir
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {todayMissions?.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center transition-colors duration-200">
            <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Aucune mission prévue aujourd'hui</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayMissions?.map((mission) => (
              <Link
                key={mission.id}
                to={`/missions/${mission.id}`}
                className="glass rounded-2xl p-4 block hover:border-cyan-500/30 transition-colors duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-cyan-400">
                      {mission.status === 'scheduled' && 'Planifiée'}
                      {mission.status === 'en_route' && 'En route'}
                      {mission.status === 'checked_in' && 'Sur place'}
                      {mission.status === 'in_progress' && 'En cours'}
                    </span>
                    <p className="font-medium mt-1">Installation shattaf</p>
                  </div>
                  <ArrowRight className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-4 h-4" />
                  <span>Voir l'adresse</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-bold text-lg mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/missions"
            className="glass rounded-2xl p-4 text-center hover:border-cyan-500/30 transition-colors duration-200"
          >
            <Briefcase className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="font-medium">Mes missions</p>
          </Link>
          <Link
            to="/earnings"
            className="glass rounded-2xl p-4 text-center hover:border-cyan-500/30 transition-colors duration-200"
          >
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-medium">Mes revenus</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
