// src/components/weather/WeatherDisplay.tsx

import React, { useEffect, useState } from 'react';
import { WeatherData } from '../../types';
import { fetchWeatherData, getWeatherIcon } from '../../services/weatherService';

const WeatherDisplay: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNight, setIsNight] = useState<boolean>(false);

  // Fetch weather data on component mount
  useEffect(() => {
    const getWeather = async () => {
      try {
        setLoading(true);
        const data = await fetchWeatherData();
        setWeather(data);

        // Check if it's night based on current time
        const hours = new Date().getHours();
        setIsNight(hours < 6 || hours >= 19);
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

  // Show appropriate loading, error, or weather display
  if (loading) {
    return (
      <div className="weather-widget bg-gray-900 rounded-xl p-4 text-white animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-24 bg-gray-700 rounded"></div>
          <div className="h-8 w-16 bg-gray-700 rounded"></div>
        </div>
        <div className="flex justify-between mt-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="flex flex-col items-center">
              <div className="h-6 w-10 bg-gray-700 rounded mb-2"></div>
              <div className="h-8 w-8 bg-gray-700 rounded-full mb-2"></div>
              <div className="h-6 w-8 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="weather-widget bg-gray-900 rounded-xl p-4 text-white">
        <p className="text-center py-4">
          {error || 'Weather data unavailable'}
        </p>
      </div>
    );
  }

  return (
    <div className="weather-widget bg-gray-900 rounded-xl p-4 text-white">
      {/* Current weather */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl font-semibold">Tomorrow</span>
          <span className="text-sm ml-2 text-gray-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-lg mr-2">
            <span className="text-green-400">↑ {formatTemp(weather.current.temp_max)}</span>
            <span className="mx-1">|</span>
            <span className="text-blue-400">↓ {formatTemp(weather.current.temp_min)}</span>
          </span>
          <div className="weather-icon w-10 h-10 flex items-center justify-center">
            {/* Display weather icon based on condition */}
            {weather.current.weather[0].main === 'Clear' && !isNight && (
              <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
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
            )}
            {weather.current.weather[0].main === 'Clear' && isNight && (
              <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
            {weather.current.weather[0].main === 'Clouds' && (
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 7h-10.5a3.5 3.5 0 1 0 0 7h12.5a3 3 0 1 0 0-6h-2z"></path>
              </svg>
            )}
            {(weather.current.weather[0].main === 'Rain' || weather.current.weather[0].main === 'Drizzle') && (
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path>
                <path d="M16 14v6"></path>
                <path d="M8 14v6"></path>
                <path d="M12 16v6"></path>
              </svg>
            )}
            {weather.current.weather[0].main === 'Thunderstorm' && (
              <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path>
                <path d="M13 11l-4 6h6l-4 6"></path>
              </svg>
            )}
            {weather.current.weather[0].main === 'Snow' && (
              <svg className="w-8 h-8 text-blue-100" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path>
                <line x1="8" y1="16" x2="8.01" y2="16"></line>
                <line x1="8" y1="20" x2="8.01" y2="20"></line>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                <line x1="12" y1="22" x2="12.01" y2="22"></line>
                <line x1="16" y1="16" x2="16.01" y2="16"></line>
                <line x1="16" y1="20" x2="16.01" y2="20"></line>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Hourly forecast */}
      <div className="forecast-container flex justify-between mt-4">
        {weather.forecast.map((item, index) => (
          <div key={index} className="forecast-item flex flex-col items-center">
            <span className="text-sm text-gray-400">{item.time}</span>
            <div className="weather-icon my-2">
              {item.weather.main === 'Clear' && !isNight && (
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"></circle>
                </svg>
              )}
              {item.weather.main === 'Clear' && isNight && (
                <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
              {item.weather.main === 'Clouds' && (
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 7h-10.5a3.5 3.5 0 1 0 0 7h12.5a3 3 0 1 0 0-6h-2z"></path>
                </svg>
              )}
              {(item.weather.main === 'Rain' || item.weather.main === 'Drizzle') && (
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path>
                  <path d="M16 14v6"></path>
                  <path d="M8 14v6"></path>
                  <path d="M12 16v6"></path>
                </svg>
              )}
              {item.weather.main === 'Thunderstorm' && (
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path>
                  <path d="M13 11l-4 6h6l-4 6"></path>
                </svg>
              )}
              {item.weather.main === 'Snow' && (
                <svg className="w-6 h-6 text-blue-100" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path>
                  <line x1="8" y1="16" x2="8.01" y2="16"></line>
                  <line x1="8" y1="20" x2="8.01" y2="20"></line>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  <line x1="12" y1="22" x2="12.01" y2="22"></line>
                  <line x1="16" y1="16" x2="16.01" y2="16"></line>
                  <line x1="16" y1="20" x2="16.01" y2="20"></line>
                </svg>
              )}
            </div>
            <span className="text-sm">{formatTemp(item.temp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherDisplay;
