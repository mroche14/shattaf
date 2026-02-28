import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Check, Clock, Shield } from 'lucide-react';
import { useProduct } from '../../api/hooks/useProducts';
import { useBookingStore } from '../../store/booking';
import { formatPrice } from '@shattaf/shared-types';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const setSchedule = useBookingStore((state) => state.setSchedule);

  const handleSelectProduct = () => {
    if (product) {
      setSchedule({ productId: product.id });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="aspect-video bg-slate-700/50 rounded-2xl mb-6" />
        <div className="h-8 bg-slate-700/50 rounded w-3/4 mb-4" />
        <div className="h-4 bg-slate-700/50 rounded w-1/2" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
        <Link to="/products" className="text-cyan-400 hover:underline">
          Retour aux produits
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour aux produits
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-2xl"
            />
          ) : (
            <div className="w-full aspect-square bg-slate-800/50 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-24 h-24 text-gray-600" />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold">
            {product.category}
          </span>
          <h1 className="font-display text-3xl font-bold mt-2 mb-4">
            {product.name}
          </h1>

          {product.description && (
            <p className="text-gray-400 mb-6">{product.description}</p>
          )}

          {/* Price */}
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold cyan-gradient-text">
                {formatPrice(product.priceB2c)}
              </span>
              <span className="text-gray-500 text-sm">TTC</span>
            </div>

            {product.requiresInstallation && (
              <p className="text-sm text-gray-400 mb-4">
                + Frais d'installation (devis personnalisé)
              </p>
            )}

            <Link
              to="/booking"
              onClick={handleSelectProduct}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl btn-primary text-white font-bold uppercase tracking-wider"
            >
              Réserver l'installation
            </Link>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium">Installation incluse</p>
                <p className="text-sm text-gray-400">Par un plombier certifié</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-medium">{product.installationTimeMinutes} min</p>
                <p className="text-sm text-gray-400">Durée d'installation</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium">Garantie 2 ans</p>
                <p className="text-sm text-gray-400">Produit et installation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default ProductDetailPage;
