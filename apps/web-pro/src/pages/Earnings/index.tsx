import React from 'react';
import { Wallet, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { formatPrice } from '@shattaf/shared-types';

const EarningsPage: React.FC = () => {
  const { data: missions } = useQuery({
    queryKey: ['missions', 'completed'],
    queryFn: () => apiClient.missions.list('completed'),
  });

  // Calculate earnings (simplified - would come from orders in production)
  const completedCount = missions?.length || 0;
  const estimatedEarnings = completedCount * 5000; // Placeholder 50€ per mission

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-display text-2xl font-bold mb-6">Mes revenus</h1>

      {/* Summary card */}
      <div className="glass rounded-2xl p-6 mb-6 transition-colors duration-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Revenus estimés</p>
            <p className="text-3xl font-bold cyan-gradient-text">
              {formatPrice(estimatedEarnings)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-4 transition-colors duration-200" style={{ background: 'var(--bg-inner)' }}>
            <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              <Calendar className="w-4 h-4" />
              Ce mois
            </div>
            <p className="font-bold text-lg">{completedCount} missions</p>
          </div>
          <div className="rounded-xl p-4 transition-colors duration-200" style={{ background: 'var(--bg-inner)' }}>
            <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              <TrendingUp className="w-4 h-4" />
              Moyenne
            </div>
            <p className="font-bold text-lg">
              {completedCount > 0 ? formatPrice(estimatedEarnings / completedCount) : '0 €'} /mission
            </p>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <h2 className="font-bold text-lg mb-4">Dernières missions</h2>

        {completedCount === 0 ? (
          <div className="glass rounded-2xl p-6 text-center transition-colors duration-200">
            <Wallet className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Aucune mission terminée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions?.slice(0, 5).map((mission) => (
              <div
                key={mission.id}
                className="glass rounded-xl p-4 flex items-center justify-between transition-colors duration-200"
              >
                <div>
                  <p className="font-medium">Installation shattaf</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {mission.completedAt &&
                      new Date(mission.completedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className="font-bold text-emerald-400">
                  +{formatPrice(5000)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout info */}
      <div className="glass rounded-2xl p-4 mt-6 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Virements Stripe</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Paiements automatiques</p>
          </div>
          <ArrowRight className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    </div>
  );
};

export default EarningsPage;
