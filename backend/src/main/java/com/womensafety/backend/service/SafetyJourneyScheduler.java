package com.womensafety.backend.service;

import com.womensafety.backend.entity.SOSAlert;
import com.womensafety.backend.entity.SafetySession;
import com.womensafety.backend.enums.SOSStatus;
import com.womensafety.backend.enums.SafetySessionStatus;
import com.womensafety.backend.repository.SOSAlertRepository;
import com.womensafety.backend.repository.SafetySessionRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SafetyJourneyScheduler {

    private static final int CHECK_IN_GRACE_MINUTES = 2;

    private final SafetySessionRepository
            safetySessionRepository;

    private final SOSAlertRepository
            sosAlertRepository;

    public SafetyJourneyScheduler(
            SafetySessionRepository safetySessionRepository,
            SOSAlertRepository sosAlertRepository
    ) {
        this.safetySessionRepository =
                safetySessionRepository;

        this.sosAlertRepository =
                sosAlertRepository;
    }

    @Scheduled(fixedRate = 10000)
    @Transactional
    public void checkSafetyJourneys() {

        LocalDateTime now =
                LocalDateTime.now();

        checkExpectedArrivalTimes(
                now
        );

        checkMissedCheckIns(
                now
        );
    }

    private void checkExpectedArrivalTimes(
            LocalDateTime now
    ) {

        List<SafetySession> activeSessions =
                safetySessionRepository
                        .findByStatus(
                                SafetySessionStatus.ACTIVE
                        );

        for (
                SafetySession session :
                activeSessions
        ) {

            LocalDateTime expectedArrivalTime =
                    session.getExpectedArrivalTime();

            if (
                    expectedArrivalTime == null
            ) {
                continue;
            }

            boolean arrivalTimeReached =
                    !expectedArrivalTime
                            .isAfter(now);

            if (
                    arrivalTimeReached
            ) {

                session.setStatus(
                        SafetySessionStatus.CHECK_IN_REQUIRED
                );

                session.setCheckInStartedAt(
                        now
                );

                session.setGraceDeadline(
                        now.plusMinutes(
                                CHECK_IN_GRACE_MINUTES
                        )
                );

                safetySessionRepository.save(
                        session
                );
            }
        }
    }

    private void checkMissedCheckIns(
            LocalDateTime now
    ) {

        List<SafetySession> checkInSessions =
                safetySessionRepository
                        .findByStatus(
                                SafetySessionStatus.CHECK_IN_REQUIRED
                        );

        for (
                SafetySession session :
                checkInSessions
        ) {

            LocalDateTime graceDeadline =
                    session.getGraceDeadline();

            if (
                    graceDeadline == null
            ) {
                continue;
            }

            boolean gracePeriodExpired =
                    !graceDeadline
                            .isAfter(now);

            if (
                    gracePeriodExpired
            ) {

                createAutomaticSOS(
                        session,
                        now
                );

                session.setStatus(
                        SafetySessionStatus.SOS_TRIGGERED
                );

                session.setCheckInStartedAt(
                        null
                );

                session.setGraceDeadline(
                        null
                );

                safetySessionRepository.save(
                        session
                );
            }
        }
    }

    private void createAutomaticSOS(
            SafetySession session,
            LocalDateTime now
    ) {

        SOSAlert sosAlert =
                new SOSAlert();

        sosAlert.setLatitude(
                session.getLastLatitude()
        );

        sosAlert.setLongitude(
                session.getLastLongitude()
        );

        sosAlert.setCreatedAt(
                now
        );

        sosAlert.setStatus(
                SOSStatus.ACTIVE
        );

        sosAlert.setUser(
                session.getUser()
        );

        sosAlertRepository.save(
                sosAlert
        );
    }
}