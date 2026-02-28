import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  GitMerge,
  MapPin,
  Users,
  AlertCircle,
  ChevronRight,
  Navigation,
  Star,
  Clock,
} from 'lucide-react';
import L from 'leaflet';
import { adminApi } from '../../api/client';

import 'leaflet/dist/leaflet.css';

const createBookingIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#06b6d4"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const createPlumberIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6366f1" width="28" height="28">
      <circle cx="12" cy="12" r="10" fill="#6366f1"/>
      <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

interface MatchingMapProps {
  booking: { lat?: number; lng?: number; addressStreet?: string; addressCity?: string } | undefined;
  matchedPlumbers: Array<{
    plumber: {
      id: string;
      user: { firstName: string; lastName: string };
      serviceAreaLat?: number;
      serviceAreaLng?: number;
      serviceAreaRadiusKm: number;
    };
    distance: number;
    score: number;
  }>;
}

const MatchingMap: React.FC<MatchingMapProps> = ({ booking, matchedPlumbers }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = booking?.lat && booking?.lng
      ? [booking.lat, booking.lng]
      : [16.265, -61.551];
    const zoom = booking?.lat ? 12 : 10;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    mapRef.current = map;
    layersRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = null;
      }
    };
  }, []);

  // Update map center when booking changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (booking?.lat && booking?.lng) {
      mapRef.current.setView([booking.lat, booking.lng], 12);
    }
  }, [booking?.lat, booking?.lng]);

  // Update markers
  useEffect(() => {
    if (!layersRef.current) return;

    layersRef.current.clearLayers();

    const bookingIcon = createBookingIcon();
    const plumberIcon = createPlumberIcon();

    // Booking marker
    if (booking?.lat && booking?.lng) {
      const marker = L.marker([booking.lat, booking.lng], { icon: bookingIcon });
      marker.bindPopup(`
        <div>
          <h4 style="font-weight: bold;">Réservation</h4>
          <p style="color: #9ca3af; font-size: 0.9em;">${booking.addressStreet || ''}</p>
          <p style="color: #9ca3af; font-size: 0.9em;">${booking.addressCity || ''}</p>
        </div>
      `);
      marker.addTo(layersRef.current);
    }

    // Matched plumbers
    matchedPlumbers.forEach((match) => {
      if (match.plumber.serviceAreaLat && match.plumber.serviceAreaLng) {
        // Plumber marker
        const marker = L.marker(
          [match.plumber.serviceAreaLat, match.plumber.serviceAreaLng],
          { icon: plumberIcon }
        );
        marker.bindPopup(`
          <div>
            <h4 style="font-weight: bold;">
              ${match.plumber.user.firstName} ${match.plumber.user.lastName}
            </h4>
            <p style="color: #9ca3af; font-size: 0.9em;">Distance: ${match.distance.toFixed(1)} km</p>
            <p style="color: #9ca3af; font-size: 0.9em;">Score: ${match.score}</p>
          </div>
        `);
        marker.addTo(layersRef.current!);

        // Service area circle
        L.circle([match.plumber.serviceAreaLat, match.plumber.serviceAreaLng], {
          radius: match.plumber.serviceAreaRadiusKm * 1000,
          color: '#6366f1',
          fillColor: '#6366f1',
          fillOpacity: 0.05,
          weight: 1,
        }).addTo(layersRef.current!);

        // Line to booking
        if (booking?.lat && booking?.lng) {
          L.polyline(
            [
              [match.plumber.serviceAreaLat, match.plumber.serviceAreaLng],
              [booking.lat, booking.lng],
            ],
            {
              color: '#6366f1',
              weight: 2,
              dashArray: '5, 10',
              opacity: 0.5,
            }
          ).addTo(layersRef.current!);
        }
      }
    });
  }, [booking, matchedPlumbers]);

  return <div ref={containerRef} className="h-full w-full" />;
};

const MatchingPage: React.FC = () => {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data: unmatchedBookings, isLoading: loadingUnmatched } = useQuery({
    queryKey: ['unmatchedBookings'],
    queryFn: () => adminApi.matching.getUnmatchedBookings(),
  });

  const { data: matchResult, isLoading: loadingMatch } = useQuery({
    queryKey: ['matchSimulation', selectedBookingId],
    queryFn: () => adminApi.matching.simulate(selectedBookingId!),
    enabled: !!selectedBookingId,
  });

  const booking = matchResult?.booking;
  const matchedPlumbers = matchResult?.matchedPlumbers || [];

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <GitMerge className="w-7 h-7 text-indigo-400" />
          Matching Client-Plombier
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Simulez et visualisez le matching des réservations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Unmatched bookings */}
        <div className="lg:col-span-1">
          <div className="stat-card">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Réservations en attente ({unmatchedBookings?.length || 0})
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingUnmatched ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
                ))
              ) : unmatchedBookings && unmatchedBookings.length > 0 ? (
                unmatchedBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedBookingId(booking.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedBookingId === booking.id
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-[var(--bg-surface)] hover:brightness-110'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{booking.addressCity}</p>
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          {booking.addressStreet}
                        </p>
                        <p className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          <Clock className="w-3 h-3" />
                          {new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                  <GitMerge className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune réservation en attente</p>
                </div>
              )}
            </div>
          </div>

          {/* Match results */}
          {selectedBookingId && (
            <div className="stat-card mt-6">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Plombiers compatibles ({matchedPlumbers.length})
              </h2>

              {loadingMatch ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : matchedPlumbers.length > 0 ? (
                <div className="space-y-2">
                  {matchedPlumbers.map((match, idx) => (
                    <Link
                      key={match.plumber.id}
                      to={`/plumbers/${match.plumber.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] hover:brightness-110 transition-colors"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold">
                          {match.plumber.user.firstName.charAt(0)}
                        </div>
                        {idx === 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold">
                            1
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {match.plumber.user.firstName} {match.plumber.user.lastName}
                        </p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                            <Navigation className="w-3 h-3" />
                            {match.distance.toFixed(1)} km
                          </span>
                          {match.plumber.averageRating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              {match.plumber.averageRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-lg">
                          Score: {match.score}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun plombier disponible</p>
                  <p className="text-sm mt-1">dans cette zone</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right - Map */}
        <div className="lg:col-span-2">
          <div className="stat-card h-full relative">
            <h2 className="font-bold mb-4">Visualisation du matching</h2>

            <div className="h-[500px] rounded-xl overflow-hidden">
              <MatchingMap booking={booking} matchedPlumbers={matchedPlumbers} />
            </div>

            {!selectedBookingId && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'var(--bg-surface)' }}>
                <div className="text-center">
                  <GitMerge className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Sélectionnez une réservation pour voir le matching
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingPage;
