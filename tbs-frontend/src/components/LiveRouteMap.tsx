import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LatLngLabel {
  lat: number;
  lng: number;
  label?: string;
}

interface LiveRouteMapProps {
  current?: LatLngLabel | null;
  destination?: LatLngLabel | null;
  route?: Array<{ lat: number; lng: number }>;
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [27.7172, 85.324];

const LiveRouteMap = ({ current, destination, route = [], className = 'h-80 w-full rounded-xl border' }: LiveRouteMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ current?: L.Marker; destination?: L.Marker; route?: L.Polyline }>({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: current ? [current.lat, current.lng] : DEFAULT_CENTER,
      zoom: 13,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 150);
    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Update current marker
    if (layersRef.current.current) {
      layersRef.current.current.remove();
      layersRef.current.current = undefined;
    }
    if (current) {
      layersRef.current.current = L.marker([current.lat, current.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:18px;height:18px;border-radius:50%;background:#10b981;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.2);"></div>',
          iconAnchor: [9, 9],
        }),
      }).bindTooltip(current.label || 'Current location', { direction: 'top' }).addTo(map);
    }

    // Update destination marker
    if (layersRef.current.destination) {
      layersRef.current.destination.remove();
      layersRef.current.destination = undefined;
    }
    if (destination) {
      layersRef.current.destination = L.marker([destination.lat, destination.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:18px;height:18px;border-radius:6px;background:#f97316;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.2);"></div>',
          iconAnchor: [9, 9],
        }),
      }).bindTooltip(destination.label || 'Destination', { direction: 'top' }).addTo(map);
    }

    // Update route polyline
    if (layersRef.current.route) {
      layersRef.current.route.remove();
      layersRef.current.route = undefined;
    }
    const segments = route && route.length >= 2 ? route : current && destination ? [current, destination] : [];
    if (segments.length >= 2) {
      const latLngs = segments.map((point) => [point.lat, point.lng]) as [number, number][];
      layersRef.current.route = L.polyline(latLngs, {
        color: '#0ea5e9',
        weight: 5,
        opacity: 0.85,
      }).addTo(map);
      map.fitBounds(layersRef.current.route.getBounds().pad(0.25));
    } else if (current) {
      map.setView([current.lat, current.lng], 13, { animate: true });
    }
  }, [current, destination, JSON.stringify(route)]);

  return <div ref={containerRef} className={className} />;
};

export default LiveRouteMap;

