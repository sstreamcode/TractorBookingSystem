export interface Tractor {
  id: string;
  name: string;
  model: string;
  image: string;
  hourlyRate: number;
  location: string;
  horsePower: number;
  fuelType: string;
  available: boolean;
  description: string;
}

export interface Booking {
  id: string;
  tractorId: string;
  tractorName: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

export interface BookingFormData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}
