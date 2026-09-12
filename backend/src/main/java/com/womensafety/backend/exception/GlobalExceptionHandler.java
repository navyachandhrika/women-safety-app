package com.womensafety.backend.exception;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.validation.FieldError;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /*
     * =================================================
     * EMAIL ALREADY EXISTS
     * =================================================
     */

    @ExceptionHandler(
            EmailAlreadyExistsException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleEmailAlreadyExists(
            EmailAlreadyExistsException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.CONFLICT,
                exception.getMessage(),
                request.getRequestURI()
        );
    }

    /*
     * =================================================
     * INVALID LOGIN CREDENTIALS
     * =================================================
     */

    @ExceptionHandler(
            InvalidCredentialsException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleInvalidCredentials(
            InvalidCredentialsException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.UNAUTHORIZED,
                exception.getMessage(),
                request.getRequestURI()
        );
    }

    /*
     * =================================================
     * RESOURCE NOT FOUND
     * =================================================
     *
     * Examples:
     *
     * Emergency contact not found
     * SOS alert not found
     * Safety journey not found
     * User not found
     *
     * These should return:
     *
     * 404 Not Found
     *
     * instead of:
     *
     * 500 Internal Server Error
     */

    @ExceptionHandler(
            ResourceNotFoundException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleResourceNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request.getRequestURI()
        );
    }

    /*
     * =================================================
     * VALIDATION ERRORS
     * =================================================
     *
     * Handles @Valid errors such as:
     *
     * @NotBlank
     * @NotNull
     * @Size
     * @Pattern
     * @Future
     * @DecimalMin
     * @DecimalMax
     */

    @ExceptionHandler(
            MethodArgumentNotValidException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleValidationErrors(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {

        Map<String, String> validationErrors =
                new LinkedHashMap<>();

        for (
                FieldError fieldError :
                exception
                        .getBindingResult()
                        .getFieldErrors()
        ) {

            validationErrors.put(
                    fieldError.getField(),
                    fieldError.getDefaultMessage()
            );
        }

        Map<String, Object> body =
                new LinkedHashMap<>();

        body.put(
                "timestamp",
                LocalDateTime.now()
        );

        body.put(
                "status",
                HttpStatus.BAD_REQUEST.value()
        );

        body.put(
                "error",
                HttpStatus.BAD_REQUEST
                        .getReasonPhrase()
        );

        body.put(
                "message",
                "Validation failed."
        );

        body.put(
                "validationErrors",
                validationErrors
        );

        body.put(
                "path",
                request.getRequestURI()
        );

        return ResponseEntity
                .badRequest()
                .body(body);
    }

    /*
     * =================================================
     * ILLEGAL ARGUMENT
     * =================================================
     *
     * Used when the request itself contains
     * an invalid value or operation.
     */

    @ExceptionHandler(
            IllegalArgumentException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleIllegalArgument(
            IllegalArgumentException exception,
            HttpServletRequest request
    ) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request.getRequestURI()
        );
    }

    /*
     * =================================================
     * UNKNOWN SERVER ERROR
     * =================================================
     *
     * This must remain near the end because it is
     * the fallback handler for unexpected exceptions.
     */

    @ExceptionHandler(
            Exception.class
    )
    public ResponseEntity<Map<String, Object>>
    handleGenericException(
            Exception exception,
            HttpServletRequest request
    ) {

        /*
         * Print the real exception only in
         * the backend console.
         *
         * We do not expose Java stack traces
         * or internal implementation details
         * to the frontend.
         */
        exception.printStackTrace();

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected server error occurred.",
                request.getRequestURI()
        );
    }

    /*
     * =================================================
     * COMMON ERROR RESPONSE BUILDER
     * =================================================
     *
     * This keeps all API error responses
     * in the same JSON format.
     */

    private ResponseEntity<Map<String, Object>>
    buildResponse(
            HttpStatus status,
            String message,
            String path
    ) {

        Map<String, Object> body =
                new LinkedHashMap<>();

        body.put(
                "timestamp",
                LocalDateTime.now()
        );

        body.put(
                "status",
                status.value()
        );

        body.put(
                "error",
                status.getReasonPhrase()
        );

        body.put(
                "message",
                message
        );

        body.put(
                "path",
                path
        );

        return ResponseEntity
                .status(status)
                .body(body);
    }
}