import type { WeatherInfo } from '@/types/momo'
import type { WuxingType } from '@/types/wuxing'

export interface HealingRecommendationContext {
  now?: Date
  weather?: WeatherInfo
}

export interface HealingRecommendation {
  primaryWuxing: WuxingType
  mode: string
  instruments: string[]
  qualities: string[]
}

const BASE_RECOMMENDATION: Record<WuxingType, Omit<HealingRecommendation, 'primaryWuxing'>> = {
  wood: {
    mode: '角调',
    instruments: ['古琴', '流水', '竹笛'],
    qualities: ['疏肝', '舒展']
  },
  fire: {
    mode: '徵调',
    instruments: ['古筝', '扬琴', '风铃'],
    qualities: ['安神', '舒缓']
  },
  earth: {
    mode: '宫调',
    instruments: ['埙', '缶', '低音鼓'],
    qualities: ['稳定', '承托']
  },
  metal: {
    mode: '商调',
    instruments: ['箫', '磬', '编钟'],
    qualities: ['清润', '宁心']
  },
  water: {
    mode: '羽调',
    instruments: ['雨声', '海浪', '低频钟'],
    qualities: ['安神', '助眠']
  }
}

function getTimeQualities(now: Date): string[] {
  const hour = now.getHours()
  if (hour >= 5 && hour < 7) return ['自然', '清润', '唤醒']
  if (hour >= 7 && hour < 11) return ['轻快', '专注']
  if (hour >= 11 && hour < 13) return ['舒缓', '午间']
  if (hour >= 13 && hour < 17) return ['轻音乐', '专注']
  if (hour >= 17 && hour < 19) return ['沉稳']
  if (hour >= 19 && hour < 21) return ['放松', '解压']
  if (hour >= 21 || hour < 5) return ['极轻', '安静', '助眠']
  return []
}

function getWeatherAttributes(weather: WeatherInfo | undefined): Pick<HealingRecommendation, 'instruments' | 'qualities'> {
  const description = weather?.description ?? ''
  const temperature = weather?.temperature
  const instruments: string[] = []
  const qualities: string[] = []

  if (/雨|雷/.test(description)) {
    instruments.push('雨声')
    qualities.push('柔和')
  }
  if (/雪/.test(description)) qualities.push('温暖')
  if (/晴/.test(description)) qualities.push('清透')
  if (/云|阴|雾/.test(description)) qualities.push('柔和')
  if (temperature !== undefined && temperature >= 30) qualities.push('清凉')
  if (temperature !== undefined && temperature <= 12) qualities.push('温暖')

  return { instruments, qualities }
}

export function createHealingRecommendation(
  wuxing: WuxingType,
  context: HealingRecommendationContext = {}
): HealingRecommendation {
  const base = BASE_RECOMMENDATION[wuxing]
  const weather = getWeatherAttributes(context.weather)

  return {
    primaryWuxing: wuxing,
    mode: base.mode,
    instruments: [...new Set([...base.instruments, ...weather.instruments])],
    qualities: [...new Set([...base.qualities, ...getTimeQualities(context.now ?? new Date()), ...weather.qualities])]
  }
}

export function buildHealingSearchQuery(wuxing: WuxingType, context: HealingRecommendationContext = {}): string {
  return buildHealingSearchQueries(wuxing, context)[0]
}

export function buildHealingSearchQueries(wuxing: WuxingType, context: HealingRecommendationContext = {}): string[] {
  const recommendation = createHealingRecommendation(wuxing, context)
  const richQuery = [recommendation.mode, ...recommendation.instruments, ...recommendation.qualities].join(' ')
  const focusedQuery = [recommendation.mode, ...recommendation.instruments.slice(0, 2), ...recommendation.qualities.slice(0, 2)].join(' ')
  const coreQuery = [recommendation.mode, ...recommendation.instruments.slice(0, 2)].join(' ')

  return [...new Set([richQuery, focusedQuery, coreQuery])]
}
