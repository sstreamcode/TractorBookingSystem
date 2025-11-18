import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { verifyEsewaPayment } from '@/lib/api';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  
  // Parse bookingId from URL - handle case where data might be appended
  const bookingIdParam = searchParams.get('bookingId');
  const bookingId = bookingIdParam ? bookingIdParam.split('?')[0] : null;
  
  // eSewa sends payment data in base64 encoded JSON in the 'data' parameter
  const dataParam = searchParams.get('data');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!bookingId) {
        toast.error('Invalid booking ID');
        navigate('/dashboard');
        return;
      }

      try {
        // Parse eSewa payment response data if available
        let referenceId = 'REF_' + Date.now();
        if (dataParam) {
          try {
            const decodedData = JSON.parse(atob(dataParam));
            console.log('eSewa payment data:', decodedData);
            
            // Extract transaction code or reference ID from eSewa data
            if (decodedData.transaction_code) {
              referenceId = decodedData.transaction_code;
            } else if (decodedData.ref_id) {
              referenceId = decodedData.ref_id;
            }
          } catch (e) {
            console.warn('Could not parse eSewa data:', e);
          }
        }

        console.log('Verifying payment with bookingId:', bookingId, 'refId:', referenceId);
        await verifyEsewaPayment(bookingId, referenceId);
        toast.success('Payment verified successfully!');
        setProcessing(false);
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (error: any) {
        console.error('Payment verification error:', error);
        toast.error(error?.message || 'Payment verification failed');
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };

    if (bookingId) {
      verifyPayment();
    }
  }, [bookingId, dataParam, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="mb-6">
                <CheckCircle className="h-24 w-24 text-green-500 mx-auto" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
              {processing ? (
                <p className="text-muted-foreground mb-6">Verifying payment...</p>
              ) : (
                <>
                  <p className="text-muted-foreground mb-6">
                    Your booking has been confirmed. You will be redirected to your dashboard shortly.
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

