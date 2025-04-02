package com.team3.alarmclock.alarm_clock_service.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashMap;
import java.util.Map;

@Data
@Document(collection = "users")
public class User {

    @Id
    private String id;
    private String googleId;
    private String email;
    private String name;
    private String pictureUrl;
    private Map<String, Object> alarmSettings = new HashMap<>();
    private Map<String, Object> gamificationData = new HashMap<>();

    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPictureUrl(String pictureUrl) {
        this.pictureUrl = pictureUrl;
    }

    public Object getId() {
        return this.id;
    }

    public Object getEmail() {
        return this.email;
    }

    public Object getName() {
        return this.name;
    }

    public Object getPictureUrl() {
        return this.pictureUrl;
    }
}
