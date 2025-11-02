import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Zap, Fuel, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getTractorForUI, createBooking, confirmCashOnDelivery, verifyEsewaPayment } from '@/lib/api';
import type { Tractor as TractorType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreditCard, Wallet } from 'lucide-react';
import CryptoJS from 'crypto-js';

const TractorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tractor, setTractor] = useState<TractorType | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getTractorForUI(id);
        setTractor(data);
        setActiveImage(data.image);
        setActiveIndex(0);
      } catch (e) {
        setError('Tractor not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !tractor) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>{error ?? 'Tractor not found'}</p>
        </div>
      </div>
    );
  }

  const calculateCost = () => {
    if (!startDate || !endDate || !startTime || !endTime) return 0;
    
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    return hours > 0 ? hours * tractor.hourlyRate : 0;
  };

  const totalCost = calculateCost();

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a tractor');
      navigate('/login');
      return;
    }

    if (!startDate || !endDate || !startTime || !endTime) {
      toast.error('Please fill in all booking details');
      return;
    }

    if (totalCost <= 0) {
      toast.error('Please select valid dates and times');
      return;
    }

    if (!tractor) {
      toast.error('Tractor information is not available');
      return;
    }

    try {
      // Create booking with combined date and time
      const startAt = `${startDate}T${startTime}`;
      const endAt = `${endDate}T${endTime}`;
      
      const booking = await createBooking(tractor.id, startAt, endAt);
      setCreatedBookingId(String(booking.id));
      toast.success('Booking created! Please choose a payment method.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create booking');
    }
  };

  const handleCashOnDelivery = async () => {
    if (!createdBookingId) return;
    
    try {
      await confirmCashOnDelivery(createdBookingId);
      toast.success('Booking confirmed with Cash on Delivery!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to confirm COD booking');
    }
  };

  const handleEsewaPayment = () => {
    if (!createdBookingId) return;
    
    // eSewa Integration based on https://developer.esewa.com.np/pages/Epay
    // Using RC (Recovery Console) test environment for development
    
    const transactionUUID = `TRANS-${Date.now()}-${createdBookingId}`;
    const productCode = 'EPAYTEST'; // Test product code
    const secretKey = '8gBm/:&EnhH.1/q'; // Test secret key
    
    // Fields for signature generation (order matters!)
    const totalAmount = totalCost.toString();
    
    // Create signature message string in correct format: key=value,key=value,key=value
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;
    
    // Generate HMAC SHA256 signature and encode to Base64
    const hash = CryptoJS.HmacSHA256(signatureMessage, secretKey);
    const signature = CryptoJS.enc.Base64.stringify(hash);
    
    // Create a hidden form and submit to eSewa
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
    
    // Required fields based on eSewa documentation
    const fields = {
      amount: totalCost.toString(),
      tax_amount: '0',
      total_amount: totalAmount,
      transaction_uuid: transactionUUID,
      product_code: productCode,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${window.location.origin}/payment/success?bookingId=${createdBookingId}`,
      failure_url: `${window.location.origin}/payment/failure?bookingId=${createdBookingId}`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: signature
    };
    
    // Add fields to form
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/tractors')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tractors
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images and Details */}
          <div>
            <div className="relative aspect-video rounded-lg overflow-hidden mb-6 shadow-lg">
              <img
                src={activeImage || tractor.image}
                alt={tractor.name}
                className="w-full h-full object-cover select-none"
                draggable={false}
              />
              <Badge 
                className="absolute top-4 right-4"
                variant={tractor.available ? "default" : "secondary"}
              >
                {tractor.available ? 'Available' : 'Unavailable'}
              </Badge>
              {(() => {
                const galleryRaw = [tractor.image, ...(tractor.images || [])];
                const gallery = Array.from(new Set(galleryRaw.filter(Boolean)));
                const total = gallery.length;
                if (total <= 1) return null;

                const go = (dir: number) => {
                  const next = (activeIndex + dir + total) % total;
                  setActiveIndex(next);
                  setActiveImage(gallery[next]);
                };

                return (
                  <div className="absolute inset-0 pointer-events-none">
                    <button
                      type="button"
                      className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-2 shadow"
                      onClick={() => go(-1)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full p-2 shadow"
                      onClick={() => go(1)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="pointer-events-auto absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 px-3">
                      <div className="flex gap-2 overflow-x-auto p-1 bg-background/70 rounded-md">
                        {gallery.map((u, i) => (
                          <button
                            type="button"
                            key={`${u}-${i}`}
                            onClick={() => { setActiveIndex(i); setActiveImage(u); }}
                            className={`rounded overflow-hidden ${activeIndex === i ? 'ring-2 ring-primary' : ''}`}
                          >
                            <img src={u} alt={`img-${i}`} className="h-14 w-20 object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{tractor.name}</h1>
                <p className="text-lg text-muted-foreground">{tractor.model}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{tractor.location}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Power</p>
                    <p className="font-medium">{tractor.horsePower} HP</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                    <p className="font-medium">{tractor.fuelType}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rate</p>
                    <p className="font-medium">रू {tractor.hourlyRate}/hr</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{tractor.description}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book This Tractor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {totalCost > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hourly Rate</span>
                      <span className="font-medium">रू {tractor.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{Math.ceil((new Date(`${endDate}T${endTime}`).getTime() - new Date(`${startDate}T${startTime}`).getTime()) / (1000 * 60 * 60))} hours</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total Cost</span>
                        <span className="text-2xl font-bold text-primary">रू {totalCost}</span>
                      </div>
                    </div>
                  </div>
                )}

                {!createdBookingId ? (
                  <>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleBooking}
                      disabled={!tractor.available || totalCost <= 0}
                    >
                      {!tractor.available ? 'Currently Unavailable' : 'Proceed to Payment'}
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-sm text-center text-muted-foreground">
                        You need to <Button variant="link" className="p-0" onClick={() => navigate('/login')}>login</Button> to book this tractor
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                        Booking Created! Choose a payment method:
                      </p>
                      <div className="grid gap-3">
                        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleEsewaPayment}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Wallet className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-semibold">Pay with eSewa</p>
                                <p className="text-sm text-muted-foreground">Secure online payment</p>
                              </div>
                            </div>
                            <Badge variant="secondary">Instant</Badge>
                          </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleCashOnDelivery}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-semibold">Cash on Delivery</p>
                                <p className="text-sm text-muted-foreground">Pay when you receive</p>
                              </div>
                            </div>
                            <Badge variant="outline">COD</Badge>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TractorDetail;
