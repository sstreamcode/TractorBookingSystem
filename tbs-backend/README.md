# Tractor Booking System - Backend

A comprehensive Spring Boot backend for the Tractor Booking System with JWT authentication, SHA-256 password encryption, and eSewa payment integration.

## Features

- **User Management**: Registration, login with JWT authentication
- **Password Security**: SHA-256 encryption for password storage
- **Tractor Management**: CRUD operations for tractors
- **Booking System**: Create and manage tractor bookings
- **Payment Integration**: eSewa sandbox integration
- **Admin Panel**: Dashboard with summary statistics
- **Security**: Role-based access control (Admin/Customer)

## Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Database**: MySQL with Hibernate JPA
- **Security**: Spring Security with JWT
- **Authentication**: JWT tokens
- **Password Encryption**: SHA-256
- **Payment**: eSewa sandbox integration
- **Build Tool**: Maven

## Database Schema

### Users Table
- `id` (Primary Key)
- `email` (Unique)
- `password` (SHA-256 hashed)
- `first_name`
- `last_name`
- `phone` (Unique)
- `role` (ADMIN/CUSTOMER)
- `enabled`
- `created_at`
- `updated_at`

### Tractors Table
- `id` (Primary Key)
- `name`
- `model`
- `hourly_rate`
- `availability`
- `description`
- `image_url`
- `created_at`
- `updated_at`

### Bookings Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `tractor_id` (Foreign Key)
- `start_date`
- `end_date`
- `total_amount`
- `status` (PENDING/APPROVED/CANCELLED/COMPLETED)
- `payment_status` (PENDING/PAID/FAILED/REFUNDED)
- `esewa_transaction_id`
- `created_at`
- `updated_at`

### Payments Table
- `id` (Primary Key)
- `booking_id` (Foreign Key)
- `amount`
- `payment_method` (ESEWA/CASH/BANK_TRANSFER)
- `payment_status` (PENDING/PAID/FAILED/REFUNDED)
- `transaction_id`
- `esewa_reference_id`
- `esewa_response_code`
- `esewa_response_message`
- `created_at`
- `updated_at`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Tractors
- `GET /api/tractors` - Get all tractors
- `GET /api/tractors/available` - Get available tractors
- `GET /api/tractors/{id}` - Get tractor by ID
- `POST /api/tractors` - Create tractor (Admin only)
- `PUT /api/tractors/{id}` - Update tractor (Admin only)
- `DELETE /api/tractors/{id}` - Delete tractor (Admin only)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get all bookings (Admin only)
- `GET /api/bookings/user/{userId}` - Get user bookings
- `GET /api/bookings/{id}` - Get booking by ID
- `PUT /api/bookings/{id}/status` - Update booking status (Admin only)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user (Admin only)

### Admin
- `GET /api/admin/summary` - Get dashboard summary (Admin only)
- `GET /api/admin/users` - Get all users (Admin only)
- `GET /api/admin/bookings` - Get all bookings (Admin only)

### Payments
- `POST /api/payments/verify` - Verify eSewa payment
- `POST /api/payments/create/{bookingId}` - Create payment

## Configuration

### Database Configuration
Update `application.properties` with your MySQL credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/tractor_booking_system
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### JWT Configuration
```properties
jwt.secret=your_jwt_secret_key
jwt.expiration=86400000
```

### eSewa Configuration
```properties
esewa.sandbox.url=https://uat.esewa.com.np/epay/main
esewa.verify.url=https://uat.esewa.com.np/epay/transrec
esewa.merchant.code=EPAYTEST
esewa.success.url=http://localhost:5173/payment/success
esewa.failure.url=http://localhost:5173/payment/failure
```

### CORS Configuration
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000
cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
cors.allowed-headers=*
```

## Running the Application

1. **Prerequisites**:
   - Java 17 or higher
   - MySQL 8.0 or higher
   - Maven 3.6 or higher

2. **Database Setup**:
   ```sql
   CREATE DATABASE tractor_booking_system;
   ```

3. **Build and Run**:
   ```bash
   cd tbs-backend
   mvn clean install
   mvn spring-boot:run
   ```

4. **Access the Application**:
   - Backend API: `http://localhost:8080`
   - Health Check: `http://localhost:8080/actuator/health`

## Security Features

- **SHA-256 Password Encryption**: All passwords are hashed using SHA-256 before storage
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for Admin and Customer roles
- **CORS Configuration**: Configured for frontend access
- **Input Validation**: Request validation using Bean Validation

## Payment Integration

The system integrates with eSewa sandbox for payment processing:
- Generates payment URLs for bookings
- Verifies payment transactions
- Updates booking and payment status automatically
- Handles payment failures and success scenarios

## Error Handling

- Global exception handler for consistent error responses
- Validation error handling for request validation
- Structured JSON error responses with status codes and timestamps

## Development Notes

- Uses Spring Boot DevTools for hot reloading
- Hibernate DDL auto-update for development
- Comprehensive logging configuration
- RESTful API design principles
- Clean architecture with separation of concerns

## Future Enhancements

- Use bcrypt or Argon2 for stronger password hashing
- Real-time booking status with WebSocket
- Analytics dashboard
- SMS/email notifications
- File upload for tractor images
- Advanced booking validation
- Payment refund functionality
