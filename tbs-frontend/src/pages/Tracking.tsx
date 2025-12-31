import { useEffect, useMemo, useState, useRef } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMyBookingsForUI, getBookingTracking, type TrackingResponse } from '@/lib/api';
import type { Booking } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LiveRouteMap from '@/components/LiveRouteMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const Tracking = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const data = await getMyBookingsForUI();
        setBookings(data);
      } catch (e) {
        toast.error('Unable to load your bookings for tracking');
      }
    })();
  }, [isAuthenticated]);

  const trackableBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== 'cancelled'),
    [bookings]
  );

  // Update selectedBookingId when URL parameter changes
  useEffect(() => {
    const paramId = searchParams.get('bookingId');
    if (paramId) {
      // Normalize both paramId and booking.id to strings for comparison
      const matchingBooking = trackableBookings.find((b) => String(b.id) === String(paramId));
      if (matchingBooking) {
        setSelectedBookingId(String(matchingBooking.id));
        return;
      }
    }
    
    // If no valid param or no match, set to first booking if available
    if (trackableBookings.length > 0) {
      const firstBookingId = String(trackableBookings[0].id);
      setSelectedBookingId(firstBookingId);
      if (!paramId || String(paramId) !== firstBookingId) {
        setSearchParams({ bookingId: firstBookingId }, { replace: true });
      }
    } else {
      setSelectedBookingId(null);
    }
  }, [searchParams, trackableBookings, setSearchParams]);

  const previousDeliveryStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedBookingId) {
      setTrackingData(null);
      previousDeliveryStatusRef.current = null;
      return;
    }
    
    // Reset previous status when booking changes
    previousDeliveryStatusRef.current = null;
    
    let active = true;
    const fetchTracking = async () => {
      try {
        setTrackingLoading(true);
        const data = await getBookingTracking(selectedBookingId);
        if (active) {
          // Check if delivery status changed - if so, we might want to refresh more frequently
          const statusChanged = previousDeliveryStatusRef.current !== data.deliveryStatus;
          if (statusChanged) {
            previousDeliveryStatusRef.current = data.deliveryStatus;
          }
          setTrackingData(data);
          setTrackingError(null);
        }
      } catch (error: any) {
        if (active) {
          setTrackingError(error?.message || 'Unable to load tracking data');
        }
      } finally {
        if (active) setTrackingLoading(false);
      }
    };
    fetchTracking();
    // Poll every 10 seconds for better sync with status changes
    const interval = setInterval(fetchTracking, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedBookingId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-foreground">{t('tracking.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 space-y-3 relative z-20">
          <h1 className="text-2xl font-semibold text-foreground">{t('tracking.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('tracking.subtitle')}
          </p>
          {trackableBookings.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t('tracking.selectBooking')}</p>
              <Select
                value={selectedBookingId ?? ''}
                onValueChange={(value) => {
                  const normalized = value || null;
                  setSelectedBookingId(normalized);
                  if (normalized) {
                    setSearchParams({ bookingId: normalized }, { replace: true });
                  } else {
                    setSearchParams({}, { replace: true });
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue placeholder="Select booking" />
                </SelectTrigger>
                <SelectContent>
                  {trackableBookings.map((booking) => (
                    <SelectItem key={String(booking.id)} value={String(booking.id)}>
                      {booking.tractorName} · {new Date(booking.startDate).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You don’t have any bookings ready for tracking yet. Once a tractor is approved, its route will appear here.
            </p>
          )}
        </div>

        {selectedBookingId && trackingData ? (
          <div className="space-y-4">
            <LiveRouteMap
              current={
                trackingData.deliveryStatus === 'RETURNED'
                  ? undefined
                  : trackingData.currentLocation
                  ? {
                      lat: trackingData.currentLocation.lat,
                      lng: trackingData.currentLocation.lng,
                      label: trackingData.currentLocation.address || 'Current location',
                    }
                  : undefined
              }
              destination={
                trackingData.deliveryStatus === 'RETURNED' && trackingData.originalLocation
                  ? {
                      lat: trackingData.originalLocation.lat,
                      lng: trackingData.originalLocation.lng,
                      label: trackingData.originalLocation.address || 'Original Location',
                    }
                  : trackingData.destination
                  ? {
                      lat: trackingData.destination.lat,
                      lng: trackingData.destination.lng,
                      label: trackingData.destination.address || trackingData.deliveryAddress || 'Destination',
                    }
                  : undefined
              }
              originalLocation={trackingData.originalLocation || null}
              route={trackingData.route}
              useTractorIcon={true}
              animateDelivery={trackingData.deliveryStatus === 'DELIVERING' || trackingData.status === 'DELIVERING'}
              showTractorAtDestination={trackingData.deliveryStatus === 'DELIVERED' || trackingData.status === 'DELIVERED'}
              showTractorAtOriginalLocation={trackingData.deliveryStatus === 'RETURNED' || trackingData.bookingStatus === 'COMPLETED'}
              className="h-[60vh] w-full rounded-xl border border-border bg-card relative z-10"
            />

            {trackingLoading && (
              <p className="text-xs text-muted-foreground">Refreshing tracking data...</p>
            )}

            {trackingError && <p className="text-sm text-red-400">{trackingError}</p>}

            {/* Delivery Milestones */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Delivery Journey</h3>
              {(() => {
                // Only use deliveryStatus if it's explicitly set and booking is in a relevant state
                // Don't use status as fallback - deliveryStatus should be null until owner sets it
                const deliveryStatus = trackingData.deliveryStatus;
                const bookingStatus = trackingData.bookingStatus;
                
                // Show delivery status if it's explicitly set
                // The backend TrackingMapper now includes deliveryStatus for:
                // - PAID, DELIVERED, or COMPLETED bookings
                // - Approved COD bookings (even if status is still PENDING)
                // So if deliveryStatus is present in the response, we should display it
                const effectiveDeliveryStatus = deliveryStatus || null;
                
                const statusConfig: Record<string, { label: string; icon: string; color: string; step: number }> = {
                  'ORDERED': { label: 'Ready to Deliver', icon: '📦', color: '!border-blue-500/30 !bg-blue-500/10 !text-blue-400', step: 1 },
                  'DELIVERING': { label: 'On the Way', icon: '🚚', color: '!border-yellow-500/30 !bg-yellow-500/10 !text-yellow-400', step: 2 },
                  'DELIVERED': { label: 'At Your Location', icon: '✅', color: '!border-green-500/30 !bg-green-500/10 !text-green-400', step: 3 },
                  'RETURNED': { label: 'Returned to Owner', icon: '🏠', color: '!border-muted/60 !bg-muted !text-muted-foreground', step: 4 }
                };
                
                const steps = [
                  { key: 'ORDERED', label: 'Ordered', icon: '📦' },
                  { key: 'DELIVERING', label: 'Delivering', icon: '🚚' },
                  { key: 'DELIVERED', label: 'Delivered', icon: '✅' },
                  { key: 'RETURNED', label: 'Returned', icon: '🏠' }
                ];
                
                // Determine current step based on delivery status
                // If no deliveryStatus, check if booking is approved/paid to show ORDERED state
                let currentStep = 0;
                if (effectiveDeliveryStatus) {
                  currentStep = statusConfig[effectiveDeliveryStatus]?.step || 0;
                } else if (bookingStatus === 'PAID' || bookingStatus === 'APPROVED' || bookingStatus === 'CONFIRMED') {
                  // For paid/approved bookings without deliveryStatus, show ORDERED as first step
                  currentStep = 1;
                }
                
                const isCompleted = bookingStatus === 'COMPLETED' || effectiveDeliveryStatus === 'RETURNED';
                
                // Determine current status label
                let currentStatusLabel = 'Not Started';
                let currentStatusIcon = '⏳';
                let currentStatusColor = 'bg-muted text-muted-foreground';
                
                if (effectiveDeliveryStatus && statusConfig[effectiveDeliveryStatus]) {
                  currentStatusLabel = statusConfig[effectiveDeliveryStatus].label;
                  currentStatusIcon = statusConfig[effectiveDeliveryStatus].icon;
                  currentStatusColor = statusConfig[effectiveDeliveryStatus].color;
                } else if (bookingStatus === 'PAID' || bookingStatus === 'APPROVED' || bookingStatus === 'CONFIRMED') {
                  currentStatusLabel = 'Ready to Deliver';
                  currentStatusIcon = '📦';
                  currentStatusColor = '!border-blue-500/30 !bg-blue-500/10 !text-blue-400';
                } else if (bookingStatus === 'PENDING') {
                  currentStatusLabel = 'Awaiting Approval';
                  currentStatusIcon = '⏳';
                  currentStatusColor = 'bg-muted text-muted-foreground';
                }
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`text-sm px-3 py-1.5 rounded-md border ${currentStatusColor}`}>
                        <span className="mr-1">{currentStatusIcon}</span>
                        {currentStatusLabel}
                      </span>
                      {isCompleted && (
                        <span className="text-sm px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/30">
                          <span className="mr-1">✓</span>
                          Booking Completed
                        </span>
                      )}
                    </div>
                    
                    {/* Progress Timeline */}
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                          const stepConfig = statusConfig[step.key];
                          const stepNumber = index + 1;
                          const isActive = currentStep >= stepNumber;
                          const isCurrent = effectiveDeliveryStatus === step.key || 
                            (!effectiveDeliveryStatus && stepNumber === 1 && currentStep >= 1);
                          
                          return (
                            <div key={step.key} className="flex flex-col items-center flex-1 relative">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                isActive 
                                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400 text-white' 
                                  : 'bg-muted border-border text-muted-foreground'
                              } ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 scale-110' : ''}`}>
                                <span className="text-lg">{step.icon}</span>
                              </div>
                              <p className={`text-xs mt-2 text-center font-medium ${
                                isActive ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {step.label}
                              </p>
                              {index < steps.length - 1 && (
                                <div className={`absolute top-5 left-[60%] w-full h-0.5 transition-colors ${
                                  currentStep > stepNumber ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-muted'
                                }`} style={{ width: 'calc(100% - 2.5rem)' }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ETA</p>
                <p className="text-3xl font-semibold text-foreground mt-2">
                  {trackingData.etaMinutes && trackingData.deliveryStatus !== 'RETURNED' && trackingData.deliveryStatus !== 'DELIVERED'
                    ? `${trackingData.etaMinutes} min` 
                    : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Distance</p>
                <p className="text-3xl font-semibold text-foreground mt-2">
                  {trackingData.distanceKm && trackingData.deliveryStatus !== 'RETURNED' && trackingData.deliveryStatus !== 'DELIVERED'
                    ? `${trackingData.distanceKm.toFixed(1)} km` 
                    : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-amber-500 mt-2">
                  {trackingData.bookingStatus ? trackingData.bookingStatus.toUpperCase() : trackingData.status || '—'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Tractor Owner Information - Always show if tracking data exists */}
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <User className="h-5 w-5 text-amber-500" />
                    Tractor Owner Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trackingData.tractorOwner ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <User className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Name</p>
                          <p className="text-base font-semibold text-foreground break-words">
                            {trackingData.tractorOwner.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {trackingData.tractorOwner.phone && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Phone className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Phone Number</p>
                            <a 
                              href={`tel:${trackingData.tractorOwner.phone}`}
                              className="text-base text-foreground hover:text-amber-500 transition-colors break-words"
                            >
                              {trackingData.tractorOwner.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {trackingData.tractorOwner.email && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Mail className="h-4 w-4 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Email</p>
                            <a 
                              href={`mailto:${trackingData.tractorOwner.email}`}
                              className="text-base text-foreground hover:text-amber-500 transition-colors break-all"
                            >
                              {trackingData.tractorOwner.email}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {trackingData.tractorOwner.address && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/10">
                            <MapPin className="h-4 w-4 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Address</p>
                            <p className="text-base text-foreground break-words">
                              {trackingData.tractorOwner.address}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Owner information not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    {trackingData.deliveryStatus === 'RETURNED' || trackingData.bookingStatus === 'COMPLETED' ? (
                      <>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Tractor Location</p>
                          <p className="text-foreground font-medium">
                            {trackingData.originalLocation?.address || 'Returned to original location'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Delivery Address</p>
                          <p className="text-foreground font-medium">
                            {trackingData.deliveryAddress || 'Not assigned'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Current location</p>
                          <p className="text-foreground font-medium">
                            {trackingData.currentLocation?.address || 'Awaiting live update'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Destination</p>
                          <p className="text-foreground font-medium">
                            {trackingData.destination?.address || trackingData.deliveryAddress || 'Not assigned'}
                          </p>
                          {trackingData.deliveryWindow && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Window:{' '}
                              {new Date(trackingData.deliveryWindow.startAt).toLocaleString()} -{' '}
                              {new Date(trackingData.deliveryWindow.endAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          ) : trackableBookings.length > 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {trackingLoading ? 'Loading tracking data...' : 'Select a booking to view its route.'}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Tracking;


