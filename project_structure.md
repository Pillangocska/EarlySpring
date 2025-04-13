# EarlySpring Alarm Clock Project - Source File Guide

## Root Files

### `src/main.tsx`
- Entry point of the application
- Renders the root `App` component to the DOM
- Initializes and registers the service worker for background notifications

### `src/App.tsx`
- Main application component
- Sets up routing with React Router
- Includes protected routes that require authentication
- Handles redirections based on authentication state

### `src/firebase.ts`
- Initializes Firebase configuration
- Sets up Firebase Authentication service
- Exports auth instance to be used throughout the app

### `src/types/index.ts`
- Contains TypeScript interfaces and types for the entire application
- Defines data models for users, alarms, weather data, etc.
- Includes default values and constants used across the app

## Authentication

### `src/contexts/AuthContext.tsx`
- Creates and manages the authentication context
- Handles user authentication state using Firebase
- Communicates with the database to store user information
- Provides login, logout, and update user functions to components
- Includes error handling for database connectivity issues

### `src/services/authService.ts`
- Implements authentication functions using Firebase
- Handles Google sign-in using Firebase popup
- Manages auth tokens and user session
- Converts Firebase user data to application's user format

### `src/components/auth/Login.tsx`
- Login page component with Google authentication button
- Displays app features and information
- Shows loading states and error messages during authentication
- Contains the decorative plant animation

## MongoDB Data Services

### `src/services/mongoService.ts`
- Core service for interacting with MongoDB Atlas Data API
- Implements CRUD operations for database collections
- Includes fallback to localStorage for development when MongoDB is unavailable
- Handles error cases and connection issues

### `src/services/userService.ts`
- User-specific database operations
- Gets, creates, and updates user profiles
- Manages user plant health and level data
- Uses mongoService for the actual data operations

### `src/services/alarmService.ts`
- Alarm-specific database operations
- Creates, reads, updates, and deletes alarms
- Finds next scheduled alarms
- Handles toggling alarm status

## Alarm Components

### `src/components/alarm/AlarmDashboard.tsx`
- Main dashboard screen after login
- Displays current time, weather, plant, and alarms
- Manages data loading and error states
- Shows connection error banner when database issues occur
- Schedules alarms and calculates time until next alarm

### `src/components/alarm/AlarmList.tsx`
- Displays list of user's alarms
- Provides interface to add new alarms
- Renders empty state when no alarms exist
- Shows modal for creating/editing alarms

### `src/components/alarm/AlarmItem.tsx`
- Individual alarm display component
- Shows time, days, and alarm settings
- Includes toggle switch for enabling/disabling alarms
- Provides edit and delete functionality

### `src/components/alarm/AlarmForm.tsx`
- Form for creating and editing alarms
- Allows setting time, repeat days, sound, and other options
- Includes preset buttons for weekdays, weekends, etc.
- Manages form validation and submission

## Weather Integration

### `src/services/weatherService.ts`
- Fetches weather data from OpenWeatherMap API
- Gets user location using browser geolocation
- Formats weather data for display and speech
- Determines if weather conditions warrant special alerts

### `src/components/weather/WeatherDisplay.tsx`
- Displays current weather and forecast
- Shows temperature, conditions, and hourly forecast
- Includes appropriate weather icons based on conditions
- Handles loading and error states

## Gamification

### `src/components/gamification/Plant.tsx`
- Visual representation of user's plant
- Changes appearance based on health and level
- Shows different growth stages and health indicators
- Provides visual feedback on alarm interaction habits

## Text-to-Speech

### `src/services/ttsService.ts`
- Implements text-to-speech for alarm notifications
- Uses HuggingFace API for high-quality speech
- Includes fallback to browser's built-in TTS
- Formats alarm and weather information for speech

## Utilities

### `src/utils/alarmScheduler.ts`
- Schedules alarms for notification
- Calculates next alarm occurrence times
- Manages active alarms list
- Handles alarm triggering, snoozing, and dismissing

### `src/utils/notifications.ts`
- Manages browser notifications
- Requests notification permissions
- Registers service worker for background notifications
- Provides utility functions for showing in-app toasts

## Service Worker

### `public/service-worker.js`
- Handles background notifications when app is closed
- Caches app assets for offline use
- Manages notification actions (snooze, dismiss)
- Intercepts fetch requests for offline capability

## Project Architecture

This architecture follows a clear separation of concerns:
- **Contexts** for global state management
- **Services** for external API communication
- **Components** for UI rendering
- **Utilities** for shared functionality
- **Types** for data structure definitions

The application uses React with TypeScript, Firebase for authentication, MongoDB Atlas for data storage, and integrates with weather and text-to-speech APIs to provide a complete alarm clock experience with gamification elements.
