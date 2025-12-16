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

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
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
      await register(name, email, password);
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
                TBS
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
