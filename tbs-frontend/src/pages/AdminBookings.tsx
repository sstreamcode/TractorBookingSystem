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
import { getAllBookingsForUI, approveRefund, rejectRefund } from '@/lib/api';
import type { Booking } from '@/types';
import { toast } from 'sonner';

const AdminBookings = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="container mx-auto px-4 py-8">
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
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const filteredBookings = allBookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
    return matchesStatus && matchesPayment;
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
        return '!border-blue-200 !bg-blue-50 !text-blue-700 justify-center';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Manage Bookings</h1>
          <p className="text-gray-600">View and manage all tractor bookings</p>
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

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">All Bookings ({filteredBookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No bookings found</p>
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
                          <img 
                            src={booking.tractorImage} 
                            alt={booking.tractorName}
                            className="w-10 h-10 rounded object-cover"
                          />
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
                        {booking.status === 'refund_requested' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveRefund(booking.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectRefund(booking.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
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
