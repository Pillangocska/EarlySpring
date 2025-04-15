// src/components/alarm/AlarmDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAlarms, getNextAlarm } from '../../services/alarmService';
import { fetchWeatherData } from '../../services/weatherService';
import { Alarm, WeatherData } from '../../types';
import { scheduleAlarm, getTimeUntilAlarm } from '../../utils/alarmScheduler';
import { requestNotificationPermission } from '../../utils/notifications';

import AlarmList from './AlarmList';
import AlarmForm from './AlarmForm';
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
  const [showAlarmForm, setShowAlarmForm] = useState<boolean>(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

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

  // Handle opening the alarm form modal
  const handleAddAlarm = () => {
    setEditingAlarm(null);
    setShowAlarmForm(true);
  };

  // Handle closing the alarm form modal
  const handleCloseAlarmForm = () => {
    setShowAlarmForm(false);
    setEditingAlarm(null);
  };

  // Handle saving a new alarm
  const handleSaveAlarm = async (alarmData: Omit<Alarm, '_id' | 'userId'>) => {
    if (!authState.user?._id) return;

    try {
      setShowAlarmForm(false);
      handleRefresh(); // Refresh alarms to show the new one
    } catch (error) {
      console.error('Error saving alarm:', error);
    }
  };

  // Show a connection error banner if there's an error in auth state
  const ConnectionErrorBanner = () => {
    if (authState.error || error) {
      return (
        <div className="mb-4 rounded-lg bg-yellow-900/30 p-3 text-yellow-200">
          <div className="flex items-start">
            <svg className="mt-0.5 mr-2 h-5 w-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">Connection issue detected</p>
              <p className="mt-1 text-sm">{authState.error || error}</p>
              <p className="mt-2 text-sm">Basic functionality is available, but some features may be limited.</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get active days of the week for alarm display
  const getActiveDaysDisplay = (alarm: Alarm) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => {
      const isActive = alarm.activeDays?.includes(index) || false;
      return (
        <span key={day} className={`${isActive ? 'text-white' : 'text-gray-500'}`}>
          {day}{' '}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* App Header with Logo/Title */}
      <div className="pt-6 pb-6 text-center">
        <h1 className="text-5xl font-bold text-gray-300">EarlySpring</h1>
      </div>

      {/* Plant Visualization */}
      <div className="mb-6 flex justify-center">
        <Plant
          health={authState.user?.plantHealth || 100}
          level={authState.user?.plantLevel || 1}
        />
      </div>

      {/* Connection Error Banner */}
      <div className="mx-auto max-w-md">
        <ConnectionErrorBanner />
      </div>

      {/* Weather Display Card */}
      <div className="mx-auto mb-4 max-w-md overflow-hidden rounded-xl bg-gray-900">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Tomorrow</h2>
              <p className="text-gray-400">{currentDate}</p>
            </div>
            <div className="flex items-center">
              {weatherData && (
                <>
                  <div className="mr-2 text-lg">
                    <span className="text-green-400">↑ {Math.round(weatherData.current.temp_max)}°C</span>
                    <span className="mx-1 text-gray-500">|</span>
                    <span className="text-blue-400">↓ {Math.round(weatherData.current.temp_min)}°C</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hourly forecast */}
          <div className="mt-4 grid grid-cols-6 gap-2">
            {weatherData?.forecast?.slice(0, 6).map((hour, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-400">{hour.time}</div>
                <div className="text-base">{Math.round(hour.temp)}°C</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alarms Section */}
      <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-gray-900">
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Alarms</h2>
            <div className="flex items-center">
              <p className="mr-3 text-xs text-gray-400">
                {nextAlarm
                  ? `Earliest at ${nextAlarm.time} tomorrow, ${timeUntilNextAlarm}`
                  : 'No alarms set'}
              </p>
              <button
                onClick={handleAddAlarm}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-gray-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Alarm list */}
          <AlarmList
            alarms={alarms}
            onAlarmsChanged={handleRefresh}
          />
        </div>
      </div>

      {/* Alarm Form Modal */}
      {showAlarmForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-xl bg-gray-900">
            <AlarmForm
              existingAlarm={editingAlarm}
              onSave={handleSaveAlarm}
              onClose={handleCloseAlarmForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AlarmDashboard;
