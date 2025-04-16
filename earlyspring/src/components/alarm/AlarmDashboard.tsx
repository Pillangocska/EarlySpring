// src/components/alarm/AlarmDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAlarms, getNextAlarm, createAlarm, updateAlarm } from '../../services/alarmService';
import { fetchWeatherData, isNighttime } from '../../services/weatherService';
import { Alarm, WeatherData } from '../../types';
import { scheduleAlarm, getTimeUntilAlarm } from '../../utils/alarmScheduler';
import { requestNotificationPermission } from '../../utils/notifications';

import AlarmList from './AlarmList';
import AlarmForm from './AlarmForm';
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
  const [isNight, setIsNight] = useState<boolean>(isNighttime());

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

      // Check if it's night time
      setIsNight(isNighttime());
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
      if (editingAlarm && editingAlarm._id) {
        // Update existing alarm
        await updateAlarm(
          editingAlarm._id,
          {
            ...alarmData,
            userId: authState.user._id
          }
        );
      } else {
        // Create new alarm
        await createAlarm({
          ...alarmData,
          userId: authState.user._id
        });
      }

      setShowAlarmForm(false);
      setEditingAlarm(null);
      handleRefresh(); // Refresh alarms to show the updated list
    } catch (error) {
      console.error('Error saving alarm:', error);
    }
  };

  // Show a connection error banner if there's an error in auth state
  const ConnectionErrorBanner = () => {
    if (authState.error || error) {
      return (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-red-300">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">{authState.error || error}</p>
              <p className="mt-2 text-sm">Basic functionality is available, but some features may be limited.</p>
              <button
                onClick={handleRefresh}
                className="mt-2 inline-flex items-center rounded-lg bg-red-800 px-3 py-1 text-sm font-medium text-red-100 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-900"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Weather icon component based on condition
  const WeatherIcon = ({ condition, isNight, size = 'md' }: { condition: string; isNight: boolean; size?: 'sm' | 'md' | 'lg' }) => {
    const iconSizes = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10'
    };

    const sizeClass = iconSizes[size];

    switch (condition) {
      case 'Clear':
        return isNight ? (
          <div className={`${sizeClass} text-gray-300`}>
            <svg fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
        ) : (
          <div className={`${sizeClass} text-yellow-400`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </div>
        );
      case 'Clouds':
        return (
          <div className={`${sizeClass} text-gray-400`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 8a6 6 0 0 0-11.18-1.5A4.5 4.5 0 1 0 4 15.5h13a4 4 0 0 0 0-8z"></path>
            </svg>
          </div>
        );
      case 'Rain':
      case 'Drizzle':
        return (
          <div className={`${sizeClass} text-blue-400`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path>
              <path d="M16 14v6"></path>
              <path d="M8 14v6"></path>
              <path d="M12 16v6"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${sizeClass} text-gray-400`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 8a6 6 0 0 0-11.18-1.5A4.5 4.5 0 1 0 4 15.5h13a4 4 0 0 0 0-8z"></path>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-800 to-black px-4 py-8 text-white">
      {/* Subtle glow effect */}
      <div className="absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 transform rounded-full bg-green-500 opacity-10 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/3 h-40 w-80 -translate-x-1/2 transform rounded-full bg-blue-500 opacity-10 blur-3xl"></div>

      {/* Content with relative positioning for z-index */}
      <div className="relative z-10">
        {/* App Header with Logo/Title */}
        <div className="pt-8 pb-8 text-center">
          <h1 className="text-5xl font-bold text-green-300">EarlySpring</h1>
          <p className="text-gray-400 mt-2">{currentTime} • {currentDate}</p>
        </div>

        {/* Plant Visualization */}
        <div className="mb-8 flex justify-center">
          <Plant
            // TODO just for testing
            //health={60}
            //level={4}
            health={authState.user?.plantHealth || 100}
            level={authState.user?.plantLevel || 3}
          />
        </div>

        {/* Connection Error Banner */}
        <div className="mx-auto max-w-md">
          <ConnectionErrorBanner />
        </div>

        {/* Main Content Cards */}
        <div className="mx-auto max-w-md space-y-6">
          {/* Weather Display Card */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-b from-gray-800 to-black p-5 shadow-2xl">
            <div className="relative z-10">
              {/* Current weather */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    {weatherData && (
                      <WeatherIcon
                        condition={weatherData.current.weather[0].main}
                        isNight={isNight}
                        size="lg"
                      />
                    )}
                    <span className="text-3xl font-bold ml-3">
                      {weatherData ? `${Math.round(weatherData.current.temp)}°C` : '--°C'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    {weatherData ? weatherData.current.weather[0].description : 'Loading weather...'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-medium">Today</div>
                  <div className="text-sm text-gray-300">{currentDate}</div>
                  {weatherData && (
                    <div className="flex mt-2 text-sm font-medium">
                      <div className="flex items-center text-red-400">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                        {`${Math.round(weatherData.current.temp_max)}°C`}
                      </div>
                      <div className="flex items-center text-blue-400 ml-3">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                        {`${Math.round(weatherData.current.temp_min)}°C`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700 my-4"></div>

              {/* Hourly forecast */}
              {weatherData ? (
                <div className="forecast-container">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Hourly Forecast</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {weatherData.forecast.map((item, index) => (
                      <div key={index} className="forecast-item bg-gray-800 bg-opacity-40 rounded-lg p-2 flex flex-col items-center hover:bg-opacity-60 transition-colors">
                        <span className="text-xs font-medium">{item.time}</span>
                        <div className="my-2">
                          <WeatherIcon condition={item.weather.main} isNight={isNight} size="sm" />
                        </div>
                        <span className="text-sm font-medium">{`${Math.round(item.temp)}°C`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-24 bg-gray-700 rounded"></div>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="h-3 w-10 bg-gray-700 rounded mb-2"></div>
                        <div className="h-6 w-6 bg-gray-700 rounded-full mb-2"></div>
                        <div className="h-3 w-8 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alarms Card */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-b from-gray-800 to-black p-5 shadow-2xl">
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-medium text-blue-300">Alarms</h2>
                <div className="flex items-center">
                  <div className="mr-3 text-sm text-gray-400">
                    {nextAlarm
                      ? (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Next: {nextAlarm.time}, {timeUntilNextAlarm}</span>
                        </div>
                      )
                      : (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>No alarms set</span>
                        </div>
                      )
                    }
                  </div>
                  <button
                    onClick={handleAddAlarm}
                    className="group relative overflow-hidden rounded-full flex h-8 w-8 items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg hover:shadow-blue-500/25">
                    <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:translate-x-full group-hover:opacity-100"></span>
                    <svg className="h-5 w-5 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex justify-between items-center p-3 rounded-lg bg-gray-800 bg-opacity-40">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gray-700"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-700 rounded"></div>
                          <div className="h-3 w-32 bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="h-6 w-12 bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : alarms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400 text-center">No alarms created yet</p>
                  <button
                    onClick={handleAddAlarm}
                    className="mt-4 group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 py-2 px-4 text-white shadow-lg transition-all duration-300 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:translate-x-full group-hover:opacity-100"></span>
                    <span className="relative">Create Your First Alarm</span>
                  </button>
                </div>
              ) : (
                /* Alarm list */
                <AlarmList
                  alarms={alarms}
                  onAlarmsChanged={handleRefresh}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alarm Form Modal */}
      {showAlarmForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm transition-opacity">
          <div className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-2xl border border-gray-700 bg-gradient-to-b from-gray-800 to-black shadow-2xl">
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
