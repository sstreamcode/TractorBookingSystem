import type { Tractor } from '@/types';
import type { Booking } from '@/types';

export interface TractorApiModel {
  id: number;
  name: string;
  model: string;
  hourlyRate: number;
  available: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
  horsePower?: number;
  fuelType?: string;
  fuelLevel?: number;
  rating?: number;
  totalBookings?: number;
  status?: string;
  nextAvailableAt?: string;
  category?: string;
  quantity?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  destinationAddress?: string;
}

export interface TrackingLocation {
  lat: number;
  lng: number;
  address?: string;
  updatedAt?: string | null;
}

export interface TrackingResponse {
  tractorId: number;
  tractorName: string;
  status?: string;
  bookingId?: number;
  bookingStatus?: string;
  deliveryAddress?: string;
  deliveryStatus?: string; // Tractor delivery status: ORDERED, DELIVERING, DELIVERED, RETURNED
  deliveryWindow?: {
    startAt: string;
    endAt: string;
  };
  currentLocation: TrackingLocation | null;
  destination: TrackingLocation | null;
  originalLocation?: TrackingLocation | null; // Original location when tractor is returned
  distanceKm?: number;
  etaMinutes?: number;
  route: Array<{ lat: number; lng: number }>;
  tractorOwner?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
  } | null;
}

export interface LandingMetricsResponse {
  totalTractors: number;
  totalBookings: number;
  activeBookings: number;
  districtsCovered: number;
  avgResponseTimeMinutes: number;
  fleetUtilization: number;
}

export interface DispatchSummaryResponse {
  hasData?: boolean;
  tractorName?: string;
  status?: string;
  distanceKm?: number;
  etaMinutes?: number;
  currentLocation?: TrackingLocation | null;
  destination?: TrackingLocation | null;
  fleetEfficiency?: string;
  terrain?: string;
}

// Use proxy in development, full URL in production
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 
  (import.meta.env.DEV ? '' : 'http://localhost:8082');

// Auth APIs
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
export interface AuthResponse {
  token: string;
}

export async function apiRegister(
  email: string,
  password: string,
  name?: string,
  role: 'customer' | 'tractor_owner' = 'customer',
  phone?: string,
  address?: string
): Promise<AuthResponse | { message: string; pendingApproval: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role, phone, address })
    });
    if (!res.ok) {
      let message = 'Registration failed';
      try {
        const data = await res.json();
        message = (data && (data.error || data.message)) ?? message;
      } catch {}
      throw new ApiError(message, res.status);
    }
    const data = await res.json();
    // Handle pending approval response for tractor owners (201 status)
    if (data.pendingApproval) {
      return { message: data.message, pendingApproval: true };
    }
    return data;
  } catch (error: any) {
    // Handle network errors (ERR_BLOCKED_BY_CLIENT, CORS, etc.)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(
        'Unable to connect to the server. Please check:\n' +
        '1. The backend server is running on port 8082\n' +
        '2. No browser extensions are blocking the request\n' +
        '3. Your firewall/antivirus is not blocking localhost connections',
        0
      );
    }
    throw error;
  }
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    let message = 'Login failed';
    let pendingApproval = false;
    try {
      const data = await res.json();
      message = (data && (data.error || data.message)) ?? message;
      pendingApproval = data.pendingApproval || false;
    } catch {}
    const error = new ApiError(message, res.status);
    if (pendingApproval) {
      (error as any).pendingApproval = true;
    }
    throw error;
  }
  return res.json();
}

export async function updateProfile(name?: string, profilePictureUrl?: string, phone?: string, address?: string): Promise<{ message: string; user: { name: string; email: string; role: string; phone: string; address: string; profilePictureUrl: string } }> {
  const body: { name?: string; profilePictureUrl?: string; phone?: string; address?: string } = {};
  if (name) body.name = name;
  if (profilePictureUrl) body.profilePictureUrl = profilePictureUrl;
  if (phone !== undefined) body.phone = phone;
  if (address !== undefined) body.address = address;
  
  const res = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to update profile', res.status);
  }
  return res.json();
}

export async function fetchTractors(): Promise<TractorApiModel[]> {
  // For tractor owners, use the authenticated endpoint that returns only their tractors.
  // For all other users (including anonymous), use the public tractors listing.
  let isTractorOwner = false;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.role === 'tractor_owner') {
        isTractorOwner = true;
      }
    }
  } catch {
    // Fallback to public endpoint on any parsing error
    isTractorOwner = false;
  }

  const url = isTractorOwner
    ? `${BASE_URL}/api/tractors/my-tractors`
    : `${BASE_URL}/api/tractors`;

  const headers: Record<string, string> = {};
  const token = localStorage.getItem('token');
  if (isTractorOwner && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, Object.keys(headers).length ? { headers } : undefined);
  if (!res.ok) throw new Error('Failed to fetch tractors');
  return res.json();
}

export async function fetchTractor(id: string | number): Promise<TractorApiModel> {
  const res = await fetch(`${BASE_URL}/api/tractors/${id}`);
  if (res.status === 404) throw new Error('Not found');
  if (!res.ok) throw new Error('Failed to fetch tractor');
  return res.json();
}

// Feedback & Stats
export interface Feedback {
  id: number;
  authorName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  profilePictureUrl?: string | null;
}

export async function fetchTractorStats(id: string | number): Promise<{ tractorId: number; totalBookings: number; avgRating: number; feedback: Feedback[] }> {
  const res = await fetch(`${BASE_URL}/api/tractors/${id}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function submitFeedback(id: string | number, rating: number, comment?: string, authorName?: string): Promise<{ status: string; avgRating: number }> {
  const res = await fetch(`${BASE_URL}/api/tractors/${id}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify({ rating: String(rating), comment: comment || '', authorName: authorName || '' })
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Failed to submit feedback');
  }
  return res.json();
}

export async function deleteTractor(id: string | number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/tractors/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
}

export async function createTractor(input: {
  name: string;
  model: string;
  hourlyRate: number;
  available?: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  horsePower?: number;
  fuelType?: string;
  fuelLevel?: number;
  rating?: number;
  totalBookings?: number;
  status?: string;
  nextAvailableAt?: string;
  category?: string;
  quantity?: number;
}): Promise<TractorApiModel> {
  const res = await fetch(`${BASE_URL}/api/tractors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify({
      name: input.name,
      model: input.model,
      hourlyRate: input.hourlyRate,
      available: input.available ?? true,
      imageUrl: input.imageUrl,
      imageUrls: input.imageUrls,
      description: input.description,
      location: input.location,
      latitude: input.latitude,
      longitude: input.longitude,
      horsePower: input.horsePower,
      fuelType: input.fuelType,
      fuelLevel: input.fuelLevel,
      rating: input.rating,
      totalBookings: input.totalBookings,
      status: input.status,
      nextAvailableAt: input.nextAvailableAt,
      category: input.category,
      quantity: input.quantity
    })
  });
  if (!res.ok) throw new Error('Failed to create tractor');
  return res.json();
}

export async function updateTractor(
  id: string | number,
  input: {
    name: string;
    model: string;
    hourlyRate: number;
    available: boolean;
    imageUrl?: string;
    imageUrls?: string[];
    description?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    horsePower?: number;
    fuelType?: string;
    fuelLevel?: number;
    rating?: number;
    totalBookings?: number; // Deprecated - calculated dynamically by backend
    status?: string;
    nextAvailableAt?: string;
    category?: string;
    quantity?: number;
  }
): Promise<void> {
  // Remove totalBookings from input as it's calculated dynamically
  const { totalBookings, ...updateData } = input;
  
  const res = await fetch(`${BASE_URL}/api/tractors/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify(updateData)
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to update tractor');
}

export async function updateTractorLocation(
  id: string | number,
  input: { latitude: number; longitude: number; address?: string }
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/tractors/${id}/location`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(error.error || 'Failed to update location', res.status);
  }
}

export async function getTractorTracking(id: string | number): Promise<TrackingResponse> {
  const res = await fetch(`${BASE_URL}/api/tractors/${id}/tracking`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(error.error || 'Failed to load tracking data', res.status);
  }
  const data = await res.json();
  return normalizeTrackingResponse(data);
}

export async function getBookingTracking(id: string | number): Promise<TrackingResponse> {
  const res = await fetch(`${BASE_URL}/api/bookings/${id}/tracking`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new ApiError(error.error || 'Failed to load booking tracking data', res.status);
  }
  const data = await res.json();
  return normalizeTrackingResponse(data);
}

function normalizeTrackingResponse(payload: any): TrackingResponse {
  return {
    tractorId: payload.tractorId,
    tractorName: payload.tractorName,
    status: payload.status,
    bookingId: payload.bookingId,
    bookingStatus: payload.bookingStatus,
    deliveryAddress: payload.deliveryAddress,
    deliveryStatus: payload.deliveryStatus || payload.tractorDeliveryStatus,
    deliveryWindow: payload.deliveryWindow,
    currentLocation: payload.currentLocation || null,
    destination: payload.destination || null,
    originalLocation: payload.originalLocation || null,
    distanceKm: payload.distanceKm ?? undefined,
    etaMinutes: payload.etaMinutes ?? undefined,
    route: Array.isArray(payload.route)
      ? payload.route.map((point: any) => ({ lat: point.lat, lng: point.lng }))
      : [],
    tractorOwner: payload.tractorOwner ? {
      id: payload.tractorOwner.id,
      name: payload.tractorOwner.name || '',
      email: payload.tractorOwner.email || '',
      phone: payload.tractorOwner.phone || '',
      address: payload.tractorOwner.address || ''
    } : null
  };
}

export async function fetchLandingMetrics(): Promise<LandingMetricsResponse> {
  const res = await fetch(`${BASE_URL}/api/metrics/landing`);
  if (!res.ok) {
    throw new ApiError('Failed to load landing metrics', res.status);
  }
  return res.json();
}

export async function fetchLatestDispatchSummary(): Promise<DispatchSummaryResponse> {
  const res = await fetch(`${BASE_URL}/api/dispatch/latest`);
  if (!res.ok) {
    throw new ApiError('Failed to load dispatch summary', res.status);
  }
  return res.json();
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: form
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json();
}

export function uploadImageWithProgress(file: File, onProgress: (percent: number) => void): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/api/uploads`);
    const token = localStorage.getItem('token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error('Failed to upload image'));
        }
      }
    };
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

export async function deleteImageByUrl(url: string): Promise<void> {
  // Expect URLs like http://host:port/uploads/filename
  const filename = url.split('/').pop();
  if (!filename) return;
  const res = await fetch(`${BASE_URL}/api/uploads/${filename}`, {
    method: 'DELETE',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete image');
}

// Booking APIs
export interface BookingApiModel {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  tractor: {
    id: number;
    name: string;
    model: string;
    hourlyRate?: number;
    imageUrl?: string;
    imageUrls?: string[];
    deliveryStatus?: string;
  };
  startAt: string;
  endAt: string;
  status: string;
  adminStatus?: string;
  totalAmount?: number;
  paymentMethod?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryAddress?: string;
  commissionAmount?: number;
  paymentReleased?: boolean;
  actualUsageStartTime?: string;
  actualUsageStopTime?: string;
  actualUsageMinutes?: number;
  bookedMinutes?: number;
  initialPrice?: number;
  finalPrice?: number;
  refundAmount?: number;
  payments?: Array<{
    id: number;
    method: string;
    status: string;
  }>;
}

export async function createBooking(
  tractorId: string, 
  startAt: string, 
  endAt: string,
  deliveryLatitude?: number,
  deliveryLongitude?: number,
  deliveryAddress?: string
): Promise<BookingApiModel> {
  const res = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify({ 
      tractorId, 
      startAt, 
      endAt,
      deliveryLatitude,
      deliveryLongitude,
      deliveryAddress
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to create booking', res.status);
  }
  return res.json();
}

export async function fetchMyBookings(): Promise<BookingApiModel[]> {
  const res = await fetch(`${BASE_URL}/api/bookings`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export async function fetchAllBookings(): Promise<BookingApiModel[]> {
  const res = await fetch(`${BASE_URL}/api/bookings/all`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) throw new Error('Failed to fetch all bookings');
  return res.json();
}

export async function verifyEsewaPayment(bookingId: string, refId: string): Promise<{ status: string; refId: string }> {
  const res = await fetch(`${BASE_URL}/api/payments/verify-esewa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify({ bookingId, refId })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData.error || 'Failed to verify payment', res.status);
  }
  return res.json();
}

export async function confirmCashOnDelivery(bookingId: string): Promise<{ status: string; method: string }> {
  const res = await fetch(`${BASE_URL}/api/payments/cash-on-delivery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify({ bookingId })
  });
  if (!res.ok) throw new Error('Failed to confirm COD payment');
  return res.json();
}

export async function requestBookingCancellation(bookingId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/request-cancellation`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to request cancellation', res.status);
  }
  return res.json();
}

export async function approveRefund(bookingId: string): Promise<{ status: string; refundAmount: number; originalAmount: number; fee: number; message: string }> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/approve-refund`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to approve refund', res.status);
  }
  return res.json();
}

export async function rejectRefund(bookingId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/reject-refund`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to reject refund', res.status);
  }
  return res.json();
}

export async function markBookingPaid(bookingId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/mark-paid`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to mark booking as paid', res.status);
  }
  return res.json();
}

export async function markBookingDelivered(bookingId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/mark-delivered`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to mark booking as delivered', res.status);
  }
  return res.json();
}

export async function markBookingCompleted(bookingId: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/mark-completed`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to mark booking as completed', res.status);
  }
  return res.json();
}

export async function startUsage(bookingId: string): Promise<{ 
  status: string; 
  startTime: string; 
  message: string;
}> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/start-usage`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to start usage timer', res.status);
  }
  return res.json();
}

export async function stopUsage(bookingId: string): Promise<{ 
  status: string; 
  stopTime: string; 
  actualUsageMinutes: number;
  finalPrice: number;
  refundAmount?: number;
  initialPrice?: number;
  message: string;
}> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/stop-usage`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to stop usage timer', res.status);
  }
  return res.json();
}

export async function calculateFinalPrice(bookingId: string): Promise<{ 
  initialPrice: number;
  finalPrice: number;
  actualUsageMinutes: number;
  bookedMinutes: number;
  message: string;
}> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/calculate-final-price`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to calculate final price', res.status);
  }
  return res.json();
}

export async function getUsageDetails(bookingId: string): Promise<{ 
  bookedMinutes: number;
  actualUsageMinutes: number | null;
  currentUsageMinutes: number | null;
  minimumChargeMinutes: number;
  initialPrice: number;
  finalPrice: number | null;
  startTime: string | null;
  stopTime: string | null;
  isRunning: boolean;
}> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/usage-details`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to get usage details', res.status);
  }
  return res.json();
}

export async function releasePayment(bookingId: string): Promise<{ 
  status: string; 
  message: string; 
  totalAmount: number; 
  commissionAmount: number; 
  ownerAmount: number;
  tractorOwner: string;
}> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/release-payment`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to release payment', res.status);
  }
  return res.json();
}

// Super Admin APIs
export interface SuperAdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
}

export interface SuperAdminTractorOwner {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  tractorCount: number;
  approved: boolean;
  profilePictureUrl?: string;
}

export interface SuperAdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalTractorOwners: number;
  totalTractors: number;
  approvedTractors: number;
  pendingTractors: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  totalCommission: number;
}

export async function getSuperAdminUsers(): Promise<SuperAdminUser[]> {
  const res = await fetch(`${BASE_URL}/api/super-admin/users`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to fetch users', res.status);
  }
  return res.json();
}

export async function getSuperAdminTractorOwners(): Promise<SuperAdminTractorOwner[]> {
  const res = await fetch(`${BASE_URL}/api/super-admin/tractor-owners`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to fetch tractor owners', res.status);
  }
  return res.json();
}

export async function getSuperAdminTractors(): Promise<TractorApiModel[]> {
  const res = await fetch(`${BASE_URL}/api/super-admin/tractors`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to fetch tractors', res.status);
  }
  return res.json();
}

export async function getSuperAdminBookings(): Promise<BookingApiModel[]> {
  const res = await fetch(`${BASE_URL}/api/super-admin/bookings`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to fetch bookings', res.status);
  }
  return res.json();
}

export async function getSuperAdminStats(): Promise<SuperAdminStats> {
  const res = await fetch(`${BASE_URL}/api/super-admin/stats`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to fetch stats', res.status);
  }
  return res.json();
}

export async function getTractorsByOwner(ownerId: number): Promise<TractorApiModel[]> {
  const res = await fetch(`${BASE_URL}/api/super-admin/tractor-owners/${ownerId}/tractors`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to fetch tractors', res.status);
  }
  return res.json();
}

export async function approveTractorOwner(ownerId: number): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/super-admin/tractor-owners/${ownerId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to approve tractor owner', res.status);
  }
  return res.json();
}

export async function rejectTractorOwner(ownerId: number): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/super-admin/tractor-owners/${ownerId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to reject tractor owner', res.status);
  }
  return res.json();
}

export async function approveTractor(tractorId: string | number): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/tractors/${tractorId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to approve tractor', res.status);
  }
  return res.json();
}

export async function rejectTractor(tractorId: string | number): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/tractors/${tractorId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to reject tractor', res.status);
  }
  return res.json();
}

export async function updateTractorDeliveryStatus(
  bookingId: string,
  deliveryStatus: 'ORDERED' | 'DELIVERING' | 'DELIVERED' | 'RETURNED'
): Promise<{ deliveryStatus: string; tractorStatus: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/tractor-delivery-status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify({ deliveryStatus })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to update delivery status', res.status);
  }
  return res.json();
}

export async function approveBooking(bookingId: string): Promise<{ adminStatus: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to approve booking', res.status);
  }
  return res.json();
}

export async function denyBooking(bookingId: string): Promise<{ adminStatus: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/bookings/${bookingId}/deny`, {
    method: 'POST',
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to deny booking', res.status);
  }
  return res.json();
}

// UI mapping helpers
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80';

export function toUiTractor(apiTractor: TractorApiModel): Tractor {
  return {
    id: String(apiTractor.id),
    name: apiTractor.name,
    model: apiTractor.model,
    image: (apiTractor.imageUrls && apiTractor.imageUrls[0]) || apiTractor.imageUrl || PLACEHOLDER_IMAGE,
    images: apiTractor.imageUrls,
    hourlyRate: apiTractor.hourlyRate,
    location: apiTractor.location || undefined,
    latitude: apiTractor.latitude || undefined,
    longitude: apiTractor.longitude || undefined,
    locationUpdatedAt: apiTractor.locationUpdatedAt || undefined,
    horsePower: apiTractor.horsePower || undefined,
    fuelType: apiTractor.fuelType || undefined,
    available: apiTractor.available,
    description: apiTractor.description || undefined,
    fuelLevel: apiTractor.fuelLevel ?? undefined,
    rating: apiTractor.rating ?? undefined,
    totalBookings: apiTractor.totalBookings ?? undefined,
    status: apiTractor.status || undefined,
    deliveryStatus: apiTractor.deliveryStatus || undefined,
    nextAvailableAt: apiTractor.nextAvailableAt || undefined,
    category: apiTractor.category || undefined,
    quantity: apiTractor.quantity || undefined,
    destinationLatitude: apiTractor.destinationLatitude || undefined,
    destinationLongitude: apiTractor.destinationLongitude || undefined,
    destinationAddress: apiTractor.destinationAddress || undefined
  };
}

export async function getTractorsForUI(): Promise<Tractor[]> {
  const items = await fetchTractors();
  return items.map(toUiTractor);
}

export async function getTractorForUI(id: string): Promise<Tractor> {
  const item = await fetchTractor(id);
  return toUiTractor(item);
}

export function toUiBooking(apiBooking: BookingApiModel): Booking {
  // Use totalAmount from backend if available, otherwise calculate
  const totalCost = apiBooking.totalAmount ?? (() => {
    const start = new Date(apiBooking.startAt);
    const end = new Date(apiBooking.endAt);
    const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const hours = minutes / 60.0; // Convert to hours as decimal (e.g., 0.75 for 45 minutes)
    const hourlyRate = apiBooking.tractor.hourlyRate || 0;
    const cost = hours * hourlyRate;
    // Round to 2 decimal places to avoid floating point precision issues
    return Math.round(cost * 100) / 100;
  })();

  // Map backend status to frontend status
  // Note: For COD, status can be DELIVERED before being PAID
  const mapStatus = (status: string): 'pending' | 'confirmed' | 'delivered' | 'completed' | 'cancelled' | 'refund_requested' => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'PAID':
        return 'confirmed';
      case 'DELIVERED':
        return 'delivered'; // Changed from 'completed' to 'delivered' to distinguish from completed
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      case 'REFUND_REQUESTED':
        return 'refund_requested';
      default:
        return 'pending';
    }
  };

  // Map backend adminStatus to frontend adminStatus
  const mapAdminStatus = (adminStatus?: string): 'pending_approval' | 'approved' | 'denied' | undefined => {
    if (!adminStatus) return undefined;
    switch (adminStatus.toUpperCase()) {
      case 'PENDING_APPROVAL':
        return 'pending_approval';
      case 'APPROVED':
        return 'approved';
      case 'DENIED':
        return 'denied';
      default:
        return undefined;
    }
  };

  // Extract payment method from backend response (preferred) or payments array (fallback)
  const paymentMethod = apiBooking.paymentMethod || 
    (apiBooking.payments && apiBooking.payments.length > 0
      ? apiBooking.payments.find(p => p.method === 'CASH_ON_DELIVERY')?.method || apiBooking.payments[0].method
      : undefined);

  // Determine payment status from payments array (primary source of truth)
  // For COD, payment can be PENDING even if booking is DELIVERED
  let paymentStatus: 'paid' | 'pending' = 'pending';
  if (apiBooking.payments && apiBooking.payments.length > 0) {
    // Check if any payment has status SUCCESS - this is the definitive indicator
    const hasSuccessfulPayment = apiBooking.payments.some(p => p.status === 'SUCCESS');
    if (hasSuccessfulPayment) {
      paymentStatus = 'paid';
    } else {
      // If no SUCCESS payment found, check if it's a non-COD payment that was processed
      // For eSewa: if booking status indicates payment was made (PAID/DELIVERED/COMPLETED), consider it paid
      if (paymentMethod !== 'CASH_ON_DELIVERY') {
        if (apiBooking.status === 'PAID' || apiBooking.status === 'DELIVERED' || apiBooking.status === 'COMPLETED') {
          // For non-COD payments, if booking reached PAID/DELIVERED/COMPLETED, payment was successful
          paymentStatus = 'paid';
        }
      }
      // For COD, payment remains pending until explicitly marked as SUCCESS
    }
  } else {
    // No payments array available - fallback to booking status
    // For non-COD: if booking status indicates payment (PAID/DELIVERED/COMPLETED), payment was made
    if (paymentMethod !== 'CASH_ON_DELIVERY' && 
        (apiBooking.status === 'PAID' || apiBooking.status === 'DELIVERED' || apiBooking.status === 'COMPLETED')) {
      paymentStatus = 'paid';
    } else {
      paymentStatus = 'pending';
    }
  }

  return {
    id: String(apiBooking.id),
    tractorId: String(apiBooking.tractor.id),
    tractorName: apiBooking.tractor.name,
    tractorImage: (apiBooking.tractor.imageUrls && apiBooking.tractor.imageUrls[0]) || apiBooking.tractor.imageUrl || PLACEHOLDER_IMAGE,
    tractorImages: apiBooking.tractor.imageUrls || (apiBooking.tractor.imageUrl ? [apiBooking.tractor.imageUrl] : undefined),
    userId: String(apiBooking.user.id),
    userName: apiBooking.user.name,
    startDate: apiBooking.startAt,
    endDate: apiBooking.endAt,
    totalCost: totalCost,
    status: mapStatus(apiBooking.status),
    paymentStatus: paymentStatus,
    adminStatus: mapAdminStatus(apiBooking.adminStatus),
    paymentMethod: paymentMethod,
    deliveryLatitude: apiBooking.deliveryLatitude || undefined,
    deliveryLongitude: apiBooking.deliveryLongitude || undefined,
    deliveryAddress: apiBooking.deliveryAddress || undefined,
    commissionAmount: apiBooking.commissionAmount || undefined,
    paymentReleased: apiBooking.paymentReleased || false,
    actualUsageStartTime: apiBooking.actualUsageStartTime || undefined,
    actualUsageStopTime: apiBooking.actualUsageStopTime || undefined,
    actualUsageMinutes: apiBooking.actualUsageMinutes || undefined,
    bookedMinutes: apiBooking.bookedMinutes || undefined,
    initialPrice: apiBooking.initialPrice || undefined,
    finalPrice: apiBooking.finalPrice || undefined,
    refundAmount: apiBooking.refundAmount || undefined,
    minimumChargeMinutes: 30,
    tractorDeliveryStatus: apiBooking.deliveryStatus || undefined // Use booking-level deliveryStatus
  } as Booking & { tractorDeliveryStatus?: string };
}

export async function getMyBookingsForUI(): Promise<Booking[]> {
  const items = await fetchMyBookings();
  return items.map(toUiBooking);
}

export async function getTractorOwnerBookings(): Promise<BookingApiModel[]> {
  const res = await fetch(`${BASE_URL}/api/bookings/tractor-owner`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to fetch bookings', res.status);
  }
  const bookings = await res.json();
  return bookings.map((b: any) => ({
    id: b.id,
    tractor: {
      id: b.tractor?.id,
      name: b.tractor?.name || 'N/A',
      model: b.tractor?.model || 'N/A',
      hourlyRate: b.tractor?.hourlyRate || 0,
      imageUrl: b.tractor?.imageUrl,
      imageUrls: b.tractor?.imageUrls || (b.tractor?.imageUrl ? [b.tractor.imageUrl] : []),
      deliveryStatus: b.deliveryStatus, // Use booking-level deliveryStatus
    },
    user: {
      id: b.user?.id,
      name: b.user?.name || 'N/A',
      email: b.user?.email || 'N/A',
      phone: b.user?.phone || 'N/A',
    },
    startAt: b.startAt,
    endAt: b.endAt,
    status: b.status,
    adminStatus: b.adminStatus,
    totalAmount: b.totalAmount || 0,
    paymentMethod: b.paymentMethod,
    payments: b.payments || [],
    deliveryLatitude: b.deliveryLatitude,
    deliveryLongitude: b.deliveryLongitude,
    deliveryAddress: b.deliveryAddress,
    originalTractorLatitude: b.originalTractorLatitude,
    originalTractorLongitude: b.originalTractorLongitude,
    originalTractorLocation: b.originalTractorLocation,
    commissionAmount: b.commissionAmount,
    paymentReleased: b.paymentReleased,
  }));
}

export async function getTractorOwnerBookingsForUI(): Promise<Booking[]> {
  const items = await getTractorOwnerBookings();
  return items.map(toUiBooking);
}

// Custom mapping for tractor owner bookings with nested structure
export function mapTractorOwnerBookingToUI(apiBooking: BookingApiModel): Booking & { 
  tractor?: { id: string; name: string; model?: string; image?: string; images?: string[]; hourlyRate?: number };
  user?: { id: string; name: string; email?: string };
  totalAmount?: number;
  tractorDeliveryStatus?: string;
} {
  const baseBooking = toUiBooking(apiBooking);
  const tractorData = apiBooking.tractor as any;
  return {
    ...baseBooking,
    tractor: {
      id: String(apiBooking.tractor.id),
      name: apiBooking.tractor.name || baseBooking.tractorName || 'N/A',
      model: tractorData?.model || 'N/A',
      image: (apiBooking.tractor.imageUrls && apiBooking.tractor.imageUrls[0]) || apiBooking.tractor.imageUrl || baseBooking.tractorImage || PLACEHOLDER_IMAGE,
      images: apiBooking.tractor.imageUrls || (apiBooking.tractor.imageUrl ? [apiBooking.tractor.imageUrl] : []) || baseBooking.tractorImages || [],
      hourlyRate: tractorData?.hourlyRate || 0,
    },
    user: {
      id: String(apiBooking.user.id),
      name: apiBooking.user.name || baseBooking.userName || 'N/A',
      email: apiBooking.user.email || 'N/A',
      phone: (apiBooking.user as any).phone || 'N/A',
    },
    totalAmount: apiBooking.totalAmount || baseBooking.totalCost || 0,
    tractorDeliveryStatus: tractorData?.deliveryStatus,
  };
}

export async function getTractorOwnerBookingsForUIWithNested(): Promise<Array<Booking & { 
  tractor?: { id: string; name: string; model?: string; image?: string; images?: string[]; hourlyRate?: number };
  user?: { id: string; name: string; email?: string };
  totalAmount?: number;
  tractorDeliveryStatus?: string;
}>> {
  const items = await getTractorOwnerBookings();
  return items.map(mapTractorOwnerBookingToUI);
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export async function submitContactForm(data: ContactFormData): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/api/contact/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(errorData.error || 'Failed to send contact form', res.status);
  }
  
  return res.json();
}

export async function getAllBookingsForUI(): Promise<Booking[]> {
  const items = await fetchAllBookings();
  return items.map(toUiBooking);
}

export interface OwnerDetails {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  profilePictureUrl?: string;
  tractorOwnerApproved?: boolean;
}

export async function getOwnerById(ownerId: string | number): Promise<OwnerDetails> {
  const res = await fetch(`${BASE_URL}/api/super-admin/users/${ownerId}`, {
    headers: {
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Failed to fetch owner details', res.status);
  }
  return res.json();
}


