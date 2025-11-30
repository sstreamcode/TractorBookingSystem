import { Navigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Tractor, 
  Users, 
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllBookings, fetchTractors, type TractorApiModel, type BookingApiModel } from '@/lib/api';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminReports = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [tractors, setTractors] = useState<TractorApiModel[]>([]);
  const [bookings, setBookings] = useState<BookingApiModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tractorsData, bookingsData] = await Promise.all([
          fetchTractors(),
          fetchAllBookings()
        ]);
        setTractors(tractorsData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Failed to fetch reports data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-slate-100">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-slate-100">Loading reports...</p>
        </div>
      </div>
    );
  }

  // Helper function to check if a booking is paid
  // A booking is considered paid if:
  // 1. It has a payment with status 'SUCCESS' in the payments array, OR
  // 2. The booking status is 'PAID', 'DELIVERED', or 'COMPLETED' (for non-COD payments)
  const isBookingPaid = (booking: BookingApiModel): boolean => {
    // Check payments array first (most reliable)
    if (booking.payments && booking.payments.length > 0) {
      const hasSuccessfulPayment = booking.payments.some(p => p.status === 'SUCCESS');
      if (hasSuccessfulPayment) return true;
    }
    
    // For non-COD payments, if status indicates payment was processed, consider it paid
    if (booking.paymentMethod !== 'CASH_ON_DELIVERY') {
      if (booking.status === 'PAID' || booking.status === 'DELIVERED' || booking.status === 'COMPLETED') {
        return true;
      }
    }
    
    // For COD, only consider paid if there's a SUCCESS payment
    // (COD can be DELIVERED/COMPLETED before payment)
    return false;
  };

  // Helper function to check if a booking is successful/completed
  // A booking is successful if it's completed (tractor returned) and paid
  const isBookingSuccessful = (booking: BookingApiModel): boolean => {
    return (booking.status === 'COMPLETED' || booking.status === 'DELIVERED') && isBookingPaid(booking);
  };

  // Calculate all metrics
  const totalBookings = bookings.length;
  
  // Paid bookings: any booking that has been paid (regardless of final status)
  const paidBookings = bookings.filter(isBookingPaid);
  
  // Successful bookings: completed/delivered AND paid
  const successfulBookings = bookings.filter(isBookingSuccessful);
  
  // Status-based filtering
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
  const refundRequested = bookings.filter(b => b.status === 'REFUND_REQUESTED');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const deliveredBookings = bookings.filter(b => b.status === 'DELIVERED');
  
  // Total revenue from all paid bookings
  const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const averageBookingValue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0;
  
  const activeUsers = new Set(bookings.map(b => b.user?.id)).size;
  const totalTractors = tractors.length;
  const availableTractors = tractors.filter(t => t.available).length;
  
  // Booking trends - last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentBookings = bookings.filter(b => new Date(b.startAt) >= thirtyDaysAgo);
  
  // Revenue trends - from paid bookings in last 30 days
  const recentRevenue = recentBookings
    .filter(isBookingPaid)
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  
  // Most popular tractors
  const tractorStats = tractors.map(tractor => {
    const tractorBookings = bookings.filter(b => b.tractor?.id === tractor.id);
    const paidForThis = tractorBookings.filter(isBookingPaid).length;
    const revenue = tractorBookings
      .filter(isBookingPaid)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    return {
      id: tractor.id,
      name: tractor.name,
      model: tractor.model,
      bookingsCount: tractorBookings.length,
      paidCount: paidForThis,
      revenue: revenue,
      utilizationRate: totalBookings > 0 ? (tractorBookings.length / totalBookings) * 100 : 0
    };
  });
  
  const popularTractors = [...tractorStats]
    .sort((a, b) => b.bookingsCount - a.bookingsCount)
    .slice(0, 5);
  
  // Status distribution percentages - based on actual status
  const statusDistribution = {
    paid: (paidBookings.length / totalBookings) * 100 || 0,
    pending: (pendingBookings.length / totalBookings) * 100 || 0,
    cancelled: (cancelledBookings.length / totalBookings) * 100 || 0,
    refundRequested: (refundRequested.length / totalBookings) * 100 || 0,
    completed: (completedBookings.length / totalBookings) * 100 || 0,
    delivered: (deliveredBookings.length / totalBookings) * 100 || 0
  };
  
  // Payment method stats - based on paid bookings
  const paymentMethods = {
    eSewa: paidBookings.filter(b => b.paymentMethod !== 'CASH_ON_DELIVERY').length,
    cod: paidBookings.filter(b => b.paymentMethod === 'CASH_ON_DELIVERY').length
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Header with Tractor Sewa branding - Amber/Orange theme
    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // White text on amber background
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Tractor Sewa', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SECURE RENTAL PLATFORM', pageWidth / 2, 28, { align: 'center' });
    
    // Report title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    yPosition = 55;
    doc.text('Business Reports & Analytics', pageWidth / 2, yPosition, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    yPosition += 8;
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;

    // Key Metrics Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Key Performance Metrics', 14, yPosition);
    yPosition += 8;

    // Metrics in a table format
    // Using "Rs." instead of "रू" for PDF compatibility
    const metricsData = [
      ['Total Revenue', `Rs. ${totalRevenue.toLocaleString()}`],
      ['Average Booking Value', `Rs. ${Math.round(averageBookingValue).toLocaleString()}`],
      ['Total Bookings', totalBookings.toString()],
      ['Paid Bookings', paidBookings.length.toString()],
      ['Successful Bookings', successfulBookings.length.toString()],
      ['Success Rate', `${totalBookings > 0 ? Math.round((successfulBookings.length / totalBookings) * 100) : 0}%`],
      ['Total Customers', activeUsers.toString()],
      ['Total Tractors', totalTractors.toString()],
      ['Available Tractors', availableTractors.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'striped',
      headStyles: { 
        fillColor: [245, 158, 11], // amber-500
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Booking Status Distribution
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Booking Status Distribution', 14, yPosition);
    yPosition += 8;

    const statusData = [
      ['Completed', completedBookings.length.toString(), `${statusDistribution.completed.toFixed(1)}%`],
      ['Delivered', deliveredBookings.length.toString(), `${statusDistribution.delivered.toFixed(1)}%`],
      ['Paid', paidBookings.length.toString(), `${statusDistribution.paid.toFixed(1)}%`],
      ['Pending', pendingBookings.length.toString(), `${statusDistribution.pending.toFixed(1)}%`],
      ['Cancelled', cancelledBookings.length.toString(), `${statusDistribution.cancelled.toFixed(1)}%`],
      ['Refund Requested', refundRequested.length.toString(), `${statusDistribution.refundRequested.toFixed(1)}%`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      theme: 'striped',
      headStyles: { 
        fillColor: [245, 158, 11], // amber-500
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Revenue Trends
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue Trends (Last 30 Days)', 14, yPosition);
    yPosition += 8;

    const revenueData = [
      ['Period', 'Revenue', 'Bookings'],
      ['Last 30 Days', `Rs. ${recentRevenue.toLocaleString()}`, recentBookings.filter(isBookingPaid).length.toString()],
      ['All Time', `Rs. ${totalRevenue.toLocaleString()}`, paidBookings.length.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [revenueData[0]],
      body: revenueData.slice(1),
      theme: 'striped',
      headStyles: { 
        fillColor: [245, 158, 11], // amber-500
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Payment Methods
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Methods', 14, yPosition);
    yPosition += 8;

    const paymentData = [
      ['eSewa', paymentMethods.eSewa.toString()],
      ['Cash on Delivery (COD)', paymentMethods.cod.toString()],
      ['Total Paid', paidBookings.length.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Payment Method', 'Count']],
      body: paymentData,
      theme: 'striped',
      headStyles: { 
        fillColor: [245, 158, 11], // amber-500
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Top Tractors
    if (popularTractors.length > 0) {
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Performing Tractors', 14, yPosition);
      yPosition += 8;

      const tractorData = popularTractors.map((t, idx) => [
        (idx + 1).toString(),
        t.name || 'N/A',
        t.model || 'N/A',
        t.bookingsCount.toString(),
        `Rs. ${t.revenue.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Rank', 'Tractor Name', 'Model', 'Bookings', 'Revenue']],
        body: tractorData,
        theme: 'striped',
        headStyles: { 
          fillColor: [245, 158, 11], // amber-500
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { fontSize: 9, cellPadding: 2 },
        margin: { left: 14, right: 14 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Footer on each page
    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Tractor Sewa - Secure Rental Platform | Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    };

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    // Save the PDF
    const fileName = `Tractor_Sewa_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-slate-100">Reports & Insights</h1>
            <p className="text-slate-400">Comprehensive analytics and business insights</p>
          </div>
          <Button
            onClick={generatePDF}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-amber-500/50"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-amber-500/30 bg-slate-800 shadow-sm hover:shadow-amber-500/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-slate-100">रू {totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-amber-500 font-medium">All time</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-500/30 bg-slate-800 shadow-sm hover:shadow-amber-500/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1 font-medium">Avg Booking Value</p>
                  <p className="text-3xl font-bold text-slate-100">रू {Math.round(averageBookingValue).toLocaleString()}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-amber-500 font-medium">Per transaction</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <Activity className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-500/30 bg-slate-800 shadow-sm hover:shadow-amber-500/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1 font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-slate-100">
                    {totalBookings > 0 ? Math.round((successfulBookings.length / totalBookings) * 100) : 0}%
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-amber-500 font-medium">Completed & Paid</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <PieChart className="h-7 w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-500/30 bg-slate-800 shadow-sm hover:shadow-amber-500/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1 font-medium">Total Customers</p>
                  <p className="text-3xl font-bold text-slate-100">{activeUsers}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <Users className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-amber-500 font-medium">Active users</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Booking Status Distribution */}
          <Card className="border border-slate-700 bg-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Booking Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-amber-500 mr-2" />
                      <span className="text-sm font-medium text-slate-100">Completed</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-100">
                      {completedBookings.length} ({statusDistribution.completed.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all" 
                      style={{ width: `${statusDistribution.completed}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-slate-100">Paid</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-100">
                      {paidBookings.length} ({statusDistribution.paid.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all" 
                      style={{ width: `${statusDistribution.paid}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-slate-100">Pending</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-100">
                      {pendingBookings.length} ({statusDistribution.pending.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all" 
                      style={{ width: `${statusDistribution.pending}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-slate-100">Refund Requested</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-100">
                      {refundRequested.length} ({statusDistribution.refundRequested.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all" 
                      style={{ width: `${statusDistribution.refundRequested}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-slate-100">Cancelled</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-100">
                      {cancelledBookings.length} ({statusDistribution.cancelled.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all" 
                      style={{ width: `${statusDistribution.cancelled}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Utilization */}
          <Card className="border border-slate-700 bg-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center">
                <Tractor className="mr-2 h-5 w-5" />
                Fleet Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center">
                    <Tractor className="h-5 w-5 text-amber-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">Total Tractors</p>
                      <p className="text-xs text-slate-400">In fleet</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-slate-100">{totalTractors}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-amber-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">Available</p>
                      <p className="text-xs text-slate-400">Ready to rent</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-500">{availableTractors}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-orange-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">Utilization Rate</p>
                      <p className="text-xs text-slate-400">Based on bookings</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-slate-100">
                    {totalTractors > 0 ? Math.round((bookings.length / totalTractors / totalBookings) * 100 || 0) : 0}%
                  </span>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border-2 border-amber-500/20">
                  <p className="text-sm font-semibold text-amber-400 mb-1">Recent Activity</p>
                  <p className="text-xs text-slate-300">
                    {recentBookings.length} bookings in the last 30 days
                  </p>
                  <p className="text-xs text-slate-300">
                    रू {recentRevenue.toLocaleString()} revenue generated
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Tractors */}
        <Card className="border border-slate-700 bg-slate-800 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Most Popular Tractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularTractors.length === 0 ? (
              <p className="text-sm text-slate-400">No tractor statistics available yet</p>
            ) : (
              <div className="space-y-4">
                {popularTractors.map((tractor, index) => (
                  <div key={tractor.id} className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-white">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{tractor.name}</p>
                        <p className="text-sm text-slate-400">{tractor.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Bookings</p>
                        <p className="font-semibold text-slate-100">{tractor.bookingsCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Revenue</p>
                        <p className="font-semibold text-amber-500">रू {tractor.revenue.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Utilization</p>
                        <p className="font-semibold text-amber-500">{tractor.utilizationRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border border-slate-700 bg-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-100">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Bookings</span>
                  <span className="font-semibold text-slate-100">{totalBookings}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Successful</span>
                  <span className="font-semibold text-amber-500">{successfulBookings.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Paid</span>
                  <span className="font-semibold text-orange-500">{paidBookings.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Cancelled</span>
                  <span className="font-semibold text-red-500">{cancelledBookings.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Refund Pending</span>
                  <span className="font-semibold text-orange-500">{refundRequested.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-700 bg-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-100">Revenue Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Revenue</span>
                  <span className="font-semibold text-amber-500">रू {totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Avg per Booking</span>
                  <span className="font-semibold text-slate-100">रू {Math.round(averageBookingValue).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Last 30 Days</span>
                  <span className="font-semibold text-amber-500">रू {recentRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Success Rate</span>
                  <span className="font-semibold text-amber-500">
                    {totalBookings > 0 ? Math.round((successfulBookings.length / totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-700 bg-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-100">Business Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Customers</span>
                  <span className="font-semibold text-slate-100">{activeUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Active Fleet</span>
                  <span className="font-semibold text-amber-500">{availableTractors}/{totalTractors}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Fleet Size</span>
                  <span className="font-semibold text-slate-100">{totalTractors}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Growth Potential</span>
                  <span className="font-semibold text-amber-500">
                    {totalTractors > 0 ? Math.round((availableTractors / totalTractors) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;

