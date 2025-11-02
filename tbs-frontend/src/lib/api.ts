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
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

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

export async function apiRegister(email: string, password: string, name?: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  if (!res.ok) {
    let message = 'Registration failed';
    try {
      const data = await res.json();
      message = (data && (data.error || data.message)) ?? message;
    } catch {}
    throw new ApiError(message, res.status);
  }
  return res.json();
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    let message = 'Login failed';
    try {
      const data = await res.json();
      message = (data && (data.error || data.message)) ?? message;
    } catch {}
    throw new ApiError(message, res.status);
  }
  return res.json();
}

export async function updateProfile(name?: string, profilePictureUrl?: string): Promise<{ message: string; user: { name: string; email: string; role: string; profilePictureUrl: string } }> {
  const body: { name?: string; profilePictureUrl?: string } = {};
  if (name) body.name = name;
  if (profilePictureUrl) body.profilePictureUrl = profilePictureUrl;
  
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
  const res = await fetch(`${BASE_URL}/api/tractors`);
  if (!res.ok) throw new Error('Failed to fetch tractors');
  return res.json();
}

export async function fetchTractor(id: string | number): Promise<TractorApiModel> {
  const res = await fetch(`${BASE_URL}/api/tractors/${id}`);
  if (res.status === 404) throw new Error('Not found');
  if (!res.ok) throw new Error('Failed to fetch tractor');
  return res.json();
}

export async function deleteTractor(id: string | number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/tractors/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
}

export async function createTractor(input: { name: string; model: string; hourlyRate: number; available?: boolean; imageUrl?: string; imageUrls?: string[]; description?: string; }): Promise<TractorApiModel> {
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
      description: input.description
    })
  });
  if (!res.ok) throw new Error('Failed to create tractor');
  return res.json();
}

export async function updateTractor(
  id: string | number,
  input: { name: string; model: string; hourlyRate: number; available: boolean; imageUrl?: string; imageUrls?: string[]; description?: string }
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/tractors/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify(input)
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to update tractor');
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
  };
  tractor: {
    id: number;
    name: string;
    model: string;
    hourlyRate?: number;
    imageUrl?: string;
    imageUrls?: string[];
  };
  startAt: string;
  endAt: string;
  status: string;
  totalAmount?: number;
}

export async function createBooking(tractorId: string, startAt: string, endAt: string): Promise<BookingApiModel> {
  const res = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
    },
    body: JSON.stringify({ tractorId, startAt, endAt })
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
    location: 'Kathmandu',
    horsePower: 60,
    fuelType: 'Diesel',
    available: apiTractor.available,
    description: apiTractor.description || 'Book this tractor now.'
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
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const hourlyRate = apiBooking.tractor.hourlyRate || 0;
    return hours * hourlyRate;
  })();

  // Map backend status to frontend status
  const mapStatus = (status: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refund_requested' => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'PAID':
        return 'confirmed';
      case 'CANCELLED':
        return 'cancelled';
      case 'REFUND_REQUESTED':
        return 'refund_requested';
      default:
        return 'pending';
    }
  };

  return {
    id: String(apiBooking.id),
    tractorId: String(apiBooking.tractor.id),
    tractorName: apiBooking.tractor.name,
    tractorImage: (apiBooking.tractor.imageUrls && apiBooking.tractor.imageUrls[0]) || apiBooking.tractor.imageUrl || PLACEHOLDER_IMAGE,
    userId: String(apiBooking.user.id),
    userName: apiBooking.user.name,
    startDate: apiBooking.startAt,
    endDate: apiBooking.endAt,
    totalCost: totalCost,
    status: mapStatus(apiBooking.status),
    paymentStatus: apiBooking.status === 'PAID' ? 'paid' : 'pending'
  };
}

export async function getMyBookingsForUI(): Promise<Booking[]> {
  const items = await fetchMyBookings();
  return items.map(toUiBooking);
}

export async function getAllBookingsForUI(): Promise<Booking[]> {
  const items = await fetchAllBookings();
  return items.map(toUiBooking);
}


