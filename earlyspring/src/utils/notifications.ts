// src/utils/notifications.ts

// Request notification permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  // Check if notifications are permitted
  export const areNotificationsPermitted = (): boolean => {
    return (
      'Notification' in window &&
      Notification.permission === 'granted'
    );
  };

  // Register service worker for background notifications
  export const registerServiceWorker = async (): Promise<boolean> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service worker registered:', registration);
        return true;
      } catch (error) {
        console.error('Service worker registration failed:', error);
        return false;
      }
    }

    return false;
  };

  // Check if the device supports all required APIs
  export const checkDeviceSupport = (): {
    notifications: boolean;
    audio: boolean;
    serviceWorker: boolean;
    vibration: boolean;
  } => {
    return {
      notifications: 'Notification' in window,
      audio: 'AudioContext' in window || 'webkitAudioContext' in window,
      serviceWorker: 'serviceWorker' in navigator,
      vibration: 'vibrate' in navigator
    };
  };

  // Show a temporary toast notification in the app
  export const showToast = (
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration: number = 3000
  ): void => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Apply styles
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.backgroundColor = (() => {
      switch (type) {
        case 'success': return '#4CAF50';
        case 'warning': return '#FF9800';
        case 'error': return '#F44336';
        default: return '#2196F3';
      }
    })();
    toast.style.color = 'white';
    toast.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    toast.style.zIndex = '1000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';

    // Add to document
    document.body.appendChild(toast);

    // Show with animation
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);

    // Hide and remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration);
  };

  // Show a request to allow notifications if not already allowed
  export const promptNotificationPermission = async (): Promise<void> => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      const result = confirm(
        'EarlySpring needs permission to send notifications for alarms. Would you like to enable notifications?'
      );

      if (result) {
        await requestNotificationPermission();
      }
    }
  };
