import { describe, expect, it } from 'vitest'

import { PromptBuilder } from '@/services/momo/PromptBuilder'
import type { ChatContext } from '@/types/momo'

function createContext(overrides: Partial<ChatContext> = {}): ChatContext {
  return {
    settings: {
      userNickname: '宝贝',
      momoName: 'momo',
      momoStyle: 'gentle_sister',
      momoLength: 'medium',
      recommendFrequency: 'every_open',
      sourceLock: 'auto',
      openaiApiKey: 'openai-key',
      youtubeApiKey: 'youtube-key',
      neteaseApiUrl: 'http://localhost:3000',
      openweatherApiKey: 'weather-key',
      openweatherDefaultCity: 'Guangzhou',
      lastGreetedAt: 0
    },
    profile: {
      musicPreferences: '',
      likedTrackIds: [],
      longTermMemory: '',
      longTermMemoryUpdatedAt: 0
    },
    weather: {
      description: '阴，多云',
      temperature: 31,
      feelsLike: 34,
      casualSummary: 'Guangzhou现在阴，多云，约 31°C，体感 34°C，湿度 60%。'
    },
    longTermMemory: '',
    recentEmotions: [],
    recentMessages: [],
    currentMusicSource: null,
    isHealingMode: false,
    healingConversationActive: false,
    healingMusicDeclinedAt: null,
    alreadyRecommendedToday: false,
    ...overrides
  }
}

describe('PromptBuilder', () => {
  it('tells momo to answer weather questions with the provided weather context', () => {
    const prompt = new PromptBuilder().buildChatSystemPrompt(createContext())

    expect(prompt).toContain('Guangzhou现在阴，多云，约 31°C，体感 34°C，湿度 60%。')
    expect(prompt).toContain('如果用户问天气，直接基于这里回答')
    expect(prompt).toContain('不要泛泛说无法得知')
  })

  it('keeps greeting weather mentions casual instead of report-like', () => {
    const prompt = new PromptBuilder().buildGreetingSystemPrompt(createContext())

    expect(prompt).toContain('像朋友寒暄一样轻轻带到时间和天气')
    expect(prompt).toContain('不要像天气预报一样完整列出城市、温度、体感、湿度')
    expect(prompt).toContain('不要使用“无论天气如何”')
  })

  it('tells momo not to send users away to search for music themselves', () => {
    const prompt = new PromptBuilder().buildChatSystemPrompt(createContext())

    expect(prompt).toContain('SoulEcho 会自动生成音乐卡片并尝试播放')
    expect(prompt).toContain('不要让用户自己去 YouTube、网易云或任何平台搜索')
    expect(prompt).toContain('不要说“我不能直接播放音乐”')
  })

  it('includes message timestamps in recent conversation context', () => {
    const prompt = new PromptBuilder().buildChatSystemPrompt(
      createContext({
        recentMessages: [
          {
            id: 'message-1',
            role: 'user',
            type: 'text',
            content: '昨天晚上有点累',
            timestamp: new Date('2026-05-14T22:08:00+08:00').getTime()
          }
        ]
      })
    )

    expect(prompt).toContain('2026/5/14 22:08:00')
    expect(prompt).toContain('昨天晚上有点累')
  })
})
