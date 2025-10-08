package com.tractorbooking.repository;

import com.tractorbooking.model.Payment;
import com.tractorbooking.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    Optional<Payment> findByTransactionId(String transactionId);
    
    Optional<Payment> findByEsewaReferenceId(String esewaReferenceId);
    
    java.util.List<Payment> findByStatus(PaymentStatus status);
}
