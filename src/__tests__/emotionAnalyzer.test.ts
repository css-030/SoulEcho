import { describe, expect, it, vi } from 'vitest'

import { emotionAnalyzer } from '@/services/momo/EmotionAnalyzer'
import type { MomoResponse } from '@/types/momo'

describe('EmotionAnalyzer', () => {
  it('creates an auto emotion record when momo detects a wuxing tag', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-06T10:20:00+08:00'))

    const response: MomoResponse = {
      say: 'I hear you.',
      emotionDetected: 'strong_negative',
      emotionTag: 'fire',
      shouldRecommendMusic: true,
      shouldOfferHealing: true
    }

    const record = emotionAnalyzer.toEmotionRecord(response, ['user_1', 'momo_1'])

    expect(record).toMatchObject({
      date: '2026-05-06',
      wuxingTag: 'fire',
      intensity: 0.9,
      source: 'auto',
      contextMessageIds: ['user_1', 'momo_1']
    })

    vi.useRealTimers()
  })

  it('returns null for neutral responses without a wuxing tag', () => {
    const response: MomoResponse = {
      say: 'Nice to see you.',
      emotionDetected: 'neutral',
      shouldRecommendMusic: false,
      shouldOfferHealing: false
    }

    expect(emotionAnalyzer.toEmotionRecord(response)).toBeNull()
  })

  it('records balanced and joyful garden emotions even when wuxing emotion tag is null', () => {
    const balanced: MomoResponse = {
      say: '听起来今天挺平稳的。',
      emotionDetected: 'neutral',
      gardenEmotion: 'balanced',
      shouldRecommendMusic: false,
      shouldOfferHealing: false
    }

    const joyful: MomoResponse = {
      say: '这份开心很舒服。',
      emotionDetected: 'neutral',
      gardenEmotion: 'joyful',
      shouldRecommendMusic: false,
      shouldOfferHealing: false
    }

    expect(emotionAnalyzer.toEmotionRecord(balanced)?.wuxingTag).toBe('balanced')
    expect(emotionAnalyzer.toEmotionRecord(joyful)?.wuxingTag).toBe('joyful')
  })
})
