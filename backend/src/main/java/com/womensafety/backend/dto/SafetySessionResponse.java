package com.womensafety.backend.dto;

import com.womensafety.backend.enums.SafetySessionStatus;

import java.time.LocalDateTime;

public class SafetySessionResponse {

    private Long id;
    private String destination;
    private LocalDateTime startedAt;
    private LocalDateTime expectedArrivalTime;
    private LocalDateTime checkInStartedAt;
    private LocalDateTime graceDeadline;
    private Double lastLatitude;
    private Double lastLongitude;
    private SafetySessionStatus status;

    public SafetySessionResponse(
            Long id,
            String destination,
            LocalDateTime startedAt,
            LocalDateTime expectedArrivalTime,
            LocalDateTime checkInStartedAt,
            LocalDateTime graceDeadline,
            Double lastLatitude,
            Double lastLongitude,
            SafetySessionStatus status
    ) {
        this.id = id;
        this.destination = destination;
        this.startedAt = startedAt;
        this.expectedArrivalTime = expectedArrivalTime;
        this.checkInStartedAt = checkInStartedAt;
        this.graceDeadline = graceDeadline;
        this.lastLatitude = lastLatitude;
        this.lastLongitude = lastLongitude;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getDestination() {
        return destination;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getExpectedArrivalTime() {
        return expectedArrivalTime;
    }

    public LocalDateTime getCheckInStartedAt() {
        return checkInStartedAt;
    }

    public LocalDateTime getGraceDeadline() {
        return graceDeadline;
    }

    public Double getLastLatitude() {
        return lastLatitude;
    }

    public Double getLastLongitude() {
        return lastLongitude;
    }

    public SafetySessionStatus getStatus() {
        return status;
    }
}