// src/components/alarm/AlarmDisplay.tsx

import React, { useState, useEffect } from 'react';
import { Alarm, WeatherData } from '../../types';
import { dismissAlarm, snoozeAlarm } from '../../utils/alarmScheduler';
import { useAuth } from '../../contexts/AuthContext';
import Plant from '../gamification/Plant';
import { isNighttime } from '../../services/weatherService';

interface AlarmDisplayProps {
  alarm: Alarm;
  audio?: HTMLAudioElement;
  onDismiss: () => void;
  weatherData: WeatherData | null;
}

type DisplayState = 'initial' | 'wakeup' | 'snooze';

const WeatherIcon = ({ condition, isNight, size = 'md' }: { condition: string; isNight: boolean; size?: 'sm' | 'md' | 'lg' }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };
  const sizeClass = iconSizes[size];

  switch (condition) {
    case 'Clear':
      return isNight ? (
        <div className={`${sizeClass} text-gray-300`}>
          <svg fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </div>
      ) : (
        <div className={`${sizeClass} text-yellow-400`}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </div>
      );
    case 'Clouds':
      return (
        <div className={`${sizeClass} text-gray-400`}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 8a6 6 0 0 0-11.18-1.5A4.5 4.5 0 1 0 4 15.5h13a4 4 0 0 0 0-8z"></path>
          </svg>
        </div>
      );
    case 'Rain':
    case 'Drizzle':
      return (
        <div className={`${sizeClass} text-blue-400`}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path>
            <path d="M16 14v6"></path>
            <path d="M8 14v6"></path>
            <path d="M12 16v6"></path>
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${sizeClass} text-gray-400`}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 8a6 6 0 0 0-11.18-1.5A4.5 4.5 0 1 0 4 15.5h13a4 4 0 0 0 0-8z"></path>
          </svg>
        </div>
      );
  }
};


const AlarmDisplay: React.FC<AlarmDisplayProps> = ({
  alarm,
  audio,
  onDismiss,
  weatherData // Use the passed weather data
}) => {
  const { authState } = useAuth();
  const [displayState, setDisplayState] = useState<DisplayState>('initial');
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');
  const [tapCount, setTapCount] = useState<number>(50); // Gamification: taps to ignore
  const [sleepDuration, setSleepDuration] = useState<string>('Calculating...'); // Placeholder
  const [sleepFeeling, setSleepFeeling] = useState<'bad' | 'neutral' | 'good' | null>(null);
  const [isNight, setIsNight] = useState<boolean>(isNighttime()); // For weather icon
  const [wakeUpEnabled, setWakeUpEnabled] = useState<boolean>(false); // Control wakeup button state

  // Calculate time, date, and update night status
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateString(
        now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      );
      setIsNight(isNighttime());
    };

    updateDateTime(); // Initial call
    const intervalId = setInterval(updateDateTime, 60000); // Update every minute

    // Basic sleep duration estimation (can be improved)
    // This is just a placeholder logic
    const alarmTimeParts = alarm.time.split(':');
    const alarmHour = parseInt(alarmTimeParts[0]);
    const alarmMinute = parseInt(alarmTimeParts[1]);
    const now = new Date();
    const alarmToday = new Date();
    alarmToday.setHours(alarmHour, alarmMinute, 0, 0);

    // Assume sleep started ~8 hours before alarm time yesterday if alarm is in the morning
    const assumedSleepStart = new Date(alarmToday);
    if (alarmHour < 12) { // Rough check if it's a morning alarm
      assumedSleepStart.setDate(assumedSleepStart.getDate() - 1);
      assumedSleepStart.setHours(alarmHour + 16, alarmMinute); // e.g., 8 hours before 6 AM is 10 PM previous day
    } else {
      // For afternoon/evening alarms, this logic is less useful, maybe default
      assumedSleepStart.setHours(alarmHour - 8, alarmMinute);
    }

    const durationMillis = now.getTime() - assumedSleepStart.getTime();
    if (durationMillis > 0) {
        const hours = Math.floor(durationMillis / (1000 * 60 * 60));
        const minutes = Math.floor((durationMillis % (1000 * 60 * 60)) / (1000 * 60));
        setSleepDuration(`${hours}h ${minutes}m`);
    } else {
        setSleepDuration('~8h 0m'); // Fallback
    }


    return () => clearInterval(intervalId);
  }, [alarm.time]);


  // Handle dismiss action (for wakeup)
  const handleDismiss = (wokeUpOnTime: boolean) => {
    if (authState.user?._id) {
      dismissAlarm(alarm, authState.user._id, wokeUpOnTime, audio);
    }
    onDismiss(); // Call the original onDismiss passed from Dashboard
  };

  // Handle wake up button
  const handleWakeUp = () => {
    // Don't immediately dismiss, change state first
    if (displayState === 'initial' || displayState === 'snooze') {
      setDisplayState('wakeup');
      // Mark as woken up on time
      if (authState.user?._id) {
        // Inform backend immediately but don't stop audio/dismiss UI yet
         dismissAlarm(alarm, authState.user._id, true, audio, false); // Pass `false` for immediateDismiss
      }
    }
    // If already in wakeup state, the feeling selection handles final dismissal
  };

  // Handle snooze button
  const handleSnooze = () => {
    setDisplayState('initial'); // Go back to initial state after snoozing visually
    if (authState.user?._id) {
      snoozeAlarm(alarm, authState.user._id, audio);
      // Snooze implies not waking up on time for this instance,
      // but don't call full dismiss yet.
    }
    // Don't call onDismiss here, snooze handles rescheduling.
    // We might need to hide the display after a short delay or let snoozeAlarm handle it.
    // A better UX might be to show "Snoozed for X minutes" then fade out.
    onDismiss(); // Dismiss the UI immediately after snoozing.
  };

  // Handle ignore alarm action (requires taps in snooze state)
   const handleIgnoreAlarm = () => {
    // Ignore is primarily meant for the 'snooze' state where the user taps rapidly
    if (displayState === 'snooze') {
      setTapCount(prevCount => {
        const newCount = prevCount - 1;
        if (newCount <= 0) {
          handleDismiss(false); // Ignored, so wokeUpOnTime = false
        }
        return newCount > 0 ? newCount : 0; // Prevent negative count
      });
    } else if (displayState === 'initial') {
        // Allow ignoring directly from initial state, but maybe make it harder?
        // For simplicity, let's treat "Ignore" from initial state as snooze state entry
        setDisplayState('snooze');
        setTimeout(() => {
          setWakeUpEnabled(true); // Enable wakeup button after first ignore tap
          console.log("Button enabled!");
        }, 5000); // Delay to allow user to see the first tap
        setTapCount(50); // Reset taps when entering snooze state this way
    }
  };


  // Handle sleep feeling selection
  const handleSleepFeelingSelect = (feeling: 'bad' | 'neutral' | 'good') => {
    setSleepFeeling(feeling);
    // TODO: Log feeling to backend/analytics if needed

    // Now finally dismiss the alarm display after selection
    setTimeout(() => {
      handleDismiss(true); // Already marked as woke up on time when entering 'wakeup' state
    }, 500); // Short delay for visual feedback
  };

  const renderContent = () => {
    switch (displayState) {
      // -------------------- WAKEUP State --------------------
      case 'wakeup':
        return (
          <>
            {/* Top Section */}
            <div className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-8">
              <h1 className="text-3xl font-bold text-green-300 mb-2">Success!</h1>
              <p className="text-lg text-gray-300 mb-6">You woke up for your {alarm.label || 'alarm'}!</p>
              {/* Plant Component */}
              <div className="mb-8">
                <Plant
                  health={authState.user?.plantHealth || 100}
                  level={authState.user?.plantLevel || 1} // Use actual level
                  size={200} // Adjust size as needed
                />
              </div>
            </div>

            {/* Bottom Card - Wakeup Info */}
            <div className="relative overflow-hidden rounded-t-2xl border-t border-gray-700 bg-gradient-to-b from-gray-800 to-black p-5 shadow-2xl mt-auto w-full">
               {/* Sleep Duration */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                 <div className="text-gray-400">Sleep duration</div>
                 <div className="text-gray-200 text-right">{sleepDuration}</div>
              </div>

               {/* Sleep quality */}
              <div className="mb-5">
                <div className="text-sm text-gray-400 mb-3 text-center">How do you feel about your sleep?</div>
                <div className="flex justify-around">
                    {['bad', 'neutral', 'good'].map((f) => (
                        <button
                            key={f}
                            onClick={() => handleSleepFeelingSelect(f as 'bad' | 'neutral' | 'good')}
                            className={`p-3 rounded-full transition-colors duration-200 ${sleepFeeling === f ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                             {/* Simple Emojis for feedback */}
                            <span className="text-2xl">
                                {f === 'bad' ? '😞' : f === 'neutral' ? '😐' : '😊'}
                            </span>
                        </button>
                    ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700 my-4"></div>

              {/* Weather Preview */}
              <div className="mb-2">
                 <h3 className="text-sm font-medium text-gray-400 mb-3">Today's Outlook</h3>
                 {weatherData ? (
                    <div className="space-y-3">
                        {/* Current Weather Mini */}
                         <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700 bg-opacity-50">
                             <div className="flex items-center">
                                <WeatherIcon condition={weatherData.current.weather[0].main} isNight={isNight} size="md"/>
                                <div className="ml-3">
                                    <div className="text-xl font-semibold">{`${Math.round(weatherData.current.temp)}°C`}</div>
                                    <div className="text-xs text-gray-300">{weatherData.current.weather[0].description}</div>
                                </div>
                             </div>
                             <div className="text-right text-xs">
                                 <div className="flex items-center text-red-400">
                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="18 15 12 9 6 15"></polyline></svg>
                                     {`${Math.round(weatherData.current.temp_max)}°`}
                                 </div>
                                 <div className="flex items-center text-blue-400 mt-1">
                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                     {`${Math.round(weatherData.current.temp_min)}°`}
                                 </div>
                             </div>
                         </div>
                        {/* Hourly Forecast Mini */}
                         <div className="grid grid-cols-6 gap-2">
                            {weatherData.forecast.slice(0, 6).map((item, index) => (
                                <div key={index} className="bg-gray-700 bg-opacity-40 rounded-lg p-2 flex flex-col items-center text-center">
                                    <span className="text-xs font-medium">{item.time}</span>
                                    <div className="my-1">
                                        <WeatherIcon condition={item.weather.main} isNight={isNight} size="sm" />
                                    </div>
                                    <span className="text-xs font-semibold">{`${Math.round(item.temp)}°`}</span>
                                </div>
                             ))}
                         </div>
                    </div>
                 ) : (
                    <div className="text-center text-sm text-gray-500 py-4">Weather data unavailable.</div>
                 )}
              </div>
            </div>
          </>
        );

      // -------------------- SNOOZE State --------------------
      case 'snooze':
        return (
          <>
            {/* Top Section */}
            <div className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-8">
              <h1 className="text-3xl font-bold text-amber-400 mb-4">Tempting...</h1>
              <p className="text-lg text-gray-300 mb-6">Tap rapidly to ignore the alarm and skip the reward.</p>
              {/* Plant Component */}
              <div className="mb-8 opacity-80"> {/* Slightly faded plant */}
                <Plant
                  health={authState.user?.plantHealth || 100}
                  level={authState.user?.plantLevel || 1}
                  size={180} // Maybe slightly smaller
                />
                 {/* Optional: Add a visual indicator like a "Zzz" icon overlay */}
              </div>
            </div>

             {/* Bottom Card - Snooze Actions */}
            <div className="relative overflow-hidden rounded-t-2xl border-t border-gray-700 bg-gradient-to-b from-gray-800 to-black p-5 shadow-2xl mt-auto w-full">
                {/* Tap Counter and Ignore Button */}
                <div className="text-center mb-5">
                    <button
                      onClick={handleIgnoreAlarm}
                      className="w-full bg-gradient-to-r from-red-700 to-red-600 text-white py-4 px-4 rounded-xl font-semibold text-lg shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        Ignore ({tapCount} taps)
                    </button>
                    <p className="text-xs text-gray-400 mt-2">Ignoring means no progress today!</p>
                </div>

               {/* Regular Actions */}
                <div className={`grid ${alarm.isSnoozeEnabled ? 'grid-cols-3 gap-3' : 'grid-cols-1 gap-1'}`}>
                    {alarm.isSnoozeEnabled && <button
                        onClick={handleSnooze} // Snooze keeps the alarm scheduled later
                        className="bg-gradient-to-r from-amber-700 to-amber-600 text-white py-4 px-2 rounded-xl font-medium shadow-md hover:from-amber-600 hover:to-amber-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                         Snooze
                    </button>}
                    <button
                        onClick={handleWakeUp} disabled={!wakeUpEnabled}
                        className={` ${wakeUpEnabled ? 'bg-gradient-to-r from-green-700 to-green-600' : 'bg-gray-400'} text-white py-4 px-2 rounded-xl font-medium shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
                    >
                        Wake Up!
                    </button>
               </div>
            </div>
          </>
        );

      // -------------------- INITIAL State --------------------
      case 'initial':
      default:
        return (
          <>
            {/* Top Section */}
            <div className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-8">
              <h1 className="text-4xl font-bold text-blue-300 mb-2">Rise and Shine!</h1>
              <p className="text-lg text-gray-300 mb-1">It's <span className="font-semibold">{timeString}</span></p>
              <p className="text-sm text-gray-400 mb-6">{dateString}</p>
              {/* Plant Component */}
              <div className="mb-8">
                <Plant
                  health={authState.user?.plantHealth || 100}
                  level={authState.user?.plantLevel || 1}
                  size={200}
                />
              </div>
            </div>

            {/* Bottom Card - Initial Actions */}
            <div className="relative overflow-hidden rounded-t-2xl border-t border-gray-700 bg-gradient-to-b from-gray-800 to-black p-5 shadow-2xl mt-auto w-full">
              {/* Alarm Info */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg text-gray-200 font-medium">
                  {alarm.label || 'Alarm'} at {alarm.time}
                </div>
                 {/* Optional: Icon or indicator */}
                 <div className="text-blue-400">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                     </svg>
                 </div>
              </div>

               {/* Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-sm">
                <div className="text-gray-400">Current Time</div>
                <div className="text-gray-200 text-right">{timeString}</div>
                <div className="text-gray-400">Target Time</div>
                <div className="text-gray-200 text-right">{alarm.time}</div>
                <div className="text-gray-400">Est. Sleep</div>
                <div className="text-gray-200 text-right">{sleepDuration}</div>
              </div>

              {/* Action Buttons */}
              <div className={`grid ${alarm.isSnoozeEnabled ? 'grid-cols-3 gap-3' : 'grid-cols-2 gap-4'}`}>
                <button
                  onClick={handleIgnoreAlarm} // This will transition to 'snooze' state for tapping
                  className="bg-gradient-to-r from-red-800 to-red-700 text-white py-4 px-2 rounded-xl font-medium shadow-md hover:from-red-700 hover:to-red-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Ignore
                </button>
                 <button
                  onClick={handleWakeUp} // The main success path
                  className="bg-gradient-to-r from-green-700 to-green-600 text-white py-4 px-2 rounded-xl font-semibold text-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 col-span-1" // Make Wake Up slightly more prominent maybe?
                >
                  Wake Up!
                </button>
                {alarm.isSnoozeEnabled && <button
                  onClick={handleSnooze} // Standard snooze
                  className="bg-gradient-to-r from-amber-700 to-amber-600 text-white py-4 px-2 rounded-xl font-medium shadow-md hover:from-amber-600 hover:to-amber-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Snooze
                </button>
                }
              </div>
            </div>
          </>
        );
    }
  };

  return (
    // Full screen overlay matching dashboard background
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-gray-800 to-black text-white overflow-hidden">
       {/* Subtle Glow Effects like dashboard */}
       <div className="absolute -top-20 left-1/4 h-40 w-80 transform rounded-full bg-blue-600 opacity-10 blur-3xl"></div>
       <div className="absolute top-1/2 right-1/4 h-40 w-80 transform rounded-full bg-green-600 opacity-10 blur-3xl"></div>

       {/* Relative container for z-index */}
       <div className="relative z-10 flex flex-col h-full">
           {renderContent()}
        </div>
    </div>
  );
};

export default AlarmDisplay;
