import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import L from 'leaflet';
import { Map, Users, MapPin, AlertCircle, UserPlus, Crosshair, RotateCcw, Search, Loader2, ShieldOff, Play } from 'lucide-react';
import { adminApi, PlumberLocation, BookingLocation, ProspectMapItem, PlumberScoreItem, DeadZoneResponse } from '../../api/client';

// Ensure Leaflet CSS is loaded
import 'leaflet/dist/leaflet.css';

// Haversine distance in km between two lat/lng points
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Prospect with computed distance from simulation point
interface NearbyProspect {
  prospect: ProspectMapItem;
  distance_km: number;
}

// Debounce hook for slider values
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

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

const createProspectIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12">
      <circle cx="6" cy="6" r="5" fill="#f97316" stroke="#fff" stroke-width="1"/>
    </svg>
  `),
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -6],
});

const createSimulationIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="#ec4899" fill-opacity="0.3" stroke="#ec4899" stroke-width="2">
        <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="12" cy="12" r="4" fill="#ec4899" stroke="#fff" stroke-width="1.5"/>
      <line x1="12" y1="2" x2="12" y2="6" stroke="#ec4899" stroke-width="1.5"/>
      <line x1="12" y1="18" x2="12" y2="22" stroke="#ec4899" stroke-width="1.5"/>
      <line x1="2" y1="12" x2="6" y2="12" stroke="#ec4899" stroke-width="1.5"/>
      <line x1="18" y1="12" x2="22" y2="12" stroke="#ec4899" stroke-width="1.5"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Map component using vanilla Leaflet
interface CoverageMapProps {
  mapConfig: { center: [number, number]; zoom: number };
  plumbers: PlumberLocation[] | undefined;
  bookings: BookingLocation[] | undefined;
  prospects: ProspectMapItem[] | undefined;
  showPlumbers: boolean;
  showBookings: boolean;
  showInterventions: boolean;
  showProspects: boolean;
  simulationMode: boolean;
  simulationPoint: { lat: number; lng: number } | null;
  simulationResults: PlumberScoreItem[] | undefined;
  simulationTab: 'plumbers' | 'prospects';
  nearbyProspects: NearbyProspect[];
  onMapClick: (lat: number, lng: number) => void;
  deadZoneGeoJson: object | null;
  showDeadZones: boolean;
  departmentBoundary: object | null;
}

const CoverageMap: React.FC<CoverageMapProps> = ({
  mapConfig,
  plumbers,
  bookings,
  prospects,
  showPlumbers,
  showBookings,
  showInterventions,
  showProspects,
  simulationMode,
  simulationPoint,
  simulationResults,
  simulationTab,
  nearbyProspects,
  onMapClick,
  deadZoneGeoJson,
  showDeadZones,
  departmentBoundary,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const simulationLayerRef = useRef<L.LayerGroup | null>(null);
  const deadZoneLayerRef = useRef<L.LayerGroup | null>(null);
  // Stable ref for the click handler to avoid stale closures
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

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
    simulationLayerRef.current = L.layerGroup().addTo(map);
    deadZoneLayerRef.current = L.layerGroup().addTo(map);

    // Click handler uses ref to always get fresh callback
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickRef.current(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = null;
        simulationLayerRef.current = null;
        deadZoneLayerRef.current = null;
      }
    };
  }, []);

  // Toggle crosshair cursor when simulation mode changes
  useEffect(() => {
    if (!containerRef.current) return;
    if (simulationMode) {
      containerRef.current.style.cursor = 'crosshair';
    } else {
      containerRef.current.style.cursor = '';
    }
  }, [simulationMode]);

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
    const prospectIcon = createProspectIcon();

    // Add plumber markers and service areas
    if (showPlumbers && plumbers) {
      plumbers.forEach((plumber) => {
        if (plumber.lat && plumber.lng) {
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
    // Add prospect markers
    if (showProspects && prospects) {
      const STATUS_LABELS: Record<string, string> = {
        not_contacted: 'Non contacté',
        contacted: 'Contacté',
        interested: 'Intéressé',
        not_interested: 'Non intéressé',
        registered: 'Inscrit',
      };
      prospects.forEach((prospect) => {
        const marker = L.marker([prospect.lat, prospect.lng], { icon: prospectIcon });
        marker.bindPopup(`
          <div style="min-width: 180px;">
            <h3 style="font-weight: bold; font-size: 1.1em; margin-bottom: 4px;">${prospect.name}</h3>
            ${prospect.ville ? `<p style="color: #6b7280; font-size: 0.9em; margin: 2px 0;">${prospect.ville}</p>` : ''}
            ${prospect.telephone ? `<p style="color: #6b7280; font-size: 0.9em; margin: 2px 0;">Tel: ${prospect.telephone}</p>` : ''}
            <p style="color: #6b7280; font-size: 0.9em; margin: 2px 0;">
              Statut: <span style="color: #f97316;">${STATUS_LABELS[prospect.contactStatus] || prospect.contactStatus}</span>
            </p>
            <p style="color: #6b7280; font-size: 0.85em; margin: 2px 0;">${prospect.typeJuridique?.toUpperCase() ?? 'Inconnu'}</p>
          </div>
        `);
        marker.addTo(markersRef.current!);
      });
    }
  }, [plumbers, bookings, prospects, showPlumbers, showBookings, showInterventions, showProspects]);

  // Update simulation overlay (separate layer so it doesn't flicker with data markers)
  useEffect(() => {
    if (!simulationLayerRef.current) return;
    simulationLayerRef.current.clearLayers();

    if (!simulationMode || !simulationPoint) return;

    // Simulation point marker with popup
    const simIcon = createSimulationIcon();
    const simMarker = L.marker([simulationPoint.lat, simulationPoint.lng], { icon: simIcon });
    simMarker.bindPopup(`
      <div style="min-width: 140px;">
        <h4 style="font-weight: bold; font-size: 1em; color: #ec4899; margin-bottom: 4px;">Point de simulation</h4>
        <p style="color: #6b7280; font-size: 0.85em; margin: 0;">${simulationPoint.lat.toFixed(4)}, ${simulationPoint.lng.toFixed(4)}</p>
        ${simulationResults ? `<p style="color: #6b7280; font-size: 0.85em; margin: 2px 0 0;">${simulationResults.length} plombier(s) trouvé(s)</p>` : ''}
      </div>
    `);
    simMarker.addTo(simulationLayerRef.current);

    // Highlight top 3 from the active tab with large ranked circles
    const RANK_FILLS = ['#facc15', '#9ca3af', '#d97706']; // gold, silver, bronze
    const RANK_STROKES = ['#a16207', '#4b5563', '#92400e'];

    if (simulationTab === 'plumbers' && simulationResults && simulationResults.length > 0) {
      simulationResults.slice(0, 3).forEach((result, i) => {
        const size = 28 - i * 4; // 28, 24, 20
        const icon = new L.Icon({
          iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
              <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${RANK_FILLS[i]}" stroke="${RANK_STROKES[i]}" stroke-width="2.5"/>
              <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.45}" font-weight="bold" fill="${RANK_STROKES[i]}" font-family="sans-serif">${i + 1}</text>
            </svg>
          `),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });
        const marker = L.marker([result.lat, result.lng], { icon, zIndexOffset: 1000 - i });
        marker.bindPopup(`
          <div style="min-width: 160px;">
            <h4 style="font-weight: bold; margin-bottom: 2px;">#${result.rank} ${result.name}</h4>
            <p style="color: #6b7280; font-size: 0.85em; margin: 2px 0;">${result.distance_km.toFixed(1)} km · Score: ${result.total_score.toFixed(1)}</p>
          </div>
        `);
        marker.addTo(simulationLayerRef.current!);
      });
    } else if (simulationTab === 'prospects' && nearbyProspects.length > 0) {
      nearbyProspects.slice(0, 3).forEach((np, i) => {
        const size = 28 - i * 4;
        const icon = new L.Icon({
          iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
              <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${RANK_FILLS[i]}" stroke="${RANK_STROKES[i]}" stroke-width="2.5"/>
              <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.45}" font-weight="bold" fill="${RANK_STROKES[i]}" font-family="sans-serif">${i + 1}</text>
            </svg>
          `),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });
        const marker = L.marker([np.prospect.lat, np.prospect.lng], { icon, zIndexOffset: 1000 - i });
        marker.bindPopup(`
          <div style="min-width: 160px;">
            <h4 style="font-weight: bold; margin-bottom: 2px;">#${i + 1} ${np.prospect.name}</h4>
            <p style="color: #6b7280; font-size: 0.85em; margin: 2px 0;">${np.distance_km.toFixed(1)} km · ${np.prospect.ville || ''}</p>
          </div>
        `);
        marker.addTo(simulationLayerRef.current!);
      });
    }
  }, [simulationMode, simulationPoint, simulationResults, simulationTab, nearbyProspects]);

  // Update dead zone overlay
  useEffect(() => {
    if (!deadZoneLayerRef.current) return;
    deadZoneLayerRef.current.clearLayers();

    if (!showDeadZones) return;

    // Render department boundary outline (dashed gray)
    if (departmentBoundary) {
      L.geoJSON(departmentBoundary as GeoJSON.GeoJsonObject, {
        style: {
          color: '#6b7280',
          weight: 2,
          dashArray: '6, 4',
          fillOpacity: 0,
        },
      }).addTo(deadZoneLayerRef.current);
    }

    // Render dead zone polygons (red semi-transparent)
    if (deadZoneGeoJson) {
      L.geoJSON(deadZoneGeoJson as GeoJSON.GeoJsonObject, {
        style: {
          color: '#ef4444',
          weight: 1.5,
          fillColor: '#ef4444',
          fillOpacity: 0.25,
          dashArray: '4, 4',
        },
      }).addTo(deadZoneLayerRef.current);
    }
  }, [showDeadZones, deadZoneGeoJson, departmentBoundary]);

  return <div ref={containerRef} className="h-full w-full" />;
};

const CoveragePage: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('971');
  const [showPlumbers, setShowPlumbers] = useState(true);
  const [showBookings, setShowBookings] = useState(true);
  const [showInterventions, setShowInterventions] = useState(true);
  const [showProspects, setShowProspects] = useState(false);

  // Prospect filter states (default: indépendants with phone)
  const [prospectType, setProspectType] = useState<string>('solo');
  const [prospectStatus, setProspectStatus] = useState<string>('all');
  const [prospectHasPhone, setProspectHasPhone] = useState(true);
  const [prospectHasEmail, setProspectHasEmail] = useState(false);

  // Dead zone state
  const [showDeadZones, setShowDeadZones] = useState(false);
  const [deadZoneMode, setDeadZoneMode] = useState<'distance' | 'time'>('distance');
  const [deadZoneThreshold, setDeadZoneThreshold] = useState(20);
  const [deadZoneResult, setDeadZoneResult] = useState<DeadZoneResponse | null>(null);
  const [departmentBoundary, setDepartmentBoundary] = useState<object | null>(null);
  const [deadZoneSource, setDeadZoneSource] = useState<'plumbers' | 'prospects' | 'both'>('plumbers');

  // Simulation state
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationPoint, setSimulationPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [simulationLabel, setSimulationLabel] = useState<string>('');
  const [weights, setWeights] = useState({ proximity: 40, quality: 35, load: 25 });
  const [simulationTab, setSimulationTab] = useState<'plumbers' | 'prospects'>('plumbers');

  // Debounce simulation params so sliders don't spam API calls
  const debouncedWeights = useDebounce(weights, 300);

  const { data: plumbers } = useQuery({
    queryKey: ['coveragePlumbers', selectedDepartment],
    queryFn: () => adminApi.coverage.getPlumberLocations(selectedDepartment),
  });

  const { data: bookings } = useQuery({
    queryKey: ['coverageBookings', selectedDepartment],
    queryFn: () => adminApi.coverage.getBookingLocations(selectedDepartment),
  });

  const needProspects = showProspects || (showDeadZones && deadZoneSource !== 'plumbers');
  const { data: prospects } = useQuery({
    queryKey: ['coverageProspects', selectedDepartment],
    queryFn: () => adminApi.prospects.getMap(selectedDepartment),
    enabled: needProspects,
  });

  const { data: coverageStats } = useQuery({
    queryKey: ['coverageStats'],
    queryFn: () => adminApi.coverage.getCoverageStats(),
  });

  // Dead zone mutation (compute on demand)
  const deadZoneMutation = useMutation({
    mutationFn: (opts?: { force?: boolean }) => {
      const includeProspects = deadZoneSource === 'prospects' || deadZoneSource === 'both';
      const extra_locations = includeProspects && filteredProspects
        ? filteredProspects.map((p) => ({ lat: p.lat, lng: p.lng }))
        : undefined;
      return adminApi.coverage.computeDeadZones({
        department: selectedDepartment,
        mode: deadZoneMode,
        threshold: deadZoneThreshold,
        include_plumbers: deadZoneSource !== 'prospects',
        extra_locations,
        force: opts?.force,
      });
    },
    onSuccess: (data) => setDeadZoneResult(data),
  });

  // Fetch department boundary when dead zones toggle is active
  useEffect(() => {
    if (showDeadZones && selectedDepartment) {
      adminApi.coverage.getDepartmentBoundary(selectedDepartment)
        .then((data) => setDepartmentBoundary(data.geojson))
        .catch(() => setDepartmentBoundary(null));
    }
  }, [showDeadZones, selectedDepartment]);

  // Clear dead zone results when department or source changes
  useEffect(() => {
    setDeadZoneResult(null);
  }, [selectedDepartment, deadZoneSource]);

  const { data: simulationResult, isLoading: simLoading, isFetching: simFetching } = useQuery({
    queryKey: ['matchingSimulation', simulationPoint, debouncedWeights, selectedDepartment],
    queryFn: () => adminApi.matching.simulatePoint({
      lat: simulationPoint!.lat,
      lng: simulationPoint!.lng,
      department: selectedDepartment,
      weights: debouncedWeights,
    }),
    enabled: simulationMode && !!simulationPoint,
    placeholderData: keepPreviousData,
  });

  const geocodeMutation = useMutation({
    mutationFn: (address: string) => adminApi.matching.geocodeAddress(address, selectedDepartment),
    onSuccess: (data) => {
      setSimulationPoint({ lat: data.lat, lng: data.lng });
      setSimulationLabel(data.label);
    },
  });

  const SOLO_TYPES = new Set(['EI', 'SAS', 'EURL']);
  const filteredProspects = useMemo(() => {
    if (!prospects) return undefined;
    return prospects.filter((p) => {
      const tj = p.typeJuridique;
      if (prospectType === 'solo' && !SOLO_TYPES.has(tj)) return false;
      if (prospectType !== 'all' && prospectType !== 'solo' && tj !== prospectType) return false;
      if (prospectStatus !== 'all' && p.contactStatus !== prospectStatus) return false;
      if (prospectHasPhone && !p.telephone) return false;
      if (prospectHasEmail && !p.email) return false;
      return true;
    });
  }, [prospects, prospectType, prospectStatus, prospectHasPhone, prospectHasEmail]);

  // Nearby prospects computed client-side from filtered prospects + simulation point
  const nearbyProspects = useMemo<NearbyProspect[]>(() => {
    if (!simulationMode || !simulationPoint || !filteredProspects) return [];
    return filteredProspects
      .map((prospect) => ({
        prospect,
        distance_km: haversineDistance(simulationPoint.lat, simulationPoint.lng, prospect.lat, prospect.lng),
      }))
      .sort((a, b) => a.distance_km - b.distance_km);
  }, [simulationMode, simulationPoint, filteredProspects]);

  const mapConfig = DEPARTMENTS[selectedDepartment as keyof typeof DEPARTMENTS] || DEPARTMENTS['971'];

  const currentDeptStats = useMemo(() => {
    return coverageStats?.departments.find((d) => d.code === selectedDepartment);
  }, [coverageStats, selectedDepartment]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (simulationMode) {
      setSimulationPoint({ lat, lng });
      setSimulationLabel('');
    }
  }, [simulationMode]);

  const toggleSimulation = useCallback(() => {
    setSimulationMode((prev) => {
      if (prev) {
        // Turning off: clear the point and label
        setSimulationPoint(null);
        setSimulationLabel('');
      }
      return !prev;
    });
  }, []);

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
                active={showInterventions}
                onClick={() => setShowInterventions(!showInterventions)}
                color="green"
                icon={<MapPin className="w-4 h-4" />}
                label="Interventions"
              />
              <FilterToggle
                active={showProspects}
                onClick={() => setShowProspects(!showProspects)}
                color="orange"
                icon={<UserPlus className="w-4 h-4" />}
                label="Prospects"
              />
              <FilterToggle
                active={showDeadZones}
                onClick={() => setShowDeadZones(!showDeadZones)}
                color="red"
                icon={<ShieldOff className="w-4 h-4" />}
                label="Zones mortes"
              />
              <FilterToggle
                active={simulationMode}
                onClick={toggleSimulation}
                color="pink"
                icon={<Crosshair className="w-4 h-4" />}
                label="Simulation"
              />
            </div>
          </div>
        </div>

        {/* Prospect filters (shown when prospects layer or dead zone source uses prospects) */}
        {(showProspects || (showDeadZones && deadZoneSource !== 'plumbers')) && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={prospectType}
              onChange={(e) => setProspectType(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              <option value="all">Tous les types</option>
              <option value="solo">Solo (EI+SAS+EURL)</option>
              <option value="EI">EI</option>
              <option value="SAS">SAS / SASU</option>
              <option value="EURL">EURL</option>
              <option value="SARL">SARL</option>
              <option value="autre">Autre</option>
            </select>
            <select
              value={prospectStatus}
              onChange={(e) => setProspectStatus(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              <option value="all">Tous les statuts</option>
              <option value="not_contacted">Non contacté</option>
              <option value="contacted">Contacté</option>
              <option value="interested">Intéressé</option>
              <option value="not_interested">Non intéressé</option>
              <option value="registered">Inscrit</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={prospectHasPhone}
                onChange={(e) => setProspectHasPhone(e.target.checked)}
                className="accent-orange-500"
              />
              Avec téléphone
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={prospectHasEmail}
                onChange={(e) => setProspectHasEmail(e.target.checked)}
                className="accent-orange-500"
              />
              Avec email
            </label>
          </div>
        )}

        {/* Dead zone controls */}
        {showDeadZones && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={deadZoneSource}
              onChange={(e) => setDeadZoneSource(e.target.value as 'plumbers' | 'prospects' | 'both')}
              className="rounded-lg px-3 py-1.5 text-sm outline-none transition-colors"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              <option value="plumbers">Plombiers actifs</option>
              <option value="prospects">Prospects</option>
              <option value="both">Plombiers + Prospects</option>
            </select>
            <select
              value={deadZoneMode}
              onChange={(e) => {
                const mode = e.target.value as 'distance' | 'time';
                setDeadZoneMode(mode);
                setDeadZoneThreshold(mode === 'distance' ? 20 : 30);
              }}
              className="rounded-lg px-3 py-1.5 text-sm outline-none transition-colors"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              <option value="distance">Distance (buffer)</option>
              <option value="time">Temps (isochrone)</option>
            </select>
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-[300px]">
              <input
                type="range"
                min={deadZoneMode === 'distance' ? 5 : 10}
                max={deadZoneMode === 'distance' ? 50 : 60}
                step={deadZoneMode === 'distance' ? 5 : 5}
                value={deadZoneThreshold}
                onChange={(e) => setDeadZoneThreshold(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ef4444 ${
                    ((deadZoneThreshold - (deadZoneMode === 'distance' ? 5 : 10)) /
                      ((deadZoneMode === 'distance' ? 50 : 60) - (deadZoneMode === 'distance' ? 5 : 10))) *
                    100
                  }%, #374151 ${
                    ((deadZoneThreshold - (deadZoneMode === 'distance' ? 5 : 10)) /
                      ((deadZoneMode === 'distance' ? 50 : 60) - (deadZoneMode === 'distance' ? 5 : 10))) *
                    100
                  }%)`,
                }}
              />
              <span className="text-sm font-mono min-w-[60px] text-right" style={{ color: 'var(--text-main)' }}>
                {deadZoneThreshold} {deadZoneMode === 'distance' ? 'km' : 'min'}
              </span>
            </div>
            <button
              onClick={() => deadZoneMutation.mutate({})}
              disabled={deadZoneMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deadZoneMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Calculer
            </button>
            {deadZoneResult && (
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>
                  Couverture: <strong className="text-emerald-400">{deadZoneResult.stats.coverage_percent}%</strong>
                </span>
                <span>
                  Zone morte: <strong className="text-red-400">{deadZoneResult.stats.dead_zone_area_km2} km²</strong>
                </span>
                <span>
                  Dept: <strong>{deadZoneResult.stats.department_area_km2} km²</strong>
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  ({deadZoneSource === 'plumbers'
                    ? `${deadZoneResult.plumber_count} plombier${deadZoneResult.plumber_count > 1 ? 's' : ''}`
                    : deadZoneSource === 'prospects'
                      ? `${deadZoneResult.point_count} prospect${deadZoneResult.point_count > 1 ? 's' : ''}`
                      : `${deadZoneResult.plumber_count} plombier${deadZoneResult.plumber_count > 1 ? 's' : ''} + ${deadZoneResult.point_count - deadZoneResult.plumber_count} prospect${(deadZoneResult.point_count - deadZoneResult.plumber_count) > 1 ? 's' : ''}`
                  })
                </span>
                {deadZoneResult.cached ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                    Cache
                    {deadZoneResult.cached_at && (
                      <span>({new Date(deadZoneResult.cached_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deadZoneMutation.mutate({ force: true }); }}
                      disabled={deadZoneMutation.isPending}
                      className="ml-0.5 hover:text-blue-300 transition-colors"
                      title="Recalculer (ignorer le cache)"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </span>
                ) : deadZoneResult.compute_ms > 0 ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {deadZoneResult.compute_ms < 1000
                      ? `${deadZoneResult.compute_ms}ms`
                      : `${(deadZoneResult.compute_ms / 1000).toFixed(1)}s`}
                  </span>
                ) : null}
              </div>
            )}
            {deadZoneMutation.isError && (
              <span className="text-sm text-red-400">
                {deadZoneMutation.error?.message || 'Erreur lors du calcul'}
              </span>
            )}
          </div>
        )}

        {/* Stats bar */}
        {currentDeptStats && (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card p-4 flex flex-col items-center text-center relative">
              <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Plombiers actifs</p>
              <p className="text-3xl font-bold text-indigo-400">{currentDeptStats.plumberCount}</p>
            </div>
            <div className="stat-card p-4 flex flex-col items-center text-center relative">
              <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Réservations</p>
              <p className="text-3xl font-bold text-cyan-400">{currentDeptStats.bookingCount}</p>
            </div>
            <div className="stat-card p-4 flex flex-col items-center text-center relative">
              <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Score couverture</p>
              <p className="text-3xl font-bold text-emerald-400">{currentDeptStats.coverageScore}%</p>
            </div>
            <div className="stat-card p-4 flex flex-col items-center text-center relative">
              <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-main)' }}>Prospects</p>
              <p className="text-3xl font-bold text-orange-400">{filteredProspects?.length || 0}</p>
              {filteredProspects && prospects && filteredProspects.length !== prospects.length && (
                <span className="absolute bottom-1.5 right-2.5 text-xs font-semibold text-orange-300/80">
                  / {prospects.length}
                </span>
              )}
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
          prospects={filteredProspects}
          showPlumbers={showPlumbers}
          showBookings={showBookings}
          showInterventions={showInterventions}
          showProspects={showProspects}
          simulationMode={simulationMode}
          simulationPoint={simulationPoint}
          simulationResults={simulationResult?.results}
          simulationTab={simulationTab}
          nearbyProspects={nearbyProspects}
          onMapClick={handleMapClick}
          deadZoneGeoJson={deadZoneResult?.geojson || null}
          showDeadZones={showDeadZones}
          departmentBoundary={departmentBoundary}
        />

        {/* Simulation results panel */}
        {simulationMode && (
          <SimulationPanel
            point={simulationPoint}
            label={simulationLabel}
            results={simulationResult?.results}
            loading={simLoading}
            fetching={simFetching}
            weights={weights}
            onWeightsChange={setWeights}
            onGeocode={(address) => geocodeMutation.mutate(address)}
            geocoding={geocodeMutation.isPending}
            geocodeError={geocodeMutation.error?.message}
            onReset={() => { setSimulationPoint(null); setSimulationLabel(''); }}
            // Map layer toggles
            showPlumbers={showPlumbers}
            onShowPlumbersChange={setShowPlumbers}
            showBookings={showBookings}
            onShowBookingsChange={setShowBookings}
            showInterventions={showInterventions}
            onShowInterventionsChange={setShowInterventions}
            showProspects={showProspects}
            onShowProspectsChange={setShowProspects}
            // Prospect filters
            prospectType={prospectType}
            onProspectTypeChange={setProspectType}
            prospectStatus={prospectStatus}
            onProspectStatusChange={setProspectStatus}
            prospectHasPhone={prospectHasPhone}
            onProspectHasPhoneChange={setProspectHasPhone}
            prospectHasEmail={prospectHasEmail}
            onProspectHasEmailChange={setProspectHasEmail}
            nearbyProspects={nearbyProspects}
            activeTab={simulationTab}
            onActiveTabChange={setSimulationTab}
          />
        )}

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
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white shadow" />
              <span className="text-gray-600">Prospects</span>
            </div>
            {showDeadZones && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded border-2 border-dashed border-red-500 bg-red-500/25" />
                <span className="text-gray-600">Zone morte</span>
              </div>
            )}
            {simulationMode && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500 border border-white shadow" />
                  <span className="text-gray-600">Point de simulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-yellow-700 text-[7px] font-bold text-yellow-800 flex items-center justify-center">1</div>
                    <div className="w-3 h-3 rounded-full bg-gray-300 border border-gray-500 text-[6px] font-bold text-gray-600 flex items-center justify-center">2</div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-amber-800 text-[5px] font-bold text-amber-100 flex items-center justify-center">3</div>
                  </div>
                  <span className="text-gray-600">Top 3</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* No data warning */}
        {(!plumbers || plumbers.length === 0) && (!bookings || bookings.length === 0) && (!filteredProspects || filteredProspects.length === 0) && (
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

// ============== Simulation Results Panel ==============

interface SimulationPanelProps {
  point: { lat: number; lng: number } | null;
  label: string;
  results: PlumberScoreItem[] | undefined;
  loading: boolean;
  fetching: boolean;
  weights: { proximity: number; quality: number; load: number };
  onWeightsChange: (w: { proximity: number; quality: number; load: number }) => void;
  onGeocode: (address: string) => void;
  geocoding: boolean;
  geocodeError?: string;
  onReset: () => void;
  // Map layer toggles
  showPlumbers: boolean;
  onShowPlumbersChange: (v: boolean) => void;
  showBookings: boolean;
  onShowBookingsChange: (v: boolean) => void;
  showInterventions: boolean;
  onShowInterventionsChange: (v: boolean) => void;
  showProspects: boolean;
  onShowProspectsChange: (v: boolean) => void;
  // Prospect filters
  prospectType: string;
  onProspectTypeChange: (v: string) => void;
  prospectStatus: string;
  onProspectStatusChange: (v: string) => void;
  prospectHasPhone: boolean;
  onProspectHasPhoneChange: (v: boolean) => void;
  prospectHasEmail: boolean;
  onProspectHasEmailChange: (v: boolean) => void;
  nearbyProspects: NearbyProspect[];
  activeTab: 'plumbers' | 'prospects';
  onActiveTabChange: (tab: 'plumbers' | 'prospects') => void;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({
  point,
  label,
  results,
  loading,
  fetching,
  weights,
  onWeightsChange,
  onGeocode,
  geocoding,
  geocodeError,
  onReset,
  showPlumbers,
  onShowPlumbersChange,
  showBookings,
  onShowBookingsChange,
  showInterventions,
  onShowInterventionsChange,
  showProspects,
  onShowProspectsChange,
  prospectType,
  onProspectTypeChange,
  prospectStatus,
  onProspectStatusChange,
  prospectHasPhone,
  onProspectHasPhoneChange,
  prospectHasEmail,
  onProspectHasEmailChange,
  nearbyProspects,
  activeTab,
  onActiveTabChange,
}) => {
  const [addressInput, setAddressInput] = useState('');

  const RANK_COLORS: Record<number, string> = {
    1: 'bg-yellow-400 text-yellow-900',
    2: 'bg-gray-300 text-gray-700',
    3: 'bg-amber-600 text-amber-100',
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput.trim()) {
      onGeocode(addressInput.trim());
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 z-[1000] bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-[calc(100%-2rem)] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-pink-500" />
            Simulation matching
          </h4>
          {point && (
            <button
              onClick={onReset}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Réinitialiser la simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Address search */}
        <form onSubmit={handleAddressSubmit} className="mt-2 flex gap-1.5">
          <input
            type="text"
            placeholder="Rechercher une adresse..."
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 outline-none focus:border-pink-400 transition-colors"
          />
          <button
            type="submit"
            disabled={geocoding || !addressInput.trim()}
            className="px-2 py-1.5 rounded-lg bg-pink-500 text-white text-xs hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </button>
        </form>
        {geocodeError && (
          <p className="text-xs text-red-500 mt-1">{geocodeError}</p>
        )}

        {/* Point info */}
        {point && (
          <div className="mt-2">
            {label && (
              <p className="text-xs text-gray-700 font-medium truncate">{label}</p>
            )}
            <p className="text-xs text-gray-400">
              {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
            </p>
            {(results || nearbyProspects.length > 0) && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                {results?.length || 0} plombier{(results?.length || 0) > 1 ? 's' : ''}
                {showProspects && <>, {nearbyProspects.length} prospect{nearbyProspects.length > 1 ? 's' : ''}</>}
                {fetching && <Loader2 className="w-3 h-3 animate-spin text-pink-400" />}
              </p>
            )}
          </div>
        )}
        {!point && (
          <p className="text-xs text-gray-400 mt-2">
            Recherchez une adresse ou cliquez sur la carte
          </p>
        )}
      </div>

      {/* Map layers */}
      <div className="p-3 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-600">Calques</span>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <MiniToggle active={showPlumbers} onClick={() => onShowPlumbersChange(!showPlumbers)} color="#6366f1" label="Plombiers" />
          <MiniToggle active={showBookings} onClick={() => onShowBookingsChange(!showBookings)} color="#06b6d4" label="Réservations" />
          <MiniToggle active={showInterventions} onClick={() => onShowInterventionsChange(!showInterventions)} color="#22c55e" label="Interventions" />
          <MiniToggle active={showProspects} onClick={() => onShowProspectsChange(!showProspects)} color="#f97316" label="Prospects" />
        </div>
        {/* Prospect sub-filters */}
        {showProspects && (
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1.5">
              <select
                value={prospectType}
                onChange={(e) => onProspectTypeChange(e.target.value)}
                className="flex-1 rounded-md px-2 py-1 text-[11px] border border-gray-200 bg-white text-gray-700 outline-none"
              >
                <option value="all">Tous types</option>
                <option value="solo">Solo</option>
                <option value="EI">EI</option>
                <option value="SAS">SAS</option>
                <option value="EURL">EURL</option>
                <option value="SARL">SARL</option>
                <option value="autre">Autre</option>
              </select>
              <select
                value={prospectStatus}
                onChange={(e) => onProspectStatusChange(e.target.value)}
                className="flex-1 rounded-md px-2 py-1 text-[11px] border border-gray-200 bg-white text-gray-700 outline-none"
              >
                <option value="all">Tous statuts</option>
                <option value="not_contacted">Non contacté</option>
                <option value="contacted">Contacté</option>
                <option value="interested">Intéressé</option>
                <option value="not_interested">Non intéressé</option>
                <option value="registered">Inscrit</option>
              </select>
            </div>
            <div className="flex gap-3">
              <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prospectHasPhone}
                  onChange={(e) => onProspectHasPhoneChange(e.target.checked)}
                  className="accent-orange-500 w-3 h-3"
                />
                Avec téléphone
              </label>
              <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prospectHasEmail}
                  onChange={(e) => onProspectHasEmailChange(e.target.checked)}
                  className="accent-orange-500 w-3 h-3"
                />
                Avec email
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Parameters */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        {/* Weight sliders */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">Pondération</span>
          <button
            onClick={() => onWeightsChange({ proximity: 40, quality: 35, load: 25 })}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Réinitialiser
          </button>
        </div>
        <WeightSlider
          label="Proximité"
          value={weights.proximity}
          onChange={(v) => onWeightsChange({ ...weights, proximity: v })}
          color="bg-blue-500"
        />
        <WeightSlider
          label="Qualité"
          value={weights.quality}
          onChange={(v) => onWeightsChange({ ...weights, quality: v })}
          color="bg-amber-500"
        />
        <WeightSlider
          label="Charge"
          value={weights.load}
          onChange={(v) => onWeightsChange({ ...weights, load: v })}
          color="bg-green-500"
        />
      </div>

      {/* Tab bar */}
      {point && (
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => onActiveTabChange('plumbers')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'plumbers'
                ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50/50'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Plombiers {results ? `(${results.length})` : ''}
          </button>
          <button
            onClick={() => onActiveTabChange('prospects')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'prospects'
                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Prospects ({nearbyProspects.length})
          </button>
        </div>
      )}

      {/* Results list */}
      <div className="flex-1 overflow-y-auto">
        {!point ? (
          <div className="p-6 text-center">
            <Crosshair className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">En attente d'un point...</p>
          </div>
        ) : activeTab === 'plumbers' ? (
          /* Plumber results tab */
          loading && !results ? (
            <div className="p-6 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-xs text-gray-400 mt-2">Calcul en cours...</p>
            </div>
          ) : results && results.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {results.map((r) => (
                <div key={r.plumber_id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                      RANK_COLORS[r.rank] || 'bg-gray-100 text-gray-500'
                    }`}>
                      {r.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-800 truncate">{r.name}</span>
                        <span className="text-sm font-bold text-pink-600 ml-2 flex-shrink-0">
                          {r.total_score.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        <span>{r.distance_km.toFixed(1)} km</span>
                        <span>{r.average_rating ? `${r.average_rating.toFixed(1)}★` : 'N/A'} ({r.total_ratings})</span>
                        <span>{r.total_missions_completed} missions</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <ScoreBar value={r.proximity_score} color="bg-blue-500" label="P" />
                        <ScoreBar value={r.quality_score} color="bg-amber-500" label="Q" />
                        <ScoreBar value={r.load_score} color="bg-green-500" label="C" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun plombier dans cette zone</p>
            </div>
          )
        ) : (
          /* Prospects tab */
          nearbyProspects.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {nearbyProspects.map((np, i) => (
                <div key={np.prospect.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 bg-orange-100 text-orange-600">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-800 truncate">{np.prospect.name}</span>
                        <span className="text-xs font-medium text-orange-500 ml-2 flex-shrink-0">
                          {np.distance_km.toFixed(1)} km
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        {np.prospect.ville && <span>{np.prospect.ville}</span>}
                        <span>{np.prospect.typeJuridique?.toUpperCase() ?? 'Inconnu'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {np.prospect.telephone && (
                          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                            {np.prospect.telephone}
                          </span>
                        )}
                        {np.prospect.email && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                            {np.prospect.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {showProspects ? 'Aucun prospect dans cette zone' : 'Activez le calque Prospects'}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ============== Sub-components ==============

const MiniToggle: React.FC<{ active: boolean; onClick: () => void; color: string; label: string }> = ({
  active, onClick, color, label,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-all ${
      active
        ? 'border-current font-medium'
        : 'border-gray-200 text-gray-400'
    }`}
    style={active ? { color, backgroundColor: `${color}15` } : undefined}
  >
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? color : '#d1d5db' }} />
    {label}
  </button>
);

const SLIDER_COLORS: Record<string, string> = {
  'bg-blue-500': '#3b82f6',
  'bg-amber-500': '#f59e0b',
  'bg-green-500': '#22c55e',
};

const WeightSlider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}> = ({ label, value, onChange, color }) => {
  const hex = SLIDER_COLORS[color] || '#3b82f6';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${hex} ${value}%, #e5e7eb ${value}%)`,
        }}
      />
      <span className="text-xs text-gray-500 w-7 text-right">{value}</span>
    </div>
  );
};

const ScoreBar: React.FC<{ value: number; color: string; label: string }> = ({ value, color, label }) => (
  <div className="flex items-center gap-0.5 flex-1">
    <span className="text-[10px] text-gray-400 w-3">{label}</span>
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

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
    orange: 'bg-orange-500/20 border-orange-500 text-orange-300',
    pink: 'bg-pink-500/20 border-pink-500 text-pink-300',
    red: 'bg-red-500/20 border-red-500 text-red-300',
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
