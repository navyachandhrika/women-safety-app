package com.womensafety.backend.controller;

import com.womensafety.backend.dto.SOSRequest;
import com.womensafety.backend.dto.SOSResponse;
import com.womensafety.backend.service.SOSAlertService;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sos")
public class SOSAlertController {

    private final SOSAlertService
            sosAlertService;

    public SOSAlertController(
            SOSAlertService sosAlertService
    ) {
        this.sosAlertService =
                sosAlertService;
    }

    @PostMapping
    public SOSResponse createSOS(
            @Valid
            @RequestBody
            SOSRequest request,
            Authentication authentication
    ) {
        return sosAlertService
                .createSOS(
                        request,
                        authentication
                );
    }

    @GetMapping
    public List<SOSResponse>
    getSOSHistory(
            Authentication authentication
    ) {
        return sosAlertService
                .getSOSHistory(
                        authentication
                );
    }

    @PutMapping("/{id}/location")
    public SOSResponse updateLocation(
            @PathVariable Long id,
            @Valid
            @RequestBody
            SOSRequest request,
            Authentication authentication
    ) {
        return sosAlertService
                .updateLocation(
                        id,
                        request,
                        authentication
                );
    }

    @PutMapping("/{id}/resolve")
    public SOSResponse resolveSOS(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return sosAlertService
                .resolveSOS(
                        id,
                        authentication
                );
    }
}