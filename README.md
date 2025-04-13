# EarlySpring Alarm Clock App

A React-based alarm clock application with MongoDB Atlas and Google OAuth integration.

## Features

- Text-to-speech alarm notifications
- Weather forecast integration
- Gamification to prevent snooze with a growing plant
- Persistent data storage in MongoDB Atlas
- Direct Google OAuth authentication
- Mobile-first responsive design

## Tech Stack

- **Frontend**: React with TypeScript (Vite)
- **Database**: MongoDB Atlas (using Data API directly from frontend)
- **Authentication**: Google OAuth 2.0 (direct implementation)
- **Styling**: CSS with Tailwind and Flowbite

## Project Setup

### Prerequisites

- Node.js (v16 or later)
- NPM or Yarn
- MongoDB Atlas account
- Google Cloud Platform account for OAuth

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# MongoDB Atlas
VITE_MONGODB_APP_ID=your_mongodb_app_id
VITE_MONGODB_API_KEY=your_mongodb_api_key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Weather API
VITE_WEATHER_API_KEY=your_openweathermap_api_key

# HuggingFace API (for TTS)
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new database named `earlyspring`
3. Create the following collections:
   - `users`
   - `alarms`
4. Set up the Data API in MongoDB Atlas
5. Create an API Key and note down the App ID

### Google OAuth Setup

1. Create a project in Google Cloud Platform
2. Configure the OAuth consent screen
3. Create OAuth 2.0 credentials
4. Add the redirect URI: `http://localhost:5173/auth/callback` (for development)
5. Get the Client ID

### Installation and Running

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Project Structure

```
/src
  /assets             # Static assets like images, icons
  /components         # Reusable UI components
    /auth             # Authentication related components
    /alarm            # Alarm related components
    /weather          # Weather related components
    /gamification     # Gamification elements
    /layout           # Layout components
  /contexts           # React context for state management
  /hooks              # Custom React hooks
  /services           # Services for API calls, data fetching
  /types              # TypeScript type definitions
  /utils              # Utility functions
  App.tsx             # Main App component
  main.tsx            # Entry point
```

## App Components

### Authentication

- `AuthContext.tsx` - Manages authentication state
- `Login.tsx` - Login page with Google OAuth button
- `AuthCallback.tsx` - Handles OAuth redirect and token exchange

### Core Components

- `AlarmDashboard.tsx` - Main dashboard with clock display
- `AlarmList.tsx` - List of user's alarms
- `AlarmItem.tsx` - Individual alarm display
- `AlarmForm.tsx` - Create/edit alarm form
- `WeatherDisplay.tsx` - Weather forecast widget
- `Plant.tsx` - Growing plant visualization (gamification)

### Services

- `authService.ts` - Google OAuth implementation
- `mongoService.ts` - MongoDB Atlas Data API service
- `userService.ts` - User data operations
- `alarmService.ts` - Alarm data operations
- `weatherService.ts` - Weather API integration
- `ttsService.ts` - Text-to-speech service

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
