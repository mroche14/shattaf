import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../api/client';

const CustomersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page],
    queryFn: () => adminApi.customers.list({ page, limit: 20 }),
  });

  const filteredCustomers = data?.items.filter((customer) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      customer.user.firstName.toLowerCase().includes(search) ||
      customer.user.lastName.toLowerCase().includes(search) ||
      customer.user.email.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            Clients
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{data?.total || 0} clients inscrits</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Adresse</th>
                <th>Commandes</th>
                <th>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <div className="h-12 bg-[var(--bg-surface)] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredCustomers && filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                          {customer.user.firstName.charAt(0)}
                          {customer.user.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {customer.user.firstName} {customer.user.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Mail className="w-4 h-4" />
                        {customer.user.email}
                      </div>
                    </td>
                    <td>
                      {customer.user.phone ? (
                        <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <Phone className="w-4 h-4" />
                          {customer.user.phone}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {customer.defaultCity ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                          <span>
                            {customer.defaultCity} ({customer.defaultPostalCode})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        <span className="font-medium">{customer.totalOrders}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Aucun client trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
