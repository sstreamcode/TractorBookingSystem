export interface Tractor {
  id: string;
  name: string;
  model: string;
  image: string;
  images?: string[];
  hourlyRate: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
  horsePower?: number;
  fuelType?: string;
  available: boolean;
  description?: string;
  fuelLevel?: number;
  rating?: number;
  totalBookings?: number;
  status?: string;
  deliveryStatus?: 'ORDERED' | 'DELIVERING' | 'DELIVERED' | 'RETURNED';
  nextAvailableAt?: string;
  category?: string;
  quantity?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  destinationAddress?: string;
}

export interface Booking {
  id: string;
  tractorId: string;
  tractorName: string;
  tractorImage?: string;
  tractorImages?: string[];
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'completed' | 'cancelled' | 'refund_requested';
  paymentStatus: 'pending' | 'paid' | 'failed';
  adminStatus?: 'pending_approval' | 'approved' | 'denied';
  paymentMethod?: 'CASH_ON_DELIVERY' | 'ESEWA' | string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryAddress?: string;
  commissionAmount?: number;
  paymentReleased?: boolean;
}

export interface BookingFormData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}
