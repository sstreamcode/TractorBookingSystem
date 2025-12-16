import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Contact = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate form submission
        setTimeout(() => {
            toast.success(t('contact.form.success'));
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
            });
            setIsSubmitting(false);
        }, 1000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const contactMethods = [
        {
            icon: Phone,
            title: t('contact.phone'),
            content: t('contact.phone.number'),
            subtitle: t('contact.phone.hours'),
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
        },
        {
            icon: Mail,
            title: t('contact.email'),
            content: t('contact.email.address'),
            subtitle: t('contact.email.support'),
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
        },
        {
            icon: MapPin,
            title: t('contact.address'),
            content: t('contact.address.location'),
            subtitle: t('contact.address.visit'),
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
    ];

    const faqs = [
        {
            question: t('contact.faq.q1'),
            answer: t('contact.faq.a1'),
        },
        {
            question: t('contact.faq.q2'),
            answer: t('contact.faq.a2'),
        },
        {
            question: t('contact.faq.q3'),
            answer: t('contact.faq.a3'),
        },
        {
            question: t('contact.faq.q4'),
            answer: t('contact.faq.a4'),
        },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-background">
                <div className="absolute inset-0 z-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-2xl mb-6 border border-amber-500/20">
                        <MessageSquare className="h-10 w-10 text-amber-500" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-foreground leading-tight">
                        {t('contact.hero.title')}
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        {t('contact.hero.subtitle')}
                    </p>
                </div>
            </section>

            {/* Contact Methods */}
            <section className="py-16 bg-background">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
                        {contactMethods.map((method, index) => (
                            <Card key={index} className="border border-border bg-card hover:border-amber-500/50 transition-all hover:-translate-y-1">
                                <CardContent className="p-6 text-center">
                                    <div className={`inline-flex items-center justify-center p-4 ${method.bgColor} rounded-xl mb-4`}>
                                        <method.icon className={`h-8 w-8 ${method.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">{method.title}</h3>
                                    <p className="text-foreground font-medium mb-1">{method.content}</p>
                                    <p className="text-sm text-muted-foreground">{method.subtitle}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* Contact Form */}
                        <Card className="border border-border bg-card shadow-xl">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-lg">
                                        <Send className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-foreground">{t('contact.form.title')}</CardTitle>
                                </div>
                                <p className="text-muted-foreground mt-2">{t('contact.form.subtitle')}</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-foreground font-medium">{t('contact.form.firstName')}</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                placeholder="John"
                                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-foreground font-medium">{t('contact.form.lastName')}</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                placeholder="Doe"
                                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-foreground font-medium">{t('contact.form.email')}</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="john@example.com"
                                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-foreground font-medium">{t('contact.form.phone')}</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+977 9800000000"
                                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject" className="text-foreground font-medium">{t('contact.form.subject')}</Label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder={t('contact.form.subject.placeholder')}
                                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message" className="text-foreground font-medium">{t('contact.form.message')}</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder={t('contact.form.message.placeholder')}
                                            className="min-h-[150px] bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-amber-500 resize-none"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-slate-900"
                                        size="lg"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="animate-spin mr-2">⏳</span>
                                                {t('contact.form.sending')}
                                            </>
                                        ) : (
                                            <>
                                                {t('contact.form.send')}
                                                <Send className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Business Hours & FAQ */}
                        <div className="space-y-6">
                            <Card className="border border-border bg-card">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Clock className="h-6 w-6 text-blue-500" />
                                        </div>
                                        <CardTitle className="text-xl font-bold text-foreground">{t('contact.hours.title')}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-border">
                                        <span className="text-foreground font-medium">{t('contact.hours.weekday')}</span>
                                        <span className="text-muted-foreground">{t('contact.hours.weekday.time')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border">
                                        <span className="text-foreground font-medium">{t('contact.hours.saturday')}</span>
                                        <span className="text-muted-foreground">{t('contact.hours.saturday.time')}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-foreground font-medium">{t('contact.hours.sunday')}</span>
                                        <span className="text-muted-foreground">{t('contact.hours.sunday.time')}</span>
                                    </div>
                                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                        <p className="text-sm text-emerald-400 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            {t('contact.hours.email24')}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-border bg-card">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <HelpCircle className="h-6 w-6 text-purple-500" />
                                        </div>
                                        <CardTitle className="text-xl font-bold text-foreground">{t('contact.faq.title')}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {faqs.map((faq, index) => (
                                        <div key={index} className="pb-4 border-b border-border last:border-0 last:pb-0">
                                            <h4 className="text-foreground font-semibold mb-2">{faq.question}</h4>
                                            <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Additional Info Section */}
            <section className="py-16 bg-secondary/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-full mb-6">
                            <Globe className="h-8 w-8 text-amber-500" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-foreground">{t('contact.help.title')}</h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                            {t('contact.help.desc')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="px-4 py-2 bg-card border border-border rounded-lg">
                                <span className="text-foreground text-sm">{t('contact.help.response')} </span>
                                <span className="text-amber-500 font-semibold">{t('contact.help.response.time')}</span>
                            </div>
                            <div className="px-4 py-2 bg-card border border-border rounded-lg">
                                <span className="text-foreground text-sm">{t('contact.help.languages')} </span>
                                <span className="text-amber-500 font-semibold">{t('contact.help.languages.list')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Contact;
