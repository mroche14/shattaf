import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useProducts } from '../../api/hooks/useProducts';
import { formatPrice } from '@shattaf/shared-types';

const ProductsPage: React.FC = () => {
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="aspect-square bg-slate-700/50 rounded-xl mb-4" />
              <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-700/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Nos produits</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {products?.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="glass rounded-2xl p-6 hover:border-cyan-500/30 transition-colors group"
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="aspect-square object-cover rounded-xl mb-4"
              />
            ) : (
              <div className="aspect-square bg-slate-700/50 rounded-xl mb-4 flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-600" />
              </div>
            )}

            <h3 className="font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors">
              {product.name}
            </h3>

            {product.description && (
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xl font-bold cyan-gradient-text">
                {formatPrice(product.priceB2c)}
              </span>
              {product.requiresInstallation && (
                <span className="text-xs text-gray-500 uppercase">
                  + installation
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {products?.length === 0 && (
        <div className="text-center py-16">
          <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Aucun produit disponible</h2>
          <p className="text-gray-400">
            Nos produits seront bientôt disponibles.
          </p>
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default ProductsPage;
