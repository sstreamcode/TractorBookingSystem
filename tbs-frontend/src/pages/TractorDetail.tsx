import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Zap, Fuel, Calendar, Clock, ChevronLeft, ChevronRight, Info, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StarRating from '@/components/StarRating';
import { getInitials, getAvatarColor, getImageUrlWithCacheBust } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getTractorForUI, createBooking, confirmCashOnDelivery, verifyEsewaPayment, fetchTractorStats, submitFeedback } from '@/lib/api';
import type { Feedback as FeedbackType } from '@/lib/api';
import type { Tractor as TractorType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreditCard, Wallet } from 'lucide-react';
import CryptoJS from 'crypto-js';
import DeliveryMapPicker from '@/components/DeliveryMapPicker';

const TractorGallery = ({ tractor }: { tractor: TractorType }) => {
  const gallery = useMemo(() => {
    const raw = [tractor.image, ...(tractor.images || [])].filter(Boolean) as string[];
    return Array.from(new Set(raw));
  }, [tractor]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeImage, setActiveImage] = useState<string | null>(gallery[0] || null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setActiveImage(gallery[0] || tractor.image || null);
  }, [gallery, tractor.image]);

  useEffect(() => {
    if (gallery.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % gallery.length;
        setActiveImage(gallery[next]);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gallery, isHovered]);

  const go = (dir: number) => {
    if (gallery.length <= 1) return;
    setActiveIndex((prev) => {
      const next = (prev + dir + gallery.length) % gallery.length;
      setActiveImage(gallery[next]);
      return next;
    });
  };

  return (
    <div>
      <div
        className="relative aspect-video rounded-lg overflow-hidden mb-6 shadow-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={activeImage || tractor.image}
          alt={tractor.name}
          className="w-full h-full object-cover select-none transition-opacity duration-500"
          draggable={false}
        />
        <Badge className="absolute top-4 right-4 z-10" variant={tractor.available ? 'default' : 'secondary'}>
          {tractor.status || (tractor.available ? 'Available' : 'Unavailable')}
        </Badge>
        {gallery.length > 1 && (
          <div className="absolute inset-0 pointer-events-none">
            <button
              type="button"
              className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 bg-slate-800/70 hover:bg-slate-800/90 rounded-full p-2 shadow z-10"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 bg-slate-800/70 hover:bg-slate-800/90 rounded-full p-2 shadow z-10"
              onClick={() => go(1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {gallery.map((img, i) => (
            <button
              key={img + i}
              className={`relative h-16 w-24 overflow-hidden rounded-lg border transition ${
                i === activeIndex ? 'border-primary shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              onClick={() => {
                setActiveIndex(i);
                setActiveImage(img);
              }}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TractorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tractor, setTractor] = useState<TractorType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [availabilityDialogData, setAvailabilityDialogData] = useState<{
    message: string;
    status: string;
    nextAvailableText: string;
    location: string;
  } | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalBookings, setTotalBookings] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getTractorForUI(id);
        setTractor(data);
        if (data.latitude && data.longitude) {
          setDeliveryLocation((prev) =>
            prev ?? {
              lat: data.latitude!,
              lng: data.longitude!,
              address: data.location || `${data.latitude?.toFixed(6)}, ${data.longitude?.toFixed(6)}`,
            },
          );
        }
        if (data.latitude && data.longitude && !deliveryLocation) {
          setDeliveryLocation({
            lat: data.latitude,
            lng: data.longitude,
            address: data.location || `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
          });
        }
        // fetch stats (rating, bookings, feedback)
        try {
          const stats = await fetchTractorStats(id);
          setAvgRating(stats.avgRating);
          setTotalBookings(stats.totalBookings);
          setFeedback(stats.feedback || []);
        } catch {}
      } catch (e) {
        setError('Tractor not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !tractor) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-slate-100">{error ?? 'Tractor not found'}</p>
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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );
          const data = await response.json();
          if (data.display_name) {
            address = data.display_name;
          }
        } catch {
          // ignore reverse geocode failure, fallback to coords
        }
        setDeliveryLocation({ lat: latitude, lng: longitude, address });
        toast.success('Delivery location set to your current position.');
      },
      () => toast.error('Unable to access your location. Please allow location permission.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const buildAvailabilityDialogData = () => {
    if (!tractor) {
      return {
        message: 'This tractor is currently unavailable. Please explore other tractors or check back later.',
        status: 'unavailable',
        nextAvailableText: 'Not scheduled yet',
        location: 'Not specified',
      };
    }
    const statusText = tractor.status ? tractor.status.toLowerCase() : 'booked';
    const nextAvailableDate = tractor.nextAvailableAt ? new Date(tractor.nextAvailableAt) : null;
    const formattedDate = nextAvailableDate
      ? nextAvailableDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : 'Not scheduled yet';

    return {
      message: `We're currently fulfilling another booking for this tractor. As soon as it returns, it'll be ready for the next dispatch.`,
      status: statusText,
      nextAvailableText: formattedDate,
      location: tractor.location || 'Not specified',
    };
  };

  const showUnavailableInfo = () => {
    setAvailabilityDialogData(buildAvailabilityDialogData());
    setShowAvailabilityDialog(true);
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a tractor');
      navigate('/login');
      return;
    }

    if (isCreatingBooking) {
      return; // Prevent multiple clicks
    }

    if (!tractor?.available) {
      showUnavailableInfo();
      return;
    }

    if (!startDate || !endDate || !startTime || !endTime) {
      toast.error('Please fill in all booking details');
      return;
    }

    if (!deliveryLocation) {
      toast.error('Please select a delivery location on the map');
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

    setIsCreatingBooking(true);
    try {
      // Create booking with combined date and time
      const startAt = `${startDate}T${startTime}`;
      const endAt = `${endDate}T${endTime}`;
      
      const booking = await createBooking(
        tractor.id, 
        startAt, 
        endAt,
        deliveryLocation.lat,
        deliveryLocation.lng,
        deliveryLocation.address
      );
      setCreatedBookingId(String(booking.id));
      
      // Refresh tractor data to get updated availability and booking count
      if (id) {
        try {
          const updatedTractor = await getTractorForUI(id);
          setTractor(updatedTractor);
          // Refresh stats
          const stats = await fetchTractorStats(id);
          setAvgRating(stats.avgRating);
          setTotalBookings(stats.totalBookings);
          setFeedback(stats.feedback || []);
        } catch (e) {
          // Ignore refresh errors
        }
      }
      
      toast.success('Booking created! Please choose a payment method.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create booking');
    } finally {
      setIsCreatingBooking(false);
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 py-8">
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
            <TractorGallery tractor={tractor} />

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{tractor.name}</h1>
                <p className="text-lg text-slate-400">{tractor.model}</p>
                <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
                  {avgRating != null && (
                    <span className="inline-flex items-center gap-1">
                      ★ <span className="font-semibold text-slate-100">{avgRating.toFixed(1)}</span>
                    </span>
                  )}
                  {totalBookings != null && (
                    <span className="inline-flex items-center gap-1">
                      Bookings <span className="font-semibold text-slate-100">{totalBookings}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-slate-400">Location</p>
                    <p className="font-medium">{tractor.location}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-lg">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-slate-400">Power</p>
                    <p className="font-medium">{tractor.horsePower} HP</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-lg">
                  <Fuel className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-slate-400">Fuel Type</p>
                    <p className="font-medium">{tractor.fuelType}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-slate-400">Rate</p>
                    <p className="font-medium">रू {tractor.hourlyRate}/hr</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-slate-400 leading-relaxed">{tractor.description}</p>
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
                    <Label htmlFor="startDate" className="text-slate-100">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        // If end date is before new start date, clear it
                        if (endDate && e.target.value && endDate < e.target.value) {
                          setEndDate('');
                        }
                      }}
                      min={today}
                      className="cursor-pointer bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500"
                      style={{ colorScheme: 'dark' }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-slate-100">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="cursor-pointer bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-slate-100">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || today}
                      className="cursor-pointer bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-[2] [&::-webkit-calendar-picker-indicator]:contrast-150"
                      style={{ colorScheme: 'dark' }}
                      disabled={!startDate}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-slate-100">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="cursor-pointer bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-[2] [&::-webkit-calendar-picker-indicator]:contrast-150"
                      disabled={!endDate}
                    />
                  </div>
                </div>

                {/* Delivery Location Map */}
                <div className="space-y-2">
                  <Label>Delivery Location</Label>
                  <div className="relative rounded-lg border border-slate-700 overflow-hidden">
                    <button
                      type="button"
                      className="absolute right-3 top-3 z-10 rounded-full bg-slate-800/90 px-3 py-1 text-xs font-medium text-amber-500 shadow hover:bg-slate-800"
                      onClick={handleUseCurrentLocation}
                    >
                      Use my location
                    </button>
                    <DeliveryMapPicker
                      value={deliveryLocation}
                      onChange={(location) => setDeliveryLocation(location)}
                      className="h-64 w-full"
                    />
                    {deliveryLocation && (
                      <div className="absolute top-2 left-2 bg-slate-800/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-sm max-w-xs">
                        <p className="font-semibold text-slate-100">Selected Location</p>
                        <p className="text-xs text-slate-400 truncate">{deliveryLocation.address}</p>
                        <p className="text-xs text-slate-400">
                          {deliveryLocation.lat.toFixed(6)}, {deliveryLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Click on the map to select where you want the tractor delivered
                  </p>
                </div>

                {totalCost > 0 && (
                  <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Hourly Rate</span>
                      <span className="font-medium text-slate-200">NPR {tractor.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Duration</span>
                      <span className="font-medium text-slate-200">{Math.ceil((new Date(`${endDate}T${endTime}`).getTime() - new Date(`${startDate}T${startTime}`).getTime()) / (1000 * 60 * 60))} hours</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-100">Total Cost</span>
                        <span className="text-2xl font-bold text-amber-500">NPR {totalCost}</span>
                      </div>
                    </div>
                  </div>
                )}

                {!createdBookingId ? (
                  <>
                    <div className="relative">
                      {!tractor.available && (
                        <button
                          type="button"
                          onClick={showUnavailableInfo}
                          className="absolute inset-0 z-10 cursor-not-allowed bg-transparent"
                          aria-label="Tractor unavailable"
                        />
                      )}
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleBooking}
                        disabled={!tractor.available || totalCost <= 0 || isCreatingBooking}
                      >
                        {isCreatingBooking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Booking...
                          </>
                        ) : (
                          !tractor.available ? 'Currently Unavailable' : 'Proceed to Payment'
                        )}
                      </Button>
                    </div>
                    {!tractor.available && tractor.nextAvailableAt && (
                      <p className="text-xs text-slate-400 text-center">
                        Booked until {new Date(tractor.nextAvailableAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}

                    {!isAuthenticated && (
                      <p className="text-sm text-center text-slate-400">
                        You need to <Button variant="link" className="p-0" onClick={() => navigate('/login')}>login</Button> to book this tractor
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-sm font-medium text-emerald-400 mb-3">
                        Booking Created! Choose a payment method:
                      </p>
                      <div className="grid gap-3">
                        <Card className="cursor-pointer hover:border-amber-500 transition-colors" onClick={handleEsewaPayment}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Wallet className="h-5 w-5 text-amber-500" />
                              <div>
                                <p className="font-semibold">Pay with eSewa</p>
                                <p className="text-sm text-slate-400">Secure online payment</p>
                              </div>
                            </div>
                            <Badge variant="secondary">Instant</Badge>
                          </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:border-amber-500 transition-colors" onClick={handleCashOnDelivery}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-amber-500" />
                              <div>
                                <p className="font-semibold">Cash on Delivery</p>
                                <p className="text-sm text-slate-400">Pay when you receive</p>
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

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Feedback Section */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Recent Feedback</span>
                {feedback.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {feedback.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedback.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Info className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">
                    No feedback yet. Be the first to rate this tractor!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {feedback.map((f) => (
                    <div 
                      key={f.id} 
                      className="rounded-lg border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/20 p-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={getImageUrlWithCacheBust(f.profilePictureUrl || undefined)} alt={f.authorName} />
                          <AvatarFallback className={`${getAvatarColor(f.authorName || 'User')} text-white text-sm font-semibold`}>
                            {getInitials(f.authorName || 'A')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-semibold text-slate-100 text-sm">{f.authorName || 'Anonymous'}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(f.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <StarRating rating={f.rating} size="sm" />
                          </div>
                          {f.comment && (
                            <p className="text-sm text-slate-400 leading-relaxed mt-2 whitespace-pre-wrap">
                              {f.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>

          {/* Leave a Rating Section */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-100">Leave a Rating</CardTitle>
              <p className="text-sm text-slate-400 mt-1">Share your experience with this tractor</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-semibold text-slate-100 mb-3 block">Your Rating</Label>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-slate-700 bg-muted/30">
                    <StarRating 
                      rating={newRating} 
                      onRatingChange={setNewRating}
                      interactive={true}
                      size="lg"
                    />
                    <span className="text-sm font-medium text-slate-100 ml-2">
                      {newRating} {newRating === 1 ? 'star' : 'stars'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="comment" className="text-sm font-semibold text-slate-100 mb-2 block">
                    Comment (optional)
                  </Label>
                  <textarea
                    id="comment"
                    className="w-full min-h-[120px] rounded-lg border border-slate-700 bg-slate-900 text-slate-100 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-500"
                    value={newComment}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setNewComment(e.target.value);
                      }
                    }}
                    placeholder="Share your experience with this tractor..."
                    maxLength={500}
                  />
                    <p className={`text-xs mt-1.5 ${newComment.length >= 450 ? 'text-orange-400' : 'text-slate-400'}`}>
                    {newComment.length} / 500 characters
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={async () => {
                      if (!id) return;
                      if (!isAuthenticated) {
                        toast.error('Please log in to leave feedback.');
                        navigate('/login');
                        return;
                      }
                      try {
                        await submitFeedback(id, newRating, newComment || undefined);
                        const stats = await fetchTractorStats(id);
                        setAvgRating(stats.avgRating);
                        setTotalBookings(stats.totalBookings);
                        setFeedback(stats.feedback || []);
                        setNewComment('');
                        setNewRating(5);
                        toast.success('Thank you for your feedback!');
                      } catch (e: any) {
                        if (e?.message?.toLowerCase().includes('authenticate')) {
                          toast.error('Please log in to leave feedback.');
                          navigate('/login');
                          return;
                        }
                        if (e?.message?.toLowerCase().includes('already rated')) {
                          toast.error('You have already rated this tractor.');
                          return;
                        }
                        toast.error(e?.message || 'Failed to submit feedback');
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Submit Feedback
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
      <AlertDialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <AlertDialogContent className="max-w-lg border border-amber-500/20 bg-slate-800/95 backdrop-blur-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-semibold text-slate-100">
                  {tractor?.name || 'Tractor Availability'}
                </AlertDialogTitle>
                <p className="text-sm text-slate-400">Current booking status & availability</p>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Current Status</span>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 capitalize">
                  {availabilityDialogData?.status || 'unavailable'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Next Available</span>
                <span className="font-medium text-slate-100">{availabilityDialogData?.nextAvailableText || 'Not scheduled'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Current Location</span>
                <span className="font-medium text-slate-100">{availabilityDialogData?.location || 'Not specified'}</span>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-slate-700 bg-muted/30 p-4 text-sm leading-relaxed text-slate-400">
              <Info className="h-5 w-5 text-amber-500" />
              <p>{availabilityDialogData?.message || 'This tractor is currently fulfilling another booking. Please check back later or choose a different tractor.'}</p>
            </div>
          </div>

          <AlertDialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAvailabilityDialog(false)}>
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TractorDetail;
