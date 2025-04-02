package com.team3.alarmclock.alarm_clock_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController{

    private final MongoTemplate mongoTemplate;

    @Autowired
    public TestController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/mongodb")
    public ResponseEntity<Map<String, Object>> testMongoDB() {
        // This will throw an exception if MongoDB connection fails
        String[] collectionNames = mongoTemplate.getCollectionNames().toArray(new String[0]);

        return ResponseEntity.ok(Map.of(
                "status", "connected",
                "collections", collectionNames,
                "databaseName", mongoTemplate.getDb().getName()
        ));
    }
}
