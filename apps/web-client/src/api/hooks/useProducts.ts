import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { ProductCategory } from '@shattaf/shared-types';

export function useProducts(category?: ProductCategory) {
  return useQuery({
    queryKey: ['products', category],
    queryFn: () => apiClient.products.list({ category }),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.products.get(id),
    enabled: !!id,
  });
}
