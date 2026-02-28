import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export function useBookingQuotes(bookingId: string) {
  return useQuery({
    queryKey: ['quotes', 'booking', bookingId],
    queryFn: () => apiClient.quotes.listByBooking(bookingId),
    enabled: !!bookingId,
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: () => apiClient.quotes.get(id),
    enabled: !!id,
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quoteId, notes }: { quoteId: string; notes?: string }) =>
      apiClient.quotes.accept(quoteId, notes),
    onSuccess: (_, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useRejectQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) => apiClient.quotes.reject(quoteId),
    onSuccess: (_, quoteId) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
