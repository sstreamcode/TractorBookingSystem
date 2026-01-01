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
import com.example.demo.service.PasswordResetService;
import com.example.demo.util.EmailService;
import com.example.demo.util.HashUtil;

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
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, JwtUtil jwtUtil, UserRepository userRepository, EmailService emailService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String roleInput = body.getOrDefault("role", "customer");
        String phone = body.get("phone");
        String address = body.get("address");
        String citizenshipImageUrl = body.get("citizenshipImageUrl");

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
        if (citizenshipImageUrl != null && !citizenshipImageUrl.isBlank()) {
            user.setCitizenshipImageUrl(citizenshipImageUrl);
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

        // Send customer registration email
        emailService.sendCustomerRegistrationEmail(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return ResponseEntity.ok(Map.of("token", token));
    }
    
    private void sendTractorOwnerRegistrationEmail(User user) {
        emailService.sendTractorOwnerRegistrationEmail(user);
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
        emailService.sendTractorOwnerRegistrationEmail(user);
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
    
    // ========== PASSWORD RESET ENDPOINTS ==========
    
    @PostMapping("/forgot-password")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        
        // Check if user exists
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Don't reveal if email exists or not for security
            return ResponseEntity.ok(Map.of(
                "message", "If the email exists, a password reset code has been sent."
            ));
        }
        
        // Generate and send reset code
        String resetCode = passwordResetService.generateResetCode(email);
        emailService.sendPasswordResetCodeEmail(email, resetCode);
        
        return ResponseEntity.ok(Map.of(
            "message", "Password reset code has been sent to your email. Please check your inbox."
        ));
    }
    
    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyResetCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        
        if (email == null || email.isBlank() || code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and code are required"));
        }
        
        boolean isValid = passwordResetService.verifyCode(email, code);
        
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "message", "Code verified successfully",
                "verified", true
            ));
        } else {
            return ResponseEntity.status(400).body(Map.of(
                "error", "Invalid or expired code",
                "verified", false
            ));
        }
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        String newPassword = body.get("newPassword");
        
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Verification code is required"));
        }
        
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password is required"));
        }
        
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters long"));
        }
        
        // Verify code first
        if (!passwordResetService.verifyCode(email, code)) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid or expired verification code"));
        }
        
        // Find user and update password
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        
        // Hash and update password
        user.setPasswordHash(HashUtil.sha256(newPassword));
        userRepository.save(user);
        
        // Remove the used reset code
        passwordResetService.removeCode(email);
        
        return ResponseEntity.ok(Map.of(
            "message", "Password has been reset successfully. You can now login with your new password."
        ));
    }
}


