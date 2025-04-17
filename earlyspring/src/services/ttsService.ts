// src/services/ttsService.ts

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const TTS_PROXY_ENDPOINT = `${API_BASE_URL}/tts-proxy`;

// Fallback to browser's built-in TTS if HuggingFace fails
const useBrowserTTS = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if SpeechSynthesis is supported
    if (!('speechSynthesis' in window)) {
      reject(new Error('Browser does not support speech synthesis'));
      return;
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set language to English
    utterance.lang = 'en-US';

    // Optional: adjust voice, rate, pitch
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Set callbacks
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

    // Speak
    window.speechSynthesis.speak(utterance);
  });
};

// Use proxy server to make request to HuggingFace
const useProxyTTS = async (text: string): Promise<ArrayBuffer> => {
  try {
    console.log('Using backend proxy for TTS request');

    const response = await fetch(TTS_PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Proxy server error: ${response.status} ${response.statusText} ${errorData.error || ''}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Proxy TTS error:', error);
    throw error;
  }
};

// Play audio from array buffer
const playAudio = (audioData: ArrayBuffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Decode audio data
      audioContext.decodeAudioData(
        audioData,
        (buffer) => {
          // Create source node
          const source = audioContext.createBufferSource();
          source.buffer = buffer;

          // Connect to output
          source.connect(audioContext.destination);

          // Set callbacks
          source.onended = () => {
            resolve();
            audioContext.close().catch(err => console.warn('Error closing audio context:', err));
          };

          // Start playing
          source.start(0);
        },
        (error) => {
          reject(new Error(`Error decoding audio data: ${error}`));
          audioContext.close().catch(err => console.warn('Error closing audio context:', err));
        }
      );
    } catch (error) {
      reject(new Error(`Error setting up audio playback: ${error}`));
    }
  });
};

// Main TTS function with fallback
export const speakText = async (text: string): Promise<void> => {
  try {
    // Try proxy-based TTS
    const audioData = await useProxyTTS(text);
    await playAudio(audioData);
  } catch (error) {
    console.warn('TTS error, falling back to browser TTS:', error);
    // Fallback to browser TTS
    await useBrowserTTS(text);
  }
};

// Generate weather text from current conditions
export const generateWeatherText = (temp: number, condition: string): string => {
  return `The weather today is ${condition.toLowerCase()} with a temperature of ${Math.round(temp)} degrees Celsius.`;
};

// Prepare and speak alarm notification with weather
export const speakAlarmNotification = async (
  alarmLabel: string | undefined,
  includeWeather: boolean = false,
  weatherText?: string
): Promise<void> => {
  let text = 'Time to wake up!';

  if (alarmLabel) {
    text = `${alarmLabel}. ${text}`;
  }

  if (includeWeather && weatherText) {
    text = `${text} ${weatherText}`;
  }

  console.log('Speaking alarm notification:', text);
  await speakText(text);
};

// Check if browser supports TTS
export const checkTTSSupport = (): boolean => {
  return 'speechSynthesis' in window;
};

// Get available voices (for browser TTS)
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!checkTTSSupport()) {
    return [];
  }

  return window.speechSynthesis.getVoices();
};
