import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Shield, Tractor as TractorIcon, Clock, Navigation, Search, Calendar, CreditCard, CheckCircle2, Star } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
            <Navbar />

            {/* Hero Section - Dark Theme */}
            <section className="relative pt-20 md:pt-32 pb-12 md:pb-20 overflow-hidden bg-slate-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 leading-tight">
                            Tractor Booking System
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                            Rent, track, and manage tractors across Nepal with real-time visibility, secure payments, and powerful admin tools.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/tractors" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-10 text-base md:text-lg rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg hover:shadow-xl transition-all duration-300">
                                    Browse Tractors
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="#how" className="w-full sm:w-auto">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-10 text-base md:text-lg rounded-lg border-2 border-slate-600 bg-slate-800/50 text-slate-100 hover:bg-slate-800 hover:text-white font-semibold">
                                    How it works
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 md:py-16 bg-slate-900 border-y border-slate-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-slate-100 mb-2">1,200+</div>
                            <div className="text-sm md:text-base text-slate-400">Active Tractors</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-slate-100 mb-2">25k+</div>
                            <div className="text-sm md:text-base text-slate-400">Bookings Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-slate-100 mb-2">70+</div>
                            <div className="text-sm md:text-base text-slate-400">Districts Covered</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-slate-100 mb-2">4.8/5</div>
                            <div className="text-sm md:text-base text-slate-400">Avg. Rating</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Tractors Section */}
            <section id="browse" className="py-16 md:py-24 bg-slate-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 gap-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-2">Featured Tractors</h2>
                            <p className="text-slate-400 text-base md:text-lg">High-demand models ready to book near you.</p>
                        </div>
                        <Link to="/tractors">
                            <Button variant="outline" className="border-slate-600 text-slate-100 hover:bg-slate-800">
                                See all
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
                                            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1">
                                                <div className="aspect-[4/3] relative overflow-hidden bg-slate-700">
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
                                                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-full">
                                                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                                            <span className="text-xs font-semibold text-slate-100">{tractor.rating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 md:p-5">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="text-lg md:text-xl font-bold text-slate-100 group-hover:text-amber-500 transition-colors">
                                                            {tractor.name}
                                                        </h3>
                                                        <div className="text-lg font-bold text-amber-500">
                                                            NPR {tractor.hourlyRate}/hr
                                                        </div>
                                                    </div>
                                                    {tractor.location && (
                                                        <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                                                            <MapPin className="h-4 w-4" />
                                                            <span>{tractor.location}</span>
                                                        </div>
                                                    )}
                                                    <div className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors flex items-center gap-1">
                                                        View details
                                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <TractorIcon className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                                    <p className="text-slate-400 text-lg">No tractors available at the moment.</p>
                                    <p className="text-slate-500 text-sm mt-2">Check back soon for new listings!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* How it works Section */}
            <section id="how" className="py-16 md:py-24 bg-slate-800/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-3">How it works</h2>
                        <p className="text-slate-400 text-base md:text-lg">From search to payment in a few simple steps.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 max-w-7xl mx-auto">
                        {[
                            {
                                step: "1",
                                title: "Browse & Filter",
                                desc: "Search by location, price, horsepower, and availability.",
                                icon: Search,
                            },
                            {
                                step: "2",
                                title: "Pick a Slot",
                                desc: "Choose date and time that fits your schedule.",
                                icon: Calendar,
                            },
                            {
                                step: "3",
                                title: "Live Tracking",
                                desc: "Follow your tractor in real-time on the map.",
                                icon: Navigation,
                            },
                            {
                                step: "4",
                                title: "Get to Work",
                                desc: "Operator arrives and job starts on time.",
                                icon: TractorIcon,
                            },
                            {
                                step: "5",
                                title: "Easy Payment",
                                desc: "Pay securely via eSewa or cash on delivery.",
                                icon: CreditCard,
                            },
                        ].map((item, index) => (
                            <div key={index} className="relative">
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-amber-500/50 transition-all duration-300 h-full">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-900 font-bold flex items-center justify-center text-lg">
                                            {item.step}
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                                            <item.icon className="h-6 w-6 text-amber-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-100 mb-2">{item.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why choose TBS Section */}
            <section className="py-16 md:py-24 bg-slate-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-3">Why choose TBS?</h2>
                        <p className="text-slate-400 text-base md:text-lg">Built for Nepal's terrain and agriculture needs.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
                        {[
                            {
                                title: "Real-time Tracking",
                                desc: "Live GPS tracking and route visualization for every booking.",
                                icon: Navigation,
                            },
                            {
                                title: "Flexible Payments",
                                desc: "Pay via eSewa or cash on delivery with instant verification.",
                                icon: CreditCard,
                            },
                            {
                                title: "Secure & Transparent",
                                desc: "Verified owners, clear pricing, and protected transactions.",
                                icon: Shield,
                            },
                            {
                                title: "Optimized Operations",
                                desc: "Smart logistics and utilization insights for admins.",
                                icon: TractorIcon,
                            },
                        ].map((feature, index) => (
                            <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                                    <feature.icon className="h-6 w-6 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-100 mb-2">{feature.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24 bg-slate-800/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto bg-slate-800 rounded-2xl p-8 md:p-12 border border-slate-700">
                        <div className="text-center space-y-6">
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-100">Need a tractor this week?</h3>
                            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
                                Check availability in your area and confirm instantly. Operators are vetted and ready to work on schedule.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <Link to="/tractors" className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-10 text-base md:text-lg rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                                        Browse Tractors
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/login" className="w-full sm:w-auto">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-10 text-base md:text-lg rounded-lg border-2 border-slate-600 bg-slate-800/50 text-slate-100 hover:bg-slate-700 hover:text-white">
                                        Sign in
                                    </Button>
                                </Link>
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
