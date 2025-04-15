// src/services/weatherService.ts

import { WeatherData } from '../types';

// Open-Meteo API endpoint (no API key required)
const WEATHER_API_ENDPOINT = 'https://api.open-meteo.com/v1';

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
        // Default to a location (e.g., Budapest) if user location is not available
        resolve({ lat: 47.4979, lon: 19.0402 });
      }
    );
  });
};

// Map WMO weather codes to OpenWeatherMap-like condition data
const mapWeatherCode = (code: number) => {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  const codeMap: Record<number, { id: number; main: string; description: string; icon: string }> = {
    0: { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
    1: { id: 801, main: 'Clouds', description: 'mainly clear', icon: '02d' },
    2: { id: 802, main: 'Clouds', description: 'partly cloudy', icon: '03d' },
    3: { id: 803, main: 'Clouds', description: 'overcast', icon: '04d' },
    45: { id: 701, main: 'Mist', description: 'fog', icon: '50d' },
    48: { id: 741, main: 'Fog', description: 'depositing rime fog', icon: '50d' },
    51: { id: 300, main: 'Drizzle', description: 'light drizzle', icon: '09d' },
    53: { id: 301, main: 'Drizzle', description: 'moderate drizzle', icon: '09d' },
    55: { id: 302, main: 'Drizzle', description: 'dense drizzle', icon: '09d' },
    56: { id: 511, main: 'Rain', description: 'freezing light drizzle', icon: '13d' },
    57: { id: 511, main: 'Rain', description: 'freezing dense drizzle', icon: '13d' },
    61: { id: 500, main: 'Rain', description: 'slight rain', icon: '10d' },
    63: { id: 501, main: 'Rain', description: 'moderate rain', icon: '10d' },
    65: { id: 502, main: 'Rain', description: 'heavy rain', icon: '10d' },
    66: { id: 511, main: 'Rain', description: 'light freezing rain', icon: '13d' },
    67: { id: 511, main: 'Rain', description: 'heavy freezing rain', icon: '13d' },
    71: { id: 600, main: 'Snow', description: 'slight snow fall', icon: '13d' },
    73: { id: 601, main: 'Snow', description: 'moderate snow fall', icon: '13d' },
    75: { id: 602, main: 'Snow', description: 'heavy snow fall', icon: '13d' },
    77: { id: 611, main: 'Snow', description: 'snow grains', icon: '13d' },
    80: { id: 520, main: 'Rain', description: 'slight rain showers', icon: '09d' },
    81: { id: 521, main: 'Rain', description: 'moderate rain showers', icon: '09d' },
    82: { id: 522, main: 'Rain', description: 'violent rain showers', icon: '09d' },
    85: { id: 620, main: 'Snow', description: 'slight snow showers', icon: '13d' },
    86: { id: 621, main: 'Snow', description: 'heavy snow showers', icon: '13d' },
    95: { id: 210, main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' },
    96: { id: 211, main: 'Thunderstorm', description: 'thunderstorm with slight hail', icon: '11d' },
    99: { id: 212, main: 'Thunderstorm', description: 'thunderstorm with heavy hail', icon: '11d' }
  };

  return codeMap[code] || codeMap[0]; // Default to clear sky if code not found
};

// Fetch weather data from Open-Meteo API
export const fetchWeatherData = async (): Promise<WeatherData> => {
  try {
    const { lat, lon } = await getUserLocation();

    // Get forecast including current weather
    const response = await fetch(
      `${WEATHER_API_ENDPOINT}/forecast?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=1`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    // Process current weather
    const current = {
      temp: data.current.temperature_2m,
      temp_min: data.daily.temperature_2m_min[0],
      temp_max: data.daily.temperature_2m_max[0],
      weather: [mapWeatherCode(data.current.weather_code)]
    };

    // Process hourly forecast for the next 18 hours (6 items at 3-hour intervals)
    const forecast = [];
    for (let i = 1; i <= 6; i++) {
      const index = i * 3; // Every 3 hours
      if (data.hourly.time[index]) {
        const date = new Date(data.hourly.time[index]);
        forecast.push({
          time: `${date.getHours().toString().padStart(2, '0')}:00`,
          temp: data.hourly.temperature_2m[index],
          weather: mapWeatherCode(data.hourly.weather_code[index])
        });
      }
    }

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
  // These IDs are mapped from Open-Meteo to match the original OpenWeatherMap IDs
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

// Helper function to determine if it's nighttime
export const isNighttime = (): boolean => {
  const hours = new Date().getHours();
  return hours >= 20 || hours < 6;
};
