import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Calendar, Filter, CheckCircle, XCircle, Play, Loader2, Eye, MapPin, Clock, DollarSign, User, Truck, Info, Settings, Activity, Package, CheckCircle2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { getAllBookingsForUI, approveRefund, rejectRefund, approveBooking, denyBooking, markBookingPaid, markBookingDelivered, markBookingCompleted, updateTractorDeliveryStatus, releasePayment } from '@/lib/api';
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
        <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold shadow-md">
          {gallery.length}
        </div>
      )}
    </div>
  );
};

const AdminBookings = () => {
  const { isAuthenticated, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  // Track active image index for each booking
  const [bookingImageIndices, setBookingImageIndices] = useState<Record<string, number>>({});
  // Track selected action for each booking
  const [selectedActions, setSelectedActions] = useState<Record<string, string>>({});
  // Track which booking is currently processing (sending email)
  const [processingBookings, setProcessingBookings] = useState<Set<string>>(new Set());
  // Track which booking details modal is open
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!isAuthenticated || (!isAdmin && !isSuperAdmin)) {
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
  }, [isAuthenticated, isAdmin, isSuperAdmin]);

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

  if (!isAuthenticated || (!isAdmin && !isSuperAdmin)) {
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
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      booking.userName?.toLowerCase().includes(searchLower) ||
      booking.tractorName?.toLowerCase().includes(searchLower) ||
      booking.id?.toString().includes(searchLower) ||
      booking.tractorId?.toString().includes(searchLower);
    return matchesStatus && matchesPayment && matchesAdminStatus && matchesSearch;
  });
  
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paymentFilter, adminStatusFilter, searchQuery]);

  const handleApproveRefund = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      const result = await approveRefund(bookingId);
      toast.success(`Refund approved: ${result.refundAmount.toFixed(2)} refunded (3% fee applied)`);
      
      // Refresh bookings
      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve refund');
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const handleRejectRefund = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      await rejectRefund(bookingId);
      toast.success('Refund request rejected');
      
      // Refresh bookings
      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject refund');
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      await approveBooking(bookingId);
      toast.success('Booking approved');
      
      // Refresh bookings - this will also trigger availability updates on tractors
      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
      
      // Update selectedBooking if it's the one being processed
      if (selectedBooking && selectedBooking.id === bookingId) {
        const updatedBooking = bookings.find(b => b.id === bookingId);
        if (updatedBooking) {
          setSelectedBooking(updatedBooking);
        }
      }
      
      // Note: Tractor availability and booking counts are now calculated dynamically
      // by the backend, so they will be updated on next fetch
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve booking');
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const handleDenyBooking = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
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
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const handleMarkPaid = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      await markBookingPaid(bookingId);
      toast.success('Payment marked as paid');

      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
      
      // Update selectedBooking if it's the one being processed
      if (selectedBooking && selectedBooking.id === bookingId) {
        const updatedBooking = bookings.find(b => b.id === bookingId);
        if (updatedBooking) {
          setSelectedBooking(updatedBooking);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to mark as paid');
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const handleMarkDelivered = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      await markBookingDelivered(bookingId);
      toast.success('Booking marked as delivered');

      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
      
      // Update selectedBooking if it's the one being processed
      if (selectedBooking && selectedBooking.id === bookingId) {
        const updatedBooking = bookings.find(b => b.id === bookingId);
        if (updatedBooking) {
          setSelectedBooking(updatedBooking);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to mark as delivered');
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const handleUpdateDeliveryStatus = async (bookingId: string, status: 'ORDERED' | 'DELIVERING' | 'DELIVERED' | 'RETURNED') => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      const statusMessages: Record<string, string> = {
        'ORDERED': 'Tractor marked as "Ready to Deliver"',
        'DELIVERING': 'Tractor marked as "On the Way"',
        'DELIVERED': 'Tractor marked as "At Customer"',
        'RETURNED': 'Tractor marked as "Back in Stock"'
      };
      
      const result = await updateTractorDeliveryStatus(bookingId, status);
      toast.success(statusMessages[status] || `Tractor status updated`);

      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(bookings.find(b => b.id === bookingId) || null);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update delivery status');
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      await markBookingCompleted(bookingId);
      toast.success('Booking marked as completed');

      const bookings = await getAllBookingsForUI();
      setAllBookings(bookings);
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(bookings.find(b => b.id === bookingId) || null);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to mark as completed');
    } finally {
      setProcessingBookings(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'outline';
      case 'pending':
        return 'secondary';
      case 'delivered':
        return 'outline';
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
      case 'delivered':
        return '!border-yellow-200 !bg-yellow-50 !text-yellow-700 justify-center';
      case 'completed':
        return '!border-amber-200 !bg-amber-50 !text-amber-700 justify-center';
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
  <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Manage Bookings</h1>
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

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">All Bookings ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, tractor, booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || adminStatusFilter !== 'all'
                    ? 'No bookings found matching your filters'
                    : 'No bookings found'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="w-[80px] text-foreground whitespace-nowrap">ID</TableHead>
                        <TableHead className="text-foreground whitespace-nowrap">Customer</TableHead>
                        <TableHead className="text-foreground whitespace-nowrap">Tractor</TableHead>
                        <TableHead className="text-foreground whitespace-nowrap">Date</TableHead>
                        <TableHead className="w-[100px] text-foreground whitespace-nowrap">Cost</TableHead>
                        <TableHead className="w-[120px] text-foreground whitespace-nowrap">Status</TableHead>
                        <TableHead className="w-[120px] text-foreground whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBookings.map((booking) => (
                        <TableRow key={booking.id} className="hover:bg-muted border-border">
                          <TableCell className="font-mono text-sm text-foreground whitespace-nowrap">#{booking.id}</TableCell>
                          <TableCell className="font-medium text-foreground whitespace-nowrap">{booking.userName}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <img 
                                src={booking.tractorImage} 
                                alt={booking.tractorName}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover"
                              />
                              <span className="text-xs sm:text-sm text-foreground">{booking.tractorName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="text-xs sm:text-sm">
                              <p className="font-medium text-foreground">{new Date(booking.startDate).toLocaleDateString()}</p>
                              <p className="text-muted-foreground text-xs hidden sm:block">
                                {new Date(booking.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                {new Date(booking.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground whitespace-nowrap text-xs sm:text-sm">रू {booking.totalCost.toLocaleString()}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge 
                              variant={getStatusColor(booking.status)}
                              className={getStatusBadgeClassName(booking.status) + " text-xs"}
                            >
                              {booking.status === 'refund_requested' ? 'Refund' : booking.status === 'delivered' ? 'Delivered' : booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedBooking(booking)}
                              className="w-full text-xs sm:text-sm"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                              <span className="hidden sm:inline">View Details</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  <span className="hidden sm:inline">Page {currentPage} of {totalPages} • </span>
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <PaginationItem key={page} className="hidden sm:block">
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Details Modal */}
        <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 bg-background border-border">
            {selectedBooking && (
              <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-card relative pr-20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                    <DialogTitle className="flex items-center gap-3 text-2xl mb-2 text-foreground">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                          <Truck className="h-6 w-6 text-white" />
                        </div>
                        <span>Booking #{selectedBooking.id}</span>
                      </DialogTitle>
                    <DialogDescription className="text-base mt-1 text-muted-foreground">
                        Complete booking information and management
                      </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge 
                        variant={getStatusColor(selectedBooking.status)}
                        className={getStatusBadgeClassName(selectedBooking.status) + " text-sm px-3 py-1"}
                        >
                        {selectedBooking.status === 'refund_requested' ? 'Refund Requested' : selectedBooking.status === 'delivered' ? 'Delivered' : selectedBooking.status}
                        </Badge>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted border-border">
                      <TabsTrigger value="overview" className="flex items-center gap-2 text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-amber-500">
                        <Info className="h-4 w-4" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="status" className="flex items-center gap-2 text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-amber-500">
                        <Activity className="h-4 w-4" />
                        Status & Tracking
                      </TabsTrigger>
                      <TabsTrigger value="actions" className="flex items-center gap-2 text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-amber-500">
                        <Settings className="h-4 w-4" />
                        Actions
                      </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4 mt-0">
                      {/* Quick Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-2 border-amber-500/30 bg-card">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                              <DollarSign className="h-5 w-5 text-amber-500" />
                              <span className="text-xs font-medium text-muted-foreground">Total Cost</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-500">रू {selectedBooking.totalCost.toLocaleString()}</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-border bg-card">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Customer</span>
                            </div>
                            <p className="text-lg font-semibold text-foreground">{selectedBooking.userName}</p>
                          </CardContent>
                        </Card>
                        <Card className="border border-border bg-card">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Tractor</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <img 
                                src={selectedBooking.tractorImage} 
                                alt={selectedBooking.tractorName}
                                className="w-8 h-8 rounded object-cover border border-border"
                              />
                              <p className="text-lg font-semibold text-foreground">{selectedBooking.tractorName}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Booking Period */}
                      <Card className="border border-border bg-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-foreground">
                            <Clock className="h-4 w-4" />
                            Booking Period
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Time</p>
                              <p className="text-lg font-semibold text-foreground">
                                {new Date(selectedBooking.startDate).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(selectedBooking.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End Time</p>
                              <p className="text-lg font-semibold text-foreground">
                                {new Date(selectedBooking.endDate).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(selectedBooking.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Delivery Address */}
                      {selectedBooking.deliveryAddress && (
                        <Card className="border border-border bg-card">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2 text-foreground">
                              <MapPin className="h-4 w-4" />
                              Delivery Address
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed text-foreground">{selectedBooking.deliveryAddress}</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Status & Tracking Tab */}
                    <TabsContent value="status" className="space-y-4 mt-0">
                      {/* Status Overview */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border border-border bg-card">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Booking Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                          <Badge 
                              variant={getStatusColor(selectedBooking.status)}
                              className={getStatusBadgeClassName(selectedBooking.status) + " text-sm px-3 py-1.5"}
                            >
                              {selectedBooking.status === 'refund_requested' ? 'Refund Requested' : selectedBooking.status === 'delivered' ? 'Delivered' : selectedBooking.status}
                            </Badge>
                          </CardContent>
                        </Card>
                        <Card className="border border-border bg-card">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge 
                              variant={getPaymentColor(selectedBooking.paymentStatus)}
                              className={getPaymentBadgeClassName(selectedBooking.paymentStatus) + " text-sm px-3 py-1.5"}
                            >
                              {selectedBooking.paymentStatus}
                            </Badge>
                          </CardContent>
                        </Card>
                        <Card className="border border-border bg-card">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Admin Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedBooking.adminStatus ? (
                              <Badge 
                                variant={selectedBooking.adminStatus === 'approved' ? 'outline' : selectedBooking.adminStatus === 'denied' ? 'destructive' : 'secondary'}
                            className={
                                  (selectedBooking.adminStatus === 'approved' 
                                ? '!border-green-500/30 !bg-green-500/10 !text-green-400' 
                                    : selectedBooking.adminStatus === 'denied'
                                ? ''
                                    : '!border-orange-500/30 !bg-orange-500/10 !text-orange-400') + " text-sm px-3 py-1.5"
                            }
                          >
                                {selectedBooking.adminStatus === 'pending_approval' ? 'Pending Approval' : selectedBooking.adminStatus}
                          </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Tractor Location with Timeline */}
                      <Card className="border border-border bg-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-foreground">
                            <Package className="h-4 w-4" />
                            Tractor Location & Journey
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const deliveryStatus = (selectedBooking as any).tractorDeliveryStatus;
                            const statusConfig: Record<string, { label: string; icon: string; color: string; step: number }> = {
                              'ORDERED': { label: 'Ready to Deliver', icon: '📦', color: '!border-blue-500/30 !bg-blue-500/10 !text-blue-400', step: 1 },
                              'DELIVERING': { label: 'On the Way', icon: '🚚', color: '!border-yellow-500/30 !bg-yellow-500/10 !text-yellow-400', step: 2 },
                              'DELIVERED': { label: 'At Customer', icon: '✅', color: '!border-green-500/30 !bg-green-500/10 !text-green-400', step: 3 },
                              'RETURNED': { label: 'Back in Stock', icon: '🏠', color: '!border-muted/60 !bg-muted !text-muted-foreground', step: 4 }
                            };
                            
                            const steps = [
                              { key: 'ORDERED', label: 'Ordered', icon: '📦' },
                              { key: 'DELIVERING', label: 'Delivering', icon: '🚚' },
                              { key: 'DELIVERED', label: 'Delivered', icon: '✅' },
                              { key: 'RETURNED', label: 'Returned', icon: '🏠' }
                            ];
                            
                            const currentStep = deliveryStatus ? (statusConfig[deliveryStatus]?.step || 0) : 0;
                            
                            return (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                  {!deliveryStatus ? (
                                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                                      <span className="mr-1">⏳</span>
                                      Not Started
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className={statusConfig[deliveryStatus]?.color + " text-sm px-3 py-1.5"}>
                                      <span className="mr-1">{statusConfig[deliveryStatus]?.icon}</span>
                                      {statusConfig[deliveryStatus]?.label}
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Progress Timeline */}
                                <div className="relative">
                                  <div className="flex items-center justify-between">
                                    {steps.map((step, index) => {
                                      const stepConfig = statusConfig[step.key];
                                      const isActive = currentStep >= (index + 1);
                                      const isCurrent = deliveryStatus === step.key;
                                      
                                      return (
                                        <div key={step.key} className="flex flex-col items-center flex-1 relative">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                            isActive 
                                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400 text-white' 
                                              : 'bg-muted border-border text-muted-foreground'
                                          } ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 scale-110' : ''}`}>
                                            <span className="text-lg">{step.icon}</span>
                                          </div>
                                          <p className={`text-xs mt-2 text-center font-medium ${
                                            isActive ? 'text-foreground' : 'text-muted-foreground'
                                          }`}>
                                            {step.label}
                                          </p>
                                          {index < steps.length - 1 && (
                                            <div className={`absolute top-5 left-[60%] w-full h-0.5 ${
                                              currentStep > (index + 1) ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-muted'
                                            }`} style={{ width: 'calc(100% - 2.5rem)' }} />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Actions Tab */}
                    <TabsContent value="actions" className="space-y-4 mt-0">
                      <Card className="border border-border bg-card">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                            <Settings className="h-5 w-5" />
                            Manage Booking
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(() => {
                            const availableActions: { value: string; label: string }[] = [];
                            const isCOD = selectedBooking.paymentMethod === 'CASH_ON_DELIVERY';
                            const currentDeliveryStatus = (selectedBooking as any).tractorDeliveryStatus;
                            
                            // If booking is already completed, no further actions
                            if (selectedBooking.status === 'completed') {
                              return (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Booking completed. No further actions available.
                                </p>
                              );
                            }
                            
                            if (selectedBooking.status === 'refund_requested') {
                              availableActions.push(
                                { value: 'approve_refund', label: 'Approve Refund' },
                                { value: 'reject_refund', label: 'Reject Refund' }
                              );
                            }
                            
                            // Approval actions - only for COD bookings
                            if (isCOD && selectedBooking.adminStatus === 'pending_approval') {
                              availableActions.push(
                                { value: 'approve_booking', label: 'Approve Booking' },
                                { value: 'deny_booking', label: 'Deny Booking' }
                              );
                            }
                            
                            // Payment and delivery actions (available before tractor is returned)
                            if (currentDeliveryStatus !== 'RETURNED') {
                              if (isCOD) {
                                // COD Flow: Approve → Deliver → Paid → Returned → Completed
                                // For COD: Can mark as delivered after approval (before payment)
                                // Check: adminStatus is approved, status is not delivered/completed/cancelled
                                if (selectedBooking.adminStatus === 'approved' && 
                                    selectedBooking.status !== 'delivered' && 
                                    selectedBooking.status !== 'completed' && 
                                    selectedBooking.status !== 'cancelled' &&
                                    currentDeliveryStatus !== 'DELIVERED') {
                                  availableActions.push({ value: 'mark_delivered', label: 'Mark as Delivered' });
                                }
                                // For COD: Can mark as paid after delivery (when cash is received)
                                // Check: status is delivered, paymentStatus is not paid
                                if (selectedBooking.status === 'delivered' && 
                                    selectedBooking.paymentStatus !== 'paid' &&
                                    currentDeliveryStatus === 'DELIVERED') {
                                  availableActions.push({ value: 'mark_paid', label: 'Mark as Paid (COD Received)' });
                                }
                              } else {
                                // eSewa Flow: Already confirmed (paid) → Deliver → Returned → Completed
                                // For eSewa: Booking is already confirmed/paid, so skip approval and payment steps
                                // Show "Mark as Delivered" if paid and not yet delivered/completed
                                if (selectedBooking.paymentStatus === 'paid' && 
                                    selectedBooking.status !== 'delivered' && 
                                    selectedBooking.status !== 'completed' && 
                                    selectedBooking.status !== 'cancelled' &&
                                    currentDeliveryStatus !== 'DELIVERED') {
                                  availableActions.push({ value: 'mark_delivered', label: 'Mark as Delivered' });
                                }
                              }
                            }
                            
                            // Mark as completed action (only after tractor is returned and booking time has ended)
                            if (currentDeliveryStatus === 'RETURNED' && selectedBooking.status !== 'completed') {
                              const bookingEndTime = new Date(selectedBooking.endDate);
                              const now = new Date();
                              const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
                              
                              // Allow completion if booking end time has passed or is within 1 hour
                              if (bookingEndTime <= oneHourFromNow) {
                                availableActions.push({ value: 'mark_completed', label: '✅ Mark as Completed' });
                              }
                            }
                            
                            // Release payment action (only for super admin, on completed bookings that haven't been released)
                            if (isSuperAdmin && selectedBooking.status === 'completed' && !selectedBooking.paymentReleased) {
                              availableActions.push({ value: 'release_payment', label: '💰 Release Payment (15% Commission)' });
                            }
                            
                            // Only allow delivery status changes if not already returned
                            // For COD: Allow after approval (even if not paid yet)
                            // For eSewa: Allow after payment (already confirmed, no approval needed)
                            const canChangeDeliveryStatus = 
                                selectedBooking.status !== 'cancelled' &&
                                currentDeliveryStatus !== 'RETURNED' &&
                                (
                                    (isCOD && selectedBooking.adminStatus === 'approved') ||
                                    (!isCOD && (selectedBooking.paymentStatus === 'paid' || selectedBooking.status === 'paid' || selectedBooking.status === 'delivered'))
                                );
                            
                            if (canChangeDeliveryStatus) {
                              if (!currentDeliveryStatus || currentDeliveryStatus === 'ORDERED') {
                                availableActions.push({ value: 'set_delivering', label: '🚚 Mark as "On the Way"' });
                              }
                              if (currentDeliveryStatus === 'DELIVERING') {
                                availableActions.push({ value: 'set_delivered', label: '✅ Mark as "At Customer"' });
                              }
                              if (currentDeliveryStatus === 'DELIVERED') {
                                availableActions.push({ value: 'set_returned', label: '🏠 Mark as "Back in Stock"' });
                              }
                            }
                            
                            if (availableActions.length === 0) {
                              return (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No actions available for this booking
                                </p>
                              );
                            }
                            
                            return (
                              <div className="space-y-2">
                                {availableActions.map((action) => {
                                  const isProcessing = processingBookings.has(selectedBooking.id);
                                  const isDisabled = (action as any).disabled || false;
                                  const handleAction = async () => {
                                    if (isDisabled) return;
                                    setProcessingBookings(prev => new Set(prev).add(selectedBooking.id));
                                    try {
                                      switch (action.value) {
                                        case 'approve_refund':
                                          await handleApproveRefund(selectedBooking.id);
                                          break;
                                        case 'reject_refund':
                                          await handleRejectRefund(selectedBooking.id);
                                          break;
                                        case 'approve_booking':
                                          await handleApproveBooking(selectedBooking.id);
                                          break;
                                        case 'deny_booking':
                                          await handleDenyBooking(selectedBooking.id);
                                          break;
                                        case 'mark_paid':
                                          await handleMarkPaid(selectedBooking.id);
                                          break;
                                        case 'mark_delivered':
                                          await handleMarkDelivered(selectedBooking.id);
                                          break;
                                        case 'set_delivering':
                                          await handleUpdateDeliveryStatus(selectedBooking.id, 'DELIVERING');
                                          break;
                                        case 'set_delivered':
                                          await handleUpdateDeliveryStatus(selectedBooking.id, 'DELIVERED');
                                          break;
                                        case 'set_returned':
                                          await handleUpdateDeliveryStatus(selectedBooking.id, 'RETURNED');
                                          break;
                                        case 'mark_completed':
                                          await handleMarkCompleted(selectedBooking.id);
                                          break;
                                        case 'release_payment':
                                          await handleReleasePayment(selectedBooking.id);
                                          break;
                                      }
                                      const bookings = await getAllBookingsForUI();
                                      setAllBookings(bookings);
                                      setSelectedBooking(bookings.find(b => b.id === selectedBooking.id) || null);
                                    } catch (error: any) {
                                      toast.error(error?.message || 'Action failed');
                                    } finally {
                                      setProcessingBookings(prev => {
                                        const updated = new Set(prev);
                                        updated.delete(selectedBooking.id);
                                        return updated;
                                      });
                                    }
                                  };
                                  
                                  return (
                              <Button
                                      key={action.value}
                                      variant={isDisabled ? "secondary" : "outline"}
                                      className="w-full justify-start"
                                      onClick={handleAction}
                                      disabled={isProcessing || isDisabled}
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Play className="h-4 w-4 mr-2" />
                                      )}
                                      {action.label}
                              </Button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminBookings;
