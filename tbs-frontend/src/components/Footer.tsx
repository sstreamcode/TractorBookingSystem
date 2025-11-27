import { Link } from 'react-router-dom';
import { Tractor, Facebook, Twitter, Instagram, Linkedin, ArrowRight, MapPinIcon, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
    return (
        <footer className="bg-[#0A0F1C] text-white pt-20 pb-10 border-t border-white/5">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                                <Tractor className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-bold">Tractor Sewa</span>
                        </div>
                        <p className="text-white/60 leading-relaxed">
                            Empowering farmers with accessible, reliable, and efficient tractor rental services across Nepal.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300">
                                    <Icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            {['Home', 'Tractors', 'About Us', 'Contact', 'Privacy Policy'].map((item) => {
                                const path = item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '')}`;
                                return (
                                    <li key={item}>
                                        <Link to={path} className="text-white/60 hover:text-primary transition-colors flex items-center gap-2">
                                            <ArrowRight className="h-4 w-4" />
                                            {item}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-white/60">
                                <MapPinIcon className="h-5 w-5 text-primary shrink-0 mt-1" />
                                <span>123 Farming Lane, Agriculture District, Nepal</span>
                            </li>
                            <li className="flex items-center gap-3 text-white/60">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <span>+977 9800000000</span>
                            </li>
                            <li className="flex items-center gap-3 text-white/60">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <span>info@tractorsewa.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Newsletter</h4>
                        <p className="text-white/60 mb-4">Subscribe to get the latest updates and offers.</p>
                        <div className="space-y-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/30"
                            />
                            <Button className="w-full h-12 rounded-xl font-bold">Subscribe</Button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
                    <p>&copy; {new Date().getFullYear()} Tractor Sewa. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link to="#" className="hover:text-white transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
