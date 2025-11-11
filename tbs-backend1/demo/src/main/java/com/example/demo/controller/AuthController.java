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

import java.util.Map;
import io.jsonwebtoken.Claims;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, JwtUtil jwtUtil, UserRepository userRepository) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        User user = authService.register(email, password, "USER");
        if (name != null && !name.isBlank()) {
            user.setName(name);
            userRepository.save(user);
        }
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        return authService.authenticate(email, password)
            .map(u -> ResponseEntity.ok(Map.of("token", jwtUtil.generateToken(u.getEmail(), u.getRole()))))
            .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
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
            return ResponseEntity.ok(Map.of("email", email, "role", role));
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
            
            if (name != null && !name.isBlank()) {
                user.setName(name);
            }
            if (profilePictureUrl != null && !profilePictureUrl.isBlank()) {
                user.setProfilePictureUrl(profilePictureUrl);
            }
            
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                "message", "Profile updated", 
                "user", Map.of(
                    "name", user.getName(), 
                    "email", user.getEmail(), 
                    "role", user.getRole(),
                    "profilePictureUrl", user.getProfilePictureUrl() != null ? user.getProfilePictureUrl() : ""
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", "Failed to update profile"));
        }
    }
}


