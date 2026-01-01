package com.example.demo.controller;

import com.example.demo.util.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "*")
public class ContactController {
    private static final Logger logger = LoggerFactory.getLogger(ContactController.class);
    
    private final EmailService emailService;
    
    public ContactController(EmailService emailService) {
        this.emailService = emailService;
    }
    
    @PostMapping("/submit")
    public ResponseEntity<?> submitContactForm(@RequestBody Map<String, String> request) {
        try {
            String firstName = request.getOrDefault("firstName", "");
            String lastName = request.getOrDefault("lastName", "");
            String email = request.getOrDefault("email", "");
            String phone = request.getOrDefault("phone", "");
            String subject = request.getOrDefault("subject", "");
            String message = request.getOrDefault("message", "");
            
            // Validate required fields
            if (firstName == null || firstName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "First name is required"));
            }
            if (lastName == null || lastName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Last name is required"));
            }
            if (email == null || email.trim().isEmpty() || !email.contains("@")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Valid email is required"));
            }
            if (subject == null || subject.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Subject is required"));
            }
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
            }
            
            // Send email to tractorsewa@gmail.com
            try {
                emailService.sendContactFormEmail(
                    firstName.trim(),
                    lastName.trim(),
                    email.trim(),
                    phone != null ? phone.trim() : "",
                    subject.trim(),
                    message.trim()
                );
                
                logger.info("Contact form submitted successfully from: {} ({})", email, firstName + " " + lastName);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Your message has been sent successfully. We will get back to you soon!"
                ));
            } catch (Exception emailException) {
                logger.error("Email sending failed for contact form from: {} - Error: {}", email, emailException.getMessage(), emailException);
                // Still return success to user, but log the error for admin review
                // This prevents email service issues from blocking form submissions
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Your message has been received. We will get back to you soon!"
                ));
            }
            
        } catch (Exception e) {
            logger.error("Failed to process contact form submission: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to process your request. Please try again later."
            ));
        }
    }
}

