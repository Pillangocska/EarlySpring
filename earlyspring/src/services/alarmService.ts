// src/services/alarmService.ts

import { Alarm } from '../types';
import {
  findDocuments,
  findOneDocument,
  insertOneDocument,
  updateOneDocument,
  deleteOneDocument
} from './mongoService';

const ALARMS_COLLECTION = 'alarms';

// Get all alarms for a user
export const getUserAlarms = async (userId: string): Promise<Alarm[]> => {
  return await findDocuments<Alarm>(
    ALARMS_COLLECTION,
    { userId },
    { sort: { time: 1 } } // Sort by time ascending
  );
};

// Get a specific alarm
export const getAlarm = async (alarmId: string): Promise<Alarm | null> => {
  return await findOneDocument<Alarm>(
    ALARMS_COLLECTION,
    { _id: { $oid: alarmId } }
  );
};

// Create a new alarm
export const createAlarm = async (alarmData: Omit<Alarm, '_id'>): Promise<Alarm> => {
  return await insertOneDocument<Alarm>(ALARMS_COLLECTION, alarmData);
};

// Update an alarm
export const updateAlarm = async (
  alarmId: string,
  alarmData: Partial<Alarm>
): Promise<Alarm | null> => {
  return await updateOneDocument<Alarm>(
    ALARMS_COLLECTION,
    { _id: { $oid: alarmId } },
    alarmData
  );
};

// Delete an alarm
export const deleteAlarm = async (alarmId: string): Promise<boolean> => {
  return await deleteOneDocument(
    ALARMS_COLLECTION,
    { _id: { $oid: alarmId } }
  );
};

// Toggle alarm enabled status
export const toggleAlarmStatus = async (
  alarmId: string,
  enabled: boolean
): Promise<Alarm | null> => {
  return await updateOneDocument<Alarm>(
    ALARMS_COLLECTION,
    { _id: { $oid: alarmId } },
    { isEnabled: enabled }
  );
};

// Get the next scheduled alarm
export const getNextAlarm = async (userId: string): Promise<Alarm | null> => {
  const now = new Date();
  const dayNames: { [key: number]: string } = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat'
  };

  const today = dayNames[now.getDay()];
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Get all enabled alarms
  const alarms = await findDocuments<Alarm>(
    ALARMS_COLLECTION,
    {
      userId,
      isEnabled: true
    }
  );

  if (alarms.length === 0) {
    return null;
  }

  // Filter alarms for today and future times
  const todayAlarms = alarms.filter(alarm =>
    alarm.days.includes(today as any) && alarm.time > currentTime
  );

  if (todayAlarms.length > 0) {
    // Sort by time and return the first one
    return todayAlarms.sort((a, b) => a.time.localeCompare(b.time))[0];
  }

  // If no alarms today, find the next day with an alarm
  let dayIndex = (now.getDay() + 1) % 7;
  let daysChecked = 0;

  while (daysChecked < 7) {
    const nextDay = dayNames[dayIndex];
    const nextDayAlarms = alarms.filter(alarm => alarm.days.includes(nextDay as any));

    if (nextDayAlarms.length > 0) {
      // Sort by time and return the first one
      return nextDayAlarms.sort((a, b) => a.time.localeCompare(b.time))[0];
    }

    dayIndex = (dayIndex + 1) % 7;
    daysChecked++;
  }

  // No alarms found for the next 7 days
  return null;
};
