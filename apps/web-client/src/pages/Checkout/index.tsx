import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { useOrder, useOrderItems } from '../../api/hooks/useOrders';
import { formatPrice } from '@shattaf/shared-types';
import StripePaymentForm from '../../components/checkout/StripePaymentForm';

const CheckoutPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrder(orderId!);
  const { data: items } = useOrderItems(orderId!);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg animate-pulse">
        <div className="glass rounded-2xl p-6">
          <div className="h-8 bg-slate-700/50 rounded w-1/2 mb-4" />
          <div className="h-24 bg-slate-700/50 rounded mb-4" />
          <div className="h-12 bg-slate-700/50 rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Commande non trouvée</h1>
        <Link to="/account/orders" className="text-cyan-400 hover:underline">
          Mes commandes
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour
      </Link>

      <h1 className="font-display text-2xl font-bold mb-6">Paiement</h1>

      {/* Order summary */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-4">Récapitulatif</h2>

        <div className="space-y-3 mb-4">
          {items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-400">{item.productName}</span>
              <span>{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>TVA (8.5%)</span>
            <span>{formatPrice(order.vatAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="cyan-gradient-text">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Stripe payment form */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <h2 className="font-bold">Carte bancaire</h2>
        </div>

        <StripePaymentForm orderId={orderId!} amount={order.totalAmount} />
      </div>

      {/* Security notice */}
      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
        <Shield className="w-4 h-4" />
        <span>Paiement sécurisé par Stripe</span>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default CheckoutPage;
