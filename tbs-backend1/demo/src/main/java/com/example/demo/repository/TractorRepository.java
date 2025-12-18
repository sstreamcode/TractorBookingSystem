package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Tractor;
import com.example.demo.model.User;
import java.util.List;

@Repository
public interface TractorRepository extends JpaRepository<Tractor, Long> {
    List<Tractor> findByOwner(User owner);
}


