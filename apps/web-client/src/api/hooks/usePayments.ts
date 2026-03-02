import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (orderId: string) => apiClient.payments.createIntent(orderId),
  });
}
