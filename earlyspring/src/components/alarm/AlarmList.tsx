// src/components/alarm/AlarmList.tsx

import React, { useState } from 'react';
import { Alarm } from '../../types';
import AlarmItem from './AlarmItem';
import AlarmForm from './AlarmForm';
import { useAuth } from '../../contexts/AuthContext';
import { createAlarm } from '../../services/alarmService';

interface AlarmListProps {
  alarms: Alarm[];
  onAlarmsChanged: () => void;
}

const AlarmList: React.FC<AlarmListProps> = ({ alarms, onAlarmsChanged }) => {
  const { authState } = useAuth();
  const [showAlarmForm, setShowAlarmForm] = useState<boolean>(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

  // Handle creating a new alarm
  const handleCreateAlarm = async (alarmData: Omit<Alarm, '_id' | 'userId'>) => {
    if (!authState.user?._id) return;

    try {
      await createAlarm({
        ...alarmData,
        userId: authState.user._id
      });

      // Close the form and refresh alarms
      setShowAlarmForm(false);
      onAlarmsChanged();
    } catch (error) {
      console.error('Error creating alarm:', error);
    }
  };

  // Handle editing an existing alarm
  const handleEditAlarm = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setShowAlarmForm(true);
  };

  // Handle closing the form
  const handleCloseForm = () => {
    setShowAlarmForm(false);
    setEditingAlarm(null);
  };

  return (
    <div className="alarm-list">
      {/* Alarm items */}
      {alarms.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p>No alarms set</p>
          <button
            onClick={() => setShowAlarmForm(true)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Your First Alarm
          </button>
        </div>
      ) : (
        <>
          {alarms.map(alarm => (
            <AlarmItem
              key={alarm._id}
              alarm={alarm}
              onEdit={() => handleEditAlarm(alarm)}
              onAlarmsChanged={onAlarmsChanged}
            />
          ))}

          {/* Add new alarm button */}
          <div className="mt-4">
            <button
              onClick={() => setShowAlarmForm(true)}
              className="w-full py-3 flex items-center justify-center border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Alarm
            </button>
          </div>
        </>
      )}

      {/* Alarm form modal */}
      {showAlarmForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl max-w-md w-full max-h-screen overflow-y-auto">
            <AlarmForm
              existingAlarm={editingAlarm}
              onSave={handleCreateAlarm}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AlarmList;
