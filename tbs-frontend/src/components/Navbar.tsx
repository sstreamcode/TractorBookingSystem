import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  Tractor,
  LogOut,
  LayoutDashboard,
  UserCircle,
  Menu,
  Globe,
  ChevronDown,
  Info,
  Phone,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
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
import { useTheme } from '@/contexts/ThemeContext';
import { getInitials, getAvatarColor, getImageUrlWithCacheBust } from '@/lib/utils';

const PRIMARY_NAV = [
  { labelKey: 'nav.home', href: '/' },
  { labelKey: 'nav.tractors', href: '/tractors' },
];

const SECONDARY_NAV = [
  { labelKey: 'nav.about', href: '/about', icon: Info },
  { labelKey: 'nav.contact', href: '/contact', icon: Phone },
  { labelKey: 'nav.privacy', href: '/privacy', icon: Shield },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isSuperAdmin, isTractorOwner, logout, user } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activePath = useMemo(() => location.pathname, [location.pathname]);

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

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-6 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-900 shadow-lg transition-transform group-hover:scale-105">
            <Tractor className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-foreground group-hover:text-amber-500 transition-colors">
            Tractor Sewa
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {!isAdmin && !isSuperAdmin && !isTractorOwner &&
            PRIMARY_NAV.map((item) => {
              const isActive = activePath === item.href;
              return (
                <Link
                  key={item.labelKey}
                  to={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                      ? 'text-amber-600 bg-muted font-semibold'
                      : 'text-muted-foreground hover:text-amber-600 hover:bg-muted'
                    }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}

          {/* More dropdown for secondary links */}
          {!isAdmin && !isSuperAdmin && !isTractorOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                  {t('nav.more')}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {SECONDARY_NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.labelKey} asChild>
                      <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {t(item.labelKey)}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Super Admin Link */}
          {isAuthenticated && isSuperAdmin && (
            <Link
              to="/super-admin/dashboard"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activePath === '/super-admin/dashboard'
                  ? 'text-amber-700 bg-amber-50 font-semibold'
                  : 'text-muted-foreground hover:text-amber-700 hover:bg-amber-50/50'
                }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Super Admin Portal
            </Link>
          )}

          {/* Regular Admin Link */}
          {isAuthenticated && isAdmin && !isSuperAdmin && (
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activePath === '/admin/dashboard'
                  ? 'text-amber-700 bg-amber-50 font-semibold'
                  : 'text-muted-foreground hover:text-amber-700 hover:bg-amber-50/50'
                }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('nav.adminPanel')}
            </Link>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* My Bookings for authenticated customers only */}
          {isAuthenticated && !isAdmin && !isSuperAdmin && !isTractorOwner && (
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors ${activePath === '/dashboard' ? 'text-amber-700 font-semibold' : 'text-muted-foreground hover:text-amber-700'
                }`}
            >
              {t('nav.myBookings')}
            </Link>
          )}

          {/* CTA Button - only for customers */}
          {!isAdmin && !isSuperAdmin && !isTractorOwner && (
            <Link to="/tractors">
              <Button className="h-9 px-4 font-medium bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-md hover:shadow-amber-500/50">
                <Tractor className="mr-2 h-4 w-4" />
                {t('nav.bookTractor')}
              </Button>
            </Link>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-border" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" />
                <span className="hidden lg:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span className="hidden lg:inline">Dark</span>
              </>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>{isEnglish ? 'EN' : 'NE'}</span>
          </button>

          {/* User Menu or Login */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-2 ring-transparent hover:ring-amber-500/20 transition-all">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getImageUrlWithCacheBust(user?.profilePictureUrl)} alt={user?.name} />
                    <AvatarFallback className={`${getAvatarColor(user?.name || user?.email || 'User')} text-white text-xs font-semibold`}>
                      {getInitials(user?.name || user?.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isSuperAdmin ? 'Super Administrator' : isAdmin ? t('nav.administrator') : isTractorOwner ? 'Tractor Owner' : user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                {/* Profile link - not for super admin */}
                {!isSuperAdmin && (
                  <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    {t('nav.profileSettings')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogoutClick}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="h-9">
                {t('nav.login')}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          {!isAdmin && !isSuperAdmin && !isTractorOwner && (
            <Link to="/tractors">
              <Button size="sm" className="h-8 px-3 text-xs">
                {t('nav.bookTractor')}
              </Button>
            </Link>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Menu className="h-5 w-5 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="p-6 pb-4 border-b border-border">
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-md">
                    <Tractor className="h-4 w-4" />
                  </div>
                  <span className="text-gray-900">Tractor Sewa</span>
                </SheetTitle>
              </SheetHeader>

              <div className="p-4 space-y-1">
                {/* Primary Navigation - only for customers */}
                {!isAdmin && !isSuperAdmin && !isTractorOwner &&
                  PRIMARY_NAV.map((item) => {
                    const isActive = activePath === item.href;
                    return (
                      <Link
                        key={item.labelKey}
                        to={item.href}
                        onClick={handleLinkClick}
                        className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-foreground hover:bg-amber-50/50 hover:text-amber-700'
                          }`}
                      >
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}

                {/* Secondary Navigation - only for customers */}
                {!isAdmin && !isSuperAdmin && !isTractorOwner && (
                  <div className="pt-2 mt-2 border-t border-border">
                    <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('nav.more')}
                    </p>
                    {SECONDARY_NAV.map((item) => {
                      const Icon = item.icon;
                      const isActive = activePath === item.href;
                      return (
                        <Link
                          key={item.labelKey}
                          to={item.href}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive
                              ? 'bg-amber-50 text-amber-700 font-semibold'
                              : 'text-muted-foreground hover:text-amber-700 hover:bg-amber-50/50'
                            }`}
                        >
                          <Icon className="h-4 w-4" />
                          {t(item.labelKey)}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Super Admin Panel */}
                {isAuthenticated && isSuperAdmin && (
                  <Link
                    to="/super-admin/dashboard"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Super Admin Portal
                  </Link>
                )}

                {/* Regular Admin Panel */}
                {isAuthenticated && isAdmin && !isSuperAdmin && (
                  <Link
                    to="/admin/dashboard"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t('nav.adminPanel')}
                  </Link>
                )}
              </div>

              {/* Bottom Section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-muted/30 space-y-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    )}
                    {t('nav.theme')}
                  </span>
                  <span className="text-muted-foreground">
                    {theme === 'dark' ? t('nav.darkMode') : t('nav.lightMode')}
                  </span>
                </button>

                {/* Language Toggle */}
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {t('nav.language')}
                  </span>
                  <span className="text-muted-foreground">{isEnglish ? 'English' : 'नेपाली'}</span>
                </button>

                {/* Auth Actions */}
                {!isAuthenticated ? (
                  <div className="flex gap-2">
                    <Link to="/login" onClick={handleLinkClick} className="flex-1">
                      <Button variant="outline" className="w-full bg-transparent">
                        {t('nav.login')}
                      </Button>
                    </Link>
                    <Link to="/register" onClick={handleLinkClick} className="flex-1">
                      <Button className="w-full">{t('nav.createAccount')}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getImageUrlWithCacheBust(user?.profilePictureUrl)} alt={user?.name} />
                        <AvatarFallback className={`${getAvatarColor(user?.name || user?.email || 'User')} text-white text-sm font-semibold`}>
                          {getInitials(user?.name || user?.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>

                    {!isAdmin && !isSuperAdmin && !isTractorOwner && (
                      <Link to="/dashboard" onClick={handleLinkClick}>
                        <Button variant="ghost" className="w-full justify-start">
                          {t('nav.myBookings')}
                        </Button>
                      </Link>
                    )}

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogoutClick}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('nav.logout')}
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
