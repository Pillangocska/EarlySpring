import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  pictureUrl: string;
  authenticated: boolean;
}

interface Alarm {
  id: number;
  time: string;
  active: boolean;
  label: string;
}

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [alarmTime, setAlarmTime] = useState<string>('08:00');
  const [alarms, setAlarms] = useState<Alarm[]>([
    { id: 1, time: '07:00', active: true, label: 'Wake up' },
    { id: 2, time: '08:30', active: false, label: 'Meeting' }
  ]);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  // Update the clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(timer);
  }, []);

  const handleAddAlarm = (): void => {
    const newAlarm: Alarm = {
      id: Date.now(),
      time: alarmTime,
      active: true,
      label: 'New Alarm'
    };
    setAlarms([...alarms, newAlarm]);
  };

  const toggleAlarm = (id: number): void => {
    setAlarms(alarms.map(alarm =>
      alarm.id === id ? { ...alarm, active: !alarm.active } : alarm
    ));
  };

  const deleteAlarm = (id: number): void => {
    setAlarms(alarms.filter(alarm => alarm.id !== id));
  };

  return (
    <div className="dashboard">
      <div className="user-welcome">
        <h2>Welcome, {user.name}!</h2>
        <img
          src={user.pictureUrl}
          alt="Profile"
          className="profile-image"
        />
      </div>

      <div className="clock-container">
        <div className="current-time">
          {currentTime}
        </div>

        <div className="weather-preview">
          <p>Weather placeholder</p>
        </div>
      </div>

      <div className="add-alarm">
        <h3>Add New Alarm</h3>
        <div className="alarm-form">
          <input
            type="time"
            value={alarmTime}
            onChange={(e) => setAlarmTime(e.target.value)}
          />
          <button onClick={handleAddAlarm}>Add Alarm</button>
        </div>
      </div>

      <div className="alarms-list">
        <h3>Your Alarms</h3>
        {alarms.length === 0 ? (
          <p>No alarms set</p>
        ) : (
          <ul>
            {alarms.map(alarm => (
              <li key={alarm.id} className={`alarm-item ${alarm.active ? 'active' : 'inactive'}`}>
                <div className="alarm-time">{alarm.time}</div>
                <div className="alarm-label">{alarm.label}</div>
                <div className="alarm-controls">
                  <button
                    onClick={() => toggleAlarm(alarm.id)}
                    className={`toggle-button ${alarm.active ? 'on' : 'off'}`}
                  >
                    {alarm.active ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => deleteAlarm(alarm.id)}
                    className="delete-button"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
