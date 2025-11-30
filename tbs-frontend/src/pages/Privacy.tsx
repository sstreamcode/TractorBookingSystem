import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
            <Navbar />

            {/* Header Section */}
            <section className="relative pt-32 pb-16 bg-slate-800/50">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 rounded-full mb-6">
                        <Shield className="h-8 w-8 text-amber-500" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">{t('nav.privacy')}</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        We are committed to protecting your privacy and ensuring your data is secure.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="grid gap-8">
                    <Card className="border border-slate-700 shadow-sm bg-slate-800">
                        <CardContent className="p-8 space-y-8">
                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <FileText className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-slate-100">1. Information Collection</h2>
                                </div>
                                <p className="text-slate-400 leading-relaxed pl-12">
                                    We collect information you provide directly to us, such as when you create an account, book a tractor, or contact us for support. This may include your name, email address, phone number, and location data necessary for service delivery.
                                </p>
                            </section>

                            <div className="h-px bg-slate-700/50" />

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Eye className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-slate-100">2. Use of Information</h2>
                                </div>
                                <p className="text-slate-400 leading-relaxed pl-12">
                                    We use the information we collect to provide, maintain, and improve our services, including to process transactions, send you related information, and verify your identity. We also use this data to improve our platform's safety and security.
                                </p>
                            </section>

                            <div className="h-px bg-slate-700/50" />

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Lock className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-slate-100">3. Data Security</h2>
                                </div>
                                <p className="text-slate-400 leading-relaxed pl-12">
                                    We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction. We use industry-standard encryption and security protocols.
                                </p>
                            </section>

                            <div className="h-px bg-slate-700/50" />

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <Shield className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-slate-100">4. Contact Us</h2>
                                </div>
                                <p className="text-slate-400 leading-relaxed pl-12">
                                    If you have any questions about this Privacy Policy, please contact us at <a href="mailto:info@tractorsewa.com" className="text-amber-500 hover:text-amber-400 hover:underline">info@tractorsewa.com</a>.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Privacy;
