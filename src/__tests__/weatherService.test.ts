import { afterEach, describe, expect, it, vi } from 'vitest'

import { normalizeOpenWeatherCity, OpenWeatherService, WEATHER_UNAVAILABLE } from '@/services/weather/OpenWeatherService'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OpenWeatherService', () => {
  it('normalizes common Chinese city names for OpenWeather query', () => {
    expect(normalizeOpenWeatherCity('广州')).toBe('Guangzhou')
    expect(normalizeOpenWeatherCity(' 上海 ')).toBe('Shanghai')
    expect(normalizeOpenWeatherCity('Guangzhou')).toBe('Guangzhou')
  })

  it('returns unavailable weather when key or city is missing', async () => {
    const service = new OpenWeatherService()

    await expect(service.getCurrentWeather({ apiKey: '', city: 'Guangzhou' })).resolves.toEqual(WEATHER_UNAVAILABLE)
    await expect(service.getCurrentWeather({ apiKey: 'weather-key', city: '' })).resolves.toEqual(WEATHER_UNAVAILABLE)
  })

  it('fetches and normalizes current weather', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        name: 'Guangzhou',
        weather: [{ description: '多云' }],
        main: {
          temp: 24.4,
          feels_like: 25.2,
          humidity: 81
        }
      })
    } as Response)

    const service = new OpenWeatherService()
    const weather = await service.getCurrentWeather({ apiKey: 'weather-key', city: 'Guangzhou' })
    const url = new URL(String(fetchMock.mock.calls[0][0]))

    expect(url.hostname).toBe('api.openweathermap.org')
    expect(url.searchParams.get('q')).toBe('Guangzhou')
    expect(url.searchParams.get('units')).toBe('metric')
    expect(url.searchParams.get('lang')).toBe('zh_cn')
    expect(weather).toEqual({
      description: '多云',
      temperature: 24,
      feelsLike: 25,
      casualSummary: 'Guangzhou现在多云，约 24°C，体感 25°C，湿度 81%。'
    })
  })

  it('uses a short cache for the same city and key', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        name: 'Shanghai',
        weather: [{ description: '晴' }],
        main: { temp: 18 }
      })
    } as Response)

    const service = new OpenWeatherService()
    await service.getCurrentWeather({ apiKey: 'weather-key', city: 'Shanghai' })
    await service.getCurrentWeather({ apiKey: 'weather-key', city: 'Shanghai' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falls back quietly when the API rejects the request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({})
    } as Response)

    const service = new OpenWeatherService()

    await expect(service.getCurrentWeather({ apiKey: 'bad-key', city: 'Guangzhou' })).resolves.toEqual(WEATHER_UNAVAILABLE)
  })
})
