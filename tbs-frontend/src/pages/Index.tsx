import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, MapPin, Shield, Tractor as TractorIcon, TrendingUp, Clock, DollarSign, Users, Sprout, Wrench, Navigation, Zap } from 'lucide-react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { getTractorsForUI } from '@/lib/api';
import type { Tractor } from '@/types';

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
            const data = await getTractorsForUI();
            setTractors(data);
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
    
    // Farm-themed color palette
    const farmColors = {
        earth: 'from-amber-900/90 via-orange-800/80 to-yellow-700/70',
        soil: 'from-amber-800/95 via-orange-700/85 to-yellow-600/75',
        harvest: 'from-amber-600 via-orange-500 to-yellow-500',
        field: 'from-emerald-700 via-green-600 to-lime-500',
        wheat: 'from-yellow-400 via-amber-300 to-orange-200',
        earthDark: 'bg-amber-950/20',
        soilLight: 'bg-amber-50',
        fieldLight: 'bg-emerald-50',
    };

    const [currentHeroImage, setCurrentHeroImage] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);


    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar />

            {/* Hero Section - Farm Themed */}
            <section className="relative pt-32 pb-40 overflow-hidden">
                {/* Background Carousel with Farm Overlay */}
                <div className="absolute inset-0 z-0">
                    {heroImages.map((img, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentHeroImage ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}
                    {/* Farm-themed gradient overlay - earth tones */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${farmColors.earth} backdrop-blur-[1px]`} />
                    {/* Additional texture overlay for depth */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,69,19,0.1),transparent_50%)]" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/20 text-amber-100 font-semibold text-sm animate-fade-in-up border border-amber-400/30 backdrop-blur-md shadow-lg">
                            <TractorIcon className="h-4 w-4 text-amber-300" />
                            <span>{t('landing.hero.badge')}</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white animate-fade-in-up-delay-1 drop-shadow-2xl leading-tight">
                            <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent">
                                {t('landing.hero.title')}
                            </span>
                            <br />
                            <span className="text-white">{t('landing.hero.titleSub')}</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-amber-50 max-w-3xl mx-auto leading-relaxed animate-fade-in-up-delay-2 drop-shadow-lg font-medium">
                            {t('landing.hero.description')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delay-3 pt-4">
                            <Link to="/tractors">
                                <Button size="lg" className="h-14 px-10 text-lg rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-2xl hover:shadow-amber-500/50 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto border-2 border-amber-400/30 font-bold">
                                    <TractorIcon className="mr-2 h-5 w-5" />
                                    {t('landing.hero.ctaBrowse')}
                                </Button>
                            </Link>
                            <Link to="/#platform">
                                <Button variant="outline" size="lg" className="h-14 px-10 text-lg rounded-xl border-2 border-amber-300/40 bg-white/10 backdrop-blur-md text-white hover:bg-amber-500/20 hover:text-white hover:border-amber-300/60 w-full sm:w-auto font-semibold">
                                    {t('landing.hero.ctaLearn')}
                                </Button>
                            </Link>
                        </div>

                        {/* Quick Stats Bar */}
                        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8 animate-fade-in-up-delay-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-amber-300/20">
                                <div className="text-2xl font-bold text-amber-300">77+</div>
                                <div className="text-xs text-amber-100/80 uppercase tracking-wide">{t('landing.hero.stats.districts')}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-amber-300/20">
                                <div className="text-2xl font-bold text-amber-300">&lt;30m</div>
                                <div className="text-xs text-amber-100/80 uppercase tracking-wide">{t('landing.hero.stats.response')}</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-amber-300/20">
                                <div className="text-2xl font-bold text-amber-300">24/7</div>
                                <div className="text-xs text-amber-100/80 uppercase tracking-wide">{t('landing.hero.stats.support')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tractor Carousel Section - Farm Themed */}
            <section className="py-24 bg-gradient-to-b from-amber-50 via-white to-emerald-50 relative overflow-hidden">
                {/* Decorative farm elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-5">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-amber-400 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-40 h-40 bg-emerald-400 rounded-full blur-3xl" />
                </div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 font-semibold text-sm border border-amber-200">
                            <Sprout className="h-4 w-4" />
                            <span>{t('landing.fleet.badge')}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                            {t('landing.fleet.title')}
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            {t('landing.fleet.subtitle')}
                        </p>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-12">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
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
                                    {tractors.length > 0 ? (
                                        tractors.slice(0, 6).map((tractor) => {
                                            const imageUrl = tractor.image || tractor.images?.[0] || "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop";
                                            
                                            return (
                                                <CarouselItem key={tractor.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
                                                    <div className="p-1 h-full">
                                                        <div className="overflow-hidden rounded-2xl border-2 border-amber-200/50 bg-white shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 group h-full flex flex-col hover:-translate-y-2">
                                                            <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-amber-100 to-emerald-100">
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={tractor.name}
                                                                    className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-700"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop";
                                                                    }}
                                                                />
                                                                <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                                    ${tractor.hourlyRate}/hr
                                                                </div>
                                                                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/90 via-amber-800/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                                                    <p className="text-white font-bold text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{tractor.name}</p>
                                                                    <p className="text-amber-100 text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{tractor.model}</p>
                                                                </div>
                                                            </div>
                                                            <div className="p-5 flex-grow flex flex-col justify-between bg-white">
                                                                <div>
                                                                    <h3 className="font-bold text-lg text-gray-900 mb-2">{tractor.name}</h3>
                                                                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{tractor.description || `${tractor.model} - Ready for your agricultural needs`}</p>
                                                                    {tractor.location && (
                                                                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                                                            <MapPin className="h-3 w-3" />
                                                                            <span>{tractor.location}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="mt-4 pt-4 border-t border-amber-200 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        {tractor.rating && (
                                                                            <div className="flex items-center gap-1 text-amber-600">
                                                                                <span className="text-sm font-semibold">★ {tractor.rating.toFixed(1)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Link to={`/tractors/${tractor.id}`} className="text-sm font-semibold text-amber-700 hover:text-amber-800 transition-colors flex items-center gap-1">
                                                                        View Details <ArrowRight className="h-4 w-4" />
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CarouselItem>
                                            );
                                        })
                                    ) : (
                                        <div className="w-full text-center py-16">
                                            <TractorIcon className="h-16 w-16 mx-auto text-amber-300 mb-4" />
                                            <p className="text-gray-600 text-lg">No tractors available at the moment.</p>
                                            <p className="text-gray-400 text-sm mt-2">Check back soon for new listings!</p>
                                        </div>
                                    )}
                                </CarouselContent>
                                <CarouselPrevious className="-left-4 lg:-left-12 h-12 w-12 border-2 border-amber-300 bg-white/90 backdrop-blur hover:bg-amber-50 text-amber-700 hover:text-amber-800 shadow-lg" />
                                <CarouselNext className="-right-4 lg:-right-12 h-12 w-12 border-2 border-amber-300 bg-white/90 backdrop-blur hover:bg-amber-50 text-amber-700 hover:text-amber-800 shadow-lg" />
                            </Carousel>
                        )}
                    </div>
                </div>
            </section>

            {/* Stats Section - Farm Themed */}
            <section className="py-20 bg-gradient-to-br from-amber-900 via-orange-800 to-amber-700 text-white relative overflow-hidden">
                {/* Farm texture overlay */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                </div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('landing.stats.title')}</h2>
                        <p className="text-amber-100 text-lg max-w-2xl mx-auto">{t('landing.stats.subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[
                            {
                                label: t('landing.stats.districts.label'),
                                desc: t('landing.stats.districts.desc'),
                                value: "77",
                                icon: MapPin,
                                color: "from-amber-400 to-yellow-300"
                            },
                            {
                                label: t('landing.stats.response.label'),
                                desc: t('landing.stats.response.desc'),
                                value: "< 30m",
                                icon: Clock,
                                color: "from-orange-400 to-amber-300"
                            },
                            {
                                label: t('landing.stats.utilization.label'),
                                desc: t('landing.stats.utilization.desc'),
                                value: "98%",
                                icon: TrendingUp,
                                color: "from-yellow-400 to-amber-300"
                            }
                        ].map((stat, index) => (
                            <div key={index} className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-amber-300/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                                <div className="relative">
                                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${stat.color} text-amber-900 mb-4 shadow-lg`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div className="text-4xl font-extrabold text-white mb-2">{stat.value}</div>
                                    <div className="font-bold text-amber-200 mb-1">{stat.label}</div>
                                    <div className="text-sm text-amber-100/80">{stat.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Features - Farm Themed */}
            <section id="platform" className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-amber-50/30 to-emerald-50">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm border border-emerald-200">
                            <Zap className="h-4 w-4" />
                            <span>{t('landing.platform.badge')}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                            {t('landing.platform.title')}
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            {t('landing.platform.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                title: t('landing.platform.features.tracking.title'),
                                desc: t('landing.platform.features.tracking.desc'),
                                meta: t('landing.platform.features.tracking.meta'),
                                icon: Navigation,
                                gradient: "from-emerald-500 to-green-600",
                                bg: "bg-emerald-50",
                                border: "border-emerald-200"
                            },
                            {
                                title: t('landing.platform.features.operations.title'),
                                desc: t('landing.platform.features.operations.desc'),
                                meta: t('landing.platform.features.operations.meta'),
                                icon: Shield,
                                gradient: "from-amber-500 to-orange-600",
                                bg: "bg-amber-50",
                                border: "border-amber-200"
                            },
                            {
                                title: t('landing.platform.features.logistics.title'),
                                desc: t('landing.platform.features.logistics.desc'),
                                meta: t('landing.platform.features.logistics.meta'),
                                icon: TrendingUp,
                                gradient: "from-yellow-500 to-amber-600",
                                bg: "bg-yellow-50",
                                border: "border-yellow-200"
                            }
                        ].map((feature, index) => (
                            <div key={index} className="group relative p-8 rounded-3xl border-2 bg-white hover:border-amber-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                                {/* Decorative gradient background */}
                                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-bl-full -mr-20 -mt-20 group-hover:opacity-10 transition-opacity duration-300`} />
                                
                                <div className={`relative inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="h-8 w-8" />
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{feature.title}</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed relative z-10">{feature.desc}</p>

                                <div className={`pt-6 border-t-2 ${feature.border} relative z-10`}>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{feature.meta}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow Section - Farm Themed */}
            <section className="py-24 bg-gradient-to-br from-emerald-800 via-green-700 to-emerald-900 text-white relative overflow-hidden">
                {/* Farm field pattern overlay */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_25%,rgba(255,255,255,.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.1)_75%,rgba(255,255,255,.1))] bg-[length:20px_20px]"></div>
                </div>
                
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-100 font-semibold text-sm border border-emerald-400/30 backdrop-blur-md">
                            <Wrench className="h-4 w-4" />
                            <span>{t('landing.workflow.badge')}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                            {t('landing.workflow.title')}
                        </h2>
                        <p className="text-lg text-emerald-100 max-w-2xl mx-auto leading-relaxed">
                            {t('landing.workflow.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-6xl mx-auto">
                        {/* Connecting Line with farm theme */}
                        <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

                        {[
                            {
                                step: "01",
                                title: t('landing.workflow.step1.title'),
                                desc: t('landing.workflow.step1.desc'),
                                icon: TractorIcon,
                                color: "from-amber-400 to-yellow-500"
                            },
                            {
                                step: "02",
                                title: t('landing.workflow.step2.title'),
                                desc: t('landing.workflow.step2.desc'),
                                icon: DollarSign,
                                color: "from-orange-400 to-amber-500"
                            },
                            {
                                step: "03",
                                title: t('landing.workflow.step3.title'),
                                desc: t('landing.workflow.step3.desc'),
                                icon: Navigation,
                                color: "from-yellow-400 to-orange-500"
                            }
                        ].map((item, index) => (
                            <div key={index} className="relative flex flex-col items-center text-center group">
                                <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${item.color} border-4 border-white/20 flex items-center justify-center mb-6 backdrop-blur-sm group-hover:scale-110 group-hover:border-amber-300/50 transition-all duration-300 shadow-2xl relative z-10`}>
                                    <item.icon className="h-10 w-10 text-white" />
                                    <div className="absolute -top-2 -right-2 bg-white text-emerald-800 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                                        {item.step}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4 relative z-10">{item.title}</h3>
                                <p className="text-emerald-100 leading-relaxed max-w-xs relative z-10">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Value Proposition Section - Why Choose Us */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm border border-emerald-200 mb-6">
                                <Sprout className="h-4 w-4" />
                                <span>{t('landing.value.badge')}</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                {t('landing.value.title')}
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                {t('landing.value.subtitle')}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-6">
                                <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:shadow-lg transition-all">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{t('landing.value.coverage.title')}</h3>
                                        <p className="text-gray-600">{t('landing.value.coverage.desc')}</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:shadow-lg transition-all">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center">
                                        <Navigation className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{t('landing.value.tracking.title')}</h3>
                                        <p className="text-gray-600">{t('landing.value.tracking.desc')}</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 hover:shadow-lg transition-all">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white flex items-center justify-center">
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{t('landing.value.secure.title')}</h3>
                                        <p className="text-gray-600">{t('landing.value.secure.desc')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-200">
                                    <img 
                                        src="/images/tractor-field.png" 
                                        alt="Tractor in field"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to original image if the new one doesn't load
                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?q=80&w=1000&auto=format&fit=crop";
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-amber-900/60 to-transparent flex items-end p-8">
                                        <div className="text-white">
                                            <p className="text-2xl font-bold mb-2">{t('landing.value.trusted')}</p>
                                            <p className="text-amber-100">{t('landing.value.community')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section - Farm Themed */}
            <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-amber-50 to-emerald-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl border-4 border-amber-400/30">
                        {/* Farm-themed background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 rounded-full blur-3xl opacity-20"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-300 rounded-full blur-3xl opacity-20"></div>
                        </div>

                        <div className="relative z-10 space-y-8">
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md text-sm font-bold border-2 border-white/30 shadow-lg">
                                <Sprout className="h-4 w-4" />
                                <span>{t('landing.cta.badge')}</span>
                            </div>

                            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                <span className="bg-gradient-to-r from-amber-100 to-yellow-100 bg-clip-text text-transparent">
                                    {t('landing.cta.titleNew')}
                                </span>
                            </h2>

                            <p className="text-xl text-amber-50 max-w-2xl mx-auto leading-relaxed font-medium">
                                {t('landing.cta.description')}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                                <Link to="/tractors">
                                    <Button size="lg" className="h-16 px-10 text-lg bg-white text-amber-800 hover:bg-amber-50 font-bold rounded-xl shadow-2xl hover:shadow-amber-500/50 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto border-2 border-amber-300">
                                        <TractorIcon className="mr-2 h-5 w-5" />
                                        {t('landing.cta.browse')}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button variant="outline" size="lg" className="h-16 px-10 text-lg bg-white/10 border-2 border-white/40 text-white hover:bg-white/20 hover:text-white rounded-xl w-full sm:w-auto backdrop-blur-md font-semibold">
                                        <Users className="mr-2 h-5 w-5" />
                                        {t('landing.cta.createAccount')}
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust indicators */}
                            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/20">
                                <div className="flex items-center gap-2 text-amber-100">
                                    <CheckCircle2 className="h-5 w-5 text-amber-300" />
                                    <span className="text-sm font-medium">{t('landing.cta.verified')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-amber-100">
                                    <Shield className="h-5 w-5 text-amber-300" />
                                    <span className="text-sm font-medium">{t('landing.cta.securePayments')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-amber-100">
                                    <MapPin className="h-5 w-5 text-amber-300" />
                                    <span className="text-sm font-medium">{t('landing.cta.realTimeTracking')}</span>
                                </div>
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
