import type { MomoRawResponse, MomoResponse } from '@/types/momo'

export function normalizeMomoResponse(raw: MomoRawResponse): MomoResponse {
  return {
    say: raw.say,
    emotionDetected: raw.emotion_level,
    emotionTag: raw.emotion_tag ?? undefined,
    shouldRecommendMusic: raw.should_recommend_music,
    shouldOfferHealing: raw.should_offer_healing,
    musicRecommendation: raw.music_recommendation
      ? {
          scenario: raw.music_recommendation.scenario,
          source: raw.music_recommendation.source,
          searchQuery: raw.music_recommendation.search_query,
          reason: raw.music_recommendation.reason,
          targetWuxing: raw.music_recommendation.wuxing ?? undefined
        }
      : undefined
  }
}
