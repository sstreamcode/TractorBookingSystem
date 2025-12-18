package com.example.demo.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.AuthService;
import com.example.demo.util.EmailService;

import java.util.Map;
import io.jsonwebtoken.Claims;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public AuthController(AuthService authService, JwtUtil jwtUtil, UserRepository userRepository, EmailService emailService) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String roleInput = body.getOrDefault("role", "customer");
        String phone = body.get("phone");
        String address = body.get("address");

        // Map frontend roles to backend roles
        String role;
        if ("tractor_owner".equalsIgnoreCase(roleInput)) {
            role = "TRACTOR_OWNER";
        } else {
            role = "USER";
        }

        User user = authService.register(email, password, role);

        // Set additional profile fields
        if (name != null && !name.isBlank()) {
            user.setName(name);
        }
        if (phone != null && !phone.isBlank()) {
            user.setPhone(phone);
        }
        if (address != null && !address.isBlank()) {
            user.setAddress(address);
        }

        // Tractor owners must be approved by super admin before they can manage tractors
        if ("TRACTOR_OWNER".equals(role)) {
            user.setTractorOwnerApproved(false);
            userRepository.save(user);
            // Send registration confirmation email with pending approval notice
            sendTractorOwnerRegistrationEmail(user);
            // Don't return token - they can't login until approved
            return ResponseEntity.status(201).body(Map.of(
                "message", "Registration successful! Your tractor owner account is pending approval by the super admin. You will receive an email notification once approved.",
                "pendingApproval", true
            ));
        }

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return ResponseEntity.ok(Map.of("token", token));
    }
    
    private void sendTractorOwnerRegistrationEmail(User user) {
        try {
            String subject = "Tractor Owner Registration Received - Tractor Sewa";
            String message = "Thank you for registering as a tractor owner on Tractor Sewa! " +
                           "Your registration request has been received and is currently pending approval by our super admin. " +
                           "You will receive an email notification once your account has been approved. " +
                           "Until then, you will not be able to log in to the platform. " +
                           "We appreciate your patience during the review process.";
            
            String htmlContent = emailService.buildEmailTemplate(
                user.getName() != null ? user.getName() : "Tractor Owner",
                "Registration Received",
                message,
                "PENDING_APPROVAL",
                "<div style='margin: 20px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;'>" +
                "<p style='margin: 0 0 10px 0; color: #4b5563; font-size: 15px; line-height: 1.7;'><strong>What happens next?</strong></p>" +
                "<ul style='margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.7;'>" +
                "<li>Our super admin will review your registration details</li>" +
                "<li>You will receive an email notification once approved</li>" +
                "<li>After approval, you can log in and start listing your tractors</li>" +
                "</ul>" +
                "</div>"
            );
            
            emailService.sendBookingNotification(user.getEmail(), user.getName() != null ? user.getName() : "Tractor Owner", subject, htmlContent);
        } catch (Exception e) {
            // Log error but don't fail the registration
            System.err.println("Failed to send registration email: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        
        return authService.authenticate(email, password)
            .map(u -> {
                // Check if user is a tractor owner and not approved
                if ("TRACTOR_OWNER".equals(u.getRole()) && !Boolean.TRUE.equals(u.getTractorOwnerApproved())) {
                    // Send email notification
                    sendTractorOwnerPendingApprovalEmail(u);
                    return ResponseEntity.status(403).body(Map.of(
                        "error", "Your tractor owner account is pending approval by the super admin. Please wait for approval before logging in.",
                        "pendingApproval", true
                    ));
                }
                return ResponseEntity.ok(Map.of("token", jwtUtil.generateToken(u.getEmail(), u.getRole())));
            })
            .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }
    
    private void sendTractorOwnerPendingApprovalEmail(User user) {
        try {
            String subject = "Tractor Owner Account Pending Approval - Tractor Sewa";
            String message = "Your tractor owner registration request is currently pending approval by our super admin. " +
                           "You will receive an email notification once your account has been approved. " +
                           "Until then, you will not be able to log in to the platform. " +
                           "Thank you for your patience!";
            
            String htmlContent = emailService.buildEmailTemplate(
                user.getName() != null ? user.getName() : "Tractor Owner",
                "Account Pending Approval",
                message,
                "PENDING_APPROVAL",
                "<p style='margin: 20px 0; color: #4b5563; font-size: 15px; line-height: 1.7;'>" +
                "We have received your registration request and it is currently under review. " +
                "Our team will verify your details and notify you via email once the approval process is complete." +
                "</p>"
            );
            
            emailService.sendBookingNotification(user.getEmail(), user.getName() != null ? user.getName() : "Tractor Owner", subject, htmlContent);
        } catch (Exception e) {
            // Log error but don't fail the login attempt
            System.err.println("Failed to send pending approval email: " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@org.springframework.web.bind.annotation.RequestHeader HttpHeaders headers) {
        String header = headers.getFirst(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Missing token"));
        }
        try {
            String token = header.substring(7);
            Claims claims = jwtUtil.parseClaims(token);
            String email = claims.getSubject();
            String role = claims.get("role", String.class);
            
            // Fetch full user data from database
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                return ResponseEntity.ok(Map.of(
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "name", user.getName() != null ? user.getName() : "",
                    "phone", user.getPhone() != null ? user.getPhone() : "",
                    "address", user.getAddress() != null ? user.getAddress() : "",
                    "tractorOwnerApproved", user.getTractorOwnerApproved(),
                    "profilePictureUrl", user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : ""
                ));
            } else {
                // Fallback if user not found in database
                return ResponseEntity.ok(Map.of(
                    "email", email,
                    "role", role,
                    "name", "",
                    "profilePictureUrl", ""
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Principal principal, @RequestBody Map<String, String> body) {
        try {
            User user = userRepository.findByEmail(principal.getName()).orElseThrow();
            String name = body.get("name");
            String profilePictureUrl = body.get("profilePictureUrl");
            String phone = body.get("phone");
            String address = body.get("address");
            
            if (name != null && !name.isBlank()) {
                user.setName(name);
            }
            if (profilePictureUrl != null && !profilePictureUrl.isBlank()) {
                user.setProfilePictureUrl(profilePictureUrl);
            }
            if (phone != null) {
                user.setPhone(phone.isBlank() ? null : phone);
            }
            if (address != null) {
                user.setAddress(address.isBlank() ? null : address);
            }
            
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                "message", "Profile updated", 
                "user", Map.of(
                    "name", user.getName(), 
                    "email", user.getEmail(), 
                    "role", user.getRole(),
                    "phone", user.getPhone() != null ? user.getPhone() : "",
                    "address", user.getAddress() != null ? user.getAddress() : "",
                    "profilePictureUrl", user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : ""
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", "Failed to update profile"));
        }
    }
}


