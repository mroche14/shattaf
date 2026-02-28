import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Booking, BookingStatus } from '@shattaf/shared-types';

export function useBookings(status?: BookingStatus) {
  return useQuery({
    queryKey: ['bookings', status],
    queryFn: () => apiClient.bookings.list(status),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => apiClient.bookings.get(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Booking>) => apiClient.bookings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Booking> }) =>
      apiClient.bookings.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useSubmitBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.bookings.submit(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function usePhotoUploadUrl() {
  return useMutation({
    mutationFn: ({ bookingId, photoType }: { bookingId: string; photoType: string }) =>
      apiClient.bookings.getPhotoUploadUrl(bookingId, photoType),
  });
}
