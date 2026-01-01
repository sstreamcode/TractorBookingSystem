package com.example.demo.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
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
        String role = user.getRole();
        if (!"SUPER_ADMIN".equals(role) && !"ADMIN".equals(role)) {
            throw new RuntimeException("Only super admins can view all bookings");
        }
        return bookingRepository.findAll();
    }

    @GetMapping("/tractor-owner")
    public ResponseEntity<?> tractorOwnerBookings(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        if (!"TRACTOR_OWNER".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only tractor owners can view their bookings"));
        }
        
        // Get all tractors owned by this user
        List<Tractor> ownerTractors = tractorRepository.findByOwner(user);
        List<Long> tractorIds = ownerTractors.stream().map(Tractor::getId).collect(java.util.stream.Collectors.toList());
        
        // Get all bookings for these tractors
        List<Booking> bookings = bookingRepository.findAll().stream()
            .filter(b -> b.getTractor() != null && tractorIds.contains(b.getTractor().getId()))
            .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(bookings);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Principal principal) {
        Long tractorId = Long.valueOf(body.get("tractorId").toString());
        LocalDateTime startAt = LocalDateTime.parse(body.get("startAt").toString());
        LocalDateTime endAt = LocalDateTime.parse(body.get("endAt").toString());

        Tractor tractor = tractorRepository.findById(tractorId).orElse(null);
        if (tractor == null) return ResponseEntity.badRequest().body(Map.of("error", "Tractor not found"));

        User user = userRepository.findByEmail(principal.getName()).orElseThrow();

        // Calculate booked duration in minutes
        java.time.Duration duration = java.time.Duration.between(startAt, endAt);
        long bookedMinutes = duration.toMinutes();
        
        // Enforce minimum booking time of 30 minutes
        if (bookedMinutes < 30) {
            return ResponseEntity.badRequest().body(Map.of("error", "Minimum booking time is 30 minutes"));
        }
        
        // Calculate initial price based on booked time (minimum 30 minutes)
        // If booked time is less than 30 minutes, charge for 30 minutes
        long chargeableMinutes = Math.max(bookedMinutes, 30L);
        double hours = chargeableMinutes / 60.0; // Convert to hours as decimal
        double initialPrice = hours * tractor.getHourlyRate();
        
        // Set totalAmount to initialPrice for now (will be recalculated after actual usage)
        double totalAmount = initialPrice;
        
        // Calculate 15% commission (will be recalculated on final price)
        double commissionAmount = totalAmount * 0.15;

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
        booking.setInitialPrice(initialPrice);
        booking.setFinalPrice(null); // Will be calculated after usage
        booking.setRefundAmount(null); // Will be calculated after usage if overpaid
        booking.setBookedMinutes(bookedMinutes);
        booking.setActualUsageMinutes(null); // Will be set when customer stops usage
        booking.setActualUsageStartTime(null); // Will be set when customer starts usage
        booking.setActualUsageStopTime(null); // Will be set when customer stops usage
        booking.setCommissionAmount(commissionAmount);
        booking.setPaymentReleased(false);
        booking.setDeliveryLatitude(deliveryLat);
        booking.setDeliveryLongitude(deliveryLng);
        booking.setDeliveryAddress(deliveryAddress);
        
        // Set delivery status to null for new booking (per-booking status)
        booking.setDeliveryStatus(null);
        
        // Check tractor quantity availability before allowing booking
        Integer tractorQuantity = tractor.getQuantity() != null ? tractor.getQuantity() : 1;
        if (tractorQuantity <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor is not available. All units are currently booked."));
        }
        
        // Count active bookings for this tractor (approved/paid/delivered bookings that haven't ended)
        LocalDateTime now = LocalDateTime.now();
        long activeBookingsCount = bookingRepository.findAll().stream()
            .filter(b -> b.getTractor().getId().equals(tractorId))
            .filter(b -> {
                String adminStatus = b.getAdminStatus();
                boolean isApproved = adminStatus == null || "APPROVED".equals(adminStatus);
                String status = b.getStatus();
                boolean isActive = "PENDING".equals(status) || "PAID".equals(status) || 
                                  "DELIVERED".equals(status) || "CONFIRMED".equals(status);
                boolean notReturned = b.getDeliveryStatus() == null || 
                                     !"RETURNED".equals(b.getDeliveryStatus());
                boolean notCompleted = !"COMPLETED".equals(status) && !"CANCELLED".equals(status);
                return isApproved && isActive && notReturned && notCompleted && b.getEndAt().isAfter(now);
            })
            .count();
        
        // Check if there's available quantity
        if (activeBookingsCount >= tractorQuantity) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", 
                String.format("Tractor is fully booked. %d out of %d units are currently in use.", 
                    activeBookingsCount, tractorQuantity)
            ));
        }
        
        if (deliveryLat != null && deliveryLng != null && tractor.getDestinationLatitude() == null && tractor.getDestinationLongitude() == null) {
            tractor.setDestinationLatitude(deliveryLat);
            tractor.setDestinationLongitude(deliveryLng);
            tractor.setDestinationAddress(deliveryAddress);
        }
        
        // Save tractor with cleared delivery status
        tractorRepository.save(tractor);

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
        String role = requester.getRole();
        boolean isSuperAdmin = "SUPER_ADMIN".equals(role);
        boolean isTractorOwner = "TRACTOR_OWNER".equals(role) && booking.getTractor().getOwner() != null 
            && booking.getTractor().getOwner().getId().equals(requester.getId());
        boolean isBookingOwner = booking.getUser().getId().equals(requester.getId());
        
        if (!isSuperAdmin && !isTractorOwner && !isBookingOwner) {
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
            
            // Verify booking belongs to user (unless super admin or tractor owner)
            String role = user.getRole();
            boolean isSuperAdmin = "SUPER_ADMIN".equals(role);
            boolean isTractorOwner = "TRACTOR_OWNER".equals(role) && booking.getTractor().getOwner() != null 
                && booking.getTractor().getOwner().getId().equals(user.getId());
            boolean isBookingOwner = booking.getUser().getId().equals(user.getId());
            
            if (!isSuperAdmin && !isTractorOwner && !isBookingOwner) {
                logger.error("Unauthorized cancellation attempt - booking {} belongs to user {} but requested by {}", 
                    bookingId, booking.getUser().getId(), user.getId());
                return ResponseEntity.badRequest().body(Map.of("error", "Unauthorized"));
            }

            // Check if payment method is COD
            boolean isCOD = booking.getPayments() != null && booking.getPayments().stream()
                .anyMatch(p -> "CASH_ON_DELIVERY".equals(p.getMethod()));
            
            // For COD bookings: prevent cancellation after 30 minutes from booking creation or after approval
            if (isCOD && isBookingOwner) {
                LocalDateTime bookingCreatedAt = booking.getStartAt(); // Using startAt as proxy for creation time
                long minutesSinceBooking = java.time.Duration.between(bookingCreatedAt, LocalDateTime.now()).toMinutes();
                
                // Check if 30 minutes have passed or booking is approved
                if (minutesSinceBooking >= 30 || "APPROVED".equals(booking.getAdminStatus())) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", 
                        "COD bookings cannot be cancelled after 30 minutes or once approved. This prevents cancellation during delivery."
                    ));
                }
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
        if (!"SUPER_ADMIN".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only super admins can approve refunds"));
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
        if (!"SUPER_ADMIN".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only super admins can reject refunds"));
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
        String role = user.getRole();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        
        // Check if this is a COD booking
        boolean isCOD = booking.getPayments() != null && booking.getPayments().stream()
            .anyMatch(p -> "CASH_ON_DELIVERY".equals(p.getMethod()));
        
        // Super admin, admin, or tractor owner (for COD bookings only) can approve
        boolean isSuperAdmin = "SUPER_ADMIN".equals(role) || "ADMIN".equals(role);
        boolean isTractorOwner = "TRACTOR_OWNER".equals(role) && booking.getTractor().getOwner() != null 
            && booking.getTractor().getOwner().getId().equals(user.getId());
        
        if (!isSuperAdmin && !(isTractorOwner && isCOD)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only super admins, admins, or tractor owners (for COD bookings) can approve bookings"));
        }
        
        // Check availability before approving and decrease quantity
        Tractor tractor = booking.getTractor();
        Integer quantity = tractor.getQuantity() != null ? tractor.getQuantity() : 1;
        
        // Count active bookings (excluding this one if it's already approved)
        LocalDateTime now = LocalDateTime.now();
        long activeBookingsCount = bookingRepository.findAll().stream()
            .filter(b -> b.getTractor().getId().equals(tractor.getId()))
            .filter(b -> !b.getId().equals(bookingId)) // Exclude current booking
            .filter(b -> {
                String adminStatus = b.getAdminStatus();
                boolean isApproved = adminStatus == null || "APPROVED".equals(adminStatus);
                String status = b.getStatus();
                boolean isActive = "PENDING".equals(status) || "PAID".equals(status) || 
                                  "DELIVERED".equals(status) || "CONFIRMED".equals(status);
                boolean notReturned = b.getDeliveryStatus() == null || 
                                     !"RETURNED".equals(b.getDeliveryStatus());
                boolean notCompleted = !"COMPLETED".equals(status) && !"CANCELLED".equals(status);
                return isApproved && isActive && notReturned && notCompleted && b.getEndAt().isAfter(now);
            })
            .count();
        
        // Check if there's available quantity
        if (activeBookingsCount >= quantity) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", 
                String.format("Cannot approve booking. Tractor is fully booked. %d out of %d units are currently in use.", 
                    activeBookingsCount, quantity)
            ));
        }
        
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
        
        // For COD bookings: Set delivery status to ORDERED when approved
        // This allows tracking to show the delivery journey starting from "Ordered"
        if (isCOD && booking.getDeliveryStatus() == null) {
            booking.setDeliveryStatus("ORDERED");
            // Update tractor status to "Booked" when order is ready
            tractor.setStatus("Booked");
            tractor.setAvailable(false);
        }
        
        bookingRepository.save(booking);
        
        // Set destination for tracking purposes
        applyDestinationFromBooking(tractor, booking);
        tractorRepository.save(tractor);
        
        sendBookingApprovedEmail(booking);

        return ResponseEntity.ok(Map.of("adminStatus", "APPROVED", "message", "Booking approved"));
    }

    @PostMapping("/{bookingId}/deny")
    public ResponseEntity<?> denyBooking(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        String role = user.getRole();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        
        // Check if this is a COD booking
        boolean isCOD = booking.getPayments() != null && booking.getPayments().stream()
            .anyMatch(p -> "CASH_ON_DELIVERY".equals(p.getMethod()));
        
        // Super admin, admin, or tractor owner (for COD bookings only) can deny
        boolean isSuperAdmin = "SUPER_ADMIN".equals(role) || "ADMIN".equals(role);
        boolean isTractorOwner = "TRACTOR_OWNER".equals(role) && booking.getTractor().getOwner() != null 
            && booking.getTractor().getOwner().getId().equals(user.getId());
        
        if (!isSuperAdmin && !(isTractorOwner && isCOD)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only super admins, admins, or tractor owners (for COD bookings) can deny bookings"));
        }

        booking.setAdminStatus("DENIED");
        bookingRepository.save(booking);
        
        sendBookingDeniedEmail(booking);

        return ResponseEntity.ok(Map.of("adminStatus", "DENIED", "message", "Booking denied"));
    }

    @PostMapping("/{bookingId}/mark-paid")
    public ResponseEntity<?> markBookingPaid(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"SUPER_ADMIN".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only super admins can update payment status"));
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
        
        // IMPORTANT: Do NOT automatically set delivery status when booking is marked as paid
        // Tractor owner must manually set delivery status step by step:
        // ORDERED -> DELIVERING -> DELIVERED -> RETURNED
        // Only set destination for tracking purposes, but don't change delivery status
        tractorRepository.save(tractor);
        
        sendBookingPaidEmail(booking);

        return ResponseEntity.ok(Map.of("status", "PAID", "message", "Booking marked as paid"));
    }

    @PostMapping("/{bookingId}/mark-delivered")
    public ResponseEntity<?> markBookingDelivered(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        String role = user.getRole();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }
        
        // Super admin, admin, or tractor owner of the booked tractor can mark as delivered
        boolean isSuperAdmin = "SUPER_ADMIN".equals(role) || "ADMIN".equals(role);
        boolean isTractorOwner = "TRACTOR_OWNER".equals(role) && booking.getTractor().getOwner() != null 
            && booking.getTractor().getOwner().getId().equals(user.getId());
        
        if (!isSuperAdmin && !isTractorOwner) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only super admins or tractor owners can update delivery status"));
        }

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
        
        // For COD bookings, consider payment as received when delivery is confirmed
        // and mark the COD payment record as SUCCESS so that frontend paymentStatus shows "paid"
        if (isCOD && booking.getPayments() != null) {
            booking.getPayments().stream()
                .filter(p -> "CASH_ON_DELIVERY".equals(p.getMethod()) && !"SUCCESS".equals(p.getStatus()))
                .forEach(p -> {
                    p.setStatus("SUCCESS");
                    paymentRepository.save(p);
                });
        }
        
        bookingRepository.save(booking);

        Tractor tractor = booking.getTractor();
        
        // Store original tractor location before updating to delivery location (if not already stored)
        if (booking.getOriginalTractorLatitude() == null && tractor.getLatitude() != null) {
            booking.setOriginalTractorLatitude(tractor.getLatitude());
            booking.setOriginalTractorLongitude(tractor.getLongitude());
            booking.setOriginalTractorLocation(tractor.getLocation());
        }
        
        // Update booking delivery status (per-booking, not tractor-level)
        booking.setDeliveryStatus("DELIVERED");
        
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
        String role = user.getRole();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }
        
        // Super admin, admin, or tractor owner of the booked tractor can mark as completed
        boolean isSuperAdmin = "SUPER_ADMIN".equals(role) || "ADMIN".equals(role);
        boolean isTractorOwner = "TRACTOR_OWNER".equals(role) && booking.getTractor().getOwner() != null 
            && booking.getTractor().getOwner().getId().equals(user.getId());
        
        if (!isSuperAdmin && !isTractorOwner) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only super admins or tractor owners can mark bookings as completed"));
        }

        Tractor tractor = booking.getTractor();
        if (tractor == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor not found"));
        }

        // Check if tractor has been returned for this booking
        if (!"RETURNED".equals(booking.getDeliveryStatus())) {
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

        // For bookings with timer usage: require customer to stop timer first
        // For bookings without timer usage (customer didn't start timer): allow completion after RETURNED
        boolean hasStartedTimer = booking.getActualUsageStartTime() != null;
        if (hasStartedTimer && booking.getActualUsageStopTime() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", 
                "Cannot complete booking. Customer must stop the usage timer first."
            ));
        }

        // Calculate final price if timer was used, otherwise use initial price
        if (hasStartedTimer && booking.getFinalPrice() == null) {
            calculateFinalPrice(booking);
        } else if (!hasStartedTimer) {
            // If timer was never started, use initial price as final price
            if (booking.getFinalPrice() == null) {
                booking.setFinalPrice(booking.getInitialPrice());
                booking.setTotalAmount(booking.getInitialPrice());
                booking.setCommissionAmount(booking.getInitialPrice() * 0.15);
            }
        }

        // For COD bookings, if payment was never explicitly marked as SUCCESS earlier,
        // mark it as SUCCESS at completion time so the final payment status is "paid".
        boolean isCOD = booking.getPayments() != null && booking.getPayments().stream()
            .anyMatch(p -> "CASH_ON_DELIVERY".equals(p.getMethod()));
        if (isCOD && booking.getPayments() != null) {
            booking.getPayments().stream()
                .filter(p -> "CASH_ON_DELIVERY".equals(p.getMethod()) && !"SUCCESS".equals(p.getStatus()))
                .forEach(p -> {
                    p.setStatus("SUCCESS");
                    paymentRepository.save(p);
                });
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
        // Delivery status is per-booking, so no need to clear tractor-level status
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

    @PostMapping("/{bookingId}/start-usage")
    public ResponseEntity<?> startUsage(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }
        
        // Only the booking owner (customer) can start usage
        if (!booking.getUser().getId().equals(user.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only the booking owner can start usage"));
        }
        
        // Check if booking is delivered
        if (!"DELIVERED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor must be delivered before starting usage"));
        }
        
        // Check booking delivery status - must be DELIVERED
        Tractor tractor = booking.getTractor();
        if (tractor == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor not found"));
        }
        
        if (!"DELIVERED".equals(booking.getDeliveryStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor must be delivered to your location before you can start using it"));
        }
        
        // Prevent starting timer if tractor is already returned or booking is completed
        if ("RETURNED".equals(booking.getDeliveryStatus()) || "COMPLETED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot start usage. Tractor has been returned or booking is completed"));
        }
        
        // Check if usage is already started
        if (booking.getActualUsageStartTime() != null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usage has already been started"));
        }
        
        // Start the timer
        booking.setActualUsageStartTime(LocalDateTime.now());
        bookingRepository.save(booking);
        
        return ResponseEntity.ok(Map.of(
            "status", "USAGE_STARTED",
            "startTime", booking.getActualUsageStartTime().toString(),
            "message", "Usage timer started"
        ));
    }

    @PostMapping("/{bookingId}/stop-usage")
    public ResponseEntity<?> stopUsage(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }
        
        // Only the booking owner (customer) can stop usage
        if (!booking.getUser().getId().equals(user.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only the booking owner can stop usage"));
        }
        
        // Check if usage was started
        if (booking.getActualUsageStartTime() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usage has not been started yet"));
        }
        
        // Check if usage is already stopped
        if (booking.getActualUsageStopTime() != null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usage has already been stopped"));
        }
        
        // Stop the timer and calculate actual usage
        LocalDateTime stopTime = LocalDateTime.now();
        booking.setActualUsageStopTime(stopTime);
        
        // Calculate actual usage in minutes
        long actualUsageMinutes = java.time.Duration.between(
            booking.getActualUsageStartTime(), 
            stopTime
        ).toMinutes();
        booking.setActualUsageMinutes(actualUsageMinutes);
        
        // Calculate final price (includes refund calculation)
        calculateFinalPrice(booking);
        
        bookingRepository.save(booking);
        
        return ResponseEntity.ok(Map.of(
            "status", "USAGE_STOPPED",
            "stopTime", stopTime.toString(),
            "actualUsageMinutes", actualUsageMinutes,
            "finalPrice", booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getInitialPrice(),
            "refundAmount", booking.getRefundAmount() != null ? booking.getRefundAmount() : 0.0,
            "initialPrice", booking.getInitialPrice() != null ? booking.getInitialPrice() : 0.0,
            "message", "Usage timer stopped. Final price calculated."
        ));
    }

    @PostMapping("/{bookingId}/calculate-final-price")
    public ResponseEntity<?> calculateFinalPriceEndpoint(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }
        
        // Check authorization - booking owner, tractor owner, or admin
        String role = user.getRole();
        boolean isSuperAdmin = "SUPER_ADMIN".equals(role) || "ADMIN".equals(role);
        boolean isTractorOwner = "TRACTOR_OWNER".equals(role) && booking.getTractor().getOwner() != null 
            && booking.getTractor().getOwner().getId().equals(user.getId());
        boolean isBookingOwner = booking.getUser().getId().equals(user.getId());
        
        if (!isSuperAdmin && !isTractorOwner && !isBookingOwner) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unauthorized"));
        }
        
        // Calculate final price
        calculateFinalPrice(booking);
        bookingRepository.save(booking);
        
        return ResponseEntity.ok(Map.of(
            "initialPrice", booking.getInitialPrice() != null ? booking.getInitialPrice() : 0.0,
            "finalPrice", booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getInitialPrice(),
            "refundAmount", booking.getRefundAmount() != null ? booking.getRefundAmount() : 0.0,
            "actualUsageMinutes", booking.getActualUsageMinutes() != null ? booking.getActualUsageMinutes() : 0,
            "bookedMinutes", booking.getBookedMinutes() != null ? booking.getBookedMinutes() : 0,
            "message", "Final price calculated"
        ));
    }

    @GetMapping("/{bookingId}/usage-details")
    public ResponseEntity<?> getUsageDetails(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }
        
        // Check authorization
        String role = user.getRole();
        boolean isSuperAdmin = "SUPER_ADMIN".equals(role) || "ADMIN".equals(role);
        boolean isTractorOwner = "TRACTOR_OWNER".equals(role) && booking.getTractor().getOwner() != null 
            && booking.getTractor().getOwner().getId().equals(user.getId());
        boolean isBookingOwner = booking.getUser().getId().equals(user.getId());
        
        if (!isSuperAdmin && !isTractorOwner && !isBookingOwner) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unauthorized"));
        }
        
        // Calculate current usage if timer is running
        Long currentUsageMinutes = null;
        if (booking.getActualUsageStartTime() != null && booking.getActualUsageStopTime() == null) {
            currentUsageMinutes = java.time.Duration.between(
                booking.getActualUsageStartTime(),
                LocalDateTime.now()
            ).toMinutes();
        }
        
        // Build response map with null-safe values
        Map<String, Object> response = new HashMap<>();
        response.put("bookedMinutes", booking.getBookedMinutes() != null ? booking.getBookedMinutes() : 0);
        response.put("actualUsageMinutes", booking.getActualUsageMinutes());
        response.put("currentUsageMinutes", currentUsageMinutes);
        response.put("minimumChargeMinutes", Booking.getMinimumChargeMinutes());
        response.put("initialPrice", booking.getInitialPrice() != null ? booking.getInitialPrice() : 0.0);
        response.put("finalPrice", booking.getFinalPrice());
        response.put("startTime", booking.getActualUsageStartTime() != null ? booking.getActualUsageStartTime().toString() : null);
        response.put("stopTime", booking.getActualUsageStopTime() != null ? booking.getActualUsageStopTime().toString() : null);
        response.put("isRunning", booking.getActualUsageStartTime() != null && booking.getActualUsageStopTime() == null);
        
        return ResponseEntity.ok(response);
    }

    // Helper method to calculate final price based on actual usage
    private void calculateFinalPrice(Booking booking) {
        if (booking.getActualUsageStopTime() == null || booking.getActualUsageStartTime() == null) {
            // If usage hasn't stopped, cannot calculate final price
            return;
        }
        
        Tractor tractor = booking.getTractor();
        if (tractor == null) {
            return;
        }
        
        long actualUsageMinutes = booking.getActualUsageMinutes();
        if (actualUsageMinutes <= 0) {
            return;
        }
        
        // Apply minimum charge of 30 minutes
        long chargeableMinutes = Math.max(actualUsageMinutes, Booking.getMinimumChargeMinutes());
        
        // Calculate final price based on actual usage (minimum 30 min)
        double hours = chargeableMinutes / 60.0;
        double finalPrice = hours * tractor.getHourlyRate();
        
        booking.setFinalPrice(finalPrice);
        
        // Calculate refund if customer paid more than final price
        double initialPrice = booking.getInitialPrice() != null ? booking.getInitialPrice() : 0.0;
        if (initialPrice > finalPrice) {
            // Customer overpaid - calculate refund amount
            double refundAmount = initialPrice - finalPrice;
            booking.setRefundAmount(refundAmount);
        } else {
            // No refund needed (used more or equal to what was paid)
            booking.setRefundAmount(0.0);
        }
        
        // Update totalAmount to final price (this is what will be charged/released)
        booking.setTotalAmount(finalPrice);
        
        // Recalculate commission (15% of final price)
        booking.setCommissionAmount(finalPrice * 0.15);
    }
    
    private void sendBookingCompletedEmail(Booking booking) {
        emailService.sendBookingCompletedEmail(booking);
    }

    @PutMapping("/{bookingId}/tractor-delivery-status")
    public ResponseEntity<?> updateTractorDeliveryStatus(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> body,
            Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        String role = user.getRole();
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }
        
        // Super admin, admin, or tractor owner of the booked tractor can update delivery status
        boolean isSuperAdmin = "SUPER_ADMIN".equals(role) || "ADMIN".equals(role);
        boolean isTractorOwner = "TRACTOR_OWNER".equals(role) && booking.getTractor().getOwner() != null 
            && booking.getTractor().getOwner().getId().equals(user.getId());
        
        if (!isSuperAdmin && !isTractorOwner) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only super admins or tractor owners can update delivery status"));
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

        // Use booking-specific delivery status (not tractor-level)
        String currentStatus = booking.getDeliveryStatus();
        
        // Prevent reverting delivery status if booking is already returned
        if ("RETURNED".equals(currentStatus) && !"RETURNED".equals(deliveryStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot change status. Tractor has already been returned for this booking."));
        }
        if (currentStatus != null && !currentStatus.isEmpty()) {
            // Define valid status transitions
            boolean isValidTransition = false;
            switch (currentStatus) {
                case "ORDERED":
                    // Can only go to DELIVERING
                    isValidTransition = "DELIVERING".equals(deliveryStatus);
                    break;
                case "DELIVERING":
                    // Can only go to DELIVERED
                    isValidTransition = "DELIVERED".equals(deliveryStatus);
                    break;
                case "DELIVERED":
                    // Can only go to RETURNED
                    isValidTransition = "RETURNED".equals(deliveryStatus);
                    break;
                case "RETURNED":
                    // Cannot change from RETURNED (already handled above)
                    isValidTransition = false;
                    break;
                default:
                    // If status is null or unknown, allow setting to ORDERED (first step)
                    isValidTransition = "ORDERED".equals(deliveryStatus);
                    break;
            }
            
            if (!isValidTransition) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", 
                    String.format("Invalid status transition. Current status: %s. Valid next status: %s", 
                        currentStatus,
                        getNextValidStatus(currentStatus))
                ));
            }
        }

        // Update booking-specific delivery status (not tractor-level)
        String previousStatus = booking.getDeliveryStatus();
        booking.setDeliveryStatus(deliveryStatus);
        
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
                break;
            case "RETURNED":
                // Allow marking as returned even before booking end time (for testing purposes)
                // In production, you may want to add a check here:
                // java.time.LocalDateTime now = java.time.LocalDateTime.now();
                // if (booking.getEndAt().isAfter(now)) {
                //     return ResponseEntity.badRequest().body(Map.of(
                //         "error",
                //         "Cannot mark tractor as returned before booking end time. Booking ends at: " + booking.getEndAt()
                //     ));
                // }

                // Quantity is restored when tractor is returned (available for other bookings)
                // Restore tractor to original location only if no other active bookings
                LocalDateTime now = LocalDateTime.now();
                long otherActiveBookings = bookingRepository.findAll().stream()
                    .filter(b -> b.getTractor().getId().equals(tractor.getId()))
                    .filter(b -> !b.getId().equals(bookingId))
                    .filter(b -> {
                        String adminStatus = b.getAdminStatus();
                        boolean isApproved = adminStatus == null || "APPROVED".equals(adminStatus);
                        String status = b.getStatus();
                        boolean isActive = "PENDING".equals(status) || "PAID".equals(status) || 
                                          "DELIVERED".equals(status) || "CONFIRMED".equals(status);
                        boolean notReturned = b.getDeliveryStatus() == null || 
                                             !"RETURNED".equals(b.getDeliveryStatus());
                        boolean notCompleted = !"COMPLETED".equals(status) && !"CANCELLED".equals(status);
                        return isApproved && isActive && notReturned && notCompleted && b.getEndAt().isAfter(now);
                    })
                    .count();
                
                // Only reset location if no other active bookings
                if (otherActiveBookings == 0 && booking.getOriginalTractorLatitude() != null && booking.getOriginalTractorLongitude() != null) {
                    tractor.setLatitude(booking.getOriginalTractorLatitude());
                    tractor.setLongitude(booking.getOriginalTractorLongitude());
                    tractor.setLocationUpdatedAt(LocalDateTime.now());
                    if (booking.getOriginalTractorLocation() != null) {
                        tractor.setLocation(booking.getOriginalTractorLocation());
                    }
                }
                
                // NOTE: Do NOT automatically mark booking as COMPLETED when tractor is returned
                // Booking completion must be done manually via mark-completed endpoint
                // This ensures proper flow: customer stops timer -> owner marks as completed
                // The booking status remains DELIVERED until owner explicitly marks it as COMPLETED
                break;
        }
        
        // IMPORTANT: Save booking after updating deliveryStatus for ALL cases
        // This ensures deliveryStatus changes are persisted to database
        bookingRepository.save(booking);
        tractorRepository.save(tractor);

        // Send email notification for delivery status change
        emailService.sendDeliveryStatusChangeEmail(booking, previousStatus != null ? previousStatus : "null", deliveryStatus);

        return ResponseEntity.ok(Map.of(
            "deliveryStatus", deliveryStatus,
            "tractorStatus", tractor.getStatus(),
            "message", "Tractor delivery status updated from " + (previousStatus != null ? previousStatus : "null") + " to " + deliveryStatus
        ));
    }

    // Helper method to get the next valid status in the flow
    private String getNextValidStatus(String currentStatus) {
        if (currentStatus == null || currentStatus.isEmpty()) {
            return "ORDERED";
        }
        switch (currentStatus) {
            case "ORDERED":
                return "DELIVERING";
            case "DELIVERING":
                return "DELIVERED";
            case "DELIVERED":
                return "RETURNED";
            case "RETURNED":
                return "N/A (already returned)";
            default:
                return "ORDERED";
        }
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
        java.time.Duration duration = java.time.Duration.between(booking.getStartAt(), booking.getEndAt());
        long totalMinutes = duration.toMinutes();
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;
        
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
        if (hours > 0 && minutes > 0) {
            details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(hours).append(" hour").append(hours != 1 ? "s" : "").append(" ").append(minutes).append(" minute").append(minutes != 1 ? "s" : "").append("</td></tr>");
        } else if (hours > 0) {
            details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(hours).append(" hour").append(hours != 1 ? "s" : "").append("</td></tr>");
        } else {
            details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(minutes).append(" minute").append(minutes != 1 ? "s" : "").append("</td></tr>");
        }
        
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
        emailService.sendBookingCreatedEmail(booking);
    }
    
    private void sendBookingApprovedEmail(Booking booking) {
        emailService.sendBookingApprovedEmail(booking);
    }
    
    private void sendBookingDeniedEmail(Booking booking) {
        emailService.sendBookingDeniedEmail(booking);
    }
    
    private void sendBookingPaidEmail(Booking booking) {
        emailService.sendBookingPaidEmail(booking);
    }
    
    private void sendBookingDeliveredEmail(Booking booking) {
        emailService.sendBookingDeliveredEmail(booking);
    }
    
    private void sendBookingCancelledEmail(Booking booking) {
        emailService.sendBookingCancelledEmail(booking);
    }
    
    private void sendRefundRequestedEmail(Booking booking) {
        emailService.sendRefundRequestedEmail(booking);
    }
    
    private void sendRefundApprovedEmail(Booking booking, double refundAmount, double fee) {
        emailService.sendRefundApprovedEmail(booking, refundAmount, fee);
    }
    
    private void sendRefundRejectedEmail(Booking booking) {
        emailService.sendRefundRejectedEmail(booking);
    }

    @PostMapping("/{bookingId}/release-payment")
    public ResponseEntity<?> releasePayment(@PathVariable Long bookingId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElseThrow();
        if (!"SUPER_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can release payments"));
        }

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }

        // Only release payment for completed bookings
        if (!"COMPLETED".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Payment can only be released for completed bookings"));
        }

        // Check if payment already released
        if (Boolean.TRUE.equals(booking.getPaymentReleased())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Payment has already been released for this booking"));
        }

        // Calculate amounts based on final price (not initial price)
        // Use finalPrice if available, otherwise fall back to totalAmount
        double finalPrice = booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getTotalAmount();
        double commissionAmount = booking.getCommissionAmount() != null ? booking.getCommissionAmount() : finalPrice * 0.15;
        double ownerAmount = finalPrice - commissionAmount;
        double refundAmount = booking.getRefundAmount() != null ? booking.getRefundAmount() : 0.0;

        // Mark payment as released
        booking.setPaymentReleased(true);
        bookingRepository.save(booking);

        // Send payment release email to tractor owner
        emailService.sendPaymentReleaseEmail(booking, commissionAmount, ownerAmount);

        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "message", "Payment released successfully",
            "totalAmount", finalPrice,
            "initialAmount", booking.getInitialPrice() != null ? booking.getInitialPrice() : finalPrice,
            "finalAmount", finalPrice,
            "refundAmount", refundAmount,
            "commissionAmount", commissionAmount,
            "ownerAmount", ownerAmount,
            "tractorOwner", booking.getTractor().getOwner() != null ? booking.getTractor().getOwner().getName() : "N/A"
        ));
    }
}


