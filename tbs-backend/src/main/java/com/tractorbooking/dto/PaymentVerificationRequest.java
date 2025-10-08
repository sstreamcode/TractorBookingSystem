package com.tractorbooking.dto;

public class PaymentVerificationRequest {
    
    private String transactionId;
    private String referenceId;
    private String amount;
    
    public PaymentVerificationRequest() {}
    
    public PaymentVerificationRequest(String transactionId, String referenceId, String amount) {
        this.transactionId = transactionId;
        this.referenceId = referenceId;
        this.amount = amount;
    }
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
    
    public String getReferenceId() {
        return referenceId;
    }
    
    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }
    
    public String getAmount() {
        return amount;
    }
    
    public void setAmount(String amount) {
        this.amount = amount;
    }
}
