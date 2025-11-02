package com.example.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Tractor;
import com.example.demo.repository.TractorRepository;

@Service
public class TractorService {
    private final TractorRepository tractorRepository;

    public TractorService(TractorRepository tractorRepository) {
        this.tractorRepository = tractorRepository;
    }

    public List<Tractor> getAll() {
        return tractorRepository.findAll();
    }

    public Optional<Tractor> getById(Long id) {
        return tractorRepository.findById(id);
    }

    @Transactional
    public Tractor create(Tractor tractor) {
        return tractorRepository.save(tractor);
    }

    @Transactional
    public boolean update(Long id, Tractor tractor) {
        if (!tractorRepository.existsById(id)) return false;
        tractor.setId(id);
        tractorRepository.save(tractor);
        return true;
    }

    @Transactional
    public boolean delete(Long id) {
        if (!tractorRepository.existsById(id)) return false;
        tractorRepository.deleteById(id);
        return true;
    }
}


