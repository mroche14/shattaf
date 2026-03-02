import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';

const CheckoutSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();

  // Stripe appends ?payment_intent=...&redirect_status=succeeded|failed|processing
  const redirectStatus = searchParams.get('redirect_status');

  if (redirectStatus === 'failed') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Paiement échoué</h1>
        <p className="text-gray-400 mb-6">
          Le paiement n'a pas pu être traité. Veuillez réessayer.
        </p>
        <Link
          to={`/checkout/${orderId}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all"
        >
          Réessayer
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  if (redirectStatus === 'processing') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Paiement en cours</h1>
        <p className="text-gray-400 mb-6">
          Votre paiement est en cours de traitement. Vous recevrez une confirmation par email.
        </p>
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all"
        >
          Mes commandes
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  // Default: succeeded
  return (
    <div className="container mx-auto px-4 py-16 max-w-md text-center">
      <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
      <h1 className="font-display text-2xl font-bold mb-2">Paiement confirmé !</h1>
      <p className="text-gray-400 mb-6">
        Votre commande a été confirmée. Un plombier va être assigné à votre mission.
        Vous recevrez une notification avec les détails.
      </p>
      <div className="space-y-3">
        <Link
          to={`/account/orders/${orderId}`}
          className="block px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all"
        >
          Voir ma commande
        </Link>
        <Link
          to="/"
          className="block px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-white transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default CheckoutSuccessPage;
