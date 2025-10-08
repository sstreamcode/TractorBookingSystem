package com.tractorbooking.controller;

import com.tractorbooking.model.Tractor;
import com.tractorbooking.service.TractorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tractors")
@CrossOrigin(origins = "*")
public class TractorController {
    
    @Autowired
    private TractorService tractorService;
    
    @GetMapping
    public ResponseEntity<List<Tractor>> getAllTractors() {
        List<Tractor> tractors = tractorService.getAllTractors();
        return ResponseEntity.ok(tractors);
    }
    
    @GetMapping("/available")
    public ResponseEntity<List<Tractor>> getAvailableTractors() {
        List<Tractor> tractors = tractorService.getAvailableTractors();
        return ResponseEntity.ok(tractors);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Tractor> getTractorById(@PathVariable Long id) {
        Optional<Tractor> tractor = tractorService.getTractorById(id);
        return tractor.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tractor> createTractor(@RequestBody Tractor tractor) {
        try {
            Tractor createdTractor = tractorService.createTractor(tractor);
            return ResponseEntity.ok(createdTractor);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tractor> updateTractor(@PathVariable Long id, @RequestBody Tractor tractor) {
        try {
            Tractor updatedTractor = tractorService.updateTractor(id, tractor);
            return ResponseEntity.ok(updatedTractor);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTractor(@PathVariable Long id) {
        try {
            tractorService.deleteTractor(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/availability")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tractor> updateAvailability(@PathVariable Long id, @RequestBody Boolean availability) {
        try {
            Tractor updatedTractor = tractorService.updateAvailability(id, availability);
            return ResponseEntity.ok(updatedTractor);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
