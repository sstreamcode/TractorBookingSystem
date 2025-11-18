package com.example.demo.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.demo.model.Booking;
import com.example.demo.model.Tractor;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.TractorRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.TrackingMapper;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api/bookings")
public class BookingController {
    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);
    private final BookingRepository bookingRepository;
    private final TractorRepository tractorRepository;
    private final UserRepository userRepository;

    public BookingController(BookingRepository bookingRepository, TractorRepository tractorRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.tractorRepository = tractorRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Booking> myBookings(Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        return bookingRepository.findByUser(user);
    }

    @GetMapping("/all")
    public List<Booking> allBookings(Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            throw new RuntimeException("Only admins can view all bookings");
        }
        return bookingRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Principal principal) {
        Long tractorId = Long.valueOf(body.get("tractorId").toString());
        LocalDateTime startAt = LocalDateTime.parse(body.get("startAt").toString());
        LocalDateTime endAt = LocalDateTime.parse(body.get("endAt").toString());

        Tractor tractor = tractorRepository.findById(tractorId).orElse(null);
        if (tractor == null) return ResponseEntity.badRequest().body(Map.of("error", "Tractor not found"));

        User user = userRepository.findByEmail(principal.getName()).orElseThrow();

        // Calculate total amount based on duration
        long hours = java.time.Duration.between(startAt, endAt).toHours();
        double totalAmount = hours * tractor.getHourlyRate();

        // Get delivery location from request
        Double deliveryLat = body.get("deliveryLatitude") != null ? 
            Double.valueOf(body.get("deliveryLatitude").toString()) : null;
        Double deliveryLng = body.get("deliveryLongitude") != null ? 
            Double.valueOf(body.get("deliveryLongitude").toString()) : null;
        String deliveryAddress = body.get("deliveryAddress") != null ? 
            body.get("deliveryAddress").toString() : null;

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTractor(tractor);
        booking.setStartAt(startAt);
        booking.setEndAt(endAt);
        booking.setStatus("PENDING");
        booking.setAdminStatus("PENDING_APPROVAL"); // New bookings require admin approval
        booking.setTotalAmount(totalAmount);
        booking.setDeliveryLatitude(deliveryLat);
        booking.setDeliveryLongitude(deliveryLng);
        booking.setDeliveryAddress(deliveryAddress);
        
        if (deliveryLat != null && deliveryLng != null && tractor.getDestinationLatitude() == null && tractor.getDestinationLongitude() == null) {
            tractor.setDestinationLatitude(deliveryLat);
            tractor.setDestinationLongitude(deliveryLng);
            tractor.setDestinationAddress(deliveryAddress);
            tractorRepository.save(tractor);
        }

        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{bookingId}/tracking")
    public ResponseEntity<?> getBookingTracking(@PathVariable Long bookingId, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User requester = userRepository.findByEmail(principal.getName()).orElse(null);
        if (requester == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }
        Booking booking = bookingOpt.get();
        if (!"ADMIN".equals(requester.getRole()) && !booking.getUser().getId().equals(requester.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
        }
        Tractor tractor = booking.getTractor();
        if (tractor == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor data unavailable"));
        }
        return ResponseEntity.ok(TrackingMapper.buildPayload(tractor, booking));
    }

    @PostMapping("/{bookingId}/request-cancellation")
    public ResponseEntity<?> requestCancellation(@PathVariable Long bookingId, Principal principal) {
        try {
            logger.info("Cancellation request for booking {} by user {}", bookingId, principal != null ? principal.getName() : "null");
            
            if (principal == null || principal.getName() == null) {
                logger.error("Principal is null or has no name");
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            
            Optional<User> userOpt = userRepository.findByEmail(principal.getName());
            if (userOpt.isEmpty()) {
                logger.error("User not found for email: {}", principal.getName());
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            User user = userOpt.get();
            
            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
            if (bookingOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
            }
            Booking booking = bookingOpt.get();
            
            // Verify booking belongs to user (unless admin)
            if (!"ADMIN".equals(user.getRole()) && !booking.getUser().getId().equals(user.getId())) {
                logger.error("Unauthorized cancellation attempt - booking {} belongs to user {} but requested by {}", 
                    bookingId, booking.getUser().getId(), user.getId());
                return ResponseEntity.badRequest().body(Map.of("error", "Unauthorized"));
            }

            // Update status based on current state
            if ("PENDING".equals(booking.getStatus())) {
                // Direct cancellation for pending bookings
                booking.setStatus("CANCELLED");
                bookingRepository.save(booking);
                logger.info("Booking {} cancelled successfully", bookingId);
                return ResponseEntity.ok(Map.of("status", "CANCELLED", "message", "Booking cancelled successfully"));
            } else if ("PAID".equals(booking.getStatus())) {
                // Request for refund for paid bookings
                booking.setStatus("REFUND_REQUESTED");
                bookingRepository.save(booking);
                logger.info("Booking {} marked for refund request", bookingId);
                return ResponseEntity.ok(Map.of("status", "REFUND_REQUESTED", "message", "Refund request submitted for admin approval"));
            } else {
                logger.warn("Cannot cancel booking {} with status: {}", bookingId, booking.getStatus());
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot cancel booking in current status"));
            }
        } catch (Exception ex) {
            logger.error("Error processing cancellation request for booking {}", bookingId, ex);
            throw ex;
        }
    }

    @PostMapping("/{bookingId}/approve-refund")
    public ResponseEntity<?> approveRefund(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only admins can approve refunds"));
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        
        if (!"REFUND_REQUESTED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking is not in REFUND_REQUESTED status"));
        }

        // Calculate refund amount (3% deduction)
        double totalAmount = booking.getTotalAmount();
        double refundAmount = totalAmount * 0.97; // 97% refund (3% fee)

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of(
            "status", "CANCELLED", 
            "refundAmount", refundAmount,
            "originalAmount", totalAmount,
            "fee", totalAmount * 0.03,
            "message", "Refund approved"
        ));
    }

    @PostMapping("/{bookingId}/reject-refund")
    public ResponseEntity<?> rejectRefund(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only admins can reject refunds"));
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        
        if (!"REFUND_REQUESTED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking is not in REFUND_REQUESTED status"));
        }

        booking.setStatus("PAID"); // Revert back to PAID
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of("status", "PAID", "message", "Refund request rejected"));
    }

    @PostMapping("/{bookingId}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only admins can approve bookings"));
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        
        // Check availability before approving
        Tractor tractor = booking.getTractor();
        Integer quantity = tractor.getQuantity() != null ? tractor.getQuantity() : 1;
        
        // Count overlapping approved bookings
        List<Booking> overlapping = bookingRepository.findOverlappingBookings(
            tractor, booking.getStartAt(), booking.getEndAt());
        
        // Exclude current booking from count
        long overlappingCount = overlapping.stream()
            .filter(b -> !b.getId().equals(bookingId))
            .count();
        
        if (overlappingCount >= quantity) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", 
                String.format("Cannot approve: All %d tractors are already booked for this time period", quantity)
            ));
        }

        booking.setAdminStatus("APPROVED");
        bookingRepository.save(booking);
        applyDestinationFromBooking(tractor, booking);
        tractorRepository.save(tractor);

        return ResponseEntity.ok(Map.of("adminStatus", "APPROVED", "message", "Booking approved"));
    }

    @PostMapping("/{bookingId}/deny")
    public ResponseEntity<?> denyBooking(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only admins can deny bookings"));
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));

        booking.setAdminStatus("DENIED");
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of("adminStatus", "DENIED", "message", "Booking denied"));
    }

    @PostMapping("/{bookingId}/mark-paid")
    public ResponseEntity<?> markBookingPaid(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only admins can update payment status"));
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));

        if ("CANCELLED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot mark a cancelled booking as paid"));
        }

        if (!"PAID".equals(booking.getStatus())) {
            booking.setStatus("PAID");
        }

        if (!"APPROVED".equals(booking.getAdminStatus())) {
            booking.setAdminStatus("APPROVED");
        }

        bookingRepository.save(booking);
        applyDestinationFromBooking(booking.getTractor(), booking);
        tractorRepository.save(booking.getTractor());

        return ResponseEntity.ok(Map.of("status", "PAID", "message", "Booking marked as paid"));
    }

    @PostMapping("/{bookingId}/mark-delivered")
    public ResponseEntity<?> markBookingDelivered(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only admins can update delivery status"));
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));

        if (!"PAID".equals(booking.getStatus()) && !"DELIVERED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking must be paid before marking as delivered"));
        }

        booking.setStatus("DELIVERED");
        bookingRepository.save(booking);

        Tractor tractor = booking.getTractor();
        tractor.setStatus("In Use");
        tractor.setAvailable(false);
        clearDestinationAfterDelivery(tractor, booking);
        tractorRepository.save(tractor);

        return ResponseEntity.ok(Map.of("status", "DELIVERED", "message", "Booking marked as delivered"));
    }

    private void applyDestinationFromBooking(Tractor tractor, Booking booking) {
        if (tractor == null || booking == null) return;
        if (booking.getDeliveryLatitude() == null || booking.getDeliveryLongitude() == null) return;
        tractor.setDestinationLatitude(booking.getDeliveryLatitude());
        tractor.setDestinationLongitude(booking.getDeliveryLongitude());
        tractor.setDestinationAddress(booking.getDeliveryAddress());
    }

    private void clearDestinationAfterDelivery(Tractor tractor, Booking booking) {
        if (tractor == null) return;
        if (booking != null && booking.getDeliveryLatitude() != null && booking.getDeliveryLongitude() != null) {
            tractor.setLatitude(booking.getDeliveryLatitude());
            tractor.setLongitude(booking.getDeliveryLongitude());
        }
        if (booking != null && booking.getDeliveryAddress() != null) {
            tractor.setLocation(booking.getDeliveryAddress());
        }
        tractor.setDestinationLatitude(null);
        tractor.setDestinationLongitude(null);
        tractor.setDestinationAddress(null);
        tractor.setLocationUpdatedAt(LocalDateTime.now());
    }
}


