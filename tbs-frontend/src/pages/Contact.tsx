import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const Contact = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-slate-800/50">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img
                        src="https://images.unsplash.com/photo-1517260739337-6799d239ce83?q=80&w=2000&auto=format&fit=crop"
                        alt="Contact Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-amber-500">{t('nav.contact')}</h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        We're here to help. Reach out to us for any questions or support.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Contact Information */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-100 mb-4">Get in Touch</h2>
                            <p className="text-lg text-slate-400">
                                Have questions about booking a tractor or listing your vehicle? Our team is ready to assist you.
                            </p>
                        </div>

                        <div className="grid gap-6">
                            <Card className="border border-slate-700 shadow-md bg-slate-800 backdrop-blur-sm hover:bg-slate-800/80 transition-colors">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="bg-amber-500/10 p-4 rounded-full">
                                        <Phone className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-100">Phone</h3>
                                        <p className="text-slate-400">+977 9800000000</p>
                                        <p className="text-xs text-slate-500">Mon-Fri from 8am to 5pm</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-700 shadow-md bg-slate-800 backdrop-blur-sm hover:bg-slate-800/80 transition-colors">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="bg-amber-500/10 p-4 rounded-full">
                                        <Mail className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-100">Email</h3>
                                        <p className="text-slate-400">info@tractorsewa.com</p>
                                        <p className="text-xs text-slate-500">Online support 24/7</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-700 shadow-md bg-slate-800 backdrop-blur-sm hover:bg-slate-800/80 transition-colors">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="bg-amber-500/10 p-4 rounded-full">
                                        <MapPin className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-slate-100">Headquarters</h3>
                                        <p className="text-slate-400">Kathmandu, Nepal</p>
                                        <p className="text-xs text-slate-500">Visit us at our office</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <Card className="shadow-lg border border-slate-700 bg-slate-800">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <MessageSquare className="h-5 w-5 text-amber-500" />
                                <h3 className="font-semibold text-xl text-slate-100">Send us a message</h3>
                            </div>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-slate-200">First name</Label>
                                        <Input id="firstName" placeholder="John" className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-slate-200">Last name</Label>
                                        <Input id="lastName" placeholder="Doe" className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-200">Email</Label>
                                    <Input id="email" type="email" placeholder="john@example.com" className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-slate-200">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="How can we help you?"
                                        className="min-h-[150px] bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
                                    />
                                </div>
                                <Button className="w-full h-12 text-lg font-medium bg-amber-500 hover:bg-amber-600 text-slate-900" size="lg">
                                    Send Message
                                    <Send className="ml-2 h-4 w-4" />
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Contact;
