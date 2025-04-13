// src/components/alarm/AlarmForm.tsx

import React, { useState, useEffect } from 'react';
import { Alarm, WeekDay, DEFAULT_ALARM, ALARM_SOUNDS } from '../../types';

interface AlarmFormProps {
  existingAlarm?: Alarm | null;
  onSave: (alarmData: Omit<Alarm, '_id' | 'userId'>) => void;
  onClose: () => void;
}

const AlarmForm: React.FC<AlarmFormProps> = ({ existingAlarm, onSave, onClose }) => {
  // Initialize form state with default values or existing alarm
  const [time, setTime] = useState<string>(existingAlarm?.time || DEFAULT_ALARM.time);
  const [label, setLabel] = useState<string>(existingAlarm?.label || '');
  const [days, setDays] = useState<WeekDay[]>(existingAlarm?.days || DEFAULT_ALARM.days);
  const [sound, setSound] = useState<string>(existingAlarm?.sound || (ALARM_SOUNDS[0].id));
  const [vibrate, setVibrate] = useState<boolean>(
    existingAlarm?.vibrate !== undefined ? existingAlarm.vibrate : DEFAULT_ALARM.vibrate
  );
  const [raiseVolumeGradually, setRaiseVolumeGradually] = useState<boolean>(
    existingAlarm?.raiseVolumeGradually !== undefined
      ? existingAlarm.raiseVolumeGradually
      : DEFAULT_ALARM.raiseVolumeGradually
  );
  const [snoozeTime, setSnoozeTime] = useState<number>(
    existingAlarm?.snoozeTime || DEFAULT_ALARM.snoozeTime
  );
  const [snoozeBehavior, setSnoozeBehavior] = useState<'repeat' | 'repeat_shorten' | 'once'>(
    existingAlarm?.snoozeBehavior || DEFAULT_ALARM.snoozeBehavior
  );
  const [weatherAlert, setWeatherAlert] = useState<boolean>(
    existingAlarm?.weatherAlert || false
  );

  // Available days of the week
  const weekDays: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Handle toggling a day in the selection
  const toggleDay = (day: WeekDay) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (time && days.length > 0) {
      onSave({
        time,
        label,
        days,
        sound,
        vibrate,
        raiseVolumeGradually,
        snoozeTime,
        snoozeBehavior,
        weatherAlert,
        isEnabled: existingAlarm?.isEnabled !== undefined ? existingAlarm.isEnabled : true
      });
    }
  };

  // Create preset buttons for day selection
  const DayPresets = () => (
    <div className="day-presets flex space-x-2 mb-4">
      <button
        type="button"
        onClick={() => setDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
        className={`px-3 py-1 text-sm rounded-full ${
          days.length === 5 &&
          days.includes('Mon') && days.includes('Tue') &&
          days.includes('Wed') && days.includes('Thu') &&
          days.includes('Fri')
            ? 'bg-green-600 text-white'
            : 'bg-gray-800 text-gray-300'
        }`}
      >
        Weekdays
      </button>

      <button
        type="button"
        onClick={() => setDays(['Sat', 'Sun'])}
        className={`px-3 py-1 text-sm rounded-full ${
          days.length === 2 &&
          days.includes('Sat') && days.includes('Sun')
            ? 'bg-green-600 text-white'
            : 'bg-gray-800 text-gray-300'
        }`}
      >
        Weekends
      </button>

      <button
        type="button"
        onClick={() => setDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
        className={`px-3 py-1 text-sm rounded-full ${
          days.length === 7
            ? 'bg-green-600 text-white'
            : 'bg-gray-800 text-gray-300'
        }`}
      >
        Everyday
      </button>
    </div>
  );

  return (
    <div className="alarm-form p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {existingAlarm ? 'Edit alarm' : 'Add alarm'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Time picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-gray-800 text-white text-2xl py-3 px-4 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
            required
          />
        </div>

        {/* Label */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Label (optional)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Alarm label"
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
          />
        </div>

        {/* Repeat days */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Repeat</label>

          <DayPresets />

          <div className="day-selector grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`py-2 rounded-lg text-center ${
                  days.includes(day)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Sound */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Sound</label>
          <select
            value={sound}
            onChange={(e) => setSound(e.target.value)}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
          >
            {ALARM_SOUNDS.map(soundOption => (
              <option key={soundOption.id} value={soundOption.id}>
                {soundOption.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vibration and volume */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Vibration and sound</h3>

          <div className="flex justify-between items-center mb-3 py-2 border-b border-gray-800">
            <label className="text-white">Vibrate</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={vibrate}
                onChange={(e) => setVibrate(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <label className="text-white">Raise volume gradually</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={raiseVolumeGradually}
                onChange={(e) => setRaiseVolumeGradually(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        {/* Snooze settings */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Snooze</h3>

          <div className="mb-3">
            <label className="block text-white mb-2">Duration</label>
            <select
              value={snoozeTime}
              onChange={(e) => setSnoozeTime(parseInt(e.target.value))}
              className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
            >
              <option value={5}>5 mins</option>
              <option value={10}>10 mins</option>
              <option value={15}>15 mins</option>
              <option value={20}>20 mins</option>
              <option value={30}>30 mins</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-2">Behaviour</label>
            <select
              value={snoozeBehavior}
              onChange={(e) => setSnoozeBehavior(e.target.value as 'repeat' | 'repeat_shorten' | 'once')}
              className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none"
            >
              <option value="repeat">Repeat</option>
              <option value="repeat_shorten">Repeat, shorten</option>
              <option value="once">Once only</option>
            </select>
          </div>
        </div>

        {/* Weather alert */}
        <div className="mb-6">
          <div className="flex justify-between items-center py-2">
            <label className="text-white">Weather alert</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={weatherAlert}
                onChange={(e) => setWeatherAlert(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Include weather forecast in alarm notification
          </p>
        </div>

        {/* Form buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlarmForm;
