import type { EmotionRecord, GardenEmotionTag } from './emotion'
import type { EmotionLevel, Message } from './message'
import type { MusicRecommendation, MusicSource } from './music'
import type { UserProfile, UserSettings } from './settings'
import type { WuxingType } from './wuxing'

export interface WeatherInfo {
  description: string
  temperature?: number
  feelsLike?: number
  casualSummary: string
}

export interface ChatContext {
  settings: UserSettings
  profile: UserProfile
  weather: WeatherInfo
  longTermMemory: string
  recentEmotions: EmotionRecord[]
  recentMessages: Message[]
  currentMusicSource: MusicSource | null
  isHealingMode: boolean
  healingConversationActive: boolean
  healingMusicDeclinedAt: number | null
  alreadyRecommendedToday: boolean
}

export interface MomoRawMusicRecommendation {
  scenario: 'daily-bgm' | 'healing' | 'user-requested'
  source: MusicSource
  search_query: string
  wuxing: WuxingType | null
  reason: string
}

export interface MomoRawResponse {
  say: string
  emotion_level: EmotionLevel
  emotion_tag: WuxingType | null
  garden_emotion: GardenEmotionTag | null
  should_recommend_music: boolean
  should_offer_healing: boolean
  music_recommendation: MomoRawMusicRecommendation | null
}

export interface MomoResponse {
  say: string
  emotionDetected: EmotionLevel
  emotionTag?: WuxingType
  gardenEmotion?: GardenEmotionTag
  shouldRecommendMusic: boolean
  shouldOfferHealing: boolean
  musicRecommendation?: MusicRecommendation
}
