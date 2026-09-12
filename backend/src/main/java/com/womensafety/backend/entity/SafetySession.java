package com.womensafety.backend.entity;

import com.womensafety.backend.enums.SafetySessionStatus;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "safety_sessions")
public class SafetySession {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    @Column(nullable = false)
    private LocalDateTime expectedArrivalTime;

    private LocalDateTime checkInStartedAt;

    private LocalDateTime graceDeadline;

    private Double lastLatitude;

    private Double lastLongitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SafetySessionStatus status;

    @ManyToOne
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;

    public SafetySession() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(
            String destination
    ) {
        this.destination = destination;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(
            LocalDateTime startedAt
    ) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getExpectedArrivalTime() {
        return expectedArrivalTime;
    }

    public void setExpectedArrivalTime(
            LocalDateTime expectedArrivalTime
    ) {
        this.expectedArrivalTime =
                expectedArrivalTime;
    }

    public LocalDateTime getCheckInStartedAt() {
        return checkInStartedAt;
    }

    public void setCheckInStartedAt(
            LocalDateTime checkInStartedAt
    ) {
        this.checkInStartedAt =
                checkInStartedAt;
    }

    public LocalDateTime getGraceDeadline() {
        return graceDeadline;
    }

    public void setGraceDeadline(
            LocalDateTime graceDeadline
    ) {
        this.graceDeadline =
                graceDeadline;
    }

    public Double getLastLatitude() {
        return lastLatitude;
    }

    public void setLastLatitude(
            Double lastLatitude
    ) {
        this.lastLatitude = lastLatitude;
    }

    public Double getLastLongitude() {
        return lastLongitude;
    }

    public void setLastLongitude(
            Double lastLongitude
    ) {
        this.lastLongitude = lastLongitude;
    }

    public SafetySessionStatus getStatus() {
        return status;
    }

    public void setStatus(
            SafetySessionStatus status
    ) {
        this.status = status;
    }

    public User getUser() {
        return user;
    }

    public void setUser(
            User user
    ) {
        this.user = user;
    }
}