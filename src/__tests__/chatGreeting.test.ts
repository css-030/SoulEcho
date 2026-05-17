import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'

vi.mock('@/services/storage/repositories/MessageRepo', () => ({
  messageRepo: {
    loadRecent: vi.fn(async () => []),
    save: vi.fn(async () => undefined),
    clear: vi.fn(async () => undefined)
  }
}))

vi.mock('@/services/storage/repositories/ProfileRepo', () => ({
  profileRepo: {
    getDefault: vi.fn(() => ({
      musicPreferences: '',
      likedTrackIds: [],
      longTermMemory: '',
      longTermMemoryUpdatedAt: Date.now()
    })),
    load: vi.fn(async () => ({
      musicPreferences: '',
      likedTrackIds: [],
      longTermMemory: '',
      longTermMemoryUpdatedAt: Date.now()
    })),
    save: vi.fn(async () => undefined)
  }
}))

vi.mock('@/services/storage/repositories/EmotionRepo', () => ({
  emotionRepo: {
    loadRecent: vi.fn(async () => []),
    save: vi.fn(async () => undefined)
  }
}))

vi.mock('@/services/storage/repositories/SettingRepo', () => ({
  settingRepo: {
    getDefault: vi.fn(() => ({
      userNickname: '宝贝',
      momoName: 'momo',
      momoStyle: 'gentle_sister',
      momoLength: 'medium',
      recommendFrequency: 'every_open',
      sourceLock: 'auto',
      neteaseApiUrl: '',
      openweatherDefaultCity: '',
      lastGreetedAt: 0
    })),
    load: vi.fn(async () => ({
      userNickname: '宝贝',
      momoName: 'momo',
      momoStyle: 'gentle_sister',
      momoLength: 'medium',
      recommendFrequency: 'every_open',
      sourceLock: 'auto',
      neteaseApiUrl: '',
      openweatherDefaultCity: '',
      lastGreetedAt: 0
    })),
    save: vi.fn(async () => undefined)
  }
}))

vi.mock('@/services/weather/OpenWeatherService', () => ({
  openWeatherService: {
    getCurrentWeather: vi.fn(async () => null)
  },
  WEATHER_UNAVAILABLE: {
    description: '',
    temperature: null,
    casualSummary: ''
  }
}))

vi.mock('@/services/momo/MomoService', () => ({
  MomoService: class {
    async greet() {
      return {
        say: '欢迎回来',
        emotionDetected: 'neutral',
        emotionTag: undefined,
        shouldRecommendMusic: false,
        shouldOfferHealing: false
      }
    }
  }
}))

describe('chat greetings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a fresh greeting every time when frequency is every_open', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.settings.recommendFrequency = 'every_open'
    settingsStore.isLoaded = true

    const chatStore = useChatStore()
    await chatStore.initialize()

    await chatStore.greetIfNeeded()
    await chatStore.greetIfNeeded()

    expect(chatStore.messages).toHaveLength(2)
    expect(chatStore.messages.map((message) => message.content)).toEqual(['欢迎回来', '欢迎回来'])
  })

  it('starts a fresh greeting after restarting the conversation', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.settings.recommendFrequency = 'every_open'
    settingsStore.isLoaded = true

    const chatStore = useChatStore()
    await chatStore.initialize()
    await chatStore.greetIfNeeded()

    await chatStore.restartConversation()
    await vi.waitFor(() => {
      expect(chatStore.messages).toHaveLength(1)
    })

    expect(chatStore.messages[0]?.content).toBe('欢迎回来')
  })
})
