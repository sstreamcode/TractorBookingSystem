package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Tractor;

@Repository
public interface TractorRepository extends JpaRepository<Tractor, Long> {
}


