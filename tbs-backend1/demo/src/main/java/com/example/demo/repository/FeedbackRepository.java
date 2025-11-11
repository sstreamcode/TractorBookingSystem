package com.example.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.model.Feedback;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findTop10ByTractorIdOrderByCreatedAtDesc(Long tractorId);
    long countByTractorId(Long tractorId);
    boolean existsByTractorIdAndUserId(Long tractorId, Long userId);

    @Query("SELECT COALESCE(AVG(f.rating),0) FROM Feedback f WHERE f.tractor.id = :tractorId")
    Double averageRatingForTractor(@Param("tractorId") Long tractorId);
}


