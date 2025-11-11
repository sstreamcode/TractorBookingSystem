package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Booking;
import com.example.demo.model.Payment;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.PaymentRepository;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    public PaymentController(PaymentRepository paymentRepository, BookingRepository bookingRepository) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
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

        booking.setStatus("PAID");
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of("status", "VERIFIED", "refId", refId));
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


