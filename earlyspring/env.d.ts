/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID: string;
    readonly VITE_MONGODB_APP_ID: string;
    readonly VITE_MONGODB_API_KEY: string;
    readonly VITE_WEATHER_API_KEY: string;
    readonly VITE_HUGGINGFACE_API_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
