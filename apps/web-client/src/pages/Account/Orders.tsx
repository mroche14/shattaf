import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ChevronRight } from 'lucide-react';
import { useOrders } from '../../api/hooks/useOrders';
import { formatDate, formatPrice } from '@shattaf/shared-types';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'En attente de paiement', color: 'text-amber-400' },
  paid: { label: 'Payé', color: 'text-emerald-400' },
  scheduled: { label: 'Planifié', color: 'text-cyan-400' },
  in_progress: { label: 'En cours', color: 'text-cyan-400' },
  completed: { label: 'Terminé', color: 'text-emerald-400' },
  cancelled: { label: 'Annulé', color: 'text-red-400' },
  refunded: { label: 'Remboursé', color: 'text-gray-400' },
};

const MyOrdersPage: React.FC = () => {
  const { data: orders, isLoading } = useOrders();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/account"
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Mes commandes</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-4 animate-pulse">
              <div className="h-5 bg-slate-700/50 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-700/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Aucune commande</h2>
          <p className="text-gray-400 mb-6">
            Vous n'avez pas encore passé de commande.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-primary text-white font-bold"
          >
            Voir les produits
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => {
            const status = statusLabels[order.status] || { label: order.status, color: 'text-gray-400' };

            return (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                className="glass rounded-2xl p-4 block hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm text-gray-400 mb-1">
                      {order.orderNumber}
                    </p>
                    <span className={`text-xs font-bold uppercase ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="text-sm text-gray-400 mt-2">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold cyan-gradient-text">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default MyOrdersPage;
