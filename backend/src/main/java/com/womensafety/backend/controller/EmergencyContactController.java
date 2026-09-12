package com.womensafety.backend.controller;

import com.womensafety.backend.dto.EmergencyContactRequest;
import com.womensafety.backend.dto.EmergencyContactResponse;
import com.womensafety.backend.service.EmergencyContactService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class EmergencyContactController {

    private final EmergencyContactService emergencyContactService;

    public EmergencyContactController(
            EmergencyContactService emergencyContactService
    ) {
        this.emergencyContactService =
                emergencyContactService;
    }

    @GetMapping
    public List<EmergencyContactResponse> getContacts(
            Authentication authentication
    ) {
        return emergencyContactService.getContacts(
                authentication
        );
    }

    @PostMapping
    public ResponseEntity<EmergencyContactResponse> createContact(
            @Valid @RequestBody EmergencyContactRequest request,
            Authentication authentication
    ) {

        EmergencyContactResponse response =
                emergencyContactService.createContact(
                        request,
                        authentication
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{id}")
    public EmergencyContactResponse updateContact(
            @PathVariable Long id,
            @Valid @RequestBody EmergencyContactRequest request,
            Authentication authentication
    ) {

        return emergencyContactService.updateContact(
                id,
                request,
                authentication
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(
            @PathVariable Long id,
            Authentication authentication
    ) {

        emergencyContactService.deleteContact(
                id,
                authentication
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}