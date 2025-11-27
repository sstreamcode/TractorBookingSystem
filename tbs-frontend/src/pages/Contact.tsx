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
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-primary/5">
                <div className="absolute inset-0 z-0 opacity-20">
                    <img
                        src="https://images.unsplash.com/photo-1517260739337-6799d239ce83?q=80&w=2000&auto=format&fit=crop"
                        alt="Contact Background"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">{t('nav.contact')}</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        We're here to help. Reach out to us for any questions or support.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-16">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Contact Information */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-secondary mb-4">Get in Touch</h2>
                            <p className="text-lg text-muted-foreground">
                                Have questions about booking a tractor or listing your vehicle? Our team is ready to assist you.
                            </p>
                        </div>

                        <div className="grid gap-6">
                            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm hover:bg-white transition-colors">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <Phone className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Phone</h3>
                                        <p className="text-muted-foreground">+977 9800000000</p>
                                        <p className="text-xs text-muted-foreground">Mon-Fri from 8am to 5pm</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm hover:bg-white transition-colors">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <Mail className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Email</h3>
                                        <p className="text-muted-foreground">info@tractorsewa.com</p>
                                        <p className="text-xs text-muted-foreground">Online support 24/7</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm hover:bg-white transition-colors">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <MapPin className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Headquarters</h3>
                                        <p className="text-muted-foreground">Kathmandu, Nepal</p>
                                        <p className="text-xs text-muted-foreground">Visit us at our office</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <Card className="shadow-lg border-border/50">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-xl">Send us a message</h3>
                            </div>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First name</Label>
                                        <Input id="firstName" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last name</Label>
                                        <Input id="lastName" placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="john@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="How can we help you?"
                                        className="min-h-[150px]"
                                    />
                                </div>
                                <Button className="w-full h-12 text-lg font-medium" size="lg">
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
