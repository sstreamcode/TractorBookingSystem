export interface Tractor {
  id: string;
  name: string;
  model: string;
  image: string;
  images?: string[];
  hourlyRate: number;
  location?: string;
  horsePower?: number;
  fuelType?: string;
  available: boolean;
  description?: string;
  fuelLevel?: number;
  rating?: number;
  totalBookings?: number;
  status?: string;
  nextAvailableAt?: string;
  category?: string;
}

export interface Booking {
  id: string;
  tractorId: string;
  tractorName: string;
  tractorImage?: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refund_requested';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

export interface BookingFormData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}
