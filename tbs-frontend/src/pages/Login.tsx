import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { requestPasswordReset, verifyResetCode, resetPassword } from '@/lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'code' | 'password'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { login, isAuthenticated, isSuperAdmin, isAdmin, isTractorOwner, loading: authLoading } = useAuth();
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

  const handleForgotPasswordEmail = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsResetting(true);
    try {
      await requestPasswordReset(resetEmail);
      toast.success('Verification code sent to your email!');
      setForgotPasswordStep('code');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsResetting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsResetting(true);
    try {
      await verifyResetCode(resetEmail, resetCode);
      toast.success('Code verified! Please set your new password.');
      setForgotPasswordStep('password');
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(resetEmail, resetCode, newPassword);
      toast.success('Password reset successfully! You can now login.');
      setShowForgotPassword(false);
      setForgotPasswordStep('email');
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
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
          <h1 className="text-5xl font-bold mb-4 text-foreground">{t('auth.welcome')}</h1>
          <p className="text-lg text-muted-foreground font-medium">{t('auth.welcomeDesc')}</p>
        </div>

        <Card className="border border-border shadow-2xl bg-card backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6 pt-8">
            <CardTitle className="text-3xl font-bold text-foreground">{t('auth.login.title')}</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground">
              {t('auth.login.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                disabled={isLoading}
              >
                {isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-amber-500 font-semibold hover:text-amber-400 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <p className="text-center text-sm text-muted-foreground pt-2 font-medium">
                {t('auth.dontHaveAccount')}{' '}
                <Link to="/register" className="text-amber-500 font-bold hover:text-amber-400 hover:underline transition-colors">
                  {t('auth.signUp')}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Reset Password</DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 'email' && 'Enter your email address to receive a verification code.'}
              {forgotPasswordStep === 'code' && 'Enter the 6-digit code sent to your email.'}
              {forgotPasswordStep === 'password' && 'Enter your new password.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Step 1: Email */}
            {forgotPasswordStep === 'email' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <Button
                  onClick={handleForgotPasswordEmail}
                  disabled={isResetting || !resetEmail}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                >
                  {isResetting ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </>
            )}

            {/* Step 2: Verification Code */}
            {forgotPasswordStep === 'code' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-code">6-Digit Verification Code</Label>
                  <Input
                    id="reset-code"
                    type="text"
                    placeholder="000000"
                    value={resetCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setResetCode(value);
                    }}
                    className="h-12 text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code sent to {resetEmail}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForgotPasswordStep('email');
                      setResetCode('');
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerifyCode}
                    disabled={isResetting || resetCode.length !== 6}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                  >
                    {isResetting ? 'Verifying...' : 'Verify Code'}
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: New Password */}
            {forgotPasswordStep === 'password' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForgotPasswordStep('code');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleResetPassword}
                    disabled={isResetting || !newPassword || newPassword !== confirmPassword}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                  >
                    {isResetting ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
