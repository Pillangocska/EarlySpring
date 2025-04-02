package com.team3.alarmclock.alarm_clock_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// http://localhost:8080/api/test/mongodb this is for testing mongodb connection
@SpringBootApplication
public class AlarmClockServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AlarmClockServiceApplication.class, args);
	}

}
