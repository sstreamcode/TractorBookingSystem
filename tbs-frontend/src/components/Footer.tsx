import { Link } from 'react-router-dom';
import { Tractor, Facebook, Twitter, Instagram, Linkedin, ArrowRight, MapPinIcon, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();
    
    return (
        <footer className="bg-background text-foreground pt-12 pb-8 border-t border-border dark:bg-slate-900 dark:text-slate-100">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-900 shadow-lg">
                                <Tractor className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-bold text-foreground dark:text-slate-100">Tractor Sewa</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed dark:text-slate-400">
                            {t('footer.description')}
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a 
                                    key={i} 
                                    href="#" 
                                    className="h-10 w-10 rounded-full bg-muted dark:bg-slate-800 flex items-center justify-center hover:bg-amber-500 hover:text-slate-900 transition-all duration-300 border border-border dark:border-slate-700 hover:border-amber-500 text-foreground dark:text-slate-400"
                                >
                                    <Icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-foreground dark:text-slate-100">{t('footer.quickLinks')}</h4>
                        <ul className="space-y-4">
                            {[
                                { labelKey: 'footer.link.home', path: '/' },
                                { labelKey: 'footer.link.tractors', path: '/tractors' },
                                { labelKey: 'footer.link.about', path: '/about' },
                                { labelKey: 'footer.link.contact', path: '/contact' },
                                { labelKey: 'footer.link.privacy', path: '/privacy' }
                            ].map((item) => (
                                <li key={item.path}>
                                    <Link 
                                        to={item.path} 
                                        className="text-muted-foreground dark:text-slate-400 hover:text-amber-500 transition-colors flex items-center gap-2"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                        {t(item.labelKey)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-foreground dark:text-slate-100">{t('footer.contactUs')}</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-muted-foreground dark:text-slate-400">
                                <MapPinIcon className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
                                <span>{t('footer.address')}</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground dark:text-slate-400">
                                <Phone className="h-5 w-5 text-amber-500 shrink-0" />
                                <span>{t('footer.phone')}</span>
                            </li>
                            <li className="flex items-center gap-3 text-muted-foreground dark:text-slate-400">
                                <Mail className="h-5 w-5 text-amber-500 shrink-0" />
                                <span>{t('footer.email')}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-foreground dark:text-slate-100">{t('footer.newsletter')}</h4>
                        <p className="text-muted-foreground dark:text-slate-400 mb-4">{t('footer.newsletterDesc')}</p>
                        <div className="space-y-3">
                            <input
                                type="email"
                                placeholder={t('footer.emailPlaceholder')}
                                className="w-full h-12 px-4 rounded-xl bg-muted dark:bg-slate-800 border border-border dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-muted-foreground dark:placeholder:text-slate-500 text-foreground dark:text-slate-100"
                            />
                            <Button className="w-full h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 border-0 shadow-lg">{t('footer.subscribe')}</Button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-border dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground dark:text-slate-400">
                    <p>{t('footer.copyright').replace('{year}', new Date().getFullYear().toString())}</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="hover:text-amber-500 transition-colors">{t('footer.privacy')}</Link>
                        <Link to="/about" className="hover:text-amber-500 transition-colors">{t('footer.about')}</Link>
                        <Link to="/contact" className="hover:text-amber-500 transition-colors">{t('footer.contact')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
