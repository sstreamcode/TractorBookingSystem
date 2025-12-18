import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Tractor, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'tractor_owner'>('customer');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const { register, isAuthenticated, isSuperAdmin, isAdmin, isTractorOwner, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isSuperAdmin) {
        window.location.href = '/super-admin/dashboard';
      } else if (isTractorOwner) {
        window.location.href = '/tractor-owner/dashboard';
      } else if (isAdmin) {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/tractors';
      }
    }
  }, [isAuthenticated, isSuperAdmin, isAdmin, isTractorOwner, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isSuperAdmin) return <Navigate to="/super-admin/dashboard" replace />;
    if (isTractorOwner) return <Navigate to="/tractor-owner/dashboard" replace />;
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/tractors" replace />;
  }

  const handleFetchCurrentAddress = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsFetchingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data.display_name) {
            setAddress(data.display_name);
            toast.success('Address fetched successfully!');
          } else {
            toast.error('Could not determine address from location.');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast.error('Failed to fetch address. Please enter manually.');
        } finally {
          setIsFetchingAddress(false);
        }
      },
      (error) => {
        setIsFetchingAddress(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please allow location access or enter address manually.');
        } else {
          toast.error('Unable to access your location. Please enter address manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword || !phone || !address) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDontMatch'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password, role, phone, address);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Prominent Branding Section */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center gap-4 mb-8 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-slate-900 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
              <Tractor className="h-8 w-8" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-3xl font-bold leading-tight text-foreground group-hover:text-amber-500 transition-colors">
                Tractor Sewa
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground leading-tight font-semibold">
                {t('brand.subtitle')}
              </span>
            </div>
          </Link>
          <h1 className="text-5xl font-bold mb-4 text-foreground">{t('auth.getStarted')}</h1>
          <p className="text-lg text-muted-foreground font-medium">{t('auth.getStartedDesc')}</p>
        </div>

        <Card className="border border-border shadow-2xl bg-card backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6 pt-8">
            <CardTitle className="text-3xl font-bold text-foreground">{t('auth.register.title')}</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground">
              {t('auth.register.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role selection */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-foreground">Account Type</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      role === 'customer'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-input bg-background text-foreground hover:border-amber-500/60'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('tractor_owner')}
                    className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      role === 'tractor_owner'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-input bg-background text-foreground hover:border-amber-500/60'
                    }`}
                  >
                    Tractor Owner
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-foreground">{t('auth.fullName')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-foreground">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-bold text-foreground">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-bold text-foreground">Address</Label>
                <div className="relative">
                  <Input
                    id="address"
                    type="text"
                    placeholder="City, District"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleFetchCurrentAddress}
                    disabled={isFetchingAddress}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Fetch current location address"
                  >
                    {isFetchingAddress ? (
                      <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                    ) : (
                      <MapPin className="h-5 w-5 text-amber-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-foreground">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordCreatePlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-bold text-foreground">{t('auth.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.passwordConfirmPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                disabled={isLoading}
              >
                {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2 font-medium">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to="/login" className="text-amber-500 font-bold hover:text-amber-400 hover:underline transition-colors">
                  {t('auth.signIn')}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
