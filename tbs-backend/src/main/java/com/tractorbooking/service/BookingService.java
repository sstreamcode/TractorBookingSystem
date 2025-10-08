package com.tractorbooking.service;

import com.tractorbooking.model.*;
import com.tractorbooking.repository.BookingRepository;
import com.tractorbooking.repository.TractorRepository;
import com.tractorbooking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BookingService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private TractorRepository tractorRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public Booking createBooking(Booking booking) {
        // Validate tractor availability
        User user = userRepository.findById(booking.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Tractor tractor = tractorRepository.findById(booking.getTractor().getId())
                .orElseThrow(() -> new RuntimeException("Tractor not found"));
        
        if (!tractor.getAvailability()) {
            throw new RuntimeException("Tractor is not available");
        }
        
        // Check for conflicting bookings
        List<Booking> conflictingBookings = bookingRepository.findConflictingBookings(
                tractor.getId(), booking.getStartDate(), booking.getEndDate());
        
        if (!conflictingBookings.isEmpty()) {
            throw new RuntimeException("Tractor is already booked for the selected time period");
        }
        
        // Calculate total amount
        long hours = booking.getDurationInHours();
        BigDecimal totalAmount = tractor.getHourlyRate().multiply(BigDecimal.valueOf(hours));
        booking.setTotalAmount(totalAmount);
        
        booking.setUser(user);
        booking.setTractor(tractor);
        booking.setStatus(BookingStatus.PENDING);
        booking.setPaymentStatus(PaymentStatus.PENDING);
        
        return bookingRepository.save(booking);
    }
    
    public List<Booking> getAllBookings() {
        return bookingRepository.findAllOrderByCreatedAtDesc();
    }
    
    public List<Booking> getBookingsByUser(User user) {
        return bookingRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    public List<Booking> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }
    
    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }
    
    public Booking updateBookingStatus(Long id, BookingStatus status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus(status);
        return bookingRepository.save(booking);
    }
    
    public Booking updatePaymentStatus(Long id, PaymentStatus paymentStatus) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setPaymentStatus(paymentStatus);
        return bookingRepository.save(booking);
    }
    
    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        bookingRepository.delete(booking);
    }
    
    public long getTotalApprovedBookings() {
        return bookingRepository.countApprovedBookings();
    }
    
    public BigDecimal getTotalRevenue() {
        BigDecimal revenue = bookingRepository.getTotalRevenue();
        return revenue != null ? revenue : BigDecimal.ZERO;
    }
}
