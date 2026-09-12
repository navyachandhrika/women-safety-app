package com.womensafety.backend.repository;

import com.womensafety.backend.entity.EmergencyContact;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmergencyContactRepository
        extends JpaRepository<EmergencyContact, Long> {

    List<EmergencyContact>
    findByUserIdOrderByIdDesc(
            Long userId
    );

    Optional<EmergencyContact>
    findByIdAndUserId(
            Long id,
            Long userId
    );
}