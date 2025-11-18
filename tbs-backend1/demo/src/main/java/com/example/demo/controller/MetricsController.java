package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Booking;
import com.example.demo.model.Tractor;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.TractorRepository;
import com.example.demo.util.TrackingMapper;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("/api")
public class MetricsController {

    private final BookingRepository bookingRepository;
    private final TractorRepository tractorRepository;

    public MetricsController(BookingRepository bookingRepository, TractorRepository tractorRepository) {
        this.bookingRepository = bookingRepository;
        this.tractorRepository = tractorRepository;
    }

    @GetMapping("/dispatch/latest")
    public ResponseEntity<?> getLatestDispatch() {
        List<Booking> latest = bookingRepository.findLatestWithDestination(PageRequest.of(0, 1));
        if (latest.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasData", false));
        }
        Booking booking = latest.get(0);
        Tractor tractor = booking.getTractor();

        Map<String, Object> current = new HashMap<>();
        if (tractor != null && tractor.getLatitude() != null && tractor.getLongitude() != null) {
            current.put("lat", tractor.getLatitude());
            current.put("lng", tractor.getLongitude());
            current.put("address", tractor.getLocation());
        }

        Map<String, Object> destination = new HashMap<>();
        destination.put("lat", booking.getDeliveryLatitude());
        destination.put("lng", booking.getDeliveryLongitude());
        destination.put("address", booking.getDeliveryAddress());

        double distanceKm = 0;
        if (tractor != null && tractor.getLatitude() != null && tractor.getLongitude() != null &&
            booking.getDeliveryLatitude() != null && booking.getDeliveryLongitude() != null) {
            distanceKm = TrackingMapper.computeDistanceKm(
                tractor.getLatitude(),
                tractor.getLongitude(),
                booking.getDeliveryLatitude(),
                booking.getDeliveryLongitude()
            );
        }
        long etaMinutes = TrackingMapper.estimateEtaMinutes(distanceKm);

        Map<String, Object> payload = new HashMap<>();
        payload.put("hasData", true);
        payload.put("tractorName", tractor != null ? tractor.getName() : "Active Tractor");
        payload.put("status", booking.getStatus());
        payload.put("distanceKm", distanceKm);
        payload.put("etaMinutes", etaMinutes);
        payload.put("currentLocation", current.isEmpty() ? null : current);
        payload.put("destination", destination);
        payload.put("bookingId", booking.getId());
        if (tractor != null && tractor.getFuelLevel() != null) {
            payload.put("fleetEfficiency", String.format("%.0f%% efficiency", tractor.getFuelLevel()));
        }
        payload.put("terrain", booking.getDeliveryAddress() != null && booking.getDeliveryAddress().toLowerCase().contains("hill")
            ? "Hill terrain"
            : "Mixed terrain");

        return ResponseEntity.ok(payload);
    }

    @GetMapping("/metrics/landing")
    public ResponseEntity<?> getLandingMetrics() {
        LocalDateTime now = LocalDateTime.now();
        long totalTractors = tractorRepository.count();
        long totalBookings = bookingRepository.count();
        long activeBookings = bookingRepository.countOngoingBookings(now);
        double fleetUtilization = totalTractors == 0 ? 0 : Math.min(100.0, (double) activeBookings / totalTractors * 100.0);
        long avgResponseMinutes = Math.max(15, Math.min(45, 30 - (int) Math.min(10, activeBookings)));

        Set<String> coverage = new HashSet<>();
        tractorRepository.findAll().forEach(tractor -> {
            if (tractor.getLocation() != null && !tractor.getLocation().isBlank()) {
                coverage.add(tractor.getLocation().trim());
            }
        });
        bookingRepository.findAll().forEach(booking -> {
            if (booking.getDeliveryAddress() != null && !booking.getDeliveryAddress().isBlank()) {
                coverage.add(booking.getDeliveryAddress().trim());
            }
        });

        Map<String, Object> payload = new HashMap<>();
        payload.put("totalTractors", totalTractors);
        payload.put("totalBookings", totalBookings);
        payload.put("activeBookings", activeBookings);
        payload.put("districtsCovered", coverage.size());
        payload.put("avgResponseTimeMinutes", avgResponseMinutes);
        payload.put("fleetUtilization", fleetUtilization);

        return ResponseEntity.ok(payload);
    }
}

