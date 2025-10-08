package com.tractorbooking.repository;

import com.tractorbooking.model.Booking;
import com.tractorbooking.model.BookingStatus;
import com.tractorbooking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByUser(User user);
    
    List<Booking> findByUserOrderByCreatedAtDesc(User user);
    
    @Query("SELECT b FROM Booking b ORDER BY b.createdAt DESC")
    List<Booking> findAllOrderByCreatedAtDesc();
    
    List<Booking> findByStatus(BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.tractor.id = :tractorId " +
           "AND b.status IN ('APPROVED', 'PENDING') " +
           "AND ((b.startDate <= :endDate AND b.endDate >= :startDate))")
    List<Booking> findConflictingBookings(@Param("tractorId") Long tractorId,
                                         @Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'APPROVED'")
    long countApprovedBookings();
    
    @Query("SELECT SUM(b.totalAmount) FROM Booking b WHERE b.status = 'APPROVED' AND b.paymentStatus = 'PAID'")
    java.math.BigDecimal getTotalRevenue();
}
