import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { ArrowRight, MapPin, Shield, Tractor as TractorIcon, Clock, Navigation, Search, Calendar, CreditCard, CheckCircle2, Star } from 'lucide-react';
import { getTractorsForUI } from '@/lib/api';
import type { Tractor } from '@/types';

const Index = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [tractors, setTractors] = useState<Tractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [api2, setApi2] = useState<CarouselApi>();
    
    // Carousel images from public folder
    const carouselImages = [
        '/images/tractor1.png',
        '/images/tractor2.png',
        '/images/a.webp',
        '/images/b.jpg',
    ];

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchTractors();
    }, []);

    // Auto-slide for main carousel

    useEffect(() => {
        if (!api2) return;

        const interval = setInterval(() => {
            api2.scrollNext();
        }, 4000);

        return () => clearInterval(interval);
    }, [api2]);

    const fetchTractors = async () => {
        try {
            const data = await getTractorsForUI();
            setTractors(data);
        } catch (error) {
            console.error('Error fetching tractors:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-background">
                {/* Decorative background */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/70 via-background to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
                <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl dark:bg-amber-500/15" />
                <div className="pointer-events-none absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-500/15" />

                {/* Content */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[minmax(0,1.6fr),minmax(0,1.2fr)] items-center">
                        {/* Left: copy + actions */}
                        <div className="space-y-8 md:space-y-10">
                            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-4 py-1.5 text-xs font-semibold shadow-sm border border-amber-100 dark:bg-amber-500/10 dark:text-amber-100 dark:border-amber-500/40">
                                <TractorIcon className="h-4 w-4" />
                                <span>{t('landing.hero.badge') ?? 'Modern tractor rental for every farmer'}</span>
                            </div>

                            <div className="space-y-4 md:space-y-6">
                                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-tight animate-fade-in">
                                    {t('landing.hero.mainTitle')}
                                </h1>
                                <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
                                    {t('landing.hero.mainSubtitle')}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                                {user && (
                                    <Link to="/tractors" className="w-full sm:w-auto">
                                        <Button
                                            size="lg"
                                            className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 transform hover:scale-105"
                                        >
                                            {t('landing.hero.browseButton')}
                                            <ArrowRight className="ml-2 h-6 w-6" />
                                        </Button>
                                    </Link>
                                )}
                                <Link to="#how" className="w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl rounded-xl border-2 border-border bg-card/60 backdrop-blur-sm text-foreground hover:bg-muted hover:border-amber-500/50 font-semibold transition-all duration-300"
                                    >
                                        {t('landing.hero.howItWorksButton')}
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust indicators */}
                            <div className="grid gap-4 sm:grid-cols-3 pt-4 text-left">
                                <div className="flex items-center gap-3 rounded-xl bg-card/70 border border-border px-4 py-3 shadow-sm">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <div className="text-xs">
                                        <p className="font-semibold text-foreground">1,200+ tractors</p>
                                        <p className="text-muted-foreground">Verified and well-maintained</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-card/70 border border-border px-4 py-3 shadow-sm">
                                    <Navigation className="h-5 w-5 text-sky-500" />
                                    <div className="text-xs">
                                        <p className="font-semibold text-foreground">Live GPS tracking</p>
                                        <p className="text-muted-foreground">Know where your tractor is</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-card/70 border border-border px-4 py-3 shadow-sm">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    <div className="text-xs">
                                        <p className="font-semibold text-foreground">24/7 booking</p>
                                        <p className="text-muted-foreground">Book in minutes, anytime</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: floating preview card */}
                        <div className="hidden md:block">
                            <div className="relative">
                                <div className="absolute -top-10 -right-6 h-32 w-32 rounded-full bg-amber-400/40 blur-3xl dark:bg-amber-500/25" />
                                <div className="relative rounded-3xl border border-border bg-card/90 shadow-2xl backdrop-blur-md p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
                                                Smart booking overview
                                            </p>
                                            <h3 className="text-lg font-semibold text-foreground">Today&apos;s highlights</h3>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Live
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="rounded-2xl bg-muted/60 px-3 py-2.5">
                                            <p className="text-muted-foreground">Active bookings</p>
                                            <p className="mt-1 text-xl font-bold text-foreground">18</p>
                                        </div>
                                        <div className="rounded-2xl bg-muted/60 px-3 py-2.5">
                                            <p className="text-muted-foreground">Today&apos;s revenue</p>
                                            <p className="mt-1 text-xl font-bold text-foreground">रू 1.2L</p>
                                        </div>
                                        <div className="rounded-2xl bg-muted/60 px-3 py-2.5">
                                            <p className="text-muted-foreground">On-time rate</p>
                                            <p className="mt-1 text-xl font-bold text-foreground">98%</p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-dashed border-border bg-muted/50 px-3 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center">
                                                <TractorIcon className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div className="text-xs">
                                                <p className="font-semibold text-foreground">Mahindra 475 DI XP Plus</p>
                                                <p className="text-muted-foreground">Next booking in 32 min</p>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs">
                                            <p className="font-semibold text-amber-500">रू 1,800/hr</p>
                                            <p className="text-muted-foreground">Bhaktapur • 45 HP</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Image Carousel Section */}
            <section className="py-16 md:py-24 bg-background border-y border-border">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <Carousel
                            className="w-full"
                            setApi={setApi2}
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                        >
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {carouselImages.map((image, index) => (
                                    <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                                        <div className="p-3">
                                            <div className="relative group overflow-hidden rounded-2xl border-2 border-border bg-card hover:border-amber-500/70 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2">
                                                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                                                    <img
                                                        src={image}
                                                        alt={`Tractor showcase ${index + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop";
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-4 h-12 w-12 bg-card/90 backdrop-blur-sm border-2 border-border text-foreground hover:bg-muted hover:text-amber-500 hover:border-amber-500/50 transition-all duration-300 shadow-lg" />
                            <CarouselNext className="right-4 h-12 w-12 bg-card/90 backdrop-blur-sm border-2 border-border text-foreground hover:bg-muted hover:text-amber-500 hover:border-amber-500/50 transition-all duration-300 shadow-lg" />
                        </Carousel>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 md:py-16 bg-background border-y border-border">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">1,200+</div>
                            <div className="text-sm md:text-base text-muted-foreground">{t('landing.stats.activeTractors')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">25k+</div>
                            <div className="text-sm md:text-base text-muted-foreground">{t('landing.stats.bookingsCompleted')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">70+</div>
                            <div className="text-sm md:text-base text-muted-foreground">{t('landing.stats.districtsCovered')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">4.8/5</div>
                            <div className="text-sm md:text-base text-muted-foreground">{t('landing.stats.avgRating')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Tractors Section */}
            <section id="browse" className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 gap-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t('landing.featured.title')}</h2>
                            <p className="text-muted-foreground text-base md:text-lg">{t('landing.featured.subtitle')}</p>
                        </div>
                        <Link to="/tractors">
                            <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                                {t('landing.featured.seeAll')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {tractors.length > 0 ? (
                                tractors.slice(0, 6).map((tractor) => {
                                    const imageUrl = tractor.image || tractor.images?.[0] || "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop";
                                    
                                    return (
                                        <Link 
                                            key={tractor.id} 
                                            to={`/tractors/${tractor.id}`}
                                            className="group block"
                                        >
                                            <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1">
                                                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                                                    <img
                                                        src={imageUrl}
                                                        alt={tractor.name}
                                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop";
                                                        }}
                                                    />
                                                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                        {tractor.horsePower || 'N/A'} HP
                                                    </div>
                                                    {tractor.rating && (
                                                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full">
                                                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                                            <span className="text-xs font-semibold text-foreground">{tractor.rating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 md:p-5">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-amber-500 transition-colors">
                                                            {tractor.name}
                                                        </h3>
                                                        <div className="text-lg font-bold text-amber-500">
                                                            NPR {tractor.hourlyRate}/hr
                                                        </div>
                                                    </div>
                                                    {tractor.location && (
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                                                            <MapPin className="h-4 w-4" />
                                                            <span>{tractor.location}</span>
                                                        </div>
                                                    )}
                                                    <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                                                        {t('landing.featured.viewDetails')}
                                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <TractorIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground text-lg">{t('landing.featured.noTractors')}</p>
                                    <p className="text-muted-foreground text-sm mt-2">{t('landing.featured.checkBack')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* How it works Section */}
            <section id="how" className="py-16 md:py-24 bg-secondary/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t('landing.howItWorks.title')}</h2>
                        <p className="text-muted-foreground text-base md:text-lg">{t('landing.howItWorks.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 max-w-7xl mx-auto">
                        {[
                            {
                                step: "1",
                                title: t('landing.howItWorks.step1.title'),
                                desc: t('landing.howItWorks.step1.desc'),
                                icon: Search,
                            },
                            {
                                step: "2",
                                title: t('landing.howItWorks.step2.title'),
                                desc: t('landing.howItWorks.step2.desc'),
                                icon: Calendar,
                            },
                            {
                                step: "3",
                                title: t('landing.howItWorks.step3.title'),
                                desc: t('landing.howItWorks.step3.desc'),
                                icon: Navigation,
                            },
                            {
                                step: "4",
                                title: t('landing.howItWorks.step4.title'),
                                desc: t('landing.howItWorks.step4.desc'),
                                icon: TractorIcon,
                            },
                            {
                                step: "5",
                                title: t('landing.howItWorks.step5.title'),
                                desc: t('landing.howItWorks.step5.desc'),
                                icon: CreditCard,
                            },
                        ].map((item, index) => (
                            <div key={index} className="relative">
                                <div className="bg-card rounded-xl p-6 border border-border hover:border-amber-500/50 transition-all duration-300 h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-900 font-bold flex items-center justify-center text-lg">
                                            {item.step}
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                            <item.icon className="h-6 w-6 text-amber-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why choose Tractor Sewa Section */}
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t('landing.whyChoose.title')}</h2>
                        <p className="text-muted-foreground text-base md:text-lg">{t('landing.whyChoose.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
                        {[
                            {
                                title: t('landing.whyChoose.feature1.title'),
                                desc: t('landing.whyChoose.feature1.desc'),
                                icon: Navigation,
                            },
                            {
                                title: t('landing.whyChoose.feature2.title'),
                                desc: t('landing.whyChoose.feature2.desc'),
                                icon: CreditCard,
                            },
                            {
                                title: t('landing.whyChoose.feature3.title'),
                                desc: t('landing.whyChoose.feature3.desc'),
                                icon: Shield,
                            },
                            {
                                title: t('landing.whyChoose.feature4.title'),
                                desc: t('landing.whyChoose.feature4.desc'),
                                icon: TractorIcon,
                            },
                        ].map((feature, index) => (
                            <div key={index} className="bg-card rounded-xl p-6 border border-border hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                                    <feature.icon className="h-6 w-6 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24 bg-secondary/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto bg-card rounded-2xl p-8 md:p-12 border border-border">
                        <div className="text-center space-y-6">
                            <h3 className="text-2xl md:text-3xl font-bold text-foreground">{t('landing.cta.title')}</h3>
                            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                                {t('landing.cta.subtitle')}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                {user && (
                                    <Link to="/tractors" className="w-full sm:w-auto">
                                        <Button size="lg" className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-10 text-base md:text-lg rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                                            {t('landing.cta.browseButton')}
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                )}
                                {!user && (
                                    <Link to="/login" className="w-full sm:w-auto">
                                        <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-10 text-base md:text-lg rounded-lg border-2 border-border bg-card/50 text-foreground hover:bg-muted">
                                            {t('landing.cta.signInButton')}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Index;
