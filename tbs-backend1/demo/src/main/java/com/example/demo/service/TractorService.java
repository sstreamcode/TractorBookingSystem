package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Tractor;
import com.example.demo.model.Booking;
import com.example.demo.repository.TractorRepository;
import com.example.demo.repository.BookingRepository;

@Service
public class TractorService {
    private final TractorRepository tractorRepository;
    private final BookingRepository bookingRepository;

    public TractorService(TractorRepository tractorRepository, BookingRepository bookingRepository) {
        this.tractorRepository = tractorRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<Tractor> getAll() {
        List<Tractor> tractors = tractorRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        
        // Update status based on active bookings and quantity
        for (Tractor tractor : tractors) {
            Integer quantity = tractor.getQuantity() != null ? tractor.getQuantity() : 1;
            
            // Count total bookings for this tractor (all time)
            long totalBookingsCount = bookingRepository.countByTractorId(tractor.getId());
            tractor.setTotalBookings((int) totalBookingsCount);
            
            // Count active approved bookings
            long activeBookingsCount = bookingRepository.countActiveBookings(tractor, now);
            
            // Find all active bookings to get next available time
            List<Booking> activeBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getTractor().getId().equals(tractor.getId()))
                .filter(b -> {
                    LocalDateTime endAt = b.getEndAt();
                    String adminStatus = b.getAdminStatus();
                    // Treat null adminStatus as APPROVED for backward compatibility
                    boolean isApproved = adminStatus == null || adminStatus.equals("APPROVED");
                    return isApproved
                        && (b.getStatus().equals("PENDING") || b.getStatus().equals("PAID") || b.getStatus().equals("DELIVERED"))
                        && endAt.isAfter(now);
                })
                .collect(Collectors.toList());
            
            // Only set unavailable when ALL tractors are booked (quantity reaches 0)
            if (activeBookingsCount >= quantity && quantity > 0) {
                // All tractors are booked
                LocalDateTime latestEnd = activeBookings.stream()
                    .map(Booking::getEndAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(now);
                
                tractor.setStatus("Booked");
                tractor.setNextAvailableAt(latestEnd.toString());
                tractor.setAvailable(false);
            } else if (activeBookingsCount > 0) {
                // Some tractors are available
                LocalDateTime latestEnd = activeBookings.stream()
                    .map(Booking::getEndAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(now);
                
                long availableCount = quantity - activeBookingsCount;
                tractor.setStatus(String.format("Available (%d/%d)", availableCount, quantity));
                tractor.setNextAvailableAt(latestEnd.toString());
                tractor.setAvailable(true);
            } else {
                // All tractors are available
                tractor.setStatus("Available");
                tractor.setAvailable(true);
                tractor.setNextAvailableAt(null);
            }
        }
        
        return tractors;
    }

    public Optional<Tractor> getById(Long id) {
        Optional<Tractor> tractorOpt = tractorRepository.findById(id);
        if (tractorOpt.isPresent()) {
            Tractor tractor = tractorOpt.get();
            LocalDateTime now = LocalDateTime.now();
            Integer quantity = tractor.getQuantity() != null ? tractor.getQuantity() : 1;
            
            // Count total bookings for this tractor (all time)
            long totalBookingsCount = bookingRepository.countByTractorId(tractor.getId());
            tractor.setTotalBookings((int) totalBookingsCount);
            
            // Count active approved bookings
            long activeBookingsCount = bookingRepository.countActiveBookings(tractor, now);
            
            // Find all active bookings to get next available time
            List<Booking> activeBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getTractor().getId().equals(tractor.getId()))
                .filter(b -> {
                    LocalDateTime endAt = b.getEndAt();
                    String adminStatus = b.getAdminStatus();
                    // Treat null adminStatus as APPROVED for backward compatibility
                    boolean isApproved = adminStatus == null || adminStatus.equals("APPROVED");
                    return isApproved
                        && (b.getStatus().equals("PENDING") || b.getStatus().equals("PAID") || b.getStatus().equals("DELIVERED"))
                        && endAt.isAfter(now);
                })
                .collect(Collectors.toList());
            
            // Only set unavailable when ALL tractors are booked (quantity reaches 0)
            if (activeBookingsCount >= quantity && quantity > 0) {
                // All tractors are booked
                LocalDateTime latestEnd = activeBookings.stream()
                    .map(Booking::getEndAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(now);
                
                tractor.setStatus("Booked");
                tractor.setNextAvailableAt(latestEnd.toString());
                tractor.setAvailable(false);
            } else if (activeBookingsCount > 0) {
                // Some tractors are available
                LocalDateTime latestEnd = activeBookings.stream()
                    .map(Booking::getEndAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(now);
                
                long availableCount = quantity - activeBookingsCount;
                tractor.setStatus(String.format("Available (%d/%d)", availableCount, quantity));
                tractor.setNextAvailableAt(latestEnd.toString());
                tractor.setAvailable(true);
            } else {
                // All tractors are available
                tractor.setStatus("Available");
                tractor.setAvailable(true);
                tractor.setNextAvailableAt(null);
            }
        }
        return tractorOpt;
    }

    @Transactional
    public Tractor create(Tractor tractor) {
        return tractorRepository.save(tractor);
    }

    @Transactional
    public boolean update(Long id, Tractor tractor) {
        Optional<Tractor> existingOpt = tractorRepository.findById(id);
        if (existingOpt.isEmpty()) return false;
        
        Tractor existing = existingOpt.get();
        
        // Update only non-null fields
        if (tractor.getName() != null) existing.setName(tractor.getName());
        if (tractor.getModel() != null) existing.setModel(tractor.getModel());
        if (tractor.getHourlyRate() != null) existing.setHourlyRate(tractor.getHourlyRate());
        if (tractor.getAvailable() != null) existing.setAvailable(tractor.getAvailable());
        if (tractor.getImageUrl() != null) existing.setImageUrl(tractor.getImageUrl());
        if (tractor.getImageUrls() != null) existing.setImageUrls(tractor.getImageUrls());
        if (tractor.getDescription() != null) existing.setDescription(tractor.getDescription());
        if (tractor.getLocation() != null) existing.setLocation(tractor.getLocation());
        if (tractor.getLatitude() != null) existing.setLatitude(tractor.getLatitude());
        if (tractor.getLongitude() != null) existing.setLongitude(tractor.getLongitude());
        if (tractor.getLocationUpdatedAt() != null) existing.setLocationUpdatedAt(tractor.getLocationUpdatedAt());
        if (tractor.getHorsePower() != null) existing.setHorsePower(tractor.getHorsePower());
        if (tractor.getFuelType() != null) existing.setFuelType(tractor.getFuelType());
        if (tractor.getFuelLevel() != null) existing.setFuelLevel(tractor.getFuelLevel());
        if (tractor.getRating() != null) existing.setRating(tractor.getRating());
        // totalBookings is calculated dynamically - don't update from request
        if (tractor.getStatus() != null) existing.setStatus(tractor.getStatus());
        if (tractor.getNextAvailableAt() != null) existing.setNextAvailableAt(tractor.getNextAvailableAt());
        if (tractor.getCategory() != null) existing.setCategory(tractor.getCategory());
        // Update quantity - if null in request, keep existing value; otherwise update (including 0)
        if (tractor.getQuantity() != null) {
            existing.setQuantity(tractor.getQuantity());
        }
        if (tractor.getDestinationLatitude() != null) existing.setDestinationLatitude(tractor.getDestinationLatitude());
        if (tractor.getDestinationLongitude() != null) existing.setDestinationLongitude(tractor.getDestinationLongitude());
        if (tractor.getDestinationAddress() != null) existing.setDestinationAddress(tractor.getDestinationAddress());
        
        tractorRepository.save(existing);
        return true;
    }

    @Transactional
    public boolean delete(Long id) {
        if (!tractorRepository.existsById(id)) return false;
        
        // Check if tractor has any bookings (not just active ones)
        long totalBookings = bookingRepository.countByTractorId(id);
        if (totalBookings > 0) {
            // Don't allow deletion if there are any bookings (to preserve data integrity)
            throw new IllegalStateException("Cannot delete tractor with existing bookings. Please cancel or complete all bookings first.");
        }
        
        // Delete tractor only if no bookings exist
        // Since we removed CascadeType.REMOVE, this ensures data integrity
        // Foreign key constraints will also prevent deletion if bookings exist
        tractorRepository.deleteById(id);
        return true;
    }

    @Transactional
    public Optional<Tractor> updateLiveLocation(Long id, Double latitude, Double longitude, String address) {
        Optional<Tractor> tractorOpt = tractorRepository.findById(id);
        if (tractorOpt.isEmpty()) {
            return tractorOpt;
        }
        Tractor tractor = tractorOpt.get();
        if (latitude != null) {
            tractor.setLatitude(latitude);
        }
        if (longitude != null) {
            tractor.setLongitude(longitude);
        }
        if (address != null && !address.isBlank()) {
            tractor.setLocation(address);
        }
        tractor.setLocationUpdatedAt(LocalDateTime.now());
        tractorRepository.save(tractor);
        return Optional.of(tractor);
    }
}


