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
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  // Calculate all metrics
  const totalBookings = bookings.length;
  // Paid bookings include both PAID and DELIVERED status (both are paid)
  const paidBookings = bookings.filter(b => b.status === 'PAID' || b.status === 'DELIVERED');
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
  const refundRequested = bookings.filter(b => b.status === 'REFUND_REQUESTED');
  
  const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const averageBookingValue = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0;
  
  const activeUsers = new Set(bookings.map(b => b.user?.id)).size;
  const totalTractors = tractors.length;
  const availableTractors = tractors.filter(t => t.available).length;
  
  // Booking trends - last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentBookings = bookings.filter(b => new Date(b.startAt) >= thirtyDaysAgo);
  
  // Revenue trends
  const recentRevenue = recentBookings
    .filter(b => b.status === 'PAID' || b.status === 'DELIVERED')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  
  // Most popular tractors
  const tractorStats = tractors.map(tractor => {
    const tractorBookings = bookings.filter(b => b.tractor?.id === tractor.id);
    const paidForThis = tractorBookings.filter(b => b.status === 'PAID' || b.status === 'DELIVERED').length;
    const revenue = tractorBookings
      .filter(b => b.status === 'PAID' || b.status === 'DELIVERED')
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
  
  // Status distribution percentages
  const statusDistribution = {
    paid: (paidBookings.length / totalBookings) * 100 || 0,
    pending: (pendingBookings.length / totalBookings) * 100 || 0,
    cancelled: (cancelledBookings.length / totalBookings) * 100 || 0,
    refundRequested: (refundRequested.length / totalBookings) * 100 || 0
  };
  
  // Payment method stats (simplified - assuming most are eSewa or COD)
  const paymentMethods = {
    eSewa: paidBookings.filter(b => (b.status === 'PAID' || b.status === 'DELIVERED') && b.paymentMethod !== 'CASH_ON_DELIVERY').length,
    cod: paidBookings.filter(b => (b.status === 'PAID' || b.status === 'DELIVERED') && b.paymentMethod === 'CASH_ON_DELIVERY').length
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

    // Header with Tractor Sewa branding
    doc.setFillColor(16, 185, 129); // Primary green color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // White text on green background
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
      ['Success Rate', `${totalBookings > 0 ? Math.round((paidBookings.length / totalBookings) * 100) : 0}%`],
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
        fillColor: [16, 185, 129],
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
        fillColor: [16, 185, 129],
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
      ['Last 30 Days', `Rs. ${recentRevenue.toLocaleString()}`, recentBookings.filter(b => b.status === 'PAID' || b.status === 'DELIVERED').length.toString()],
      ['All Time', `Rs. ${totalRevenue.toLocaleString()}`, paidBookings.length.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [revenueData[0]],
      body: revenueData.slice(1),
      theme: 'striped',
      headStyles: { 
        fillColor: [16, 185, 129],
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
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Payment Method', 'Count']],
      body: paymentData,
      theme: 'striped',
      headStyles: { 
        fillColor: [16, 185, 129],
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
          fillColor: [16, 185, 129],
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-secondary">Reports & Insights</h1>
            <p className="text-muted-foreground">Comprehensive analytics and business insights</p>
          </div>
          <Button
            onClick={generatePDF}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-secondary">रू {totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">All time</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Avg Booking Value</p>
                  <p className="text-3xl font-bold text-secondary">रू {Math.round(averageBookingValue).toLocaleString()}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-primary mr-1" />
                    <span className="text-primary font-medium">Per transaction</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Activity className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-secondary">
                    {totalBookings > 0 ? Math.round((paidBookings.length / totalBookings) * 100) : 0}%
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">Completed</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <PieChart className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Total Customers</p>
                  <p className="text-3xl font-bold text-secondary">{activeUsers}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <Users className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-purple-600 font-medium">Active users</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Booking Status Distribution */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-secondary flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Booking Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-secondary">Paid</span>
                    </div>
                    <span className="text-sm font-semibold text-secondary">
                      {paidBookings.length} ({statusDistribution.paid.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${statusDistribution.paid}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-secondary">Pending</span>
                    </div>
                    <span className="text-sm font-semibold text-secondary">
                      {pendingBookings.length} ({statusDistribution.pending.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all" 
                      style={{ width: `${statusDistribution.pending}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-secondary">Refund Requested</span>
                    </div>
                    <span className="text-sm font-semibold text-secondary">
                      {refundRequested.length} ({statusDistribution.refundRequested.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all" 
                      style={{ width: `${statusDistribution.refundRequested}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-secondary">Cancelled</span>
                    </div>
                    <span className="text-sm font-semibold text-secondary">
                      {cancelledBookings.length} ({statusDistribution.cancelled.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all" 
                      style={{ width: `${statusDistribution.cancelled}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Utilization */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-secondary flex items-center">
                <Tractor className="mr-2 h-5 w-5" />
                Fleet Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center">
                    <Tractor className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="text-sm font-medium text-secondary">Total Tractors</p>
                      <p className="text-xs text-muted-foreground">In fleet</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-secondary">{totalTractors}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-secondary">Available</p>
                      <p className="text-xs text-muted-foreground">Ready to rent</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{availableTractors}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-secondary">Utilization Rate</p>
                      <p className="text-xs text-muted-foreground">Based on bookings</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-secondary">
                    {totalTractors > 0 ? Math.round((bookings.length / totalTractors / totalBookings) * 100 || 0) : 0}%
                  </span>
                </div>

                <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-semibold text-primary mb-1">Recent Activity</p>
                  <p className="text-xs text-muted-foreground">
                    {recentBookings.length} bookings in the last 30 days
                  </p>
                  <p className="text-xs text-muted-foreground">
                    रू {recentRevenue.toLocaleString()} revenue generated
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Tractors */}
        <Card className="border border-border shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-secondary flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Most Popular Tractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularTractors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tractor statistics available yet</p>
            ) : (
              <div className="space-y-4">
                {popularTractors.map((tractor, index) => (
                  <div key={tractor.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-secondary">{tractor.name}</p>
                        <p className="text-sm text-muted-foreground">{tractor.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Bookings</p>
                        <p className="font-semibold text-secondary">{tractor.bookingsCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-green-600">रू {tractor.revenue.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Utilization</p>
                        <p className="font-semibold text-primary">{tractor.utilizationRate.toFixed(1)}%</p>
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
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Bookings</span>
                  <span className="font-semibold text-secondary">{totalBookings}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Successful</span>
                  <span className="font-semibold text-green-600">{paidBookings.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cancelled</span>
                  <span className="font-semibold text-red-600">{cancelledBookings.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Refund Pending</span>
                  <span className="font-semibold text-orange-600">{refundRequested.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary">Revenue Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold text-green-600">रू {totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg per Booking</span>
                  <span className="font-semibold text-secondary">रू {Math.round(averageBookingValue).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last 30 Days</span>
                  <span className="font-semibold text-primary">रू {recentRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-semibold text-primary">
                    {totalBookings > 0 ? Math.round((paidBookings.length / totalBookings) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-secondary">Business Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Customers</span>
                  <span className="font-semibold text-secondary">{activeUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Fleet</span>
                  <span className="font-semibold text-primary">{availableTractors}/{totalTractors}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fleet Size</span>
                  <span className="font-semibold text-secondary">{totalTractors}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Growth Potential</span>
                  <span className="font-semibold text-green-600">
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

