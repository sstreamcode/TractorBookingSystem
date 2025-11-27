import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tractors from "./pages/Tractors";
import TractorDetail from "./pages/TractorDetail";
import UserDashboard from "./pages/UserDashboard";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTractors from "./pages/AdminTractors";
import AdminBookings from "./pages/AdminBookings";
import AdminReports from "./pages/AdminReports";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import MapPreview from "./pages/MapPreview";
import NotFound from "./pages/NotFound";
import Tracking from "./pages/Tracking";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/tractors" element={<UserOnly><Tractors /></UserOnly>} />
              <Route path="/tractors/:id" element={<UserOnly><TractorDetail /></UserOnly>} />
              <Route path="/dashboard" element={<UserOnly><UserDashboard /></UserOnly>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payment/success" element={<UserOnly><PaymentSuccess /></UserOnly>} />
              <Route path="/payment/failure" element={<UserOnly><PaymentFailure /></UserOnly>} />
              <Route path="/tracking" element={<UserOnly><Tracking /></UserOnly>} />
              <Route path="/map-preview" element={<MapPreview />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/admin/dashboard" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
              <Route path="/admin/tractors" element={<AdminOnly><AdminTractors /></AdminOnly>} />
              <Route path="/admin/bookings" element={<AdminOnly><AdminBookings /></AdminOnly>} />
              <Route path="/admin/reports" element={<AdminOnly><AdminReports /></AdminOnly>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

// Admin route guard - only admins can access
function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  // Wait for auth to finish loading before redirecting
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// User route guard - only regular users can access (not admins)
function UserOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();

  // Wait for auth to finish loading before redirecting
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
}
