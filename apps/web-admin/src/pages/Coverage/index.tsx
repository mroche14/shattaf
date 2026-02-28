import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import { Map, Filter, Users, MapPin, AlertCircle, Info } from 'lucide-react';
import { adminApi, PlumberLocation, BookingLocation } from '../../api/client';

// Ensure Leaflet CSS is loaded
import 'leaflet/dist/leaflet.css';

// Department centers
const DEPARTMENTS = {
  // DOM-TOM
  '971': { name: 'Guadeloupe', center: [16.265, -61.551] as [number, number], zoom: 10 },
  '972': { name: 'Martinique', center: [14.641, -61.024] as [number, number], zoom: 10 },
  '973': { name: 'Guyane', center: [4.938, -52.326] as [number, number], zoom: 7 },
  '974': { name: 'Réunion', center: [-21.115, 55.536] as [number, number], zoom: 10 },
};

// Custom icons - small symbols
const createPlumberIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
      <circle cx="8" cy="8" r="6" fill="#6366f1" stroke="#fff" stroke-width="1.5"/>
    </svg>
  `),
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

const createBookingIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
      <circle cx="6" cy="6" r="5" fill="#06b6d4" stroke="#fff" stroke-width="1"/>
    </svg>
  `),
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -6],
});

const createInterventionIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="10" height="10">
      <circle cx="5" cy="5" r="4" fill="#22c55e" stroke="#fff" stroke-width="1"/>
    </svg>
  `),
  iconSize: [10, 10],
  iconAnchor: [5, 5],
  popupAnchor: [0, -5],
});

// Map component using vanilla Leaflet
interface CoverageMapProps {
  mapConfig: { center: [number, number]; zoom: number };
  plumbers: PlumberLocation[] | undefined;
  bookings: BookingLocation[] | undefined;
  showPlumbers: boolean;
  showBookings: boolean;
  showServiceAreas: boolean;
  showInterventions: boolean;
}

const CoverageMap: React.FC<CoverageMapProps> = ({
  mapConfig,
  plumbers,
  bookings,
  showPlumbers,
  showBookings,
  showServiceAreas,
  showInterventions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: mapConfig.center,
      zoom: mapConfig.zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = null;
      }
    };
  }, []);

  // Update map view when config changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(mapConfig.center, mapConfig.zoom);
    }
  }, [mapConfig.center, mapConfig.zoom]);

  // Update markers
  useEffect(() => {
    if (!markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    const plumberIcon = createPlumberIcon();
    const bookingIcon = createBookingIcon();
    const interventionIcon = createInterventionIcon();

    // Add plumber markers and service areas
    if (showPlumbers && plumbers) {
      plumbers.forEach((plumber) => {
        if (plumber.lat && plumber.lng) {
          // Service area circle
          if (showServiceAreas) {
            L.circle([plumber.lat, plumber.lng], {
              radius: plumber.radius * 1000,
              color: '#f59e0b',
              fillColor: '#f59e0b',
              fillOpacity: 0.08,
              weight: 1,
            }).addTo(markersRef.current!);
          }

          // Plumber marker
          const marker = L.marker([plumber.lat, plumber.lng], { icon: plumberIcon });
          marker.bindPopup(`
            <div style="min-width: 180px;">
              <h3 style="font-weight: bold; font-size: 1.1em; margin-bottom: 4px;">${plumber.name}</h3>
              <p style="color: #6b7280; font-size: 0.9em; margin: 2px 0;">Zone: ${plumber.radius} km</p>
              <p style="color: #6b7280; font-size: 0.9em; margin: 2px 0;">
                Statut: <span style="color: ${plumber.status === 'active' ? '#22c55e' : '#f59e0b'};">${plumber.status === 'active' ? 'Actif' : 'Inactif'}</span>
              </p>
            </div>
          `);
          marker.addTo(markersRef.current!);
        }
      });
    }

    // Add booking markers - separate pending (réservations) from completed (interventions)
    if (bookings) {
      bookings.forEach((booking) => {
        if (booking.lat && booking.lng) {
          const isCompleted = booking.status === 'accepted'; // Accepted = completed intervention
          const isPending = booking.status === 'submitted' || booking.status === 'quoted';

          // Show réservations (pending bookings) if showBookings is on
          if (showBookings && isPending) {
            const marker = L.marker([booking.lat, booking.lng], { icon: bookingIcon });
            marker.bindPopup(`
              <div>
                <h4 style="font-weight: 500;">Réservation</h4>
                <p style="color: #6b7280; font-size: 0.9em;">Statut: ${booking.status}</p>
                <p style="color: #6b7280; font-size: 0.8em;">
                  ${new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            `);
            marker.addTo(markersRef.current!);
          }

          // Show interventions (completed bookings) if showInterventions is on
          if (showInterventions && isCompleted) {
            const marker = L.marker([booking.lat, booking.lng], { icon: interventionIcon });
            marker.bindPopup(`
              <div>
                <h4 style="font-weight: 500;">Intervention</h4>
                <p style="color: #22c55e; font-size: 0.9em;">Terminée</p>
                <p style="color: #6b7280; font-size: 0.8em;">
                  ${new Date(booking.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            `);
            marker.addTo(markersRef.current!);
          }
        }
      });
    }
  }, [plumbers, bookings, showPlumbers, showBookings, showServiceAreas, showInterventions]);

  return <div ref={containerRef} className="h-full w-full" />;
};

const CoveragePage: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('971');
  const [showPlumbers, setShowPlumbers] = useState(true);
  const [showBookings, setShowBookings] = useState(true);
  const [showServiceAreas, setShowServiceAreas] = useState(true);
  const [showInterventions, setShowInterventions] = useState(true);

  const { data: plumbers } = useQuery({
    queryKey: ['coveragePlumbers', selectedDepartment],
    queryFn: () => adminApi.coverage.getPlumberLocations(selectedDepartment),
  });

  const { data: bookings } = useQuery({
    queryKey: ['coverageBookings', selectedDepartment],
    queryFn: () => adminApi.coverage.getBookingLocations(selectedDepartment),
  });

  const { data: coverageStats } = useQuery({
    queryKey: ['coverageStats'],
    queryFn: () => adminApi.coverage.getCoverageStats(),
  });

  const mapConfig = DEPARTMENTS[selectedDepartment as keyof typeof DEPARTMENTS] || DEPARTMENTS['971'];

  const currentDeptStats = useMemo(() => {
    return coverageStats?.departments.find((d) => d.code === selectedDepartment);
  }, [coverageStats, selectedDepartment]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 lg:p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Map className="w-7 h-7 text-indigo-400" />
              Carte de couverture
            </h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              Visualisez la couverture des plombiers par département
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-xl px-4 py-2 outline-none focus:border-indigo-500 transition-colors"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              {Object.entries(DEPARTMENTS).map(([code, dept]) => (
                <option key={code} value={code}>
                  {dept.name} ({code})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <FilterToggle
                active={showPlumbers}
                onClick={() => setShowPlumbers(!showPlumbers)}
                color="indigo"
                icon={<Users className="w-4 h-4" />}
                label="Plombiers"
              />
              <FilterToggle
                active={showBookings}
                onClick={() => setShowBookings(!showBookings)}
                color="cyan"
                icon={<MapPin className="w-4 h-4" />}
                label="Réservations"
              />
              <FilterToggle
                active={showServiceAreas}
                onClick={() => setShowServiceAreas(!showServiceAreas)}
                color="amber"
                icon={<Filter className="w-4 h-4" />}
                label="Zones"
              />
              <FilterToggle
                active={showInterventions}
                onClick={() => setShowInterventions(!showInterventions)}
                color="green"
                icon={<MapPin className="w-4 h-4" />}
                label="Interventions"
              />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {currentDeptStats && (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card p-3">
              <p className="text-2xl font-bold text-indigo-400">{currentDeptStats.plumberCount}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Plombiers actifs</p>
            </div>
            <div className="stat-card p-3">
              <p className="text-2xl font-bold text-cyan-400">{currentDeptStats.bookingCount}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Réservations</p>
            </div>
            <div className="stat-card p-3">
              <p className="text-2xl font-bold text-emerald-400">{currentDeptStats.coverageScore}%</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Score couverture</p>
            </div>
            <div className="stat-card p-3 flex items-center gap-2">
              <Info className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {plumbers?.length || 0} sur la carte
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <CoverageMap
          key={selectedDepartment}
          mapConfig={mapConfig}
          plumbers={plumbers}
          bookings={bookings}
          showPlumbers={showPlumbers}
          showBookings={showBookings}
          showServiceAreas={showServiceAreas}
          showInterventions={showInterventions}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-gray-200 rounded-xl p-4 z-[1000] shadow-lg">
          <h4 className="font-medium text-sm mb-2 text-gray-800">Légende</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500 border border-white shadow" />
              <span className="text-gray-600">Plombiers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white shadow" />
              <span className="text-gray-600">Réservations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 border border-white shadow" />
              <span className="text-gray-600">Interventions</span>
            </div>
            {showServiceAreas && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-amber-500 bg-amber-500/20" />
                <span className="text-gray-600">Zone de service</span>
              </div>
            )}
          </div>
        </div>

        {/* No data warning */}
        {(!plumbers || plumbers.length === 0) && (!bookings || bookings.length === 0) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur border border-gray-200 rounded-xl p-6 z-[1000] text-center shadow-lg">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-gray-800">Aucune donnée</h3>
            <p className="text-gray-500 text-sm mt-1">
              Aucun plombier ou réservation dans ce département
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface FilterToggleProps {
  active: boolean;
  onClick: () => void;
  color: string;
  icon: React.ReactNode;
  label: string;
}

const FilterToggle: React.FC<FilterToggleProps> = ({ active, onClick, color, icon, label }) => {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-500/20 border-indigo-500 text-indigo-300',
    cyan: 'bg-cyan-500/20 border-cyan-500 text-cyan-300',
    emerald: 'bg-emerald-500/20 border-emerald-500 text-emerald-300',
    amber: 'bg-amber-500/20 border-amber-500 text-amber-300',
    green: 'bg-green-500/20 border-green-500 text-green-300',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
        active
          ? colorClasses[color]
          : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-tertiary)]'
      }`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
};

export default CoveragePage;
