import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Calendar, Filter, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { getAllBookingsForUI, approveRefund, rejectRefund, approveBooking, denyBooking, markBookingPaid, markBookingDelivered } from '@/lib/api';
import type { Booking } from '@/types';
import { toast } from 'sonner';

// Reusable carousel component for small images
interface SmallImageCarouselProps {
  id: string;
  gallery: string[];
  hasMultipleImages: boolean;
  onIndexChange: (index: number) => void;
  currentIndex: number;
  className?: string;
}

const SmallImageCarousel = ({ 
  id, 
  gallery, 
  hasMultipleImages, 
  onIndexChange,
  currentIndex,
  className = "w-10 h-10 rounded object-cover"
}: SmallImageCarouselProps) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!hasMultipleImages || isHovered || gallery.length <= 1) return;

    const interval = setInterval(() => {
      onIndexChange((currentIndex + 1) % gallery.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [gallery.length, hasMultipleImages, isHovered, currentIndex, onIndexChange]);

  const activeImage = gallery[currentIndex] || gallery[0];

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={activeImage} 
        alt={`Image ${currentIndex + 1}`}
        className={className}
      />
      {hasMultipleImages && gallery.length > 1 && (
        <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
          {gallery.length}
        </div>
      )}
    </div>
  );
};

const AdminBookings = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  // Track active image index for each booking
  const [bookingImageIndices, setBookingImageIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const bookings = await getAllBookingsForUI();
        setAllBookings(bookings);
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const filteredBookings = allBookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
    const matchesAdminStatus = adminStatusFilter === 'all' || booking.adminStatus === adminStatusFilter;
    return matchesStatus && matchesPayment && matchesAdminStatus;
  });

  const handleApproveRefund = async (bookingId: string) => {
    try {
      const result = await approveRefund(bookingId);
      toast.success(`Refund approved: ${result.refundAmount.toFixed(2)} refunded (3% fee applied)`);
      
      // Refresh bookings
      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve refund');
    }
  };

  const handleRejectRefund = async (bookingId: string) => {
    try {
      await rejectRefund(bookingId);
      toast.success('Refund request rejected');
      
      // Refresh bookings
      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject refund');
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      await approveBooking(bookingId);
      toast.success('Booking approved');
      
      // Refresh bookings - this will also trigger availability updates on tractors
      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
      
      // Note: Tractor availability and booking counts are now calculated dynamically
      // by the backend, so they will be updated on next fetch
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve booking');
    }
  };

  const handleDenyBooking = async (bookingId: string) => {
    try {
      await denyBooking(bookingId);
      toast.success('Booking denied');
      
      // Refresh bookings - this will also trigger availability updates on tractors
      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
      
      // Note: Tractor availability and booking counts are now calculated dynamically
      // by the backend, so they will be updated on next fetch
    } catch (error: any) {
      toast.error(error?.message || 'Failed to deny booking');
    }
  };

  const handleMarkPaid = async (bookingId: string) => {
    try {
      await markBookingPaid(bookingId);
      toast.success('Payment marked as paid');

      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to mark as paid');
    }
  };

  const handleMarkDelivered = async (bookingId: string) => {
    try {
      await markBookingDelivered(bookingId);
      toast.success('Booking marked as delivered');

      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to mark as delivered');
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

  const getPaymentColor = (status: string) => {
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
        return '!border-green-200 !bg-green-50 !text-green-700 justify-center';
      case 'completed':
        return '!border-primary/20 !bg-primary/10 !text-primary justify-center';
      case 'cancelled':
        return 'justify-center';
      case 'refund_requested':
        return '!border-orange-200 !bg-orange-50 !text-orange-700 justify-center';
      default:
        return 'justify-center';
    }
  };

  const getPaymentBadgeClassName = (status: string) => {
    switch (status) {
      case 'paid':
        return '!border-green-200 !bg-green-50 !text-green-700 justify-center';
      case 'failed':
        return 'justify-center';
      default:
        return 'justify-center';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-secondary">Manage Bookings</h1>
          <p className="text-muted-foreground">View and manage all tractor bookings</p>
        </div>

        <div className="mb-6 flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refund_requested">Refund Requested</SelectItem>
            </SelectContent>
          </Select>

          <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by admin status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Admin Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-secondary">All Bookings ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bookings found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Tractor</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Admin Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-transparent">
                      <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                      <TableCell>{booking.userName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const galleryRaw = [booking.tractorImage, ...(booking.tractorImages || [])].filter(Boolean);
                            const gallery = Array.from(new Set(galleryRaw));
                            const hasMultipleImages = gallery.length > 1;
                            const currentIndex = bookingImageIndices[booking.id] || 0;
                            
                            return (
                              <SmallImageCarousel
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
                              />
                            );
                          })()}
                          <span className="font-medium">{booking.tractorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(booking.startDate).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">
                            {new Date(booking.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(booking.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">रू {booking.totalCost}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusColor(booking.status)}
                          className={getStatusBadgeClassName(booking.status)}
                        >
                          {booking.status === 'refund_requested' ? 'Refund Requested' : booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getPaymentColor(booking.paymentStatus)}
                          className={getPaymentBadgeClassName(booking.paymentStatus)}
                        >
                          {booking.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.adminStatus && (
                          <Badge 
                            variant={booking.adminStatus === 'approved' ? 'outline' : booking.adminStatus === 'denied' ? 'destructive' : 'secondary'}
                            className={
                              booking.adminStatus === 'approved' 
                                ? '!border-green-200 !bg-green-50 !text-green-700' 
                                : booking.adminStatus === 'denied'
                                ? ''
                                : '!border-orange-200 !bg-orange-50 !text-orange-700'
                            }
                          >
                            {booking.adminStatus === 'pending_approval' ? 'Pending Approval' : booking.adminStatus}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {booking.status === 'refund_requested' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveRefund(booking.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve Refund
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectRefund(booking.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject Refund
                              </Button>
                            </>
                          )}
                          {booking.adminStatus === 'pending_approval' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApproveBooking(booking.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDenyBooking(booking.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Deny
                              </Button>
                            </>
                          )}
                          {booking.adminStatus === 'approved' && (
                            <Badge variant="outline" className="!border-green-200 !bg-green-50 !text-green-700">
                              Approved
                            </Badge>
                          )}
                          {booking.adminStatus === 'denied' && (
                            <Badge variant="destructive">
                              Denied
                            </Badge>
                          )}
                          {booking.paymentStatus !== 'paid' && booking.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleMarkPaid(booking.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                          {booking.paymentStatus === 'paid' && booking.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleMarkDelivered(booking.id)}
                            >
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBookings;
