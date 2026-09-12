package com.womensafety.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(
            message = "Name is required"
    )
    private String name;

    @NotBlank(
            message = "Email is required"
    )
    @Email(
            message = "Enter a valid email"
    )
    private String email;

    @NotBlank(
            message = "Password is required"
    )
    @Size(
            min = 6,
            message =
                    "Password must contain at least 6 characters"
    )
    private String password;

    @NotBlank(
            message = "Phone number is required"
    )
    @Pattern(
            regexp = "\\d{10,15}",
            message =
                    "Phone number must contain 10 to 15 digits"
    )
    private String phone;

    public String getName() {
        return name;
    }

    public void setName(
            String name
    ) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(
            String email
    ) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(
            String password
    ) {
        this.password = password;
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