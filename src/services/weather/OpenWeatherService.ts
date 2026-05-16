import type { WeatherInfo } from '@/types/momo'

const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const CACHE_TTL_MS = 10 * 60 * 1000

const CHINESE_CITY_ALIASES: Record<string, string> = {
  北京: 'Beijing',
  上海: 'Shanghai',
  广州: 'Guangzhou',
  深圳: 'Shenzhen',
  天津: 'Tianjin',
  重庆: 'Chongqing',
  杭州: 'Hangzhou',
  南京: 'Nanjing',
  苏州: 'Suzhou',
  成都: 'Chengdu',
  武汉: 'Wuhan',
  西安: 'Xian',
  郑州: 'Zhengzhou',
  长沙: 'Changsha',
  青岛: 'Qingdao',
  厦门: 'Xiamen',
  福州: 'Fuzhou',
  济南: 'Jinan',
  合肥: 'Hefei',
  宁波: 'Ningbo',
  无锡: 'Wuxi',
  佛山: 'Foshan',
  东莞: 'Dongguan',
  珠海: 'Zhuhai',
  惠州: 'Huizhou',
  中山: 'Zhongshan',
  南宁: 'Nanning',
  海口: 'Haikou',
  三亚: 'Sanya',
  昆明: 'Kunming',
  贵阳: 'Guiyang',
  南昌: 'Nanchang',
  太原: 'Taiyuan',
  石家庄: 'Shijiazhuang',
  呼和浩特: 'Hohhot',
  沈阳: 'Shenyang',
  大连: 'Dalian',
  长春: 'Changchun',
  哈尔滨: 'Harbin',
  兰州: 'Lanzhou',
  西宁: 'Xining',
  银川: 'Yinchuan',
  乌鲁木齐: 'Urumqi',
  拉萨: 'Lhasa',
  香港: 'Hong Kong',
  澳门: 'Macao',
  台北: 'Taipei'
}

export const WEATHER_UNAVAILABLE: WeatherInfo = {
  description: '未知',
  casualSummary: '今天的天气我还没拿到，但我们可以先照顾此刻的心情。'
}

interface OpenWeatherOptions {
  apiKey?: string
  city?: string
}

interface OpenWeatherResponse {
  name?: string
  weather?: Array<{
    description?: string
  }>
  main?: {
    temp?: number
    feels_like?: number
    humidity?: number
  }
}

interface CachedWeather {
  expiresAt: number
  value: WeatherInfo
}

export class OpenWeatherService {
  private readonly cache = new Map<string, CachedWeather>()

  async getCurrentWeather(options: OpenWeatherOptions): Promise<WeatherInfo> {
    const apiKey = options.apiKey?.trim()
    const city = normalizeOpenWeatherCity(options.city)

    if (!apiKey || !city) {
      return WEATHER_UNAVAILABLE
    }

    const cacheKey = `${city.toLowerCase()}::${apiKey.slice(-8)}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value
    }

    const url = new URL(OPENWEATHER_URL)
    url.searchParams.set('q', city)
    url.searchParams.set('appid', apiKey)
    url.searchParams.set('units', 'metric')
    url.searchParams.set('lang', 'zh_cn')

    try {
      const response = await fetch(url)
      if (!response.ok) {
        return WEATHER_UNAVAILABLE
      }

      const data = (await response.json()) as OpenWeatherResponse
      const weather = this.normalizeWeather(data, city)
      this.cache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        value: weather
      })
      return weather
    } catch {
      return WEATHER_UNAVAILABLE
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  private normalizeWeather(data: OpenWeatherResponse, fallbackCity: string): WeatherInfo {
    const city = data.name?.trim() || fallbackCity
    const description = data.weather?.[0]?.description?.trim() || '天气未知'
    const temperature = roundMaybe(data.main?.temp)
    const feelsLike = roundMaybe(data.main?.feels_like)
    const humidity = roundMaybe(data.main?.humidity)

    const details = [`${city}现在${description}`]
    if (temperature !== undefined) {
      details.push(`约 ${temperature}°C`)
    }
    if (feelsLike !== undefined) {
      details.push(`体感 ${feelsLike}°C`)
    }
    if (humidity !== undefined) {
      details.push(`湿度 ${humidity}%`)
    }

    return {
      description,
      temperature,
      feelsLike,
      casualSummary: `${details.join('，')}。`
    }
  }
}

function roundMaybe(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : undefined
}

export function normalizeOpenWeatherCity(city: string | undefined): string {
  const trimmed = city?.trim() ?? ''
  return CHINESE_CITY_ALIASES[trimmed] ?? trimmed
}

export const openWeatherService = new OpenWeatherService()
