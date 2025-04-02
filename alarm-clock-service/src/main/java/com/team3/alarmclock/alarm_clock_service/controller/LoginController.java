package com.team3.alarmclock.alarm_clock_service.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;

@Controller
public class LoginController {

    @GetMapping("/login/success")
    public RedirectView loginSuccess(@AuthenticationPrincipal OAuth2User principal) {
        // Log successful authentication
        System.out.println("User successfully authenticated: " + principal.getAttribute("email"));

        // Redirect to React frontend
        return new RedirectView("http://localhost:3000/dashboard");
    }

    // Basic home page for API access
    @GetMapping("/")
    public String home() {
        return "home";
    }
}
