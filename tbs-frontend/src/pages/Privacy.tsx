import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Lock, Eye, FileText, Database, UserCheck, Globe, AlertCircle, Mail, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Privacy = () => {
    const { t } = useLanguage();

    const sections = [
        {
            icon: FileText,
            title: t('privacy.section.collection.title'),
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            content: [
                t('privacy.section.collection.p1'),
                t('privacy.section.collection.p2'),
                t('privacy.section.collection.p3'),
                t('privacy.section.collection.p4'),
                t('privacy.section.collection.p5'),
                t('privacy.section.collection.p6'),
                t('privacy.section.collection.p7'),
                t('privacy.section.collection.p8'),
                t('privacy.section.collection.p9'),
                t('privacy.section.collection.p10'),
                t('privacy.section.collection.p11'),
                t('privacy.section.collection.p12'),
                t('privacy.section.collection.p13'),
            ],
        },
        {
            icon: Eye,
            title: t('privacy.section.use.title'),
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            content: [
                t('privacy.section.use.p1'),
                t('privacy.section.use.p2'),
                t('privacy.section.use.p3'),
                t('privacy.section.use.p4'),
                t('privacy.section.use.p5'),
                t('privacy.section.use.p6'),
                t('privacy.section.use.p7'),
                t('privacy.section.use.p8'),
                t('privacy.section.use.p9'),
                t('privacy.section.use.p10'),
                t('privacy.section.use.p11'),
            ],
        },
        {
            icon: Lock,
            title: t('privacy.section.security.title'),
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            content: [
                t('privacy.section.security.p1'),
                t('privacy.section.security.p2'),
                t('privacy.section.security.p3'),
                t('privacy.section.security.p4'),
                t('privacy.section.security.p5'),
                t('privacy.section.security.p6'),
                t('privacy.section.security.p7'),
                t('privacy.section.security.p8'),
            ],
        },
        {
            icon: Database,
            title: t('privacy.section.storage.title'),
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
            content: [
                t('privacy.section.storage.p1'),
                t('privacy.section.storage.p2'),
                t('privacy.section.storage.p3'),
                t('privacy.section.storage.p4'),
                t('privacy.section.storage.p5'),
                t('privacy.section.storage.p6'),
                t('privacy.section.storage.p7'),
                t('privacy.section.storage.p8'),
                t('privacy.section.storage.p9'),
                t('privacy.section.storage.p10'),
                t('privacy.section.storage.p11'),
            ],
        },
        {
            icon: UserCheck,
            title: t('privacy.section.rights.title'),
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            content: [
                t('privacy.section.rights.p1'),
                t('privacy.section.rights.p2'),
                t('privacy.section.rights.p3'),
                t('privacy.section.rights.p4'),
                t('privacy.section.rights.p5'),
                t('privacy.section.rights.p6'),
                t('privacy.section.rights.p7'),
                t('privacy.section.rights.p8'),
                t('privacy.section.rights.p9'),
                t('privacy.section.rights.p10'),
            ],
        },
        {
            icon: Globe,
            title: t('privacy.section.thirdparty.title'),
            color: 'text-cyan-500',
            bgColor: 'bg-cyan-500/10',
            content: [
                t('privacy.section.thirdparty.p1'),
                t('privacy.section.thirdparty.p2'),
                t('privacy.section.thirdparty.p3'),
                t('privacy.section.thirdparty.p4'),
                t('privacy.section.thirdparty.p5'),
                t('privacy.section.thirdparty.p6'),
                t('privacy.section.thirdparty.p7'),
                t('privacy.section.thirdparty.p8'),
            ],
        },
        {
            icon: AlertCircle,
            title: t('privacy.section.cookies.title'),
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            content: [
                t('privacy.section.cookies.p1'),
                t('privacy.section.cookies.p2'),
                t('privacy.section.cookies.p3'),
                t('privacy.section.cookies.p4'),
                t('privacy.section.cookies.p5'),
                t('privacy.section.cookies.p6'),
                t('privacy.section.cookies.p7'),
            ],
        },
        {
            icon: Shield,
            title: t('privacy.section.children.title'),
            color: 'text-pink-500',
            bgColor: 'bg-pink-500/10',
            content: [
                t('privacy.section.children.p1'),
                t('privacy.section.children.p2'),
                t('privacy.section.children.p3'),
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
            <Navbar />

            {/* Header Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0 z-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-2xl mb-6 border border-amber-500/20">
                        <Shield className="h-10 w-10 text-amber-500" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-slate-100 leading-tight">
                        {t('privacy.hero.title')}
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-6">
                        {t('privacy.hero.subtitle')}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{t('privacy.hero.lastUpdated')} {t('privacy.hero.december2024')}</span>
                        </div>
                        <span>•</span>
                        <span>{t('privacy.hero.effectiveDate')} {t('privacy.hero.january2024')}</span>
                    </div>
                </div>
            </section>

            {/* Quick Summary */}
            <section className="py-12 bg-slate-800/50 border-y border-slate-800">
                <div className="container mx-auto px-4">
                    <Card className="border border-amber-500/30 bg-slate-800/80 max-w-4xl mx-auto">
                        <CardContent className="p-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-3">{t('privacy.summary.title')}</h3>
                                    <ul className="space-y-2 text-slate-300">
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-1">•</span>
                                            <span>{t('privacy.summary.p1')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-1">•</span>
                                            <span>{t('privacy.summary.p2')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-1">•</span>
                                            <span>{t('privacy.summary.p3')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-1">•</span>
                                            <span>{t('privacy.summary.p4')}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 bg-slate-900">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <Card key={index} className="border border-slate-700 bg-slate-800 hover:border-amber-500/30 transition-all">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 ${section.bgColor} rounded-xl`}>
                                            <section.icon className={`h-6 w-6 ${section.color}`} />
                                        </div>
                                        <CardTitle className="text-2xl font-bold text-slate-100">
                                            {index + 1}. {section.title}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-16">
                                    <div className="space-y-3">
                                        {section.content.map((paragraph, pIndex) => (
                                            <p
                                                key={pIndex}
                                                className={`leading-relaxed ${
                                                    paragraph.startsWith('•') || paragraph.startsWith('-')
                                                        ? 'text-slate-300 ml-4'
                                                        : paragraph === ''
                                                        ? 'h-4'
                                                        : 'text-slate-400'
                                                }`}
                                            >
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Changes to Policy */}
            <section className="py-16 bg-slate-800/50">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Card className="border border-slate-700 bg-slate-800">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <FileText className="h-6 w-6 text-blue-500" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-slate-100">{t('privacy.changes.title')}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pl-16">
                            <p className="text-slate-400 leading-relaxed mb-4">
                                {t('privacy.changes.p1')}
                            </p>
                            <ul className="space-y-2 text-slate-300 ml-4">
                                <li>• {t('privacy.changes.p2')}</li>
                                <li>• {t('privacy.changes.p3')}</li>
                                <li>• {t('privacy.changes.p4')}</li>
                            </ul>
                            <p className="text-slate-400 leading-relaxed mt-4">
                                {t('privacy.changes.p6')}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-16 bg-slate-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Card className="border border-amber-500/30 bg-gradient-to-br from-slate-800 to-slate-900">
                        <CardContent className="p-12 text-center">
                            <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-full mb-6">
                                <Mail className="h-10 w-10 text-amber-500" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4 text-slate-100">{t('privacy.contact.title')}</h2>
                            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                                {t('privacy.contact.desc')}
                            </p>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-center gap-3 text-slate-200">
                                    <Mail className="h-5 w-5 text-amber-500" />
                                    <a href={`mailto:${t('privacy.contact.email1')}`} className="text-amber-500 hover:text-amber-400 hover:underline font-medium">
                                        {t('privacy.contact.email1')}
                                    </a>
                                </div>
                                <div className="flex items-center justify-center gap-3 text-slate-200">
                                    <Mail className="h-5 w-5 text-amber-500" />
                                    <a href={`mailto:${t('privacy.contact.email2')}`} className="text-amber-500 hover:text-amber-400 hover:underline font-medium">
                                        {t('privacy.contact.email2')}
                                    </a>
                                </div>
                            </div>
                            <Link to="/contact">
                                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8">
                                    {t('privacy.contact.button')}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Privacy;
