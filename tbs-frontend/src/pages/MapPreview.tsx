import { useEffect, useRef } from 'react';
import L from 'leaflet';
import Navbar from '@/components/Navbar';

const MapPreview = () => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [27.7172, 85.3240],
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4 text-secondary">Leaflet Map Preview</h1>
        <p className="text-muted-foreground mb-6">Use this page to confirm Leaflet tiles load correctly in your environment.</p>
        <div className="rounded-xl border border-border overflow-hidden">
          <div ref={containerRef} className="h-[480px] w-full" />
        </div>
      </div>
    </div>
  );
};

export default MapPreview;

