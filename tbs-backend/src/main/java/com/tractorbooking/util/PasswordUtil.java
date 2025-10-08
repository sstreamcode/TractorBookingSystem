package com.tractorbooking.util;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class PasswordUtil {
    
    private static final String SALT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom random = new SecureRandom();
    
    /**
     * Generates a random salt
     * @return Base64 encoded salt
     */
    public String generateSalt() {
        StringBuilder salt = new StringBuilder(16);
        for (int i = 0; i < 16; i++) {
            salt.append(SALT_CHARS.charAt(random.nextInt(SALT_CHARS.length())));
        }
        return Base64.getEncoder().encodeToString(salt.toString().getBytes(StandardCharsets.UTF_8));
    }
    
    /**
     * Hashes a password with SHA-256 and optional salt
     * @param password Plain text password
     * @param salt Optional salt (can be null)
     * @return SHA-256 hashed password
     */
    public String hashPassword(String password, String salt) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            
            // Combine password with salt if provided
            String saltedPassword = salt != null ? password + salt : password;
            
            byte[] hash = digest.digest(saltedPassword.getBytes(StandardCharsets.UTF_8));
            
            // Convert to hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
    
    /**
     * Hashes a password with SHA-256 (no salt)
     * @param password Plain text password
     * @return SHA-256 hashed password
     */
    public String hashPassword(String password) {
        return hashPassword(password, null);
    }
    
    /**
     * Verifies a password against a hash
     * @param password Plain text password
     * @param hash Stored hash
     * @param salt Optional salt (can be null)
     * @return true if password matches hash
     */
    public boolean verifyPassword(String password, String hash, String salt) {
        String hashedPassword = hashPassword(password, salt);
        return hashedPassword.equals(hash);
    }
    
    /**
     * Verifies a password against a hash (no salt)
     * @param password Plain text password
     * @param hash Stored hash
     * @return true if password matches hash
     */
    public boolean verifyPassword(String password, String hash) {
        return verifyPassword(password, hash, null);
    }
}
