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
  Clock,
  ExternalLink,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
  
  // Citizenship document viewer
  const [viewingCitizenship, setViewingCitizenship] = useState<string | null>(null);
  
  // Search and pagination states
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [ownersSearch, setOwnersSearch] = useState('');
  const [ownersPage, setOwnersPage] = useState(1);
  const [tractorsSearch, setTractorsSearch] = useState('');
  const [tractorsPage, setTractorsPage] = useState(1);
  const [bookingsSearch, setBookingsSearch] = useState('');
  const [bookingsPage, setBookingsPage] = useState(1);
  
  const itemsPerPage = 10;

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      fetchAllData();
    }
  }, [isAuthenticated, isSuperAdmin]);
  
  // Reset page when search changes - MUST be before any early returns
  useEffect(() => {
    setUsersPage(1);
  }, [usersSearch]);
  
  useEffect(() => {
    setOwnersPage(1);
  }, [ownersSearch]);
  
  useEffect(() => {
    setTractorsPage(1);
  }, [tractorsSearch]);
  
  useEffect(() => {
    setBookingsPage(1);
  }, [bookingsSearch, bookingStatusFilter, paymentStatusFilter]);

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
  
  // Filter and paginate users
  const filteredUsers = users.filter(user => {
    const searchLower = usersSearch.toLowerCase();
    return !usersSearch || 
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower);
  });
  const usersTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);
  
  // Filter and paginate tractor owners
  const filteredOwners = tractorOwners.filter(owner => {
    const searchLower = ownersSearch.toLowerCase();
    return !ownersSearch ||
      owner.name?.toLowerCase().includes(searchLower) ||
      owner.email?.toLowerCase().includes(searchLower) ||
      owner.phone?.toLowerCase().includes(searchLower) ||
      owner.address?.toLowerCase().includes(searchLower);
  });
  const filteredPendingOwners = filteredOwners.filter(o => !o.approved);
  const filteredApprovedOwners = filteredOwners.filter(o => o.approved);
  const ownersTotalPages = Math.ceil(filteredOwners.length / itemsPerPage);
  const paginatedOwners = filteredOwners.slice((ownersPage - 1) * itemsPerPage, ownersPage * itemsPerPage);
  const pendingTotalPages = Math.ceil(filteredPendingOwners.length / itemsPerPage);
  const paginatedPendingOwners = filteredPendingOwners.slice((ownersPage - 1) * itemsPerPage, ownersPage * itemsPerPage);
  const approvedTotalPages = Math.ceil(filteredApprovedOwners.length / itemsPerPage);
  const paginatedApprovedOwners = filteredApprovedOwners.slice((ownersPage - 1) * itemsPerPage, ownersPage * itemsPerPage);
  
  // Filter and paginate tractors
  const filteredTractors = allTractors.filter(tractor => {
    const searchLower = tractorsSearch.toLowerCase();
    const ownerInfo = (tractor as any).owner;
    return !tractorsSearch ||
      tractor.name?.toLowerCase().includes(searchLower) ||
      tractor.model?.toLowerCase().includes(searchLower) ||
      ownerInfo?.name?.toLowerCase().includes(searchLower) ||
      ownerInfo?.email?.toLowerCase().includes(searchLower);
  });
  const tractorsTotalPages = Math.ceil(filteredTractors.length / itemsPerPage);
  const paginatedTractors = filteredTractors.slice((tractorsPage - 1) * itemsPerPage, tractorsPage * itemsPerPage);
  
  // Filter bookings based on status and payment filters
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
    const matchesPayment = paymentStatusFilter === 'all' || 
      (paymentStatusFilter === 'released' && booking.paymentReleased) ||
      (paymentStatusFilter === 'pending' && booking.status === 'completed' && !booking.paymentReleased);
    const searchLower = bookingsSearch.toLowerCase();
    const matchesSearch = !bookingsSearch ||
      booking.userName?.toLowerCase().includes(searchLower) ||
      booking.tractorName?.toLowerCase().includes(searchLower) ||
      booking.id?.toString().includes(searchLower) ||
      (booking as any).ownerName?.toLowerCase().includes(searchLower);
    return matchesStatus && matchesPayment && matchesSearch;
  });
  const bookingsTotalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((bookingsPage - 1) * itemsPerPage, bookingsPage * itemsPerPage);
  
  // Calculate totals - round to 2 decimal places
  const totalCommissionEarned = Math.round((bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + ((b as any).commissionAmount || (b.totalCost || 0) * 0.15), 0)) * 100) / 100;
  
  const totalReleasedCommission = Math.round((bookings
    .filter(b => b.status === 'completed' && b.paymentReleased)
    .reduce((sum, b) => sum + ((b as any).commissionAmount || (b.totalCost || 0) * 0.15), 0)) * 100) / 100;
  
  const totalReleasedToOwners = Math.round((bookings
    .filter(b => b.status === 'completed' && b.paymentReleased)
    .reduce((sum, b) => {
      const total = b.totalCost || 0;
      const commission = (b as any).commissionAmount || total * 0.15;
      return sum + (total - commission);
    }, 0)) * 100) / 100;

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
                <CardTitle>All Users ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or role..."
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
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
                        {paginatedUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              {usersSearch ? 'No users found matching your search' : 'No users found'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedUsers.map((user, index) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium text-muted-foreground">
                                {(usersPage - 1) * itemsPerPage + index + 1}
                              </TableCell>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell className="break-words">{user.email}</TableCell>
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
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                {usersTotalPages > 1 && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      <span className="hidden sm:inline">Page {usersPage} of {usersTotalPages} • </span>
                      Showing {(usersPage - 1) * itemsPerPage + 1}-{Math.min(usersPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                            className={usersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: usersTotalPages }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page} className="hidden sm:block">
                            <PaginationLink
                              onClick={() => setUsersPage(page)}
                              isActive={usersPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))}
                            className={usersPage === usersTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tractor Owners Tab */}
          <TabsContent value="tractor-owners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tractor Owners</span>
                  <Badge variant="outline">{filteredOwners.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, phone, or address..."
                      value={ownersSearch}
                      onChange={(e) => setOwnersSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="text-xs sm:text-sm">All ({filteredOwners.length})</TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs sm:text-sm">
                      Pending ({filteredPendingOwners.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="text-xs sm:text-sm">
                      Approved ({filteredApprovedOwners.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-4">
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">#</TableHead>
                              <TableHead className="whitespace-nowrap">Name</TableHead>
                              <TableHead className="whitespace-nowrap">Email</TableHead>
                              <TableHead className="whitespace-nowrap">Phone</TableHead>
                              <TableHead className="whitespace-nowrap">Address</TableHead>
                              <TableHead className="whitespace-nowrap">Citizenship</TableHead>
                              <TableHead className="whitespace-nowrap">Tractors</TableHead>
                              <TableHead className="whitespace-nowrap">Status</TableHead>
                              <TableHead className="whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedOwners.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                  {ownersSearch ? 'No owners found matching your search' : 'No owners found'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedOwners.map((owner, index) => (
                              <TableRow key={owner.id}>
                                <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                                  {(ownersPage - 1) * itemsPerPage + index + 1}
                                </TableCell>
                                <TableCell className="font-medium whitespace-nowrap">{owner.name}</TableCell>
                                <TableCell className="break-words">{owner.email}</TableCell>
                                <TableCell className="whitespace-nowrap">{owner.phone || '—'}</TableCell>
                                <TableCell className="max-w-xs truncate">{owner.address || '—'}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {owner.citizenshipImageUrl ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setViewingCitizenship(owner.citizenshipImageUrl || null)}
                                      className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                    >
                                      <FileText className="h-4 w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">View</span>
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewOwnerTractors(owner.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {owner.tractorCount}
                                  </Button>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {owner.approved ? (
                                    <Badge className="bg-green-600">Approved</Badge>
                                  ) : (
                                    <Badge variant="destructive">Pending</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex gap-1 sm:gap-2">
                                    {!owner.approved && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleApproveOwner(owner.id)}
                                          disabled={processingOwners.has(owner.id)}
                                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 sm:px-3"
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
                                          className="disabled:opacity-50 disabled:cursor-not-allowed px-2 sm:px-3"
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
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    {ownersTotalPages > 1 && (
                      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                          <span className="hidden sm:inline">Page {ownersPage} of {ownersTotalPages} • </span>
                          Showing {(ownersPage - 1) * itemsPerPage + 1}-{Math.min(ownersPage * itemsPerPage, filteredOwners.length)} of {filteredOwners.length} owners
                        </p>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setOwnersPage(p => Math.max(1, p - 1))}
                                className={ownersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            {Array.from({ length: ownersTotalPages }, (_, i) => i + 1).map(page => (
                              <PaginationItem key={page} className="hidden sm:block">
                                <PaginationLink
                                  onClick={() => setOwnersPage(page)}
                                  isActive={ownersPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setOwnersPage(p => Math.min(ownersTotalPages, p + 1))}
                                className={ownersPage === ownersTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="pending" className="mt-4">
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">#</TableHead>
                              <TableHead className="whitespace-nowrap">Name</TableHead>
                              <TableHead className="whitespace-nowrap">Email</TableHead>
                              <TableHead className="whitespace-nowrap">Phone</TableHead>
                              <TableHead className="whitespace-nowrap">Address</TableHead>
                              <TableHead className="whitespace-nowrap">Citizenship</TableHead>
                              <TableHead className="whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedPendingOwners.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                  {ownersSearch ? 'No pending owners found matching your search' : 'No pending owners found'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedPendingOwners.map((owner, index) => (
                              <TableRow key={owner.id}>
                                <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                                  {(ownersPage - 1) * itemsPerPage + index + 1}
                                </TableCell>
                                <TableCell className="font-medium whitespace-nowrap">{owner.name}</TableCell>
                                <TableCell className="break-words">{owner.email}</TableCell>
                                <TableCell className="whitespace-nowrap">{owner.phone || '—'}</TableCell>
                                <TableCell className="max-w-xs truncate">{owner.address || '—'}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {owner.citizenshipImageUrl ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setViewingCitizenship(owner.citizenshipImageUrl || null)}
                                      className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                    >
                                      <FileText className="h-4 w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">View</span>
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Not uploaded</span>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveOwner(owner.id)}
                                      disabled={processingOwners.has(owner.id)}
                                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                                    >
                                      {processingOwners.has(owner.id) ? (
                                        <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 sm:mr-1" />
                                      )}
                                      <span className="hidden sm:inline">Approve</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectOwner(owner.id)}
                                      disabled={processingOwners.has(owner.id)}
                                      className="disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                                    >
                                      {processingOwners.has(owner.id) ? (
                                        <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" />
                                      ) : (
                                        <XCircle className="h-4 w-4 sm:mr-1" />
                                      )}
                                      <span className="hidden sm:inline">Reject</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    {pendingTotalPages > 1 && (
                      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                          <span className="hidden sm:inline">Page {ownersPage} of {pendingTotalPages} • </span>
                          Showing {(ownersPage - 1) * itemsPerPage + 1}-{Math.min(ownersPage * itemsPerPage, filteredPendingOwners.length)} of {filteredPendingOwners.length} pending owners
                        </p>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setOwnersPage(p => Math.max(1, p - 1))}
                                className={ownersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            {Array.from({ length: pendingTotalPages }, (_, i) => i + 1).map(page => (
                              <PaginationItem key={page} className="hidden sm:block">
                                <PaginationLink
                                  onClick={() => setOwnersPage(page)}
                                  isActive={ownersPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setOwnersPage(p => Math.min(pendingTotalPages, p + 1))}
                                className={ownersPage === pendingTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="approved" className="mt-4">
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">#</TableHead>
                              <TableHead className="whitespace-nowrap">Name</TableHead>
                              <TableHead className="whitespace-nowrap">Email</TableHead>
                              <TableHead className="whitespace-nowrap">Phone</TableHead>
                              <TableHead className="whitespace-nowrap">Address</TableHead>
                              <TableHead className="whitespace-nowrap">Citizenship</TableHead>
                              <TableHead className="whitespace-nowrap">Tractors</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedApprovedOwners.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                  {ownersSearch ? 'No approved owners found matching your search' : 'No approved owners found'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedApprovedOwners.map((owner, index) => (
                              <TableRow key={owner.id}>
                                <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                                  {(ownersPage - 1) * itemsPerPage + index + 1}
                                </TableCell>
                                <TableCell className="font-medium whitespace-nowrap">{owner.name}</TableCell>
                                <TableCell className="break-words">{owner.email}</TableCell>
                                <TableCell className="whitespace-nowrap">{owner.phone || '—'}</TableCell>
                                <TableCell className="max-w-xs truncate">{owner.address || '—'}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {owner.citizenshipImageUrl ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setViewingCitizenship(owner.citizenshipImageUrl || null)}
                                      className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                    >
                                      <FileText className="h-4 w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">View</span>
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
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
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    {approvedTotalPages > 1 && (
                      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                          <span className="hidden sm:inline">Page {ownersPage} of {approvedTotalPages} • </span>
                          Showing {(ownersPage - 1) * itemsPerPage + 1}-{Math.min(ownersPage * itemsPerPage, filteredApprovedOwners.length)} of {filteredApprovedOwners.length} approved owners
                        </p>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setOwnersPage(p => Math.max(1, p - 1))}
                                className={ownersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            {Array.from({ length: approvedTotalPages }, (_, i) => i + 1).map(page => (
                              <PaginationItem key={page} className="hidden sm:block">
                                <PaginationLink
                                  onClick={() => setOwnersPage(page)}
                                  isActive={ownersPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setOwnersPage(p => Math.min(approvedTotalPages, p + 1))}
                                className={ownersPage === approvedTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Tractors Tab */}
          <TabsContent value="tractors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Tractors ({filteredTractors.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by tractor name, model, or owner..."
                      value={tractorsSearch}
                      onChange={(e) => setTractorsSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">#</TableHead>
                          <TableHead className="whitespace-nowrap">Image</TableHead>
                          <TableHead className="whitespace-nowrap">Name</TableHead>
                          <TableHead className="whitespace-nowrap">Model</TableHead>
                          <TableHead className="whitespace-nowrap">Owner</TableHead>
                          <TableHead className="whitespace-nowrap">Rate</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="whitespace-nowrap">Approval</TableHead>
                          <TableHead className="whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTractors.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              {tractorsSearch ? 'No tractors found matching your search' : 'No tractors found'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedTractors.map((tractor, index) => {
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
                                <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                                  {(tractorsPage - 1) * itemsPerPage + index + 1}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex gap-1 sm:gap-2 items-center">
                                    <img 
                                      src={mainImage} 
                                      alt={tractor.name} 
                                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';
                                      }}
                                    />
                                    {additionalImages.slice(0, 2).map((img, idx) => (
                                      <img 
                                        key={idx} 
                                        src={img} 
                                        alt={`${tractor.name} ${idx + 2}`} 
                                        className="hidden sm:block w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';
                                        }}
                                      />
                                    ))}
                                    {allImages.length > 3 && (
                                      <span className="text-xs text-muted-foreground hidden sm:inline">+{allImages.length - 3}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium whitespace-nowrap">{tractor.name}</TableCell>
                                <TableCell className="whitespace-nowrap">{tractor.model}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {ownerInfo ? (
                                    <div>
                                      <p className="font-medium text-sm">{ownerInfo.name}</p>
                                      <p className="text-xs text-muted-foreground hidden sm:block">{ownerInfo.email}</p>
                                    </div>
                                  ) : (
                                    'N/A'
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">Rs. {tractor.hourlyRate}/hr</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <Badge variant={tractor.available ? 'default' : 'secondary'}>
                                    {tractor.available ? 'Available' : 'Unavailable'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
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
                                <TableCell className="whitespace-nowrap">
                                  {approvalStatus === 'PENDING' && (
                                    <div className="flex gap-1 sm:gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveTractor(tractor.id)}
                                        disabled={isProcessing}
                                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 sm:px-3"
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
                                        className="disabled:opacity-50 disabled:cursor-not-allowed px-2 sm:px-3"
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
                  </div>
                </div>
                {tractorsTotalPages > 1 && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      <span className="hidden sm:inline">Page {tractorsPage} of {tractorsTotalPages} • </span>
                      Showing {(tractorsPage - 1) * itemsPerPage + 1}-{Math.min(tractorsPage * itemsPerPage, filteredTractors.length)} of {filteredTractors.length} tractors
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setTractorsPage(p => Math.max(1, p - 1))}
                            className={tractorsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: tractorsTotalPages }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page} className="hidden sm:block">
                            <PaginationLink
                              onClick={() => setTractorsPage(page)}
                              isActive={tractorsPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setTractorsPage(p => Math.min(tractorsTotalPages, p + 1))}
                            className={tractorsPage === tractorsTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings & Payments Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings - Tracking & Payment Management ({filteredBookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by customer, tractor, booking ID..."
                        value={bookingsSearch}
                        onChange={(e) => setBookingsSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
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
                
                <div className="mb-4 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Bookings</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{filteredBookings.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Commission</p>
                      <p className="text-xl sm:text-2xl font-bold text-amber-500">
                        Rs. {filteredBookings
                          .filter(b => b.status === 'completed')
                          .reduce((sum, b) => sum + ((b as any).commissionAmount || (b.totalCost || 0) * 0.15), 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Released to Owners</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
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
                
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">#</TableHead>
                          <TableHead className="whitespace-nowrap">Booking ID</TableHead>
                          <TableHead className="whitespace-nowrap">Customer</TableHead>
                          <TableHead className="whitespace-nowrap">Tractor</TableHead>
                          <TableHead className="whitespace-nowrap">Owner ID</TableHead>
                          <TableHead className="whitespace-nowrap">Date</TableHead>
                          <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                          <TableHead className="whitespace-nowrap">Commission (15%)</TableHead>
                          <TableHead className="whitespace-nowrap">Owner Amount (85%)</TableHead>
                          <TableHead className="whitespace-nowrap">Booking Status</TableHead>
                          <TableHead className="whitespace-nowrap">Payment Status</TableHead>
                          <TableHead className="whitespace-nowrap">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedBookings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                              {bookingsSearch || bookingStatusFilter !== 'all' || paymentStatusFilter !== 'all' ? 'No bookings found matching your filters' : 'No bookings found'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedBookings.map((booking, index) => {
                            const bookingData = booking as any;
                            const ownerId = bookingData.ownerId;
                            return (
                            <TableRow key={booking.id}>
                            <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                              {(bookingsPage - 1) * itemsPerPage + index + 1}
                            </TableCell>
                            <TableCell className="font-medium whitespace-nowrap">#{booking.id}</TableCell>
                            <TableCell className="whitespace-nowrap">{booking.userName}</TableCell>
                            <TableCell className="whitespace-nowrap">{booking.tractorName}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {ownerId ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewOwnerDetails(ownerId)}
                                  className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                                >
                                  {ownerId}
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex flex-col text-xs sm:text-sm">
                                <span className="text-foreground">{new Date(booking.startDate).toLocaleDateString()}</span>
                                <span className="text-xs text-muted-foreground hidden sm:inline">to {new Date(booking.endDate).toLocaleDateString()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-foreground text-xs sm:text-sm">Rs. {booking.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="text-xs text-muted-foreground hidden sm:inline">Total Booking Amount</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {booking.status === 'completed' ? (
                                <div className="flex flex-col">
                                  <span className="text-amber-600 font-bold text-sm sm:text-lg">
                                    Rs. {((booking as any).commissionAmount || booking.totalCost * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-xs text-amber-500/80 font-medium hidden sm:inline">15% Commission (Your Earnings)</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {booking.status === 'completed' ? (
                                <div className="flex flex-col">
                                  <span className="text-green-600 font-semibold text-sm sm:text-base">
                                    Rs. {((booking.totalCost || 0) - ((booking as any).commissionAmount || booking.totalCost * 0.15)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-xs text-muted-foreground hidden sm:inline">85% to Tractor Owner</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant={
                                booking.status === 'completed' ? 'default' :
                                booking.status === 'delivered' ? 'default' :
                                booking.status === 'paid' ? 'default' :
                                booking.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              } className="text-xs">
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {booking.status === 'completed' ? (
                                booking.paymentReleased ? (
                                  <Badge className="bg-green-600 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Released</span>
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">Pending</span>
                                  </Badge>
                                )
                              ) : (
                                <Badge variant="outline" className="text-xs">N/A</Badge>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {booking.status === 'completed' && !booking.paymentReleased ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleReleasePayment(booking.id)}
                                  disabled={processingPayments.has(booking.id)}
                                  className="bg-amber-600 hover:bg-amber-700 text-xs sm:text-sm px-2 sm:px-3"
                                >
                                  {processingPayments.has(booking.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                      <span className="hidden sm:inline">Release Payment</span>
                                    </>
                                  )}
                                </Button>
                              ) : booking.status === 'completed' && booking.paymentReleased ? (
                                <Badge className="bg-green-600 text-white text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">Released</span>
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
                  </div>
                </div>
                {bookingsTotalPages > 1 && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      <span className="hidden sm:inline">Page {bookingsPage} of {bookingsTotalPages} • </span>
                      Showing {(bookingsPage - 1) * itemsPerPage + 1}-{Math.min(bookingsPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                            className={bookingsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: bookingsTotalPages }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page} className="hidden sm:block">
                            <PaginationLink
                              onClick={() => setBookingsPage(page)}
                              isActive={bookingsPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setBookingsPage(p => Math.min(bookingsTotalPages, p + 1))}
                            className={bookingsPage === bookingsTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Owner Details Dialog */}
        <Dialog open={!!selectedOwnerDetails} onOpenChange={(open) => !open && setSelectedOwnerDetails(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                
                {/* Citizenship Document */}
                {selectedOwnerDetails.citizenshipImageUrl && (
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Citizenship Document</Label>
                    <div className="relative rounded-lg border-2 border-border overflow-hidden bg-muted/30">
                      <img
                        src={selectedOwnerDetails.citizenshipImageUrl}
                        alt="Citizenship Document"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                      <a
                        href={selectedOwnerDetails.citizenshipImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 bg-background/90 hover:bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:text-amber-500 transition-colors shadow-lg flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Full Size
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Review the citizenship document before approving the tractor owner account.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Citizenship Document Viewer Dialog */}
        <Dialog open={!!viewingCitizenship} onOpenChange={(open) => !open && setViewingCitizenship(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Citizenship Document</DialogTitle>
              <DialogDescription>
                Review the citizenship document before approving the tractor owner account
              </DialogDescription>
            </DialogHeader>
            {viewingCitizenship && (
              <div className="space-y-4">
                <div className="relative rounded-lg border-2 border-border overflow-hidden bg-muted/30">
                  <img
                    src={viewingCitizenship}
                    alt="Citizenship Document"
                    className="w-full h-auto object-contain"
                  />
                  <a
                    href={viewingCitizenship}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 bg-background/90 hover:bg-background border border-border rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:text-amber-500 transition-colors shadow-lg flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Full Size
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong className="font-semibold">Verification Checklist:</strong>
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 mt-2 space-y-1 list-disc list-inside">
                    <li>Document is clear and readable</li>
                    <li>All personal details are visible</li>
                    <li>Document appears authentic</li>
                    <li>Name matches the registration information</li>
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Owner Tractors Dialog */}
        <Dialog open={showOwnerTractors} onOpenChange={setShowOwnerTractors}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Tractors by {tractorOwners.find(o => o.id === selectedOwnerId)?.name}
              </DialogTitle>
              <DialogDescription className="text-sm">
                View all tractors listed by this owner
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
