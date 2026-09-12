package com.womensafety.backend.service;

import com.womensafety.backend.dto.SafetySessionRequest;
import com.womensafety.backend.dto.SafetySessionResponse;
import com.womensafety.backend.entity.SOSAlert;
import com.womensafety.backend.entity.SafetySession;
import com.womensafety.backend.entity.User;
import com.womensafety.backend.enums.SOSStatus;
import com.womensafety.backend.enums.SafetySessionStatus;
import com.womensafety.backend.exception.ResourceNotFoundException;
import com.womensafety.backend.repository.SOSAlertRepository;
import com.womensafety.backend.repository.SafetySessionRepository;
import com.womensafety.backend.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SafetySessionService {

    private final SafetySessionRepository
            safetySessionRepository;

    private final UserRepository
            userRepository;

    private final SOSAlertRepository
            sosAlertRepository;

    public SafetySessionService(
            SafetySessionRepository safetySessionRepository,
            UserRepository userRepository,
            SOSAlertRepository sosAlertRepository
    ) {
        this.safetySessionRepository =
                safetySessionRepository;

        this.userRepository =
                userRepository;

        this.sosAlertRepository =
                sosAlertRepository;
    }

    /*
     * =================================================
     * START SAFETY JOURNEY
     * =================================================
     */

    @Transactional
    public SafetySessionResponse startJourney(
            SafetySessionRequest request,
            Authentication authentication
    ) {

        User user =
                getCurrentUser(
                        authentication
                );

        safetySessionRepository
                .findFirstByUserIdAndStatusInOrderByStartedAtDesc(
                        user.getId(),
                        List.of(
                                SafetySessionStatus.ACTIVE,
                                SafetySessionStatus.CHECK_IN_REQUIRED
                        )
                )
                .ifPresent(
                        existing -> {
                            throw new IllegalArgumentException(
                                    "You already have an active safety journey"
                            );
                        }
                );

        SafetySession session =
                new SafetySession();

        session.setDestination(
                request
                        .getDestination()
                        .trim()
        );

        session.setStartedAt(
                LocalDateTime.now()
        );

        session.setExpectedArrivalTime(
                request.getExpectedArrivalTime()
        );

        session.setLastLatitude(
                request.getLatitude()
        );

        session.setLastLongitude(
                request.getLongitude()
        );

        session.setStatus(
                SafetySessionStatus.ACTIVE
        );

        session.setUser(
                user
        );

        SafetySession savedSession =
                safetySessionRepository.save(
                        session
                );

        return convertToResponse(
                savedSession
        );
    }

    /*
     * =================================================
     * GET ACTIVE JOURNEY
     * =================================================
     */

    public SafetySessionResponse getActiveJourney(
            Authentication authentication
    ) {

        User user =
                getCurrentUser(
                        authentication
                );

        Optional<SafetySession> session =
                safetySessionRepository
                        .findFirstByUserIdAndStatusInOrderByStartedAtDesc(
                                user.getId(),
                                List.of(
                                        SafetySessionStatus.ACTIVE,
                                        SafetySessionStatus.CHECK_IN_REQUIRED
                                )
                        );

        if (
                session.isEmpty()
        ) {
            return null;
        }

        return convertToResponse(
                session.get()
        );
    }

    /*
     * =================================================
     * UPDATE JOURNEY LOCATION
     * =================================================
     */

    @Transactional
    public SafetySessionResponse updateLocation(
            Long id,
            Double latitude,
            Double longitude,
            Authentication authentication
    ) {

        User user =
                getCurrentUser(
                        authentication
                );

        SafetySession session =
                getOwnedJourney(
                        id,
                        user
                );

        validateJourneyIsActive(
                session
        );

        session.setLastLatitude(
                latitude
        );

        session.setLastLongitude(
                longitude
        );

        SafetySession savedSession =
                safetySessionRepository.save(
                        session
                );

        return convertToResponse(
                savedSession
        );
    }

    /*
     * =================================================
     * MARK USER SAFE
     * =================================================
     */

    @Transactional
    public SafetySessionResponse markSafe(
            Long id,
            Authentication authentication
    ) {

        User user =
                getCurrentUser(
                        authentication
                );

        SafetySession session =
                getOwnedJourney(
                        id,
                        user
                );

        validateJourneyIsActive(
                session
        );

        session.setStatus(
                SafetySessionStatus.COMPLETED
        );

        session.setCheckInStartedAt(
                null
        );

        session.setGraceDeadline(
                null
        );

        SafetySession savedSession =
                safetySessionRepository.save(
                        session
                );

        return convertToResponse(
                savedSession
        );
    }

    /*
     * =================================================
     * MANUALLY TRIGGER SOS
     * =================================================
     */

    @Transactional
    public SafetySessionResponse triggerSOSNow(
            Long id,
            Authentication authentication
    ) {

        User user =
                getCurrentUser(
                        authentication
                );

        SafetySession session =
                getOwnedJourney(
                        id,
                        user
                );

        validateJourneyIsActive(
                session
        );

        SOSAlert sosAlert =
                new SOSAlert();

        sosAlert.setLatitude(
                session.getLastLatitude()
        );

        sosAlert.setLongitude(
                session.getLastLongitude()
        );

        sosAlert.setCreatedAt(
                LocalDateTime.now()
        );

        /*
         * Using enum instead of raw string.
         */
        sosAlert.setStatus(
                SOSStatus.ACTIVE
        );

        sosAlert.setUser(
                user
        );

        sosAlertRepository.save(
                sosAlert
        );

        /*
         * Prevent automatic scheduler from
         * generating another SOS later.
         */
        session.setStatus(
                SafetySessionStatus.SOS_TRIGGERED
        );

        session.setCheckInStartedAt(
                null
        );

        session.setGraceDeadline(
                null
        );

        SafetySession savedSession =
                safetySessionRepository.save(
                        session
                );

        return convertToResponse(
                savedSession
        );
    }

    /*
     * =================================================
     * GET JOURNEY OWNED BY CURRENT USER
     * =================================================
     */

    private SafetySession getOwnedJourney(
            Long id,
            User user
    ) {

        return safetySessionRepository
                .findByIdAndUserId(
                        id,
                        user.getId()
                )
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Safety journey not found"
                                )
                );
    }

    /*
     * =================================================
     * VALIDATE JOURNEY STATUS
     * =================================================
     */

    private void validateJourneyIsActive(
            SafetySession session
    ) {

        if (
                session.getStatus()
                        != SafetySessionStatus.ACTIVE
                &&
                session.getStatus()
                        != SafetySessionStatus.CHECK_IN_REQUIRED
        ) {

            throw new IllegalArgumentException(
                    "Journey is no longer active"
            );
        }
    }

    /*
     * =================================================
     * GET CURRENT USER
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

    /*
     * =================================================
     * ENTITY -> RESPONSE DTO
     * =================================================
     */

    private SafetySessionResponse convertToResponse(
            SafetySession session
    ) {

        return new SafetySessionResponse(
                session.getId(),
                session.getDestination(),
                session.getStartedAt(),
                session.getExpectedArrivalTime(),
                session.getCheckInStartedAt(),
                session.getGraceDeadline(),
                session.getLastLatitude(),
                session.getLastLongitude(),
                session.getStatus()
        );
    }
}