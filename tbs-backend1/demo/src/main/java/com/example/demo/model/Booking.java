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

    @OneToMany(mappedBy = "booking", cascade = CascadeType.REMOVE, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonIgnore
    private List<Payment> payments;
    
    @Column(nullable = false)
    private Boolean retrievalReminderSent = false; // Track if 30-min reminder email was sent
    
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
    public List<Payment> getPayments() { return payments; }
    public void setPayments(List<Payment> payments) { this.payments = payments; }
}


