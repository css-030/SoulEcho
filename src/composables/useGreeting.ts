import { onMounted, onUnmounted } from 'vue'

import { useChatStore } from '@/stores/chat'
import { shouldGreetAfterReturn } from '@/utils/appLifecycle'

export function useGreeting() {
  const chatStore = useChatStore()
  let hiddenAt: number | null = null
  let hadPageExit = false
  let isHandlingReturn = false

  async function greetOnAppOpen(): Promise<void> {
    await chatStore.greetIfNeeded()
  }

  function markHidden(): void {
    hiddenAt = Date.now()
  }

  function markPageExit(): void {
    hadPageExit = true
    hiddenAt ??= Date.now()
  }

  async function greetOnAppReturn(): Promise<void> {
    if (document.visibilityState !== 'visible' || isHandlingReturn) {
      return
    }

    const shouldGreet = shouldGreetAfterReturn({
      hiddenAt,
      hadPageExit
    })

    hiddenAt = null
    hadPageExit = false

    if (!shouldGreet) {
      return
    }

    isHandlingReturn = true
    try {
      await chatStore.greetIfNeeded()
    } finally {
      isHandlingReturn = false
    }
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      markHidden()
      return
    }

    void greetOnAppReturn()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', markPageExit)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', markPageExit)
  })

  return {
    greetOnAppOpen
  }
}
