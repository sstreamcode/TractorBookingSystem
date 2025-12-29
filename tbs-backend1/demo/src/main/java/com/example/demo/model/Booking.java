package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_booking_user"))
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tractor_id", foreignKey = @ForeignKey(name = "fk_booking_tractor"))
    private Tractor tractor;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, PAID, CANCELLED

    @Column(length = 20)
    private String adminStatus; // PENDING_APPROVAL, APPROVED, DENIED

    @Column(nullable = false)
    private Double totalAmount;

    private Double deliveryLatitude;
    private Double deliveryLongitude;
    private String deliveryAddress;
    
    // Store original tractor location before delivery (to restore on completion)
    private Double originalTractorLatitude;
    private Double originalTractorLongitude;
    private String originalTractorLocation;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.REMOVE, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnore
    private List<Payment> payments;
    
    @Column(nullable = false)
    private Boolean retrievalReminderSent = false; // Track if 30-min reminder email was sent
    
    @Column(nullable = false)
    private Double commissionAmount = 0.0; // 15% commission on total amount

    @Column(nullable = false)
    private Boolean paymentReleased = false; // Track if payment has been released to tractor owner
    
    // Time tracking fields for actual usage
    private LocalDateTime actualUsageStartTime; // When customer starts using the tractor (after delivery)
    private LocalDateTime actualUsageStopTime; // When customer stops using the tractor
    private Long actualUsageMinutes; // Calculated actual usage in minutes
    private Long bookedMinutes; // Original booked duration in minutes
    private static final Long MINIMUM_CHARGE_MINUTES = 30L; // Minimum charge is 30 minutes
    private Double initialPrice; // Price for booked time (minimum 30 min)
    private Double finalPrice; // Final price based on actual usage
    private Double refundAmount; // Refund amount if initialPrice > finalPrice (for overpayment)
    
    @Column(length = 20)
    private String deliveryStatus; // ORDERED, DELIVERING, DELIVERED, RETURNED - per booking delivery status
    
    // Helper method to get payment method for JSON serialization
    @com.fasterxml.jackson.annotation.JsonProperty("paymentMethod")
    public String getPaymentMethod() {
        if (payments == null || payments.isEmpty()) {
            return null;
        }
        // Return COD if exists, otherwise return first payment method
        return payments.stream()
            .filter(p -> "CASH_ON_DELIVERY".equals(p.getMethod()))
            .findFirst()
            .map(Payment::getMethod)
            .orElse(payments.get(0).getMethod());
    }
    
    // Expose payments for JSON serialization (without circular reference)
    @com.fasterxml.jackson.annotation.JsonProperty("payments")
    public java.util.List<java.util.Map<String, Object>> getPaymentsForJson() {
        if (payments == null || payments.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return payments.stream()
            .map(p -> {
                java.util.Map<String, Object> paymentMap = new java.util.HashMap<>();
                paymentMap.put("id", p.getId());
                paymentMap.put("method", p.getMethod());
                paymentMap.put("status", p.getStatus());
                paymentMap.put("amount", p.getAmount());
                return paymentMap;
            })
            .collect(java.util.stream.Collectors.toList());
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Tractor getTractor() { return tractor; }
    public void setTractor(Tractor tractor) { this.tractor = tractor; }
    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAdminStatus() { return adminStatus; }
    public void setAdminStatus(String adminStatus) { this.adminStatus = adminStatus; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public Boolean getRetrievalReminderSent() { return retrievalReminderSent != null ? retrievalReminderSent : false; }
    public void setRetrievalReminderSent(Boolean retrievalReminderSent) { this.retrievalReminderSent = retrievalReminderSent; }
    public Double getDeliveryLatitude() { return deliveryLatitude; }
    public void setDeliveryLatitude(Double deliveryLatitude) { this.deliveryLatitude = deliveryLatitude; }
    public Double getDeliveryLongitude() { return deliveryLongitude; }
    public void setDeliveryLongitude(Double deliveryLongitude) { this.deliveryLongitude = deliveryLongitude; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public Double getOriginalTractorLatitude() { return originalTractorLatitude; }
    public void setOriginalTractorLatitude(Double originalTractorLatitude) { this.originalTractorLatitude = originalTractorLatitude; }
    public Double getOriginalTractorLongitude() { return originalTractorLongitude; }
    public void setOriginalTractorLongitude(Double originalTractorLongitude) { this.originalTractorLongitude = originalTractorLongitude; }
    public String getOriginalTractorLocation() { return originalTractorLocation; }
    public void setOriginalTractorLocation(String originalTractorLocation) { this.originalTractorLocation = originalTractorLocation; }
    public List<Payment> getPayments() { return payments; }
    public void setPayments(List<Payment> payments) { this.payments = payments; }
    public Double getCommissionAmount() { return commissionAmount != null ? commissionAmount : 0.0; }
    public void setCommissionAmount(Double commissionAmount) { this.commissionAmount = commissionAmount; }
    public Boolean getPaymentReleased() { return paymentReleased != null ? paymentReleased : false; }
    public void setPaymentReleased(Boolean paymentReleased) { this.paymentReleased = paymentReleased; }
    
    public LocalDateTime getActualUsageStartTime() { return actualUsageStartTime; }
    public void setActualUsageStartTime(LocalDateTime actualUsageStartTime) { this.actualUsageStartTime = actualUsageStartTime; }
    
    public LocalDateTime getActualUsageStopTime() { return actualUsageStopTime; }
    public void setActualUsageStopTime(LocalDateTime actualUsageStopTime) { this.actualUsageStopTime = actualUsageStopTime; }
    
    public Long getActualUsageMinutes() { return actualUsageMinutes; }
    public void setActualUsageMinutes(Long actualUsageMinutes) { this.actualUsageMinutes = actualUsageMinutes; }
    
    public Long getBookedMinutes() { return bookedMinutes; }
    public void setBookedMinutes(Long bookedMinutes) { this.bookedMinutes = bookedMinutes; }
    
    public static Long getMinimumChargeMinutes() { return MINIMUM_CHARGE_MINUTES; }
    
    public Double getInitialPrice() { return initialPrice; }
    public void setInitialPrice(Double initialPrice) { this.initialPrice = initialPrice; }
    
    public Double getFinalPrice() { return finalPrice; }
    public void setFinalPrice(Double finalPrice) { this.finalPrice = finalPrice; }
    
    public Double getRefundAmount() { return refundAmount; }
    public void setRefundAmount(Double refundAmount) { this.refundAmount = refundAmount; }
    
    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }
}


