export interface AppEnv {
  openaiApiKey: string
  neteaseApiUrl: string
  openweatherApiKey?: string
  openweatherDefaultCity: string
  youtubeApiKey?: string
  debugMode: boolean
}

export function getAppEnv(): AppEnv {
  return {
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY ?? '',
    neteaseApiUrl: import.meta.env.VITE_NETEASE_API_URL ?? 'http://localhost:3000',
    openweatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY,
    openweatherDefaultCity: import.meta.env.VITE_OPENWEATHER_DEFAULT_CITY ?? 'Guangzhou',
    youtubeApiKey: import.meta.env.VITE_YOUTUBE_API_KEY,
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
  }
}
