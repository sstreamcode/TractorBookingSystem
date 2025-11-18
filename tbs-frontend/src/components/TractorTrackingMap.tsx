import { memo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Tractor } from 'lucide-react';

export type TractorTrackingPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'available' | 'partial' | 'booked';
  owner?: string;
  address?: string;
};

const STATUS_COLORS: Record<TractorTrackingPoint['status'], string> = {
  available: '#22c55e',
  partial: '#f97316',
  booked: '#ef4444',
};

interface Props {
  points: TractorTrackingPoint[];
  className?: string;
  mapZIndex?: number;
}

const DEFAULT_CENTER: [number, number] = [27.7172, 85.3240];

const tractorIconSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 7h-1.26l-.94-2.82A2 2 0 0 0 15 3H9a2 2 0 0 0-1.8 1.11L5.22 7H5a4 4 0 0 0-4 4v6a2 2 0 0 0 2 2h1a4 4 0 0 0 7.9 0h2.2a4 4 0 0 0 7.9 0H21a2 2 0 0 0 2-2v-6a4 4 0 0 0-4-4Zm-9.73-2h5.46l.67 2H8.6ZM4 11h16a2 2 0 0 1 2 2v1h-1.53a4 4 0 0 0-7.9 0H11v-2a1 1 0 0 0-1-1H4.18A2 2 0 0 1 4 11Zm2 9a2 2 0 1 1 2-2 2 2 0 0 1-2 2Zm12 0a2 2 0 1 1 2-2 2 2 0 0 1-2 2Z"/>
  </svg>`
);

const TractorTrackingMap = ({ points, className = 'h-96 w-full rounded-xl border', mapZIndex = 1 }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const panes = map.getPanes();
    if (panes) {
      const baseZ = mapZIndex;
      panes.mapPane.style.zIndex = `${baseZ}`;
      panes.tilePane.style.zIndex = `${baseZ}`;
      panes.overlayPane.style.zIndex = `${baseZ + 1}`;
      panes.markerPane.style.zIndex = `${baseZ + 2}`;
      panes.popupPane.style.zIndex = `${baseZ + 3}`;
      panes.tooltipPane.style.zIndex = `${baseZ + 4}`;
    }

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) return;

    markerLayerRef.current.clearLayers();

    if (!points.length) return;

    const bounds = L.latLngBounds([]);

    points.forEach((point) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${STATUS_COLORS[point.status]};color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.2);">
          <img src="data:image/svg+xml,${tractorIconSvg}" alt="tractor" style="width:14px;height:14px;filter:invert(1);" />
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([point.lat, point.lng], { icon }).bindPopup(
        `
          <div style="min-width:200px;font-family:'Inter',system-ui,sans-serif;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <strong style="color:#0f172a;font-size:14px;">${point.name}</strong>
              <span style="font-size:11px;padding:4px 8px;border-radius:999px;background:${STATUS_COLORS[point.status]}22;color:${STATUS_COLORS[point.status]};text-transform:capitalize;">
                ${point.status === 'partial' ? 'Partially booked' : point.status === 'booked' ? 'Booked' : 'Available'}
              </span>
            </div>
            ${point.owner ? `<p style="margin:6px 0 0;font-size:12px;color:#475569;">Booked by <span style="font-weight:600;color:#0f172a;">${point.owner}</span></p>` : ''}
            ${point.address ? `<p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">${point.address}</p>` : ''}
          </div>
        `
      );

      marker.addTo(markerLayerRef.current!);
      bounds.extend([point.lat, point.lng]);
    });

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds.pad(0.2));
    }
  }, [points]);

  return <div ref={containerRef} className={className} />;
};

export default memo(TractorTrackingMap);

