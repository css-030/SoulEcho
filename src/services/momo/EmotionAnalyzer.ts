import type { EmotionRecord } from '@/types/emotion'
import type { EmotionLevel } from '@/types/message'
import type { MomoResponse } from '@/types/momo'
import { createId } from '@/utils/id'
import { getDateKey } from '@/utils/time'

function intensityFromLevel(level: EmotionLevel): number {
  if (level === 'strong_negative') {
    return 0.9
  }

  if (level === 'mild_negative') {
    return 0.55
  }

  return 0.25
}

export class EmotionAnalyzer {
  toEmotionRecord(response: MomoResponse, contextMessageIds: string[] = []): EmotionRecord | null {
    const gardenEmotion = response.gardenEmotion ?? response.emotionTag

    if (!gardenEmotion) {
      return null
    }

    const timestamp = Date.now()

    return {
      id: createId('emotion'),
      date: getDateKey(new Date(timestamp)),
      timestamp,
      wuxingTag: gardenEmotion,
      intensity: intensityFromLevel(response.emotionDetected),
      source: 'auto',
      contextMessageIds
    }
  }
}

export const emotionAnalyzer = new EmotionAnalyzer()
