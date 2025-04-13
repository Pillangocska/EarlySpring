// src/components/alarm/AlarmItem.tsx

import React, { useState } from 'react';
import { Alarm, WeekDay } from '../../types';
import { toggleAlarmStatus, deleteAlarm } from '../../services/alarmService';

interface AlarmItemProps {
  alarm: Alarm;
  onEdit: () => void;
  onAlarmsChanged: () => void;
}

const AlarmItem: React.FC<AlarmItemProps> = ({ alarm, onEdit, onAlarmsChanged }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(alarm.isEnabled);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Format the time for display (e.g., "07:00" to "7:00")
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${parseInt(hours, 10)}:${minutes}`;
  };

  // Format the days for display
  const formatDays = (days: WeekDay[]): string => {
    if (days.length === 7) {
      return 'Every day';
    } else if (days.length === 5 &&
               days.includes('Mon') && days.includes('Tue') &&
               days.includes('Wed') && days.includes('Thu') &&
               days.includes('Fri')) {
      return 'Weekdays';
    } else if (days.length === 2 &&
               days.includes('Sat') && days.includes('Sun')) {
      return 'Weekends';
    } else {
      return days.join(', ');
    }
  };

  // Handle toggling the alarm on/off
  const handleToggle = async () => {
    try {
      if (alarm._id) {
        await toggleAlarmStatus(alarm._id, !isEnabled);
        setIsEnabled(!isEnabled);
        onAlarmsChanged();
      }
    } catch (error) {
      console.error('Error toggling alarm:', error);
    }
  };

  // Handle deleting the alarm
  const handleDelete = async () => {
    try {
      if (alarm._id) {
        await deleteAlarm(alarm._id);
        onAlarmsChanged();
      }
    } catch (error) {
      console.error('Error deleting alarm:', error);
    }
  };

  // Handle showing the delete confirmation
  const handleDeleteClick = () => {
    setIsDeleting(true);
  };

  // Handle canceling the delete
  const handleCancelDelete = () => {
    setIsDeleting(false);
  };

  return (
    <div className="alarm-item border-b border-gray-800 py-4">
      {isDeleting ? (
        <div className="delete-confirmation">
          <p className="text-center mb-4">Are you sure you want to delete this alarm?</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="alarm-time-label">
              <h3 className="text-2xl font-bold">{formatTime(alarm.time)}</h3>
              <p className="text-sm text-gray-400">
                {alarm.label || 'Alarm'}
              </p>
            </div>

            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isEnabled}
                onChange={handleToggle}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Alarm details */}
          <div className="mt-2 flex justify-between">
            <p className="text-sm text-gray-400">
              {formatDays(alarm.days)}
            </p>

            <div className="flex space-x-2">
              <button
                onClick={onEdit}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={handleDeleteClick}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Additional details - sound, vibration, etc. */}
          {(alarm.sound || alarm.vibrate || alarm.raiseVolumeGradually) && (
            <div className="mt-2 flex flex-wrap text-xs text-gray-500">
              {alarm.sound && (
                <span className="mr-2">
                  🔊 {alarm.sound.replace('_', ' ')}
                </span>
              )}
              {alarm.vibrate && (
                <span className="mr-2">
                  📳 Vibrate
                </span>
              )}
              {alarm.raiseVolumeGradually && (
                <span className="mr-2">
                  📈 Gradual volume
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AlarmItem;
