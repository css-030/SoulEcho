import { afterEach, describe, expect, it, vi } from 'vitest'

import { settingRepo } from '@/services/storage/repositories/SettingRepo'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('settings defaults', () => {
  it('uses local environment values as editable defaults', () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', 'env-openai-key')
    vi.stubEnv('VITE_NETEASE_API_URL', 'http://localhost:4000')
    vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'env-weather-key')
    vi.stubEnv('VITE_OPENWEATHER_DEFAULT_CITY', 'Shanghai')
    vi.stubEnv('VITE_YOUTUBE_API_KEY', 'env-youtube-key')

    const defaults = settingRepo.getDefault()

    expect(defaults.openaiApiKey).toBe('env-openai-key')
    expect(defaults.youtubeApiKey).toBe('env-youtube-key')
    expect(defaults.neteaseApiUrl).toBe('http://localhost:4000')
    expect(defaults.openweatherApiKey).toBe('env-weather-key')
    expect(defaults.openweatherDefaultCity).toBe('Shanghai')
    expect(defaults.sourceLock).toBe('auto')
  })
})
