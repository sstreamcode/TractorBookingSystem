package com.example.demo.controller;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Tractor;
import com.example.demo.model.Booking;
import com.example.demo.model.Feedback;
import com.example.demo.model.User;
import com.example.demo.util.TrackingMapper;
import com.example.demo.service.TractorService;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.FeedbackRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.TractorRepository;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api/tractors")
public class TractorController {
    private final TractorService tractorService;
    private final BookingRepository bookingRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final TractorRepository tractorRepository;

    public TractorController(TractorService tractorService, BookingRepository bookingRepository, FeedbackRepository feedbackRepository, UserRepository userRepository, TractorRepository tractorRepository) {
        this.tractorService = tractorService;
        this.bookingRepository = bookingRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.tractorRepository = tractorRepository;
    }

    @GetMapping
    public List<Tractor> list() {
        // Only return approved tractors for public listing
        return tractorService.getAll().stream()
            .filter(t -> t.getApprovalStatus() == null || "APPROVED".equals(t.getApprovalStatus()))
            .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tractor> get(@PathVariable Long id) {
        return tractorService.getById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Tractor tractor, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        // Only tractor owners can create tractors
        if (!"TRACTOR_OWNER".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only tractor owners can create tractors"));
        }

        // Require tractor owner approval by super admin before allowing tractor registration
        if (!user.getTractorOwnerApproved()) {
            return ResponseEntity.status(403).body(Map.of("error", "Your tractor owner account is pending approval by the super admin."));
        }
        
        // Set owner and initial approval status
        tractor.setOwner(user);
        tractor.setApprovalStatus("PENDING"); // Requires super admin approval
        
        Tractor created = tractorService.create(tractor);
        return ResponseEntity.created(URI.create("/api/tractors/" + created.getId())).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Tractor tractor, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        Tractor existing = tractorRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Only tractor owner can update their own tractors, or super admin
        boolean isOwner = existing.getOwner() != null && existing.getOwner().getId().equals(user.getId());
        boolean isSuperAdmin = "SUPER_ADMIN".equals(user.getRole());
        
        if (!isOwner && !isSuperAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "Only tractor owner or super admin can update tractors"));
        }
        
        // Preserve owner and approval status unless super admin is changing approval
        if (!isSuperAdmin) {
            tractor.setOwner(existing.getOwner());
            tractor.setApprovalStatus(existing.getApprovalStatus());
        } else {
            // Super admin can change approval status
            if (tractor.getApprovalStatus() == null && existing.getApprovalStatus() != null) {
                tractor.setApprovalStatus(existing.getApprovalStatus());
            }
            if (existing.getOwner() != null) {
                tractor.setOwner(existing.getOwner());
            }
        }
        
        boolean ok = tractorService.update(id, tractor);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        Tractor existing = tractorRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Only tractor owner can delete their own tractors, or super admin
        boolean isOwner = existing.getOwner() != null && existing.getOwner().getId().equals(user.getId());
        boolean isSuperAdmin = "SUPER_ADMIN".equals(user.getRole());
        
        if (!isOwner && !isSuperAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "Only tractor owner or super admin can delete tractors"));
        }
        
        boolean ok = tractorService.delete(id);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<?> stats(@PathVariable Long id) {
        return tractorService.getById(id)
            .map(t -> {
                long bookings = bookingRepository.countByTractorId(id);
                Double avg = feedbackRepository.averageRatingForTractor(id);
                java.util.List<Feedback> latest = feedbackRepository.findTop10ByTractorIdOrderByCreatedAtDesc(id);
                
                // Map feedback to include user profile picture
                java.util.List<java.util.Map<String, Object>> feedbackList = latest.stream()
                    .map(f -> {
                        java.util.Map<String, Object> feedbackMap = new java.util.HashMap<>();
                        feedbackMap.put("id", f.getId());
                        feedbackMap.put("authorName", f.getAuthorName() != null ? f.getAuthorName() : "Anonymous");
                        feedbackMap.put("rating", f.getRating());
                        feedbackMap.put("comment", f.getComment() != null ? f.getComment() : "");
                        feedbackMap.put("createdAt", f.getCreatedAt().toString());
                        // Include user profile picture if available
                        if (f.getUser() != null && f.getUser().getProfilePictureUrl() != null) {
                            feedbackMap.put("profilePictureUrl", f.getUser().getProfilePictureUrl());
                        } else {
                            feedbackMap.put("profilePictureUrl", null);
                        }
                        return feedbackMap;
                    })
                    .collect(java.util.stream.Collectors.toList());
                
                return ResponseEntity.ok(java.util.Map.of(
                    "tractorId", id,
                    "totalBookings", bookings,
                    "avgRating", avg != null ? avg : 0.0,
                    "feedback", feedbackList
                ));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<?> updateLiveLocation(@PathVariable Long id, @RequestBody Map<String, Object> body, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        Tractor tractor = tractorRepository.findById(id).orElse(null);
        if (tractor == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Only tractor owner or super admin can update live locations
        boolean isOwner = tractor.getOwner() != null && tractor.getOwner().getId().equals(user.getId());
        boolean isSuperAdmin = "SUPER_ADMIN".equals(user.getRole());
        
        if (!isOwner && !isSuperAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "Only tractor owner or super admin can update live locations"));
        }
        Double latitude = body.get("latitude") != null ? Double.valueOf(body.get("latitude").toString()) : null;
        Double longitude = body.get("longitude") != null ? Double.valueOf(body.get("longitude").toString()) : null;
        String address = body.get("address") != null ? body.get("address").toString() : null;
        if (latitude == null || longitude == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "latitude and longitude are required"));
        }
        return tractorService.updateLiveLocation(id, latitude, longitude, address)
            .map(t -> ResponseEntity.ok(Map.of(
                "status", "UPDATED",
                "updatedAt", t.getLocationUpdatedAt(),
                "location", Map.of(
                    "latitude", t.getLatitude(),
                    "longitude", t.getLongitude(),
                    "address", t.getLocation()
                )
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<?> getTractorTracking(@PathVariable Long id) {
        return tractorService.getById(id)
            .map(tractor -> {
                List<Booking> active = bookingRepository.findActiveTrackingBookings(tractor);
                Booking relevant = active.isEmpty() ? null : active.get(0);
                return ResponseEntity.ok(TrackingMapper.buildPayload(tractor, relevant));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> createFeedback(@PathVariable Long id, @RequestBody java.util.Map<String, String> body, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(java.util.Map.of("error", "Authentication required"));
        }

        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(java.util.Map.of("error", "User not found"));
        }

        if (feedbackRepository.existsByTractorIdAndUserId(id, user.getId())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "You have already rated this tractor"));
        }

        return tractorService.getById(id)
            .map(t -> {
                int rating;
                try {
                    rating = Integer.parseInt(body.getOrDefault("rating", "0"));
                } catch (Exception ex) {
                    rating = 0;
                }
                if (rating < 1 || rating > 5) {
                    return ResponseEntity.badRequest().body(java.util.Map.of("error", "Rating must be between 1 and 5"));
                }
                String comment = body.getOrDefault("comment", "");
                Feedback f = new Feedback();
                f.setTractor(t);
                f.setUser(user);
                f.setAuthorName(user.getName());
                f.setRating(rating);
                f.setComment(comment);
                feedbackRepository.save(f);
                Double avg = feedbackRepository.averageRatingForTractor(id);
                t.setRating(avg);
                tractorService.update(t.getId(), t);
                return ResponseEntity.ok(java.util.Map.of("status", "OK", "avgRating", avg));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Get all tractors for tractor owner (their own tractors)
    @GetMapping("/my-tractors")
    public ResponseEntity<?> myTractors(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        if (!"TRACTOR_OWNER".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only tractor owners can view their tractors"));
        }
        
        List<Tractor> myTractors = tractorRepository.findByOwner(user);
        return ResponseEntity.ok(myTractors);
    }

    // Get all pending tractors for super admin approval
    @GetMapping("/pending-approval")
    public ResponseEntity<?> pendingApproval(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        if (!"SUPER_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can view pending tractors"));
        }
        
        List<Tractor> pending = tractorRepository.findAll().stream()
            .filter(t -> "PENDING".equals(t.getApprovalStatus()))
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(pending);
    }

    // Super admin approve tractor
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveTractor(@PathVariable Long id, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        if (!"SUPER_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can approve tractors"));
        }
        
        Tractor tractor = tractorRepository.findById(id).orElse(null);
        if (tractor == null) {
            return ResponseEntity.notFound().build();
        }
        
        tractor.setApprovalStatus("APPROVED");
        tractorRepository.save(tractor);
        
        return ResponseEntity.ok(Map.of("status", "APPROVED", "message", "Tractor approved successfully"));
    }

    // Super admin reject tractor
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectTractor(@PathVariable Long id, Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        if (!"SUPER_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only super admins can reject tractors"));
        }
        
        Tractor tractor = tractorRepository.findById(id).orElse(null);
        if (tractor == null) {
            return ResponseEntity.notFound().build();
        }
        
        tractor.setApprovalStatus("REJECTED");
        tractorRepository.save(tractor);
        
        return ResponseEntity.ok(Map.of("status", "REJECTED", "message", "Tractor rejected"));
    }

}


