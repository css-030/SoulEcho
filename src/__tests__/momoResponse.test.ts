import { describe, expect, it } from 'vitest'

import { normalizeMomoResponse } from '@/services/momo/normalizeMomoResponse'
import { validateMomoResponse } from '@/services/momo/validateMomoResponse'

describe('momo response validation and normalization', () => {
  it('converts valid OpenAI snake_case JSON into camelCase response', () => {
    const raw = validateMomoResponse({
      say: '我在这里。',
      emotion_level: 'mild_negative',
      emotion_tag: 'fire',
      garden_emotion: 'fire',
      should_recommend_music: true,
      should_offer_healing: false,
      music_recommendation: {
        scenario: 'daily-bgm',
        source: 'youtube',
        search_query: 'soft piano',
        wuxing: 'fire',
        reason: '让心慢慢安静下来。'
      }
    })

    const normalized = normalizeMomoResponse(raw)

    expect(normalized).toMatchObject({
      say: '我在这里。',
      emotionDetected: 'mild_negative',
      emotionTag: 'fire',
      gardenEmotion: 'fire',
      shouldRecommendMusic: true,
      shouldOfferHealing: false,
      musicRecommendation: {
        scenario: 'daily-bgm',
        source: 'youtube',
        searchQuery: 'soft piano',
        targetWuxing: 'fire'
      }
    })
  })

  it('normalizes balanced and joyful garden emotions from natural chat inference', () => {
    const balanced = normalizeMomoResponse(
      validateMomoResponse({
        say: '听起来今天过得挺稳的。',
        emotion_level: 'neutral',
        emotion_tag: null,
        garden_emotion: 'balanced',
        should_recommend_music: false,
        should_offer_healing: false,
        music_recommendation: null
      })
    )

    const joyful = normalizeMomoResponse(
      validateMomoResponse({
        say: '这份开心很轻盈。',
        emotion_level: 'neutral',
        emotion_tag: null,
        garden_emotion: 'joyful',
        should_recommend_music: false,
        should_offer_healing: false,
        music_recommendation: null
      })
    )

    expect(balanced.gardenEmotion).toBe('balanced')
    expect(joyful.gardenEmotion).toBe('joyful')
    expect(balanced.emotionTag).toBeUndefined()
  })

  it('falls invalid emotion_level back to neutral', () => {
    const raw = validateMomoResponse({
      say: '嗯。',
      emotion_level: 'stormy',
      emotion_tag: null,
      should_recommend_music: false,
      should_offer_healing: false,
      music_recommendation: null
    })

    expect(raw.emotion_level).toBe('neutral')
  })

  it('turns invalid emotion_tag into undefined after normalization', () => {
    const raw = validateMomoResponse({
      say: '嗯。',
      emotion_level: 'neutral',
      emotion_tag: 'cloud',
      should_recommend_music: false,
      should_offer_healing: false,
      music_recommendation: null
    })

    expect(normalizeMomoResponse(raw).emotionTag).toBeUndefined()
  })

  it('falls non-boolean recommendation flags back to false', () => {
    const raw = validateMomoResponse({
      say: '嗯。',
      emotion_level: 'neutral',
      emotion_tag: null,
      should_recommend_music: 'yes',
      should_offer_healing: 'no',
      music_recommendation: null
    })

    expect(raw.should_recommend_music).toBe(false)
    expect(raw.should_offer_healing).toBe(false)
  })

  it('handles missing fields without crashing', () => {
    const normalized = normalizeMomoResponse(validateMomoResponse({}))

    expect(normalized.say).toBeTruthy()
    expect(normalized.emotionDetected).toBe('neutral')
    expect(normalized.shouldRecommendMusic).toBe(false)
    expect(normalized.shouldOfferHealing).toBe(false)
  })

  it('accepts query as a fallback for search_query', () => {
    const normalized = normalizeMomoResponse(
      validateMomoResponse({
        say: 'Try this.',
        emotion_level: 'mild_negative',
        emotion_tag: 'wood',
        should_recommend_music: true,
        should_offer_healing: false,
        music_recommendation: {
          scenario: 'daily-bgm',
          source: 'youtube',
          query: 'guqin flowing water',
          wuxing: 'wood',
          reason: 'A calmer sound for this moment.'
        }
      })
    )

    expect(normalized.musicRecommendation?.searchQuery).toBe('guqin flowing water')
  })
})
