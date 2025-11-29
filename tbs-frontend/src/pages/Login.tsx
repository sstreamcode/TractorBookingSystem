import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Prominent Branding Section */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center gap-4 mb-8 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
              <Tractor className="h-8 w-8" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-3xl font-bold leading-tight text-gray-900 group-hover:text-amber-700 transition-colors">
                Tractor Sewa
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground leading-tight font-semibold">
                {t('brand.subtitle')}
              </span>
            </div>
          </Link>
          <h1 className="text-5xl font-bold mb-4 text-secondary">{t('auth.welcome')}</h1>
          <p className="text-lg text-muted-foreground font-medium">{t('auth.welcomeDesc')}</p>
        </div>

        <Card className="border border-border/60 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6 pt-8">
            <CardTitle className="text-3xl font-bold text-secondary">{t('auth.login.title')}</CardTitle>
            <CardDescription className="text-base font-medium">
              {t('auth.login.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-secondary">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base rounded-xl border-2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-secondary">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base rounded-xl border-2"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                disabled={isLoading}
              >
                {isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2 font-medium">
                {t('auth.dontHaveAccount')}{' '}
                <Link to="/register" className="text-primary font-bold hover:underline transition-colors">
                  {t('auth.signUp')}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
