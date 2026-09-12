package com.womensafety.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.womensafety.backend.entity.SOSAlert;

public interface SOSAlertRepository
        extends JpaRepository<SOSAlert, Long> {

    List<SOSAlert>
    findByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    Optional<SOSAlert>
    findByIdAndUserId(
            Long id,
            Long userId
    );
}