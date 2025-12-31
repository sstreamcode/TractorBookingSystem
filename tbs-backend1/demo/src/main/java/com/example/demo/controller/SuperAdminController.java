package com.example.demo.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.User;
import com.example.demo.model.Tractor;
import com.example.demo.model.Booking;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.TractorRepository;
import com.example.demo.repository.BookingRepository;
import com.example.demo.util.EmailService;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api/super-admin")
public class SuperAdminController {
    private final UserRepository userRepository;
    private final TractorRepository tractorRepository;
    private final BookingRepository bookingRepository;
    private final EmailService emailService;

    public SuperAdminController(UserRepository userRepository, TractorRepository tractorRepository, BookingRepository bookingRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.tractorRepository = tractorRepository;
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
    }

    private boolean isSuperAdmin(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return false;
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        return user != null && "SUPER_ADMIN".equals(user.getRole());
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(Principal principal) {
        if (!isSuperAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can view all users"));
        }
        List<User> users = userRepository.findAll();
        // Remove sensitive information
        List<Map<String, Object>> userList = users.stream()
            .map(u -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", u.getId());
                userMap.put("name", u.getName() != null ? u.getName() : "");
                userMap.put("email", u.getEmail());
                userMap.put("role", u.getRole());
                userMap.put("profilePictureUrl", u.getProfilePictureUrl() != null ? u.getProfilePictureUrl() : "");
                return userMap;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(userList);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Long userId, Principal principal) {
        if (!isSuperAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can view user details"));
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName() != null ? user.getName() : "");
        userMap.put("email", user.getEmail());
        userMap.put("role", user.getRole());
        userMap.put("phone", user.getPhone() != null ? user.getPhone() : "");
        userMap.put("address", user.getAddress() != null ? user.getAddress() : "");
        userMap.put("profilePictureUrl", user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : "");
        userMap.put("tractorOwnerApproved", user.getTractorOwnerApproved());
        return ResponseEntity.ok(userMap);
    }

    @GetMapping("/tractor-owners")
    public ResponseEntity<?> getAllTractorOwners(Principal principal) {
        if (!isSuperAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can view all tractor owners"));
        }
        List<User> owners = userRepository.findAll().stream()
            .filter(u -> "TRACTOR_OWNER".equals(u.getRole()))
            .collect(Collectors.toList());
        
        List<Map<String, Object>> ownerList = owners.stream()
            .map(o -> {
                long tractorCount = tractorRepository.findByOwner(o).size();
                Map<String, Object> ownerMap = new HashMap<>();
                ownerMap.put("id", o.getId());
                ownerMap.put("name", o.getName() != null ? o.getName() : "");
                ownerMap.put("email", o.getEmail());
                ownerMap.put("tractorCount", tractorCount);
                ownerMap.put("phone", o.getPhone() != null ? o.getPhone() : "");
                ownerMap.put("address", o.getAddress() != null ? o.getAddress() : "");
                ownerMap.put("approved", o.getTractorOwnerApproved());
                ownerMap.put("profilePictureUrl", o.getProfilePictureUrl() != null ? o.getProfilePictureUrl() : "");
                return ownerMap;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(ownerList);
    }

    @GetMapping("/tractors")
    public ResponseEntity<?> getAllTractors(Principal principal) {
        if (!isSuperAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can view all tractors"));
        }
        List<Tractor> tractors = tractorRepository.findAll();
        // Include owner information in response
        List<Map<String, Object>> tractorList = tractors.stream()
            .map(t -> {
                Map<String, Object> tractorMap = new HashMap<>();
                tractorMap.put("id", t.getId());
                tractorMap.put("name", t.getName());
                tractorMap.put("model", t.getModel());
                tractorMap.put("hourlyRate", t.getHourlyRate());
                tractorMap.put("available", t.getAvailable());
                tractorMap.put("imageUrl", t.getImageUrl());
                tractorMap.put("imageUrls", t.getImageUrls());
                tractorMap.put("description", t.getDescription());
                tractorMap.put("location", t.getLocation());
                tractorMap.put("latitude", t.getLatitude());
                tractorMap.put("longitude", t.getLongitude());
                tractorMap.put("approvalStatus", t.getApprovalStatus());
                if (t.getOwner() != null) {
                    Map<String, Object> ownerMap = new HashMap<>();
                    ownerMap.put("id", t.getOwner().getId());
                    ownerMap.put("name", t.getOwner().getName());
                    ownerMap.put("email", t.getOwner().getEmail());
                    tractorMap.put("owner", ownerMap);
                } else {
                    tractorMap.put("owner", null);
                }
                return tractorMap;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(tractorList);
    }

    @GetMapping("/bookings")
    public ResponseEntity<?> getAllBookings(Principal principal) {
        if (!isSuperAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can view all bookings"));
        }
        List<Booking> bookings = bookingRepository.findAll();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Principal principal) {
        if (!isSuperAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can view stats"));
        }
        
        long totalUsers = userRepository.count();
        long totalCustomers = userRepository.findAll().stream()
            .filter(u -> "USER".equals(u.getRole()))
            .count();
        long totalTractorOwners = userRepository.findAll().stream()
            .filter(u -> "TRACTOR_OWNER".equals(u.getRole()))
            .count();
        long totalTractors = tractorRepository.count();
        long approvedTractors = tractorRepository.findAll().stream()
            .filter(t -> "APPROVED".equals(t.getApprovalStatus()))
            .count();
        long pendingTractors = tractorRepository.findAll().stream()
            .filter(t -> "PENDING".equals(t.getApprovalStatus()))
            .count();
        long totalBookings = bookingRepository.count();
        long completedBookings = bookingRepository.findAll().stream()
            .filter(b -> "COMPLETED".equals(b.getStatus()))
            .count();
        
        double totalRevenue = bookingRepository.findAll().stream()
            .filter(b -> "COMPLETED".equals(b.getStatus()))
            .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
            .sum();
        
        double totalCommission = bookingRepository.findAll().stream()
            .filter(b -> "COMPLETED".equals(b.getStatus()))
            .mapToDouble(b -> b.getCommissionAmount() != null ? b.getCommissionAmount() : 0.0)
            .sum();
        
        return ResponseEntity.ok(Map.of(
            "totalUsers", totalUsers,
            "totalCustomers", totalCustomers,
            "totalTractorOwners", totalTractorOwners,
            "totalTractors", totalTractors,
            "approvedTractors", approvedTractors,
            "pendingTractors", pendingTractors,
            "totalBookings", totalBookings,
            "completedBookings", completedBookings,
            "totalRevenue", totalRevenue,
            "totalCommission", totalCommission
        ));
    }

    @GetMapping("/tractor-owners/{ownerId}/tractors")
    public ResponseEntity<?> getTractorsByOwner(@PathVariable Long ownerId, Principal principal) {
        if (!isSuperAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can view tractors by owner"));
        }
        User owner = userRepository.findById(ownerId).orElse(null);
        if (owner == null || !"TRACTOR_OWNER".equals(owner.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor owner not found"));
        }
        List<Tractor> tractors = tractorRepository.findByOwner(owner);
        return ResponseEntity.ok(tractors);
    }

    @PostMapping("/tractor-owners/{ownerId}/approve")
    public ResponseEntity<?> approveTractorOwner(@PathVariable Long ownerId, Principal principal) {
        if (!isSuperAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can approve tractor owners"));
        }
        User owner = userRepository.findById(ownerId).orElse(null);
        if (owner == null || !"TRACTOR_OWNER".equals(owner.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor owner not found"));
        }
        owner.setTractorOwnerApproved(true);
        userRepository.save(owner);
        
        // Send approval email notification
        sendTractorOwnerApprovalEmail(owner);
        
        return ResponseEntity.ok(Map.of("status", "APPROVED", "message", "Tractor owner approved successfully"));
    }
    
    private void sendTractorOwnerApprovalEmail(User owner) {
        try {
            String subject = "Tractor Owner Account Approved - Tractor Sewa";
            String message = "Great news! Your tractor owner account has been approved by our super admin. " +
                           "You can now log in to the platform and start listing your tractors. " +
                           "Welcome to Tractor Sewa!";
            
            String htmlContent = emailService.buildEmailTemplate(
                owner.getName() != null ? owner.getName() : "Tractor Owner",
                "Account Approved",
                message,
                "APPROVED",
                "<div style='margin: 20px 0; padding: 20px; background-color: #d1fae5; border-radius: 8px;'>" +
                "<p style='margin: 0 0 10px 0; color: #065f46; font-size: 15px; line-height: 1.7;'><strong>Next Steps:</strong></p>" +
                "<ul style='margin: 0; padding-left: 20px; color: #065f46; font-size: 15px; line-height: 1.7;'>" +
                "<li>Log in to your account</li>" +
                "<li>Add your tractors to the platform</li>" +
                "<li>Start receiving booking requests</li>" +
                "</ul>" +
                "</div>"
            );
            
            emailService.sendBookingNotification(owner.getEmail(), owner.getName() != null ? owner.getName() : "Tractor Owner", subject, htmlContent);
        } catch (Exception e) {
            // Log error but don't fail the approval
            System.err.println("Failed to send approval email: " + e.getMessage());
        }
    }

    @PostMapping("/tractor-owners/{ownerId}/reject")
    public ResponseEntity<?> rejectTractorOwner(@PathVariable Long ownerId, Principal principal) {
        if (!isSuperAdmin(principal)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can reject tractor owners"));
        }
        User owner = userRepository.findById(ownerId).orElse(null);
        if (owner == null || !"TRACTOR_OWNER".equals(owner.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tractor owner not found"));
        }
        owner.setTractorOwnerApproved(false);
        userRepository.save(owner);
        return ResponseEntity.ok(Map.of("status", "REJECTED", "message", "Tractor owner rejected"));
    }
}
