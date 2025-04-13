// src/components/alarm/AlarmDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAlarms, getNextAlarm } from '../../services/alarmService';
import { fetchWeatherData } from '../../services/weatherService';
import { Alarm, WeatherData } from '../../types';
import { scheduleAlarm, getTimeUntilAlarm } from '../../utils/alarmScheduler';
import { requestNotificationPermission } from '../../utils/notifications';

import AlarmList from './AlarmList';
import WeatherDisplay from '../weather/WeatherDisplay';
import Plant from '../gamification/Plant';

const AlarmDashboard: React.FC = () => {
  const { authState } = useAuth();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [nextAlarm, setNextAlarm] = useState<Alarm | null>(null);
  const [timeUntilNextAlarm, setTimeUntilNextAlarm] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's alarms
  useEffect(() => {
    const loadAlarms = async () => {
      if (!authState.isAuthenticated || !authState.user) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch alarms
        try {
          const userAlarms = await getUserAlarms(authState.user._id!);
          setAlarms(userAlarms);

          // Get the next alarm
          const next = await getNextAlarm(authState.user._id!);
          setNextAlarm(next);
        } catch (alarmError) {
          console.error('Error loading alarm data:', alarmError);
          setAlarms([]);
          setNextAlarm(null);
          setError('Could not load your alarms. Functionality will be limited.');
        }

        // Get weather data
        try {
          const weather = await fetchWeatherData();
          setWeatherData(weather);
        } catch (weatherError) {
          console.error('Error loading weather data:', weatherError);
          setWeatherData(null);
        }
      } catch (error) {
        console.error('Error in dashboard initialization:', error);
        setError('There was a problem loading your dashboard. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (authState.isAuthenticated) {
      loadAlarms();

      // Request notification permission
      requestNotificationPermission();
    }
  }, [authState.isAuthenticated, authState.user]);

  // Update clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      // Format time as HH:MM
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      );

      // Format date
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        })
      );
    };

    // Update immediately
    updateClock();

    // Update every second
    const intervalId = setInterval(updateClock, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Schedule alarms and update time until next alarm
  useEffect(() => {
    if (!authState.isAuthenticated || alarms.length === 0) return;

    // Schedule all enabled alarms
    alarms.forEach(alarm => {
      if (alarm.isEnabled) {
        scheduleAlarm(alarm, weatherData || undefined);
      }
    });

    // Calculate time until next alarm
    const updateTimeUntilAlarm = () => {
      if (nextAlarm) {
        const alarmTime = nextAlarm.time.split(':');
        const alarmHour = parseInt(alarmTime[0]);
        const alarmMinute = parseInt(alarmTime[1]);

        // Find the next occurrence of this alarm
        const now = new Date();
        const targetTime = new Date();
        targetTime.setHours(alarmHour, alarmMinute, 0, 0);

        // If the alarm time is in the past for today, set it for tomorrow
        if (targetTime < now) {
          targetTime.setDate(targetTime.getDate() + 1);
        }

        setTimeUntilNextAlarm(getTimeUntilAlarm(targetTime));
      } else {
        setTimeUntilNextAlarm('No alarms set');
      }
    };

    updateTimeUntilAlarm();

    // Update the countdown every minute
    const intervalId = setInterval(updateTimeUntilAlarm, 60000);

    return () => clearInterval(intervalId);
  }, [authState.isAuthenticated, alarms, nextAlarm, weatherData]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch alarms
      try {
        const userAlarms = await getUserAlarms(authState.user._id!);
        setAlarms(userAlarms);

        // Get the next alarm
        const next = await getNextAlarm(authState.user._id!);
        setNextAlarm(next);
      } catch (alarmError) {
        console.error('Error refreshing alarm data:', alarmError);
        setError('Could not refresh your alarms. Functionality may be limited.');
      }

      // Get weather data
      try {
        const weather = await fetchWeatherData();
        setWeatherData(weather);
      } catch (weatherError) {
        console.error('Error refreshing weather data:', weatherError);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show a connection error banner if there's an error in auth state
  const ConnectionErrorBanner = () => {
    if (authState.error || error) {
      return (
        <div className="bg-yellow-900 bg-opacity-50 text-yellow-200 p-3 mb-4 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">Connection issue detected</p>
              <p className="text-sm mt-1">{authState.error || error}</p>
              <p className="text-sm mt-2">Basic functionality is available, but some features may be limited.</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="alarm-dashboard min-h-screen bg-black text-white p-4">
      <div className="max-w-lg mx-auto">
        {/* App Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200">EarlySpring</h1>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full bg-gray-800 text-gray-300"
            disabled={isLoading}
          >
            <svg
              className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Connection Error Banner */}
        <ConnectionErrorBanner />

        {/* Plant Visualization */}
        <div className="mb-6 flex justify-center">
          <Plant
            health={authState.user?.plantHealth || 100}
            level={authState.user?.plantLevel || 1}
          />
        </div>

        {/* Weather Display */}
        <div className="mb-6">
          <WeatherDisplay />
        </div>

        {/* Next Alarm */}
        <div className="next-alarm-section bg-gray-900 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Tomorrow</h2>
              <p className="text-gray-400">{currentDate}</p>
            </div>
            <div className="text-right">
              <div className="text-xl">
                {weatherData && (
                  <>
                    <span className="text-green-400">↑ {Math.round(weatherData.current.temp_max)}°C</span>
                    <span className="mx-1 text-gray-400">|</span>
                    <span className="text-blue-400">↓ {Math.round(weatherData.current.temp_min)}°C</span>
                  </>
                )}
              </div>
              {weatherData && (
                <div className="flex items-center justify-end">
                  <span className="mr-2 text-gray-300">{weatherData.current.weather[0].main}</span>
                  {/* Weather icon would go here */}
                </div>
              )}
            </div>
          </div>

          {/* Hourly forecast */}
          <div className="forecast grid grid-cols-6 gap-2 mt-4">
            {weatherData?.forecast.map((hour, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-400">{hour.time}</div>
                <div className="text-sm">{Math.round(hour.temp)}°C</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alarms */}
        <div className="alarms-section bg-gray-900 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Alarms</h2>
            <p className="text-sm text-gray-400">
              {nextAlarm
                ? `Earliest at ${nextAlarm.time} tomorrow, ${timeUntilNextAlarm}`
                : 'No alarms set'}
            </p>
            <button className="bg-gray-800 text-white p-2 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          <AlarmList
            alarms={alarms}
            onAlarmsChanged={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default AlarmDashboard;
