// src/components/alarm/AlarmDisplay.tsx

import React, { useState, useEffect } from 'react';
import { Alarm } from '../../types';
import { dismissAlarm, snoozeAlarm } from '../../utils/alarmScheduler';
import { useAuth } from '../../contexts/AuthContext';
import { WeatherData } from '../../types';

interface AlarmDisplayProps {
  alarm: Alarm;
  audio?: HTMLAudioElement;
  onDismiss: () => void;
  weatherData?: WeatherData;
}

type DisplayState = 'initial' | 'wakeup' | 'snooze';

const AlarmDisplay: React.FC<AlarmDisplayProps> = ({
  alarm,
  audio,
  onDismiss,
  weatherData
}) => {
  const { authState } = useAuth();
  const [displayState, setDisplayState] = useState<DisplayState>('initial');
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');
  const [tapCount, setTapCount] = useState<number>(50);
  const [sleepDuration, setSleepDuration] = useState<string>('8h 10m');
  const [sleepFeeling, setSleepFeeling] = useState<'bad' | 'neutral' | 'good' | null>(null);

  // Calculate time and date on mount
  useEffect(() => {
    const now = new Date();

    // Format time (HH:MM)
    setTimeString(
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    );

    // Format date (Day, Month Day)
    setDateString(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      })
    );

    // Calculate sleep duration (could be more sophisticated with actual sleep tracking)
    // For now we'll use a placeholder
    setSleepDuration('8h 10m');
  }, []);

  // Handle ignore alarm (requires 50 taps)
  const handleIgnoreAlarm = () => {
    if (displayState !== 'snooze') return;

    // Decrement tap count
    setTapCount(prevCount => {
      const newCount = prevCount - 1;
      if (newCount <= 0) {
        // If we've reached 0, ignore the alarm completely
        if (authState.user?._id) {
          dismissAlarm(alarm, authState.user._id, false, audio);
        }
        onDismiss();
      }
      return newCount;
    });
  };

  // Handle wake up button
  const handleWakeUp = () => {
    if (displayState === 'initial') {
      setDisplayState('wakeup');

      // Tell the server the user woke up
      if (authState.user?._id) {
        dismissAlarm(alarm, authState.user._id, true, audio);
      }
    } else {
      // If we're already in wakeup state and they press it again, just dismiss
      onDismiss();
    }
  };

  // Handle snooze button
  const handleSnooze = () => {
    if (displayState === 'initial') {
      setDisplayState('snooze');

      // Snooze the alarm
      if (authState.user?._id) {
        snoozeAlarm(alarm, authState.user._id, audio);
      }
    }
  };

  // Handle sleep feeling selection
  const handleSleepFeelingSelect = (feeling: 'bad' | 'neutral' | 'good') => {
    setSleepFeeling(feeling);

    // Could log this to a sleep tracking system in a real app

    // Wait a moment then dismiss
    setTimeout(() => {
      onDismiss();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-md flex flex-col h-full">
        {/* Plant visualization */}
        <div className="flex-grow flex flex-col items-center justify-center p-8">
          {displayState === 'initial' && (
            <>
              <h1 className="text-4xl font-bold text-gray-300 mb-8">Good morning!</h1>
              <div className="w-40 h-40 mb-8">
                {/* Basic plant SVG - replace with your plant component */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M50,90 C50,90 60,50 80,55 C100,60 70,30 70,30 C70,30 50,25 50,40" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <path d="M50,90 C50,90 40,50 20,55 C0,60 30,30 30,30 C30,30 50,25 50,40" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <path d="M50,90 L50,40" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <circle cx="50" cy="97" r="3" fill="#4ade80" />
                  <path d="M30,30 C30,30 40,20 60,25" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <ellipse cx="30" cy="30" rx="10" ry="5" fill="#4ade80" />
                  <ellipse cx="70" cy="30" rx="10" ry="5" fill="#4ade80" />
                  <ellipse cx="50" cy="40" rx="5" ry="3" fill="#4ade80" />
                </svg>
              </div>
            </>
          )}

          {displayState === 'wakeup' && (
            <>
              <h1 className="text-4xl font-bold text-gray-300 mb-8">Congratulations!</h1>
              <h2 className="text-2xl text-gray-400 mb-8">You woke up in time!</h2>
              <div className="w-40 h-40 mb-8">
                {/* Slightly taller plant for wakeup state */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M50,90 C50,90 65,45 85,50 C105,55 70,20 70,20 C70,20 50,15 50,30" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <path d="M50,90 C50,90 35,45 15,50 C-5,55 30,20 30,20 C30,20 50,15 50,30" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <path d="M50,90 L50,30" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <circle cx="50" cy="97" r="3" fill="#4ade80" />
                  <path d="M30,20 C30,20 40,10 60,15" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <ellipse cx="30" cy="20" rx="12" ry="6" fill="#4ade80" />
                  <ellipse cx="70" cy="20" rx="12" ry="6" fill="#4ade80" />
                  <ellipse cx="50" cy="30" rx="6" ry="3" fill="#4ade80" />
                </svg>
              </div>
            </>
          )}

          {displayState === 'snooze' && (
            <>
              <h1 className="text-4xl font-bold text-gray-300 mb-8">Give up on your morning goals?</h1>
              <div className="w-40 h-40 mb-8">
                {/* Plant with snails for snooze state */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M50,90 C50,90 60,50 80,55 C100,60 70,30 70,30 C70,30 50,25 50,40" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <path d="M50,90 C50,90 40,50 20,55 C0,60 30,30 30,30 C30,30 50,25 50,40" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <path d="M50,90 L50,40" fill="none" stroke="#4ade80" strokeWidth="2" />
                  <circle cx="50" cy="97" r="3" fill="#4ade80" />
                  <ellipse cx="30" cy="30" rx="10" ry="5" fill="#4ade80" />
                  <ellipse cx="70" cy="30" rx="10" ry="5" fill="#4ade80" />

                  {/* Snail on left leaf */}
                  <ellipse cx="25" cy="40" rx="5" ry="3" fill="#a16207" transform="rotate(-15, 25, 40)" />
                  <circle cx="20" cy="37" r="2" fill="#a16207" />
                  <line x1="20" y1="37" x2="18" y2="34" stroke="#a16207" strokeWidth="1" />
                  <line x1="20" y1="37" x2="22" y2="34" stroke="#a16207" strokeWidth="1" />

                  {/* Snail on right leaf */}
                  <ellipse cx="75" cy="40" rx="5" ry="3" fill="#a16207" transform="rotate(15, 75, 40)" />
                  <circle cx="80" cy="37" r="2" fill="#a16207" />
                  <line x1="80" y1="37" x2="82" y2="34" stroke="#a16207" strokeWidth="1" />
                  <line x1="80" y1="37" x2="78" y2="34" stroke="#a16207" strokeWidth="1" />
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Bottom card with info and buttons */}
        <div className="bg-gray-800 rounded-t-3xl p-6">
          {displayState === 'initial' && (
            <>
              {/* Alarm info */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg text-gray-300">Alarm {alarm.label ? `(${alarm.label})` : '(unnamed)'}</div>
                <div className="bg-gray-700 rounded-full p-2">
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              {/* Current time */}
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div className="text-sm text-gray-500">Current time</div>
                <div className="text-sm text-gray-300 text-right">{timeString}</div>
              </div>

              {/* Alarm target */}
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div className="text-sm text-gray-500">Alarm target</div>
                <div className="text-sm text-gray-300 text-right">{alarm.time}</div>
              </div>

              {/* Delay */}
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div className="text-sm text-gray-500">Delay</div>
                <div className="text-sm text-gray-300 text-right">8m 0s</div>
              </div>

              {/* Sleep duration */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-sm text-gray-500">Sleep duration</div>
                <div className="text-sm text-gray-300 text-right">{sleepDuration}</div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleIgnoreAlarm}
                  className="bg-red-800 text-white py-4 px-2 rounded-xl font-medium"
                >
                  Ignore alarm
                </button>
                <button
                  onClick={handleWakeUp}
                  className="bg-green-700 text-white py-4 px-2 rounded-xl font-medium"
                >
                  Wake up
                </button>
                <button
                  onClick={handleSnooze}
                  className="bg-amber-800 text-white py-4 px-2 rounded-xl font-medium"
                >
                  Snooze
                </button>
              </div>
            </>
          )}

          {displayState === 'wakeup' && (
            <>
              {/* Sleep duration */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-sm text-gray-500">Sleep duration</div>
                <div className="text-sm text-gray-300 text-right">{sleepDuration}</div>
              </div>

              {/* Sleep quality question */}
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">How do you feel about your sleep?</div>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleSleepFeelingSelect('bad')}
                    className="bg-gray-700 p-3 rounded-full"
                  >
                    <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                      <path d="M15.5 11c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zM8.5 11c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zM12 14c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleSleepFeelingSelect('neutral')}
                    className="bg-gray-700 p-3 rounded-full"
                  >
                    <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                      <path d="M15.5 11c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zM8.5 11c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zM12 15.5c-1.84 0-3.5.71-4.75 1.86l.75.75c1-.97 2.37-1.56 3.87-1.56 1.38 0 2.63.51 3.61 1.36l.79-.79c-1.22-1.05-2.82-1.62-4.52-1.62z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleSleepFeelingSelect('good')}
                    className="bg-gray-700 p-3 rounded-full"
                  >
                    <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                      <path d="M15.5 11c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zM8.5 11c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zM12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Weather preview */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-500">Preview the day</div>
                  <div className="p-1">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 9.64a3 3 0 010 4.72m-3.536-1.464a5 5 0 010-7.072m6.364 0L12 4m3.536 16.464L12 20m4-1.464a5 5 0 010-7.072M12 20V4m-4 8.464a5 5 0 010 7.072M12 20l3.536-3.536M12 20l-3.536-3.536" />
                    </svg>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-white">Today</div>
                    <div className="text-sm text-gray-400">{dateString}</div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                      <div className="text-white">
                        {weatherData
                          ? `${Math.round(weatherData.current.temp)}°C`
                          : '10°C'
                        }
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <div className="text-sm text-gray-300">
                        {weatherData
                          ? `${Math.round(weatherData.current.temp_max)}°C`
                          : '12°C'
                        }
                      </div>
                      <div className="text-sm text-gray-400">
                        {weatherData
                          ? `${Math.round(weatherData.current.temp_min)}°C`
                          : '3°C'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hourly forecast */}
                <div className="grid grid-cols-6 gap-2">
                  {[8, 10, 12, 14, 16, 18].map((hour, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-1">{`${hour}:00`}</div>
                      <svg className="w-5 h-5 text-blue-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                      <div className="text-xs text-gray-300">10°C</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {displayState === 'snooze' && (
            <>
              {/* Tap counter */}
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-1">Tap button quickly to:</div>
                <div className="text-lg text-white font-medium mb-1">Ignore alarm</div>
                <div className="text-sm text-gray-500">{tapCount} taps remaining</div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSnooze}
                  className="bg-amber-800 text-white py-4 px-2 rounded-xl font-medium"
                >
                  Snooze
                </button>
                <button
                  onClick={handleWakeUp}
                  className="bg-green-700 text-white py-4 px-2 rounded-xl font-medium"
                >
                  Wake up
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlarmDisplay;
