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
import { useEffect, useMemo, useState } from 'react';
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
  const [dispatchData, setDispatchData] = useState<DispatchData | null>(null);
  const [loadingDispatch, setLoadingDispatch] = useState(true);
  const [landingMetrics, setLandingMetrics] = useState<LandingMetricsResponse | null>(null);

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
        setFeaturedTractors(all.filter(t => t.available).slice(0, 3));
      } catch {
        setFeaturedTractors([]);
      }
    })();
  }, []);

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
        <section className="brand-gradient hero-grid overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-16 px-4 pb-24 pt-20 md:grid-cols-[1.15fr_0.85fr] md:pb-32 md:pt-24">
            <div className="flex flex-col gap-10 text-primary-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-amber-200" />
                {t('landing.hero.badge')}
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[58px] lg:leading-[1.05]">
                  {t('landing.hero.heading')}
                </h1>
                <p className="max-w-xl text-base text-primary-foreground/85 sm:text-lg">
                  {t('landing.hero.subtitle')}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/tractors">
                  <Button size="lg" className="bg-white text-secondary hover:bg-primary-foreground/90">
                    {t('landing.hero.ctaPrimary')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a
                  href="#platform"
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground/85 underline-offset-4 transition hover:text-white hover:underline"
                >
                  {t('landing.hero.ctaSecondary')}
                  <BarChart3 className="h-4 w-4" />
                </a>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {statsData.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/20 bg-white/10 p-5 text-left">
                    <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                    <p className="mt-2 text-xs text-primary-foreground/70">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 inset-y-6 rounded-[32px] bg-gradient-to-br from-emerald-300/50 to-teal-500/80 blur-3xl opacity-80" />
              <div className="relative glass-panel rounded-[30px] p-6">
                <div className="flex items-center justify-between pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t('landing.dispatch.badge')}</p>
                    <p className="mt-2 text-2xl font-semibold text-secondary">{t('landing.dispatch.title')}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-primary/10 text-xs text-primary">
                    {t('landing.dispatch.liveTag')}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {loadingDispatch ? (
                    <Card className="border-none bg-white/70 shadow-none">
                      <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        {t('landing.dispatch.loading')}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-none bg-white/70 shadow-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-base text-secondary">
                          {displayData.tractorName}
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                            {translateStatus(displayData.status)}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 border-t border-dashed border-border/70 pt-3 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {displayData.distance} • {displayData.terrain} • {t('landing.dispatch.etaLabel')} {displayData.eta}
                        </p>
                        {(displayData.currentAddress || displayData.destinationAddress) && (
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{displayData.currentAddress || t('landing.dispatch.fallback.location')}</span>
                            <span className="text-primary">→</span>
                            <span>{displayData.destinationAddress || t('landing.dispatch.fallback.destination')}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-primary" />
                          {displayData.efficiency}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="rounded-2xl border border-white/40 bg-white/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{t('landing.dispatch.activity.title')}</p>
                    <p className="mt-2 text-base font-semibold text-secondary">{t('landing.dispatch.activity.body')}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t('landing.dispatch.activity.caption')}
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-2xl bg-white/60 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-secondary">{t('landing.dispatch.soil.title')}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{t('landing.dispatch.soil.badge')}</span>
                    </div>
                    <p>{t('landing.dispatch.soil.body')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="relative -mt-12 px-4 pb-24 pt-12 md:pb-28">
          <div className="mx-auto flex max-w-6xl flex-col gap-12">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                  {t('landing.platform.badge')}
                </Badge>
                <h2 className="section-title">
                  {t('landing.platform.title')}
                </h2>
                <p className="section-subtitle max-w-2xl">
                  {t('landing.platform.subtitle')}
                </p>
              </div>
              <Link to="/register">
                <Button variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary/10">
                  {t('landing.platform.cta')}
                </Button>
              </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {platformFeatures.map((feature) => (
                <div key={feature.title} className="surface-card p-7">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary">{feature.title}</h3>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  <p className="mt-5 text-xs uppercase tracking-[0.2em] text-primary">{feature.meta}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-muted/40 bg-muted/20 p-6">
              <div className="grid gap-6 md:grid-cols-3">
                {platformCards.map((card) => (
                  <div key={card.title} className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{card.title}</p>
                    <p className="mt-2 text-sm text-secondary">
                      {card.body}{' '}
                      <Link to={card.link} className="underline">
                        {card.linkLabel}
                      </Link>.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-24">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full border-secondary/20 text-secondary">
                {t('landing.workflow.badge')}
              </Badge>
              <h2 className="section-title">
                {t('landing.workflow.title')}
              </h2>
              <p className="section-subtitle max-w-xl">
                {t('landing.workflow.subtitle')}
              </p>
            </div>

            <div className="space-y-4">
              {workflow.map((step, index) => (
                <Card key={step.title} className="border-none bg-muted/50 shadow-none">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <CardTitle className="text-lg text-secondary">{step.title}</CardTitle>
                    </div>
                    <CircleCheck className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="relative overflow-hidden bg-gradient-to-br from-muted via-white to-emerald-50 px-4 py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(12,182,143,0.12),_transparent_60%)]" />
          <div className="relative mx-auto max-w-6xl space-y-12">
            <div className="space-y-4 text-center">
              <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                {t('landing.insights.badge')}
              </Badge>
              <h2 className="section-title">{t('landing.insights.title')}</h2>
              <p className="section-subtitle mx-auto max-w-2xl">
                {t('landing.insights.subtitle')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-stretch">
              <Card className="border-none bg-white shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <Gauge className="h-5 w-5 text-primary" />
                    {t('landing.insights.dashboard.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {insightHighlights.map((highlight) => (
                      <div key={highlight.label} className="rounded-2xl border border-muted/0 bg-muted/60 p-4 text-left">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{highlight.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-secondary">{highlight.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{highlight.caption}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl bg-primary/10 p-5 text-sm text-secondary">
                    <div className="flex items-center gap-3">
                      <CalendarRange className="h-5 w-5 text-primary" />
                      <span className="text-sm font-semibold">{t('landing.insights.dashboard.card.title')}</span>
                    </div>
                    <p className="mt-3 text-muted-foreground">
                      {t('landing.insights.dashboard.card.body')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.name} className="border-none bg-white/80 shadow-md backdrop-blur">
                    <CardContent className="space-y-4 p-6">
                      <p className="text-sm text-muted-foreground leading-relaxed">{testimonial.feedback}</p>
                      <div>
                        <p className="text-sm font-semibold text-secondary">{testimonial.name}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {dataCards.map((card) => (
                <Card key={card.title} className="border border-muted/40">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{card.title}</p>
                    <p className="mt-2 text-sm text-secondary">{card.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white px-4 py-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-12">
            <div className="space-y-4 text-center">
              <Badge variant="outline" className="rounded-full border-secondary/20 text-secondary">
                {t('landing.pricing.badge')}
              </Badge>
              <h2 className="section-title">{t('landing.pricing.title')}</h2>
              <p className="section-subtitle mx-auto max-w-2xl">
                {t('landing.pricing.subtitle')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 justify-items-center">
              {pricingPlans.map((plan) => {
                const isPremium = plan.variant === 'primary';
                const cardClass = isPremium
                  ? 'border-primary/40 bg-gradient-to-br from-primary/90 via-primary to-emerald-700 text-primary-foreground shadow-lg'
                  : 'border border-muted/40 bg-muted/20 shadow-none';
                const badgeClass = isPremium
                  ? 'w-fit rounded-full bg-white/20 text-xs uppercase tracking-[0.28em] text-white'
                  : 'w-fit rounded-full bg-secondary text-secondary-foreground';
                const descriptionClass = isPremium ? 'text-sm text-primary-foreground/80' : 'text-sm text-muted-foreground';
                const featureClass = descriptionClass;

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
                      <CardTitle className={`mt-3 text-2xl ${isPremium ? '' : 'text-secondary'}`}>{plan.title}</CardTitle>
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
          <section id="fleet" className="bg-muted/40 px-4 py-24">
            <div className="mx-auto max-w-6xl space-y-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                    {t('landing.fleet.badge')}
                  </Badge>
                  <h2 className="section-title">{t('landing.fleet.title')}</h2>
                  <p className="section-subtitle max-w-2xl">
                    {t('landing.fleet.subtitle')}
                  </p>
                </div>
                <Link to="/tractors">
                  <Button variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary/10">
                {t('landing.fleet.cta')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredTractors.map((tractor) => (
                  <TractorCard key={tractor.id} tractor={tractor} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-secondary px-4 py-24 text-secondary-foreground">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="rounded-full bg-white/10 text-xs uppercase tracking-[0.3em] text-white/70">
                {t('landing.sustainable.badge')}
              </Badge>
              <h2 className="text-4xl font-semibold leading-tight text-white">
                {t('landing.sustainable.title')}
              </h2>
              <p className="text-sm text-white/80">
                {t('landing.sustainable.body')}
              </p>
              <div className="flex flex-wrap gap-4">
                {sustainabilityStats.map((stat) => (
                  <div key={stat.title} className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 text-sm">
                    <div className="flex items-center gap-2 text-white">
                      <stat.icon className="h-5 w-5" />
                      <span className="font-semibold">{stat.title}</span>
                    </div>
                    <p className="mt-2 text-xs text-white/70">{stat.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-8 text-sm text-white/80">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">{t('landing.sustainable.deskLabel')}</p>
              <p className="mt-4 text-lg font-semibold text-white">
                {t('landing.sustainable.quote')}
              </p>
              <div className="mt-6">
                <p className="text-sm font-semibold text-white">{t('landing.sustainable.quote.author')}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">{t('landing.sustainable.quote.role')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-24">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-muted/50 bg-gradient-to-br from-white via-white to-emerald-50 p-12 text-center shadow-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {t('landing.cta.badge')}
            </div>
            <h2 className="mt-6 text-4xl font-semibold text-secondary">
              {t('landing.cta.title')}
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              {t('landing.cta.subtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {t('landing.cta.primary')}
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-secondary">
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
