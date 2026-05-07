import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { HEALING_ORGAN_BY_WUXING, HEALING_WUXING_BY_ORGAN } from '@/types/healing'
import type { OrganType, WuxingType } from '@/types/wuxing'

export const useHealingStore = defineStore('healing', () => {
  const isActive = ref(false)
  const currentOrgan = ref<OrganType | null>(null)
  const currentWuxing = ref<WuxingType | null>(null)
  const isImmersiveOpen = ref(false)
  const sessionStartTime = ref<number | null>(null)

  const activeOrganClass = computed(() => (currentOrgan.value ? `is-${currentOrgan.value}` : ''))
  const activeWuxingClass = computed(() => (currentWuxing.value ? `is-${currentWuxing.value}` : ''))

  function activate(wuxing: WuxingType): void {
    isActive.value = true
    currentWuxing.value = wuxing
    currentOrgan.value = HEALING_ORGAN_BY_WUXING[wuxing]
    sessionStartTime.value = Date.now()
  }

  function switchOrgan(organ: OrganType): void {
    currentOrgan.value = organ
    currentWuxing.value = HEALING_WUXING_BY_ORGAN[organ]
  }

  function switchWuxing(wuxing: WuxingType): void {
    currentWuxing.value = wuxing
    currentOrgan.value = HEALING_ORGAN_BY_WUXING[wuxing]
  }

  function openImmersive(): void {
    isImmersiveOpen.value = true
  }

  function closeImmersive(): void {
    isImmersiveOpen.value = false
  }

  function complete(): void {
    isActive.value = false
    currentOrgan.value = null
    currentWuxing.value = null
    isImmersiveOpen.value = false
    sessionStartTime.value = null
  }

  return {
    isActive,
    currentOrgan,
    currentWuxing,
    isImmersiveOpen,
    sessionStartTime,
    activeOrganClass,
    activeWuxingClass,
    activate,
    switchOrgan,
    switchWuxing,
    openImmersive,
    closeImmersive,
    complete
  }
})
