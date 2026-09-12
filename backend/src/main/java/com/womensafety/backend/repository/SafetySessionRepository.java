package com.womensafety.backend.repository;

import com.womensafety.backend.entity.SafetySession;
import com.womensafety.backend.enums.SafetySessionStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SafetySessionRepository
        extends JpaRepository<SafetySession, Long> {

    Optional<SafetySession>
    findFirstByUserIdAndStatusInOrderByStartedAtDesc(
            Long userId,
            List<SafetySessionStatus> statuses
    );

    Optional<SafetySession>
    findByIdAndUserId(
            Long id,
            Long userId
    );

    List<SafetySession>
    findByStatus(
            SafetySessionStatus status
    );
}