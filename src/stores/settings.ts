import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { settingRepo } from '@/services/storage/repositories/SettingRepo'
import type { UserSettings } from '@/types/settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>(settingRepo.getDefault())
  const isLoaded = ref(false)

  const momoName = computed(() => settings.value.momoName)

  async function initialize(): Promise<void> {
    settings.value = await settingRepo.load()
    isLoaded.value = true
  }

  async function save(updates: Partial<UserSettings>): Promise<void> {
    settings.value = {
      ...settings.value,
      ...updates
    }

    await settingRepo.save(settings.value)
  }

  return {
    settings,
    isLoaded,
    momoName,
    initialize,
    save
  }
})
