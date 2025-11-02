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

@RestController
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
    public ResponseEntity<?> create(@RequestBody Map<String, String> body, Principal principal) {
        Long tractorId = Long.valueOf(body.get("tractorId"));
        LocalDateTime startAt = LocalDateTime.parse(body.get("startAt"));
        LocalDateTime endAt = LocalDateTime.parse(body.get("endAt"));

        Tractor tractor = tractorRepository.findById(tractorId).orElse(null);
        if (tractor == null) return ResponseEntity.badRequest().body(Map.of("error", "Tractor not found"));

        User user = userRepository.findByEmail(principal.getName()).orElseThrow();

        // Calculate total amount based on duration
        long hours = java.time.Duration.between(startAt, endAt).toHours();
        double totalAmount = hours * tractor.getHourlyRate();

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTractor(tractor);
        booking.setStartAt(startAt);
        booking.setEndAt(endAt);
        booking.setStatus("PENDING");
        booking.setTotalAmount(totalAmount);
        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.ok(saved);
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
}


