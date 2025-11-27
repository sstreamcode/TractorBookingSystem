export interface Tractor {
    id: number;
    name: string;
    model: string;
    hourlyRate: number;
    available: boolean;
    imageUrl: string;
    imageUrls: string[];
    description: string;
    location: string;
    rating: number;
    totalBookings: number;
    horsePower: number;
    fuelType: string;
    category: string;
}
