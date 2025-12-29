package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Booking;
import com.example.demo.model.Tractor;
import com.example.demo.model.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.TractorRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.EmailService;

@Service
public class BookingSchedulerService {
    private static final Logger logger = LoggerFactory.getLogger(BookingSchedulerService.class);
    
    private final BookingRepository bookingRepository;
    private final TractorRepository tractorRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    public BookingSchedulerService(
            BookingRepository bookingRepository,
            TractorRepository tractorRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.tractorRepository = tractorRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
    
    /**
     * Check every minute for bookings that need retrieval reminders (30 minutes before end)
     */
    @Scheduled(fixedRate = 60000) // Run every minute
    @Transactional
    public void sendRetrievalReminders() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime reminderTime = now.plusMinutes(30);
            
            List<Booking> bookingsNeedingReminder = bookingRepository.findBookingsNeedingReminder(now, reminderTime);
            
            for (Booking booking : bookingsNeedingReminder) {
                try {
                    Tractor tractor = booking.getTractor();
                    User admin = userRepository.findByEmail("admin@tbs.local").orElse(null);
                    
                    if (admin == null) {
                        logger.warn("Admin user not found for retrieval reminder");
                        continue;
                    }
                    
                    String customerName = booking.getUser().getName();
                    String tractorName = tractor.getName();
                    String deliveryAddress = booking.getDeliveryAddress() != null 
                        ? booking.getDeliveryAddress() 
                        : "Location not specified";
                    String endTime = booking.getEndAt().toString();
                    
                    String subject = "⚠️ Tractor Retrieval Reminder - " + tractorName;
                    String message = String.format(
                        "This is a reminder that tractor <strong>%s</strong> needs to be retrieved from the customer location.<br><br>" +
                        "<strong>Customer:</strong> %s<br>" +
                        "<strong>Delivery Location:</strong> %s<br>" +
                        "<strong>Booking Ends:</strong> %s<br><br>" +
                        "Please arrange to retrieve the tractor before the booking end time.",
                        tractorName, customerName, deliveryAddress, endTime
                    );
                    
                    String bookingDetails = String.format(
                        "<div style='background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;'>" +
                        "<table style='width: 100%%; border-collapse: collapse;'>" +
                        "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Booking ID:</td>" +
                        "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>#%d</td></tr>" +
                        "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Tractor:</td>" +
                        "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>%s</td></tr>" +
                        "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Customer:</td>" +
                        "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>%s</td></tr>" +
                        "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Delivery Location:</td>" +
                        "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>%s</td></tr>" +
                        "<tr><td style='padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;'>Booking End Time:</td>" +
                        "<td style='padding: 8px 0; color: #1f2937; font-size: 14px;'>%s</td></tr>" +
                        "</table></div>",
                        booking.getId(), tractorName, customerName, deliveryAddress, endTime
                    );
                    
                    String htmlContent = emailService.buildEmailTemplate(
                        admin.getName(),
                        subject,
                        message,
                        "RETRIEVAL_REMINDER",
                        bookingDetails
                    );
                    
                    emailService.sendBookingNotification(admin.getEmail(), admin.getName(), subject, htmlContent);
                    
                    // Mark reminder as sent
                    booking.setRetrievalReminderSent(true);
                    bookingRepository.save(booking);
                    
                    logger.info("Retrieval reminder sent for booking ID: {}", booking.getId());
                } catch (Exception e) {
                    logger.error("Error sending retrieval reminder for booking ID: {}", booking.getId(), e);
                }
            }
        } catch (Exception e) {
            logger.error("Error in sendRetrievalReminders scheduler", e);
        }
    }
    
    /**
     * DISABLED: Auto-complete bookings functionality
     * Status changes are now manual and controlled by tractor owner
     * This method is kept for reference but disabled to prevent automatic status changes
     */
    // @Scheduled(fixedRate = 300000) // Run every 5 minutes - DISABLED
    // @Transactional
    // public void autoCompleteBookings() {
    //     // DISABLED: All status changes must be manual by tractor owner
    //     // Tractor owner must manually:
    //     // 1. Mark tractor as RETURNED via update delivery status
    //     // 2. Mark booking as COMPLETED via mark-completed endpoint (after customer stops timer)
    // }
}

