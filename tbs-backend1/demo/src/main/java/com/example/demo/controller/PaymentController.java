package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Booking;
import com.example.demo.model.Payment;
import com.example.demo.model.Tractor;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.PaymentRepository;
import com.example.demo.repository.TractorRepository;
import com.example.demo.util.EmailService;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api/payments")
public class PaymentController {
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final TractorRepository tractorRepository;
    private final EmailService emailService;

    public PaymentController(
            PaymentRepository paymentRepository, 
            BookingRepository bookingRepository,
            TractorRepository tractorRepository,
            EmailService emailService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.tractorRepository = tractorRepository;
        this.emailService = emailService;
    }

    // eSewa sandbox verify stub: in real flow verify reference id with eSewa server
    @PostMapping("/verify-esewa")
    public ResponseEntity<?> verifyEsewa(@RequestBody Map<String, String> body) {
        Long bookingId = Long.valueOf(body.get("bookingId"));
        String refId = body.get("refId");

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));

        // Assume success for sandbox demo
        Payment p = new Payment();
        p.setBooking(booking);
        p.setAmount(booking.getTotalAmount());
        p.setMethod("ESEWA");
        p.setStatus("SUCCESS");
        p.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(p);

        // Set booking status to PAID
        booking.setStatus("PAID");
        
        // Auto-approve booking when eSewa payment is verified
        booking.setAdminStatus("APPROVED");
        
        // Set delivery status to ORDERED
        Tractor tractor = booking.getTractor();
        if (tractor != null) {
            if (tractor.getDeliveryStatus() == null || tractor.getDeliveryStatus().isEmpty()) {
                tractor.setDeliveryStatus("ORDERED");
            }
            // Apply destination from booking
            if (booking.getDeliveryLatitude() != null && booking.getDeliveryLongitude() != null) {
                tractor.setDestinationLatitude(booking.getDeliveryLatitude());
                tractor.setDestinationLongitude(booking.getDeliveryLongitude());
                tractor.setDestinationAddress(booking.getDeliveryAddress());
            }
            tractorRepository.save(tractor);
        }
        
        bookingRepository.save(booking);

        // Send payment confirmation email
        try {
            sendPaymentConfirmedEmail(booking);
        } catch (Exception e) {
            logger.error("Failed to send payment confirmation email", e);
        }

        return ResponseEntity.ok(Map.of("status", "VERIFIED", "refId", refId));
    }
    
    private void sendPaymentConfirmedEmail(Booking booking) {
        emailService.sendBookingPaidEmail(booking);
    }
    
    private String formatBookingDetails(Booking booking) {
        StringBuilder details = new StringBuilder();
        details.append("<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>");
        details.append("<h3 style='margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;'>Booking Details</h3>");
        details.append("<table style='width: 100%%; border-collapse: collapse;'>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Booking ID:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>#").append(booking.getId()).append("</td></tr>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Tractor:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(booking.getTractor().getName()).append("</td></tr>");
        
        long hours = java.time.Duration.between(booking.getStartAt(), booking.getEndAt()).toHours();
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

    @PostMapping("/cash-on-delivery")
    public ResponseEntity<?> cashOnDelivery(@RequestBody Map<String, String> body) {
        Long bookingId = Long.valueOf(body.get("bookingId"));

        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));

        Payment p = new Payment();
        p.setBooking(booking);
        p.setAmount(booking.getTotalAmount());
        p.setMethod("CASH_ON_DELIVERY");
        p.setStatus("PENDING");
        p.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(p);

        booking.setStatus("PENDING");
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of("status", "CONFIRMED", "method", "CASH_ON_DELIVERY"));
    }
}


