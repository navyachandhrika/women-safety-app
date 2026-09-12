package com.womensafety.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class SafetySessionRequest {

    @NotBlank(
            message = "Destination is required"
    )
    private String destination;

    @NotNull(
            message = "Expected arrival time is required"
    )
    @Future(
            message =
                    "Expected arrival time must be in the future"
    )
    private LocalDateTime expectedArrivalTime;

    @NotNull(
            message = "Latitude is required"
    )
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double latitude;

    @NotNull(
            message = "Longitude is required"
    )
    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double longitude;

    public String getDestination() {
        return destination;
    }

    public void setDestination(
            String destination
    ) {
        this.destination = destination;
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

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(
            Double latitude
    ) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(
            Double longitude
    ) {
        this.longitude = longitude;
    }
}