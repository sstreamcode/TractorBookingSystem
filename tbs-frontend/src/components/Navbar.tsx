import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  Tractor,
  LogOut,
  LayoutDashboard,
  UserCircle,
  Menu,
  BarChart3,
  Map,
  Compass,
} from 'lucide-react';
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

type NavItem =
  | {
      label: string;
      href: string;
      icon?: LucideIcon;
      type: 'route';
    }
  | {
      label: string;
      href: string;
      icon?: LucideIcon;
      type: 'anchor';
    };

const NAV_ITEMS: NavItem[] = [
  { label: 'Platform', href: '/#platform', icon: Compass, type: 'anchor' },
  { label: 'Fleet', href: '/tractors', icon: Map, type: 'route' },
  { label: 'Insights', href: '/#insights', icon: BarChart3, type: 'anchor' },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
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

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/60">
      <div className="brand-outline">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm text-secondary-foreground/80">
          <span className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            Precision-guided tractor bookings across Nepal
          </span>
          <span className="hidden sm:inline-flex text-secondary-foreground/70">
            Pathfinder Pro intelligence now powering TractorRent
          </span>
        </div>
      </div>

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-emerald-500 to-slate-900 text-white shadow-lg">
            <Tractor className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold leading-none text-secondary">
              TractorRent
            </span>
            <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Pathfinder Suite
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const baseClasses =
              'group flex items-center gap-2 text-sm font-medium transition-colors duration-200';

            if (item.type === 'anchor') {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`${baseClasses} text-secondary/70 hover:text-secondary`}
                >
                  {Icon && <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary" />}
                  {item.label}
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={handleLinkClick}
                className={`${baseClasses} ${
                  activePath === item.href ? 'text-secondary' : 'text-secondary/70 hover:text-secondary'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary" />}
                {item.label}
              </Link>
            );
          })}

          {isAuthenticated && !isAdmin && (
            <Link
              to="/dashboard"
              className={`text-sm font-medium ${
                activePath === '/dashboard' ? 'text-secondary' : 'text-secondary/70 hover:text-secondary'
              }`}
            >
              My Bookings
            </Link>
          )}

          {isAuthenticated && isAdmin && (
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Admin Panel
            </Button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.profilePictureUrl} alt={user?.name} />
                    <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                      {getInitials(user?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium text-secondary">{user?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {isAdmin ? 'Administrator' : 'Customer'}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-secondary/80 hover:text-secondary">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Create Account
                </Button>
              </Link>
            </>
          )}
          <Link to="/tractors">
            <Button size="sm" className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
              Book Tractor
            </Button>
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <Link to="/tractors">
            <Button size="sm" variant="outline" className="rounded-full">
              Book
            </Button>
          </Link>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="rounded-full border border-border bg-white/80 p-2 text-secondary shadow-sm transition hover:shadow-md focus:outline-none">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-96">
              <SheetHeader className="text-left">
                <SheetTitle className="text-lg font-semibold text-secondary">
                  Pathfinder Navigation
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid gap-2">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActiveRoute = item.type === 'route' && activePath === item.href;
                    const baseClass =
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition';

                    if (item.type === 'anchor') {
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={`${baseClass} ${
                            isActiveRoute ? 'bg-primary/10 text-secondary' : 'hover:bg-muted text-secondary/70'
                          }`}
                        >
                          {Icon && <Icon className="h-4 w-4 text-primary" />}
                          {item.label}
                        </a>
                      );
                    }

                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        onClick={handleLinkClick}
                        className={`${baseClass} ${
                          isActiveRoute ? 'bg-primary/10 text-secondary' : 'hover:bg-muted text-secondary/70'
                        }`}
                      >
                        {Icon && <Icon className="h-4 w-4 text-primary" />}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {isAuthenticated && (
                  <div className="rounded-3xl border border-border/70 bg-muted/30 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user?.profilePictureUrl} alt={user?.name} />
                        <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                          {getInitials(user?.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-semibold text-secondary">{user?.name}</p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {isAdmin ? 'Administrator' : 'Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Button variant="secondary" className="w-full" onClick={handleProfileClick}>
                        Profile Settings
                      </Button>
                      <Button variant="outline" className="w-full text-red-600 border-red-100" onClick={handleLogoutClick}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="grid gap-2">
                    <Link to="/login" onClick={handleLinkClick}>
                      <Button variant="outline" className="w-full">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/register" onClick={handleLinkClick}>
                      <Button className="w-full">Create Account</Button>
                    </Link>
                  </div>
                )}

                {isAuthenticated && !isAdmin && (
                  <Link to="/dashboard" onClick={handleLinkClick}>
                    <Button variant="ghost" className="w-full justify-start">
                      My Bookings
                    </Button>
                  </Link>
                )}

                {isAuthenticated && isAdmin && (
                  <Link to="/admin/dashboard" onClick={handleLinkClick}>
                    <Button variant="ghost" className="w-full justify-start">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Button>
                  </Link>
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
