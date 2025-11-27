import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar />

            {/* Header Section */}
            <section className="relative pt-32 pb-16 bg-gradient-to-b from-primary/10 to-transparent">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-secondary">{t('nav.privacy')}</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        We are committed to protecting your privacy and ensuring your data is secure.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="grid gap-8">
                    <Card className="border-none shadow-sm bg-card/50">
                        <CardContent className="p-8 space-y-8">
                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-secondary">1. Information Collection</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed pl-12">
                                    We collect information you provide directly to us, such as when you create an account, book a tractor, or contact us for support. This may include your name, email address, phone number, and location data necessary for service delivery.
                                </p>
                            </section>

                            <div className="h-px bg-border/50" />

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <Eye className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-secondary">2. Use of Information</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed pl-12">
                                    We use the information we collect to provide, maintain, and improve our services, including to process transactions, send you related information, and verify your identity. We also use this data to improve our platform's safety and security.
                                </p>
                            </section>

                            <div className="h-px bg-border/50" />

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Lock className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-secondary">3. Data Security</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed pl-12">
                                    We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction. We use industry-standard encryption and security protocols.
                                </p>
                            </section>

                            <div className="h-px bg-border/50" />

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Shield className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-secondary">4. Contact Us</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed pl-12">
                                    If you have any questions about this Privacy Policy, please contact us at <a href="mailto:info@tractorsewa.com" className="text-primary hover:underline">info@tractorsewa.com</a>.
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
