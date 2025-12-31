import { Navigate, Link } from 'react-router-dom';
import { Tractor, Users, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchAllBookings, fetchTractors, type TractorApiModel, type BookingApiModel } from '@/lib/api';
import { useEffect, useState } from 'react';

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
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
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin]);

  // Wait for auth to finish loading before redirecting
  if (authLoading) {
    return (
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <p className="text-foreground">{t('admin.dashboard.loading')}</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <p className="text-foreground">{t('admin.dashboard.loadingData')}</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Calculate stats from real data
  // Use the same logic as AdminReports to determine if a booking is paid
  const isBookingPaid = (booking: BookingApiModel): boolean => {
    // Check if booking has any successful payment
    if (booking.payments && booking.payments.length > 0) {
      return booking.payments.some(p => p.status === 'SUCCESS');
    }
    // For non-COD bookings, if status is PAID/DELIVERED/COMPLETED, consider it paid
    const paymentMethod = booking.paymentMethod || 
      (booking.payments && booking.payments.length > 0 ? booking.payments[0].method : undefined);
    if (paymentMethod !== 'CASH_ON_DELIVERY') {
      return booking.status === 'PAID' || booking.status === 'DELIVERED' || booking.status === 'COMPLETED';
    }
    return false;
  };

  // Total revenue from all paid bookings
  const totalRevenue = bookings
    .filter(isBookingPaid)
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Sort bookings by date (most recent first) and take the 5 most recent
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .slice(0, 5);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{t('admin.dashboard.title')}</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">{t('admin.dashboard.title')}</h2>
            <p className="text-muted-foreground">{t('admin.dashboard.subtitle')}</p>
          </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover border-2 border-amber-500/30 bg-card shadow-lg hover:shadow-amber-500/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{t('admin.dashboard.stats.tractors')}</p>
                  <p className="text-4xl font-bold mb-1 text-foreground">{tractors.length}</p>
                  <p className="text-xs text-amber-500 mt-1 font-semibold">
                    {tractors.filter(t => t.available).length} {t('admin.dashboard.stats.available')}
                  </p>
                </div>
                <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
                  <Tractor className="h-7 w-7 text-slate-900" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 border-emerald-500/30 bg-card shadow-lg hover:shadow-emerald-500/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{t('admin.dashboard.stats.bookings')}</p>
                  <p className="text-4xl font-bold mb-1 text-foreground">{bookings.length}</p>
                  <p className="text-xs text-emerald-500 mt-1 font-semibold">
                    {bookings.filter(isBookingPaid).length} {t('admin.dashboard.stats.paid')}
                  </p>
                </div>
                <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="h-7 w-7 text-slate-900" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 border-yellow-500/30 bg-card shadow-lg hover:shadow-yellow-500/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{t('admin.dashboard.stats.revenue')}</p>
                  <p className="text-4xl font-bold mb-1 text-foreground">NPR {totalRevenue}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold">{t('admin.dashboard.stats.allTime')}</p>
                </div>
                <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                  <DollarSign className="h-7 w-7 text-slate-900" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 border-orange-500/30 bg-card shadow-lg hover:shadow-orange-500/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{t('admin.dashboard.stats.users')}</p>
                  <p className="text-4xl font-bold mb-1 text-foreground">
                    {new Set(bookings.map(b => b.user?.id)).size}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold">{t('admin.dashboard.stats.registered')}</p>
                </div>
                <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="h-7 w-7 text-slate-900" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Simple */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">{t('admin.dashboard.actions.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link to="/admin/tractors">
                  <div className="h-full rounded-lg border-2 border-amber-500/30 hover:border-amber-500 bg-card/50 hover:bg-card transition-all p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-900 grid place-items-center shadow-md group-hover:scale-110 transition-transform">
                        <Tractor className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{t('admin.dashboard.actions.manageTractors')}</p>
                        <p className="text-xs text-muted-foreground">{t('admin.dashboard.actions.manageTractorsDesc')}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link to="/admin/bookings">
                  <div className="h-full rounded-lg border-2 border-emerald-500/30 hover:border-emerald-500 bg-card/50 hover:bg-card transition-all p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500 text-slate-900 grid place-items-center shadow-md group-hover:scale-110 transition-transform">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{t('admin.dashboard.actions.manageBookings')}</p>
                        <p className="text-xs text-muted-foreground">{t('admin.dashboard.actions.manageBookingsDesc')}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link to="/tractors">
                  <div className="h-full rounded-lg border-2 border-yellow-500/30 hover:border-yellow-500 bg-card/50 hover:bg-card transition-all p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500 text-slate-900 grid place-items-center shadow-md group-hover:scale-110 transition-transform">
                        <Tractor className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{t('admin.dashboard.actions.browseTractors')}</p>
                        <p className="text-xs text-muted-foreground">{t('admin.dashboard.actions.browseTractorsDesc')}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-yellow-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link to="/admin/reports">
                  <div className="h-full rounded-lg border-2 border-orange-500/30 hover:border-orange-500 bg-card/50 hover:bg-card transition-all p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500 text-slate-900 grid place-items-center shadow-md group-hover:scale-110 transition-transform">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{t('admin.dashboard.actions.viewReports')}</p>
                        <p className="text-xs text-muted-foreground">{t('admin.dashboard.actions.viewReportsDesc')}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-orange-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">{t('admin.dashboard.recent.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('admin.dashboard.recent.empty')}</p>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between text-sm border-b border-border pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-foreground">{booking.tractor?.name || t('admin.dashboard.recent.unknownTractor')}</p>
                        <p className="text-xs text-muted-foreground">{booking.user?.name || t('admin.dashboard.recent.unknownUser')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-500">NPR {booking.totalAmount || 0}</p>
                        <p className="text-xs text-muted-foreground capitalize">{booking.status?.toLowerCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminDashboard;
