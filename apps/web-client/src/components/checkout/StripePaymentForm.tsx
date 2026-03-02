import React, { useEffect, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, AlertCircle } from 'lucide-react';
import { getStripe } from '../../lib/stripe';
import { useCreatePaymentIntent } from '../../api/hooks/usePayments';

interface StripePaymentFormProps {
  orderId: string;
  amount: number;
}

/** Inner form rendered inside <Elements>. */
function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/${orderId}/success`,
      },
    });

    // Only reaches here if there's an immediate error (redirect-based flows don't return).
    if (submitError) {
      setError(submitError.message ?? 'Erreur de paiement');
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {processing ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Traitement en cours...
          </span>
        ) : (
          'Payer maintenant'
        )}
      </button>
    </form>
  );
}

/** Wrapper that fetches clientSecret then renders Stripe Elements. */
export default function StripePaymentForm({
  orderId,
  amount,
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const createIntent = useCreatePaymentIntent();
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    createIntent.mutate(orderId, {
      onSuccess: (data) => setClientSecret(data.client_secret),
      onError: (err) =>
        setInitError(
          err instanceof Error ? err.message : 'Impossible de préparer le paiement',
        ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (initError) {
    return (
      <div className="text-center text-red-400 py-6">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">{initError}</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Préparation du paiement...</span>
      </div>
    );
  }

  const stripePromise = getStripe();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#06b6d4',
            colorBackground: '#1e293b',
            colorText: '#e2e8f0',
            colorDanger: '#f87171',
            borderRadius: '0.75rem',
            fontFamily: 'system-ui, sans-serif',
          },
        },
        locale: 'fr',
      }}
    >
      <PaymentForm orderId={orderId} />
    </Elements>
  );
}
