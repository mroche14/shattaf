import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { useOnboardingStore } from '../../../store/onboarding';

const StripeConnectStep: React.FC = () => {
  const { markComplete } = useOnboardingStore();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const refresh = searchParams.get('refresh') === 'true';

  const { data: stripeStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['stripe-status'],
    queryFn: () =>
      (apiClient as any).request('GET', '/users/plumber/stripe-status') as Promise<{
        hasAccount: boolean;
        onboardingComplete: boolean;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
      }>,
  });

  const onboardingMutation = useMutation({
    mutationFn: () =>
      (apiClient as any).request('POST', '/users/plumber/stripe-onboarding') as Promise<{
        url: string;
      }>,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  // Auto-mark complete if Stripe is fully set up
  useEffect(() => {
    if (stripeStatus?.onboardingComplete && stripeStatus?.chargesEnabled) {
      markComplete('stripe');
    }
  }, [stripeStatus, markComplete]);

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const isComplete = stripeStatus?.onboardingComplete && stripeStatus?.chargesEnabled;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Configuration paiements</h2>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Connectez votre compte Stripe pour recevoir vos paiements directement.
        </p>
      </div>

      {isComplete ? (
        <div className="rounded-xl p-6 text-center" style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)' }}>
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">Paiements configurés !</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Votre compte Stripe est actif. Vous recevrez vos paiements automatiquement.
          </p>
        </div>
      ) : (
        <>
          {success && (
            <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4 text-amber-300 text-sm">
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Onboarding en cours de vérification par Stripe. Cela peut prendre quelques minutes.
            </div>
          )}

          {refresh && (
            <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4 text-amber-300 text-sm">
              La session a expiré. Veuillez relancer la configuration.
            </div>
          )}

          <div className="rounded-xl p-6" style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Stripe Connect</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Paiements sécurisés et virements automatiques
                </p>
              </div>
            </div>

            <ul className="space-y-2 text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              <li>- Recevez vos paiements sous 2-3 jours ouvrés</li>
              <li>- Aucun frais d'inscription</li>
              <li>- Tableau de bord des revenus</li>
            </ul>

            <button
              onClick={() => onboardingMutation.mutate()}
              disabled={onboardingMutation.isPending}
              className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {onboardingMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Configurer les paiements
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {isComplete && (
        <a
          href="/dashboard"
          className="block w-full btn-primary py-3 rounded-xl font-bold text-center"
        >
          Accéder au tableau de bord
        </a>
      )}
    </div>
  );
};

export default StripeConnectStep;
