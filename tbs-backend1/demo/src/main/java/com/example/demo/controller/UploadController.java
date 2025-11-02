package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private static final Path UPLOAD_DIR = Path.of("uploads");

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
        }
        Files.createDirectories(UPLOAD_DIR);
        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot);
        String storedName = "img_" + Instant.now().toEpochMilli() + ext.toLowerCase();
        Path target = UPLOAD_DIR.resolve(storedName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(storedName)
                .toUriString();
        return ResponseEntity.ok(Map.of("url", url, "filename", storedName));
    }

    @DeleteMapping("/{filename}")
    public ResponseEntity<?> delete(@PathVariable("filename") String filename) throws IOException {
        if (filename == null || filename.contains("..")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename"));
        }
        Files.createDirectories(UPLOAD_DIR);
        Path target = UPLOAD_DIR.resolve(filename);
        if (Files.exists(target)) {
            Files.delete(target);
        }
        return ResponseEntity.noContent().build();
    }
}


