package com.womensafety.backend.config;

import com.womensafety.backend.security.JwtAuthenticationFilter;
import com.womensafety.backend.security.RestAccessDeniedHandler;
import com.womensafety.backend.security.RestAuthenticationEntryPoint;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter
            jwtAuthenticationFilter;

    private final RestAuthenticationEntryPoint
            restAuthenticationEntryPoint;

    private final RestAccessDeniedHandler
            restAccessDeniedHandler;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint restAuthenticationEntryPoint,
            RestAccessDeniedHandler restAccessDeniedHandler
    ) {
        this.jwtAuthenticationFilter =
                jwtAuthenticationFilter;

        this.restAuthenticationEntryPoint =
                restAuthenticationEntryPoint;

        this.restAccessDeniedHandler =
                restAccessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                .csrf(
                        csrf ->
                                csrf.disable()
                )

                .cors(
                        cors ->
                                cors.configurationSource(
                                        corsConfigurationSource()
                                )
                )

                .sessionManagement(
                        session ->
                                session.sessionCreationPolicy(
                                        SessionCreationPolicy.STATELESS
                                )
                )

                .authorizeHttpRequests(
                        auth ->
                                auth

                                        .requestMatchers(
                                                HttpMethod.OPTIONS,
                                                "/**"
                                        )
                                        .permitAll()

                                        .requestMatchers(
                                                "/api/auth/**"
                                        )
                                        .permitAll()

                                        .requestMatchers(
                                                "/api/test"
                                        )
                                        .permitAll()

                                        .anyRequest()
                                        .authenticated()
                )

                .exceptionHandling(
                        exception ->
                                exception

                                        .authenticationEntryPoint(
                                                restAuthenticationEntryPoint
                                        )

                                        .accessDeniedHandler(
                                                restAccessDeniedHandler
                                        )
                )

                .formLogin(
                        form ->
                                form.disable()
                )

                .httpBasic(
                        basic ->
                                basic.disable()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration
                .getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        frontendUrl
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type"
                )
        );

        configuration.setAllowCredentials(
                true
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}