import { Link, useLocation } from 'react-router-dom';
import { Tractor, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, logout, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 transition-transform hover:scale-105">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
              <Tractor className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TractorRent
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/tractors"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/tractors') ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  Browse Tractors
                </Link>
                
                {!isAdmin && (
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/dashboard') ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    My Bookings
                  </Link>
                )}

                {isAdmin && (
                  <Link to="/admin/dashboard">
                    <Button variant="outline" size="sm">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Button>
                  </Link>
                )}

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{user?.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
