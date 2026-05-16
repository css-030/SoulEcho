/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_NETEASE_API_URL: string
  readonly VITE_OPENWEATHER_API_KEY?: string
  readonly VITE_OPENWEATHER_DEFAULT_CITY?: string
  readonly VITE_YOUTUBE_API_KEY?: string
  readonly VITE_DEBUG_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
