// src/components/alarm/AlarmForm.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Alarm, WeekDay, DEFAULT_ALARM, ALARM_SOUNDS } from '../../types';

interface AlarmFormProps {
  existingAlarm?: Alarm | null;
  onSave: (alarmData: Omit<Alarm, '_id' | 'userId'>) => void;
  onClose: () => void;
}

// iPhone-style Time Picker Component (24-hour format)
const IPhoneTimePicker = ({ value, onChange, className = "" }) => {
  // Parse 24-hour time
  const parseTime = (time24) => {
    if (!time24) return { hours: 6, minutes: 0 };
    const [hours, minutes] = time24.split(':').map(Number);
    return { hours, minutes };
  };

  const { hours: initialHours, minutes: initialMinutes } = parseTime(value);

  const [selectedHours, setSelectedHours] = useState(initialHours);
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);

  // Generate arrays for the picker
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Update parent component when values change
  useEffect(() => {
    const newTime = `${selectedHours.toString().padStart(2, '0')}:${selectedMinutes.toString().padStart(2, '0')}`;
    onChange(newTime);
  }, [selectedHours, selectedMinutes, onChange]);

  // Column Component with simplified approach
  const PickerColumn = ({ values, selectedValue, setValue, formatter = (v) => v, label }) => {
    const columnRef = useRef(null);
    const itemHeight = 40;
    const visibleItems = 5; // Reduced from 7 to make it less tall
    const centerIndex = Math.floor(visibleItems / 2); // Index 3 will be the center

    // Handle wheel scroll
    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? 1 : -1;
      const currentIndex = values.indexOf(selectedValue);
      let newIndex = currentIndex + delta;

      // Handle wrap-around
      if (newIndex < 0) {
        newIndex = values.length - 1;
      } else if (newIndex >= values.length) {
        newIndex = 0;
      }

      setValue(values[newIndex]);
    };

    // Add event listener for wheel
    useEffect(() => {
      const element = columnRef.current;
      if (element) {
        element.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
          element.removeEventListener('wheel', handleWheel);
        };
      }
    }, [selectedValue]);

    // Generate items to display centered around selected value
    const getDisplayItems = () => {
      const selectedIndex = values.indexOf(selectedValue);
      const items = [];

      for (let i = -centerIndex; i <= centerIndex; i++) {
        let index = selectedIndex + i;

        // Handle wrap-around for display
        if (index < 0) {
          index = values.length + index;
        } else if (index >= values.length) {
          index = index - values.length;
        }

        items.push({
          value: values[index],
          position: i,
          isSelected: i === 0
        });
      }

      return items;
    };

    const displayItems = getDisplayItems();

    return (
      <div className="w-20">
        <div className="text-center text-xs text-gray-500 mb-2">{label}</div>
        <div
          ref={columnRef}
          className="relative overflow-hidden cursor-pointer"
          style={{ height: `${visibleItems * itemHeight}px` }}
        >
          {/* Gradient overlays for fade effect */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-gray-900 to-transparent z-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent z-20 pointer-events-none"></div>

          {/* Items container with 3D perspective */}
          <div
            className="flex flex-col relative"
            style={{
              transformStyle: 'preserve-3d',
              perspective: '1000px'
            }}
          >
            {displayItems.map((item, index) => {
              const distance = Math.abs(item.position);
              const opacity = Math.max(0.3, 1 - distance * 0.2);
              const scale = item.isSelected ? 1.1 : Math.max(0.9, 1 - distance * 0.05);

              // 3D cylinder effect - rotate items based on their position
              const rotationAngle = item.position * 15; // 15 degrees per step
              const translateZ = Math.cos(rotationAngle * Math.PI / 180) * 20; // Push back items that are rotated
              const translateY = Math.sin(rotationAngle * Math.PI / 180) * -8; // Slight vertical offset

              return (
                <div
                  key={`${item.value}-${index}`}
                  onClick={() => setValue(item.value)}
                  className={`
                    cursor-pointer text-center transition-all duration-200 font-medium select-none relative
                    ${item.isSelected
                      ? 'text-green-400 text-lg font-semibold'
                      : 'text-gray-400 hover:text-gray-200 text-base'
                    }
                  `}
                  style={{
                    height: `${itemHeight}px`,
                    lineHeight: `${itemHeight}px`,
                    opacity,
                    transform: `
                      scale(${scale})
                      rotateX(${rotationAngle}deg)
                      translateZ(${translateZ}px)
                      translateY(${translateY}px)
                    `,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {formatter(item.value)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-900 bg-opacity-40 rounded-lg border border-gray-700 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500 transition-colors shadow-inner ${className}`}>
      <div className="flex items-center justify-center space-x-2 p-4">
        {/* Hours column */}
        <PickerColumn
          values={hours}
          selectedValue={selectedHours}
          setValue={setSelectedHours}
          formatter={(h) => h.toString().padStart(2, '0')}
          label="Hours"
        />



        {/* Minutes column */}
        <PickerColumn
          values={minutes}
          selectedValue={selectedMinutes}
          setValue={setSelectedMinutes}
          formatter={(m) => m.toString().padStart(2, '0')}
          label="Minutes"
        />
      </div>
    </div>
  );
};


const AlarmForm: React.FC<AlarmFormProps> = ({ existingAlarm, onSave, onClose }) => {
  // Initialize form state with default values or existing alarm
  const [time, setTime] = useState<string>(existingAlarm?.time || DEFAULT_ALARM.time);
  const [label, setLabel] = useState<string>(existingAlarm?.label || '');
  const [days, setDays] = useState<WeekDay[]>(existingAlarm?.days || DEFAULT_ALARM.days);
  const [sound, setSound] = useState<string>(existingAlarm?.sound || (ALARM_SOUNDS[0].id));
  const [isSnoozeEnabled, setIsSnoozeEnabled] = useState<boolean>(
    existingAlarm?.isSnoozeEnabled !== undefined ? existingAlarm.isSnoozeEnabled : DEFAULT_ALARM.isSnoozeEnabled
  );
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
        isSnoozeEnabled,
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
        className={`relative overflow-hidden px-3 py-1 text-sm rounded-full font-medium transition-all duration-300 ${days.length === 5 &&
          days.includes('Mon') && days.includes('Tue') &&
          days.includes('Wed') && days.includes('Thu') &&
          days.includes('Fri')
          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg hover:shadow-green-500/25'
          : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
          }`}
      >
        <span className={`absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 ${days.length === 5 &&
          days.includes('Mon') && days.includes('Tue') &&
          days.includes('Wed') && days.includes('Thu') &&
          days.includes('Fri') ? 'group-hover:translate-x-full group-hover:opacity-100' : ''
          }`}></span>
        <span className="relative">Weekdays</span>
      </button>

      <button
        type="button"
        onClick={() => setDays(['Sat', 'Sun'])}
        className={`relative overflow-hidden px-3 py-1 text-sm rounded-full font-medium transition-all duration-300 ${days.length === 2 &&
          days.includes('Sat') && days.includes('Sun')
          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg hover:shadow-green-500/25'
          : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
          }`}
      >
        <span className={`absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 ${days.length === 2 &&
          days.includes('Sat') && days.includes('Sun') ? 'group-hover:translate-x-full group-hover:opacity-100' : ''
          }`}></span>
        <span className="relative">Weekends</span>
      </button>

      <button
        type="button"
        onClick={() => setDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])}
        className={`relative overflow-hidden px-3 py-1 text-sm rounded-full font-medium transition-all duration-300 ${days.length === 7
          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg hover:shadow-green-500/25'
          : 'bg-gray-900 text-gray-300 hover:bg-gray-800'
          }`}
      >
        <span className={`absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 ${days.length === 7 ? 'group-hover:translate-x-full group-hover:opacity-100' : ''
          }`}></span>
        <span className="relative">Everyday</span>
      </button>
    </div>
  );

  return (
    <div className="alarm-form p-6 relative bg-gradient-to-b from-gray-800 to-black">
      {/* Subtle glow effect */}
      <div className="absolute -top-10 left-1/2 h-20 w-40 -translate-x-1/2 transform rounded-full bg-green-500 opacity-10 blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-green-300">
            {existingAlarm ? 'Edit Alarm' : 'Add Alarm'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* iPhone-style Time picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Time</label>
            <IPhoneTimePicker
              value={time}
              onChange={setTime}
              className="w-full"
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
              className="w-full bg-gray-900 bg-opacity-40 text-white py-2 px-4 rounded-lg border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none focus:bg-opacity-60 transition-colors shadow-inner"
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
                  className={`relative overflow-hidden py-2 rounded-lg text-center transition-all duration-300 ${days.includes(day)
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-green-500/25'
                    : 'bg-gray-900 bg-opacity-40 text-gray-400 hover:bg-opacity-60 border border-gray-700'
                    }`}
                >
                  <span className={`absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 ${days.includes(day) ? 'group-hover:translate-x-full group-hover:opacity-100' : ''
                    }`}></span>
                  <span className="relative">{day}</span>
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
              className="w-full bg-gray-900 bg-opacity-40 text-white py-2 px-4 rounded-lg border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none focus:bg-opacity-60 transition-colors shadow-inner"
            >
              {ALARM_SOUNDS.map(soundOption => (
                <option key={soundOption.id} value={soundOption.id}>
                  {soundOption.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vibration and volume */}
          <div className="mb-6 bg-gray-900 bg-opacity-30 rounded-lg border border-gray-700 p-4">
            <h3 className="text-sm font-medium text-green-300 mb-3">Vibration and Sound</h3>

            <div className="flex justify-between items-center mb-3 py-2 border-b border-gray-700">
              <label className="text-white">Vibrate</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={vibrate}
                  onChange={(e) => setVibrate(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex justify-between items-center py-2">
              <label className="text-white">Raise volume gradually</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={raiseVolumeGradually}
                  onChange={(e) => setRaiseVolumeGradually(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Snooze settings */}
          <div className="mb-6 bg-gray-900 bg-opacity-30 rounded-lg border border-gray-700 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-green-300">Snooze</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isSnoozeEnabled}
                  onChange={(e) => setIsSnoozeEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {isSnoozeEnabled &&
              <>
                <div className="mb-3">
                  <label className="block text-white mb-2">Duration</label>
                  <select
                    value={snoozeTime}
                    onChange={(e) => setSnoozeTime(parseInt(e.target.value))}
                    className="w-full bg-gray-900 bg-opacity-40 text-white py-2 px-4 rounded-lg border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors shadow-inner"
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
                    className="w-full bg-gray-900 bg-opacity-40 text-white py-2 px-4 rounded-lg border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors shadow-inner"
                  >
                    <option value="repeat">Repeat</option>
                    <option value="repeat_shorten">Repeat, shorten</option>
                    <option value="once">Once only</option>
                  </select>
                </div>
              </>}
          </div>

          {/* Weather alert */}
          <div className="mb-6 bg-gray-900 bg-opacity-30 rounded-lg border border-gray-700 p-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <label className="text-white">Weather alert</label>
                <p className="text-sm text-gray-400 mt-1">
                  Include weather forecast in alarm notification
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={weatherAlert}
                  onChange={(e) => setWeatherAlert(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-500 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Form buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600 shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="group relative overflow-hidden flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:shadow-green-500/25 transition-all duration-300 shadow-md"
            >
              <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:translate-x-full group-hover:opacity-100"></span>
              <span className="relative">Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlarmForm;
