import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-emerald-50/30">
      <div className="w-full max-w-md">
        {/* Prominent Branding Section */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-3 mb-6 group">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-emerald-500 to-slate-900 text-white shadow-lg group-hover:shadow-xl transition-shadow">
              <Tractor className="h-7 w-7" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-2xl font-bold leading-tight text-secondary group-hover:text-primary transition-colors">
                Tractor Sewa
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground leading-tight">
                Secure Rental Platform
              </span>
            </div>
          </Link>
          <h1 className="text-4xl font-bold mb-3 text-secondary">Welcome Back</h1>
          <p className="text-base text-muted-foreground">Sign in to your account to continue</p>
        </div>

        <Card className="border border-border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-secondary">Login</CardTitle>
            <CardDescription className="text-base">
              Use admin@tbs.local for admin access or any other email for customer access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-secondary">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-secondary">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-semibold hover:underline transition-colors">
                  Sign up
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
