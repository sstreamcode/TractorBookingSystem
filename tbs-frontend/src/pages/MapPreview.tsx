import { useEffect, useRef } from 'react';
import L from 'leaflet';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

const MapPreview = () => {
  const { t } = useLanguage();
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
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4 text-slate-100">{t('mappreview.title')}</h1>
        <p className="text-slate-400 mb-6">{t('mappreview.description')}</p>
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <div ref={containerRef} className="h-[480px] w-full" />
        </div>
      </div>
    </div>
  );
};

export default MapPreview;

