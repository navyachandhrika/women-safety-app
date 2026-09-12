package com.womensafety.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.womensafety.backend.dto.SOSRequest;
import com.womensafety.backend.dto.SOSResponse;
import com.womensafety.backend.entity.SOSAlert;
import com.womensafety.backend.entity.User;
import com.womensafety.backend.enums.SOSStatus;
import com.womensafety.backend.exception.ResourceNotFoundException;
import com.womensafety.backend.repository.SOSAlertRepository;
import com.womensafety.backend.repository.UserRepository;

@Service
public class SOSAlertService {

    private final SOSAlertRepository
            sosAlertRepository;

    private final UserRepository
            userRepository;

    public SOSAlertService(
            SOSAlertRepository sosAlertRepository,
            UserRepository userRepository
    ) {
        this.sosAlertRepository =
                sosAlertRepository;

        this.userRepository =
                userRepository;
    }

    @Transactional
    public SOSResponse createSOS(
            SOSRequest request,
            Authentication authentication
    ) {

        User user =
                getCurrentUser(
                        authentication
                );

        SOSAlert alert =
                new SOSAlert();

        alert.setLatitude(
                request.getLatitude()
        );

        alert.setLongitude(
                request.getLongitude()
        );

        alert.setCreatedAt(
                LocalDateTime.now()
        );

        alert.setStatus(
                SOSStatus.ACTIVE
        );

        alert.setUser(
                user
        );

        SOSAlert savedAlert =
                sosAlertRepository.save(
                        alert
                );

        return convertToResponse(
                savedAlert
        );
    }

    public List<SOSResponse> getSOSHistory(
            Authentication authentication
    ) {

        User user =
                getCurrentUser(
                        authentication
                );

        return sosAlertRepository
                .findByUserIdOrderByCreatedAtDesc(
                        user.getId()
                )
                .stream()
                .map(
                        this::convertToResponse
                )
                .toList();
    }

    @Transactional
    public SOSResponse updateLocation(
            Long id,
            SOSRequest request,
            Authentication authentication
    ) {

        User user =
                getCurrentUser(
                        authentication
                );

        SOSAlert alert =
                sosAlertRepository
                        .findByIdAndUserId(
                                id,
                                user.getId()
                        )
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "SOS alert not found"
                                        )
                        );

        if (
                alert.getStatus()
                        != SOSStatus.ACTIVE
        ) {

            throw new IllegalArgumentException(
                    "Cannot update a resolved SOS alert"
            );
        }

        alert.setLatitude(
                request.getLatitude()
        );

        alert.setLongitude(
                request.getLongitude()
        );

        SOSAlert updatedAlert =
                sosAlertRepository.save(
                        alert
                );

        return convertToResponse(
                updatedAlert
        );
    }

    @Transactional
    public SOSResponse resolveSOS(
            Long id,
            Authentication authentication
    ) {

        User user =
                getCurrentUser(
                        authentication
                );

        SOSAlert alert =
                sosAlertRepository
                        .findByIdAndUserId(
                                id,
                                user.getId()
                        )
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "SOS alert not found"
                                        )
                        );

        alert.setStatus(
                SOSStatus.RESOLVED
        );

        SOSAlert savedAlert =
                sosAlertRepository.save(
                        alert
                );

        return convertToResponse(
                savedAlert
        );
    }

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
                .findByEmail(
                        email
                )
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "User not found"
                                )
                );
    }

    private SOSResponse convertToResponse(
            SOSAlert alert
    ) {

        return new SOSResponse(
                alert.getId(),
                alert.getLatitude(),
                alert.getLongitude(),
                alert.getCreatedAt(),
                alert.getStatus().name()
        );
    }
}