package com.tractorbooking.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class BookingRequest {
    
    @NotNull
    private Long userId;
    
    @NotNull
    private Long tractorId;
    
    @NotNull
    private LocalDateTime startDate;
    
    @NotNull
    private LocalDateTime endDate;
    
    public BookingRequest() {}
    
    public BookingRequest(Long userId, Long tractorId, LocalDateTime startDate, LocalDateTime endDate) {
        this.userId = userId;
        this.tractorId = tractorId;
        this.startDate = startDate;
        this.endDate = endDate;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Long getTractorId() {
        return tractorId;
    }
    
    public void setTractorId(Long tractorId) {
        this.tractorId = tractorId;
    }
    
    public LocalDateTime getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }
    
    public LocalDateTime getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }
}
