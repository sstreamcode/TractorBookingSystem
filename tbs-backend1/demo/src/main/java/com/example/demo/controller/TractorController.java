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

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api/tractors")
public class TractorController {
    private final TractorService tractorService;
    private final BookingRepository bookingRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    public TractorController(TractorService tractorService, BookingRepository bookingRepository, FeedbackRepository feedbackRepository, UserRepository userRepository) {
        this.tractorService = tractorService;
        this.bookingRepository = bookingRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Tractor> list() {
        return tractorService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tractor> get(@PathVariable Long id) {
        return tractorService.getById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Tractor> create(@RequestBody Tractor tractor) {
        Tractor created = tractorService.create(tractor);
        return ResponseEntity.created(URI.create("/api/tractors/" + created.getId())).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody Tractor tractor) {
        boolean ok = tractorService.update(id, tractor);
        return ok ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
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
                return ResponseEntity.ok(java.util.Map.of(
                    "tractorId", id,
                    "totalBookings", bookings,
                    "avgRating", avg != null ? avg : 0.0,
                    "feedback", latest
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
        if (user == null || !"ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can update live locations"));
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

}


