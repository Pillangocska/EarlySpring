// src/components/weather/WeatherDisplay.tsx

import React, { useEffect, useState } from 'react';
import { WeatherData } from '../../types';
import { fetchWeatherData, isNighttime } from '../../services/weatherService';

const WeatherDisplay: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNight, setIsNight] = useState<boolean>(isNighttime());

  // Fetch weather data on component mount
  useEffect(() => {
    const getWeather = async () => {
      try {
        setLoading(true);
        const data = await fetchWeatherData();
        setWeather(data);
        setIsNight(isNighttime());
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Could not load weather data');
      } finally {
        setLoading(false);
      }
    };

    getWeather();

    // Refresh weather data every 30 minutes
    const intervalId = setInterval(getWeather, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Format the temperature
  const formatTemp = (temp: number): string => {
    return `${Math.round(temp)}°C`;
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
      case 'Thunderstorm':
        return (
          <div className={`${sizeClass} text-yellow-500`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path>
              <polyline points="13 11 9 17 15 17 11 23"></polyline>
            </svg>
          </div>
        );
      case 'Snow':
        return (
          <div className={`${sizeClass} text-blue-100`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path>
              <line x1="8" y1="16" x2="8.01" y2="16"></line>
              <line x1="8" y1="20" x2="8.01" y2="20"></line>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
              <line x1="12" y1="22" x2="12.01" y2="22"></line>
              <line x1="16" y1="16" x2="16.01" y2="16"></line>
              <line x1="16" y1="20" x2="16.01" y2="20"></line>
            </svg>
          </div>
        );
      case 'Mist':
      case 'Fog':
        return (
          <div className={`${sizeClass} text-gray-400`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5h3m4 0h3m4 0h3M5 9h3m4 0h3m4 0h3M5 13h3m4 0h3m4 0h3M5 17h3m4 0h3m4 0h3"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${sizeClass} text-gray-400`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 15h18M3 9h18"></path>
            </svg>
          </div>
        );
    }
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className="weather-widget bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl p-5 text-white shadow-lg animate-pulse">
        <div className="flex items-center justify-between mb-5">
          <div className="h-8 w-36 bg-gray-700 rounded"></div>
          <div className="h-8 w-16 bg-gray-700 rounded"></div>
        </div>
        <div className="flex space-x-2 justify-between mt-5">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="flex flex-col items-center p-2">
              <div className="h-5 w-12 bg-gray-700 rounded mb-2"></div>
              <div className="h-8 w-8 bg-gray-700 rounded-full mb-2"></div>
              <div className="h-5 w-10 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !weather) {
    return (
      <div className="weather-widget bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M12 14a2 2 0 100-4 2 2 0 000 4M5 22h14a2 2 0 002-2V7a2 2 0 00-2-2h-4l-2-3H9L7 5H5a2 2 0 00-2 2v13a2 2 0 002 2z" />
            </svg>
            <p>{error || 'Weather data unavailable'}</p>
            <button
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Current time and day
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="weather-widget bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* Current weather */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <div className="flex items-center">
            <WeatherIcon condition={weather.current.weather[0].main} isNight={isNight} size="lg" />
            <span className="text-3xl font-bold ml-3">{formatTemp(weather.current.temp)}</span>
          </div>
          <div className="text-sm text-gray-300 mt-1">
            {weather.current.weather[0].description}
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-medium">{dayName}</div>
          <div className="text-sm text-gray-300">{monthDay}</div>
          <div className="flex mt-2 text-sm font-medium">
            <div className="flex items-center text-red-400">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              {formatTemp(weather.current.temp_max)}
            </div>
            <div className="flex items-center text-blue-400 ml-3">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              {formatTemp(weather.current.temp_min)}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 my-4"></div>

      {/* Hourly forecast */}
      <div className="forecast-container">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Hourly Forecast</h3>
        <div className="grid grid-cols-6 gap-2">
          {weather.forecast.map((item, index) => (
            <div key={index} className="forecast-item bg-slate-800 bg-opacity-40 rounded-lg p-2 flex flex-col items-center hover:bg-opacity-60 transition-colors">
              <span className="text-xs font-medium">{item.time}</span>
              <div className="my-2">
                <WeatherIcon condition={item.weather.main} isNight={isNight} size="sm" />
              </div>
              <span className="text-sm font-medium">{formatTemp(item.temp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;
