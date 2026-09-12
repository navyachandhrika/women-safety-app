package com.womensafety.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class EmergencyContactRequest {

    @NotBlank(
            message = "Contact name is required"
    )
    @Size(
            min = 2,
            max = 100,
            message = "Contact name must be between 2 and 100 characters"
    )
    private String name;

    @NotBlank(
            message = "Phone number is required"
    )
    @Pattern(
            regexp = "^(?:\\+91|91)?[6-9][0-9]{9}$",
            message = "Enter a valid 10-digit Indian mobile number"
    )
    private String phone;

    public EmergencyContactRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(
            String name
    ) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(
            String phone
    ) {
        this.phone = phone;
    }
}