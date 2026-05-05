import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getAppEnv } from '@/services/config/env'
import { MomoService } from '@/services/momo/MomoService'
import { messageRepo } from '@/services/storage/repositories/MessageRepo'
import { profileRepo } from '@/services/storage/repositories/ProfileRepo'
import { useSettingsStore } from '@/stores/settings'
import type { Message } from '@/types/message'
import type { ChatContext, MomoResponse, WeatherInfo } from '@/types/momo'
import type { UserProfile } from '@/types/settings'
import { createId } from '@/utils/id'
import { isSameDay } from '@/utils/time'

function createTextMessage(role: 'user' | 'momo', content: string, meta?: Message['meta']): Message {
  return {
    id: createId(role),
    role,
    type: 'text',
    content,
    timestamp: Date.now(),
    meta
  }
}

const DEFAULT_WEATHER: WeatherInfo = {
  description: '未知',
  casualSummary: '今天的天气我还没拿到，但我们可以先照顾此刻的心情。'
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const isMomoTyping = ref(false)
  const inputText = ref('')
  const hasInitialized = ref(false)
  const hasGreetedToday = ref(false)
  const profile = ref<UserProfile>(profileRepo.getDefault())

  const orderedMessages = computed(() => [...messages.value].sort((a, b) => a.timestamp - b.timestamp))

  async function initialize(): Promise<void> {
    const settingsStore = useSettingsStore()
    if (!settingsStore.isLoaded) {
      await settingsStore.initialize()
    }

    messages.value = await messageRepo.loadRecent(50)
    profile.value = await profileRepo.load()
    hasGreetedToday.value = messages.value.some(
      (message) => message.role === 'momo' && message.meta?.emotionDetected === 'neutral' && isSameDay(message.timestamp, Date.now())
    )
    hasInitialized.value = true
  }

  async function greetIfNeeded(): Promise<void> {
    if (!hasInitialized.value) {
      await initialize()
    }

    if (hasGreetedToday.value) {
      return
    }

    isMomoTyping.value = true
    try {
      const response = await createMomoService().greet(await buildContext())
      await appendMomoResponse(response)
      hasGreetedToday.value = true
    } finally {
      isMomoTyping.value = false
    }
  }

  async function sendMessage(text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed || isMomoTyping.value) {
      return
    }

    const userMessage = createTextMessage('user', trimmed)
    await appendMessage(userMessage)
    inputText.value = ''

    isMomoTyping.value = true
    try {
      const response = await createMomoService().chat(trimmed, await buildContext())
      await appendMomoResponse(response)
    } catch {
      await appendMessage(createTextMessage('momo', '我刚才有点恍神，再说一次好吗？'))
    } finally {
      isMomoTyping.value = false
    }
  }

  async function appendMessage(message: Message): Promise<void> {
    messages.value.push(message)
    await messageRepo.save(message)
  }

  async function clearHistory(): Promise<void> {
    await messageRepo.clear()
    messages.value = []
    hasGreetedToday.value = false
  }

  async function appendMomoResponse(response: MomoResponse): Promise<void> {
    await appendMessage(
      createTextMessage('momo', response.say, {
        emotionDetected: response.emotionDetected,
        emotionTag: response.emotionTag
      })
    )
  }

  async function buildContext(): Promise<ChatContext> {
    const settingsStore = useSettingsStore()

    return {
      settings: settingsStore.settings,
      profile: profile.value,
      weather: DEFAULT_WEATHER,
      longTermMemory: profile.value.longTermMemory,
      recentEmotions: [],
      recentMessages: orderedMessages.value.slice(-12),
      currentMusicSource: null,
      alreadyRecommendedToday: hasGreetedToday.value
    }
  }

  function createMomoService(): MomoService {
    const env = getAppEnv()
    return new MomoService(env.openaiApiKey)
  }

  return {
    messages,
    orderedMessages,
    isMomoTyping,
    inputText,
    hasInitialized,
    hasGreetedToday,
    initialize,
    greetIfNeeded,
    sendMessage,
    appendMessage,
    clearHistory
  }
})
