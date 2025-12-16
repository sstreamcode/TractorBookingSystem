import { Link } from 'react-router-dom';
import { Tractor, Facebook, Twitter, Instagram, Linkedin, ArrowRight, MapPinIcon, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-100 pt-12 pb-8 border-t border-slate-800">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-900 shadow-lg">
                                <Tractor className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-bold text-slate-100">Tractor Sewa</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                            Empowering farmers with accessible, reliable, and efficient tractor rental services across Nepal.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-amber-500 hover:text-slate-900 transition-all duration-300 border border-slate-700 hover:border-amber-500">
                                    <Icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-slate-100">Quick Links</h4>
                        <ul className="space-y-4">
                            {['Home', 'Tractors', 'About Us', 'Contact', 'Privacy Policy'].map((item) => {
                                const path = item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '')}`;
                                return (
                                    <li key={item}>
                                        <Link to={path} className="text-slate-400 hover:text-amber-500 transition-colors flex items-center gap-2">
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
                        <h4 className="text-lg font-bold mb-6 text-slate-100">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-400">
                                <MapPinIcon className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
                                <span>123 Farming Lane, Agriculture District, Nepal</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <Phone className="h-5 w-5 text-amber-500 shrink-0" />
                                <span>+977 9800000000</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <Mail className="h-5 w-5 text-amber-500 shrink-0" />
                                <span>info@tractorsewa.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-slate-100">Newsletter</h4>
                        <p className="text-slate-400 mb-4">Subscribe to get the latest updates and offers.</p>
                        <div className="space-y-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full h-12 px-4 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-500 text-slate-100"
                            />
                            <Button className="w-full h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 border-0 shadow-lg">Subscribe</Button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                    <p>&copy; {new Date().getFullYear()} Tractor Booking System. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="#" className="hover:text-amber-500 transition-colors">Privacy</Link>
                        <Link to="/about" className="hover:text-amber-500 transition-colors">About</Link>
                        <Link to="/contact" className="hover:text-amber-500 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
