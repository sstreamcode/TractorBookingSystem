import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookingsForUI } from '@/lib/api';
import type { Booking } from '@/types';
import { toast } from 'sonner';

// Leaflet runtime imports
import L from 'leaflet';

const Tracking = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [position, setPosition] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Find an active booking (now within start-end and not cancelled)
  const activeBooking = useMemo(() => {
    const now = Date.now();
    return bookings.find((b) => {
      const start = new Date(b.startDate).getTime();
      const end = new Date(b.endDate).getTime();
      const isActiveTime = start <= now && now <= end;
      const notCancelled = b.status !== 'cancelled';
      return isActiveTime && notCancelled;
    });
  }, [bookings]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const data = await getMyBookingsForUI();
        setBookings(data);
      } catch (e) {
        // Non-blocking
      }
    })();
  }, [isAuthenticated]);

  // Initialize the leaflet map once when we have a first position
  useEffect(() => {
    if (!position) return;
    if (mapRef.current) return;

    const map = L.map('tracking-map', {
      center: [position.lat, position.lng],
      zoom: 14,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const userIcon = L.divIcon({
      className: 'rounded-full shadow-md',
      html: '<div style="background:#16a34a;width:14px;height:14px;border-radius:9999px;border:2px solid white;"></div>',
      iconAnchor: [7, 7],
    });
    const marker = L.marker([position.lat, position.lng], { icon: userIcon }).addTo(map);
    userMarkerRef.current = marker;

    if (position.accuracy && position.accuracy > 0) {
      const circle = L.circle([position.lat, position.lng], {
        radius: position.accuracy,
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
      accuracyCircleRef.current = circle;
    }
  }, [position]);

  // Watch geolocation and update marker/circle
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation not supported by this browser');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPosition({ lat: latitude, lng: longitude, accuracy });
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setLatLng([latitude, longitude]);
          accuracyCircleRef.current.setRadius(accuracy || 0);
        }
        if (mapRef.current) {
          // Pan smoothly but avoid jitter with small changes
          mapRef.current.setView([latitude, longitude], mapRef.current.getZoom(), { animate: true });
        }
      },
      (err) => {
        setGeoError(err.message || 'Unable to get location');
        toast.error('Location permission denied or unavailable.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-secondary">Real-Time Tractor Tracking</h1>
          <p className="text-sm text-muted-foreground">
            {activeBooking
              ? `Tracking your hired tractor: ${activeBooking.tractorName}`
              : 'No active booking found. We will center on your current location if available.'}
          </p>
          {geoError && <p className="mt-2 text-sm text-red-600">{geoError}</p>}
        </div>
        <div id="tracking-map" className="h-[70vh] w-full rounded-xl border bg-muted"></div>
        <div className="mt-3 text-xs text-muted-foreground">
          This demo centers the tractor at your live device location during an active booking. For production-grade
          tracking, pair an operator app or tracker device to send authenticated GPS updates to the backend and broadcast
          to this map in real time.
        </div>
      </div>
    </div>
  );
};

export default Tracking;


