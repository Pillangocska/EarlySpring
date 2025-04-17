// src/services/ttsService.ts

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const TTS_PROXY_ENDPOINT = `${API_BASE_URL}/tts-proxy`;

// TTS mode control - set to true to use browser TTS, false to try API first
// TODO dont forget this!
let USE_BROWSER_TTS = true;

// Browser voice settings
const BROWSER_VOICE_SETTINGS = {
  preferFemale: true, // Try to use a female voice if available
  language: 'en-US',  // Voice language
  rate: 1.0,          // Speed (1.0 is normal)
  pitch: 1.1,         // Pitch (1.0 is normal, higher for female voices)
};

// Use browser's built-in TTS
const useBrowserTTS = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if SpeechSynthesis is supported
    if (!('speechSynthesis' in window)) {
      reject(new Error('Browser does not support speech synthesis'));
      return;
    }

    console.log('Using browser TTS');

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set language to English
    utterance.lang = BROWSER_VOICE_SETTINGS.language;

    // Try to use a female voice if preferred
    if (BROWSER_VOICE_SETTINGS.preferFemale) {
      try {
        const voices = window.speechSynthesis.getVoices();

        // Look for a suitable voice
        let selectedVoice = null;

        // First try to find a female voice
        if (BROWSER_VOICE_SETTINGS.preferFemale) {
          selectedVoice = voices.find(
            voice => voice.lang.includes(BROWSER_VOICE_SETTINGS.language.split('-')[0]) &&
                    (voice.name.includes('Female') || voice.name.includes('female'))
          );
        }

        // If no female voice found, try to find any voice in the right language
        if (!selectedVoice) {
          selectedVoice = voices.find(
            voice => voice.lang.includes(BROWSER_VOICE_SETTINGS.language.split('-')[0])
          );
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log(`Selected voice: ${selectedVoice.name}`);
        } else {
          console.log('No specific voice found, using default');
        }
      } catch (e) {
        console.warn('Error setting voice:', e);
      }
    }

    // Apply rate and pitch settings
    utterance.rate = BROWSER_VOICE_SETTINGS.rate;
    utterance.pitch = BROWSER_VOICE_SETTINGS.pitch;

    // Set callbacks
    utterance.onend = () => {
      console.log('Browser TTS finished speaking');
      resolve();
    };
    utterance.onerror = (event) => {
      console.error('Browser TTS error:', event);
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    // Speak
    console.log('Starting browser TTS...');
    window.speechSynthesis.speak(utterance);
  });
};

// Use proxy server to make request to TTS API
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

// Set TTS mode
export const setTTSMode = (useBrowser: boolean): void => {
  USE_BROWSER_TTS = useBrowser;
  console.log(`TTS mode set to: ${useBrowser ? 'Browser' : 'API'}`);
};

// Get current TTS mode
export const getTTSMode = (): boolean => {
  return USE_BROWSER_TTS;
};

// Configure browser voice settings
export const configureBrowserVoice = (settings: Partial<typeof BROWSER_VOICE_SETTINGS>): void => {
  Object.assign(BROWSER_VOICE_SETTINGS, settings);
  console.log('Browser voice settings updated:', BROWSER_VOICE_SETTINGS);
};

// Main TTS function with mode selection
export const speakText = async (text: string): Promise<void> => {
  try {
    console.log('TTS request for text:', text);

    // Check if we should use browser TTS directly
    if (USE_BROWSER_TTS) {
      await useBrowserTTS(text);
      return;
    }

    // Otherwise try API first, then fallback to browser
    try {
      const audioData = await useProxyTTS(text);
      await playAudio(audioData);
    } catch (error) {
      console.warn('TTS API error, falling back to browser TTS:', error);
      await useBrowserTTS(text);
    }
  } catch (error) {
    console.error('TTS error:', error);
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
