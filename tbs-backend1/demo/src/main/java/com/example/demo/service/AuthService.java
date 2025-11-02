package com.example.demo.service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.HashUtil;

@Service
public class AuthService {
    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User register(String email, String password, String role) {
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User u = new User();
        // Default name from email prefix; controller may set more specific
        String defaultName = email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : "User";
        u.setName(defaultName);
        u.setEmail(email);
        u.setPasswordHash(HashUtil.sha256(password));
        u.setRole(role == null ? "USER" : role);
        return userRepository.save(u);
    }

    public Optional<User> authenticate(String email, String password) {
        String hash = HashUtil.sha256(password);
        return userRepository.findByEmail(email)
            .filter(u -> u.getPasswordHash().equals(hash));
    }
}


