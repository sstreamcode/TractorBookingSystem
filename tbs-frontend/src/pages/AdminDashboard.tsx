import { Navigate, Link } from 'react-router-dom';
import { Tractor, Users, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { mockTractors, mockBookings } from '@/data/mockData';

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const totalRevenue = mockBookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalCost, 0);

  const recentBookings = mockBookings.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your tractor rental business</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 perspective-container">
          <Card className="card-3d border-none shadow-2xl bg-gradient-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Total Tractors</p>
                  <p className="text-4xl font-bold mb-1">{mockTractors.length}</p>
                  <p className="text-xs text-success mt-1 font-semibold">
                    {mockTractors.filter(t => t.available).length} available
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <Tractor className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d border-none shadow-2xl bg-gradient-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Total Bookings</p>
                  <p className="text-4xl font-bold mb-1">{mockBookings.length}</p>
                  <p className="text-xs text-secondary mt-1 font-semibold">
                    {mockBookings.filter(b => b.status === 'confirmed').length} active
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d border-none shadow-2xl bg-gradient-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Total Revenue</p>
                  <p className="text-4xl font-bold mb-1">रू {totalRevenue}</p>
                  <p className="text-xs text-success mt-1 font-semibold">All time</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-success to-success/80 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d border-none shadow-2xl bg-gradient-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Active Users</p>
                  <p className="text-4xl font-bold mb-1">
                    {new Set(mockBookings.map(b => b.userId)).size}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-semibold">Registered</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 perspective-container">
          <Card className="card-3d border-none shadow-2xl bg-gradient-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/tractors">
                <Button className="w-full justify-between" variant="outline">
                  <span className="flex items-center">
                    <Tractor className="mr-2 h-4 w-4" />
                    Manage Tractors
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/bookings">
                <Button className="w-full justify-between" variant="outline">
                  <span className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Manage Bookings
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-3d border-none shadow-2xl bg-gradient-card">
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings yet</p>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{booking.tractorName}</p>
                        <p className="text-xs text-muted-foreground">{booking.userName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">रू {booking.totalCost}</p>
                        <p className="text-xs text-muted-foreground capitalize">{booking.status}</p>
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
