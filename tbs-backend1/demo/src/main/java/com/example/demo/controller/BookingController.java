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
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.TractorRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.TrackingMapper;
import com.example.demo.util.EmailService;

import java.time.format.DateTimeFormatter;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api/bookings")
public class BookingController {
    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);
    private final BookingRepository bookingRepository;
    private final TractorRepository tractorRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a");

    public BookingController(BookingRepository bookingRepository, TractorRepository tractorRepository, UserRepository userRepository, PaymentRepository paymentRepository, EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.tractorRepository = tractorRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.emailService = emailService;
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
        
        // Send booking confirmation email
        sendBookingCreatedEmail(saved);
        
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
                sendBookingCancelledEmail(booking);
                return ResponseEntity.ok(Map.of("status", "CANCELLED", "message", "Booking cancelled successfully"));
            } else if ("PAID".equals(booking.getStatus())) {
                // Request for refund for paid bookings
                booking.setStatus("REFUND_REQUESTED");
                bookingRepository.save(booking);
                logger.info("Booking {} marked for refund request", bookingId);
                sendRefundRequestedEmail(booking);
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
        
        sendRefundApprovedEmail(booking, refundAmount, totalAmount * 0.03);

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
        
        sendRefundRejectedEmail(booking);

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
        // Set delivery status to ORDERED when booking is approved
        if (tractor.getDeliveryStatus() == null || tractor.getDeliveryStatus().isEmpty()) {
            tractor.setDeliveryStatus("ORDERED");
        }
        applyDestinationFromBooking(tractor, booking);
        tractorRepository.save(tractor);
        
        sendBookingApprovedEmail(booking);

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
        
        sendBookingDeniedEmail(booking);

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

        // Check if booking has COD payment method
        boolean isCOD = booking.getPayments() != null && booking.getPayments().stream()
            .anyMatch(p -> "CASH_ON_DELIVERY".equals(p.getMethod()));

        // For COD, allow marking as paid even if delivered (payment received after delivery)
        // For non-COD, require approval before payment
        if (!isCOD && !"APPROVED".equals(booking.getAdminStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking must be approved before marking as paid"));
        }

        // For COD: If already delivered, keep status as DELIVERED (don't change to PAID)
        // For non-COD: Change status to PAID
        if (isCOD) {
            // For COD, if already delivered, keep it as DELIVERED
            if (!"DELIVERED".equals(booking.getStatus()) && !"COMPLETED".equals(booking.getStatus())) {
                booking.setStatus("PAID");
            }
        } else {
            // For non-COD, set status to PAID
            if (!"PAID".equals(booking.getStatus())) {
                booking.setStatus("PAID");
            }
        }

        if (!"APPROVED".equals(booking.getAdminStatus())) {
            booking.setAdminStatus("APPROVED");
        }
        
        // Update COD payment status to SUCCESS when marked as paid
        if (isCOD && booking.getPayments() != null) {
            booking.getPayments().stream()
                .filter(p -> "CASH_ON_DELIVERY".equals(p.getMethod()) && "PENDING".equals(p.getStatus()))
                .forEach(p -> {
                    p.setStatus("SUCCESS");
                    paymentRepository.save(p);
                });
        }

        bookingRepository.save(booking);
        Tractor tractor = booking.getTractor();
        applyDestinationFromBooking(tractor, booking);
        // Set delivery status to ORDERED when marked as paid
        if (tractor.getDeliveryStatus() == null || tractor.getDeliveryStatus().isEmpty()) {
            tractor.setDeliveryStatus("ORDERED");
        }
        tractorRepository.save(tractor);
        
        sendBookingPaidEmail(booking);

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

        // Check if booking has COD payment method
        boolean isCOD = booking.getPayments() != null && booking.getPayments().stream()
            .anyMatch(p -> "CASH_ON_DELIVERY".equals(p.getMethod()));

        // For COD: Must be approved before delivery
        // For eSewa: Must be paid (already confirmed) before delivery
        if (isCOD) {
            if (!"APPROVED".equals(booking.getAdminStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "COD booking must be approved before marking as delivered"));
            }
        } else {
            // For eSewa (non-COD): Must be paid before delivery
            if (!"PAID".equals(booking.getStatus()) && !"DELIVERED".equals(booking.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Booking must be paid before marking as delivered"));
            }
        }

        booking.setStatus("DELIVERED");
        bookingRepository.save(booking);

        Tractor tractor = booking.getTractor();
        
        // Store original tractor location before updating to delivery location (if not already stored)
        if (booking.getOriginalTractorLatitude() == null && tractor.getLatitude() != null) {
            booking.setOriginalTractorLatitude(tractor.getLatitude());
            booking.setOriginalTractorLongitude(tractor.getLongitude());
            booking.setOriginalTractorLocation(tractor.getLocation());
        }
        
        tractor.setStatus("In Use");
        tractor.setAvailable(false);
        tractor.setDeliveryStatus("DELIVERED"); // Update delivery status
        
        // Update tractor current location to delivery location
        if (booking.getDeliveryLatitude() != null && booking.getDeliveryLongitude() != null) {
            tractor.setLatitude(booking.getDeliveryLatitude());
            tractor.setLongitude(booking.getDeliveryLongitude());
            tractor.setLocationUpdatedAt(LocalDateTime.now());
        }
        if (booking.getDeliveryAddress() != null) {
            tractor.setLocation(booking.getDeliveryAddress());
        }
        // Clear destination since tractor has arrived
        tractor.setDestinationLatitude(null);
        tractor.setDestinationLongitude(null);
        tractor.setDestinationAddress(null);
        
        bookingRepository.save(booking); // Save booking with original location
        tractorRepository.save(tractor);
        
        sendBookingDeliveredEmail(booking);

        return ResponseEntity.ok(Map.of("status", "DELIVERED", "message", "Booking marked as delivered"));
    }

    @PostMapping("/{bookingId}/mark-completed")
    public ResponseEntity<?> markBookingCompleted(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only admins can mark bookings as completed"));
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }

        Tractor tractor = booking.getTractor();
        if (tractor == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor not found"));
        }

        // Check if tractor has been returned
        if (!"RETURNED".equals(tractor.getDeliveryStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot complete booking. Tractor must be returned first."));
        }

        // Check if booking is already completed
        if ("COMPLETED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking is already completed"));
        }

        // Check if booking is cancelled
        if ("CANCELLED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot complete a cancelled booking"));
        }

        // Allow completion if booking end time has passed (or is within 1 hour of ending)
        // This gives some flexibility for early returns
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (booking.getEndAt().isAfter(now) && booking.getEndAt().isAfter(now.plusHours(1))) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", 
                "Cannot complete booking before the scheduled end time. Booking ends at: " + booking.getEndAt()
            ));
        }

        booking.setStatus("COMPLETED");
        bookingRepository.save(booking);

        // Reset tractor location to original admin location
        if (booking.getOriginalTractorLatitude() != null && booking.getOriginalTractorLongitude() != null) {
            tractor.setLatitude(booking.getOriginalTractorLatitude());
            tractor.setLongitude(booking.getOriginalTractorLongitude());
            tractor.setLocationUpdatedAt(LocalDateTime.now());
        }
        if (booking.getOriginalTractorLocation() != null) {
            tractor.setLocation(booking.getOriginalTractorLocation());
        } else {
            // Fallback to default location if original not stored
            tractor.setLatitude(27.7172); // Kathmandu default
            tractor.setLongitude(85.3240);
            tractor.setLocation("Kathmandu, Nepal");
        }
        
        // Reset tractor status and availability
        tractor.setStatus("Available");
        tractor.setAvailable(true);
        tractor.setDeliveryStatus(null); // Clear delivery status
        tractor.setDestinationLatitude(null);
        tractor.setDestinationLongitude(null);
        tractor.setDestinationAddress(null);
        
        tractorRepository.save(tractor);

        // Send completion email
        try {
            sendBookingCompletedEmail(booking);
        } catch (Exception e) {
            logger.error("Failed to send booking completed email", e);
        }

        return ResponseEntity.ok(Map.of("status", "COMPLETED", "message", "Booking marked as completed"));
    }
    
    private void sendBookingCompletedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            String subject = "Booking Completed - Tractor Sewa";
            String message = "Your booking has been successfully completed! Thank you for using Tractor Sewa. We hope you had a great experience. We look forward to serving you again!";
            String bookingDetails = formatBookingDetails(booking);
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Booking Completed",
                message,
                "COMPLETED",
                bookingDetails
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking completed email", e);
        }
    }

    @PutMapping("/{bookingId}/tractor-delivery-status")
    public ResponseEntity<?> updateTractorDeliveryStatus(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> body,
            Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only admins can update delivery status"));
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }

        String deliveryStatus = body.get("deliveryStatus");
        if (deliveryStatus == null || 
            (!deliveryStatus.equals("ORDERED") && 
             !deliveryStatus.equals("DELIVERING") && 
             !deliveryStatus.equals("DELIVERED") && 
             !deliveryStatus.equals("RETURNED"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid delivery status. Must be ORDERED, DELIVERING, DELIVERED, or RETURNED"));
        }

        Tractor tractor = booking.getTractor();
        if (tractor == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor not found"));
        }

        // Prevent reverting delivery status if tractor is already returned
        if ("RETURNED".equals(tractor.getDeliveryStatus()) && !"RETURNED".equals(deliveryStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot change status. Tractor has already been returned."));
        }

        String previousStatus = tractor.getDeliveryStatus();
        tractor.setDeliveryStatus(deliveryStatus);
        
        // Update tractor availability and status based on delivery status
        switch (deliveryStatus) {
            case "ORDERED":
                tractor.setStatus("Booked");
                tractor.setAvailable(false);
                break;
            case "DELIVERING":
                tractor.setStatus("In Transit");
                tractor.setAvailable(false);
                break;
            case "DELIVERED":
                tractor.setStatus("In Use");
                tractor.setAvailable(false);
                
                // Store original tractor location before updating to delivery location (if not already stored)
                if (booking.getOriginalTractorLatitude() == null && tractor.getLatitude() != null) {
                    booking.setOriginalTractorLatitude(tractor.getLatitude());
                    booking.setOriginalTractorLongitude(tractor.getLongitude());
                    booking.setOriginalTractorLocation(tractor.getLocation());
                }
                
                // Update tractor current location to delivery location
                if (booking.getDeliveryLatitude() != null && booking.getDeliveryLongitude() != null) {
                    tractor.setLatitude(booking.getDeliveryLatitude());
                    tractor.setLongitude(booking.getDeliveryLongitude());
                    tractor.setLocationUpdatedAt(LocalDateTime.now());
                }
                if (booking.getDeliveryAddress() != null) {
                    tractor.setLocation(booking.getDeliveryAddress());
                }
                // Clear destination since tractor has arrived
                tractor.setDestinationLatitude(null);
                tractor.setDestinationLongitude(null);
                tractor.setDestinationAddress(null);
                
                // Update booking status if not already delivered
                // For COD, booking can be DELIVERED before being PAID
                // For non-COD, booking should be PAID before being DELIVERED
                boolean isCOD = booking.getPayments() != null && booking.getPayments().stream()
                    .anyMatch(p -> "CASH_ON_DELIVERY".equals(p.getMethod()));
                
                if (!"DELIVERED".equals(booking.getStatus()) && 
                    (isCOD || "PAID".equals(booking.getStatus()))) {
                    booking.setStatus("DELIVERED");
                }
                bookingRepository.save(booking); // Save booking with original location
                break;
            case "RETURNED":
                // Check if booking end time has passed
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                if (booking.getEndAt().isAfter(now)) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", 
                        "Cannot mark tractor as returned before booking end time. Booking ends at: " + booking.getEndAt()
                    ));
                }
                
                tractor.setStatus("Available");
                tractor.setAvailable(true);
                // Don't auto-complete booking when returned - admin must mark as completed after booking time ends
                // Booking status remains as DELIVERED until explicitly marked as COMPLETED
                break;
        }
        
        tractorRepository.save(tractor);

        return ResponseEntity.ok(Map.of(
            "deliveryStatus", deliveryStatus,
            "tractorStatus", tractor.getStatus(),
            "message", "Tractor delivery status updated from " + (previousStatus != null ? previousStatus : "null") + " to " + deliveryStatus
        ));
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
    
    // Email notification helper methods
    private String formatBookingDetails(Booking booking) {
        Tractor tractor = booking.getTractor();
        long hours = java.time.Duration.between(booking.getStartAt(), booking.getEndAt()).toHours();
        
        StringBuilder details = new StringBuilder();
        details.append("<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>");
        details.append("<table style='width: 100%%; border-collapse: collapse;'>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Booking ID:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>#").append(booking.getId()).append("</td></tr>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Tractor:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(tractor != null ? tractor.getName() : "N/A").append("</td></tr>");
        
        if (tractor != null && tractor.getModel() != null) {
            details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Model:</td>");
            details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(tractor.getModel()).append("</td></tr>");
        }
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Start Date:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(booking.getStartAt().format(DATE_FORMATTER)).append("</td></tr>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>End Date:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(booking.getEndAt().format(DATE_FORMATTER)).append("</td></tr>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Duration:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(hours).append(" hour(s)</td></tr>");
        
        if (booking.getDeliveryAddress() != null) {
            details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Delivery Address:</td>");
            details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(booking.getDeliveryAddress()).append("</td></tr>");
        }
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Total Amount:</td>");
        details.append("<td style='padding: 8px 0; color: #059669; font-size: 16px; font-weight: 700;'>Rs. ").append(String.format("%.2f", booking.getTotalAmount())).append("</td></tr>");
        
        details.append("</table></div>");
        return details.toString();
    }
    
    private void sendBookingCreatedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            // Check payment method to customize message
            boolean isCOD = booking.getPayments() != null && booking.getPayments().stream()
                .anyMatch(p -> "CASH_ON_DELIVERY".equals(p.getMethod()));
            
            String subject = "Booking Request Received - Tractor Sewa";
            String message;
            if (isCOD) {
                message = "Thank you for your booking request with Cash on Delivery! Your booking has been received and is pending admin approval. Once approved, you can proceed with payment upon delivery.";
            } else {
                message = "Thank you for your booking request! Your booking has been received and is pending admin approval. Once approved, please proceed with the payment to confirm your booking.";
            }
            String bookingDetails = formatBookingDetails(booking);
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Booking Request Received",
                message,
                "PENDING_APPROVAL",
                bookingDetails
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking created email", e);
        }
    }
    
    private void sendBookingApprovedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            // Check payment method to customize message
            boolean isCOD = booking.getPayments() != null && booking.getPayments().stream()
                .anyMatch(p -> "CASH_ON_DELIVERY".equals(p.getMethod()));
            
            String subject = "Booking Approved - Tractor Sewa";
            String message;
            if (isCOD) {
                message = "Great news! Your booking has been approved by our admin team. Your tractor will be delivered to the specified location, and you can pay upon delivery. We will notify you when your tractor is on the way.";
            } else {
                message = "Great news! Your booking has been approved by our admin team. Please proceed with the payment to confirm your booking. Once payment is confirmed, we will notify you when your tractor is on the way.";
            }
            String bookingDetails = formatBookingDetails(booking);
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Booking Approved",
                message,
                "APPROVED",
                bookingDetails
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking approved email", e);
        }
    }
    
    private void sendBookingDeniedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            String subject = "Booking Denied - Tractor Sewa";
            String message = "We regret to inform you that your booking request has been denied. If you have any questions, please contact our support team.";
            String bookingDetails = formatBookingDetails(booking);
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Booking Denied",
                message,
                "DENIED",
                bookingDetails
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking denied email", e);
        }
    }
    
    private void sendBookingPaidEmail(Booking booking) {
        try {
            User user = booking.getUser();
            String subject = "Payment Confirmed - Tractor Sewa";
            String message = "Your payment has been confirmed! Your booking is now active and ready for delivery. We will notify you when your tractor is on the way to your location.";
            String bookingDetails = formatBookingDetails(booking);
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Payment Confirmed",
                message,
                "PAID",
                bookingDetails
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking paid email", e);
        }
    }
    
    private void sendBookingDeliveredEmail(Booking booking) {
        try {
            User user = booking.getUser();
            String subject = "Tractor Delivered - Tractor Sewa";
            String message = "Your tractor has been delivered to the specified location and is ready for use. Please ensure to return it on time as per your booking schedule. Thank you for choosing Tractor Sewa!";
            String bookingDetails = formatBookingDetails(booking);
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Tractor Delivered",
                message,
                "DELIVERED",
                bookingDetails
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking delivered email", e);
        }
    }
    
    private void sendBookingCancelledEmail(Booking booking) {
        try {
            User user = booking.getUser();
            String subject = "Booking Cancelled - Tractor Sewa";
            String message = "Your booking has been cancelled successfully. If you have any questions or need assistance, please contact our support team.";
            String bookingDetails = formatBookingDetails(booking);
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Booking Cancelled",
                message,
                "CANCELLED",
                bookingDetails
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking cancelled email", e);
        }
    }
    
    private void sendRefundRequestedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            String subject = "Refund Request Submitted - Tractor Sewa";
            String message = "Your refund request has been submitted and is pending admin approval. We will process your request and notify you once it's reviewed.";
            String bookingDetails = formatBookingDetails(booking);
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Refund Request Submitted",
                message,
                "REFUND_REQUESTED",
                bookingDetails
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send refund requested email", e);
        }
    }
    
    private void sendRefundApprovedEmail(Booking booking, double refundAmount, double fee) {
        try {
            User user = booking.getUser();
            String subject = "Refund Approved - Tractor Sewa";
            String message = String.format(
                "Your refund request has been approved! A refund of Rs. %.2f (after a 3%% processing fee of Rs. %.2f) will be processed to your original payment method within 5-7 business days.",
                refundAmount, fee
            );
            String bookingDetails = formatBookingDetails(booking);
            String refundInfo = String.format(
                "<div style='background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px 20px; margin: 20px 0; border-radius: 4px;'>" +
                "<p style='margin: 0; color: #065f46; font-size: 14px;'><strong>Refund Amount:</strong> Rs. %.2f</p>" +
                "<p style='margin: 5px 0 0 0; color: #065f46; font-size: 14px;'><strong>Processing Fee:</strong> Rs. %.2f</p>" +
                "</div>",
                refundAmount, fee
            );
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Refund Approved",
                message,
                "CANCELLED",
                bookingDetails + refundInfo
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send refund approved email", e);
        }
    }
    
    private void sendRefundRejectedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            String subject = "Refund Request Rejected - Tractor Sewa";
            String message = "We regret to inform you that your refund request has been rejected. Your booking remains active. If you have any questions, please contact our support team.";
            String bookingDetails = formatBookingDetails(booking);
            String htmlContent = emailService.buildEmailTemplate(
                user.getName(),
                "Refund Request Rejected",
                message,
                "PAID",
                bookingDetails
            );
            emailService.sendBookingNotification(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send refund rejected email", e);
        }
    }
}


