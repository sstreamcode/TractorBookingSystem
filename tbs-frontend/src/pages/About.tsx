import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle2, Users, TrendingUp, Shield } from 'lucide-react';

const About = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-primary/5">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img
                        src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2000&auto=format&fit=crop"
                        alt="Agriculture Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">{t('nav.about')}</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Revolutionizing agriculture in Nepal through accessible technology and shared resources.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-secondary">Our Mission</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Welcome to Tractor Sewa, Nepal's premier tractor rental platform. Our mission is to mechanize agriculture in Nepal by making tractors accessible to every farmer.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                We connect tractor owners with farmers, ensuring fair prices and reliable service. With real-time tracking and secure payments, we bring trust and efficiency to agricultural logistics.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50 p-6 rounded-2xl text-center">
                                <Users className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                                <h3 className="font-bold text-lg text-emerald-900">Community</h3>
                                <p className="text-emerald-700">Connecting farmers</p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-2xl text-center">
                                <Shield className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                                <h3 className="font-bold text-lg text-blue-900">Trust</h3>
                                <p className="text-blue-700">Secure & Reliable</p>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-2xl text-center">
                                <TrendingUp className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                                <h3 className="font-bold text-lg text-purple-900">Growth</h3>
                                <p className="text-purple-700">Boosting Yields</p>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-2xl text-center">
                                <CheckCircle2 className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                                <h3 className="font-bold text-lg text-orange-900">Quality</h3>
                                <p className="text-orange-700">Verified Fleet</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats/Impact Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-12 text-secondary">Our Impact</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-4xl font-bold text-primary mb-2">500+</div>
                            <div className="text-muted-foreground">Active Tractors</div>
                        </div>
                        <div className="p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-4xl font-bold text-primary mb-2">10k+</div>
                            <div className="text-muted-foreground">Farmers Served</div>
                        </div>
                        <div className="p-8 bg-white rounded-2xl shadow-sm">
                            <div className="text-4xl font-bold text-primary mb-2">77</div>
                            <div className="text-muted-foreground">Districts Covered</div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
