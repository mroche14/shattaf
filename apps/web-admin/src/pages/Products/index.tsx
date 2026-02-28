import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Package,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { adminApi, ProductAdmin, ProductCreate } from '../../api/client';

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductAdmin | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => adminApi.products.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductCreate) => adminApi.products.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductCreate> }) =>
      adminApi.products.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setEditingProduct(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleEdit = (product: ProductAdmin) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-400" />
            Produits
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{products?.length || 0} produits</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un produit
        </button>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="stat-card h-64 animate-pulse" />
          ))
        ) : products && products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="stat-card">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-xl mb-4"
                />
              ) : (
                <div className="w-full h-32 bg-[var(--bg-surface)] rounded-xl mb-4 flex items-center justify-center">
                  <Package className="w-12 h-12" style={{ color: 'var(--text-tertiary)' }} />
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold">{product.name}</h3>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>{product.slug}</span>
                </div>
                <span
                  className={`badge ${product.isActive ? 'badge-success' : 'badge-error'}`}
                >
                  {product.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {product.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="bg-[var(--bg-surface)] rounded-lg p-2">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Prix B2C</p>
                  <p className="font-bold">{formatPrice(product.priceB2C)}</p>
                </div>
                <div className="bg-[var(--bg-surface)] rounded-lg p-2">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Installation</p>
                  <p className="font-bold">{formatPrice(product.installationPrice)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Stock: <span className="font-medium">{product.stockQuantity}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Edit className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer ce produit ?')) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full stat-card text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Aucun produit</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSubmit={(data) => {
            if (editingProduct) {
              updateMutation.mutate({ id: editingProduct.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
};

interface ProductModalProps {
  product: ProductAdmin | null;
  onClose: () => void;
  onSubmit: (data: ProductCreate) => void;
  isLoading: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<ProductCreate>({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    priceB2C: product?.priceB2C || 0,
    priceB2B: product?.priceB2B || undefined,
    installationPrice: product?.installationPrice || 0,
    imageUrl: product?.imageUrl || '',
    isActive: product?.isActive ?? true,
    stockQuantity: product?.stockQuantity || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transition-colors" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="font-bold text-lg">
            {product ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Nom
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 font-mono transition-colors"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 resize-none transition-colors"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Prix B2C (centimes)
              </label>
              <input
                type="number"
                value={formData.priceB2C}
                onChange={(e) =>
                  setFormData({ ...formData, priceB2C: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Prix installation (centimes)
              </label>
              <input
                type="number"
                value={formData.installationPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    installationPrice: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              URL image
            </label>
            <input
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              className="w-full rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Stock
              </label>
              <input
                type="number"
                value={formData.stockQuantity || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stockQuantity: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-5 h-5 rounded" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Actif</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
              style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {product ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductsPage;
