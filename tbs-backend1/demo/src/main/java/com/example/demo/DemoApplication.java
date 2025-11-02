package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.util.HashUtil;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

    @Bean
    public org.springframework.boot.CommandLineRunner seedAdmin(UserRepository users) {
        return args -> {
            String adminEmail = "admin@tbs.local";
            if (!users.existsByEmail(adminEmail)) {
                User admin = new User();
                admin.setName("Administrator");
                admin.setEmail(adminEmail);
                admin.setPasswordHash(HashUtil.sha256("admin123"));
                admin.setRole("ADMIN");
                users.save(admin);
            }
        };
    }

    @Bean
    public WebMvcConfigurer staticUploads() {
        return new WebMvcConfigurer() {
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                registry.addResourceHandler("/uploads/**")
                        .addResourceLocations("file:uploads/");
            }
        };
    }
}
