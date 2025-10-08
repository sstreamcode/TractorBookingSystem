package com.tractorbooking.service;

import com.tractorbooking.model.*;
import com.tractorbooking.repository.PaymentRepository;
import com.tractorbooking.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    public Payment createPayment(Payment payment) {
        return paymentRepository.save(payment);
    }
    
    public Payment updatePaymentStatus(Long paymentId, PaymentStatus status) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        payment.setStatus(status);
        return paymentRepository.save(payment);
    }
    
    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }
    
    public Optional<Payment> getPaymentByTransactionId(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId);
    }
    
    public Optional<Payment> getPaymentByEsewaReferenceId(String esewaReferenceId) {
        return paymentRepository.findByEsewaReferenceId(esewaReferenceId);
    }
    
    public List<Payment> getPaymentsByStatus(PaymentStatus status) {
        return paymentRepository.findByStatus(status);
    }
    
    public Payment createPaymentForBooking(Booking booking, BigDecimal amount, String transactionId) {
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(amount);
        payment.setPaymentMethod(PaymentMethod.ESEWA);
        payment.setTransactionId(transactionId);
        payment.setStatus(PaymentStatus.PENDING);
        
        return paymentRepository.save(payment);
    }
    
    public Payment updateEsewaPayment(String transactionId, String esewaReferenceId, 
                                     String responseCode, String responseMessage) {
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        payment.setEsewaReferenceId(esewaReferenceId);
        payment.setEsewaResponseCode(responseCode);
        payment.setEsewaResponseMessage(responseMessage);
        
        // Update payment status based on response code
        if ("00".equals(responseCode)) {
            payment.setStatus(PaymentStatus.PAID);
            
            // Update booking payment status
            Booking booking = payment.getBooking();
            booking.setPaymentStatus(PaymentStatus.PAID);
            bookingRepository.save(booking);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            
            // Update booking payment status
            Booking booking = payment.getBooking();
            booking.setPaymentStatus(PaymentStatus.FAILED);
            bookingRepository.save(booking);
        }
        
        return paymentRepository.save(payment);
    }
}
