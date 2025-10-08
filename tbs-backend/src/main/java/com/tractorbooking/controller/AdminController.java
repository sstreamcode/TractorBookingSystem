package com.tractorbooking.controller;

import com.tractorbooking.dto.AdminSummaryResponse;
import com.tractorbooking.model.Booking;
import com.tractorbooking.model.User;
import com.tractorbooking.service.BookingService;
import com.tractorbooking.service.UserService;
import com.tractorbooking.service.TractorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private TractorService tractorService;
    
    @Autowired
    private BookingService bookingService;
    
    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminSummaryResponse> getAdminSummary() {
        try {
            long totalUsers = userService.getAllUsers().size();
            long totalTractors = tractorService.getAllTractors().size();
            long totalBookings = bookingService.getAllBookings().size();
            long activeBookings = bookingService.getTotalApprovedBookings();
            
            AdminSummaryResponse summary = new AdminSummaryResponse(
                totalUsers,
                totalTractors,
                activeBookings,
                totalBookings,
                bookingService.getTotalRevenue()
            );
            
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Booking>> getAllBookings() {
        List<Booking> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(bookings);
    }
}
