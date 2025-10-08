package com.tractorbooking.controller;

import com.tractorbooking.dto.PaymentVerificationRequest;
import com.tractorbooking.model.Booking;
import com.tractorbooking.model.Payment;
import com.tractorbooking.service.BookingService;
import com.tractorbooking.service.EsewaService;
import com.tractorbooking.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private BookingService bookingService;
    
    @Autowired
    private EsewaService esewaService;
    
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody PaymentVerificationRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Verify payment with eSewa
            BigDecimal amount = new BigDecimal(request.getAmount());
            boolean isVerified = esewaService.verifyPayment(
                request.getTransactionId(), 
                request.getReferenceId(), 
                amount
            );
            
            if (isVerified) {
                // Update payment status
                paymentService.updateEsewaPayment(
                    request.getTransactionId(),
                    request.getReferenceId(),
                    "00", // Success code
                    "Payment successful"
                );
                
                response.put("success", true);
                response.put("message", "Payment verified successfully");
            } else {
                // Update payment status as failed
                paymentService.updateEsewaPayment(
                    request.getTransactionId(),
                    request.getReferenceId(),
                    "01", // Failure code
                    "Payment verification failed"
                );
                
                response.put("success", false);
                response.put("message", "Payment verification failed");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error verifying payment: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/create/{bookingId}")
    public ResponseEntity<Map<String, Object>> createPayment(@PathVariable Long bookingId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Booking booking = bookingService.getBookingById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            
            // Create payment record
            Payment payment = paymentService.createPaymentForBooking(
                booking, 
                booking.getTotalAmount(), 
                "TXN" + System.currentTimeMillis()
            );
            
            // Generate eSewa payment URL
            String paymentUrl = esewaService.generatePaymentUrl(booking);
            
            response.put("success", true);
            response.put("paymentUrl", paymentUrl);
            response.put("transactionId", payment.getTransactionId());
            response.put("amount", booking.getTotalAmount());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error creating payment: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
