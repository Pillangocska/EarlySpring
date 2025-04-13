// src/utils/alarmScheduler.ts

import { Alarm, WeatherData, WeekDay } from '../types';
import { speakAlarmNotification } from '../services/ttsService';
import { formatWeatherForSpeech, shouldAlertWeather } from '../services/weatherService';
import { updatePlantHealth } from '../services/userService';

// Store active alarms to manage them globally
interface ActiveAlarm {
  id: string;
  timerId: number;
  alarm: Alarm;
  scheduledTime: Date;
}

let activeAlarms: ActiveAlarm[] = [];

// Check if a day is today
const isToday = (day: WeekDay): boolean => {
  const today = new Date();
  const dayMap: { [key: number]: WeekDay } = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat'
  };

  return day === dayMap[today.getDay()];
};

// Get the next time an alarm should trigger
const getNextAlarmTime = (alarm: Alarm): Date | null => {
  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);

  // Check if alarm is for today
  if (alarm.days.some(day => isToday(day))) {
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);

    // If the alarm time is already past for today, it won't trigger today
    if (alarmTime > now) {
      return alarmTime;
    }
  }

  // Find the next day when the alarm will trigger
  for (let i = 1; i <= 7; i++) {
    const nextDay = new Date();
    nextDay.setDate(now.getDate() + i);

    const dayOfWeek = nextDay.getDay();
    const dayName = Object.values({ 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' })[dayOfWeek];

    if (alarm.days.includes(dayName as WeekDay)) {
      const alarmTime = new Date(nextDay);
      alarmTime.setHours(hours, minutes, 0, 0);
      return alarmTime;
    }
  }

  return null;
};

// Calculate milliseconds until a specific date/time
const msUntil = (targetTime: Date): number => {
  return Math.max(0, targetTime.getTime() - new Date().getTime());
};

// Schedule an alarm
export const scheduleAlarm = (alarm: Alarm, weatherData?: WeatherData): void => {
  // Skip if alarm is not enabled
  if (!alarm.isEnabled) {
    return;
  }

  // Get next time the alarm should trigger
  const nextTime = getNextAlarmTime(alarm);

  if (!nextTime) {
    console.warn('Could not determine next alarm time for:', alarm);
    return;
  }

  // Check if this alarm is already scheduled
  const existingAlarmIndex = activeAlarms.findIndex(a => a.id === alarm._id);
  if (existingAlarmIndex !== -1) {
    // Clear existing timer
    clearTimeout(activeAlarms[existingAlarmIndex].timerId);
    // Remove from active alarms
    activeAlarms.splice(existingAlarmIndex, 1);
  }

  // Calculate delay in milliseconds
  const delay = msUntil(nextTime);

  // Schedule alarm
  const timerId = window.setTimeout(() => {
    triggerAlarm(alarm, weatherData);
  }, delay);

  // Add to active alarms list
  if (alarm._id) {
    activeAlarms.push({
      id: alarm._id,
      timerId,
      alarm,
      scheduledTime: nextTime
    });

    console.log(`Alarm scheduled: ${alarm.label || 'Alarm'} at ${nextTime.toLocaleString()}`);
  }
};

// Trigger an alarm
export const triggerAlarm = async (alarm: Alarm, weatherData?: WeatherData): Promise<void> => {
  // Prepare weather text if needed
  let weatherText;
  if (alarm.weatherAlert && weatherData) {
    weatherText = formatWeatherForSpeech(weatherData);
  }

  // Play alarm sound
  const audio = new Audio();
  if (alarm.sound) {
    audio.src = `/sounds/${alarm.sound}.mp3`;
  } else {
    audio.src = '/sounds/baby_waltz.mp3'; // Default
  }

  if (alarm.vibrate) {
    // Check if vibration API is available
    if ('vibrate' in navigator) {
      // Vibrate pattern: vibrate for 500ms, pause for 250ms, repeat
      navigator.vibrate([500, 250, 500, 250, 500]);
    }
  }

  // Handle volume
  if (alarm.raiseVolumeGradually) {
    audio.volume = 0.1;
    let vol = 0.1;
    const volumeInterval = setInterval(() => {
      vol += 0.1;
      if (vol <= 1) {
        audio.volume = vol;
      } else {
        clearInterval(volumeInterval);
      }
    }, 3000); // Increase volume every 3 seconds
  } else {
    audio.volume = 1.0;
  }

  // Set to loop
  audio.loop = true;
  await audio.play();

  // Display notification
  showAlarmNotification(alarm);

  // Use TTS to announce alarm
  await speakAlarmNotification(alarm.label, !!alarm.weatherAlert, weatherText);

  // Remove from active alarms
  if (alarm._id) {
    const index = activeAlarms.findIndex(a => a.id === alarm._id);
    if (index !== -1) {
      activeAlarms.splice(index, 1);
    }

    // Schedule the next occurrence
    scheduleAlarm(alarm, weatherData);
  }

  // Return the audio element so it can be stopped when the alarm is dismissed
  return audio;
};

// Show a browser notification for the alarm
export const showAlarmNotification = (alarm: Alarm): void => {
  // Check if notifications are supported and permission is granted
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      createNotification(alarm);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          createNotification(alarm);
        }
      });
    }
  }
};

// Create the actual notification
const createNotification = (alarm: Alarm): void => {
  const title = alarm.label || 'Alarm';
  const options = {
    body: `It's ${alarm.time}! Time to wake up!`,
    icon: '/icons/alarm-icon.png',
    badge: '/icons/alarm-badge.png',
    requireInteraction: true, // Notification persists until user interacts with it
    actions: [
      { action: 'snooze', title: 'Snooze' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  const notification = new Notification(title, options);

  notification.onclick = (event) => {
    // Focus on app window
    window.focus();
    notification.close();
  };
};

// Snooze an alarm
export const snoozeAlarm = async (
  alarm: Alarm,
  userId: string,
  audio?: HTMLAudioElement
): Promise<void> => {
  // Stop the current alarm sound
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  // Determine snooze duration
  const snoozeMinutes = alarm.snoozeTime || 10;

  // Calculate new alarm time
  const snoozeTime = new Date();
  snoozeTime.setMinutes(snoozeTime.getMinutes() + snoozeMinutes);

  // Create a temporary alarm for the snooze
  const snoozeAlarm: Alarm = {
    ...alarm,
    time: `${snoozeTime.getHours().toString().padStart(2, '0')}:${snoozeTime.getMinutes().toString().padStart(2, '0')}`,
    label: `${alarm.label || 'Alarm'} (Snoozed)`
  };

  // Handle snooze behavior for shortening
  if (alarm.snoozeBehavior === 'repeat_shorten' && alarm.snoozeTime) {
    // Shorten next snooze time by 20% (minimum 1 minute)
    const newSnoozeTime = Math.max(1, Math.floor(alarm.snoozeTime * 0.8));
    snoozeAlarm.snoozeTime = newSnoozeTime;
  }

  // Update plant health for snoozing (negative effect)
  await updatePlantHealth(userId, -5);

  // Schedule the snoozed alarm
  scheduleAlarm(snoozeAlarm);
};

// Dismiss an alarm completely
export const dismissAlarm = async (
  alarm: Alarm,
  userId: string,
  didWakeUp: boolean,
  audio?: HTMLAudioElement
): Promise<void> => {
  // Stop the current alarm sound
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  if (didWakeUp) {
    // Positive effect on plant if user woke up without snoozing
    await updatePlantHealth(userId, 10);
  } else {
    // Negative effect if user dismissed without waking up
    await updatePlantHealth(userId, -10);
  }
};

// Cancel all scheduled alarms
export const cancelAllAlarms = (): void => {
  activeAlarms.forEach(activeAlarm => {
    clearTimeout(activeAlarm.timerId);
  });

  activeAlarms = [];
};

// Get all currently scheduled alarms
export const getScheduledAlarms = (): ActiveAlarm[] => {
  return [...activeAlarms];
};

// Calculate time remaining until an alarm goes off
export const getTimeUntilAlarm = (alarmTime: Date): string => {
  const now = new Date();
  const diff = alarmTime.getTime() - now.getTime();

  // If alarm is in the past
  if (diff <= 0) {
    return 'Now';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};
