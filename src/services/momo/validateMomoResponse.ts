import type { EmotionLevel } from '@/types/message'
import type { MusicSource } from '@/types/music'
import type { MomoRawMusicRecommendation, MomoRawResponse } from '@/types/momo'
import type { WuxingType } from '@/types/wuxing'

const DEFAULT_SAY = '我刚刚有点走神了，可以再跟我说一遍吗？'
const EMOTION_LEVELS: EmotionLevel[] = ['neutral', 'mild_negative', 'strong_negative']
const WUXING_TYPES: WuxingType[] = ['wood', 'fire', 'earth', 'metal', 'water']
const MUSIC_SOURCES: MusicSource[] = ['youtube', 'netease', 'fallback']
const SCENARIOS: MomoRawMusicRecommendation['scenario'][] = ['daily-bgm', 'healing', 'user-requested']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validateEmotionLevel(value: unknown): EmotionLevel {
  return typeof value === 'string' && EMOTION_LEVELS.includes(value as EmotionLevel) ? (value as EmotionLevel) : 'neutral'
}

function validateWuxing(value: unknown): WuxingType | null {
  return typeof value === 'string' && WUXING_TYPES.includes(value as WuxingType) ? (value as WuxingType) : null
}

function validateMusicRecommendation(value: unknown): MomoRawMusicRecommendation | null {
  if (!isRecord(value)) {
    return null
  }

  const scenario = value.scenario
  const source = value.source
  const searchQuery = value.search_query ?? value.query
  const reason = value.reason

  if (
    typeof scenario !== 'string' ||
    !SCENARIOS.includes(scenario as MomoRawMusicRecommendation['scenario']) ||
    typeof source !== 'string' ||
    !MUSIC_SOURCES.includes(source as MusicSource) ||
    typeof searchQuery !== 'string' ||
    typeof reason !== 'string'
  ) {
    return null
  }

  return {
    scenario: scenario as MomoRawMusicRecommendation['scenario'],
    source: source as MusicSource,
    search_query: searchQuery,
    wuxing: validateWuxing(value.wuxing),
    reason
  }
}

export function validateMomoResponse(raw: unknown): MomoRawResponse {
  if (!isRecord(raw)) {
    return fallbackMomoResponse
  }

  const shouldRecommendMusic = typeof raw.should_recommend_music === 'boolean' ? raw.should_recommend_music : false

  return {
    say: typeof raw.say === 'string' && raw.say.trim().length > 0 ? raw.say : DEFAULT_SAY,
    emotion_level: validateEmotionLevel(raw.emotion_level),
    emotion_tag: validateWuxing(raw.emotion_tag),
    should_recommend_music: shouldRecommendMusic,
    should_offer_healing: typeof raw.should_offer_healing === 'boolean' ? raw.should_offer_healing : false,
    music_recommendation: shouldRecommendMusic ? validateMusicRecommendation(raw.music_recommendation) : null
  }
}

export const fallbackMomoResponse: MomoRawResponse = {
  say: DEFAULT_SAY,
  emotion_level: 'neutral',
  emotion_tag: null,
  should_recommend_music: false,
  should_offer_healing: false,
  music_recommendation: null
}
