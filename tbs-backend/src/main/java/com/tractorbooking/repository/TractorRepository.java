package com.tractorbooking.repository;

import com.tractorbooking.model.Tractor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TractorRepository extends JpaRepository<Tractor, Long> {
    
    List<Tractor> findByAvailabilityTrue();
    
    @Query("SELECT t FROM Tractor t WHERE t.availability = true AND t.id NOT IN " +
           "(SELECT b.tractor.id FROM Booking b WHERE b.status IN ('APPROVED', 'PENDING') " +
           "AND ((b.startDate <= :endDate AND b.endDate >= :startDate)))")
    List<Tractor> findAvailableTractors(@Param("startDate") LocalDateTime startDate, 
                                       @Param("endDate") LocalDateTime endDate);
}
