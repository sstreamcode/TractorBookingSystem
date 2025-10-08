package com.tractorbooking.service;

import com.tractorbooking.model.Tractor;
import com.tractorbooking.repository.TractorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TractorService {
    
    @Autowired
    private TractorRepository tractorRepository;
    
    public List<Tractor> getAllTractors() {
        return tractorRepository.findAll();
    }
    
    public List<Tractor> getAvailableTractors() {
        return tractorRepository.findByAvailabilityTrue();
    }
    
    public List<Tractor> getAvailableTractorsForBooking(LocalDateTime startDate, LocalDateTime endDate) {
        return tractorRepository.findAvailableTractors(startDate, endDate);
    }
    
    public Optional<Tractor> getTractorById(Long id) {
        return tractorRepository.findById(id);
    }
    
    public Tractor createTractor(Tractor tractor) {
        return tractorRepository.save(tractor);
    }
    
    public Tractor updateTractor(Long id, Tractor tractorDetails) {
        Tractor tractor = tractorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tractor not found"));
        
        tractor.setName(tractorDetails.getName());
        tractor.setModel(tractorDetails.getModel());
        tractor.setHourlyRate(tractorDetails.getHourlyRate());
        tractor.setAvailability(tractorDetails.getAvailability());
        tractor.setDescription(tractorDetails.getDescription());
        tractor.setImageUrl(tractorDetails.getImageUrl());
        
        return tractorRepository.save(tractor);
    }
    
    public void deleteTractor(Long id) {
        Tractor tractor = tractorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tractor not found"));
        tractorRepository.delete(tractor);
    }
    
    public Tractor updateAvailability(Long id, Boolean availability) {
        Tractor tractor = tractorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tractor not found"));
        
        tractor.setAvailability(availability);
        return tractorRepository.save(tractor);
    }
}
