import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, MapPin, Shield, Tractor as TractorIcon, TrendingUp, Facebook, Twitter, Instagram, Mail, Phone, MapPin as MapPinIcon } from 'lucide-react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Tractor } from '@/types/tractor';

const Index = () => {
    const { t } = useLanguage();
    const [tractors, setTractors] = useState<Tractor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchTractors();
    }, []);

    const fetchTractors = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/tractors');
            if (response.ok) {
                const data = await response.json();
                setTractors(data);
            } else {
                console.error('Failed to fetch tractors');
            }
        } catch (error) {
            console.error('Error fetching tractors:', error);
        } finally {
            setLoading(false);
        }
    };

    const heroImages = [
        "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=2000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1530267981375-f0de93fe1e91?q=80&w=2000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop"
    ];

    const [currentHeroImage, setCurrentHeroImage] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Fallback images if no tractors are fetched or for loading state
    const fallbackImages = [
        "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1530267981375-f0de93fe1e91?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517260739337-6799d239ce83?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605218427368-35b089b8a409?q=80&w=1000&auto=format&fit=crop"
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-40 overflow-hidden">
                {/* Background Carousel */}
                <div className="absolute inset-0 z-0">
                    {heroImages.map((img, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentHeroImage ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white font-medium text-sm animate-fade-in-up border border-white/20 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                            </span>
                            {t('landing.hero.badge')}
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white animate-fade-in-up-delay-1 drop-shadow-lg leading-tight">
                            {t('landing.hero.heading')}
                        </h1>

                        <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed animate-fade-in-up-delay-2 drop-shadow-md">
                            {t('landing.hero.subtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delay-3">
                            <Link to="/tractors">
                                <Button size="lg" className="h-14 px-8 text-lg rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto border-none">
                                    <TractorIcon className="mr-2 h-5 w-5" />
                                    {t('landing.hero.ctaPrimary')}
                                </Button>
                            </Link>
                            <Link to="/#platform">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-2xl border-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-white/50 w-full sm:w-auto backdrop-blur-sm">
                                    {t('landing.hero.ctaSecondary')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tractor Carousel Section */}
            <section className="py-20 bg-muted/30 border-y border-border/40">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <span className="text-primary font-semibold tracking-wider uppercase text-sm">{t('landing.fleet.badge')}</span>
                        <h2 className="section-title">{t('landing.fleet.title')}</h2>
                        <p className="section-subtitle">{t('landing.fleet.subtitle')}</p>
                    </div>

                    <div className="max-w-6xl mx-auto px-4 sm:px-12">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                className="w-full"
                            >
                                <CarouselContent>
                                    {(tractors.length > 0 ? tractors : fallbackImages).map((item, index) => {
                                        const isTractor = typeof item !== 'string';
                                        const src = isTractor ? (item as Tractor).imageUrl || (item as Tractor).imageUrls?.[0] : (item as string);
                                        const title = isTractor ? (item as Tractor).name : `Tractor ${index + 1}`;
                                        const subtitle = isTractor ? `${(item as Tractor).model} • $${(item as Tractor).hourlyRate}/hr` : 'Premium Fleet';

                                        return (
                                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4">
                                                <div className="p-1 h-full">
                                                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                                                        <div className="aspect-[4/3] relative overflow-hidden">
                                                            <img
                                                                src={src}
                                                                alt={title}
                                                                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop";
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                                                <p className="text-white font-bold text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{title}</p>
                                                                <p className="text-white/80 text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{subtitle}</p>
                                                            </div>
                                                        </div>
                                                        {isTractor && (
                                                            <div className="p-4 flex-grow flex flex-col justify-between">
                                                                <div>
                                                                    <h3 className="font-semibold text-lg text-secondary mb-1">{title}</h3>
                                                                    <p className="text-muted-foreground text-sm line-clamp-2">{(item as Tractor).description}</p>
                                                                </div>
                                                                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                                                                    <span className="text-primary font-bold">${(item as Tractor).hourlyRate}/hr</span>
                                                                    <Link to={`/tractors/${(item as Tractor).id}`} className="text-sm font-medium text-secondary hover:text-primary transition-colors">
                                                                        View Details &rarr;
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CarouselItem>
                                        );
                                    })}
                                </CarouselContent>
                                <CarouselPrevious className="-left-4 lg:-left-12 h-12 w-12 border-2 bg-white/80 backdrop-blur hover:bg-white" />
                                <CarouselNext className="-right-4 lg:-right-12 h-12 w-12 border-2 bg-white/80 backdrop-blur hover:bg-white" />
                            </Carousel>
                        )}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 border-b border-border/40 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                label: t('landing.stats.districts.label'),
                                desc: t('landing.stats.districts.desc'),
                                value: "77",
                                icon: MapPin
                            },
                            {
                                label: t('landing.stats.response.label'),
                                desc: t('landing.stats.response.desc'),
                                value: "< 30m",
                                icon: TrendingUp
                            },
                            {
                                label: t('landing.stats.utilization.label'),
                                desc: t('landing.stats.utilization.desc'),
                                value: "98%",
                                icon: CheckCircle2
                            }
                        ].map((stat, index) => (
                            <div key={index} className="flex items-start gap-4 p-6 rounded-2xl bg-muted/20 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-secondary mb-1">{stat.value}</div>
                                    <div className="font-semibold text-secondary/80">{stat.label}</div>
                                    <div className="text-sm text-muted-foreground">{stat.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Features */}
            <section id="platform" className="py-24 relative overflow-hidden bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <span className="text-primary font-semibold tracking-wider uppercase text-sm">{t('landing.platform.badge')}</span>
                        <h2 className="section-title">{t('landing.platform.title')}</h2>
                        <p className="section-subtitle">{t('landing.platform.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: t('landing.platform.features.tracking.title'),
                                desc: t('landing.platform.features.tracking.desc'),
                                meta: t('landing.platform.features.tracking.meta'),
                                icon: MapPin,
                                color: "text-emerald-600",
                                bg: "bg-emerald-50"
                            },
                            {
                                title: t('landing.platform.features.operations.title'),
                                desc: t('landing.platform.features.operations.desc'),
                                meta: t('landing.platform.features.operations.meta'),
                                icon: Shield,
                                color: "text-blue-600",
                                bg: "bg-blue-50"
                            },
                            {
                                title: t('landing.platform.features.logistics.title'),
                                desc: t('landing.platform.features.logistics.desc'),
                                meta: t('landing.platform.features.logistics.meta'),
                                icon: TrendingUp,
                                color: "text-purple-600",
                                bg: "bg-purple-50"
                            }
                        ].map((feature, index) => (
                            <div key={index} className="group p-8 rounded-3xl border border-border bg-white hover:border-primary/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />

                                <div className={`relative h-14 w-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="h-7 w-7" />
                                </div>

                                <h3 className="text-xl font-bold text-secondary mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground mb-6 leading-relaxed">{feature.desc}</p>

                                <div className="pt-6 border-t border-border/50">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{feature.meta}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section className="py-24 bg-secondary text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-b from-secondary via-secondary/95 to-secondary" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <span className="text-primary font-semibold tracking-wider uppercase text-sm">{t('landing.workflow.badge')}</span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">{t('landing.workflow.title')}</h2>
                        <p className="text-lg text-white/70">{t('landing.workflow.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-white/10" />

                        {[
                            {
                                step: "01",
                                title: t('landing.workflow.step1.title'),
                                desc: t('landing.workflow.step1.desc')
                            },
                            {
                                step: "02",
                                title: t('landing.workflow.step2.title'),
                                desc: t('landing.workflow.step2.desc')
                            },
                            {
                                step: "03",
                                title: t('landing.workflow.step3.title'),
                                desc: t('landing.workflow.step3.desc')
                            }
                        ].map((item, index) => (
                            <div key={index} className="relative flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 backdrop-blur-sm group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-300 shadow-glow">
                                    <span className="text-3xl font-bold text-white/90">{item.step}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                                <p className="text-white/60 leading-relaxed max-w-xs">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

                        <div className="relative z-10 space-y-8">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-sm font-medium border border-white/20">
                                {t('landing.cta.badge')}
                            </span>

                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                                {t('landing.cta.title')}
                            </h2>

                            <p className="text-xl text-white/80 max-w-2xl mx-auto">
                                {t('landing.cta.subtitle')}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link to="/tractors">
                                    <Button size="lg" className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90 font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto">
                                        {t('landing.cta.primary')}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button variant="outline" size="lg" className="h-14 px-8 text-lg bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:text-white rounded-xl w-full sm:w-auto backdrop-blur-sm">
                                        {t('landing.cta.secondary')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Index;
