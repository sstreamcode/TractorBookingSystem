package com.example.demo.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.Booking;
import com.example.demo.model.Tractor;
import com.example.demo.model.User;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUser(User user);
    long countByTractorId(Long tractorId);
    
    // Find overlapping bookings for a tractor in a time period
    @Query("SELECT b FROM Booking b WHERE b.tractor = :tractor " +
           "AND (b.adminStatus IS NULL OR b.adminStatus IN ('PENDING_APPROVAL', 'APPROVED')) " +
           "AND b.status != 'CANCELLED' " +
           "AND ((b.startAt <= :startAt AND b.endAt > :startAt) OR " +
           "(b.startAt < :endAt AND b.endAt >= :endAt) OR " +
           "(b.startAt >= :startAt AND b.endAt <= :endAt))")
    List<Booking> findOverlappingBookings(@Param("tractor") Tractor tractor, 
                                          @Param("startAt") LocalDateTime startAt, 
                                          @Param("endAt") LocalDateTime endAt);
    
    // Count active bookings for a tractor at a specific time
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.tractor = :tractor " +
           "AND (b.adminStatus IS NULL OR b.adminStatus = 'APPROVED') " +
           "AND b.status IN ('PENDING', 'PAID', 'DELIVERED') " +
           "AND b.endAt > :now")
    long countActiveBookings(@Param("tractor") Tractor tractor, @Param("now") LocalDateTime now);

    @Query("SELECT b FROM Booking b WHERE b.tractor = :tractor " +
           "AND (b.adminStatus IS NULL OR b.adminStatus = 'APPROVED') " +
           "AND b.status IN ('PENDING', 'PAID', 'DELIVERED') " +
           "ORDER BY b.endAt ASC")
    List<Booking> findActiveTrackingBookings(@Param("tractor") Tractor tractor);
    
    @Query("SELECT b FROM Booking b WHERE b.deliveryLatitude IS NOT NULL AND b.deliveryLongitude IS NOT NULL ORDER BY b.startAt DESC")
    List<Booking> findLatestWithDestination(Pageable pageable);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.endAt > :now AND b.status IN ('PENDING','PAID','DELIVERED')")
    long countOngoingBookings(@Param("now") LocalDateTime now);
    
    // Find bookings that need retrieval reminder (30 minutes before end, not yet sent)
    @Query("SELECT b FROM Booking b WHERE b.adminStatus = 'APPROVED' " +
           "AND b.status IN ('PAID', 'DELIVERED') " +
           "AND b.retrievalReminderSent = false " +
           "AND b.endAt BETWEEN :now AND :reminderTime")
    List<Booking> findBookingsNeedingReminder(@Param("now") LocalDateTime now, 
                                               @Param("reminderTime") LocalDateTime reminderTime);
    
    // Find completed bookings that need status update
    @Query("SELECT b FROM Booking b WHERE b.adminStatus = 'APPROVED' " +
           "AND b.status IN ('PAID', 'DELIVERED') " +
           "AND b.endAt <= :now")
    List<Booking> findCompletedBookings(@Param("now") LocalDateTime now);
}


