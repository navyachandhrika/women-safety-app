package com.womensafety.backend.dto;

import java.time.LocalDateTime;

public class SOSResponse {

    private Long id;

    private Double latitude;

    private Double longitude;

    private LocalDateTime createdAt;

    private String status;

    public SOSResponse() {
    }

    public SOSResponse(
            Long id,
            Double latitude,
            Double longitude,
            LocalDateTime createdAt,
            String status
    ) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = createdAt;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getStatus() {
        return status;
    }
}