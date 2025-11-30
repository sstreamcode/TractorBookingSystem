import { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookingsForUI, getBookingTracking, type TrackingResponse } from '@/lib/api';
import type { Booking } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LiveRouteMap from '@/components/LiveRouteMap';
import { toast } from 'sonner';

const Tracking = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
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

  useEffect(() => {
    if (trackableBookings.length === 0) {
      setSelectedBookingId(null);
      setSearchParams({}, { replace: true });
      return;
    }
    const paramId = searchParams.get('bookingId');
    const initial = paramId && trackableBookings.some((b) => b.id === paramId) ? paramId : trackableBookings[0].id;
    setSelectedBookingId(initial);
    setSearchParams(initial ? { bookingId: initial } : {}, { replace: true });
  }, [trackableBookings, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedBookingId) {
      setTrackingData(null);
      return;
    }
    let active = true;
    const fetchTracking = async () => {
      try {
        setTrackingLoading(true);
        const data = await getBookingTracking(selectedBookingId);
        if (active) {
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
    const interval = setInterval(fetchTracking, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedBookingId]);

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 space-y-3 relative z-20">
          <h1 className="text-2xl font-semibold text-slate-100">Real-Time Tractor Tracking</h1>
          <p className="text-sm text-slate-400">
            View the live route, ETA, and delivery progress for your approved bookings.
          </p>
          {trackableBookings.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Select booking</p>
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
                    <SelectItem key={booking.id} value={booking.id}>
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
                trackingData.currentLocation
                  ? {
                      lat: trackingData.currentLocation.lat,
                      lng: trackingData.currentLocation.lng,
                      label: trackingData.currentLocation.address || 'Current location',
                    }
                  : undefined
              }
              destination={
                trackingData.destination
                  ? {
                      lat: trackingData.destination.lat,
                      lng: trackingData.destination.lng,
                      label: trackingData.destination.address || trackingData.deliveryAddress || 'Destination',
                    }
                  : undefined
              }
              route={trackingData.route}
              className="h-[60vh] w-full rounded-xl border bg-muted relative z-10"
            />

            {trackingLoading && (
              <p className="text-xs text-muted-foreground">Refreshing tracking data...</p>
            )}

            {trackingError && <p className="text-sm text-red-600">{trackingError}</p>}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ETA</p>
                <p className="text-3xl font-semibold text-secondary mt-2">
                  {trackingData.etaMinutes ? `${trackingData.etaMinutes} min` : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Distance</p>
                <p className="text-3xl font-semibold text-secondary mt-2">
                  {trackingData.distanceKm ? `${trackingData.distanceKm.toFixed(1)} km` : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-secondary mt-2">
                  {trackingData.bookingStatus ? trackingData.bookingStatus.toUpperCase() : trackingData.status || '—'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current location</p>
                <p className="text-secondary font-medium">
                  {trackingData.currentLocation?.address || 'Awaiting live update'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Destination</p>
                <p className="text-secondary font-medium">
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
            </div>
          </div>
        ) : trackableBookings.length > 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {trackingLoading ? 'Loading tracking data...' : 'Select a booking to view its route.'}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Tracking;


