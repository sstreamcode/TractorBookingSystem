package com.tractorbooking.dto;

import java.math.BigDecimal;

public class AdminSummaryResponse {
    
    private long totalUsers;
    private long totalTractors;
    private long activeBookings;
    private long totalBookings;
    private BigDecimal totalRevenue;
    
    public AdminSummaryResponse() {}
    
    public AdminSummaryResponse(long totalUsers, long totalTractors, long activeBookings, 
                               long totalBookings, BigDecimal totalRevenue) {
        this.totalUsers = totalUsers;
        this.totalTractors = totalTractors;
        this.activeBookings = activeBookings;
        this.totalBookings = totalBookings;
        this.totalRevenue = totalRevenue;
    }
    
    public long getTotalUsers() {
        return totalUsers;
    }
    
    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }
    
    public long getTotalTractors() {
        return totalTractors;
    }
    
    public void setTotalTractors(long totalTractors) {
        this.totalTractors = totalTractors;
    }
    
    public long getActiveBookings() {
        return activeBookings;
    }
    
    public void setActiveBookings(long activeBookings) {
        this.activeBookings = activeBookings;
    }
    
    public long getTotalBookings() {
        return totalBookings;
    }
    
    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }
    
    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }
    
    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
