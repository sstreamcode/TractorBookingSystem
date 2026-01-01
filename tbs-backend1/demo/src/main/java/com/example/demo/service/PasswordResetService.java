package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;

@Service
public class PasswordResetService {
    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);
    
    // Store reset codes: email -> {code, expiryTime}
    private final Map<String, ResetCodeInfo> resetCodes = new ConcurrentHashMap<>();
    
    // Code expires in 10 minutes
    private static final long CODE_EXPIRY_MS = 10 * 60 * 1000;
    
    private static class ResetCodeInfo {
        String code;
        long expiryTime;
        
        ResetCodeInfo(String code) {
            this.code = code;
            this.expiryTime = System.currentTimeMillis() + CODE_EXPIRY_MS;
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }
    
    /**
     * Generate and store a 6-digit reset code for the given email
     */
    public String generateResetCode(String email) {
        // Generate 6-digit code
        Random random = new Random();
        String code = String.format("%06d", random.nextInt(1000000));
        
        // Store code with expiry time
        resetCodes.put(email.toLowerCase(), new ResetCodeInfo(code));
        
        logger.info("Generated reset code for email: {}", email);
        
        // Clean up expired codes periodically
        cleanupExpiredCodes();
        
        return code;
    }
    
    /**
     * Verify if the provided code matches the stored code for the email
     */
    public boolean verifyCode(String email, String code) {
        ResetCodeInfo info = resetCodes.get(email.toLowerCase());
        
        if (info == null) {
            logger.warn("No reset code found for email: {}", email);
            return false;
        }
        
        if (info.isExpired()) {
            logger.warn("Reset code expired for email: {}", email);
            resetCodes.remove(email.toLowerCase());
            return false;
        }
        
        boolean isValid = info.code.equals(code);
        
        if (isValid) {
            logger.info("Reset code verified successfully for email: {}", email);
        } else {
            logger.warn("Invalid reset code provided for email: {}", email);
        }
        
        return isValid;
    }
    
    /**
     * Remove the reset code after successful password reset
     */
    public void removeCode(String email) {
        resetCodes.remove(email.toLowerCase());
        logger.info("Removed reset code for email: {}", email);
    }
    
    /**
     * Check if email has a valid (non-expired) reset code
     */
    public boolean hasValidCode(String email) {
        ResetCodeInfo info = resetCodes.get(email.toLowerCase());
        if (info == null || info.isExpired()) {
            if (info != null && info.isExpired()) {
                resetCodes.remove(email.toLowerCase());
            }
            return false;
        }
        return true;
    }
    
    /**
     * Clean up expired codes
     */
    private void cleanupExpiredCodes() {
        resetCodes.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
}

