import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const PaymentFailure = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="text-center border border-slate-700 bg-slate-800">
            <CardContent className="p-8">
              <div className="mb-6">
                <XCircle className="h-24 w-24 text-red-500 mx-auto" />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-slate-100">{t('payment.failure.title')}</h1>
              <p className="text-slate-400 mb-6">
                {bookingId 
                  ? t('payment.failure.withBooking')
                  : t('payment.failure.withoutBooking')}
              </p>
              <Button onClick={() => navigate('/dashboard')} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                {t('payment.failure.goDashboard')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;

