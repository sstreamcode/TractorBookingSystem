import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle2, Users, TrendingUp, Shield, Target, Award, Globe, Clock, Heart, Zap, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const About = () => {
    const { t } = useLanguage();

    const values = [
        {
            icon: Shield,
            title: t('about.values.trust.title'),
            description: t('about.values.trust.desc'),
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            icon: Users,
            title: t('about.values.community.title'),
            description: t('about.values.community.desc'),
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
        },
        {
            icon: TrendingUp,
            title: t('about.values.innovation.title'),
            description: t('about.values.innovation.desc'),
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
        {
            icon: CheckCircle2,
            title: t('about.values.quality.title'),
            description: t('about.values.quality.desc'),
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
        },
    ];

    const milestones = [
        { year: '2020', title: t('about.journey.2020'), description: t('about.journey.2020.desc') },
        { year: '2021', title: t('about.journey.2021'), description: t('about.journey.2021.desc') },
        { year: '2022', title: t('about.journey.2022'), description: t('about.journey.2022.desc') },
        { year: '2023', title: t('about.journey.2023'), description: t('about.journey.2023.desc') },
        { year: '2024', title: t('about.journey.2024'), description: t('about.journey.2024.desc') },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-background">
                <div className="absolute inset-0 z-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-2xl mb-6 border border-amber-500/20">
                        <Target className="h-10 w-10 text-amber-500" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-foreground leading-tight">
                        {t('about.hero.title')}
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        {t('about.hero.subtitle')}
                    </p>
                </div>
            </section>

            {/* Mission & Vision Section */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        <Card className="border border-border bg-card hover:border-amber-500/50 transition-all">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-amber-500/10 rounded-xl">
                                        <Target className="h-8 w-8 text-amber-500" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-foreground">{t('about.mission.title')}</h2>
                                </div>
                                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                                    {t('about.mission.desc1')}
                                </p>
                                <p className="text-base text-muted-foreground leading-relaxed">
                                    {t('about.mission.desc2')}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-border bg-card hover:border-emerald-500/50 transition-all">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                                        <Zap className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-foreground">{t('about.vision.title')}</h2>
                                </div>
                                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                                    {t('about.vision.desc1')}
                                </p>
                                <p className="text-base text-muted-foreground leading-relaxed">
                                    {t('about.vision.desc2')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="py-20 bg-secondary/50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{t('about.values.title')}</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {t('about.values.subtitle')}
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {values.map((value, index) => (
                            <Card key={index} className="border border-border bg-card hover:border-amber-500/50 transition-all hover:-translate-y-2">
                                <CardContent className="p-6 text-center">
                                    <div className={`inline-flex items-center justify-center p-4 ${value.bgColor} rounded-xl mb-4`}>
                                        <value.icon className={`h-8 w-8 ${value.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">{value.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact/Stats Section */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{t('about.impact.title')}</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {t('about.impact.subtitle')}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        <Card className="border border-border bg-card text-center hover:border-amber-500/50 transition-all">
                            <CardContent className="p-8">
                                <div className="text-5xl font-extrabold text-amber-500 mb-2">1,200+</div>
                                <div className="text-foreground font-medium">{t('about.impact.tractors')}</div>
                                <div className="text-sm text-muted-foreground mt-1">{t('about.impact.tractors.desc')}</div>
                            </CardContent>
                        </Card>
                        <Card className="border border-border bg-card text-center hover:border-emerald-500/50 transition-all">
                            <CardContent className="p-8">
                                <div className="text-5xl font-extrabold text-emerald-500 mb-2">25k+</div>
                                <div className="text-foreground font-medium">{t('about.impact.bookings')}</div>
                                <div className="text-sm text-muted-foreground mt-1">{t('about.impact.bookings.desc')}</div>
                            </CardContent>
                        </Card>
                        <Card className="border border-border bg-card text-center hover:border-blue-500/50 transition-all">
                            <CardContent className="p-8">
                                <div className="text-5xl font-extrabold text-blue-500 mb-2">70+</div>
                                <div className="text-foreground font-medium">{t('about.impact.districts')}</div>
                                <div className="text-sm text-muted-foreground mt-1">{t('about.impact.districts.desc')}</div>
                            </CardContent>
                        </Card>
                        <Card className="border border-border bg-card text-center hover:border-purple-500/50 transition-all">
                            <CardContent className="p-8">
                                <div className="text-5xl font-extrabold text-purple-500 mb-2">4.8/5</div>
                                <div className="text-foreground font-medium">{t('about.impact.rating')}</div>
                                <div className="text-sm text-muted-foreground mt-1">{t('about.impact.rating.desc')}</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Journey/Timeline Section */}
            <section className="py-20 bg-secondary/50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{t('about.journey.title')}</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {t('about.journey.subtitle')}
                        </p>
                    </div>
                    <div className="max-w-4xl mx-auto">
                        <div className="relative">
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
                            <div className="space-y-12">
                                {milestones.map((milestone, index) => (
                                    <div key={index} className="relative flex items-start gap-6">
                                        <div className="relative z-10 flex-shrink-0">
                                            <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-xs font-bold text-amber-500">{milestone.year}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <Card className="flex-1 border border-border bg-card hover:border-amber-500/50 transition-all">
                                            <CardContent className="p-6">
                                                <h3 className="text-xl font-bold text-foreground mb-2">{milestone.title}</h3>
                                                <p className="text-muted-foreground">{milestone.description}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{t('about.why.title')}</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {t('about.why.subtitle')}
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <Card className="border border-border bg-card hover:border-amber-500/50 transition-all">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-amber-500/10 rounded-xl">
                                        <Globe className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">{t('about.why.network.title')}</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t('about.why.network.desc')}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-border bg-card hover:border-emerald-500/50 transition-all">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                                        <Clock className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">{t('about.why.tracking.title')}</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t('about.why.tracking.desc')}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-border bg-card hover:border-blue-500/50 transition-all">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <Award className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">{t('about.why.verified.title')}</h3>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t('about.why.verified.desc')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
                <div className="container mx-auto px-4">
                    <Card className="border border-amber-500/30 bg-card/80 backdrop-blur-sm max-w-4xl mx-auto">
                        <CardContent className="p-12 text-center">
                            <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-full mb-6">
                                <Heart className="h-10 w-10 text-amber-500" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                                {t('about.cta.title')}
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                                {t('about.cta.desc')}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/tractors">
                                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8">
                                        {t('about.cta.browse')}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/contact">
                                    <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted px-8">
                                        {t('about.cta.contact')}
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
