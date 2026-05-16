import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { musicRouter } from '@/services/music/MusicRouter'
import { settingRepo } from '@/services/storage/repositories/SettingRepo'
import type { UserSettings } from '@/types/settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>(settingRepo.getDefault())
  const isLoaded = ref(false)

  const momoName = computed(() => settings.value.momoName)
  const hasOpenAiApiKey = computed(() => Boolean(settings.value.openaiApiKey?.trim()))

  async function initialize(): Promise<void> {
    settings.value = await settingRepo.load()
    applyMusicSettings(settings.value)
    isLoaded.value = true
  }

  async function save(updates: Partial<UserSettings>): Promise<void> {
    settings.value = {
      ...settings.value,
      ...updates
    }

    await settingRepo.save(settings.value)
    applyMusicSettings(settings.value)
  }

  async function resetGreetingHistory(): Promise<void> {
    await save({ lastGreetedAt: 0 })
  }

  function applyMusicSettings(nextSettings: UserSettings): void {
    musicRouter.configureYouTube({
      apiKey: nextSettings.youtubeApiKey
    })
    musicRouter.configureNetease({
      baseUrl: nextSettings.neteaseApiUrl,
      cookie: nextSettings.neteaseCookie
    })
    musicRouter.configureMusicTasteProfile(nextSettings.musicTasteProfile)
  }

  return {
    settings,
    isLoaded,
    momoName,
    hasOpenAiApiKey,
    initialize,
    save,
    resetGreetingHistory
  }
})
