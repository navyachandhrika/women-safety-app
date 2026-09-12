package com.womensafety.backend.controller;

import com.womensafety.backend.dto.SafetyLocationUpdateRequest;
import com.womensafety.backend.dto.SafetySessionRequest;
import com.womensafety.backend.dto.SafetySessionResponse;
import com.womensafety.backend.service.SafetySessionService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/safety-journeys")
public class SafetySessionController {

    private final SafetySessionService safetySessionService;

    public SafetySessionController(
            SafetySessionService safetySessionService
    ) {
        this.safetySessionService = safetySessionService;
    }

    @PostMapping
    public SafetySessionResponse startJourney(
            @Valid @RequestBody SafetySessionRequest request,
            Authentication authentication
    ) {
        return safetySessionService.startJourney(
                request,
                authentication
        );
    }

    @GetMapping("/active")
    public ResponseEntity<SafetySessionResponse> getActiveJourney(
            Authentication authentication
    ) {
        SafetySessionResponse journey =
                safetySessionService.getActiveJourney(
                        authentication
                );

        if (journey == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(journey);
    }

    @PutMapping("/{id}/location")
    public SafetySessionResponse updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody SafetyLocationUpdateRequest request,
            Authentication authentication
    ) {
        return safetySessionService.updateLocation(
                id,
                request.getLatitude(),
                request.getLongitude(),
                authentication
        );
    }

    @PutMapping("/{id}/safe")
    public SafetySessionResponse markSafe(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return safetySessionService.markSafe(
                id,
                authentication
        );
    }

    @PutMapping("/{id}/sos")
    public SafetySessionResponse triggerSOSNow(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return safetySessionService.triggerSOSNow(
                id,
                authentication
        );
    }
}