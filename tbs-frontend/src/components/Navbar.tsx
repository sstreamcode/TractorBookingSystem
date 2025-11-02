import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tractor, User, LogOut, LayoutDashboard, UserCircle, Menu, X } from 'lucide-react';
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
import { useState } from 'react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

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

  const renderNavigationLinks = (isMobile: boolean = false) => (
    <>
      <Link
        to="/tractors"
        onClick={handleLinkClick}
        className={`text-base font-medium transition-colors py-2 px-4 rounded-lg block ${
          isActive('/tractors') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-gray-50'
        }`}
      >
        Browse Tractors
      </Link>
      
      {!isAdmin && (
        <Link
          to="/dashboard"
          onClick={handleLinkClick}
          className={`text-base font-medium transition-colors py-2 px-4 rounded-lg block ${
            isActive('/dashboard') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-gray-50'
          }`}
        >
          My Bookings
        </Link>
      )}

      {isAdmin && (
        <Link to="/admin/dashboard" onClick={handleLinkClick} className="block">
          <Button variant="outline" size="sm" className="w-full">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Admin Panel
          </Button>
        </Link>
      )}
    </>
  );

  const renderProfileSection = () => (
    <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
      <Avatar className="h-12 w-12">
        <AvatarImage src={user?.profilePictureUrl} alt={user?.name} />
        <AvatarFallback className="bg-primary text-white text-sm font-semibold">
          {getInitials(user?.name || 'U')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
        <p className="text-xs text-gray-600">{user?.email}</p>
      </div>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Tractor className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">
              TractorRent
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {renderNavigationLinks()}

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.profilePictureUrl} alt={user?.name} />
                        <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                          {getInitials(user?.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900">{user?.name}</span>
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
              </>
            ) : (
              <>
                <Link to="/tractors" className="text-sm font-medium transition-colors hover:text-primary">
                  Browse Tractors
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <div className="flex md:hidden items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:opacity-80 transition-opacity focus:outline-none">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profilePictureUrl} alt={user?.name} />
                      <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                        {getInitials(user?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
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

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none">
                    <Menu className="h-6 w-6 text-gray-900" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-80">
                  <SheetHeader className="text-left">
                    <SheetTitle className="text-xl">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-1">
                    {renderNavigationLinks(true)}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Mobile Menu for Non-Authenticated */}
          {!isAuthenticated && (
            <div className="flex md:hidden items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
