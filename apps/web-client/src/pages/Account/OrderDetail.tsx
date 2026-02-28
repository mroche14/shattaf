import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Download } from 'lucide-react';
import { useOrder, useOrderItems } from '../../api/hooks/useOrders';
import { formatDate, formatPrice, formatTimeSlot } from '@shattaf/shared-types';
import type { TimeSlot } from '@shattaf/shared-types';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id!);
  const { data: items } = useOrderItems(id!);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded w-1/2 mb-6" />
        <div className="glass rounded-2xl p-6">
          <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-4" />
          <div className="h-4 bg-slate-700/50 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Commande non trouvée</h1>
        <Link to="/account/orders" className="text-cyan-400 hover:underline">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/account/orders"
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Commande</h1>
          <p className="text-gray-400 font-mono text-sm">{order.orderNumber}</p>
        </div>
      </div>

      {/* Status */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">Statut</span>
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase">
            {order.status}
          </span>
        </div>

        {order.scheduledDate && (
          <div className="flex items-center gap-3 text-gray-300">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="font-medium">
                {formatDate(order.scheduledDate)}
              </p>
              <p className="text-sm text-gray-400">
                {formatTimeSlot(order.scheduledTimeSlot as TimeSlot)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-4">Articles</h2>
        <div className="space-y-4">
          {items?.map((item) => (
            <div key={item.id} className="flex justify-between">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-gray-400">
                  {item.isInstallation ? 'Installation' : 'Produit'}
                </p>
              </div>
              <span className="font-medium">{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-4 pt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>TVA</span>
            <span>{formatPrice(order.vatAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="cyan-gradient-text">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {order.status === 'completed' && (
        <div className="glass rounded-2xl p-6">
          <Link
            to={`/invoices/${order.id}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <Download className="w-5 h-5" />
            Télécharger la facture
          </Link>
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default OrderDetailPage;
