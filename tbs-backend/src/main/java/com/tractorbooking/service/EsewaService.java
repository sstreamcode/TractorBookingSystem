package com.tractorbooking.service;

import com.tractorbooking.model.Booking;
import com.tractorbooking.model.Payment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class EsewaService {
    
    @Value("${esewa.sandbox.url}")
    private String esewaSandboxUrl;
    
    @Value("${esewa.verify.url}")
    private String esewaVerifyUrl;
    
    @Value("${esewa.merchant.code}")
    private String merchantCode;
    
    @Value("${esewa.success.url}")
    private String successUrl;
    
    @Value("${esewa.failure.url}")
    private String failureUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    public String generatePaymentUrl(Booking booking) {
        String transactionId = "TXN" + System.currentTimeMillis();
        
        Map<String, String> params = new HashMap<>();
        params.put("amt", booking.getTotalAmount().toString());
        params.put("pid", booking.getId().toString());
        params.put("scd", merchantCode);
        params.put("su", successUrl);
        params.put("fu", failureUrl);
        
        // Build URL with parameters
        StringBuilder urlBuilder = new StringBuilder(esewaSandboxUrl);
        urlBuilder.append("?");
        
        boolean first = true;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!first) {
                urlBuilder.append("&");
            }
            urlBuilder.append(entry.getKey()).append("=").append(entry.getValue());
            first = false;
        }
        
        return urlBuilder.toString();
    }
    
    public boolean verifyPayment(String transactionId, String referenceId, BigDecimal amount) {
        try {
            Map<String, String> params = new HashMap<>();
            params.put("amt", amount.toString());
            params.put("rid", referenceId);
            params.put("pid", transactionId);
            params.put("scd", merchantCode);
            
            String response = restTemplate.getForObject(
                esewaVerifyUrl + "?" + buildQueryString(params), 
                String.class
            );
            
            return response != null && response.contains("Success");
        } catch (Exception e) {
            return false;
        }
    }
    
    private String buildQueryString(Map<String, String> params) {
        StringBuilder queryString = new StringBuilder();
        boolean first = true;
        
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!first) {
                queryString.append("&");
            }
            queryString.append(entry.getKey()).append("=").append(entry.getValue());
            first = false;
        }
        
        return queryString.toString();
    }
}
