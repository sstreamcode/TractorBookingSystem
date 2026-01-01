import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Calendar, Clock, CreditCard, XCircle, Play, Square, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMyBookingsForUI, requestBookingCancellation, startUsage, stopUsage, getUsageDetails } from '@/lib/api';
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
  const { isAuthenticated, isAdmin, isSuperAdmin, isTractorOwner, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellationBookingId, setCancellationBookingId] = useState<string | null>(null);
  // Track active image index for each booking
  const [bookingImageIndices, setBookingImageIndices] = useState<Record<string, number>>({});
  // Track usage details for each booking
  const [usageDetails, setUsageDetails] = useState<Record<string, { isRunning: boolean; currentMinutes: number | null }>>({});
  const [processingBookings, setProcessingBookings] = useState<Set<string>>(new Set());
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Show 6 bookings per page for better grid layout

  useEffect(() => {
    if (!isAuthenticated || isAdmin || isSuperAdmin || isTractorOwner) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const bookings = await getMyBookingsForUI();
        setUserBookings(bookings);
        
        // Fetch usage details for delivered bookings
        for (const booking of bookings) {
          if (booking.status === 'delivered') {
            try {
              const details = await getUsageDetails(booking.id);
              setUsageDetails(prev => ({
                ...prev,
                [booking.id]: {
                  isRunning: details.isRunning,
                  currentMinutes: details.currentUsageMinutes
                }
              }));
            } catch (error) {
              console.error(`Failed to fetch usage details for booking ${booking.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, isAdmin, isSuperAdmin, isTractorOwner]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paymentFilter, searchQuery]);

  // Update running timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(usageDetails).forEach(bookingId => {
        const details = usageDetails[bookingId];
        if (details.isRunning && details.currentMinutes !== null) {
          setUsageDetails(prev => ({
            ...prev,
            [bookingId]: {
              ...prev[bookingId],
              currentMinutes: (prev[bookingId]?.currentMinutes || 0) + 1
            }
          }));
        }
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [usageDetails]);

  const handleStartUsage = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      const result = await startUsage(bookingId);
      toast.success('Usage timer started');
      
      // Fetch updated usage details
      try {
        const details = await getUsageDetails(bookingId);
        setUsageDetails(prev => ({
          ...prev,
          [bookingId]: {
            isRunning: details.isRunning,
            currentMinutes: details.currentUsageMinutes || 0
          }
        }));
      } catch (detailError) {
        // If getting details fails, still mark as running
        setUsageDetails(prev => ({
          ...prev,
          [bookingId]: {
            isRunning: true,
            currentMinutes: 0
          }
        }));
      }
      
      // Refresh bookings
      const bookings = await getMyBookingsForUI();
      setUserBookings(bookings);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to start usage timer';
      toast.error(errorMessage);
      console.error('Start usage error:', error);
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const handleStopUsage = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      const result = await stopUsage(bookingId);
      const finalPrice = result.finalPrice || 0;
      const refundAmount = result.refundAmount || 0;
      const refundMsg = refundAmount > 0 
        ? ` Refund: NPR ${refundAmount.toFixed(2)}` 
        : '';
      toast.success(`Usage stopped. Final price: NPR ${finalPrice.toFixed(2)}${refundMsg}`);
      
      // Update usage details
      setUsageDetails(prev => ({
        ...prev,
        [bookingId]: {
          isRunning: false,
          currentMinutes: result.actualUsageMinutes || 0
        }
      }));
      
      // Refresh bookings to get updated refund information
      const bookings = await getMyBookingsForUI();
      setUserBookings(bookings);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to stop usage timer';
      toast.error(errorMessage);
      console.error('Stop usage error:', error);
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const formatMinutes = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // Wait for auth to finish loading before redirecting
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-foreground">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (isSuperAdmin) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }
  if (isTractorOwner) {
    return <Navigate to="/tractor-owner/dashboard" replace />;
  }
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-foreground">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await requestBookingCancellation(bookingId);
      toast.success(t('dashboard.cancellation.success'));
      setCancellationBookingId(null);
      
      // Refresh bookings
      const bookings = await getMyBookingsForUI();
      setUserBookings(bookings);
    } catch (error: any) {
      toast.error(error?.message || t('dashboard.cancellation.failed'));
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
        return t('dashboard.status.confirmed');
      case 'pending':
        return t('dashboard.status.pending');
      case 'completed':
        return t('dashboard.status.completed');
      case 'cancelled':
        return t('dashboard.status.cancelled');
      case 'refund_requested':
        return t('dashboard.status.refund_requested');
      default:
        return status;
    }
  };

  const getPaymentText = (status: string) => {
    switch (status) {
      case 'paid':
        return t('dashboard.payment.paid');
      case 'pending':
        return t('dashboard.payment.pending');
      case 'failed':
        return t('dashboard.payment.failed');
      default:
        return status;
    }
  };

  // Filter, search, and sort bookings
  const filteredBookings = userBookings
    .filter(booking => {
      const bookingStatus = booking.status || '';
      const paymentStatus = booking.paymentStatus || '';
      const tractorName = booking.tractorName || '';
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      // Payment filter
      const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
      
      // Search filter (by tractor name or status)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        tractorName.toLowerCase().includes(searchLower) ||
        bookingStatus.toLowerCase().includes(searchLower);
      
      return matchesStatus && matchesPayment && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by most recent first (by start date or booking ID)
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      
      if (idA !== idB) {
        return idB - idA; // Higher ID (more recent) first
      }
      
      // Fallback to start date
      const dateA = new Date(a.startDate || 0).getTime();
      const dateB = new Date(b.startDate || 0).getTime();
      return dateB - dateA; // Most recent first
    });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('dashboard.welcome')}, {user?.name}!</p>
        </div>

        {/* Stats - Simple Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="card-hover border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{t('dashboard.stats.totalBookings')}</p>
                  <p className="text-4xl font-bold text-foreground">{userBookings.length}</p>
                </div>
                <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="h-7 w-7 text-slate-900" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{t('dashboard.stats.activeBookings')}</p>
                  <p className="text-4xl font-bold text-foreground">
                    {userBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length}
                  </p>
                </div>
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="h-7 w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{t('dashboard.stats.totalSpent')}</p>
                  <p className="text-4xl font-bold text-foreground">
                    NPR {Math.round((userBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalCost, 0)) * 100) / 100}
                  </p>
                </div>
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Bookings Section */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('dashboard.myBookings')}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Manage and track your tractor bookings</p>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Filter className="h-5 w-5" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Bookings</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by tractor name or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Grid */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">
                My Bookings ({filteredBookings.length})
                {filteredBookings.length > itemsPerPage && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">{t('dashboard.empty.title')}</p>
                  <p className="text-muted-foreground/80 text-sm mt-2">
                    {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                      ? 'No bookings match your search criteria'
                      : t('dashboard.empty.subtitle')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {paginatedBookings.map((booking) => {
                const galleryRaw = [booking.tractorImage, ...(booking.tractorImages || [])].filter(Boolean);
                const gallery = Array.from(new Set(galleryRaw));
                const hasMultipleImages = gallery.length > 1;
                const currentIndex = bookingImageIndices[booking.id] || 0;
                const activeImage = gallery[currentIndex] || booking.tractorImage;

                return (
                  <Card
                    key={booking.id}
                    className="card-hover border border-border bg-card shadow-sm overflow-hidden"
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
                    <h3 className="font-semibold text-lg mb-4 text-foreground">{booking.tractorName}</h3>
                    
                    {/* Date and Time */}
                    <div className="space-y-3 mb-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{new Date(booking.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center mr-3">
                          <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {new Date(booking.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(booking.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="border-t border-border pt-4 mb-4">
                      {booking.finalPrice ? (
                        <>
                          <div className="flex items-baseline gap-2">
                            {booking.initialPrice && booking.initialPrice !== booking.finalPrice && (
                              <p className="text-lg line-through text-muted-foreground">NPR {booking.initialPrice.toFixed(2)}</p>
                            )}
                            <p className="text-3xl font-bold text-amber-500">NPR {booking.finalPrice.toFixed(2)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Final amount (based on actual usage)</p>
                          {booking.actualUsageMinutes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Used: {formatMinutes(booking.actualUsageMinutes)} | Booked: {formatMinutes(booking.bookedMinutes || 0)}
                            </p>
                          )}
                          {booking.refundAmount && booking.refundAmount > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                              Refund: NPR {booking.refundAmount.toFixed(2)} (overpayment will be refunded)
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-amber-500">NPR {booking.totalCost.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {booking.status === 'delivered' ? 'Initial amount (will be adjusted after usage)' : t('dashboard.totalAmount') || 'Total amount'}
                          </p>
                          {booking.bookedMinutes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Booked: {formatMinutes(booking.bookedMinutes)} (Minimum: 30 min)
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Usage Timer - Only for delivered bookings with DELIVERED delivery status */}
                    {(() => {
                      const deliveryStatus = (booking as any).tractorDeliveryStatus;
                      const canStartTimer = booking.status === 'delivered' && 
                                           deliveryStatus === 'DELIVERED' &&
                                           booking.status !== 'completed' &&
                                           deliveryStatus !== 'RETURNED';
                      const canUseTimer = booking.status === 'delivered' && deliveryStatus !== 'RETURNED';
                      
                      if (!canUseTimer) return null;
                      
                      return (
                        <div className="border-t border-border pt-4 mb-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">Usage Timer</span>
                              {usageDetails[booking.id]?.isRunning && (
                                <span className="text-sm font-bold text-amber-500 animate-pulse">
                                  {formatMinutes(usageDetails[booking.id]?.currentMinutes || 0)}
                                </span>
                              )}
                              {!usageDetails[booking.id]?.isRunning && booking.actualUsageMinutes && (
                                <span className="text-sm text-muted-foreground">
                                  {formatMinutes(booking.actualUsageMinutes)}
                                </span>
                              )}
                            </div>
                            
                            {!canStartTimer && !booking.actualUsageStartTime && (
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                  {deliveryStatus === 'RETURNED' || booking.status === 'completed'
                                    ? 'Tractor has been returned. Timer cannot be started.'
                                    : deliveryStatus !== 'DELIVERED'
                                    ? 'Waiting for tractor to be delivered to your location'
                                    : 'Cannot start timer at this time'}
                                </p>
                              </div>
                            )}
                            
                            {canStartTimer && !booking.actualUsageStartTime && (
                              <Button
                                onClick={() => handleStartUsage(booking.id)}
                                disabled={processingBookings.has(booking.id)}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Usage
                              </Button>
                            )}
                            
                            {booking.actualUsageStartTime && !booking.actualUsageStopTime && (
                              <Button
                                onClick={() => handleStopUsage(booking.id)}
                                disabled={processingBookings.has(booking.id)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white"
                              >
                                <Square className="h-4 w-4 mr-2" />
                                Stop Usage
                              </Button>
                            )}
                            
                            {booking.actualUsageStopTime && (
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Usage completed</p>
                                <p className="text-sm font-medium text-foreground mt-1">
                                  Final price will be calculated by owner
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

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
                          {t('dashboard.cancelBooking')}
                        </Button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link to={`/tracking?bookingId=${String(booking.id)}`}>{t('dashboard.trackTractor')}</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                    );
                  })}
                  </div>
                  
                  {/* Pagination */}
                  {filteredBookings.length > 0 && (
                    <div className="mt-6 flex flex-col items-center gap-2 sm:gap-4">
                      <div className="text-xs sm:text-sm text-muted-foreground font-medium text-center">
                        <span className="hidden sm:inline">Page {currentPage} of {totalPages} • </span>
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
                      </div>
                      {totalPages > 1 && (
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => {
                                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                                }}
                                disabled={currentPage === 1}
                                className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
                              >
                                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Previous</span>
                              </Button>
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              // Show first page, last page, current page, and pages around current
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={page} className="hidden sm:block">
                                    <Button
                                      variant={currentPage === page ? "default" : "outline"}
                                      size="default"
                                      onClick={() => setCurrentPage(page)}
                                      className={`h-8 sm:h-9 min-w-8 sm:min-w-9 ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
                                    >
                                      {page}
                                    </Button>
                                  </PaginationItem>
                                );
                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return (
                                  <PaginationItem key={page} className="hidden sm:block">
                                    <span className="px-2 text-muted-foreground">...</span>
                                  </PaginationItem>
                                );
                              }
                              return null;
                            })}
                            <PaginationItem>
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => {
                                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                }}
                                disabled={currentPage === totalPages}
                                className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
                              >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
                              </Button>
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancellation Dialog */}
      <AlertDialog open={cancellationBookingId !== null} onOpenChange={() => setCancellationBookingId(null)}>
          <AlertDialogContent className="border border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t('dashboard.cancelDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {userBookings.find(b => b.id === cancellationBookingId)?.paymentStatus === 'paid'
                ? t('dashboard.cancelDialog.description.paid')
                : t('dashboard.cancelDialog.description.unpaid')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-muted">{t('dashboard.cancelDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancellationBookingId && handleCancelBooking(cancellationBookingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('dashboard.cancelDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserDashboard;
