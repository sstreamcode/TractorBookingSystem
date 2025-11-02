import { Navigate, Link } from 'react-router-dom';
import { Tractor, Users, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllBookings, fetchTractors, type TractorApiModel, type BookingApiModel } from '@/lib/api';
import { useEffect, useState } from 'react';

const AdminDashboard = () => {
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
      <div className="min-h-screen bg-gray-50">
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Calculate stats from real data
  const totalRevenue = bookings
    .filter(b => b.status === 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Sort bookings by date (most recent first) and take the 5 most recent
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your tractor rental business</p>
        </div>

        {/* Stats Grid - Simple Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-medium">Total Tractors</p>
                  <p className="text-4xl font-bold mb-1 text-gray-900">{tractors.length}</p>
                  <p className="text-xs text-primary mt-1 font-semibold">
                    {tractors.filter(t => t.available).length} available
                  </p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Tractor className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-medium">Total Bookings</p>
                  <p className="text-4xl font-bold mb-1 text-gray-900">{bookings.length}</p>
                  <p className="text-xs text-primary mt-1 font-semibold">
                    {bookings.filter(b => b.status === 'PAID').length} active
                  </p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-medium">Total Revenue</p>
                  <p className="text-4xl font-bold mb-1 text-gray-900">रू {totalRevenue}</p>
                  <p className="text-xs text-gray-600 mt-1 font-semibold">All time</p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-medium">Active Users</p>
                  <p className="text-4xl font-bold mb-1 text-gray-900">
                    {new Set(bookings.map(b => b.user?.id)).size}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 font-semibold">Registered</p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Simple */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link to="/admin/tractors">
                  <div className="h-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                        <Tractor className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Manage Tractors</p>
                        <p className="text-xs text-gray-600">Add, edit, and remove tractors</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
                <Link to="/admin/bookings">
                  <div className="h-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Manage Bookings</p>
                        <p className="text-xs text-gray-600">Approve, reject or verify bookings</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
                <Link to="/tractors">
                  <div className="h-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                        <Tractor className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Browse Tractors</p>
                        <p className="text-xs text-gray-600">View your public tractor catalog</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
                <Link to="/admin/reports">
                  <div className="h-full rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">View Reports</p>
                        <p className="text-xs text-gray-600">Get insights and summaries</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-sm text-gray-600">No bookings yet</p>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-gray-900">{booking.tractor?.name || 'Unknown Tractor'}</p>
                        <p className="text-xs text-gray-600">{booking.user?.name || 'Unknown User'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">रू {booking.totalAmount || 0}</p>
                        <p className="text-xs text-gray-600 capitalize">{booking.status?.toLowerCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
