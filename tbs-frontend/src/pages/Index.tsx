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
import { getTractorsForUI } from '@/lib/api';
import type { Tractor as TractorType } from '@/types';

const stats = [
  { label: 'Districts covered', value: '35', description: 'From Terai to Himalayan foothills' },
  { label: 'Avg. response time', value: '22m', description: 'Dispatch-ready tractor allocation' },
  { label: 'Fleet utilization', value: '92%', description: 'Optimized via Pathfinder telemetry' },
];

const platformFeatures = [
  {
    icon: Radar,
    title: 'Precision Availability',
    description: 'Real-time fleet intelligence layers demand, weather, and route access to guarantee the right tractor every time.',
    meta: 'Predictive uptime monitoring • Weather sync • Geo-fencing',
  },
  {
    icon: Layers,
    title: 'Unified Operations',
    description: 'One console for asset tracking, bookings, payments, and maintenance workflows— engineered for mixed tractor fleets.',
    meta: 'Digital machine files • Automated checklists • Analytics-ready data',
  },
  {
    icon: Route,
    title: 'Guided Logistics',
    description: 'Auto-generated dispatch routes minimize fuel cost and operator downtime with Pathfinder Pro geospatial models.',
    meta: 'Terrain-aware routing • Offline-optimized manifests',
  },
];

const workflow = [
  {
    title: 'Assess demand window',
    description: 'Define acreage, crop cycle, and equipment requirements in minutes with guided inputs.',
  },
  {
    title: 'Match precision fleet',
    description: 'Pathfinder algorithms surface best-fit tractors, operators, and implement bundles from live inventory.',
  },
  {
    title: 'Deploy and monitor',
    description: 'Track route progress, fuel efficiency, and soil impact from the Pathfinder command console.',
  },
];

const testimonials = [
  {
    name: 'Sita Gurung',
    role: 'Cooperative Lead, Kaski',
    feedback:
      '“Pathfinder insights helped us slash booking friction. Farmers now trust we can mobilize the exact tractor within an hour.”',
  },
  {
    name: 'Rupesh Thapa',
    role: 'Operations Head, Himalayan Agro',
    feedback:
      '“The unified dashboard cut manual paperwork in half while improving on-time arrivals to 97%. Our operators love the guided routing.”',
  },
];

const insightHighlights = [
  { label: 'Operator sentiment', value: '4.8 / 5', caption: 'Across 1.2k Pathfinder log entries' },
  { label: 'Soil impact', value: '↓ 18%', caption: 'Compaction reduction by optimized passes' },
  { label: 'Fuel efficiency', value: '+24%', caption: 'Per hectare versus regional baseline' },
];

const Index = () => {
  const [featuredTractors, setFeaturedTractors] = useState<TractorType[]>([]);

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

  const hasFeaturedTractors = useMemo(() => featuredTractors.length > 0, [featuredTractors]);

  return (
    <div className="min-h-screen bg-background text-secondary">
      <Navbar />

      <main>
        <section className="brand-gradient hero-grid overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-16 px-4 pb-24 pt-20 md:grid-cols-[1.15fr_0.85fr] md:pb-32 md:pt-24">
            <div className="flex flex-col gap-10 text-primary-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-amber-200" />
                Pathfinder Pro x TractorRent
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[58px] lg:leading-[1.05]">
                  Precision tractor bookings with Pathfinder intelligence.
                </h1>
                <p className="max-w-xl text-base text-primary-foreground/85 sm:text-lg">
                  Orchestrate your agricultural logistics with a professional-grade control tower. Align bookings,
                  operators, and equipment with real-time ground intelligence tailored for Nepal’s terrain.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/tractors">
                  <Button size="lg" className="bg-white text-secondary hover:bg-primary-foreground/90">
                    Schedule a Tractor
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a
                  href="#platform"
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground/85 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Explore the platform
                  <BarChart3 className="h-4 w-4" />
                </a>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {stats.map((item) => (
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
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Fleet snapshot</p>
                    <p className="mt-2 text-2xl font-semibold text-secondary">Live Dispatch Board</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-primary/10 text-xs text-primary">
                    Pathfinder Sync
                  </Badge>
                </div>

                <div className="space-y-4">
                  <Card className="border-none bg-white/70 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base text-secondary">
                        Lamjung Valley Run
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">ON ROUTE</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 border-t border-dashed border-border/70 pt-3 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        42 km • Mixed terrain • ETA 18m
                      </p>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-primary" />
                        Efficiency trending ↑ 12%
                      </div>
                    </CardContent>
                  </Card>

                  <div className="rounded-2xl border border-white/40 bg-white/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Today’s signal</p>
                    <p className="mt-2 text-base font-semibold text-secondary">High-value bookings concentrated in Chitwan</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Pathfinder suggests dispatching class-III tractors with rotary tillers between 14:00–18:00 NPT.
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-2xl bg-white/60 p-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-secondary">Soil compaction watch</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Moderate</span>
                    </div>
                    <p>Deploy double-pass limiters in Lalitpur and Sunsari lots to protect topsoil integrity.</p>
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
                  Platform capabilities
                </Badge>
                <h2 className="section-title">
                  A command center engineered for precision agrilogistics.
                </h2>
                <p className="section-subtitle max-w-2xl">
                  Designed with Pathfinder research, TractorRent delivers live fleet coordination for cooperatives,
                  operators, and farm holdings. Track jobs in real time, dispatch the right tractor, and keep all
                  maintenance and booking records in one place.
                </p>
              </div>
              <Link to="/register">
                <Button variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary/10">
                  Request a guided onboarding
                </Button>
              </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
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
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live tracking</p>
                  <p className="mt-2 text-sm text-secondary">
                    Center the map on your device and follow your hired tractor during an active booking on{' '}
                    <Link to="/tracking" className="underline">Live Tracking</Link>.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Smart catalog</p>
                  <p className="mt-2 text-sm text-secondary">
                    Browse a dynamic fleet with real photos, fuel status, and availability on{' '}
                    <Link to="/tractors" className="underline">Tractors</Link>.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin console</p>
                  <p className="mt-2 text-sm text-secondary">
                    Add/edit tractors, approve refunds, and audit bookings from the{' '}
                    <Link to="/admin/dashboard" className="underline">Admin Dashboard</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-24">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full border-secondary/20 text-secondary">
                Operational workflow
              </Badge>
              <h2 className="section-title">
                Pathfinder-aligned bookings in three orchestrated moves.
              </h2>
              <p className="section-subtitle max-w-xl">
                TractorRent bundles Pathfinder intelligence into a streamlined execution pattern so your team can make
                operational decisions with confidence.
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
                Insights in motion
              </Badge>
              <h2 className="section-title">Operational intelligence you can act on instantly.</h2>
              <p className="section-subtitle mx-auto max-w-2xl">
                Real usage data, fuel efficiency and booking trends help you route smarter and plan capacity ahead of
                seasonal spikes. Surface the metrics that matter—utilization, distance, idle time, compliance—to drive
                better outcomes.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-stretch">
              <Card className="border-none bg-white shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <Gauge className="h-5 w-5 text-primary" />
                    Pathfinder Utilization Board
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
                      <span className="text-sm font-semibold">Seasonal forecast — March window</span>
                    </div>
                    <p className="mt-3 text-muted-foreground">
                      Expect heightened demand in Province 2 triggered by late winter rains. Activate standby tractors
                      in Janakpur and Birgunj ahead of the second tilling cycle. Keep fuel buffers at 20% above normal.
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
              <Card className="border border-muted/40">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Data freshness</p>
                  <p className="mt-2 text-sm text-secondary">Position and status updates every 5–15 seconds during jobs.</p>
                </CardContent>
              </Card>
              <Card className="border border-muted/40">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Privacy & control</p>
                  <p className="mt-2 text-sm text-secondary">Customer data encrypted in transit; admins control retention.</p>
                </CardContent>
              </Card>
              <Card className="border border-muted/40">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Exports</p>
                  <p className="mt-2 text-sm text-secondary">One-click CSV exports for bookings, tractors and analytics.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white px-4 py-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-12">
            <div className="space-y-4 text-center">
              <Badge variant="outline" className="rounded-full border-secondary/20 text-secondary">
                Transparent pricing
              </Badge>
              <h2 className="section-title">Flexible plans aligned to your acreage reality.</h2>
              <p className="section-subtitle mx-auto max-w-2xl">
                Choose instant self-serve deployment or Pathfinder-assisted coordination. Every booking includes operator
                verification, maintenance assurance, and digital records.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border border-muted/40 bg-muted/20 shadow-none">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit rounded-full bg-secondary text-secondary-foreground">
                    Field Ready
                  </Badge>
                  <CardTitle className="mt-3 text-2xl text-secondary">Standard Access</CardTitle>
                  <p className="text-sm text-muted-foreground">Ideal for single-village farming groups needing reliable tractors fast.</p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>• Verified operator dispatch in under 30 minutes</p>
                  <p>• eSewa and COD settlement options</p>
                  <p>• Fleet-grade maintenance certification</p>
                </CardContent>
                <CardFooter>
                  <Link to="/register" className="w-full">
                    <Button variant="secondary" className="w-full">
                      Activate
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="border-primary/40 bg-gradient-to-br from-primary/90 via-primary to-emerald-700 text-primary-foreground shadow-lg">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit rounded-full bg-white/20 text-xs uppercase tracking-[0.28em] text-white">
                    Most popular
                  </Badge>
                  <CardTitle className="mt-4 text-3xl">Pathfinder Managed</CardTitle>
                  <p className="text-sm text-primary-foreground/80">
                    Full-spectrum coordination for cooperatives handling multi-district acreage.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-primary-foreground/80">
                  <p>• Dedicated operations strategist</p>
                  <p>• Pathfinder telemetry, soil integrity & fuel analytics</p>
                  <p>• Custom compliance and reporting suite</p>
                </CardContent>
                <CardFooter>
                  <Link to="/register" className="w-full">
                    <Button className="w-full bg-white text-secondary hover:bg-white/90">
                      Talk to specialist
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="border border-muted/40 bg-muted/20 shadow-none">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit rounded-full bg-secondary text-secondary-foreground">
                    Enterprise
                  </Badge>
                  <CardTitle className="mt-3 text-2xl text-secondary">Agro Enterprise</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tailored for nation-wide agribusiness and government programs with large fleets.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>• Private-label operator app</p>
                  <p>• ERP, GIS, and subsidy integrations</p>
                  <p>• Dedicated 24/7 command center</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Book a strategy call
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {hasFeaturedTractors && (
          <section id="fleet" className="bg-muted/40 px-4 py-24">
            <div className="mx-auto max-w-6xl space-y-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                    Pathfinder fleet curation
                  </Badge>
                  <h2 className="section-title">Featured tractors in dispatch rotation.</h2>
                  <p className="section-subtitle max-w-2xl">
                    Every machine is telemetry tagged, operator-certified, and prepped with the implements you request.
                  </p>
                </div>
                <Link to="/tractors">
                  <Button variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary/10">
                    View complete fleet
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
                Sustainable outcomes
              </Badge>
              <h2 className="text-4xl font-semibold leading-tight text-white">
                Pathfinder-backed bookings reduce soil strain and conserve water.
              </h2>
              <p className="text-sm text-white/80">
                Our agronomy partners leverage telemetry to validate every pass performed by operators. Expect measured
                sustainability outcomes alongside production gains.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 text-sm">
                  <div className="flex items-center gap-2 text-white">
                    <Trees className="h-5 w-5" />
                    <span className="font-semibold">Topsoil preserved</span>
                  </div>
                  <p className="mt-2 text-xs text-white/70">12,800 hectares safeguarded in 2024 season</p>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 text-sm">
                  <div className="flex items-center gap-2 text-white">
                    <Shield className="h-5 w-5" />
                    <span className="font-semibold">Operator compliance</span>
                  </div>
                  <p className="mt-2 text-xs text-white/70">98.6% adherence to safety and checklists</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-8 text-sm text-white/80">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Sustainability desk</p>
              <p className="mt-4 text-lg font-semibold text-white">
                “Leveraging TractorRent’s Pathfinder module, we partnered with farmers to design mechanical passes that
                honor soil structure. The result: higher yields and meaningful resilience.”
              </p>
              <div className="mt-6">
                <p className="text-sm font-semibold text-white">Nabin Bista</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Agronomy Director, Nepal AgroLab</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-24">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-muted/50 bg-gradient-to-br from-white via-white to-emerald-50 p-12 text-center shadow-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Pathfinder inside
            </div>
            <h2 className="mt-6 text-4xl font-semibold text-secondary">
              Ready to orchestrate tractor operations like a pro team?
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Join cooperatives and agribusinesses using TractorRent with Pathfinder Pro data to deliver tractors,
              implements, and operators exactly when they are needed.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Start your Pathfinder journey
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-secondary">
                  Log in to your console
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
              <p className="text-base font-semibold">TractorRent Pathfinder Suite</p>
              <p className="text-xs text-secondary-foreground/70">Precision tractor logistics for Nepal</p>
            </div>
          </div>
          <p className="text-xs text-secondary-foreground/70">
            © 2025 TractorRent. Pathfinder insights licensed for cooperative operations across Nepal.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
