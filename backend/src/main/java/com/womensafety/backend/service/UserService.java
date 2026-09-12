package com.womensafety.backend.service;

import com.womensafety.backend.dto.LoginRequest;
import com.womensafety.backend.dto.LoginResponse;
import com.womensafety.backend.dto.RegisterRequest;
import com.womensafety.backend.dto.UserResponse;
import com.womensafety.backend.entity.User;
import com.womensafety.backend.exception.EmailAlreadyExistsException;
import com.womensafety.backend.exception.InvalidCredentialsException;
import com.womensafety.backend.repository.UserRepository;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository
            userRepository;

    private final BCryptPasswordEncoder
            passwordEncoder;

    private final JwtService
            jwtService;

    public UserService(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository =
                userRepository;

        this.passwordEncoder =
                passwordEncoder;

        this.jwtService =
                jwtService;
    }

    /*
     * =================================================
     * REGISTER USER
     * =================================================
     */

    @Transactional
    public UserResponse register(
            RegisterRequest request
    ) {

        String normalizedEmail =
                normalizeEmail(
                        request.getEmail()
                );

        if (
                userRepository
                        .findByEmail(
                                normalizedEmail
                        )
                        .isPresent()
        ) {

            throw new EmailAlreadyExistsException(
                    "Email already registered"
            );
        }

        User user =
                new User();

        user.setName(
                request
                        .getName()
                        .trim()
        );

        user.setEmail(
                normalizedEmail
        );

        user.setPhone(
                normalizePhone(
                        request.getPhone()
                )
        );

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        User savedUser =
                userRepository.save(
                        user
                );

        return new UserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhone()
        );
    }

    /*
     * =================================================
     * LOGIN USER
     * =================================================
     */

    public LoginResponse login(
            LoginRequest request
    ) {

        String normalizedEmail =
                normalizeEmail(
                        request.getEmail()
                );

        User user =
                userRepository
                        .findByEmail(
                                normalizedEmail
                        )
                        .orElseThrow(
                                () ->
                                        new InvalidCredentialsException(
                                                "Invalid email or password"
                                        )
                        );

        if (
                !passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                )
        ) {

            throw new InvalidCredentialsException(
                    "Invalid email or password"
            );
        }

        String token =
                jwtService.generateToken(
                        user.getEmail()
                );

        return new LoginResponse(
                token
        );
    }

    /*
     * =================================================
     * EMAIL NORMALIZATION
     * =================================================
     */

    private String normalizeEmail(
            String email
    ) {

        return email
                .trim()
                .toLowerCase();
    }

    /*
     * =================================================
     * PHONE NORMALIZATION
     * =================================================
     */

    private String normalizePhone(
            String phone
    ) {

        String cleaned =
                phone
                        .trim()
                        .replaceAll(
                                "[\\s-]",
                                ""
                        );

        if (
                cleaned.startsWith("+91") &&
                cleaned.length() == 13
        ) {
            return cleaned.substring(3);
        }

        if (
                cleaned.startsWith("91") &&
                cleaned.length() == 12
        ) {
            return cleaned.substring(2);
        }

        return cleaned;
    }
}