import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Tractor, LogOut, LayoutDashboard, UserCircle, Menu, BarChart3, Map, Compass, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type NavItem =
  | {
      labelKey: string;
      href: string;
      icon?: LucideIcon;
      type: 'route';
    }
  | {
      labelKey: string;
      href: string;
      icon?: LucideIcon;
      type: 'anchor';
    };

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.platform', href: '/#platform', icon: Compass, type: 'anchor' },
  { labelKey: 'nav.fleet', href: '/tractors', icon: Map, type: 'route' },
  { labelKey: 'nav.insights', href: '/#insights', icon: BarChart3, type: 'anchor' },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activePath = useMemo(() => location.pathname, [location.pathname]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const isEnglish = language === 'en';
  const languageLabel = isEnglish ? 'EN' : 'NEP';
  const languageFlag = isEnglish ? '🇬🇧' : '🇳🇵';

  const LanguageToggleButton = () => (
    <button
      type="button"
      onClick={toggleLanguage}
      title={isEnglish ? 'Switch to Nepali' : 'Switch to English'}
      className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-transparent px-2.5 py-1.5 transition-all duration-200 hover:border-primary/40 hover:bg-muted/50"
    >
      <Globe className="h-4 w-4 text-secondary/70" />
      <span className="text-sm font-semibold text-secondary">{languageLabel}</span>
    </button>
  );

  const UserAvatarMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full border border-border/70 p-1.5 shadow-sm transition-all duration-200 hover:border-primary/50 hover:bg-primary/5">
          <Avatar className="h-9 w-9 ring-2 ring-primary/10">
            <AvatarImage src={user?.profilePictureUrl} alt={user?.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-cyan-500 text-white text-sm font-bold">
              {getInitials(user?.name || 'U')}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-secondary">{user?.name}</p>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? t('nav.administrator') : t('nav.customer')}
          </p>
          {user?.email && <p className="text-xs text-muted-foreground mt-1">{user.email}</p>}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
          <UserCircle className="mr-2 h-4 w-4" />
          {t('nav.profileSettings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogoutClick} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          {t('nav.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border/60 shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo Section - Left */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-emerald-500 to-cyan-500 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <Tractor className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-tight text-secondary group-hover:text-primary transition-colors">
              Tractor Sewa
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground leading-tight font-medium">
              {t('brand.subtitle')}
            </span>
          </div>
        </Link>

        {/* Navigation Section - Center */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {/* Show navigation items only for non-admin users */}
          {!isAdmin && NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const baseClasses =
              'group flex items-center gap-2 text-sm font-semibold transition-all duration-300 px-4 py-2 rounded-xl';

            if (item.type === 'anchor') {
              return (
                <a
                  key={item.labelKey}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`${baseClasses} text-secondary/70 hover:text-secondary hover:bg-primary/5 hover:shadow-sm`}
                >
                  {Icon && <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />}
                  {t(item.labelKey)}
                </a>
              );
            }

            return (
              <Link
                key={item.labelKey}
                to={item.href}
                onClick={handleLinkClick}
                className={`${baseClasses} ${
                  activePath === item.href 
                    ? 'text-primary bg-primary/10 shadow-sm' 
                    : 'text-secondary/70 hover:text-secondary hover:bg-primary/5 hover:shadow-sm'
                }`}
              >
                {Icon && <Icon className={`h-4 w-4 transition-colors ${activePath === item.href ? 'text-primary' : 'text-primary/70 group-hover:text-primary'}`} />}
                {t(item.labelKey)}
              </Link>
            );
          })}

          {/* Show My Bookings only for regular users */}
          {isAuthenticated && !isAdmin && (
            <Link
              to="/dashboard"
              className={`text-sm font-medium px-2 py-1 rounded-md transition-colors duration-200 ${
                activePath === '/dashboard' 
                  ? 'text-secondary bg-primary/5' 
                  : 'text-secondary/70 hover:text-secondary hover:bg-muted/50'
              }`}
            >
              {t('nav.myBookings')}
            </Link>
          )}

          {/* Show Admin Panel only for admins */}
          {isAuthenticated && isAdmin && (
            <Link
              to="/admin/dashboard"
              className={`group flex items-center gap-2 text-sm font-semibold transition-all duration-300 px-4 py-2 rounded-xl ${
                activePath === '/admin/dashboard'
                  ? 'text-primary bg-primary/10 shadow-sm'
                  : 'text-primary/80 hover:text-primary hover:bg-primary/5'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('nav.adminPanel')}
            </Link>
          )}
        </div>

        {/* User Actions Section - Right */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {/* Show Book Tractor button only for non-admin users - placed before user profile */}
          {!isAdmin && (
            <Link to="/tractors">
              <Button 
                size="default" 
                className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-bold px-6 py-2.5 rounded-xl hover:scale-105"
              >
                <Tractor className="mr-2 h-4 w-4" />
                {t('nav.bookTractor')}
              </Button>
            </Link>
          )}
          
          {/* User Profile - Rightmost position */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <UserAvatarMenu />
              <LanguageToggleButton />
            </div>
          ) : (
            <>
              <Link to="/register">
                <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {t('nav.createAccount')}
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="sm" className="text-secondary/80 hover:text-secondary border-border">
                  {t('nav.login')}
                </Button>
              </Link>
              <LanguageToggleButton />
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          {/* Show Book Tractor button only for non-admin users */}
          {!isAdmin && (
            <Link to="/tractors">
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-white shadow-md font-medium rounded-lg px-4"
              >
                <Tractor className="mr-1.5 h-3.5 w-3.5" />
                Book
              </Button>
            </Link>
          )}
          {isAuthenticated && <UserAvatarMenu />}
          <LanguageToggleButton />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="rounded-lg border border-border bg-white p-2 text-secondary shadow-sm transition-all hover:shadow-md hover:border-primary/30 focus:outline-none">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-96">
              <SheetHeader className="text-left pb-4 border-b border-border">
                <SheetTitle className="text-xl font-semibold text-secondary">
                  Navigation
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Show navigation items only for non-admin users */}
                {!isAdmin && (
                  <div className="grid gap-2">
                {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActiveRoute = item.type === 'route' && activePath === item.href;
                      const baseClass =
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition';

                      if (item.type === 'anchor') {
                        return (
                          <a
                            key={item.labelKey}
                            href={item.href}
                            onClick={handleLinkClick}
                            className={`${baseClass} ${
                              isActiveRoute ? 'bg-primary/10 text-secondary' : 'hover:bg-muted text-secondary/70'
                            }`}
                          >
                            {Icon && <Icon className="h-4 w-4 text-primary" />}
                            {t(item.labelKey)}
                          </a>
                        );
                      }

                      return (
                        <Link
                          key={item.labelKey}
                          to={item.href}
                          onClick={handleLinkClick}
                          className={`${baseClass} ${
                            isActiveRoute ? 'bg-primary/10 text-secondary' : 'hover:bg-muted text-secondary/70'
                          }`}
                        >
                          {Icon && <Icon className="h-4 w-4 text-primary" />}
                          {t(item.labelKey)}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="grid gap-2">
                    <Link to="/register" onClick={handleLinkClick}>
                    <Button className="w-full">{t('nav.createAccount')}</Button>
                    </Link>
                    <Link to="/login" onClick={handleLinkClick}>
                      <Button variant="outline" className="w-full">
                        {t('nav.login')}
                      </Button>
                    </Link>
                  </div>
                )}

                {isAuthenticated && !isAdmin && (
                  <Link to="/dashboard" onClick={handleLinkClick}>
                    <Button variant="ghost" className="w-full justify-start">
                      {t('nav.myBookings')}
                    </Button>
                  </Link>
                )}

                {isAuthenticated && isAdmin && (
                  <Link 
                    to="/admin/dashboard" 
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      activePath === '/admin/dashboard'
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-secondary/70'
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    {t('nav.adminPanel')}
                  </Link>
                )}

                {/* Book Tractor button in mobile menu for customers */}
                {!isAdmin && (
                  <Link to="/tractors" onClick={handleLinkClick}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-md">
                      <Tractor className="mr-2 h-4 w-4" />
                      {t('nav.bookTractor')}
                    </Button>
                  </Link>
                )}

                <Button variant="outline" className="w-full justify-start" onClick={toggleLanguage}>
                  <Globe className="mr-2 h-4 w-4" />
                  <span className="font-semibold">{languageLabel}</span>
                  <span className="ml-2">{languageFlag}</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
