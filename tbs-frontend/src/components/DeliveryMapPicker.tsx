import { memo, useEffect, useRef } from 'react';
import L from 'leaflet';

type LocationValue = {
  lat: number;
  lng: number;
  address: string;
};

interface DeliveryMapPickerProps {
  value?: LocationValue | null;
  onChange?: (location: LocationValue) => void;
  readOnly?: boolean;
  className?: string;
  mapZIndex?: number;
}

const DEFAULT_CENTER: [number, number] = [27.7172, 85.3240];

const DeliveryMapPicker = ({ value, onChange, readOnly, className = 'h-64 w-full', mapZIndex = 1 }: DeliveryMapPickerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const initialCenter = useRef<[number, number]>(value ? [value.lat, value.lng] : DEFAULT_CENTER);
  const lastSerializedValue = useRef<string | null>(value ? `${value.lat}-${value.lng}` : null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: initialCenter.current,
      zoom: 12,
    });

    const primaryTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    });

    const fallbackTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors & CARTO',
    });

    primaryTiles.on('tileerror', () => {
      if (map.hasLayer(primaryTiles)) {
        map.removeLayer(primaryTiles);
        fallbackTiles.addTo(map);
      }
    });

    primaryTiles.addTo(map);

    if (!readOnly && onChange) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          );
          const data = await res.json();
          if (data.display_name) {
            address = data.display_name;
          }
        } catch {
          // ignore reverse geocode errors
        }
        onChange({ lat, lng, address });
      });
    }

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

    // Set z-index for zoom controls to be below sidebar and form elements
    // Leaflet adds zoom controls automatically, we need to find them in the DOM
    const setZIndex = () => {
      const zoomControlElement = containerRef.current?.querySelector('.leaflet-control-zoom') as HTMLElement;
      if (zoomControlElement) {
        zoomControlElement.style.zIndex = '1';
        zoomControlElement.style.position = 'relative';
      }
      // Also set z-index for the map container itself
      if (containerRef.current) {
        const mapContainer = containerRef.current.querySelector('.leaflet-container') as HTMLElement;
        if (mapContainer) {
          mapContainer.style.zIndex = `${mapZIndex}`;
        }
      }
      // Set z-index for all leaflet controls
      const allControls = containerRef.current?.querySelectorAll('.leaflet-control') as NodeListOf<HTMLElement>;
      allControls?.forEach((control) => {
        control.style.zIndex = '1';
      });
    };
    
    setTimeout(setZIndex, 100);
    setTimeout(setZIndex, 500);
    setTimeout(setZIndex, 1000);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [onChange, readOnly]);

  useEffect(() => {
    if (!mapRef.current || !value) return;

    const serialized = `${value.lat}-${value.lng}`;
    if (lastSerializedValue.current === serialized) {
      return;
    }
    lastSerializedValue.current = serialized;

    if (!markerRef.current) {
      markerRef.current = L.marker([value.lat, value.lng]).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
    mapRef.current.setView([value.lat, value.lng]);
  }, [value]);

  return <div ref={containerRef} className={className} />;
};

export default memo(DeliveryMapPicker);

