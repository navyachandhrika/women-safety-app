package com.womensafety.backend.controller;

import com.womensafety.backend.dto.LoginRequest;
import com.womensafety.backend.dto.LoginResponse;
import com.womensafety.backend.dto.RegisterRequest;
import com.womensafety.backend.dto.UserResponse;
import com.womensafety.backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(
            UserService userService
    ) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public UserResponse register(
            @Valid
            @RequestBody
            RegisterRequest request
    ) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid
            @RequestBody
            LoginRequest request
    ) {
        return userService.login(request);
    }
}