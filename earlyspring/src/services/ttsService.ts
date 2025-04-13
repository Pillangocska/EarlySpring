// src/services/ttsService.ts

// API key for the HuggingFace API
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
const HUGGINGFACE_MODEL = 'facebook/mms-tts-eng';
const HUGGINGFACE_API_URL = `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`;

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

// Use HuggingFace TTS API
const useHuggingFaceTTS = async (text: string): Promise<ArrayBuffer> => {
  try {
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('HuggingFace TTS error:', error);
    throw error;
  }
};

// Play audio from array buffer
const playAudio = (audioData: ArrayBuffer): Promise<void> => {
  return new Promise((resolve, reject) => {
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
          audioContext.close();
        };

        // Start playing
        source.start(0);
      },
      (error) => {
        reject(new Error(`Error decoding audio data: ${error}`));
        audioContext.close();
      }
    );
  });
};

// Main TTS function with fallback
export const speakText = async (text: string): Promise<void> => {
  try {
    if (!HUGGINGFACE_API_KEY) {
      // If no API key, use browser TTS
      await useBrowserTTS(text);
      return;
    }

    // Try HuggingFace TTS
    const audioData = await useHuggingFaceTTS(text);
    await playAudio(audioData);
  } catch (error) {
    console.error('TTS error, falling back to browser TTS:', error);
    // Fallback to browser TTS
    await useBrowserTTS(text);
  }
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
