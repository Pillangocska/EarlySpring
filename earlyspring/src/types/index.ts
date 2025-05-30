// src/types/index.ts

export interface User {
    _id?: string;
    googleId: string;
    email: string;
    name: string;
    picture?: string;
    plantHealth?: number; // 0-100 for gamification
    plantLevel?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface Alarm {
    _id?: string;
    userId: string;
    time: string; // "HH:MM" format
    label?: string;
    days: WeekDay[];
    isEnabled: boolean;
    sound?: string;
    vibrate?: boolean;
    raiseVolumeGradually?: boolean;
    isSnoozeEnabled?: boolean;
    snoozeTime?: number; // in minutes
    snoozeBehavior?: 'repeat' | 'repeat_shorten' | 'once';
    weatherAlert?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

  export interface WeatherData {
    current: {
      temp: number;
      temp_min: number;
      temp_max: number;
      weather: {
        id: number;
        main: string;
        description: string;
        icon: string;
      }[];
    };
    forecast: {
      time: string; // HH:MM format
      temp: number;
      weather: {
        id: number;
        main: string;
        description: string;
        icon: string;
      };
    }[];
  }

  export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
  }

  export interface AlarmFormData {
    time: string;
    label?: string;
    days: WeekDay[];
    sound?: string;
    vibrate: boolean;
    raiseVolumeGradually: boolean;
    isSnoozeEnabled: boolean;
    snoozeTime: number;
    snoozeBehavior: 'repeat' | 'repeat_shorten' | 'once';
  }

  export interface PlantState {
    health: number; // 0-100
    level: number; // 1-5
  }

  export const DEFAULT_ALARM: AlarmFormData = {
    time: '07:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    vibrate: true,
    raiseVolumeGradually: true,
    isSnoozeEnabled: true,
    snoozeTime: 10,
    snoozeBehavior: 'repeat_shorten',
  }

  export const ALARM_SOUNDS = [
    { id: 'baby_waltz', name: 'Baby waltz' },
    { id: 'birds', name: 'Birds' },
    { id: 'digital', name: 'Digital' },
    { id: 'gentle_chime', name: 'Gentle Chime' },
    { id: 'rising_bell', name: 'Rising Bell' },
  ];
