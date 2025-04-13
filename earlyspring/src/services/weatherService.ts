// src/services/weatherService.ts

import { WeatherData } from '../types';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_ENDPOINT = 'https://api.openweathermap.org/data/2.5';

// Get user's location
export const getUserLocation = async (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        // Default to a location (e.g., New York) if user location is not available
        resolve({ lat: 40.7128, lon: -74.0060 });
      }
    );
  });
};

// Fetch weather data from OpenWeatherMap API
export const fetchWeatherData = async (): Promise<WeatherData> => {
  try {
    const { lat, lon } = await getUserLocation();

    // Get current weather
    const currentResponse = await fetch(
      `${WEATHER_API_ENDPOINT}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
    );

    if (!currentResponse.ok) {
      throw new Error('Failed to fetch current weather');
    }

    const currentData = await currentResponse.json();

    // Get forecast data
    const forecastResponse = await fetch(
      `${WEATHER_API_ENDPOINT}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`
    );

    if (!forecastResponse.ok) {
      throw new Error('Failed to fetch forecast');
    }

    const forecastData = await forecastResponse.json();

    // Process and format data
    const current = {
      temp: currentData.main.temp,
      temp_min: currentData.main.temp_min,
      temp_max: currentData.main.temp_max,
      weather: currentData.weather
    };

    // Extract next 6 forecast items (typically in 3-hour intervals)
    const forecast = forecastData.list.slice(0, 6).map((item: any) => {
      const date = new Date(item.dt * 1000);
      return {
        time: `${date.getHours().toString().padStart(2, '0')}:00`,
        temp: item.main.temp,
        weather: item.weather[0]
      };
    });

    return { current, forecast };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Return empty data structure in case of error
    return {
      current: {
        temp: 0,
        temp_min: 0,
        temp_max: 0,
        weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }]
      },
      forecast: []
    };
  }
};

// Format weather data for speech output
export const formatWeatherForSpeech = (weather: WeatherData): string => {
  const current = weather.current;
  const condition = current.weather[0].description;

  return `Good morning! Current temperature is ${Math.round(current.temp)} degrees Celsius with ${condition}.
          Today's high will be ${Math.round(current.temp_max)} and the low will be ${Math.round(current.temp_min)} degrees.`;
};

// Check if weather conditions might affect travel/commute
export const shouldAlertWeather = (weather: WeatherData): boolean => {
  const conditions = weather.current.weather[0];

  // Weather condition IDs that might warrant alerts
  // See: https://openweathermap.org/weather-conditions
  const alertConditions = [
    // Thunderstorm
    200, 201, 202, 210, 211, 212, 221, 230, 231, 232,
    // Drizzle/Rain
    502, 503, 504, 511, 520, 521, 522, 531,
    // Snow
    602, 611, 612, 613, 615, 616, 620, 621, 622,
    // Atmosphere
    701, 711, 721, 731, 741, 751, 761, 762, 771, 781
  ];

  return alertConditions.includes(conditions.id);
};

// Get appropriate weather icon based on condition ID
export const getWeatherIcon = (conditionId: number, isNight: boolean = false): string => {
  // Map OpenWeatherMap condition codes to icon names
  // This would be implemented based on your icon set
  const prefix = isNight ? 'night-' : 'day-';

  // Main condition groups
  if (conditionId >= 200 && conditionId < 300) {
    return `${prefix}thunderstorm`;
  } else if (conditionId >= 300 && conditionId < 400) {
    return `${prefix}drizzle`;
  } else if (conditionId >= 500 && conditionId < 600) {
    return `${prefix}rain`;
  } else if (conditionId >= 600 && conditionId < 700) {
    return `${prefix}snow`;
  } else if (conditionId >= 700 && conditionId < 800) {
    return `${prefix}fog`;
  } else if (conditionId === 800) {
    return `${prefix}clear`;
  } else if (conditionId > 800) {
    return `${prefix}cloudy`;
  }

  return `${prefix}clear`; // Default
};
