import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { OrderStatus } from '@shattaf/shared-types';

export function useOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: () => apiClient.orders.list(status),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.orders.get(id),
    enabled: !!id,
  });
}

export function useOrderItems(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId, 'items'],
    queryFn: () => apiClient.orders.getItems(orderId),
    enabled: !!orderId,
  });
}

export function useCreateOrderFromQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) => apiClient.orders.createFromQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      rating,
      review,
    }: {
      orderId: string;
      rating: number;
      review?: string;
    }) => apiClient.orders.rate(orderId, rating, review),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
}
