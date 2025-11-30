# Tractor Booking System (TBS) - Frontend Project Description

## Project Overview

**Tractor Booking System (TBS)** is a comprehensive web-based platform for tractor rental and fleet management in Nepal. The system connects tractor owners with farmers and agricultural cooperatives, providing real-time tracking, secure booking, and efficient fleet management capabilities.

## Core Purpose

The platform serves as a digital marketplace and management system for agricultural equipment rental, specifically focused on tractors. It enables:
- **Farmers/Users**: Browse, book, and track tractors with real-time location monitoring
- **Administrators**: Manage fleet inventory, approve bookings, process payments, and monitor operations
- **System**: Provide transparent, secure, and efficient tractor rental services across Nepal's 77 districts

## Technology Stack

### Frontend Framework & Build Tools
- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool and dev server
- **React Router DOM 6.30.1** - Client-side routing

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - Component library (Radix UI primitives)
- **Lucide React** - Icon library
- **tailwindcss-animate** - Animation utilities

### State Management & Data Fetching
- **TanStack Query (React Query) 5.83.0** - Server state management
- **React Context API** - Global state (Auth, Language)

### Forms & Validation
- **React Hook Form 7.61.1** - Form management
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers** - Form validation integration

### Maps & Location
- **Leaflet 1.9.4** - Interactive maps
- **React Leaflet** - React bindings for Leaflet

### Additional Libraries
- **date-fns 3.6.0** - Date manipulation
- **crypto-js 4.2.0** - Encryption utilities
- **jspdf 2.5.2** - PDF generation
- **recharts 2.15.4** - Data visualization
- **sonner 1.7.4** - Toast notifications

## Project Structure

```
tbs-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Navbar.tsx      # Navigation bar
│   │   ├── Footer.tsx      # Footer component
│   │   ├── TractorCard.tsx # Tractor display card
│   │   ├── TractorTrackingMap.tsx # Real-time tracking map
│   │   ├── LiveRouteMap.tsx # Live route visualization
│   │   ├── DeliveryMapPicker.tsx # Location picker
│   │   ├── StarRating.tsx  # Rating component
│   │   └── RangeSlider.tsx # Price/HP filter slider
│   ├── pages/              # Route pages
│   │   ├── Index.tsx       # Landing page
│   │   ├── Tractors.tsx    # Tractor browsing
│   │   ├── TractorDetail.tsx # Tractor details & booking
│   │   ├── UserDashboard.tsx # User bookings dashboard
│   │   ├── AdminDashboard.tsx # Admin overview
│   │   ├── AdminTractors.tsx # Fleet management
│   │   ├── AdminBookings.tsx # Booking management
│   │   ├── AdminReports.tsx # Analytics & reports
│   │   ├── Tracking.tsx    # Real-time tracking page
│   │   ├── Login.tsx       # Authentication
│   │   ├── Register.tsx    # User registration
│   │   ├── Profile.tsx     # User profile management
│   │   ├── PaymentSuccess.tsx # Payment confirmation
│   │   ├── PaymentFailure.tsx # Payment error handling
│   │   ├── About.tsx       # About page
│   │   ├── Contact.tsx    # Contact page
│   │   ├── Privacy.tsx    # Privacy policy
│   │   └── NotFound.tsx   # 404 page
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── LanguageContext.tsx # i18n support
│   ├── lib/               # Utilities & API
│   │   ├── api.ts         # Backend API client
│   │   └── utils.ts       # Helper functions
│   ├── types/             # TypeScript definitions
│   │   ├── index.ts      # Core types (Tractor, Booking)
│   │   └── tractor.ts    # Tractor-specific types
│   ├── hooks/             # Custom React hooks
│   ├── data/              # Mock data (if any)
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── package.json           # Dependencies
└── vite.config.ts         # Vite configuration
```

## Key Features

### 1. Landing Page (`Index.tsx`)
- **Hero Section**: Animated carousel with farm-themed imagery
- **Featured Tractors**: Carousel showcasing available tractors
- **Statistics**: Platform metrics (districts covered, response time, utilization)
- **Platform Features**: Real-time tracking, unified operations, smart logistics
- **Workflow**: 3-step booking process visualization
- **Value Proposition**: Why choose the platform
- **Call-to-Action**: Conversion-focused sections

### 2. Tractor Browsing (`Tractors.tsx`)
- **Advanced Filters**:
  - Search by name/model
  - Location filter
  - Availability status
  - Price range slider
  - Horsepower range
  - Minimum rating
  - Tractor type (Compact, Row Crop, Specialty, Utility, Orchard)
- **Tractor Cards**: Image carousel, pricing, ratings, availability status
- **Responsive Grid**: Adaptive layout for different screen sizes
- **Real-time Data**: Fetches from backend API

### 3. Tractor Details & Booking (`TractorDetail.tsx`)
- **Detailed Information**: Full specs, images, location, ratings
- **Booking Form**: Date/time selection with validation
- **Delivery Location**: Interactive map picker for delivery address
- **Payment Options**: eSewa integration and Cash on Delivery
- **Reviews & Feedback**: User ratings and comments
- **Availability Status**: Real-time availability checking

### 4. User Dashboard (`UserDashboard.tsx`)
- **My Bookings**: List of all user bookings
- **Booking Status**: Pending, Confirmed, Delivered, Completed, Cancelled
- **Payment Status**: Track payment completion
- **Booking Actions**: Cancel requests, view details, track location
- **Image Carousels**: Visual representation of booked tractors

### 5. Real-Time Tracking (`Tracking.tsx`)
- **Live Map**: Leaflet-based interactive map
- **Route Visualization**: Real-time route updates
- **ETA Calculation**: Estimated time of arrival
- **Distance Tracking**: Current distance from destination
- **Status Updates**: Delivery status monitoring

### 6. Admin Dashboard (`AdminDashboard.tsx`)
- **Key Metrics**: Total tractors, bookings, revenue, active users
- **Quick Actions**: Links to fleet management, booking management, reports
- **Recent Bookings**: Latest booking activity
- **Statistics Cards**: Visual representation of business metrics

### 7. Fleet Management (`AdminTractors.tsx`)
- **Tractor CRUD**: Create, read, update, delete tractors
- **Image Upload**: Multiple image support with progress tracking
- **Location Management**: Set tractor locations via map picker
- **Status Management**: Update availability and status
- **Bulk Operations**: Manage multiple tractors efficiently

### 8. Booking Management (`AdminBookings.tsx`)
- **All Bookings**: View all system bookings
- **Approval Workflow**: Approve/deny booking requests
- **Payment Processing**: Mark payments, handle refunds
- **Delivery Status**: Update delivery status (ORDERED, DELIVERING, DELIVERED, RETURNED)
- **Booking Completion**: Mark bookings as completed
- **Refund Management**: Approve/reject refund requests

### 9. Reports & Analytics (`AdminReports.tsx`)
- **Business Metrics**: Revenue, bookings, utilization
- **Data Visualization**: Charts and graphs
- **Export Functionality**: CSV/PDF exports
- **Time-based Analysis**: Filter by date ranges

### 10. Authentication & Authorization
- **User Roles**: Customer and Admin
- **Protected Routes**: Route guards for authenticated users
- **JWT Tokens**: Token-based authentication
- **Profile Management**: Update name, profile picture

### 11. Multi-Language Support
- **Languages**: English (en) and Nepali (ne)
- **Context Provider**: `LanguageContext` for i18n
- **Translation Keys**: Comprehensive translation system
- **Persistent Selection**: Language preference saved in localStorage

### 12. Payment Integration
- **eSewa**: Digital payment gateway integration
- **Cash on Delivery (COD)**: Alternative payment method
- **Payment Verification**: Secure payment confirmation
- **Payment Status Tracking**: Real-time payment status updates

## API Integration

### Base Configuration
- **Base URL**: Configurable via `VITE_API_BASE_URL` environment variable
- **Default**: `http://localhost:8082`
- **Authentication**: Bearer token in Authorization header

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `PUT /api/auth/profile` - Update user profile

#### Tractors
- `GET /api/tractors` - List all tractors
- `GET /api/tractors/:id` - Get tractor details
- `POST /api/tractors` - Create tractor (admin)
- `PUT /api/tractors/:id` - Update tractor (admin)
- `DELETE /api/tractors/:id` - Delete tractor (admin)
- `PUT /api/tractors/:id/location` - Update tractor location
- `GET /api/tractors/:id/tracking` - Get tracking data
- `GET /api/tractors/:id/stats` - Get tractor statistics
- `POST /api/tractors/:id/feedback` - Submit feedback

#### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/all` - Get all bookings (admin)
- `GET /api/bookings/:id/tracking` - Get booking tracking
- `POST /api/bookings/:id/request-cancellation` - Request cancellation
- `POST /api/bookings/:id/approve` - Approve booking (admin)
- `POST /api/bookings/:id/deny` - Deny booking (admin)
- `POST /api/bookings/:id/mark-paid` - Mark as paid (admin)
- `POST /api/bookings/:id/mark-delivered` - Mark as delivered (admin)
- `POST /api/bookings/:id/mark-completed` - Mark as completed (admin)
- `PUT /api/bookings/:id/tractor-delivery-status` - Update delivery status

#### Payments
- `POST /api/payments/verify-esewa` - Verify eSewa payment
- `POST /api/payments/cash-on-delivery` - Confirm COD payment

#### Uploads
- `POST /api/uploads` - Upload image
- `DELETE /api/uploads/:filename` - Delete image

#### Metrics
- `GET /api/metrics/landing` - Landing page metrics
- `GET /api/dispatch/latest` - Latest dispatch summary

## Data Models

### Tractor
```typescript
interface Tractor {
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
```

### Booking
```typescript
interface Booking {
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
}
```

## Design System

### Color Palette
- **Primary**: Amber/Orange tones (farm/earth theme)
- **Secondary**: Emerald/Green (agricultural theme)
- **Accent**: Yellow/Gold highlights
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Font Family**: System fonts (sans-serif)
- **Headings**: Bold, large sizes (text-4xl to text-7xl)
- **Body**: Medium weight, readable sizes

### Component Patterns
- **Cards**: Rounded corners, shadows, hover effects
- **Buttons**: Gradient backgrounds, hover animations
- **Forms**: Clean inputs with validation feedback
- **Modals**: Backdrop blur, centered content
- **Carousels**: Auto-rotate with manual controls

## User Flows

### Customer Flow
1. **Browse**: Visit landing page → View featured tractors → Browse all tractors
2. **Filter**: Apply filters (location, price, HP, rating) → View filtered results
3. **Select**: Click tractor card → View details → Check availability
4. **Book**: Select dates/times → Pick delivery location → Choose payment method
5. **Pay**: Complete payment (eSewa or COD) → Receive confirmation
6. **Track**: View booking in dashboard → Track real-time location
7. **Complete**: Receive delivery → Mark as completed → Leave feedback

### Admin Flow
1. **Manage Fleet**: Add/edit tractors → Upload images → Set locations
2. **Monitor Bookings**: View all bookings → Approve/deny requests
3. **Process Payments**: Verify payments → Mark as paid
4. **Update Status**: Update delivery status → Mark as completed
5. **Analytics**: View reports → Export data → Analyze trends

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Route Guards**: Protected routes for authenticated users
- **Role-Based Access**: Admin vs Customer separation
- **Secure Payments**: Encrypted payment processing
- **Input Validation**: Client and server-side validation

## Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Lazy loading, fallback images
- **API Caching**: React Query caching strategies
- **Debounced Search**: Optimized filter inputs
- **Memoization**: React.memo, useMemo, useCallback

## Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Touch Friendly**: Large tap targets, swipe gestures
- **Adaptive Layouts**: Grid systems that adapt to screen size

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid and Flexbox

## Development Workflow

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Environment Variables
- `VITE_API_BASE_URL` - Backend API URL

## Future Enhancements (Potential)

- Push notifications for booking updates
- SMS/Email notifications
- Advanced analytics dashboard
- Mobile app (React Native)
- Offline mode support
- Multi-currency support
- Seasonal pricing
- Operator management
- Maintenance scheduling
- Customer support chat

## Key Differentiators

1. **Real-Time Tracking**: GPS-based location tracking for security
2. **Nepal-Focused**: Designed for Nepal's agricultural landscape
3. **Bilingual Support**: English and Nepali languages
4. **Flexible Payments**: eSewa and COD options
5. **Comprehensive Admin Tools**: Full fleet and booking management
6. **User-Friendly**: Intuitive interface for farmers of all tech levels
7. **Transparent Operations**: Clear pricing, status, and tracking

## Project Status

This is a production-ready frontend application that integrates with a Node.js/Express backend. The system is designed to scale and handle real-world tractor rental operations across Nepal.
