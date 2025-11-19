import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CircleCheck,
  Shield,
  Clock,
  Tractor,
  Gauge,
  Layers,
  Route,
  Radar,
  Sparkles,
  BarChart3,
  CalendarRange,
  MapPin,
  Trees,
} from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import TractorCard from '@/components/TractorCard';
import { getTractorsForUI, fetchLandingMetrics, fetchLatestDispatchSummary } from '@/lib/api';
import type { Tractor as TractorType } from '@/types';
import type { LandingMetricsResponse, DispatchSummaryResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const statsFallback = {
  districts: '35',
  response: '22m',
  utilization: '92%',
};

const platformFeaturesConfig = [
  {
    icon: Radar,
    titleKey: 'landing.platform.features.tracking.title',
    descKey: 'landing.platform.features.tracking.desc',
    metaKey: 'landing.platform.features.tracking.meta',
  },
  {
    icon: Layers,
    titleKey: 'landing.platform.features.operations.title',
    descKey: 'landing.platform.features.operations.desc',
    metaKey: 'landing.platform.features.operations.meta',
  },
  {
    icon: Route,
    titleKey: 'landing.platform.features.logistics.title',
    descKey: 'landing.platform.features.logistics.desc',
    metaKey: 'landing.platform.features.logistics.meta',
  },
];

const platformCardsConfig = [
  {
    titleKey: 'landing.platform.cards.track.title',
    bodyKey: 'landing.platform.cards.track.body',
    link: '/tracking',
    linkLabelKey: 'landing.platform.cards.track.linkLabel',
  },
  {
    titleKey: 'landing.platform.cards.catalog.title',
    bodyKey: 'landing.platform.cards.catalog.body',
    link: '/tractors',
    linkLabelKey: 'landing.platform.cards.catalog.linkLabel',
  },
  {
    titleKey: 'landing.platform.cards.admin.title',
    bodyKey: 'landing.platform.cards.admin.body',
    link: '/admin/dashboard',
    linkLabelKey: 'landing.platform.cards.admin.linkLabel',
  },
];

const workflowConfig = [
  {
    titleKey: 'landing.workflow.step1.title',
    descKey: 'landing.workflow.step1.desc',
  },
  {
    titleKey: 'landing.workflow.step2.title',
    descKey: 'landing.workflow.step2.desc',
  },
  {
    titleKey: 'landing.workflow.step3.title',
    descKey: 'landing.workflow.step3.desc',
  },
];

const testimonialsConfig = [
  {
    name: 'Sita Gurung',
    roleKey: 'landing.testimonial1.role',
    feedbackKey: 'landing.insights.testimonial1',
  },
  {
    name: 'Rupesh Thapa',
    roleKey: 'landing.testimonial2.role',
    feedbackKey: 'landing.insights.testimonial2',
  },
];

const insightHighlightsConfig = [
  { value: '4.8 / 5', labelKey: 'landing.insights.highlight.satisfaction.label', captionKey: 'landing.insights.highlight.satisfaction.caption' },
  { value: '97%', labelKey: 'landing.insights.highlight.ontime.label', captionKey: 'landing.insights.highlight.ontime.caption' },
  { value: '92%', labelKey: 'landing.insights.highlight.availability.label', captionKey: 'landing.insights.highlight.availability.caption' },
];

const dataCardsConfig = [
  { titleKey: 'landing.insights.dataFreshness.title', bodyKey: 'landing.insights.dataFreshness.body' },
  { titleKey: 'landing.insights.privacy.title', bodyKey: 'landing.insights.privacy.body' },
  { titleKey: 'landing.insights.exports.title', bodyKey: 'landing.insights.exports.body' },
];

const pricingPlansConfig = [
  {
    badgeKey: 'landing.pricing.plan.standard.badge',
    titleKey: 'landing.pricing.plan.standard.title',
    descKey: 'landing.pricing.plan.standard.desc',
    features: [
      'landing.pricing.plan.standard.feature1',
      'landing.pricing.plan.standard.feature2',
      'landing.pricing.plan.standard.feature3',
    ],
    ctaKey: 'landing.pricing.plan.standard.cta',
    variant: 'muted',
    linkTo: '/tractors',
    ctaStyle: 'secondary',
  },
  {
    badgeKey: 'landing.pricing.plan.premium.badge',
    titleKey: 'landing.pricing.plan.premium.title',
    descKey: 'landing.pricing.plan.premium.desc',
    features: [
      'landing.pricing.plan.premium.feature1',
      'landing.pricing.plan.premium.feature2',
      'landing.pricing.plan.premium.feature3',
    ],
    ctaKey: 'landing.pricing.plan.premium.cta',
    variant: 'primary',
    linkTo: '/tractors',
    ctaStyle: 'white',
  },
];

const sustainabilityStatsConfig = [
  { titleKey: 'landing.sustainable.stat1.title', bodyKey: 'landing.sustainable.stat1.body', icon: Trees },
  { titleKey: 'landing.sustainable.stat2.title', bodyKey: 'landing.sustainable.stat2.body', icon: Shield },
];

interface DispatchData {
  tractorName: string;
  location: string;
  distance: string;
  terrain: string;
  eta: string;
  efficiency: string;
  status: 'ON ROUTE' | 'AVAILABLE' | 'IN USE';
  currentAddress?: string | null;
  destinationAddress?: string | null;
}

const Index = () => {
  const { t, language } = useLanguage();
  const [featuredTractors, setFeaturedTractors] = useState<TractorType[]>([]);
  const [allTractors, setAllTractors] = useState<TractorType[]>([]);
  const [dispatchData, setDispatchData] = useState<DispatchData | null>(null);
  const [loadingDispatch, setLoadingDispatch] = useState(true);
  const [landingMetrics, setLandingMetrics] = useState<LandingMetricsResponse | null>(null);
  
  // Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 20 });
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const statsData = useMemo(
    () => [
      {
        value: landingMetrics ? String(landingMetrics.districtsCovered) : statsFallback.districts,
        label: t('landing.stats.districts.label'),
        description: t('landing.stats.districts.desc'),
      },
      {
        value: landingMetrics ? `${landingMetrics.avgResponseTimeMinutes}m` : statsFallback.response,
        label: t('landing.stats.response.label'),
        description: t('landing.stats.response.desc'),
      },
      {
        value: landingMetrics ? `${Math.round(landingMetrics.fleetUtilization)}%` : statsFallback.utilization,
        label: t('landing.stats.utilization.label'),
        description: t('landing.stats.utilization.desc'),
      },
    ],
    [landingMetrics, language, t]
  );

  const platformFeatures = useMemo(
    () =>
      platformFeaturesConfig.map((feature) => ({
        icon: feature.icon,
        title: t(feature.titleKey),
        description: t(feature.descKey),
        meta: t(feature.metaKey),
      })),
    [language, t]
  );

  const platformCards = useMemo(
    () =>
      platformCardsConfig.map((card) => ({
        title: t(card.titleKey),
        body: t(card.bodyKey),
        link: card.link,
        linkLabel: t(card.linkLabelKey),
      })),
    [language, t]
  );

  const workflow = useMemo(
    () =>
      workflowConfig.map((step) => ({
        title: t(step.titleKey),
        description: t(step.descKey),
      })),
    [language, t]
  );

  const testimonials = useMemo(
    () =>
      testimonialsConfig.map((testimonial) => ({
        name: testimonial.name,
        role: t(testimonial.roleKey),
        feedback: t(testimonial.feedbackKey),
      })),
    [language, t]
  );

  const insightHighlights = useMemo(
    () =>
      insightHighlightsConfig.map((highlight) => ({
        value: highlight.value,
        label: t(highlight.labelKey),
        caption: t(highlight.captionKey),
      })),
    [language, t]
  );

  const dataCards = useMemo(
    () =>
      dataCardsConfig.map((card) => ({
        title: t(card.titleKey),
        body: t(card.bodyKey),
      })),
    [language, t]
  );

  const pricingPlans = useMemo(
    () =>
      pricingPlansConfig.map((plan) => ({
        badge: t(plan.badgeKey),
        title: t(plan.titleKey),
        description: t(plan.descKey),
        features: plan.features.map((featureKey) => t(featureKey)),
        cta: t(plan.ctaKey),
        variant: plan.variant,
        linkTo: plan.linkTo,
        ctaStyle: plan.ctaStyle,
      })),
    [language, t]
  );

  const sustainabilityStats = useMemo(
    () =>
      sustainabilityStatsConfig.map((item) => ({
        icon: item.icon,
        title: t(item.titleKey),
        body: t(item.bodyKey),
      })),
    [language, t]
  );

  const staticDispatchData = useMemo<DispatchData>(
    () => ({
      tractorName: t('landing.dispatch.fallback.name'),
      location: t('landing.dispatch.fallback.location'),
      distance: t('landing.dispatch.fallback.distance'),
      terrain: t('landing.dispatch.fallback.terrain'),
      eta: t('landing.dispatch.fallback.eta'),
      efficiency: t('landing.dispatch.fallback.efficiency'),
      status: 'ON ROUTE',
      currentAddress: t('landing.dispatch.fallback.location'),
      destinationAddress: t('landing.dispatch.fallback.destination'),
    }),
    [language, t]
  );

  useEffect(() => {
    (async () => {
      try {
        const all = await getTractorsForUI();
        setAllTractors(all);
        setFeaturedTractors(all.filter(t => t.available).slice(0, 3));
      } catch {
        setAllTractors([]);
        setFeaturedTractors([]);
      }
    })();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = () => {
      if (emblaApi) {
        emblaApi.scrollNext();
      }
    };

    // Set interval to change slide every 2.5 seconds
    autoplayIntervalRef.current = setInterval(autoplay, 2500);

    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
      }
    };
  }, [emblaApi]);

  useEffect(() => {
    (async () => {
      try {
        const metrics = await fetchLandingMetrics();
        setLandingMetrics(metrics);
      } catch {
        setLandingMetrics(null);
      }
    })();
  }, []);

  // Fetch active bookings for dispatch board
  useEffect(() => {
    (async () => {
      try {
        const summary: DispatchSummaryResponse = await fetchLatestDispatchSummary();
        if (summary?.hasData) {
          setDispatchData({
            tractorName: summary.tractorName || t('landing.dispatch.fallback.name'),
            location: summary.destination?.address || t('landing.dispatch.fallback.location'),
            distance: summary.distanceKm ? `${summary.distanceKm.toFixed(1)} km` : t('landing.dispatch.fallback.distance'),
            terrain: summary.terrain || t('landing.dispatch.dynamicTerrain'),
            eta: formatEta(summary.etaMinutes),
            efficiency: summary.fleetEfficiency || t('landing.dispatch.fallback.efficiency'),
            status: summary.status?.toUpperCase() === 'DELIVERED' ? 'IN USE' : 'ON ROUTE',
            currentAddress: summary.currentLocation?.address,
            destinationAddress: summary.destination?.address,
          });
        } else {
          setDispatchData(staticDispatchData);
        }
      } catch (error) {
        setDispatchData(staticDispatchData);
      } finally {
        setLoadingDispatch(false);
      }
    })();
  }, [language, staticDispatchData, t]);

  const hasFeaturedTractors = useMemo(() => featuredTractors.length > 0, [featuredTractors]);
  const displayData = dispatchData || staticDispatchData;

  const translateStatus = (status?: string) => {
    if (!status) return '';
    const key = status.toLowerCase().replace(/\s+/g, '_');
    const translated = t(`landing.dispatch.status.${key}`);
    return translated || status;
  };

  const formatEta = (minutes?: number) => {
    if (minutes == null || Number.isNaN(minutes)) {
      return t('landing.dispatch.etaFallback');
    }
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background text-secondary">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-green-100 to-green-800 min-h-[85vh] flex items-center">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(34,197,94,0.3),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(22,163,74,0.4),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(5,150,105,0.2),transparent_70%)]" />
          </div>
          
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:py-16 items-center">
            {/* Animated Tractor Ploughing - Half width on left */}
            <div className="absolute top-12 left-4 h-[160px] w-[calc(50%-1rem)] overflow-hidden opacity-30 pointer-events-none z-0 md:top-16 md:left-0 md:w-1/2">
            <svg
              className="absolute top-0 w-full h-full"
              viewBox="0 0 1200 200"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Field Background - Ploughed Rows */}
              <defs>
                <pattern id="fieldPattern" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
                  <rect width="100" height="20" fill="#22c55e" opacity="0.3" />
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#16a34a" strokeWidth="1" opacity="0.4" />
                  <line x1="0" y1="5" x2="100" y2="5" stroke="#15803d" strokeWidth="0.5" opacity="0.3" />
                  <line x1="0" y1="15" x2="100" y2="15" stroke="#15803d" strokeWidth="0.5" opacity="0.3" />
                </pattern>
                <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#86efac', stopOpacity: 0.4 }} />
                  <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
              
              {/* Field Background */}
              <rect width="1200" height="200" fill="url(#fieldPattern)" />
              <rect width="1200" height="200" fill="url(#fieldGradient)" />
              
              {/* Animated Tractor */}
              <g className="tractor-group">
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 1200,0; 0,0"
                  dur="20s"
                  repeatCount="indefinite"
                />
                
                {/* Tractor Body */}
                <g transform="translate(0, 120)">
                  {/* Main Body */}
                  <rect x="20" y="10" width="60" height="35" rx="5" fill="#16a34a" opacity="0.9" />
                  <rect x="25" y="5" width="50" height="15" rx="3" fill="#22c55e" opacity="0.9" />
                  
                  {/* Cabin */}
                  <rect x="35" y="0" width="25" height="20" rx="3" fill="#15803d" opacity="0.9" />
                  <rect x="38" y="3" width="19" height="14" rx="2" fill="#86efac" opacity="0.6" />
                  
                  {/* Exhaust Pipe */}
                  <rect x="15" y="0" width="4" height="12" rx="2" fill="#374151" opacity="0.7" />
                  <circle cx="17" cy="0" r="3" fill="#ef4444" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1s" repeatCount="indefinite" />
                  </circle>
                  
                  {/* Front Wheel */}
                  <circle cx="30" cy="50" r="12" fill="#1f2937" opacity="0.9">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0 30 50; 360 30 50"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx="30" cy="50" r="8" fill="#4b5563" opacity="0.7" />
                  <circle cx="30" cy="50" r="4" fill="#6b7280" />
                  
                  {/* Rear Wheel */}
                  <circle cx="70" cy="50" r="15" fill="#1f2937" opacity="0.9">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0 70 50; 360 70 50"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle cx="70" cy="50" r="10" fill="#4b5563" opacity="0.7" />
                  <circle cx="70" cy="50" r="5" fill="#6b7280" />
                  
                  {/* Plough Attachment */}
                  <g transform="translate(80, 30)">
                    {/* Plough Frame */}
                    <rect x="0" y="0" width="40" height="8" rx="2" fill="#374151" opacity="0.8" />
                    <rect x="5" y="8" width="30" height="6" rx="1" fill="#4b5563" opacity="0.7" />
                    
                    {/* Plough Blades */}
                    <polygon points="10,14 15,20 20,14" fill="#6b7280" opacity="0.8" />
                    <polygon points="20,14 25,20 30,14" fill="#6b7280" opacity="0.8" />
                    <polygon points="30,14 35,20 40,14" fill="#6b7280" opacity="0.8" />
                    
                    {/* Dirt Effect */}
                    <g className="dirt-particles">
                      <circle cx="12" cy="22" r="2" fill="#92400e" opacity="0.6">
                        <animate attributeName="cy" values="22;18;22" dur="0.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.5s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="22" cy="22" r="1.5" fill="#92400e" opacity="0.5">
                        <animate attributeName="cy" values="22;19;22" dur="0.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.6s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="32" cy="22" r="2" fill="#92400e" opacity="0.6">
                        <animate attributeName="cy" values="22;18;22" dur="0.55s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.55s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  </g>
                  
                  {/* Motion Lines */}
                  <g className="motion-lines">
                    <line x1="0" y1="45" x2="10" y2="45" stroke="#86efac" strokeWidth="2" opacity="0.5" strokeDasharray="3,3">
                      <animate attributeName="x1" values="0;10;0" dur="0.3s" repeatCount="indefinite" />
                      <animate attributeName="x2" values="10;20;10" dur="0.3s" repeatCount="indefinite" />
                    </line>
                    <line x1="0" y1="55" x2="10" y2="55" stroke="#86efac" strokeWidth="2" opacity="0.5" strokeDasharray="3,3">
                      <animate attributeName="x1" values="0;10;0" dur="0.3s" repeatCount="indefinite" />
                      <animate attributeName="x2" values="10;20;10" dur="0.3s" repeatCount="indefinite" />
                    </line>
                  </g>
                </g>
              </g>
              
              {/* Additional Ploughed Rows Animation */}
              <g className="plough-lines">
                <line x1="0" y1="140" x2="1200" y2="140" stroke="#15803d" strokeWidth="2" opacity="0.3" strokeDasharray="5,10">
                  <animate attributeName="x1" values="0;1200;0" dur="15s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="1200;2400;1200" dur="15s" repeatCount="indefinite" />
                </line>
                <line x1="0" y1="150" x2="1200" y2="150" stroke="#15803d" strokeWidth="2" opacity="0.3" strokeDasharray="5,10">
                  <animate attributeName="x1" values="0;1200;0" dur="18s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="1200;2400;1200" dur="18s" repeatCount="indefinite" />
                </line>
                <line x1="0" y1="160" x2="1200" y2="160" stroke="#15803d" strokeWidth="2" opacity="0.3" strokeDasharray="5,10">
                  <animate attributeName="x1" values="0;1200;0" dur="16s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="1200;2400;1200" dur="16s" repeatCount="indefinite" />
                </line>
              </g>
            </svg>
            </div>
            
            {/* Nepal Flag & Tractor Sewa Banner - Half width on right */}
            <div className="absolute top-12 right-4 h-[160px] w-[calc(50%-1rem)] overflow-hidden opacity-30 pointer-events-none z-0 md:top-16 md:right-0 md:w-1/2 flex items-center justify-center">
              <svg
                className="w-full h-full"
                viewBox="0 0 400 240"
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Nepal Flag Background */}
                <defs>
                  <linearGradient id="flagGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#DC143C', stopOpacity: 0.9 }} />
                    <stop offset="100%" style={{ stopColor: '#003893', stopOpacity: 0.9 }} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Flag Base */}
                <g transform="translate(50, 20)">
                  {/* Red Triangle (Left) */}
                  <polygon points="0,0 0,180 120,90" fill="#DC143C" opacity="0.9" />
                  {/* Blue Border */}
                  <polygon points="0,0 0,180 120,90" fill="none" stroke="#003893" strokeWidth="3" opacity="0.8" />
                  {/* White Moon */}
                  <circle cx="60" cy="60" r="25" fill="white" opacity="0.95">
                    <animate attributeName="opacity" values="0.95;0.7;0.95" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="70" cy="60" r="20" fill="#DC143C" opacity="0.9" />
                  {/* White Sun */}
                  <circle cx="60" cy="120" r="20" fill="white" opacity="0.95">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0 60 120; 360 60 120"
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Sun Rays */}
                  <g>
                    {[...Array(12)].map((_, i) => (
                      <line
                        key={i}
                        x1="60"
                        y1="120"
                        x2="60"
                        y2="95"
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.9"
                        transform={`rotate(${i * 30} 60 120)`}
                      >
                        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" begin={`${i * 0.1}s`} repeatCount="indefinite" />
                      </line>
                    ))}
                  </g>
                </g>
                
                {/* Tractor Sewa Banner Text */}
                <g transform="translate(200, 80)">
                  <text
                    x="0"
                    y="0"
                    fontSize="28"
                    fontWeight="bold"
                    fill="#16a34a"
                    fontFamily="Arial, sans-serif"
                    opacity="0.9"
                    filter="url(#glow)"
                  >
                    <tspan x="0" dy="0">TRACTOR</tspan>
                    <tspan x="0" dy="35" fill="#22c55e">SEWA</tspan>
                  </text>
                  
                  {/* Decorative Tractor Icon */}
                  <g transform="translate(140, -10)">
                    <rect x="0" y="20" width="40" height="25" rx="3" fill="#16a34a" opacity="0.9">
                      <animate attributeName="x" values="0;5;0" dur="2s" repeatCount="indefinite" />
                    </rect>
                    <rect x="5" y="15" width="30" height="12" rx="2" fill="#22c55e" opacity="0.9" />
                    <rect x="12" y="10" width="16" height="10" rx="2" fill="#15803d" opacity="0.9" />
                    {/* Wheels */}
                    <circle cx="12" cy="50" r="8" fill="#1f2937" opacity="0.9">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0 12 50; 360 12 50"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle cx="28" cy="50" r="10" fill="#1f2937" opacity="0.9">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0 28 50; 360 28 50"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                  
                  {/* Animated Border */}
                  <rect x="-10" y="-20" width="200" height="80" fill="none" stroke="#16a34a" strokeWidth="2" rx="8" opacity="0.6" strokeDasharray="5,5">
                    <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite" />
                  </rect>
                  
                  {/* Sparkle Effects */}
                  {[
                    { x: 20, y: -10 },
                    { x: 60, y: 5 },
                    { x: 100, y: -5 },
                    { x: 140, y: 10 },
                    { x: 50, y: 30 },
                    { x: 120, y: 25 }
                  ].map((pos, i) => (
                    <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                      <circle cx="0" cy="0" r="2" fill="#86efac" opacity="0.8">
                        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                        <animate attributeName="r" values="2;4;2" dur="1.5s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
                      </circle>
                    </g>
                  ))}
                </g>
                
                {/* Floating Particles */}
                {[
                  { cx: 50, cy: 30, offset: 0 },
                  { cx: 90, cy: 45, offset: 0.3 },
                  { cx: 130, cy: 25, offset: 0.6 },
                  { cx: 170, cy: 50, offset: 0.9 },
                  { cx: 210, cy: 35, offset: 1.2 },
                  { cx: 250, cy: 40, offset: 1.5 },
                  { cx: 290, cy: 28, offset: 1.8 },
                  { cx: 330, cy: 48, offset: 2.1 }
                ].map((particle, i) => (
                  <circle
                    key={i}
                    cx={particle.cx}
                    cy={particle.cy}
                    r="3"
                    fill="#86efac"
                    opacity="0.4"
                  >
                    <animate
                      attributeName="cy"
                      values={`${particle.cy};${particle.cy + 20};${particle.cy}`}
                      dur={`${2 + particle.offset}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;0.8;0.4"
                      dur={`${2 + particle.offset}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </svg>
            </div>
            
            <div className="flex flex-col gap-6 z-10 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-600/30 bg-white/80 backdrop-blur-md px-4 py-2 text-sm font-semibold text-green-800 shadow-lg w-fit hover:scale-105 hover:shadow-xl transition-all duration-300 animate-pulse-slow">
                <Sparkles className="h-4 w-4 text-green-600 animate-spin-slow" />
                {t('landing.hero.badge')}
              </div>

              <div className="space-y-4 animate-fade-in-up-delay-1">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight animate-slide-in-left">
                  <span className="bg-gradient-to-r from-green-600 via-green-700 to-green-900 bg-clip-text text-transparent animate-gradient-shift">
                    {t('landing.hero.heading')}
                  </span>
                </h1>
                <p className="max-w-xl text-base sm:text-lg text-gray-700 font-medium leading-relaxed animate-fade-in-up-delay-2">
                  {t('landing.hero.subtitle')}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up-delay-3">
                <Link to="/tractors" className="group">
                  <Button size="lg" className="bg-gradient-to-r from-green-600 to-green-800 text-white hover:from-green-700 hover:to-green-900 font-bold text-sm px-6 py-5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 relative overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      {t('landing.hero.ctaPrimary')}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Button>
                </Link>
                <a
                  href="#platform"
                  className="flex items-center justify-center gap-2 text-base font-semibold text-green-700 hover:text-green-800 underline-offset-4 transition-all duration-300 hover:underline hover:scale-105 group"
                >
                  {t('landing.hero.ctaSecondary')}
                  <BarChart3 className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 mt-6 animate-fade-in-up-delay-4">
                {statsData.map((item, index) => (
                  <div 
                    key={item.label} 
                    className="rounded-xl border border-green-200 bg-white/90 backdrop-blur-sm p-4 text-left shadow-md hover:shadow-xl hover:border-green-400 transition-all duration-500 hover:-translate-y-2 hover:scale-105 group relative overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <p className="text-xs uppercase tracking-wider text-green-700 font-bold mb-1.5 group-hover:text-green-800 transition-colors duration-300">{item.label}</p>
                      <p className="text-2xl font-extrabold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-green-900 transition-all duration-300">{item.value}</p>
                      <p className="mt-1.5 text-xs text-gray-600 font-medium group-hover:text-gray-700 transition-colors duration-300">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tractor Showcase - Grid Card Design */}
            <div className="relative z-10">
              {allTractors.length > 0 && (
                <div className="space-y-4">
                  {/* Main Featured Tractor - Large Card */}
                  <div className="relative group" ref={emblaRef}>
                    <div className="overflow-hidden">
                      <div className="flex">
                        {allTractors.slice(0, 6).map((tractor, index) => (
                          <div key={tractor.id || index} className="flex-[0_0_100%] min-w-0">
                            <div className="relative rounded-3xl overflow-hidden bg-white shadow-2xl border border-green-100 group-hover:border-green-300 transition-all duration-500">
                              <div className="relative h-[420px] overflow-hidden">
                                <img
                                  src={tractor.image || '/placeholder-tractor.jpg'}
                                  alt={tractor.name || 'Tractor'}
                                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 via-green-800/50 to-transparent" />
                                
                                {/* Content Card Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                  <div className="bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-xl border border-green-100">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-md">
                                            <Tractor className="h-6 w-6 text-white" />
                                          </div>
                                          <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                                              {tractor.name}
                                            </h3>
                                            {tractor.location && (
                                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-green-600" />
                                                {tractor.location}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <Link 
                                          to="/tractors" 
                                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-800 text-white font-semibold text-xs hover:from-green-700 hover:to-green-900 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                                        >
                                          View Details
                                          <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                      </div>
                                      <div className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider">
                                        Available
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Compact Indicators */}
                    <div className="flex justify-center gap-1.5 mt-3">
                      {allTractors.slice(0, 6).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => emblaApi?.scrollTo(index)}
                          className="h-1.5 rounded-full bg-green-200 hover:bg-green-400 transition-all duration-300 flex-1 max-w-[50px]"
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Thumbnail Grid - Shows other tractors */}
                  {allTractors.length > 1 && (
                    <div className="grid grid-cols-3 gap-2.5 mt-3">
                      {allTractors.slice(1, 4).map((tractor, index) => (
                        <div
                          key={tractor.id || index}
                          onClick={() => emblaApi?.scrollTo(index + 1)}
                          className="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-transparent hover:border-green-400 transition-all duration-300 hover:shadow-lg"
                        >
                          <div className="aspect-[4/3] relative overflow-hidden">
                            <img
                              src={tractor.image || '/placeholder-tractor.jpg'}
                              alt={tractor.name || 'Tractor'}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-white text-xs font-bold truncate drop-shadow-lg">
                                {tractor.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dispatch Board - Redesigned with Animations */}
              <div className="relative mt-6 bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-xl border border-green-100 hover:shadow-2xl hover:border-green-300 transition-all duration-500 animate-fade-in-up-delay-5 group">
                <div className="flex items-center justify-between pb-3 border-b border-green-100 group-hover:border-green-300 transition-colors duration-300">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-green-700 font-bold group-hover:text-green-800 transition-colors duration-300">{t('landing.dispatch.badge')}</p>
                    <p className="mt-1.5 text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-300">{t('landing.dispatch.title')}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-green-100 text-green-800 text-xs font-bold border border-green-200 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300 animate-pulse-slow">
                    {t('landing.dispatch.liveTag')}
                  </Badge>
                </div>

                <div className="space-y-3 mt-3">
                  {loadingDispatch ? (
                    <Card className="border-none bg-white/70 shadow-none">
                      <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        {t('landing.dispatch.loading')}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border border-green-100 bg-white shadow-md rounded-xl mt-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base text-gray-900 font-bold">
                          {displayData.tractorName}
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800 font-bold border border-green-200">
                            {translateStatus(displayData.status)}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 border-t border-green-100 pt-3 text-sm text-gray-700">
                        <p className="flex items-center gap-2 font-medium">
                          <MapPin className="h-4 w-4 text-green-600" />
                          {displayData.distance} • {displayData.terrain} • {t('landing.dispatch.etaLabel')} {displayData.eta}
                        </p>
                        {(displayData.currentAddress || displayData.destinationAddress) && (
                          <p className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span>{displayData.currentAddress || t('landing.dispatch.fallback.location')}</span>
                            <span className="text-green-600 font-bold">→</span>
                            <span>{displayData.destinationAddress || t('landing.dispatch.fallback.destination')}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{displayData.efficiency}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white p-3.5 mt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-1.5">{t('landing.dispatch.activity.title')}</p>
                    <p className="text-sm font-bold text-gray-900 mb-1.5">{t('landing.dispatch.activity.body')}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {t('landing.dispatch.activity.caption')}
                    </p>
                  </div>

                  <div className="grid gap-2 rounded-lg bg-white border border-green-100 p-3.5 text-sm text-gray-700 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{t('landing.dispatch.soil.title')}</span>
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-800 font-bold border border-green-200">{t('landing.dispatch.soil.badge')}</span>
                    </div>
                    <p className="text-gray-600">{t('landing.dispatch.soil.body')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="relative bg-gradient-to-b from-white via-green-50 to-white px-4 pb-20 pt-16 md:pb-24 md:pt-20">
          <div className="mx-auto flex max-w-7xl flex-col gap-10">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge variant="outline" className="rounded-full border-green-600/30 bg-green-50 text-green-800">
                  {t('landing.platform.badge')}
                </Badge>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  <span className="bg-gradient-to-r from-green-600 via-green-700 to-green-900 bg-clip-text text-transparent">
                    {t('landing.platform.title')}
                  </span>
                </h2>
                <p className="text-lg md:text-xl text-gray-700 font-medium max-w-2xl leading-relaxed">
                  {t('landing.platform.subtitle')}
                </p>
              </div>
              <Link to="/register">
                <Button variant="outline" className="rounded-xl border-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold">
                  {t('landing.platform.cta')}
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {platformFeatures.map((feature) => (
                <div key={feature.title} className="bg-white rounded-xl p-5 border border-green-100 shadow-md hover:shadow-lg hover:border-green-300 transition-all duration-300 hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-200 border border-green-200">
                    <feature.icon className="h-5 w-5 text-green-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{feature.description}</p>
                  <p className="text-xs uppercase tracking-wider text-green-700 font-semibold">{feature.meta}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg">
              <div className="grid gap-4 md:grid-cols-3">
                {platformCards.map((card) => (
                  <div key={card.title} className="rounded-lg bg-white p-4 shadow-sm border border-green-100 hover:border-green-300 hover:shadow-md transition-all duration-300">
                    <p className="text-xs uppercase tracking-wider text-green-700 font-bold mb-2">{card.title}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {card.body}{' '}
                      <Link to={card.link} className="text-green-700 font-semibold hover:text-green-800 underline underline-offset-2">
                        {card.linkLabel}
                      </Link>.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full border-green-600/30 bg-green-50 text-green-800">
                {t('landing.workflow.badge')}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-green-600 via-green-700 to-green-900 bg-clip-text text-transparent">
                  {t('landing.workflow.title')}
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-700 font-medium max-w-xl leading-relaxed">
                {t('landing.workflow.subtitle')}
              </p>
            </div>

            <div className="space-y-3">
              {workflow.map((step, index) => (
                <Card key={step.title} className="border border-green-100 bg-white shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-300">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 text-sm font-bold text-green-800 border border-green-200">
                        {index + 1}
                      </div>
                      <CardTitle className="text-base text-gray-900 font-bold">{step.title}</CardTitle>
                    </div>
                    <CircleCheck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-100 px-4 py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.15),_transparent_60%)]" />
          <div className="relative mx-auto max-w-6xl space-y-8">
              <div className="space-y-4 text-center">
              <Badge variant="outline" className="rounded-full border-green-600/30 bg-green-50 text-green-800">
                {t('landing.insights.badge')}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-green-600 via-green-700 to-green-900 bg-clip-text text-transparent">
                  {t('landing.insights.title')}
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-700 font-medium mx-auto max-w-2xl leading-relaxed">
                {t('landing.insights.subtitle')}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-stretch">
              <Card className="border border-green-100 bg-white shadow-lg rounded-xl">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                    <Gauge className="h-5 w-5 text-green-600" />
                    {t('landing.insights.dashboard.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {insightHighlights.map((highlight) => (
                      <div key={highlight.label} className="rounded-lg border border-green-100 bg-white p-3 text-left shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-300">
                        <p className="text-xs uppercase tracking-wider text-green-700 font-bold mb-1.5">{highlight.label}</p>
                        <p className="text-xl font-extrabold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">{highlight.value}</p>
                        <p className="mt-1 text-xs text-gray-600">{highlight.caption}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 text-sm">
                    <div className="flex items-center gap-2.5 mb-2">
                      <CalendarRange className="h-4 w-4 text-green-700" />
                      <span className="text-sm font-bold text-gray-900">{t('landing.insights.dashboard.card.title')}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-xs">
                      {t('landing.insights.dashboard.card.body')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.name} className="border border-green-100 bg-white shadow-md hover:shadow-lg hover:border-green-300 transition-all duration-300 rounded-lg">
                    <CardContent className="space-y-3 p-4">
                      <p className="text-sm text-gray-700 leading-relaxed italic">{testimonial.feedback}</p>
                      <div className="pt-2 border-t border-green-100">
                        <p className="text-sm font-bold text-gray-900">{testimonial.name}</p>
                        <p className="text-xs uppercase tracking-wider text-green-700 font-semibold mt-0.5">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {dataCards.map((card) => (
                <Card key={card.title} className="border border-green-100 bg-white shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-300 rounded-lg">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wider text-green-700 font-bold mb-1.5">{card.title}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{card.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-gradient-to-b from-white to-green-50 px-4 py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">
            <div className="space-y-4 text-center">
              <Badge variant="outline" className="rounded-full border-green-600/30 bg-green-50 text-green-800">
                {t('landing.pricing.badge')}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-green-600 via-green-700 to-green-900 bg-clip-text text-transparent">
                  {t('landing.pricing.title')}
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-700 font-medium mx-auto max-w-2xl leading-relaxed">
                {t('landing.pricing.subtitle')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 justify-items-center">
              {pricingPlans.map((plan) => {
                const isPremium = plan.variant === 'primary';
                const cardClass = isPremium
                  ? 'border-green-600/40 bg-gradient-to-br from-green-600 via-green-700 to-green-900 text-white shadow-xl'
                  : 'border border-green-200 bg-white shadow-lg';
                const badgeClass = isPremium
                  ? 'w-fit rounded-full bg-white/30 text-xs uppercase tracking-wider text-white font-bold border border-white/40'
                  : 'w-fit rounded-full bg-green-100 text-green-800 text-xs font-bold border border-green-200';
                const descriptionClass = isPremium ? 'text-sm text-white/90' : 'text-sm text-gray-600';
                const featureClass = isPremium ? 'text-sm text-white/90' : 'text-sm text-gray-700';

                const renderButton = () => {
                  const buttonContent = (
                    <Button
                      variant={
                        plan.ctaStyle === 'secondary'
                          ? 'secondary'
                          : plan.ctaStyle === 'outline'
                          ? 'outline'
                          : undefined
                      }
                      className={
                        plan.ctaStyle === 'white'
                          ? 'w-full bg-white text-secondary hover:bg-white/90'
                          : 'w-full'
                      }
                    >
                      {plan.cta}
                    </Button>
                  );

                  if (plan.linkTo) {
                    return (
                      <Link to={plan.linkTo} className="w-full">
                        {buttonContent}
                      </Link>
                    );
                  }
                  return buttonContent;
                };

                return (
                  <Card key={plan.title} className={`${cardClass} w-full max-w-md`}>
                    <CardHeader>
                      <Badge variant="secondary" className={badgeClass}>
                        {plan.badge}
                      </Badge>
                      <CardTitle className={`mt-3 text-2xl font-extrabold ${isPremium ? 'text-white' : 'text-gray-900'}`}>{plan.title}</CardTitle>
                      <p className={descriptionClass}>{plan.description}</p>
                    </CardHeader>
                    <CardContent className={`space-y-4 ${featureClass}`}>
                      {plan.features.map((feature) => (
                        <p key={feature}>{feature}</p>
                      ))}
                    </CardContent>
                    <CardFooter>{renderButton()}</CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {hasFeaturedTractors && (
          <section id="fleet" className="bg-gradient-to-b from-white to-green-50 px-4 py-16">
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                  <Badge variant="outline" className="rounded-full border-green-600/30 bg-green-50 text-green-800">
                    {t('landing.fleet.badge')}
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    <span className="bg-gradient-to-r from-green-600 via-green-700 to-green-900 bg-clip-text text-transparent">
                      {t('landing.fleet.title')}
                    </span>
                  </h2>
                  <p className="text-lg md:text-xl text-gray-700 font-medium max-w-2xl leading-relaxed">
                    {t('landing.fleet.subtitle')}
                  </p>
                </div>
                <Link to="/tractors">
                  <Button variant="outline" className="rounded-xl border-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold">
                {t('landing.fleet.cta')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featuredTractors.map((tractor) => (
                  <TractorCard key={tractor.id} tractor={tractor} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-secondary px-4 py-16 text-secondary-foreground">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div className="space-y-4">
              <Badge variant="secondary" className="rounded-full bg-white/10 text-xs uppercase tracking-[0.3em] text-white/70">
                {t('landing.sustainable.badge')}
              </Badge>
              <h2 className="text-4xl font-semibold leading-tight text-white">
                {t('landing.sustainable.title')}
              </h2>
              <p className="text-sm text-white/80">
                {t('landing.sustainable.body')}
              </p>
              <div className="flex flex-wrap gap-3">
                {sustainabilityStats.map((stat) => (
                  <div key={stat.title} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 text-white">
                      <stat.icon className="h-4 w-4" />
                      <span className="font-semibold text-sm">{stat.title}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-white/70">{stat.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 p-6 text-sm text-white/80">
              <p className="text-xs uppercase tracking-wider text-white/60">{t('landing.sustainable.deskLabel')}</p>
              <p className="mt-3 text-base font-semibold text-white">
                {t('landing.sustainable.quote')}
              </p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-white">{t('landing.sustainable.quote.author')}</p>
                <p className="text-xs uppercase tracking-wider text-white/60 mt-0.5">{t('landing.sustainable.quote.role')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-green-50 to-white px-4 py-16">
          <div className="mx-auto max-w-6xl rounded-2xl border-2 border-green-200 bg-gradient-to-br from-white via-green-50 to-white p-8 text-center shadow-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-600/30 bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-800">
              <Sparkles className="h-4 w-4" />
              {t('landing.cta.badge')}
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold">
              <span className="bg-gradient-to-r from-green-600 via-green-700 to-green-900 bg-clip-text text-transparent">
                {t('landing.cta.title')}
              </span>
            </h2>
            <p className="mt-3 text-base text-gray-700 font-medium">
              {t('landing.cta.subtitle')}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-green-800 text-white hover:from-green-700 hover:to-green-900 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  {t('landing.cta.primary')}
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-2 border-green-600 text-green-700 hover:bg-green-50 font-semibold">
                  {t('landing.cta.secondary')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-muted/40 bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md">
              <Tractor className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Tractor Sewa</p>
              <p className="text-xs text-secondary-foreground/70">{t('landing.footer.tagline')}</p>
            </div>
          </div>
          <p className="text-xs text-secondary-foreground/70">
            {t('landing.footer.copy')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
