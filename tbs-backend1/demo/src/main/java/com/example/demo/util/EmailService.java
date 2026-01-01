package com.example.demo.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.example.demo.model.User;
import com.example.demo.model.Booking;
import com.example.demo.model.Tractor;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a");
    
    @Value("${mail.from}")
    private String fromEmail;
    
    @Value("${mail.from.name}")
    private String fromName;
    
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    // Base email sending method
    public void sendEmail(String toEmail, String toName, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail != null ? fromEmail : "tractorsewa@gmail.com", 
                          fromName != null ? fromName : "Tractor Sewa");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send email to: {}", toEmail, e);
        } catch (Exception e) {
            logger.error("Unexpected error sending email to: {}", toEmail, e);
        }
    }
    
    // Legacy method for backward compatibility
    public void sendBookingNotification(String toEmail, String toName, String subject, String htmlContent) {
        sendEmail(toEmail, toName, subject, htmlContent);
    }
    
    // ========== REGISTRATION EMAILS ==========
    
    public void sendCustomerRegistrationEmail(User user) {
        try {
            String subject = "Welcome to Tractor Sewa! 🚜";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Welcome to Tractor Sewa!",
                "Thank you for registering with Tractor Sewa! Your account has been successfully created. " +
                "You can now browse and book tractors for your agricultural needs.",
                "✅",
                "#d1fae5",
                "<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>" +
                "<h3 style='margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;'>Your Account Details</h3>" +
                "<table style='width: 100%%; border-collapse: collapse;'>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Email:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>" + escapeHtml(user.getEmail()) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Role:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>Customer</td></tr>" +
                "</table></div>" +
                "<div style='margin: 20px 0; padding: 20px; background-color: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 4px;'>" +
                "<p style='margin: 0 0 10px 0; color: #92400e; font-size: 15px; line-height: 1.7;'><strong>Get Started:</strong></p>" +
                "<ul style='margin: 0; padding-left: 20px; color: #92400e; font-size: 15px; line-height: 1.7;'>" +
                "<li>Browse available tractors</li>" +
                "<li>Book tractors for your needs</li>" +
                "<li>Track your bookings in real-time</li>" +
                "<li>Manage your profile and preferences</li>" +
                "</ul></div>"
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send customer registration email", e);
        }
    }
    
    public void sendTractorOwnerRegistrationEmail(User user) {
        try {
            String subject = "Tractor Owner Registration Received - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Tractor Owner",
                "Registration Received",
                "Thank you for registering as a tractor owner on Tractor Sewa! " +
                "Your registration request has been received and is currently pending approval by our super admin. " +
                "You will receive an email notification once your account has been approved.",
                "⏳",
                "#fef3c7",
                "<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>" +
                "<h3 style='margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;'>What happens next?</h3>" +
                "<ul style='margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.7;'>" +
                "<li>Our super admin will review your registration details</li>" +
                "<li>You will receive an email notification once approved</li>" +
                "<li>After approval, you can log in and start listing your tractors</li>" +
                "</ul></div>"
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send tractor owner registration email", e);
        }
    }
    
    public void sendTractorOwnerApprovalEmail(User owner) {
        try {
            String subject = "Tractor Owner Account Approved - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                owner.getName() != null ? owner.getName() : "Tractor Owner",
                "Account Approved",
                "Great news! Your tractor owner account has been approved by our super admin. " +
                "You can now log in to the platform and start listing your tractors. Welcome to Tractor Sewa!",
                "✅",
                "#d1fae5",
                "<div style='margin: 20px 0; padding: 20px; background-color: #d1fae5; border-radius: 8px;'>" +
                "<p style='margin: 0 0 10px 0; color: #065f46; font-size: 15px; line-height: 1.7;'><strong>Next Steps:</strong></p>" +
                "<ul style='margin: 0; padding-left: 20px; color: #065f46; font-size: 15px; line-height: 1.7;'>" +
                "<li>Log in to your account</li>" +
                "<li>Add your tractors to the platform</li>" +
                "<li>Start receiving booking requests</li>" +
                "</ul></div>"
            );
            sendEmail(owner.getEmail(), owner.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send tractor owner approval email", e);
        }
    }
    
    // ========== TRACTOR EMAILS ==========
    
    public void sendNewTractorAddedEmail(Tractor tractor, User owner) {
        try {
            String subject = "New Tractor Added - Pending Approval - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                owner.getName() != null ? owner.getName() : "Tractor Owner",
                "Tractor Added Successfully",
                "Your tractor \"" + escapeHtml(tractor.getName()) + "\" has been added to the platform and is now pending approval by the super admin. " +
                "Once approved, it will be visible to customers and available for booking.",
                "🚜",
                "#fef3c7",
                "<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>" +
                "<h3 style='margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;'>Tractor Details</h3>" +
                "<table style='width: 100%%; border-collapse: collapse;'>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Name:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>" + escapeHtml(tractor.getName()) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Model:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>" + escapeHtml(tractor.getModel()) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Hourly Rate:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>Rs. " + String.format("%.2f", tractor.getHourlyRate()) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Status:</td>" +
                "<td style='padding: 8px 0; color: #f59e0b; font-size: 14px; font-weight: 600;'>Pending Approval</td></tr>" +
                "</table></div>"
            );
            sendEmail(owner.getEmail(), owner.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send new tractor added email", e);
        }
    }
    
    public void sendTractorApprovedEmail(Tractor tractor, User owner) {
        try {
            String subject = "Tractor Approved - Now Live on Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                owner.getName() != null ? owner.getName() : "Tractor Owner",
                "Tractor Approved",
                "Great news! Your tractor \"" + escapeHtml(tractor.getName()) + "\" has been approved by the super admin and is now live on the platform. " +
                "Customers can now view and book your tractor.",
                "✅",
                "#d1fae5",
                "<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>" +
                "<h3 style='margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;'>Tractor Details</h3>" +
                "<table style='width: 100%%; border-collapse: collapse;'>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Name:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>" + escapeHtml(tractor.getName()) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Model:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>" + escapeHtml(tractor.getModel()) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Status:</td>" +
                "<td style='padding: 8px 0; color: #059669; font-size: 14px; font-weight: 600;'>✓ Approved & Live</td></tr>" +
                "</table></div>"
            );
            sendEmail(owner.getEmail(), owner.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send tractor approved email", e);
        }
    }
    
    public void sendTractorRejectedEmail(Tractor tractor, User owner) {
        try {
            String subject = "Tractor Registration Rejected - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                owner.getName() != null ? owner.getName() : "Tractor Owner",
                "Tractor Rejected",
                "We regret to inform you that your tractor \"" + escapeHtml(tractor.getName()) + "\" has been rejected by the super admin. " +
                "Please review your tractor details and contact support if you have any questions.",
                "❌",
                "#fee2e2",
                "<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>" +
                "<h3 style='margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;'>Tractor Details</h3>" +
                "<table style='width: 100%%; border-collapse: collapse;'>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Name:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>" + escapeHtml(tractor.getName()) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Model:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>" + escapeHtml(tractor.getModel()) + "</td></tr>" +
                "</table></div>"
            );
            sendEmail(owner.getEmail(), owner.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send tractor rejected email", e);
        }
    }
    
    // ========== BOOKING EMAILS ==========
    
    public void sendBookingCreatedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            Tractor tractor = booking.getTractor();
            String subject = "Booking Confirmation - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Booking Created",
                "Your booking has been successfully created and is pending approval. " +
                "You will receive an email notification once your booking is approved.",
                "📋",
                "#fef3c7",
                formatBookingDetails(booking, tractor)
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking created email", e);
        }
    }
    
    public void sendBookingApprovedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            Tractor tractor = booking.getTractor();
            String subject = "Booking Approved - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Booking Approved",
                "Great news! Your booking has been approved. " +
                "Your tractor will be delivered to the specified location. You will receive updates as the delivery progresses.",
                "✅",
                "#d1fae5",
                formatBookingDetails(booking, tractor)
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking approved email", e);
        }
    }
    
    public void sendBookingDeniedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            Tractor tractor = booking.getTractor();
            String subject = "Booking Denied - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Booking Denied",
                "We regret to inform you that your booking has been denied. " +
                "If you have any questions, please contact our support team.",
                "❌",
                "#fee2e2",
                formatBookingDetails(booking, tractor)
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking denied email", e);
        }
    }
    
    public void sendBookingCancelledEmail(Booking booking) {
        try {
            User user = booking.getUser();
            Tractor tractor = booking.getTractor();
            String subject = "Booking Cancelled - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Booking Cancelled",
                "Your booking has been cancelled. " +
                "If you have any questions or need assistance, please contact our support team.",
                "🚫",
                "#fee2e2",
                formatBookingDetails(booking, tractor)
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking cancelled email", e);
        }
    }
    
    public void sendBookingPaidEmail(Booking booking) {
        try {
            User user = booking.getUser();
            Tractor tractor = booking.getTractor();
            String subject = "Payment Confirmed - Booking Approved - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Payment Confirmed & Booking Approved",
                "Your payment has been confirmed and your booking has been automatically approved! " +
                "Your booking is now active. We will notify you when your tractor is on the way.",
                "💳",
                "#d1fae5",
                formatBookingDetails(booking, tractor)
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking paid email", e);
        }
    }
    
    public void sendBookingDeliveredEmail(Booking booking) {
        try {
            User user = booking.getUser();
            Tractor tractor = booking.getTractor();
            String subject = "Tractor Delivered - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Tractor Delivered",
                "Your tractor has been successfully delivered to your location. " +
                "You can now start using it. Please ensure to return it on time.",
                "🚜",
                "#d1fae5",
                formatBookingDetails(booking, tractor)
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking delivered email", e);
        }
    }
    
    public void sendBookingCompletedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            Tractor tractor = booking.getTractor();
            String subject = "Booking Completed - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Booking Completed",
                "Your booking has been completed successfully. Thank you for using Tractor Sewa! " +
                "We hope you had a great experience. Please consider leaving a review.",
                "🎉",
                "#dbeafe",
                formatBookingDetails(booking, tractor)
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send booking completed email", e);
        }
    }
    
    public void sendDeliveryStatusChangeEmail(Booking booking, String previousStatus, String newStatus) {
        try {
            User user = booking.getUser();
            Tractor tractor = booking.getTractor();
            String statusMessage = getDeliveryStatusMessage(newStatus);
            String statusIcon = getDeliveryStatusIcon(newStatus);
            String statusColor = getDeliveryStatusColor(newStatus);
            
            String subject = "Delivery Status Update - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Delivery Status Updated",
                statusMessage,
                statusIcon,
                statusColor,
                formatBookingDetails(booking, tractor) +
                "<div style='background-color: #f9fafb; border-radius: 6px; padding: 15px; margin: 20px 0;'>" +
                "<p style='margin: 0; color: #6b7280; font-size: 14px;'><strong>Status:</strong> " +
                "<span style='color: #1f2937;'>" + previousStatus + " → " + newStatus + "</span></p>" +
                "</div>"
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send delivery status change email", e);
        }
    }
    
    // ========== PAYMENT EMAILS ==========
    
    public void sendPaymentReleaseEmail(Booking booking, double commissionAmount, double ownerAmount) {
        try {
            User owner = booking.getTractor().getOwner();
            if (owner == null) return;
            
            String subject = "Payment Released - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                owner.getName() != null ? owner.getName() : "Tractor Owner",
                "Payment Released",
                "Your payment for booking #" + booking.getId() + " has been released. " +
                "The commission has been deducted and your amount has been transferred.",
                "💰",
                "#d1fae5",
                "<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>" +
                "<h3 style='margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;'>Payment Details</h3>" +
                "<table style='width: 100%%; border-collapse: collapse;'>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Booking ID:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>#" + booking.getId() + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Total Amount:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>Rs. " + String.format("%.2f", booking.getTotalAmount()) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Commission (15%%):</td>" +
                "<td style='padding: 8px 0; color: #dc2626; font-size: 14px;'>- Rs. " + String.format("%.2f", commissionAmount) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Your Amount:</td>" +
                "<td style='padding: 8px 0; color: #059669; font-size: 16px; font-weight: 700;'>Rs. " + String.format("%.2f", ownerAmount) + "</td></tr>" +
                "</table></div>"
            );
            sendEmail(owner.getEmail(), owner.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send payment release email", e);
        }
    }
    
    public void sendRefundRequestedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            String subject = "Refund Request Submitted - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Refund Request Submitted",
                "Your refund request for booking #" + booking.getId() + " has been submitted and is pending admin approval. " +
                "You will receive an email notification once the refund is processed.",
                "💰",
                "#e0e7ff",
                formatBookingDetails(booking, booking.getTractor())
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send refund requested email", e);
        }
    }
    
    public void sendRefundApprovedEmail(Booking booking, double refundAmount, double fee) {
        try {
            User user = booking.getUser();
            String subject = "Refund Approved - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Refund Approved",
                "Your refund request has been approved. A refund of Rs. " + String.format("%.2f", refundAmount) + 
                " (after 3%% cancellation fee) will be processed to your account.",
                "✅",
                "#d1fae5",
                formatBookingDetails(booking, booking.getTractor()) +
                "<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>" +
                "<h3 style='margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;'>Refund Details</h3>" +
                "<table style='width: 100%%; border-collapse: collapse;'>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Original Amount:</td>" +
                "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>Rs. " + String.format("%.2f", booking.getTotalAmount()) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Cancellation Fee (3%%):</td>" +
                "<td style='padding: 8px 0; color: #dc2626; font-size: 14px;'>- Rs. " + String.format("%.2f", fee) + "</td></tr>" +
                "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Refund Amount:</td>" +
                "<td style='padding: 8px 0; color: #059669; font-size: 16px; font-weight: 700;'>Rs. " + String.format("%.2f", refundAmount) + "</td></tr>" +
                "</table></div>"
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send refund approved email", e);
        }
    }
    
    public void sendRefundRejectedEmail(Booking booking) {
        try {
            User user = booking.getUser();
            String subject = "Refund Request Rejected - Tractor Sewa";
            String htmlContent = buildBrandedTemplate(
                user.getName() != null ? user.getName() : "Customer",
                "Refund Request Rejected",
                "We regret to inform you that your refund request for booking #" + booking.getId() + " has been rejected. " +
                "If you have any questions, please contact our support team.",
                "❌",
                "#fee2e2",
                formatBookingDetails(booking, booking.getTractor())
            );
            sendEmail(user.getEmail(), user.getName(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Failed to send refund rejected email", e);
        }
    }
    
    // ========== HELPER METHODS ==========
    
    private String formatBookingDetails(Booking booking, Tractor tractor) {
        StringBuilder details = new StringBuilder();
        details.append("<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>");
        details.append("<h3 style='margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;'>Booking Details</h3>");
        details.append("<table style='width: 100%%; border-collapse: collapse;'>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Booking ID:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>#").append(booking.getId()).append("</td></tr>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Tractor:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(escapeHtml(tractor.getName())).append("</td></tr>");
        
        long hours = java.time.Duration.between(booking.getStartAt(), booking.getEndAt()).toHours();
        long minutes = java.time.Duration.between(booking.getStartAt(), booking.getEndAt()).toMinutes() % 60;
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Duration:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(hours).append(" hour(s)");
        if (minutes > 0) details.append(" ").append(minutes).append(" minute(s)");
        details.append("</td></tr>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Start Date:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(booking.getStartAt().format(DATE_FORMATTER)).append("</td></tr>");
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>End Date:</td>");
        details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(booking.getEndAt().format(DATE_FORMATTER)).append("</td></tr>");
        
        if (booking.getDeliveryAddress() != null) {
            details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Delivery Address:</td>");
            details.append("<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>").append(escapeHtml(booking.getDeliveryAddress())).append("</td></tr>");
        }
        
        details.append("<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Total Amount:</td>");
        details.append("<td style='padding: 8px 0; color: #059669; font-size: 16px; font-weight: 700;'>Rs. ").append(String.format("%.2f", booking.getTotalAmount())).append("</td></tr>");
        
        details.append("</table></div>");
        return details.toString();
    }
    
    private String getDeliveryStatusMessage(String status) {
        if (status == null) return "Delivery status updated.";
        return switch (status.toUpperCase()) {
            case "ORDERED" -> "Your tractor order has been confirmed and is being prepared for delivery.";
            case "DELIVERING" -> "Your tractor is on the way! You can track its location in real-time.";
            case "DELIVERED" -> "Your tractor has been successfully delivered to your location.";
            case "RETURNED" -> "The tractor has been returned. Thank you for using Tractor Sewa!";
            default -> "Delivery status updated to " + status + ".";
        };
    }
    
    private String getDeliveryStatusIcon(String status) {
        if (status == null) return "📋";
        return switch (status.toUpperCase()) {
            case "ORDERED" -> "📦";
            case "DELIVERING" -> "🚚";
            case "DELIVERED" -> "✅";
            case "RETURNED" -> "🔄";
            default -> "📋";
        };
    }
    
    private String getDeliveryStatusColor(String status) {
        if (status == null) return "#f3f4f6";
        return switch (status.toUpperCase()) {
            case "ORDERED" -> "#fef3c7";
            case "DELIVERING" -> "#dbeafe";
            case "DELIVERED" -> "#d1fae5";
            case "RETURNED" -> "#e0e7ff";
            default -> "#f3f4f6";
        };
    }
    
    // ========== BRANDED TEMPLATE ==========
    
    private String buildBrandedTemplate(String userName, String title, String message, String icon, String statusColor, String additionalContent) {
        // Escape % characters first, then escape HTML
        String safeUserName = escapeHtml(userName != null ? userName : "User").replace("%", "%%");
        String safeTitle = escapeHtml(title != null ? title : "").replace("%", "%%");
        String safeMessage = escapeHtml(message != null ? message : "").replace("%", "%%");
        String safeIcon = icon != null ? icon : "📋";
        String safeStatusColor = statusColor != null ? statusColor : "#f3f4f6";
        String safeAdditionalContent = additionalContent != null ? additionalContent : "";
        
        try {
            return String.format("""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s - Tractor Sewa</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table role="presentation" style="width: 100%%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" style="max-width: 600px; width: 100%%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                                    <!-- Header with Orange/Black Branding -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #f59e0b 0%%, #d97706 50%%, #1f2937 100%%); padding: 30px 20px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🚜 Tractor Sewa</h1>
                                            <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Secure Rental Platform</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Hello <strong>%s</strong>,</p>
                                            
                                            <div style="background-color: %s; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
                                                <div style="display: flex; align-items: center; gap: 10px;">
                                                    <span style="font-size: 24px;">%s</span>
                                                    <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">%s</h2>
                                                </div>
                                            </div>
                                            
                                            <p style="margin: 20px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">%s</p>
                                            
                                            %s
                                            
                                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                                <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                                                    If you have any questions or concerns, please don't hesitate to contact our support team at <a href="mailto:tractorsewa@gmail.com" style="color: #f59e0b; text-decoration: none;">tractorsewa@gmail.com</a>.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #1f2937; padding: 25px 30px; text-align: center; border-top: 3px solid #f59e0b;">
                                            <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 13px;">
                                                <strong style="color: #f59e0b;">Tractor Sewa</strong><br>
                                                <span style="color: #9ca3af;">Secure Rental Platform</span>
                                            </p>
                                            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
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
                """, safeTitle, safeUserName, safeStatusColor, safeIcon, safeTitle, safeMessage, safeAdditionalContent);
        } catch (Exception e) {
            logger.error("Error building branded email template: {}", e.getMessage(), e);
            return "<html><body><h2>" + safeTitle + "</h2><p>" + safeMessage + "</p></body></html>";
        }
    }
    
    // Legacy method for backward compatibility
    public String buildEmailTemplate(String userName, String title, String message, String status, String bookingDetails) {
        String statusColor = getStatusColor(status);
        String statusIcon = getStatusIcon(status);
        return buildBrandedTemplate(userName, title, message, statusIcon, statusColor, bookingDetails);
    }
    
    private String getStatusColor(String status) {
        if (status == null) return "#f3f4f6";
        return switch (status.toUpperCase()) {
            case "PENDING", "PENDING_APPROVAL" -> "#fef3c7";
            case "APPROVED", "PAID", "DELIVERED" -> "#d1fae5";
            case "COMPLETED" -> "#dbeafe";
            case "DENIED", "CANCELLED" -> "#fee2e2";
            case "REFUND_REQUESTED" -> "#e0e7ff";
            case "RETRIEVAL_REMINDER" -> "#fef3c7";
            default -> "#f3f4f6";
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
    
    // ========== CONTACT FORM EMAIL ==========
    
    public void sendContactFormEmail(String firstName, String lastName, String email, String phone, String subject, String message) throws Exception {
        try {
            if (mailSender == null) {
                logger.error("MailSender is not configured");
                throw new RuntimeException("Email service is not configured");
            }
            
            MimeMessage messageObj = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(messageObj, true, "UTF-8");
            
            helper.setFrom(fromEmail != null ? fromEmail : "tractorsewa@gmail.com", fromName != null ? fromName : "Tractor Sewa");
            helper.setTo("tractorsewa@gmail.com");
            helper.setSubject("Contact Form: " + (subject != null ? subject : "No Subject"));
            
            String emailContent = buildContactFormEmailTemplate(
                firstName != null ? firstName : "",
                lastName != null ? lastName : "",
                email != null ? email : "",
                phone != null ? phone : "",
                subject != null ? subject : "",
                message != null ? message : ""
            );
            helper.setText(emailContent, true);
            
            mailSender.send(messageObj);
            logger.info("Contact form email sent successfully from: {}", email);
        } catch (MessagingException e) {
            logger.error("Failed to send contact form email from: {} - Error: {}", email, e.getMessage(), e);
            throw new Exception("Failed to send email: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error sending contact form email from: {} - Error: {}", email, e.getMessage(), e);
            throw e;
        }
    }
    
    private String buildContactFormEmailTemplate(String firstName, String lastName, String email, String phone, String subject, String message) {
        String fullName = (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
        String phoneDisplay = (phone != null && !phone.isEmpty()) ? phone : "Not provided";
        
        String rawSubject = subject != null ? subject : "";
        String rawFullName = fullName.trim();
        String rawEmail = email != null ? email : "";
        String rawPhone = phoneDisplay;
        String rawMessage = message != null ? message : "";
        
        String safeSubject = escapeHtml(rawSubject.replace("%", "%%"));
        String safeFullName = escapeHtml(rawFullName.replace("%", "%%"));
        String safeEmail = escapeHtml(rawEmail.replace("%", "%%"));
        String safePhone = escapeHtml(rawPhone.replace("%", "%%"));
        String safeMessage = escapeHtml(rawMessage.replace("%", "%%")).replace("\n", "<br>");
        
        try {
            return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Contact Form Submission</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table role="presentation" style="width: 100%%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" style="max-width: 600px; width: 100%%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); padding: 30px 20px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">📧 New Contact Form Submission</h1>
                                        <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Tractor Sewa</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">%s</h2>
                                        
                                        <div style="background-color: #f9fafb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                            <table style="width: 100%%; border-collapse: collapse;">
                                                <tr>
                                                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px; font-weight: 600; width: 120px;">Name:</td>
                                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">%s</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px; font-weight: 600;">Email:</td>
                                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="mailto:%s" style="color: #f59e0b; text-decoration: none;">%s</a></td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #4b5563; font-size: 14px; font-weight: 600;">Phone:</td>
                                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">%s</td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <div style="margin: 30px 0;">
                                            <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">Message:</h3>
                                            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 4px; color: #4b5563; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">%s</div>
                                        </div>
                                        
                                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                            <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                                                This email was sent from the Tractor Sewa contact form. Please respond directly to the sender's email address.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #1f2937; padding: 25px 30px; text-align: center; border-top: 3px solid #f59e0b;">
                                        <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 13px;">
                                            <strong style="color: #f59e0b;">Tractor Sewa</strong><br>
                                            <span style="color: #9ca3af;">Secure Rental Platform</span>
                                        </p>
                                        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
                                            Automated notification from contact form.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """, safeSubject, safeFullName, safeEmail, safeEmail, safePhone, safeMessage);
        } catch (Exception e) {
            logger.error("Error building email template: {}", e.getMessage(), e);
            return buildSimpleContactFormEmail(firstName, lastName, email, phone, subject, message);
        }
    }
    
    private String buildSimpleContactFormEmail(String firstName, String lastName, String email, String phone, String subject, String message) {
        return String.format(
            "<html><body>" +
            "<h2>Contact Form Submission</h2>" +
            "<p><strong>Subject:</strong> %s</p>" +
            "<p><strong>Name:</strong> %s %s</p>" +
            "<p><strong>Email:</strong> %s</p>" +
            "<p><strong>Phone:</strong> %s</p>" +
            "<p><strong>Message:</strong></p>" +
            "<p>%s</p>" +
            "</body></html>",
            escapeHtml(subject != null ? subject : ""),
            escapeHtml(firstName != null ? firstName : ""),
            escapeHtml(lastName != null ? lastName : ""),
            escapeHtml(email != null ? email : ""),
            escapeHtml(phone != null && !phone.isEmpty() ? phone : "Not provided"),
            escapeHtml(message != null ? message : "").replace("\n", "<br>")
        );
    }
    
    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
