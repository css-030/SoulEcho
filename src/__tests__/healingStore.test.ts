import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useHealingStore } from '@/stores/healing'

describe('healing store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('activates the organ that matches the target wuxing', () => {
    const healingStore = useHealingStore()

    healingStore.activate('metal')

    expect(healingStore.isActive).toBe(true)
    expect(healingStore.currentWuxing).toBe('metal')
    expect(healingStore.currentOrgan).toBe('lung')
  })

  it('keeps wuxing and organ in sync when switching during a session', () => {
    const healingStore = useHealingStore()

    healingStore.activate('wood')
    healingStore.switchOrgan('kidney')

    expect(healingStore.currentOrgan).toBe('kidney')
    expect(healingStore.currentWuxing).toBe('water')

    healingStore.switchWuxing('earth')

    expect(healingStore.currentOrgan).toBe('spleen')
    expect(healingStore.currentWuxing).toBe('earth')
  })

  it('clears the immersive state when the session completes', () => {
    const healingStore = useHealingStore()

    healingStore.activate('fire')
    healingStore.openImmersive()
    healingStore.complete()

    expect(healingStore.isActive).toBe(false)
    expect(healingStore.currentOrgan).toBeNull()
    expect(healingStore.currentWuxing).toBeNull()
    expect(healingStore.isImmersiveOpen).toBe(false)
  })
})
