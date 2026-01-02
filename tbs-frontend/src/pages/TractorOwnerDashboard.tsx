import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, MapPin, Loader2, Calendar, DollarSign, Tractor as TractorIcon, Users, 
  TrendingUp, Download, Eye, Filter, CheckCircle, XCircle, Play, Clock, 
  Package, Activity, BarChart3, PieChart, AlertCircle, CheckCircle2, X,
  Truck, Info, Settings, User, ChevronLeft, ChevronRight
} from 'lucide-react';
import TractorOwnerSidebar from '@/components/TractorOwnerSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchTractors,
  deleteTractor,
  createTractor,
  updateTractor,
  uploadImageWithProgress,
  updateTractorLocation,
  getTractorTracking,
  getTractorOwnerBookingsForUIWithNested,
  updateTractorDeliveryStatus,
  markBookingDelivered,
  markBookingCompleted,
  approveBooking,
  denyBooking,
  type TractorApiModel,
  type TrackingResponse,
} from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Tractor, Booking } from '@/types';
import { toast } from 'sonner';
import DeliveryMapPicker from '@/components/DeliveryMapPicker';
import TractorTrackingMap, { TractorTrackingPoint } from '@/components/TractorTrackingMap';
import LiveRouteMap from '@/components/LiveRouteMap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const TractorOwnerDashboard = () => {
  const { isAuthenticated, isTractorOwner, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dashboard stats state
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tractors tab state
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    model: '',
    hourlyRate: '',
    imageUrl: '',
    available: true,
    description: '',
    location: '',
    horsePower: '',
    fuelType: 'Diesel',
    fuelLevel: '80',
    rating: '4.5',
    status: 'Available',
    nextAvailableDate: '',
    nextAvailableTime: '',
    category: 'Utility',
    quantity: '1',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [preview, setPreview] = useState<string>('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80');
  const [progress, setProgress] = useState<number>(0);
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingTractor, setTrackingTractor] = useState<Tractor | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<TractorTrackingPoint[]>([]);
  const [trackingDetails, setTrackingDetails] = useState<TrackingResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  
  // Bookings tab state
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [bookingImageIndices, setBookingImageIndices] = useState<Record<string, number>>({});
  const [selectedActions, setSelectedActions] = useState<Record<string, string>>({});
  const [processingBookings, setProcessingBookings] = useState<Set<string>>(new Set());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ownerCurrentLocation, setOwnerCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const fallback = `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      return data?.display_name || fallback;
    } catch {
      return fallback;
    }
  }, []);

  const fetchTrackingDetails = useCallback(async (tractorId: string) => {
    try {
      setTrackingLoading(true);
      const data = await getTractorTracking(tractorId);
      setTrackingDetails(data);
      setTrackingError(null);
    } catch (error: any) {
      setTrackingError(error?.message || 'Unable to load tracking data');
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  const handleLiveLocationUpdate = useCallback(async () => {
    if (!trackingTractor) return;
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await reverseGeocode(lat, lng);
          await updateTractorLocation(trackingTractor.id, lat, lng, address);
          toast.success('Location updated');
          await fetchTrackingDetails(trackingTractor.id);
        } catch (error: any) {
          toast.error(error?.message || 'Failed to update location');
        }
      },
      () => toast.error('Failed to get location')
    );
  }, [trackingTractor, reverseGeocode, fetchTrackingDetails]);

  const handleTrack = useCallback(async (tractor: Tractor) => {
    setTrackingTractor(tractor);
    setTrackingOpen(true);
    await fetchTrackingDetails(tractor.id);
  }, [fetchTrackingDetails]);

  const refreshTractors = async () => {
    try {
      const tractorData = await fetchTractors();
      const mappedTractors: Tractor[] = tractorData.map((t: TractorApiModel) => ({
        id: String(t.id),
        name: t.name,
        model: t.model,
        image: t.imageUrl || '',
        images: t.imageUrls,
        hourlyRate: t.hourlyRate,
        location: t.location || '',
        latitude: t.latitude,
        longitude: t.longitude,
        horsePower: t.horsePower,
        fuelType: t.fuelType,
        available: t.available ?? true,
        description: t.description,
        fuelLevel: t.fuelLevel,
        rating: t.rating,
        totalBookings: t.totalBookings,
        status: t.status,
        nextAvailableAt: t.nextAvailableAt,
        category: t.category,
        quantity: t.quantity,
        approvalStatus: (t as any).approvalStatus,
      }));
      setTractors(mappedTractors);
      
      // Update tracking points
      const points: TractorTrackingPoint[] = mappedTractors
        .filter(t => t.latitude && t.longitude)
        .map(t => {
          const hasBookings = bookings.some(b => b.tractor?.id === t.id);
          const isFullyBooked = bookings.some(b => 
            b.tractor?.id === t.id && 
            (b.status === 'delivered' || b.status === 'paid' || b.status === 'completed')
          );
          return {
            id: t.id,
            name: t.name,
            lat: t.latitude!,
            lng: t.longitude!,
            status: isFullyBooked ? 'booked' : hasBookings ? 'partial' : 'available',
            address: t.location,
          };
        });
      setTrackingPoints(points);
    } catch (e) {
      setError('Failed to load tractors');
      toast.error('Failed to load your tractors');
    }
  };

  const refreshBookings = async () => {
    try {
      const bookingData = await getTractorOwnerBookingsForUIWithNested();
      setBookings(bookingData as any);
      
      // Also update selectedBooking if it exists
      if (selectedBooking) {
        const updated = bookingData.find((b: any) => String(b.id) === String(selectedBooking.id));
        if (updated) {
          setSelectedBooking(updated);
        }
      }
    } catch (e) {
      toast.error('Failed to load bookings');
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setOwnerCurrentLocation(coords);
          setSelectedLocation((prev) => prev ?? { ...coords, address: form.location || 'Current location' });
        },
        async () => {
          const defaultCoords = { lat: 27.7172, lng: 85.3240 };
          setOwnerCurrentLocation(defaultCoords);
          const address = await reverseGeocode(defaultCoords.lat, defaultCoords.lng);
          setSelectedLocation({ ...defaultCoords, address });
        }
      );
    } else {
      const defaultCoords = { lat: 27.7172, lng: 85.3240 };
      setOwnerCurrentLocation(defaultCoords);
      setSelectedLocation({ ...defaultCoords, address: 'Kathmandu, Nepal' });
    }
  }, []);

  // Get owner location once when booking details modal opens (no periodic updates)
  useEffect(() => {
    if (!selectedBooking) {
      setOwnerCurrentLocation(null);
      return;
    }
    
    // Get location once when modal opens
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOwnerCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Silently fail if location access denied
          setOwnerCurrentLocation(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setOwnerCurrentLocation(null);
    }
  }, [selectedBooking]);
  
  useEffect(() => {
    if (isAuthenticated && isTractorOwner) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([refreshTractors(), refreshBookings()]);
        setLoading(false);
      };
      loadData();
    }
  }, [isAuthenticated, isTractorOwner]);

  // Wait for auth to finish loading before redirecting
  if (authLoading) {
    return (
      <SidebarProvider>
        <TractorOwnerSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated || !isTractorOwner) {
    return <Navigate to="/" replace />;
  }

  // Helper function to check if a booking is paid
  const isBookingPaid = (booking: Booking): boolean => {
    if (booking.payments && booking.payments.length > 0) {
      return booking.payments.some(p => p.status === 'SUCCESS');
    }
    const paymentMethod = booking.paymentMethod;
    if (paymentMethod !== 'CASH_ON_DELIVERY') {
      return booking.status === 'paid' || booking.status === 'delivered' || booking.status === 'completed';
    }
    return false;
  };

  // Calculate stats for dashboard
  // Total revenue after commission (85% of paid bookings)
  const totalRevenue = Math.round((bookings
    .filter(isBookingPaid)
    .reduce((sum, b) => {
      const total = (b as any).totalAmount || b.totalCost || 0;
      const commission = (b as any).commissionAmount || total * 0.15;
      return sum + (total - commission);
    }, 0)) * 100) / 100;
  
  const paidBookings = bookings.filter(isBookingPaid);
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const pendingBookings = bookings.filter(b => b.status === 'pending' || b.adminStatus === 'pending');

  const handleAdd = async () => {
    if (saving) return;
    
    try {
      if (!form.name || !form.model || !form.hourlyRate) {
        toast.error('Please fill all required fields');
        return;
      }
      const rate = Number(form.hourlyRate);
      if (Number.isNaN(rate) || rate <= 0) {
        toast.error('Hourly rate must be a positive number');
        return;
      }
      const horsePower = form.horsePower ? Number(form.horsePower) : undefined;
      const fuelLevel = form.fuelLevel ? Number(form.fuelLevel) : undefined;
      const rating = form.rating ? Number(form.rating) : undefined;
      const quantity = form.quantity && form.quantity.trim() !== '' 
        ? Number(form.quantity) 
        : (form.quantity === '0' ? 0 : 1);
      const nextAvailableAt = form.nextAvailableDate && form.nextAvailableTime
        ? `${form.nextAvailableDate}T${form.nextAvailableTime}`
        : undefined;
      
      let finalUrl = form.imageUrl || '';
      const uploadedUrls: string[] = [];
      
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const up = await uploadImageWithProgress(files[i], setProgress);
          uploadedUrls.push(up.url);
        }
        finalUrl = uploadedUrls[0];
      }
      
      const allImages = editingId 
        ? [...existingImages, ...uploadedUrls]
        : uploadedUrls;
      
      const effectiveLatitude = selectedLocation?.lat;
      const effectiveLongitude = selectedLocation?.lng;
      const effectiveAddress = form.location || selectedLocation?.address || undefined;

      setSaving(true);
      
      if (editingId) {
        await updateTractor(editingId, {
          name: form.name,
          model: form.model,
          hourlyRate: rate,
          available: form.available,
          imageUrl: finalUrl || undefined,
          imageUrls: allImages.length > 0 ? allImages : undefined,
          description: form.description || undefined,
          location: effectiveAddress,
          latitude: effectiveLatitude,
          longitude: effectiveLongitude,
          horsePower,
          fuelType: form.fuelType,
          fuelLevel,
          rating,
          status: form.status,
          nextAvailableAt,
          category: form.category,
          quantity,
        });
        toast.success('Tractor updated successfully');
      } else {
        await createTractor({
          name: form.name,
          model: form.model,
          hourlyRate: rate,
          available: form.available,
          imageUrl: finalUrl || undefined,
          imageUrls: allImages.length > 0 ? allImages : undefined,
          description: form.description || undefined,
          location: effectiveAddress,
          latitude: effectiveLatitude,
          longitude: effectiveLongitude,
          horsePower,
          fuelType: form.fuelType,
          fuelLevel,
          rating,
          status: form.status,
          nextAvailableAt,
          category: form.category,
          quantity,
        });
        toast.success('Tractor added successfully! It will be reviewed by super admin before being listed.');
      }
      
      setOpen(false);
      resetForm();
      await refreshTractors();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save tractor');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tractor: Tractor) => {
    setEditingId(tractor.id);
    setForm({
      name: tractor.name,
      model: tractor.model,
      hourlyRate: String(tractor.hourlyRate),
      imageUrl: tractor.image || '',
      available: tractor.available ?? true,
      description: tractor.description || '',
      location: tractor.location || '',
      horsePower: tractor.horsePower ? String(tractor.horsePower) : '',
      fuelType: tractor.fuelType || 'Diesel',
      fuelLevel: tractor.fuelLevel ? String(tractor.fuelLevel) : '80',
      rating: tractor.rating ? String(tractor.rating) : '4.5',
      status: tractor.status || 'Available',
      nextAvailableDate: tractor.nextAvailableAt ? tractor.nextAvailableAt.split('T')[0] : '',
      nextAvailableTime: tractor.nextAvailableAt ? tractor.nextAvailableAt.split('T')[1]?.substring(0, 5) : '',
      category: tractor.category || 'Utility',
      quantity: tractor.quantity ? String(tractor.quantity) : '1',
    });
    setExistingImages(tractor.images || []);
    setPreview(tractor.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80');
    setSelectedLocation(
      tractor.latitude && tractor.longitude
        ? { lat: tractor.latitude, lng: tractor.longitude, address: tractor.location }
        : null
    );
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tractor?')) {
      return;
    }
    try {
      await deleteTractor(id);
      toast.success('Tractor deleted successfully');
      await refreshTractors();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete tractor');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      model: '',
      hourlyRate: '',
      imageUrl: '',
      available: true,
      description: '',
      location: '',
      horsePower: '',
      fuelType: 'Diesel',
      fuelLevel: '80',
      rating: '4.5',
      status: 'Available',
      nextAvailableDate: '',
      nextAvailableTime: '',
      category: 'Utility',
      quantity: '1',
    });
    setFiles([]);
    setExistingImages([]);
    setPreview('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80');
    setSelectedLocation(null);
    setTab('upload');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFiles[0]);
    }
  };

  const handleUseMyLocationForForm = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await reverseGeocode(lat, lng);
        setSelectedLocation({ lat, lng, address });
        setForm(prev => ({ ...prev, location: address }));
      },
      () => toast.error('Failed to get location')
    );
  };

  // Booking handlers
  const handleUpdateDeliveryStatus = async (bookingId: string, status: 'DELIVERING' | 'DELIVERED' | 'RETURNED') => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      await updateTractorDeliveryStatus(bookingId, status);
      toast.success(`Delivery status updated to ${status}`);
      
      // Refresh bookings - this will also update selectedBooking automatically
      await refreshBookings();
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

  const handleMarkDelivered = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      await markBookingDelivered(bookingId);
      toast.success('Booking marked as delivered');
      await refreshBookings();
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

  const handleMarkCompleted = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      await markBookingCompleted(bookingId);
      toast.success('Booking marked as completed');
      await refreshBookings();
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

  const handleApproveBooking = async (bookingId: string) => {
    setProcessingBookings(prev => new Set(prev).add(bookingId));
    try {
      await approveBooking(bookingId);
      toast.success('Booking approved');
      await refreshBookings();
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
      await refreshBookings();
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

  // Filter, search, and sort bookings
  const filteredBookings = bookings
    .filter(booking => {
      const bookingData = booking as any;
      const tractorName = bookingData.tractor?.name || bookingData.tractorName || '';
      const userName = bookingData.user?.name || bookingData.userName || '';
      const bookingStatus = booking.status || '';
      
      // Status, payment, and admin status filters
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
      const matchesAdminStatus = adminStatusFilter === 'all' || booking.adminStatus === adminStatusFilter;
      
      // Search filter (by name or status)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        tractorName.toLowerCase().includes(searchLower) ||
        userName.toLowerCase().includes(searchLower) ||
        bookingStatus.toLowerCase().includes(searchLower);
      
      return matchesStatus && matchesPayment && matchesAdminStatus && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by most recent first (LIFO - Last In First Out)
      // Use booking ID (higher ID = more recent) as primary sort
      // If IDs are equal or unavailable, fall back to start date
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      
      if (idA !== idB) {
        return idB - idA; // Higher ID (more recent) first
      }
      
      // Fallback to start date if IDs are same
      const dateA = new Date((a as any).startDate || a.startDate || 0).getTime();
      const dateB = new Date((b as any).startDate || b.startDate || 0).getTime();
      return dateB - dateA; // Most recent date first
    });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paymentFilter, adminStatusFilter, searchQuery]);

  // Reports generation
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Header
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Tractor Owner Dashboard', pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTS & ANALYTICS', pageWidth / 2, 28, { align: 'center' });

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

    // Key Metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Key Performance Metrics', 14, yPosition);
    yPosition += 8;

    const metricsData = [
      ['Total Revenue', `Rs. ${totalRevenue.toLocaleString()}`],
      ['Total Bookings', bookings.length.toString()],
      ['Paid Bookings', paidBookings.length.toString()],
      ['Completed Bookings', completedBookings.length.toString()],
      ['Total Tractors', tractors.length.toString()],
      ['Available Tractors', tractors.filter(t => t.available).length.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'striped',
      headStyles: { 
        fillColor: [245, 158, 11],
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

    const statusCounts = {
      completed: completedBookings.length,
      delivered: bookings.filter(b => b.status === 'delivered').length,
      paid: paidBookings.length,
      pending: pendingBookings.length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };

    const totalForStatus = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const statusData = [
      ['Completed', statusCounts.completed.toString(), totalForStatus > 0 ? `${((statusCounts.completed / totalForStatus) * 100).toFixed(1)}%` : '0%'],
      ['Delivered', statusCounts.delivered.toString(), totalForStatus > 0 ? `${((statusCounts.delivered / totalForStatus) * 100).toFixed(1)}%` : '0%'],
      ['Paid', statusCounts.paid.toString(), totalForStatus > 0 ? `${((statusCounts.paid / totalForStatus) * 100).toFixed(1)}%` : '0%'],
      ['Pending', statusCounts.pending.toString(), totalForStatus > 0 ? `${((statusCounts.pending / totalForStatus) * 100).toFixed(1)}%` : '0%'],
      ['Cancelled', statusCounts.cancelled.toString(), totalForStatus > 0 ? `${((statusCounts.cancelled / totalForStatus) * 100).toFixed(1)}%` : '0%'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      theme: 'striped',
      headStyles: { 
        fillColor: [245, 158, 11],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Top Tractors
    if (tractors.length > 0) {
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Your Tractors', 14, yPosition);
      yPosition += 8;

      const tractorData = tractors.map((t, idx) => [
        (idx + 1).toString(),
        t.name || 'N/A',
        t.model || 'N/A',
        t.available ? 'Available' : 'Unavailable',
        `Rs. ${t.hourlyRate}/hr`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Name', 'Model', 'Status', 'Rate']],
        body: tractorData,
        theme: 'striped',
        headStyles: { 
          fillColor: [245, 158, 11],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { fontSize: 9, cellPadding: 2 },
        margin: { left: 14, right: 14 }
      });
    }

    doc.save(`tractor-owner-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report generated successfully');
  };

  if (loading) {
    return (
      <SidebarProvider>
        <TractorOwnerSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <TractorOwnerSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'tractors' && 'Tractors'}
              {activeTab === 'bookings' && 'Bookings'}
              {activeTab === 'reports' && 'Reports'}
            </h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-2 border-amber-500/30 bg-card shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Tractors</p>
                      <p className="text-4xl font-bold mb-1 text-foreground">{tractors.length}</p>
                      <p className="text-xs text-amber-500 mt-1 font-semibold">
                        {tractors.filter(t => t.available).length} Available
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
                      <TractorIcon className="h-7 w-7 text-slate-900" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-500/30 bg-card shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Bookings</p>
                      <p className="text-4xl font-bold mb-1 text-foreground">{bookings.length}</p>
                      <p className="text-xs text-emerald-500 mt-1 font-semibold">
                        {paidBookings.length} Paid
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                      <Calendar className="h-7 w-7 text-slate-900" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-500/30 bg-card shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Total Revenue</p>
                      <p className="text-4xl font-bold mb-1 text-foreground">Rs. {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-semibold">All Time (After 15% Commission)</p>
                    </div>
                    <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                      <DollarSign className="h-7 w-7 text-slate-900" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-500/30 bg-card shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Total Received</p>
                      <p className="text-4xl font-bold mb-1 text-green-600">
                        Rs. {bookings
                          .filter(b => (b as any).paymentReleased)
                          .reduce((sum, b) => {
                            const total = (b as any).totalAmount || b.totalCost || 0;
                            const commission = (b as any).commissionAmount || total * 0.15;
                            return sum + (total - commission);
                          }, 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-semibold">
                        {bookings.filter(b => (b as any).paymentReleased).length} Payments Released
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                      <CheckCircle className="h-7 w-7 text-slate-900" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-500/30 bg-card shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Completed</p>
                      <p className="text-4xl font-bold mb-1 text-foreground">{completedBookings.length}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-semibold">Successful</p>
                    </div>
                    <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                      <CheckCircle className="h-7 w-7 text-slate-900" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No bookings yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tractor</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.slice(0, 5).map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>{booking.tractor?.name || 'N/A'}</TableCell>
                          <TableCell>{booking.user?.name || 'N/A'}</TableCell>
                          <TableCell>{new Date(booking.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>Rs. {booking.totalAmount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>
                            <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tractors Tab */}
          <TabsContent value="tractors" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Tractors</h2>
                <p className="text-muted-foreground">Manage your tractor listings</p>
              </div>
              <Dialog open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tractor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingId ? 'Edit Tractor' : 'Add New Tractor'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Tractor Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Model *</Label>
                        <Input
                          value={form.model}
                          onChange={(e) => setForm({ ...form, model: e.target.value })}
                          placeholder="Model"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hourly Rate (Rs.) *</Label>
                        <Input
                          type="number"
                          value={form.hourlyRate}
                          onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Horse Power</Label>
                        <Input
                          type="number"
                          value={form.horsePower}
                          onChange={(e) => setForm({ ...form, horsePower: e.target.value })}
                          placeholder="HP"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fuel Type</Label>
                        <Select value={form.fuelType} onValueChange={(value) => setForm({ ...form, fuelType: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Petrol">Petrol</SelectItem>
                            <SelectItem value="Electric">Electric</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fuel Level (%)</Label>
                        <Input
                          type="number"
                          value={form.fuelLevel}
                          onChange={(e) => setForm({ ...form, fuelLevel: e.target.value })}
                          placeholder="80"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Utility">Utility</SelectItem>
                            <SelectItem value="Agricultural">Agricultural</SelectItem>
                            <SelectItem value="Construction">Construction</SelectItem>
                            <SelectItem value="Heavy Duty">Heavy Duty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={form.quantity}
                          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                          placeholder="1"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Tractor description..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Location</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocationForForm}>
                          Use my GPS
                        </Button>
                      </div>
                      <Input
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Address or location"
                      />
                      <DeliveryMapPicker
                        value={
                          selectedLocation
                            ? {
                                lat: selectedLocation.lat,
                                lng: selectedLocation.lng,
                                address: selectedLocation.address || form.location || '',
                              }
                            : undefined
                        }
                        onChange={(value) => {
                          setSelectedLocation(value);
                          setForm((s) => ({ ...s, location: value.address }));
                        }}
                        className="h-64 w-full rounded-lg border"
                        mapZIndex={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Images</Label>
                      <Tabs value={tab} onValueChange={(v) => setTab(v as 'upload' | 'url')}>
                        <TabsList>
                          <TabsTrigger value="upload">Upload Files</TabsTrigger>
                          <TabsTrigger value="url">Image URL</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="space-y-2">
                          <Input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                          {files.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                              {files.map((file, idx) => (
                                <img
                                  key={idx}
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                          {existingImages.length > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Existing Images:</p>
                              <div className="grid grid-cols-4 gap-2">
                                {existingImages.map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt={`Existing ${idx + 1}`}
                                    className="w-full h-24 object-cover rounded"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {progress > 0 && progress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          )}
                        </TabsContent>
                        <TabsContent value="url" className="space-y-2">
                          <Input
                            value={form.imageUrl}
                            onChange={(e) => {
                              setForm({ ...form, imageUrl: e.target.value });
                              setPreview(e.target.value);
                            }}
                            placeholder="https://example.com/image.jpg"
                          />
                          {preview && (
                            <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded" />
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={form.available}
                        onCheckedChange={(checked) => setForm({ ...form, available: checked })}
                      />
                      <Label>Available</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingId ? 'Update' : 'Create'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="mb-6">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle className="text-xl">Fleet Tracker</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monitor your tractors in real-time with status-based color codes.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <TractorTrackingMap points={trackingPoints} mapZIndex={0} />
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40"></span>
                    Available
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/40"></span>
                    Partially booked
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500 shadow-sm shadow-red-500/40"></span>
                    Fully booked / In use
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Tractors ({tractors.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {tractors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tractors found. Add your first tractor to get started!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approval</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tractors.map((tractor) => {
                        const approvalStatus = (tractor as any).approvalStatus || 'PENDING';
                        return (
                          <TableRow key={tractor.id}>
                            <TableCell>
                              <img
                                src={tractor.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80'}
                                alt={tractor.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{tractor.name}</TableCell>
                            <TableCell>{tractor.model}</TableCell>
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
                                approvalStatus === 'REJECTED' ? 'destructive' :
                                'secondary'
                              }>
                                {approvalStatus === 'APPROVED' ? 'Approved' :
                                 approvalStatus === 'PENDING' ? 'Pending Review' :
                                 approvalStatus === 'REJECTED' ? 'Rejected' :
                                 'Pending Review'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTrack(tractor)}
                                  title="Track tractor"
                                >
                                  <MapPin className="h-4 w-4 text-amber-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(tractor)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(tractor.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Dialog
              open={trackingOpen}
              onOpenChange={(open) => {
                setTrackingOpen(open);
                if (!open) {
                  setTrackingTractor(null);
                  setTrackingDetails(null);
                  setTrackingError(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Track Tractor</DialogTitle>
                  <DialogDescription>
                    View the live location and route of the selected tractor
                  </DialogDescription>
                </DialogHeader>
                {trackingTractor ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{trackingTractor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {trackingDetails?.currentLocation?.updatedAt
                            ? `Last update ${new Date(trackingDetails.currentLocation.updatedAt).toLocaleString()}`
                            : trackingTractor.location
                            ? `Last known location: ${trackingTractor.location}`
                            : 'Awaiting first location update'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleLiveLocationUpdate}>
                        Use my GPS
                      </Button>
                    </div>

                    {trackingError && <p className="text-sm text-red-600">{trackingError}</p>}

                    {trackingLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                      </div>
                    ) : trackingDetails?.currentLocation ? (
                      <div className="space-y-4">
                        <LiveRouteMap
                          startLat={trackingDetails.currentLocation.latitude}
                          startLng={trackingDetails.currentLocation.longitude}
                          endLat={trackingDetails.currentLocation.latitude}
                          endLng={trackingDetails.currentLocation.longitude}
                          className="h-64 w-full rounded-lg border"
                        />
                        <div className="text-sm space-y-1">
                          <p><strong>Address:</strong> {trackingDetails.currentLocation.address || 'N/A'}</p>
                          <p><strong>Coordinates:</strong> {trackingDetails.currentLocation.latitude.toFixed(5)}, {trackingDetails.currentLocation.longitude.toFixed(5)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No tracking data available</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Bookings</h2>
                <p className="text-muted-foreground">Manage bookings for your tractors</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Filters & Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Search by Name or Status</Label>
                    <Input
                      placeholder="Search by tractor name, customer name, or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment</Label>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Status</Label>
                    <Select value={adminStatusFilter} onValueChange={setAdminStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Bookings ({filteredBookings.length})
                  {filteredBookings.length > itemsPerPage && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredBookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No bookings found</p>
                ) : (
                  <>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">Tractor</TableHead>
                              <TableHead className="whitespace-nowrap">Customer</TableHead>
                              <TableHead className="whitespace-nowrap">Start Date</TableHead>
                              <TableHead className="whitespace-nowrap">End Date</TableHead>
                              <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                              <TableHead className="whitespace-nowrap">Commission (15%)</TableHead>
                              <TableHead className="whitespace-nowrap">Your Amount (85%)</TableHead>
                              <TableHead className="whitespace-nowrap">Customer Payment</TableHead>
                              <TableHead className="whitespace-nowrap">Status</TableHead>
                              <TableHead className="whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedBookings.map((booking) => {
                            const bookingData = booking as any;
                            const gallery = bookingData.tractor?.images || bookingData.tractorImages || (bookingData.tractor?.image ? [bookingData.tractor.image] : []) || (bookingData.tractorImage ? [bookingData.tractorImage] : []);
                            const currentIndex = bookingImageIndices[booking.id] || 0;
                            const hasMultipleImages = gallery.length > 1;
                            const tractorName = bookingData.tractor?.name || bookingData.tractorName || 'N/A';
                            const userName = bookingData.user?.name || bookingData.userName || 'N/A';
                            const totalAmount = bookingData.totalAmount || bookingData.totalCost || 0;

                            return (
                              <TableRow key={booking.id} className="hover:bg-muted/50">
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    {gallery.length > 0 ? (
                                      <SmallImageCarousel
                                        id={booking.id}
                                        gallery={gallery}
                                        hasMultipleImages={hasMultipleImages}
                                        onIndexChange={(idx) => setBookingImageIndices(prev => ({ ...prev, [booking.id]: idx }))}
                                        currentIndex={currentIndex}
                                      />
                                    ) : (
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded border border-border bg-muted flex items-center justify-center">
                                        <TractorIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span className="text-xs sm:text-sm font-medium text-foreground">{tractorName}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-foreground whitespace-nowrap text-xs sm:text-sm">{userName}</TableCell>
                                <TableCell className="text-foreground whitespace-nowrap text-xs sm:text-sm">{new Date(booking.startDate).toLocaleDateString()}</TableCell>
                                <TableCell className="text-foreground whitespace-nowrap text-xs sm:text-sm">{new Date(booking.endDate).toLocaleDateString()}</TableCell>
                                <TableCell className="font-semibold text-foreground whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm">Rs. {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    <span className="text-xs text-muted-foreground hidden sm:inline">Booking Total</span>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-red-500 font-semibold text-xs sm:text-sm">
                                      -Rs. {(bookingData.commissionAmount || totalAmount * 0.15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xs text-muted-foreground hidden sm:inline">Platform Fee</span>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-green-600 font-bold text-sm sm:text-lg">
                                      Rs. {((totalAmount || 0) - (bookingData.commissionAmount || totalAmount * 0.15)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xs text-green-500/80 font-medium hidden sm:inline">Your Earnings</span>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {(() => {
                                    const isPaid = booking.paymentStatus === 'paid' || 
                                                  booking.status === 'paid' || 
                                                  booking.status === 'confirmed' || 
                                                  booking.status === 'delivered' || 
                                                  booking.status === 'completed' ||
                                                  (bookingData.payments && bookingData.payments.some((p: any) => p.status === 'SUCCESS'));
                                    
                                    return isPaid ? (
                                      <Badge className="bg-green-600 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        <span className="hidden sm:inline">Paid</span>
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-xs">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        <span className="hidden sm:inline">Unpaid</span>
                                      </Badge>
                                    );
                                  })()}
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
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedBooking(booking)}
                                    className="hover:bg-amber-500/10 hover:border-amber-500 text-xs sm:text-sm px-2 sm:px-3"
                                  >
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">View</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      </div>
                    </div>
                  {filteredBookings.length > 0 && (
                    <div className="mt-4 flex flex-col items-center gap-2 sm:gap-4">
                      <div className="text-xs sm:text-sm text-muted-foreground font-medium text-center">
                        <span className="hidden sm:inline">Page {currentPage} of {totalPages} • </span>
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => {
                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                              }}
                              disabled={currentPage === 1}
                              className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
                            >
                              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Previous</span>
                            </Button>
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, current page, and pages around current
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={page} className="hidden sm:block">
                                  <Button
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="default"
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 sm:h-9 min-w-8 sm:min-w-9 ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
                                  >
                                    {page}
                                  </Button>
                                </PaginationItem>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <PaginationItem key={page} className="hidden sm:block">
                                  <span className="px-2 text-muted-foreground">...</span>
                                </PaginationItem>
                              );
                            }
                            return null;
                          })}
                          <PaginationItem>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => {
                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                              }}
                              disabled={currentPage === totalPages}
                              className="h-8 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm"
                            >
                              <span className="hidden sm:inline">Next</span>
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
                            </Button>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!selectedBooking} onOpenChange={(open) => {
              if (!open) {
                setSelectedBooking(null);
              }
            }}>
              <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                {selectedBooking && (
                  <>
                    <DialogHeader className="pb-4 border-b border-border">
                      <DialogTitle className="text-2xl font-bold text-foreground">Booking Details</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground mt-1">
                        Booking ID: #{selectedBooking.id}
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="details" className="w-full mt-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="actions">Actions</TabsTrigger>
                      </TabsList>
                      <TabsContent value="details" className="space-y-4 mt-4">
                        {/* Tractor Information with Large Image */}
                        <Card className="border border-border bg-card shadow-sm">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                              <TractorIcon className="h-5 w-5 text-amber-500" />
                              Tractor Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="sm:col-span-1">
                                {(() => {
                                  const bookingData = selectedBooking as any;
                                  const images = bookingData.tractor?.images || bookingData.tractorImages || [];
                                  const mainImage = images[0] || bookingData.tractor?.image || bookingData.tractorImage || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';
                                  
                                  if (images.length > 0 || bookingData.tractorImage) {
                                    return (
                                      <div className="space-y-2">
                                        <img 
                                          src={mainImage} 
                                          alt={bookingData.tractor?.name || bookingData.tractorName || 'Tractor'} 
                                          className="w-full h-48 object-cover rounded-lg border border-border shadow-sm"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';
                                          }}
                                        />
                                        {images.length > 1 && (
                                          <div className="grid grid-cols-4 gap-2">
                                            {images.slice(1, 5).map((img: string, idx: number) => (
                                              <img 
                                                key={idx} 
                                                src={img} 
                                                alt={`Tractor ${idx + 2}`} 
                                                className="w-full h-16 object-cover rounded border border-border"
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';
                                                }}
                                              />
                                            ))}
                                            {images.length > 5 && (
                                              <div className="w-full h-16 rounded border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                                +{images.length - 5}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="w-full h-48 rounded-lg border border-border bg-muted flex items-center justify-center">
                                      <TractorIcon className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="sm:col-span-2 space-y-3">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                                  <p className="text-base font-semibold text-foreground">{(selectedBooking as any).tractor?.name || selectedBooking.tractorName || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Model</p>
                                  <p className="text-base text-foreground">{(selectedBooking as any).tractor?.model || 'N/A'}</p>
                                </div>
                                {(selectedBooking as any).tractor?.hourlyRate && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Hourly Rate</p>
                                    <p className="text-base text-foreground">Rs. {(selectedBooking as any).tractor.hourlyRate}/hr</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Customer Information */}
                        <Card className="border border-border bg-card shadow-sm">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                              <User className="h-5 w-5 text-amber-500" />
                              Customer Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                                <p className="text-base font-semibold text-foreground">{(selectedBooking as any).user?.name || selectedBooking.userName || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                                <p className="text-base text-foreground break-all">{(selectedBooking as any).user?.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                                <p className="text-base text-foreground">{(selectedBooking as any).user?.phone || 'N/A'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Booking Information */}
                        <Card className="border border-border bg-card">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                              <Calendar className="h-5 w-5 text-amber-500" />
                              Booking Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Start Date & Time</p>
                                <p className="text-base text-foreground">{new Date(selectedBooking.startDate).toLocaleString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">End Date & Time</p>
                                <p className="text-base text-foreground">{new Date(selectedBooking.endDate).toLocaleString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</p>
                              </div>
                            </div>
                            
                            <div className="pt-4 border-t border-border">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Payment Method</p>
                                    <Badge variant="outline" className="text-base px-3 py-1">
                                      {selectedBooking.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 
                                       selectedBooking.paymentMethod === 'ESEWA' ? 'eSewa' : 
                                       selectedBooking.paymentMethod || 'N/A'}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Customer Payment Status</p>
                                    {(() => {
                                      const bookingData = selectedBooking as any;
                                      const isPaid = selectedBooking.paymentStatus === 'paid' || 
                                                    selectedBooking.status === 'paid' || 
                                                    selectedBooking.status === 'confirmed' || 
                                                    selectedBooking.status === 'delivered' || 
                                                    selectedBooking.status === 'completed' ||
                                                    (bookingData.payments && bookingData.payments.some((p: any) => p.status === 'SUCCESS'));
                                      
                                      return isPaid ? (
                                        <Badge className="bg-green-600 text-base px-3 py-1">
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Paid by Customer
                                        </Badge>
                                      ) : (
                                        <Badge variant="destructive" className="text-base px-3 py-1">
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Unpaid
                                        </Badge>
                                      );
                                    })()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Payment Release Status</p>
                                    {(selectedBooking as any).paymentReleased ? (
                                      <Badge className="bg-green-600 text-base px-3 py-1">
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Released to You
                                      </Badge>
                                    ) : selectedBooking.status === 'completed' ? (
                                      <Badge variant="secondary" className="text-base px-3 py-1">
                                        Pending Release
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-base px-3 py-1">
                                        Not Available
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Payment Breakdown */}
                                <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
                                  <p className="text-sm font-semibold text-foreground mb-3">Payment Breakdown</p>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Total Booking Amount:</span>
                                      <span className="text-base font-semibold text-foreground">
                                        Rs. {((selectedBooking as any).totalAmount || selectedBooking.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Platform Commission (15%):</span>
                                      <span className="text-base font-semibold text-red-500">
                                        -Rs. {(((selectedBooking as any).commissionAmount || ((selectedBooking as any).totalAmount || selectedBooking.totalCost || 0) * 0.15)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="border-t border-border pt-2 mt-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-base font-bold text-foreground">Your Earnings (85%):</span>
                                        <span className="text-xl font-bold text-green-600">
                                          Rs. {(((selectedBooking as any).totalAmount || selectedBooking.totalCost || 0) - ((selectedBooking as any).commissionAmount || ((selectedBooking as any).totalAmount || selectedBooking.totalCost || 0) * 0.15)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-border">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                                <Badge variant={
                                  selectedBooking.status === 'completed' ? 'default' :
                                  selectedBooking.status === 'delivered' ? 'default' :
                                  selectedBooking.status === 'paid' ? 'default' :
                                  selectedBooking.status === 'cancelled' ? 'destructive' :
                                  'secondary'
                                } className="text-sm px-3 py-1">
                                  {selectedBooking.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Admin Status</p>
                                <Badge variant={
                                  selectedBooking.adminStatus === 'approved' ? 'default' :
                                  selectedBooking.adminStatus === 'denied' ? 'destructive' :
                                  'secondary'
                                } className="text-sm px-3 py-1">
                                  {selectedBooking.adminStatus === 'pending_approval' ? 'Pending Approval' : 
                                   selectedBooking.adminStatus || 'N/A'}
                                </Badge>
                              </div>
                              {(selectedBooking as any).tractorDeliveryStatus && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Delivery Status</p>
                                  <Badge variant="outline" className="text-sm px-3 py-1">
                                    {(selectedBooking as any).tractorDeliveryStatus}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {(selectedBooking.deliveryAddress || (selectedBooking.deliveryLatitude && selectedBooking.deliveryLongitude)) && (
                              <div className="pt-4 border-t border-border space-y-4">
                                {selectedBooking.deliveryAddress && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      Delivery Address
                                    </p>
                                    <p className="text-base text-foreground bg-muted/50 p-3 rounded-lg border border-border">
                                      {selectedBooking.deliveryAddress}
                                    </p>
                                  </div>
                                )}
                                {selectedBooking.deliveryLatitude && selectedBooking.deliveryLongitude && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-amber-500" />
                                      Route to Delivery Location
                                    </p>
                                    <div className="rounded-lg border border-border overflow-hidden shadow-sm">
                                      <LiveRouteMap
                                        current={ownerCurrentLocation ? {
                                          lat: ownerCurrentLocation.lat,
                                          lng: ownerCurrentLocation.lng,
                                          label: 'Your Location'
                                        } : null}
                                        destination={(selectedBooking as any).tractorDeliveryStatus === 'RETURNED' && (selectedBooking as any).originalTractorLatitude && (selectedBooking as any).originalTractorLongitude
                                          ? {
                                              lat: (selectedBooking as any).originalTractorLatitude,
                                              lng: (selectedBooking as any).originalTractorLongitude,
                                              label: (selectedBooking as any).originalTractorLocation || 'Original Location'
                                            }
                                          : {
                                              lat: selectedBooking.deliveryLatitude,
                                              lng: selectedBooking.deliveryLongitude,
                                              label: selectedBooking.deliveryAddress || 'Delivery Location'
                                            }}
                                        originalLocation={(selectedBooking as any).originalTractorLatitude && (selectedBooking as any).originalTractorLongitude
                                          ? {
                                              lat: (selectedBooking as any).originalTractorLatitude,
                                              lng: (selectedBooking as any).originalTractorLongitude,
                                              label: (selectedBooking as any).originalTractorLocation || 'Original Location'
                                            }
                                          : null}
                                        useTractorIcon={true}
                                        animateDelivery={(selectedBooking as any).tractorDeliveryStatus === 'DELIVERING'}
                                        showTractorAtDestination={(selectedBooking as any).tractorDeliveryStatus === 'DELIVERED'}
                                        showTractorAtOriginalLocation={(selectedBooking as any).tractorDeliveryStatus === 'RETURNED'}
                                        className="h-80 w-full"
                                      />
                                    </div>
                                    {!ownerCurrentLocation && (
                                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        Enable location access to see your current position and route
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="actions" className="space-y-4 mt-4">
                        <Card className="border border-border bg-card">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                              <Settings className="h-5 w-5 text-amber-500" />
                              Manage Booking
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const bookingData = selectedBooking as any;
                              // Get current delivery status - should be null/undefined for new bookings
                              const currentDeliveryStatus = bookingData.tractorDeliveryStatus || null;
                              const availableActions: Array<{ value: string; label: string; disabled?: boolean; icon?: any }> = [];
                              
                              // Check if customer has paid
                              const isPaid = selectedBooking.paymentStatus === 'paid' || 
                                            selectedBooking.status === 'paid' || 
                                            selectedBooking.status === 'confirmed' || 
                                            selectedBooking.status === 'delivered' || 
                                            selectedBooking.status === 'completed' ||
                                            (bookingData.payments && bookingData.payments.some((p: any) => p.status === 'SUCCESS'));
                              
                              // For COD: allow actions after approval (even if not paid yet)
                              // For eSewa: allow actions after payment
                              const isCOD = selectedBooking.paymentMethod === 'CASH_ON_DELIVERY';
                              
                              // Approval actions for COD bookings - show before delivery status actions
                              if (isCOD && selectedBooking.adminStatus === 'pending_approval') {
                                availableActions.push({ 
                                  value: 'approve_booking', 
                                  label: 'Approve Booking', 
                                  icon: CheckCircle 
                                });
                                availableActions.push({ 
                                  value: 'deny_booking', 
                                  label: 'Deny Booking', 
                                  icon: XCircle 
                                });
                              }
                              
                              // Determine if delivery status actions can be taken
                              const canChangeDeliveryStatus = 
                                selectedBooking.status !== 'cancelled' &&
                                currentDeliveryStatus !== 'RETURNED' &&
                                (
                                  (isCOD && selectedBooking.adminStatus === 'approved') || 
                                  (!isCOD && isPaid) ||
                                  selectedBooking.status === 'delivered' ||
                                  selectedBooking.status === 'completed'
                                );
                              
                              // Always show return action if delivery status is DELIVERED (regardless of other conditions)
                              // This ensures the return action is visible after delivery
                              if (currentDeliveryStatus === 'DELIVERED') {
                                availableActions.push({ value: 'set_returned', label: 'Mark as "Back in Stock"', icon: Package });
                              } else if (canChangeDeliveryStatus) {
                                // Show "On the Way" if status is null/undefined or ORDERED (first step)
                                if (!currentDeliveryStatus || currentDeliveryStatus === 'ORDERED') {
                                  availableActions.push({ value: 'set_delivering', label: 'Mark as "On the Way"', icon: Truck });
                                }
                                // Show "At Customer" if status is DELIVERING (next step)
                                if (currentDeliveryStatus === 'DELIVERING') {
                                  availableActions.push({ value: 'set_delivered', label: 'Mark as "At Customer"', icon: CheckCircle2 });
                                }
                              }
                              
                              // Show "Mark as Completed" action when tractor is RETURNED and booking is not already completed
                              // This allows superadmin to release payment
                              if (currentDeliveryStatus === 'RETURNED' && selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled') {
                                availableActions.push({ 
                                  value: 'mark_completed', 
                                  label: 'Mark Booking as Completed', 
                                  icon: CheckCircle2 
                                });
                              }
                              
                              if (!canChangeDeliveryStatus && currentDeliveryStatus !== 'DELIVERED' && currentDeliveryStatus !== 'RETURNED') {
                                // Show why actions are not available
                                if (selectedBooking.status === 'cancelled') {
                                  availableActions.push({ 
                                    value: 'info', 
                                    label: 'Booking is cancelled', 
                                    disabled: true,
                                    icon: XCircle 
                                  });
                                } else if (isCOD && selectedBooking.adminStatus !== 'approved') {
                                  availableActions.push({ 
                                    value: 'info', 
                                    label: 'Waiting for approval', 
                                    disabled: true,
                                    icon: Clock 
                                  });
                                } else if (!isCOD && !isPaid) {
                                  availableActions.push({ 
                                    value: 'info', 
                                    label: 'Waiting for customer payment', 
                                    disabled: true,
                                    icon: Clock 
                                  });
                                }
                              }

                              if (availableActions.length === 0) {
                                return (
                                  <div className="text-center py-8">
                                    <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                      No actions available for this booking
                                    </p>
                                  </div>
                                );
                              }
                              
                              // Filter out disabled info actions from the button list (they're just for display)
                              const actionableItems = availableActions.filter(a => !a.disabled || a.value === 'info');

                              return (
                                <div className="space-y-3">
                                  {actionableItems.map((action) => {
                                    const isProcessing = processingBookings.has(selectedBooking.id);
                                    const isDisabled = action.disabled || false;
                                    const Icon = action.icon || Play;
                                    const handleAction = async () => {
                                      if (isDisabled || action.value === 'info') return;
                                      // All handlers (approve, deny, updateDeliveryStatus) already handle processing state and refresh
                                      try {
                                        switch (action.value) {
                                          case 'approve_booking':
                                            await handleApproveBooking(selectedBooking.id);
                                            break;
                                          case 'deny_booking':
                                            await handleDenyBooking(selectedBooking.id);
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
                                        }
                                        // All handlers already refresh bookings and update selectedBooking
                                      } catch (error: any) {
                                        toast.error(error?.message || 'Action failed');
                                      }
                                    };
                                    
                                    return (
                                      <Button
                                        key={action.value}
                                        variant={isDisabled ? "secondary" : "default"}
                                        className={`w-full justify-start h-auto py-3 ${
                                          isDisabled 
                                            ? '' 
                                            : 'hover:bg-amber-500 hover:text-white'
                                        }`}
                                        onClick={handleAction}
                                        disabled={isProcessing || isDisabled}
                                      >
                                        {isProcessing ? (
                                          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                        ) : (
                                          <Icon className="h-5 w-5 mr-3" />
                                        )}
                                        <span className="font-medium">{action.label}</span>
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
                  </>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Reports & Analytics</h2>
                <p className="text-muted-foreground">View your business performance metrics</p>
              </div>
              <Button onClick={generatePDFReport}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF Report
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">Rs. {totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-2">From {paidBookings.length} paid bookings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Total Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground mt-2">{completedBookings.length} completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TractorIcon className="h-5 w-5" />
                    Tractors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{tractors.length}</p>
                  <p className="text-sm text-muted-foreground mt-2">{tractors.filter(t => t.available).length} available</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Completed', count: completedBookings.length, color: 'bg-emerald-500' },
                    { label: 'Delivered', count: bookings.filter(b => b.status === 'delivered').length, color: 'bg-blue-500' },
                    { label: 'Paid', count: paidBookings.length, color: 'bg-yellow-500' },
                    { label: 'Pending', count: pendingBookings.length, color: 'bg-orange-500' },
                    { label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length, color: 'bg-red-500' },
                  ].map((item) => {
                    const total = bookings.length || 1;
                    const percentage = (item.count / total) * 100;
                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-muted-foreground">{item.count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Tractors</CardTitle>
              </CardHeader>
              <CardContent>
                {tractors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No tractors yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tractors.map((tractor, idx) => {
                        const tractorBookings = bookings.filter(b => b.tractor?.id === tractor.id);
                        const tractorRevenue = tractorBookings
                          .filter(isBookingPaid)
                          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                        return (
                          <TableRow key={tractor.id}>
                            <TableCell>#{idx + 1}</TableCell>
                            <TableCell className="font-medium">{tractor.name}</TableCell>
                            <TableCell>{tractor.model}</TableCell>
                            <TableCell>{tractorBookings.length}</TableCell>
                            <TableCell>Rs. {tractor.hourlyRate}/hr</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default TractorOwnerDashboard;
