package com.womensafety.backend.service;

import com.womensafety.backend.dto.EmergencyContactRequest;
import com.womensafety.backend.dto.EmergencyContactResponse;
import com.womensafety.backend.entity.EmergencyContact;
import com.womensafety.backend.entity.User;
import com.womensafety.backend.exception.ResourceNotFoundException;
import com.womensafety.backend.repository.EmergencyContactRepository;
import com.womensafety.backend.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmergencyContactService {

    private final EmergencyContactRepository emergencyContactRepository;
    private final UserRepository userRepository;

    public EmergencyContactService(
            EmergencyContactRepository emergencyContactRepository,
            UserRepository userRepository
    ) {
        this.emergencyContactRepository =
                emergencyContactRepository;

        this.userRepository =
                userRepository;
    }

    /*
     * =================================================
     * GET ALL CONTACTS
     * =================================================
     */

    public List<EmergencyContactResponse> getContacts(
            Authentication authentication
    ) {
        User user =
                getCurrentUser(authentication);

        return emergencyContactRepository
                .findByUserIdOrderByIdDesc(
                        user.getId()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /*
     * =================================================
     * CREATE CONTACT
     * =================================================
     */

    @Transactional
    public EmergencyContactResponse createContact(
            EmergencyContactRequest request,
            Authentication authentication
    ) {
        User user =
                getCurrentUser(authentication);

        EmergencyContact contact =
                new EmergencyContact();

        contact.setName(
                request
                        .getName()
                        .trim()
        );

        contact.setPhone(
                normalizePhone(
                        request.getPhone()
                )
        );

        contact.setUser(user);

        EmergencyContact savedContact =
                emergencyContactRepository
                        .save(contact);

        return toResponse(
                savedContact
        );
    }

    /*
     * =================================================
     * UPDATE CONTACT
     * =================================================
     */

    @Transactional
    public EmergencyContactResponse updateContact(
            Long id,
            EmergencyContactRequest request,
            Authentication authentication
    ) {
        User user =
                getCurrentUser(authentication);

        EmergencyContact contact =
                emergencyContactRepository
                        .findByIdAndUserId(
                                id,
                                user.getId()
                        )
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Emergency contact not found"
                                        )
                        );

        contact.setName(
                request
                        .getName()
                        .trim()
        );

        contact.setPhone(
                normalizePhone(
                        request.getPhone()
                )
        );

        EmergencyContact updatedContact =
                emergencyContactRepository
                        .save(contact);

        return toResponse(
                updatedContact
        );
    }

    /*
     * =================================================
     * DELETE CONTACT
     * =================================================
     */

    @Transactional
    public void deleteContact(
            Long id,
            Authentication authentication
    ) {
        User user =
                getCurrentUser(authentication);

        EmergencyContact contact =
                emergencyContactRepository
                        .findByIdAndUserId(
                                id,
                                user.getId()
                        )
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Emergency contact not found"
                                        )
                        );

        emergencyContactRepository
                .delete(contact);
    }

    /*
     * =================================================
     * GET CURRENT AUTHENTICATED USER
     * =================================================
     */

    private User getCurrentUser(
            Authentication authentication
    ) {
        if (
                authentication == null ||
                authentication.getName() == null
        ) {
            throw new IllegalArgumentException(
                    "User is not authenticated"
            );
        }

        String email =
                authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "User not found"
                                )
                );
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

    /*
     * =================================================
     * ENTITY -> RESPONSE DTO
     * =================================================
     */

    private EmergencyContactResponse toResponse(
            EmergencyContact contact
    ) {
        return new EmergencyContactResponse(
                contact.getId(),
                contact.getName(),
                contact.getPhone()
        );
    }
}