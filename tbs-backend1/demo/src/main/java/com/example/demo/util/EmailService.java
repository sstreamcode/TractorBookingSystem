package com.example.demo.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    @Value("${mail.from}")
    private String fromEmail;
    
    @Value("${mail.from.name}")
    private String fromName;
    
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    public void sendBookingNotification(String toEmail, String toName, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send email to: {}", toEmail, e);
            // Don't throw exception to prevent breaking the booking flow
        } catch (Exception e) {
            logger.error("Unexpected error sending email to: {}", toEmail, e);
        }
    }
    
    public String buildEmailTemplate(String userName, String title, String message, String status, String bookingDetails) {
        String statusColor = getStatusColor(status);
        String statusIcon = getStatusIcon(status);
        
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" style="max-width: 600px; width: 100%%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #10b981 0%%, #059669 50%%, #06b6d4 100%%); padding: 30px 20px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Tractor Sewa</h1>
                                        <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Secure Rental Platform</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Hello <strong>%s</strong>,</p>
                                        
                                        <div style="background-color: %s; border-left: 4px solid %s; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <span style="font-size: 24px;">%s</span>
                                                <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">%s</h2>
                                            </div>
                                        </div>
                                        
                                        <p style="margin: 20px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">%s</p>
                                        
                                        %s
                                        
                                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                                                If you have any questions or concerns, please don't hesitate to contact our support team.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                                            <strong>Tractor Sewa</strong><br>
                                            Secure Rental Platform
                                        </p>
                                        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                                            This is an automated email. Please do not reply to this message.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """, title, userName, statusColor, statusColor, statusIcon, title, message, bookingDetails);
    }
    
    private String getStatusColor(String status) {
        if (status == null) return "#f3f4f6";
        
        return switch (status.toUpperCase()) {
            case "PENDING", "PENDING_APPROVAL" -> "#fef3c7"; // Yellow
            case "APPROVED", "PAID", "DELIVERED" -> "#d1fae5"; // Green
            case "COMPLETED" -> "#dbeafe"; // Blue
            case "DENIED", "CANCELLED" -> "#fee2e2"; // Red
            case "REFUND_REQUESTED" -> "#e0e7ff"; // Blue
            case "RETRIEVAL_REMINDER" -> "#fef3c7"; // Yellow for reminders
            default -> "#f3f4f6"; // Gray
        };
    }
    
    private String getStatusIcon(String status) {
        if (status == null) return "📋";
        
        return switch (status.toUpperCase()) {
            case "PENDING", "PENDING_APPROVAL" -> "⏳";
            case "APPROVED" -> "✅";
            case "PAID" -> "💳";
            case "DELIVERED" -> "🚜";
            case "COMPLETED" -> "🎉";
            case "DENIED" -> "❌";
            case "CANCELLED" -> "🚫";
            case "REFUND_REQUESTED" -> "💰";
            case "RETRIEVAL_REMINDER" -> "⚠️";
            default -> "📋";
        };
    }
}

