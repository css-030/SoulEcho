import type { MusicRecommendation } from './music'
import type { WeatherInfo } from './momo'
import type { OrganType, WuxingType } from './wuxing'

export type MessageRole = 'user' | 'momo' | 'system'

export type MessageType = 'text' | 'music_card' | 'healing_invite' | 'system_notice'

export type EmotionLevel = 'neutral' | 'mild_negative' | 'strong_negative'

export interface Message {
  id: string
  role: MessageRole
  type: MessageType
  content: string
  timestamp: number
  musicRecommendation?: MusicRecommendation
  healingTrigger?: {
    targetOrgan: OrganType
    targetWuxing: WuxingType
    testContext?: {
      now: number
      weather: WeatherInfo
    }
  }
  meta?: {
    emotionDetected?: EmotionLevel
    emotionTag?: WuxingType
  }
}
