import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Calendar, Clock, CreditCard, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookingsForUI, requestBookingCancellation } from '@/lib/api';
import type { Booking } from '@/types';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Reusable carousel component
interface ImageCarouselProps {
  id: string;
  gallery: string[];
  hasMultipleImages: boolean;
  onIndexChange: (index: number) => void;
  currentIndex: number;
  children: React.ReactNode;
}

const ImageCarousel = ({ 
  id, 
  gallery, 
  hasMultipleImages, 
  onIndexChange,
  currentIndex,
  children 
}: ImageCarouselProps) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!hasMultipleImages || isHovered || gallery.length <= 1) return;

    const interval = setInterval(() => {
      onIndexChange((currentIndex + 1) % gallery.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [gallery.length, hasMultipleImages, isHovered, currentIndex, onIndexChange]);

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {hasMultipleImages && gallery.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {gallery.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex 
                  ? 'w-6 bg-amber-500' 
                  : 'w-1.5 bg-amber-500/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const UserDashboard = () => {
  const { isAuthenticated, isAdmin, user, loading: authLoading } = useAuth();
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellationBookingId, setCancellationBookingId] = useState<string | null>(null);
  // Track active image index for each booking
  const [bookingImageIndices, setBookingImageIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const bookings = await getMyBookingsForUI();
        setUserBookings(bookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, isAdmin]);

  // Wait for auth to finish loading before redirecting
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await requestBookingCancellation(bookingId);
      toast.success('Cancellation request submitted');
      setCancellationBookingId(null);
      
      // Refresh bookings
      const bookings = await getMyBookingsForUI();
      setUserBookings(bookings);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'outline';
      case 'pending':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      case 'refund_requested':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'outline';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-400';
      case 'completed':
        return '!border-amber-500/30 !bg-amber-500/10 !text-amber-400';
      case 'cancelled':
        return '';
      case 'refund_requested':
        return '!border-orange-500/30 !bg-orange-500/10 !text-orange-400';
      default:
        return '';
    }
  };

  const getPaymentBadgeClassName = (status: string) => {
    switch (status) {
      case 'paid':
        return '!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-400';
      case 'failed':
        return '';
      default:
        return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'refund_requested':
        return 'Refund Requested';
      default:
        return status;
    }
  };

  const getPaymentText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Payment Pending';
      case 'failed':
        return 'Payment Failed';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-100">My Dashboard</h1>
          <p className="text-slate-400">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats - Simple Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="card-hover border border-slate-700 bg-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1 font-medium">Total Bookings</p>
                  <p className="text-4xl font-bold text-slate-100">{userBookings.length}</p>
                </div>
                <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="h-7 w-7 text-slate-900" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-slate-700 bg-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1 font-medium">Active Bookings</p>
                  <p className="text-4xl font-bold text-slate-100">
                    {userBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length}
                  </p>
                </div>
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="h-7 w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-slate-700 bg-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1 font-medium">Total Spent</p>
                  <p className="text-4xl font-bold text-slate-100">
                    NPR {userBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalCost, 0)}
                  </p>
                </div>
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-slate-100">My Bookings</h2>
          {userBookings.length === 0 ? (
            <Card className="border border-slate-700 bg-slate-800 shadow-sm">
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No bookings yet</p>
                <p className="text-slate-400/70 text-sm mt-2">Start by browsing available tractors</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBookings.map((booking) => {
                const galleryRaw = [booking.tractorImage, ...(booking.tractorImages || [])].filter(Boolean);
                const gallery = Array.from(new Set(galleryRaw));
                const hasMultipleImages = gallery.length > 1;
                const currentIndex = bookingImageIndices[booking.id] || 0;
                const activeImage = gallery[currentIndex] || booking.tractorImage;

                return (
                  <Card
                    key={booking.id}
                    className="card-hover border border-slate-700 bg-slate-800 shadow-sm overflow-hidden bg-card"
                  >
                    {/* Tractor Image */}
                    <div className="aspect-video w-full overflow-hidden bg-muted relative">
                      <ImageCarousel
                        id={booking.id}
                        gallery={gallery}
                        hasMultipleImages={hasMultipleImages}
                        currentIndex={currentIndex}
                        onIndexChange={(newIndex) => {
                          setBookingImageIndices(prev => ({
                            ...prev,
                            [booking.id]: newIndex
                          }));
                        }}
                      >
                        <img
                          src={activeImage}
                          alt={booking.tractorName}
                          className="w-full h-full object-cover transition-opacity duration-500"
                        />
                      </ImageCarousel>
                    </div>
                  
                  {/* Booking Details */}
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4 text-secondary">{booking.tractorName}</h3>
                    
                    {/* Date and Time */}
                    <div className="space-y-3 mb-4 text-sm">
                      <div className="flex items-center text-foreground">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary">{new Date(booking.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-foreground">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary">
                            {new Date(booking.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(booking.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="border-t border-border pt-4 mb-4">
                      <p className="text-3xl font-bold text-primary">रू {booking.totalCost}</p>
                      <p className="text-xs text-slate-400 mt-1">Total amount</p>
                    </div>

                    {/* Status and Actions */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant={getStatusColor(booking.status)} 
                          className={`text-xs font-medium px-3 py-1 ${getStatusBadgeClassName(booking.status)}`}
                        >
                          {getStatusText(booking.status)}
                        </Badge>
                        <Badge 
                          variant={getPaymentStatusColor(booking.paymentStatus)} 
                          className={`text-xs font-medium px-3 py-1 ${getPaymentBadgeClassName(booking.paymentStatus)}`}
                        >
                          {getPaymentText(booking.paymentStatus)}
                        </Badge>
                      </div>
                      
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <Button
                          variant="destructive"
                          size="default"
                          className="w-full font-medium hover:opacity-90 transition-opacity"
                          onClick={() => setCancellationBookingId(booking.id)}
                        >
                          Cancel Booking
                        </Button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link to={`/tracking?bookingId=${booking.id}`}>Track Tractor</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Dialog */}
      <AlertDialog open={cancellationBookingId !== null} onOpenChange={() => setCancellationBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              {userBookings.find(b => b.id === cancellationBookingId)?.paymentStatus === 'paid'
                ? 'Are you sure you want to request a refund for this booking? A 3% fee will be deducted from your refund. This request will be reviewed by an admin.'
                : 'Are you sure you want to cancel this booking? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancellationBookingId && handleCancelBooking(cancellationBookingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserDashboard;
