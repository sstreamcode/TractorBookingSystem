import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Users, 
  Tractor, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Eye,
  TrendingUp,
  UserCheck,
  UserX,
  Package,
  CreditCard,
  Loader2,
  Clock
} from 'lucide-react';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  getSuperAdminUsers,
  getSuperAdminTractorOwners,
  getSuperAdminTractors,
  getSuperAdminBookings,
  getSuperAdminStats,
  getTractorsByOwner,
  approveTractorOwner,
  rejectTractorOwner,
  approveTractor,
  rejectTractor,
  releasePayment,
  getAllBookingsForUI,
  getOwnerById,
  type SuperAdminUser,
  type SuperAdminTractorOwner,
  type SuperAdminStats,
  type TractorApiModel,
  type OwnerDetails,
} from '@/lib/api';
import type { Booking } from '@/types';

const SuperAdminDashboard = () => {
  const { isAuthenticated, isSuperAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Overview stats
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  
  // Users
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  
  // Tractor Owners
  const [tractorOwners, setTractorOwners] = useState<SuperAdminTractorOwner[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);
  const [ownerTractors, setOwnerTractors] = useState<TractorApiModel[]>([]);
  const [showOwnerTractors, setShowOwnerTractors] = useState(false);
  
  // All Tractors
  const [allTractors, setAllTractors] = useState<TractorApiModel[]>([]);
  
  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  
  // Tractor owner approval/rejection processing
  const [processingOwners, setProcessingOwners] = useState<Set<number>>(new Set());
  
  // Tractor approval/rejection processing
  const [processingTractors, setProcessingTractors] = useState<Set<string | number>>(new Set());
  
  // Owner details dialog
  const [selectedOwnerDetails, setSelectedOwnerDetails] = useState<OwnerDetails | null>(null);
  const [loadingOwnerDetails, setLoadingOwnerDetails] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      fetchAllData();
    }
  }, [isAuthenticated, isSuperAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, ownersData, tractorsData, bookingsData] = await Promise.all([
        getSuperAdminStats(),
        getSuperAdminUsers(),
        getSuperAdminTractorOwners(),
        getSuperAdminTractors(),
        getSuperAdminBookings().then(bookings => 
          bookings.map(b => ({
            id: String(b.id),
            tractorId: String(b.tractor.id),
            tractorName: b.tractor.name,
            tractorImage: b.tractor.imageUrl || undefined,
            tractorImages: b.tractor.imageUrls,
            userId: String(b.user.id),
            userName: b.user.name,
            ownerId: b.tractor?.owner?.id ? String(b.tractor.owner.id) : null,
            ownerName: b.tractor?.owner?.name || null,
            startDate: b.startAt,
            endDate: b.endAt,
            totalCost: b.totalAmount || 0,
            status: b.status.toLowerCase() as any,
            paymentStatus: 'pending' as any,
            adminStatus: b.adminStatus?.toLowerCase() as any,
            paymentMethod: b.paymentMethod,
            deliveryLatitude: b.deliveryLatitude,
            deliveryLongitude: b.deliveryLongitude,
            deliveryAddress: b.deliveryAddress,
            commissionAmount: b.commissionAmount,
            paymentReleased: b.paymentReleased || false,
          }))
        )
      ]);
      setStats(statsData);
      setUsers(usersData);
      setTractorOwners(ownersData);
      setAllTractors(tractorsData);
      setBookings(bookingsData);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOwnerTractors = async (ownerId: number) => {
    try {
      const tractors = await getTractorsByOwner(ownerId);
      setOwnerTractors(tractors);
      setSelectedOwnerId(ownerId);
      setShowOwnerTractors(true);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch tractors');
    }
  };

  const handleApproveOwner = async (ownerId: number) => {
    // Prevent multiple clicks
    if (processingOwners.has(ownerId)) {
      return;
    }
    
    setProcessingOwners(prev => new Set(prev).add(ownerId));
    try {
      await approveTractorOwner(ownerId);
      toast.success('Tractor owner approved successfully');
      await fetchAllData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve tractor owner');
    } finally {
      setProcessingOwners(prev => {
        const updated = new Set(prev);
        updated.delete(ownerId);
        return updated;
      });
    }
  };

  const handleViewOwnerDetails = async (ownerId: string | number) => {
    setLoadingOwnerDetails(true);
    try {
      const ownerDetails = await getOwnerById(ownerId);
      setSelectedOwnerDetails(ownerDetails);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to fetch owner details');
    } finally {
      setLoadingOwnerDetails(false);
    }
  };

  const handleRejectOwner = async (ownerId: number) => {
    // Prevent multiple clicks
    if (processingOwners.has(ownerId)) {
      return;
    }
    
    if (!confirm('Are you sure you want to reject this tractor owner?')) {
      return;
    }
    
    setProcessingOwners(prev => new Set(prev).add(ownerId));
    try {
      await rejectTractorOwner(ownerId);
      toast.success('Tractor owner rejected');
      await fetchAllData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject tractor owner');
    } finally {
      setProcessingOwners(prev => {
        const updated = new Set(prev);
        updated.delete(ownerId);
        return updated;
      });
    }
  };

  const handleReleasePayment = async (bookingId: string) => {
    setProcessingPayments(prev => new Set(prev).add(bookingId));
    try {
      const result = await releasePayment(bookingId);
      toast.success(
        `Payment released! Commission: Rs. ${result.commissionAmount.toFixed(2)}, Owner Amount: Rs. ${result.ownerAmount.toFixed(2)}`
      );
      await fetchAllData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to release payment');
    } finally {
      setProcessingPayments(prev => {
        const updated = new Set(prev);
        updated.delete(bookingId);
        return updated;
      });
    }
  };

  const handleApproveTractor = async (tractorId: string | number) => {
    if (processingTractors.has(tractorId)) {
      return;
    }
    
    setProcessingTractors(prev => new Set(prev).add(tractorId));
    try {
      await approveTractor(tractorId);
      toast.success('Tractor approved successfully');
      await fetchAllData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve tractor');
    } finally {
      setProcessingTractors(prev => {
        const updated = new Set(prev);
        updated.delete(tractorId);
        return updated;
      });
    }
  };

  const handleRejectTractor = async (tractorId: string | number) => {
    if (processingTractors.has(tractorId)) {
      return;
    }
    
    if (!confirm('Are you sure you want to reject this tractor?')) {
      return;
    }
    
    setProcessingTractors(prev => new Set(prev).add(tractorId));
    try {
      await rejectTractor(tractorId);
      toast.success('Tractor rejected');
      await fetchAllData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject tractor');
    } finally {
      setProcessingTractors(prev => {
        const updated = new Set(prev);
        updated.delete(tractorId);
        return updated;
      });
    }
  };

  if (authLoading || loading) {
    return (
      <SidebarProvider>
        <SuperAdminSidebar activeTab={activeTab} onTabChange={setActiveTab} pendingOwnersCount={0} />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const pendingOwners = tractorOwners.filter(o => !o.approved);
  const approvedOwners = tractorOwners.filter(o => o.approved);
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const unreleasedBookings = completedBookings.filter(b => !b.paymentReleased);
  
  // Filter bookings based on status and payment filters
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
    const matchesPayment = paymentStatusFilter === 'all' || 
      (paymentStatusFilter === 'released' && booking.paymentReleased) ||
      (paymentStatusFilter === 'pending' && booking.status === 'completed' && !booking.paymentReleased);
    return matchesStatus && matchesPayment;
  });
  
  // Calculate totals
  const totalCommissionEarned = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + ((b as any).commissionAmount || (b.totalCost || 0) * 0.15), 0);
  
  const totalReleasedCommission = bookings
    .filter(b => b.status === 'completed' && b.paymentReleased)
    .reduce((sum, b) => sum + ((b as any).commissionAmount || (b.totalCost || 0) * 0.15), 0);
  
  const totalReleasedToOwners = bookings
    .filter(b => b.status === 'completed' && b.paymentReleased)
    .reduce((sum, b) => {
      const total = b.totalCost || 0;
      const commission = (b as any).commissionAmount || total * 0.15;
      return sum + (total - commission);
    }, 0);

  return (
    <SidebarProvider>
      <SuperAdminSidebar activeTab={activeTab} onTabChange={setActiveTab} pendingOwnersCount={pendingOwners.length} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {activeTab === 'overview' && 'Overview'}
              {activeTab === 'users' && 'Users'}
              {activeTab === 'tractor-owners' && 'Tractor Owners'}
              {activeTab === 'tractors' && 'All Tractors'}
              {activeTab === 'bookings' && 'Bookings & Payments'}
            </h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUsers}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalCustomers} customers, {stats.totalTractorOwners} owners
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Tractors</CardTitle>
                      <Tractor className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalTractors}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.approvedTractors} approved, {stats.pendingTractors} pending
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalBookings}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.completedBookings} completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-amber-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                      <DollarSign className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-500">
                        Rs. {stats.totalCommission?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        15% from all completed bookings
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-white">Total Commission Earned</CardTitle>
                      <TrendingUp className="h-4 w-4 text-white/80" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">Rs. {totalCommissionEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <p className="text-xs text-white/80">
                        15% from {completedBookings.length} completed bookings
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-green-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Released to Owners</CardTitle>
                      <CreditCard className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        Rs. {totalReleasedToOwners.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {bookings.filter(b => b.status === 'completed' && b.paymentReleased).length} payments released
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserX className="h-5 w-5" />
                        Pending Tractor Owner Approvals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pendingOwners.length === 0 ? (
                        <p className="text-muted-foreground">No pending approvals</p>
                      ) : (
                        <div className="space-y-2">
                          {pendingOwners.slice(0, 5).map(owner => (
                            <div key={owner.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <p className="font-medium">{owner.name}</p>
                                <p className="text-sm text-muted-foreground">{owner.email}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleApproveOwner(owner.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                          ))}
                          {pendingOwners.length > 5 && (
                            <p className="text-sm text-muted-foreground text-center">
                              +{pendingOwners.length - 5} more pending
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Pending Payment Releases
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {unreleasedBookings.length === 0 ? (
                        <p className="text-muted-foreground">No pending payments</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-2xl font-bold text-amber-600">
                            {unreleasedBookings.length} bookings
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total commission: Rs. {unreleasedBookings.reduce((sum, b) => sum + (b.commissionAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <Button
                            onClick={() => setActiveTab('bookings')}
                            variant="outline"
                            className="w-full"
                          >
                            View All Bookings
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'SUPER_ADMIN' ? 'default' :
                            user.role === 'TRACTOR_OWNER' ? 'secondary' :
                            'outline'
                          }>
                            {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                             user.role === 'TRACTOR_OWNER' ? 'Tractor Owner' :
                             'Customer'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tractor Owners Tab */}
          <TabsContent value="tractor-owners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tractor Owners</span>
                  <Badge variant="outline">{tractorOwners.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList>
                    <TabsTrigger value="all">All ({tractorOwners.length})</TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending ({pendingOwners.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({approvedOwners.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Tractors</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tractorOwners.map((owner, index) => (
                          <TableRow key={owner.id}>
                            <TableCell className="font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">{owner.name}</TableCell>
                            <TableCell>{owner.email}</TableCell>
                            <TableCell>{owner.phone || '—'}</TableCell>
                            <TableCell className="max-w-xs truncate">{owner.address || '—'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOwnerTractors(owner.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {owner.tractorCount}
                              </Button>
                            </TableCell>
                            <TableCell>
                              {owner.approved ? (
                                <Badge className="bg-green-600">Approved</Badge>
                              ) : (
                                <Badge variant="destructive">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {!owner.approved && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveOwner(owner.id)}
                                      disabled={processingOwners.has(owner.id)}
                                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processingOwners.has(owner.id) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectOwner(owner.id)}
                                      disabled={processingOwners.has(owner.id)}
                                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processingOwners.has(owner.id) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <XCircle className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="pending" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingOwners.map((owner, index) => (
                          <TableRow key={owner.id}>
                            <TableCell className="font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">{owner.name}</TableCell>
                            <TableCell>{owner.email}</TableCell>
                            <TableCell>{owner.phone || '—'}</TableCell>
                            <TableCell className="max-w-xs truncate">{owner.address || '—'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveOwner(owner.id)}
                                  disabled={processingOwners.has(owner.id)}
                                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingOwners.has(owner.id) ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectOwner(owner.id)}
                                  disabled={processingOwners.has(owner.id)}
                                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingOwners.has(owner.id) ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="approved" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Tractors</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedOwners.map((owner, index) => (
                          <TableRow key={owner.id}>
                            <TableCell className="font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">{owner.name}</TableCell>
                            <TableCell>{owner.email}</TableCell>
                            <TableCell>{owner.phone || '—'}</TableCell>
                            <TableCell className="max-w-xs truncate">{owner.address || '—'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOwnerTractors(owner.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {owner.tractorCount}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Tractors Tab */}
          <TabsContent value="tractors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Tractors ({allTractors.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTractors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No tractors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      allTractors.map((tractor, index) => {
                        const ownerInfo = (tractor as any).owner;
                        const approvalStatus = (tractor as any).approvalStatus || 'PENDING';
                        const isProcessing = processingTractors.has(tractor.id);
                        // Get all images - combine imageUrl and imageUrls
                        const allImages = [
                          ...(tractor.imageUrls || []),
                          ...(tractor.imageUrl && !tractor.imageUrls?.includes(tractor.imageUrl) ? [tractor.imageUrl] : [])
                        ].filter(Boolean);
                        const mainImage = allImages[0] || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';
                        const additionalImages = allImages.slice(1, 4);
                        
                        return (
                          <TableRow key={tractor.id}>
                            <TableCell className="font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 items-center">
                                <img 
                                  src={mainImage} 
                                  alt={tractor.name} 
                                  className="w-16 h-16 object-cover rounded border"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';
                                  }}
                                />
                                {additionalImages.map((img, idx) => (
                                  <img 
                                    key={idx} 
                                    src={img} 
                                    alt={`${tractor.name} ${idx + 2}`} 
                                    className="w-12 h-12 object-cover rounded border"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';
                                    }}
                                  />
                                ))}
                                {allImages.length > 4 && (
                                  <span className="text-xs text-muted-foreground">+{allImages.length - 4}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{tractor.name}</TableCell>
                            <TableCell>{tractor.model}</TableCell>
                            <TableCell>
                              {ownerInfo ? (
                                <div>
                                  <p className="font-medium">{ownerInfo.name}</p>
                                  <p className="text-xs text-muted-foreground">{ownerInfo.email}</p>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>Rs. {tractor.hourlyRate}/hr</TableCell>
                            <TableCell>
                              <Badge variant={tractor.available ? 'default' : 'secondary'}>
                                {tractor.available ? 'Available' : 'Unavailable'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                approvalStatus === 'APPROVED' ? 'default' :
                                approvalStatus === 'PENDING' ? 'secondary' :
                                'destructive'
                              }>
                                {approvalStatus === 'APPROVED' ? 'Approved' :
                                 approvalStatus === 'PENDING' ? 'Pending' :
                                 approvalStatus === 'REJECTED' ? 'Rejected' : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {approvalStatus === 'PENDING' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveTractor(tractor.id)}
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectTractor(tractor.id)}
                                    disabled={isProcessing}
                                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              )}
                              {approvalStatus === 'APPROVED' && (
                                <Badge className="bg-green-600">Approved</Badge>
                              )}
                              {approvalStatus === 'REJECTED' && (
                                <Badge variant="destructive">Rejected</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings & Payments Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings - Tracking & Payment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Booking Status</Label>
                    <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="released">Released</SelectItem>
                        <SelectItem value="pending">Pending Release</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Bookings</p>
                      <p className="text-2xl font-bold text-foreground">{filteredBookings.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Commission</p>
                      <p className="text-2xl font-bold text-amber-500">
                        Rs. {filteredBookings
                          .filter(b => b.status === 'completed')
                          .reduce((sum, b) => sum + ((b as any).commissionAmount || (b.totalCost || 0) * 0.15), 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Released to Owners</p>
                      <p className="text-2xl font-bold text-green-600">
                        Rs. {filteredBookings
                          .filter(b => b.status === 'completed' && b.paymentReleased)
                          .reduce((sum, b) => {
                            const total = b.totalCost || 0;
                            const commission = (b as any).commissionAmount || total * 0.15;
                            return sum + (total - commission);
                          }, 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tractor</TableHead>
                      <TableHead>Owner ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Commission (15%)</TableHead>
                      <TableHead>Owner Amount (85%)</TableHead>
                      <TableHead>Booking Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking, index) => {
                        const bookingData = booking as any;
                        const ownerId = bookingData.ownerId;
                        return (
                        <TableRow key={booking.id}>
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">#{booking.id}</TableCell>
                        <TableCell>{booking.userName}</TableCell>
                        <TableCell>{booking.tractorName}</TableCell>
                        <TableCell>
                          {ownerId ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOwnerDetails(ownerId)}
                              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              {ownerId}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="text-foreground">{new Date(booking.startDate).toLocaleDateString()}</span>
                            <span className="text-xs text-muted-foreground">to {new Date(booking.endDate).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex flex-col">
                            <span className="text-foreground">Rs. {booking.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-xs text-muted-foreground">Total Booking Amount</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.status === 'completed' ? (
                            <div className="flex flex-col">
                              <span className="text-amber-600 font-bold text-lg">
                                Rs. {((booking as any).commissionAmount || booking.totalCost * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-xs text-amber-500/80 font-medium">15% Commission (Your Earnings)</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {booking.status === 'completed' ? (
                            <div className="flex flex-col">
                              <span className="text-green-600 font-semibold">
                                Rs. {((booking.totalCost || 0) - ((booking as any).commissionAmount || booking.totalCost * 0.15)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-xs text-muted-foreground">85% to Tractor Owner</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            booking.status === 'completed' ? 'default' :
                            booking.status === 'delivered' ? 'default' :
                            booking.status === 'paid' ? 'default' :
                            booking.status === 'cancelled' ? 'destructive' :
                            'secondary'
                          }>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.status === 'completed' ? (
                            booking.paymentReleased ? (
                              <Badge className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Released
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline">N/A</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {booking.status === 'completed' && !booking.paymentReleased ? (
                            <Button
                              size="sm"
                              onClick={() => handleReleasePayment(booking.id)}
                              disabled={processingPayments.has(booking.id)}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              {processingPayments.has(booking.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  Release Payment
                                </>
                              )}
                            </Button>
                          ) : booking.status === 'completed' && booking.paymentReleased ? (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Released
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Complete first</span>
                          )}
                        </TableCell>
                      </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Owner Details Dialog */}
        <Dialog open={!!selectedOwnerDetails} onOpenChange={(open) => !open && setSelectedOwnerDetails(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tractor Owner Details</DialogTitle>
              <DialogDescription>
                Complete information about the tractor owner
              </DialogDescription>
            </DialogHeader>
            {loadingOwnerDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : selectedOwnerDetails ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Owner ID</Label>
                    <p className="text-base font-semibold text-foreground">{selectedOwnerDetails.id}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Name</Label>
                    <p className="text-base font-semibold text-foreground">{selectedOwnerDetails.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</Label>
                    <p className="text-base text-foreground break-all">{selectedOwnerDetails.email}</p>
                  </div>
                  {selectedOwnerDetails.phone && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Phone</Label>
                      <a 
                        href={`tel:${selectedOwnerDetails.phone}`}
                        className="text-base text-foreground hover:text-amber-500 transition-colors"
                      >
                        {selectedOwnerDetails.phone}
                      </a>
                    </div>
                  )}
                  {selectedOwnerDetails.address && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Address</Label>
                      <p className="text-base text-foreground">{selectedOwnerDetails.address}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</Label>
                    <Badge variant="secondary">{selectedOwnerDetails.role}</Badge>
                  </div>
                  {selectedOwnerDetails.tractorOwnerApproved !== undefined && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Approval Status</Label>
                      <Badge variant={selectedOwnerDetails.tractorOwnerApproved ? "default" : "destructive"}>
                        {selectedOwnerDetails.tractorOwnerApproved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Owner Tractors Dialog */}
        <Dialog open={showOwnerTractors} onOpenChange={setShowOwnerTractors}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Tractors by {tractorOwners.find(o => o.id === selectedOwnerId)?.name}
              </DialogTitle>
              <DialogDescription>
                View all tractors listed by this owner
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              {ownerTractors.map(tractor => (
                <Card key={tractor.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{tractor.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Model: {tractor.model}</p>
                    <p className="text-sm text-muted-foreground">Rate: Rs. {tractor.hourlyRate}/hr</p>
                    <p className="text-sm text-muted-foreground">Location: {tractor.location || 'N/A'}</p>
                    <Badge className="mt-2">
                      {tractor.approvalStatus === 'APPROVED' ? 'Approved' :
                       tractor.approvalStatus === 'PENDING' ? 'Pending' :
                       tractor.approvalStatus === 'REJECTED' ? 'Rejected' : 'N/A'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SuperAdminDashboard;
